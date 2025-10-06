import { ingestCrimeData, aggregateMonthlyData } from "../lib/data-ingestion"
import * as path from "path"

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), "crime_dataset_india.csv")

  console.log("CrimeSafe Data Ingestion")
  console.log("========================")
  console.log(`CSV Path: ${csvPath}`)
  console.log("")

  try {
    // Ingest raw data
    const result = await ingestCrimeData(csvPath)
    console.log(`\nIngestion Results:`)
    console.log(`  Success: ${result.successCount}`)
    console.log(`  Errors: ${result.errorCount}`)

    // Aggregate monthly data
    await aggregateMonthlyData()

    console.log("\n✓ Data ingestion complete!")
  } catch (error) {
    console.error("Error during ingestion:", error)
    process.exit(1)
  }
}

main()
