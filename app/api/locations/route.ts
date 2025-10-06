import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") ? Number.parseInt(searchParams.get("year")!) : null
    const city = searchParams.get("city")
    const topCities = searchParams.get("topCities") ? Number.parseInt(searchParams.get("topCities")!) : null
    const topCrimeTypes = searchParams.get("topCrimeTypes") ? Number.parseInt(searchParams.get("topCrimeTypes")!) : null

    let whereClause: any = {}
    if (city) {
      whereClause.city = city
    }
    if (year) {
      whereClause.year = year
    }

    // Get all locations with their latest stats
    const locations = await prisma.locationStats.findMany({
      where: city ? { city } : undefined,
      orderBy: { totalCrimes: "desc" },
    })

    // If year is specified, get zone classifications for that year
    if (year) {
      const locationsWithZones = await Promise.all(
        locations.map(async (loc) => {
          // Get average zone classification for the year
          const yearData = await prisma.monthlyAggregation.findMany({
            where: {
              locationId: loc.locationId,
              year,
            },
          })

          if (yearData.length === 0) {
            return { ...loc, zone_classification: null, year_crime_count: 0 }
          }

          // Calculate most common zone classification
          const zoneCounts = yearData.reduce(
            (acc, d) => {
              if (d.zoneClassification) {
                acc[d.zoneClassification] = (acc[d.zoneClassification] || 0) + 1
              }
              return acc
            },
            {} as Record<string, number>,
          )

          const mostCommonZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

          const yearCrimeCount = yearData.reduce((sum, d) => sum + d.crimeCount, 0)

          return {
            ...loc,
            zone_classification: mostCommonZone,
            year_crime_count: yearCrimeCount,
          }
        }),
      )

      return NextResponse.json({
        success: true,
        locations: locationsWithZones,
        year,
      })
    }

    // Aggregate monthly crime trends if year is provided
    let monthlyCrimeTrends = []
    if (year) {
      monthlyCrimeTrends = await prisma.$queryRaw`
        SELECT
          month,
          CAST(COUNT(*) AS INTEGER) as crime_count
        FROM crime_records
        WHERE year = ${year}
        GROUP BY month
        ORDER BY month
      `
    }

    // Aggregate top cities by crime count
    let topCitiesByCrime = []
    if (topCities) {
      topCitiesByCrime = await prisma.$queryRaw`
        SELECT
          city,
          CAST(COUNT(*) AS INTEGER) as crime_count
        FROM crime_records
        WHERE year = ${year || 0}
        GROUP BY city
        ORDER BY crime_count DESC
        LIMIT ${topCities}
      `
    }

    // Aggregate top crime types
    let topCrimeTypesData = []
    if (topCrimeTypes) {
      topCrimeTypesData = await prisma.$queryRaw`
        SELECT
          crimeDescription as crime_type,
          CAST(COUNT(*) AS INTEGER) as crime_count
        FROM crime_records
        WHERE year = ${year || 0}
        GROUP BY crime_type
        ORDER BY crime_count DESC
        LIMIT ${topCrimeTypes}
      `
    }

    return NextResponse.json({
      success: true,
      locations,
      year,
      monthlyCrimeTrends,
      topCitiesByCrime,
      topCrimeTypesData,
    })
  } catch (error: any) {
    console.error("Locations error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
