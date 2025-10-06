import { prisma } from "./db"
import { parse } from "csv-parse/sync"
import * as fs from "fs"
import * as path from "path"

interface CrimeCSVRow {
  [key: string]: string // Allow for dynamic keys due to potential BOM
}

// City coordinates mapping (expand as needed)
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  MANGALORE: { lat: 12.9141, lon: 74.856 },
  BANGALORE: { lat: 12.9716, lon: 77.5946 },
  MYSORE: { lat: 12.2958, lon: 76.6394 },
  UDUPI: { lat: 13.3409, lon: 74.7421 },
  KARWAR: { lat: 14.8137, lon: 74.129 },
  // Add more cities as needed
}

function parseDate(dateStr: string): Date | null {
  try {
    // Handle various date formats
    const cleaned = dateStr.trim()
    if (!cleaned) return null

    // Try DD-MM-YYYY HH:MM format
    const parts = cleaned.split(/[- :]/).map(Number)
    if (parts.length === 5 || parts.length === 6) {
      // Month is 0-indexed in Date constructor
      return new Date(parts[2], parts[1] - 1, parts[0], parts[3] || 0, parts[4] || 0, parts[5] || 0)
    }

    // Try ISO format first (should be after specific formats)
    const date = new Date(cleaned)
    if (!isNaN(date.getTime())) return date

    return null
  } catch {
    return null
  }
}

function getCityCoordinates(city: string): { lat: number; lon: number } {
  const normalized = city.toUpperCase().trim()
  return CITY_COORDINATES[normalized] || { lat: 0, lon: 0 }
}

function generateLocationId(city: string, lat: number, lon: number): string {
  // Create location ID based on city and rounded coordinates
  const latRounded = Math.round(lat * 100) / 100
  const lonRounded = Math.round(lon * 100) / 100
  return `${city.toLowerCase().replace(/\s+/g, "_")}_${latRounded}_${lonRounded}`
}

export async function ingestCrimeData(csvPath: string) {
  console.log("Starting data ingestion...")

  const fileContent = fs.readFileSync(csvPath, "utf-8")
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CrimeCSVRow[]

  console.log(`Parsed ${records.length} records from CSV`)

  let successCount = 0
  let errorCount = 0
  const locationStatsMap = new Map<string, any>()

  for (const row of records) {
    try {
      const dateOccurrence = parseDate(row["Date of Occurrence"])
      const dateReported = parseDate(row["Date Reported"])

      if (!dateOccurrence) {
        errorCount++
        continue
      }

      const year = dateOccurrence.getFullYear()
      const month = dateOccurrence.getMonth() + 1
      const day = dateOccurrence.getDate()
      const weekday = dateOccurrence.getDay()

      const city = row.CITY?.trim() || "UNKNOWN"
      const coords = getCityCoordinates(city)
      const locationId = generateLocationId(city, coords.lat, coords.lon)

      const victimAge = Number.parseInt(row["Victim Age"]) || null
      const victimGender = row["Victim Gender"]?.trim().toUpperCase() || null

      // Create crime record
      await prisma.crimeRecord.create({
        data: {
          reportNo: row[Object.keys(row)[0]], // Access the first key, which should be 'Report Number' with BOM
          dateReported: dateReported || dateOccurrence,
          dateOfOccurrence: dateOccurrence,
          year,
          month,
          day,
          weekday,
          city,
          crimeCode: row["Crime Code"],
          crimeDescription: row["Crime Description"],
          victimAge,
          victimGender,
          latitude: coords.lat,
          longitude: coords.lon,
          locationId,
          severity: 1, // Default severity
        },
      })

      // Track location stats
      if (!locationStatsMap.has(locationId)) {
        locationStatsMap.set(locationId, {
          locationId,
          locationName: city,
          city,
          latitude: coords.lat,
          longitude: coords.lon,
          totalCrimes: 0,
        })
      }
      locationStatsMap.get(locationId).totalCrimes++

      successCount++

      if (successCount % 100 === 0) {
        console.log(`Processed ${successCount} records...`)
      }
    } catch (error) {
      console.error("Error processing row:", error)
      errorCount++
    }
  }

  // Upsert location stats
  console.log("Updating location statistics...")
  for (const stats of locationStatsMap.values()) {
    await prisma.locationStats.upsert({
      where: { locationId: stats.locationId },
      update: { totalCrimes: stats.totalCrimes },
      create: stats,
    })
  }

  console.log(`Ingestion complete: ${successCount} success, ${errorCount} errors`)
  return { successCount, errorCount }
}

export async function aggregateMonthlyData() {
  console.log("Starting monthly aggregation...")

  // Get all unique location-year-month combinations
  const aggregations = await prisma.$queryRaw<
    Array<{
      location_id: string
      year: number
      month: number
      crime_count: bigint
      male_victims: bigint
      female_victims: bigint
      avg_victim_age: number
    }>
  >`
    SELECT 
      location_id,
      year,
      month,
      COUNT(*) as crime_count,
      SUM(CASE WHEN victim_gender = 'M' THEN 1 ELSE 0 END) as male_victims,
      SUM(CASE WHEN victim_gender = 'F' THEN 1 ELSE 0 END) as female_victims,
      AVG(victim_age) as avg_victim_age
    FROM crime_records
    WHERE location_id IS NOT NULL
    GROUP BY location_id, year, month
    ORDER BY location_id, year, month
  `

  console.log(`Found ${aggregations.length} monthly aggregations`)

  // Calculate crime rates and zone classifications
  for (const agg of aggregations) {
    const locationStats = await prisma.locationStats.findUnique({
      where: { locationId: agg.location_id },
    })

    const crimeCount = Number(agg.crime_count)
    const crimeRate = locationStats?.population ? (crimeCount / locationStats.population) * 1000 : null

    // Simple zone classification (can be made configurable)
    let zoneClassification = "green"
    if (crimeCount > 50) zoneClassification = "red"
    else if (crimeCount > 20) zoneClassification = "amber"

    await prisma.monthlyAggregation.upsert({
      where: {
        locationId_year_month: {
          locationId: agg.location_id,
          year: agg.year,
          month: agg.month,
        },
      },
      update: {
        crimeCount,
        crimeRate,
        zoneClassification,
        maleVictims: Number(agg.male_victims),
        femaleVictims: Number(agg.female_victims),
        avgVictimAge: agg.avg_victim_age,
      },
      create: {
        locationId: agg.location_id,
        year: agg.year,
        month: agg.month,
        crimeCount,
        crimeRate,
        zoneClassification,
        maleVictims: Number(agg.male_victims),
        femaleVictims: Number(agg.female_victims),
        avgVictimAge: agg.avg_victim_age,
      },
    })
  }

  console.log("Monthly aggregation complete")
}
