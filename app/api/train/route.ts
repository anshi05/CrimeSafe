import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log("Starting training pipeline...")

    // Create training run record
    const trainingRun = await prisma.trainingRun.create({
      data: {
        modelVersion: `v1_${Date.now()}`,
        trainYears: "2020,2021,2022,2023",
        testYear: 2024,
        status: "running",
      },
    })

    // Execute Python training script
    const scriptPath = path.join(process.cwd(), "scripts", "train.py")
    const dbPath = path.join(process.cwd(), "prisma", "dev.db")

    try {
      const { stdout, stderr } = await execAsync(`python ${scriptPath}`, {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL || `file:${dbPath}`,
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      })

      console.log("Training output:", stdout)
      if (stderr) console.error("Training stderr:", stderr)

      // Parse results from stdout (looking for JSON output)
      const jsonMatch = stdout.match(/\{[\s\S]*"model_version"[\s\S]*\}/)
      let results = null

      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0])
      }

      // Update training run with results
      await prisma.trainingRun.update({
        where: { id: trainingRun.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          modelVersion: results?.model_version || trainingRun.modelVersion,
          rmse: results?.test_rmse,
          mae: results?.test_mae,
          accuracy: results?.classification_accuracy,
          modelPath: `models/${results?.model_version || trainingRun.modelVersion}`,
        },
      })

      return NextResponse.json({
        success: true,
        trainingRunId: trainingRun.id,
        results: results || {
          message: "Training completed but results parsing failed",
          stdout: stdout.slice(-500), // Last 500 chars
        },
      })
    } catch (error: any) {
      // Update training run as failed
      await prisma.trainingRun.update({
        where: { id: trainingRun.id },
        data: {
          status: "failed",
          completedAt: new Date(),
        },
      })

      throw error
    }
  } catch (error: any) {
    console.error("Training error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stderr || error.stdout,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Get latest training runs
    const runs = await prisma.trainingRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      runs,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
