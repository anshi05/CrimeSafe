import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const locationId = params.id

    // Get location info
    const location = await prisma.locationStats.findUnique({
      where: { locationId },
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

    // Get historical monthly data
    const monthlyData = await prisma.monthlyAggregation.findMany({
      where: { locationId },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    })

    // Get yearly aggregates
    const yearlyData = await prisma.$queryRaw<
      Array<{
        year: number
        total_crimes: bigint
        avg_crime_count: number
        red_months: bigint
        amber_months: bigint
        green_months: bigint
      }>
    >`
      SELECT 
        year,
        SUM(crime_count) as total_crimes,
        AVG(crime_count) as avg_crime_count,
        SUM(CASE WHEN zone_classification = 'red' THEN 1 ELSE 0 END) as red_months,
        SUM(CASE WHEN zone_classification = 'amber' THEN 1 ELSE 0 END) as amber_months,
        SUM(CASE WHEN zone_classification = 'green' THEN 1 ELSE 0 END) as green_months
      FROM monthly_aggregations
      WHERE location_id = ${locationId}
      GROUP BY year
      ORDER BY year ASC
    `

    // Get crime type breakdown (from raw records)
    const crimeTypes = await prisma.$queryRaw<
      Array<{
        crime_description: string
        count: bigint
      }>
    >`
      SELECT 
        crime_description,
        COUNT(*) as count
      FROM crime_records
      WHERE location_id = ${locationId}
      GROUP BY crime_description
      ORDER BY count DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      location: {
        id: location.locationId,
        name: location.locationName,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        total_crimes: location.totalCrimes,
        population: location.population,
      },
      monthly_data: monthlyData.map((d) => ({
        year: d.year,
        month: d.month,
        crime_count: d.crimeCount,
        crime_rate: d.crimeRate,
        zone_classification: d.zoneClassification,
        male_victims: d.maleVictims,
        female_victims: d.femaleVictims,
        avg_victim_age: d.avgVictimAge,
      })),
      yearly_summary: yearlyData.map((y) => ({
        year: y.year,
        total_crimes: Number(y.total_crimes),
        avg_crime_count: y.avg_crime_count,
        red_months: Number(y.red_months),
        amber_months: Number(y.amber_months),
        green_months: Number(y.green_months),
      })),
      top_crime_types: crimeTypes.map((c) => ({
        crime_description: c.crime_description,
        count: Number(c.count),
      })),
    })
  } catch (error: any) {
    console.error("Location history error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
