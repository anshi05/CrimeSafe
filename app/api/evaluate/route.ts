import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Get latest completed training run
    const latestRun = await prisma.trainingRun.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
    })

    if (!latestRun) {
      return NextResponse.json(
        {
          success: false,
          error: "No completed training runs found",
        },
        { status: 404 },
      )
    }

    // Get 2024 test data statistics
    const testStats = await prisma.$queryRaw<
      Array<{
        total_records: bigint
        avg_crime_count: number
        min_crime_count: number
        max_crime_count: number
      }>
    >`
      SELECT 
        COUNT(*) as total_records,
        AVG(crime_count) as avg_crime_count,
        MIN(crime_count) as min_crime_count,
        MAX(crime_count) as max_crime_count
      FROM monthly_aggregations
      WHERE year = 2024
    `

    // Get zone distribution for 2024
    const zoneDistribution = await prisma.$queryRaw<
      Array<{
        zone_classification: string
        count: bigint
      }>
    >`
      SELECT 
        zone_classification,
        COUNT(*) as count
      FROM monthly_aggregations
      WHERE year = 2024
      GROUP BY zone_classification
    `

    return NextResponse.json({
      success: true,
      evaluation: {
        model_version: latestRun.modelVersion,
        test_year: latestRun.testYear,
        metrics: {
          rmse: latestRun.rmse,
          mae: latestRun.mae,
          classification_accuracy: latestRun.accuracy,
        },
        test_data_stats: {
          total_records: Number(testStats[0]?.total_records || 0),
          avg_crime_count: testStats[0]?.avg_crime_count || 0,
          min_crime_count: testStats[0]?.min_crime_count || 0,
          max_crime_count: testStats[0]?.max_crime_count || 0,
        },
        zone_distribution: zoneDistribution.map((z) => ({
          zone: z.zone_classification,
          count: Number(z.count),
        })),
        trained_at: latestRun.completedAt,
      },
    })
  } catch (error: any) {
    console.error("Evaluation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
