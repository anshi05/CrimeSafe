import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface LocationForecastRequest {
  type: "location_forecast"
  location_id: string
  horizon_months: number
}

interface PersonalizedRecommendRequest {
  type: "personalized_recommend"
  name: string
  age: number
  gender: string
  lat: number
  lon: number
  radius_km: number
  top_n: number
  year: number // Add year to the request
}

type PredictRequest = LocationForecastRequest | PersonalizedRecommendRequest

export async function POST(request: NextRequest) {
  try {
    const body: PredictRequest = await request.json()

    if (body.type === "location_forecast") {
      return handleLocationForecast(body)
    } else if (body.type === "personalized_recommend") {
      return handlePersonalizedRecommend(body)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request type. Must be 'location_forecast' or 'personalized_recommend'",
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("Prediction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleLocationForecast(request: LocationForecastRequest) {
  const { location_id, horizon_months } = request

  // Get location info
  const location = await prisma.locationStats.findUnique({
    where: { locationId: location_id },
  })

  if (!location) {
    return NextResponse.json(
      {
        success: false,
        error: "Location not found",
      },
      { status: 404 },
    )
  }

  // Get historical data for context
  const historicalData = await prisma.monthlyAggregation.findMany({
    where: { locationId: location_id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 24, // Last 24 months
  })

  // Check if we have cached predictions
  const cachedPredictions = await prisma.prediction.findMany({
    where: {
      locationId: location_id,
      year: { gte: 2025 },
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
    take: horizon_months,
  })

  if (cachedPredictions.length >= horizon_months) {
    // Return cached predictions
    return NextResponse.json({
      success: true,
      location_id,
      location_name: location.locationName,
      predictions: cachedPredictions.map((p) => ({
        year: p.year,
        month: p.month,
        predicted_rate: p.predictedRate,
        ci_lower: p.ciLower,
        ci_upper: p.ciUpper,
        explanation: p.explanation,
      })),
      model: cachedPredictions[0]?.modelVersion || "unknown",
      cached: true,
    })
  }

  // Generate new predictions using simple heuristic (in production, call Python model)
  const predictions = await generateSimplePredictions(location_id, horizon_months, historicalData)

  // Cache predictions
  for (const pred of predictions) {
    await prisma.prediction.upsert({
      where: {
        locationId_year_month: {
          locationId: location_id,
          year: pred.year,
          month: pred.month,
        },
      },
      update: {
        predictedRate: pred.predicted_rate,
        ciLower: pred.ci_lower,
        ciUpper: pred.ci_upper,
        modelVersion: "simple_heuristic_v1",
        explanation: pred.explanation,
      },
      create: {
        locationId: location_id,
        year: pred.year,
        month: pred.month,
        predictedRate: pred.predicted_rate,
        ciLower: pred.ci_lower,
        ciUpper: pred.ci_upper,
        modelVersion: "simple_heuristic_v1",
        explanation: pred.explanation,
      },
    })
  }

  return NextResponse.json({
    success: true,
    location_id,
    location_name: location.locationName,
    predictions,
    model: "simple_heuristic_v1",
    cached: false,
  })
}

async function handlePersonalizedRecommend(request: PersonalizedRecommendRequest) {
  const { name, age, gender, lat, lon, radius_km, top_n, year } = request

  // Execute the Python script to get personalized recommendations
  try {
    const { stdout, stderr } = await execAsync(
      `python scripts/predict_safety.py ${age} ${gender} ${year}`,
    )

    if (stderr) {
      console.error(`Python script stderr: ${stderr}`)
      return NextResponse.json(
        {
          success: false,
          error: "Error from prediction script",
        },
        { status: 500 },
      )
    }

    const pythonOutput = JSON.parse(stdout)

    if (!pythonOutput.success) {
      return NextResponse.json(
        {
          success: false,
          error: pythonOutput.error || "Unknown error from prediction script",
        },
        { status: 500 },
      )
    }

    // Process the predictions from Python script
    const predictions = pythonOutput.predictions.map((p: any) => ({
      location_name: p.City,
      safety_score: p.Predicted_Safety_Score,
      safety_rank: p.Safety_Rank,
      // We don't have lat/lon from python script, so use dummy or fetch from DB if needed
      // For now, we'll just use 0,0 and rely on the frontend for map display for now
      latitude: 0,
      longitude: 0,
      distance_km: 0, // Not calculated in Python script
      zone_classification: "unknown", // Not calculated in Python script
      avg_crime_count: 0, // Not calculated in Python script
      confidence: 1, // Placeholder
      explanation: "Predicted by ML model based on your profile.",
    }))

    return NextResponse.json({
      success: true,
      user_profile: {
        name,
        age,
        gender,
        year,
        search_location: { lat, lon }, // These are still from the frontend input
        radius_km,
      },
      recommendations: predictions,
      total_locations_analyzed: predictions.length,
    })
  } catch (error: any) {
    console.error("Error calling Python prediction script:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get personalized recommendations: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

async function generateSimplePredictions(locationId: string, horizonMonths: number, historicalData: any[]) {
  // Simple moving average prediction
  const recentCounts = historicalData.slice(0, 6).map((d) => d.crimeCount)
  const avgCount = recentCounts.reduce((sum, c) => sum + c, 0) / recentCounts.length
  const stdDev = Math.sqrt(recentCounts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / recentCounts.length)

  const predictions = []
  const currentDate = new Date()
  let year = currentDate.getFullYear()
  let month = currentDate.getMonth() + 2 // Start from next month

  for (let i = 0; i < horizonMonths; i++) {
    if (month > 12) {
      month = 1
      year++
    }

    // Add slight trend and seasonality
    const seasonalFactor = 1 + 0.1 * Math.sin((month / 12) * 2 * Math.PI)
    const trendFactor = 1 + 0.01 * i // Slight upward trend
    const predictedRate = avgCount * seasonalFactor * trendFactor

    predictions.push({
      year,
      month,
      predicted_rate: Math.round(predictedRate * 100) / 100,
      ci_lower: Math.max(0, Math.round((predictedRate - stdDev) * 100) / 100),
      ci_upper: Math.round((predictedRate + stdDev) * 100) / 100,
      explanation: `Based on ${recentCounts.length}-month average with seasonal adjustment`,
    })

    month++
  }

  return predictions
}
