"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Shield, AlertTriangle, MapPin, User, Calendar, Calculator } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CitySafetyData {
  age: number
  city: string
  gender: string
  rank: number
  safety_score: number
  year: number
}

interface PredictionResponse {
  input: {
    age: number
    gender: string
    year: number
  }
  most_dangerous_cities: CitySafetyData[]
  safest_cities: CitySafetyData[]
  total_cities_analyzed: number
}

export default function SafetyPredictionDashboard() {
  const [age, setAge] = useState<number>(25)
  const [gender, setGender] = useState<string>("M")
  const [year, setYear] = useState<number>(2025)
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: age,
          gender: gender,
          year: year,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch prediction data")
      }

      const data: PredictionResponse = await response.json()
      setPredictionData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Chart colors
  const safeColors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"]
  const dangerColors = ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Safety Prediction Dashboard</h1>
          <p className="text-slate-600 text-lg">
            Analyze city safety scores based on demographic factors and year
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" />
              Personal Safety Analysis
            </CardTitle>
            <CardDescription>
              Enter your details to get personalized safety predictions across cities
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Age Input */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block rounded-md">Age</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number.parseInt(e.target.value) || 25)}
                  className="w-full rounded-md"
                  min={1}
                  max={100}
                />
              </div>

              {/* Gender Select */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Select */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Year</label>
                <Select value={year.toString()} onValueChange={(v) => setYear(Number.parseInt(v))}>
                  <SelectTrigger className="rounded-md">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Analyze Button */}
              <div className="flex items-end">
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Analyze Safety
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {predictionData && (
          <>
            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Cities Analyzed</CardTitle>
                  <MapPin className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {predictionData.total_cities_analyzed}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Total cities in analysis</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Safest City</CardTitle>
                  <Shield className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 truncate">
                    {predictionData.safest_cities[0]?.city || "N/A"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Score: {predictionData.safest_cities[0]?.safety_score.toFixed(1) || "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Most Dangerous City</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 truncate">
                    {predictionData.most_dangerous_cities[0]?.city || "N/A"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Score: {predictionData.most_dangerous_cities[0]?.safety_score.toFixed(1) || "N/A"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Safest Cities Chart */}
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Shield className="h-5 w-5" />
                    Top 5 Safest Cities
                  </CardTitle>
                  <CardDescription>
                    Cities with highest safety scores for your profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={predictionData.safest_cities}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="city" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        label={{ value: 'Safety Score', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}`, 'Safety Score']}
                        labelFormatter={(label) => `City: ${label}`}
                      />
                      <Bar dataKey="safety_score" radius={[4, 4, 0, 0]}>
                        {predictionData.safest_cities.map((entry, index) => (
                          <Cell key={`safe-${index}`} fill={safeColors[index % safeColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Most Dangerous Cities Chart */}
              <Card className="shadow-lg">
                <CardHeader className="bg-red-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Top 5 Most Dangerous Cities
                  </CardTitle>
                  <CardDescription>
                    Cities with lowest safety scores for your profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={predictionData.most_dangerous_cities}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="city" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        label={{ value: 'Safety Score', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}`, 'Safety Score']}
                        labelFormatter={(label) => `City: ${label}`}
                      />
                      <Bar dataKey="safety_score" radius={[4, 4, 0, 0]}>
                        {predictionData.most_dangerous_cities.map((entry, index) => (
                          <Cell key={`danger-${index}`} fill={dangerColors[index % dangerColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Cities Lists */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Safest Cities List */}
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Shield className="h-5 w-5" />
                    Safest Cities Ranking
                  </CardTitle>
                  <CardDescription>
                    Complete list of safest cities based on safety score
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    {predictionData.safest_cities.map((city, index) => (
                      <div
                        key={city.city}
                        className={`flex items-center justify-between p-4 border-b ${
                          index % 2 === 0 ? 'bg-white' : 'bg-green-50'
                        } hover:bg-green-100 transition-colors`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                            {city.rank}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{city.city}</div>
                            <div className="text-sm text-slate-500">Rank: {city.rank}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {city.safety_score.toFixed(1)}
                          </div>
                          <div className="text-xs text-slate-500">Safety Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Dangerous Cities List */}
              <Card className="shadow-lg">
                <CardHeader className="bg-red-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Most Dangerous Cities Ranking
                  </CardTitle>
                  <CardDescription>
                    Complete list of cities requiring extra caution
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    {predictionData.most_dangerous_cities.map((city, index) => (
                      <div
                        key={city.city}
                        className={`flex items-center justify-between p-4 border-b ${
                          index % 2 === 0 ? 'bg-white' : 'bg-red-50'
                        } hover:bg-red-100 transition-colors`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-800 rounded-full font-semibold text-sm">
                            {city.rank}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{city.city}</div>
                            <div className="text-sm text-slate-500">Rank: {city.rank}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            {city.safety_score.toFixed(1)}
                          </div>
                          <div className="text-xs text-slate-500">Safety Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Profile Summary */}
            <Card className="mt-8 shadow-lg">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <User className="h-5 w-5" />
                  Analysis Summary
                </CardTitle>
                <CardDescription>
                  Safety prediction based on your input profile
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-slate-900">{predictionData.input.age}</div>
                    <div className="text-sm text-slate-500">Age</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-slate-900">
                      {predictionData.input.gender === 'M' ? 'Male' : predictionData.input.gender === 'F' ? 'Female' : 'Other'}
                    </div>
                    <div className="text-sm text-slate-500">Gender</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-slate-900">{predictionData.input.year}</div>
                    <div className="text-sm text-slate-500">Year</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!predictionData && !isLoading && (
          <Card className="text-center py-12 shadow-lg">
            <CardContent>
              <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to Analyze</h3>
              <p className="text-slate-500 mb-4">
                Enter your details above and click "Analyze Safety" to get personalized city safety predictions.
              </p>
            </CardContent>
          </Card>
        )}

        {/* How It Works Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Personalized Recommendations Work</CardTitle>
            <CardDescription>Understanding our AI-powered safety analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Data Analysis</h3>
                <p className="text-sm text-slate-600">
                  We analyze historical crime data from 2020-2024, including crime types, frequencies, and victim
                  demographics for locations within your specified radius.
                </p>
              </div>

              <div>
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Demographic Weighting</h3>
                <p className="text-sm text-slate-600">
                  Our algorithm considers your age and gender to weight crimes affecting similar demographics more
                  heavily, providing personalized safety scores.
                </p>
              </div>

              <div>
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Smart Ranking</h3>
                <p className="text-sm text-slate-600">
                  Locations are ranked by safety score, combining crime rates, demographic factors, and distance from
                  your search location to find the best matches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}