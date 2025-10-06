/**
 * API Testing Script
 *
 * This script tests all the API endpoints to ensure they're working correctly.
 * Run with: node --experimental-strip-types scripts/test-api.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

interface TestResult {
  endpoint: string
  method: string
  status: "PASS" | "FAIL"
  statusCode?: number
  error?: string
  duration?: number
}

const results: TestResult[] = []

async function testEndpoint(endpoint: string, method = "GET", body?: any): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const duration = Date.now() - startTime
    const data = await response.json()

    if (response.ok && data.success !== false) {
      return {
        endpoint,
        method,
        status: "PASS",
        statusCode: response.status,
        duration,
      }
    } else {
      return {
        endpoint,
        method,
        status: "FAIL",
        statusCode: response.status,
        error: data.error || "Unknown error",
        duration,
      }
    }
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: "FAIL",
      error: error.message,
      duration: Date.now() - startTime,
    }
  }
}

async function runTests() {
  console.log("🧪 Starting API Tests...\n")
  console.log(`Base URL: ${BASE_URL}\n`)

  // Test 1: Get locations for 2024
  console.log("Test 1: GET /api/locations?year=2024")
  results.push(await testEndpoint("/api/locations?year=2024"))

  // Test 2: Get locations for specific city
  console.log("Test 2: GET /api/locations?year=2024&city=Mangalore")
  results.push(await testEndpoint("/api/locations?year=2024&city=Mangalore"))

  // Test 3: Get model evaluation
  console.log("Test 3: GET /api/evaluate")
  results.push(await testEndpoint("/api/evaluate"))

  // Test 4: Get location history
  console.log("Test 4: GET /api/location/1/history")
  results.push(await testEndpoint("/api/location/1/history"))

  // Test 5: Single location prediction
  console.log("Test 5: POST /api/predict (single location)")
  results.push(
    await testEndpoint("/api/predict", "POST", {
      type: "single_location",
      location_id: 1,
      year: 2025,
      month: 1,
    }),
  )

  // Test 6: Batch predictions
  console.log("Test 6: POST /api/predict (batch)")
  results.push(
    await testEndpoint("/api/predict", "POST", {
      type: "batch_locations",
      location_ids: [1, 2, 3],
      year: 2025,
      month: 1,
    }),
  )

  // Test 7: Personalized recommendations
  console.log("Test 7: POST /api/predict (personalized)")
  results.push(
    await testEndpoint("/api/predict", "POST", {
      type: "personalized_recommend",
      name: "Test User",
      age: 30,
      gender: "male",
      lat: 12.9141,
      lon: 74.856,
      radius_km: 10,
      top_n: 5,
    }),
  )

  // Test 8: Train model (optional - takes time)
  // Uncomment to test training endpoint
  // console.log('Test 8: POST /api/train')
  // results.push(await testEndpoint('/api/train', 'POST'))

  // Print results
  console.log("\n" + "=".repeat(80))
  console.log("📊 Test Results Summary")
  console.log("=".repeat(80) + "\n")

  const passed = results.filter((r) => r.status === "PASS").length
  const failed = results.filter((r) => r.status === "FAIL").length

  results.forEach((result, index) => {
    const icon = result.status === "PASS" ? "✅" : "❌"
    console.log(`${icon} Test ${index + 1}: ${result.method} ${result.endpoint}`)
    console.log(`   Status: ${result.status}`)
    if (result.statusCode) {
      console.log(`   HTTP Status: ${result.statusCode}`)
    }
    if (result.duration) {
      console.log(`   Duration: ${result.duration}ms`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    console.log()
  })

  console.log("=".repeat(80))
  console.log(`Total Tests: ${results.length}`)
  console.log(`Passed: ${passed} ✅`)
  console.log(`Failed: ${failed} ❌`)
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`)
  console.log("=".repeat(80))

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1)
  }
}

// Run tests
runTests().catch(console.error)
