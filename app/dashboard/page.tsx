"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Calendar, AlertTriangle, MapPin } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, Legend } from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF", "#FF8CDD"]

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedCity, setSelectedCity] = useState<string>("all")

  const { data: locationsData, isLoading } = useSWR(
    `/api/locations?year=${selectedYear}&topCities=10&topCrimeTypes=10`,
    fetcher,
  )

  const { data: evaluationData } = useSWR("/api/evaluate", fetcher)

  const locations = locationsData?.locations || []
  const monthlyCrimeTrends = locationsData?.monthlyCrimeTrends || []
  const topCitiesByCrime = locationsData?.topCitiesByCrime || []
  const topCrimeTypesData = locationsData?.topCrimeTypesData || []

  // Calculate statistics
  const totalCrimes = locations.reduce((sum: number, loc: any) => sum + (loc.year_crime_count || 0), 0)
  const redZones = locations.filter((loc: any) => loc.zone_classification === "red").length
  const amberZones = locations.filter((loc: any) => loc.zone_classification === "amber").length
  const greenZones = locations.filter((loc: any) => loc.zone_classification === "green").length

  // Prepare chart data
  const zoneDistributionData = [
    { name: "Red Zones", value: redZones, fill: "#ef4444" },
    { name: "Amber Zones", value: amberZones, fill: "#f59e0b" },
    { name: "Green Zones", value: greenZones, fill: "#10b981" },
  ]

  const topLocations = topCitiesByCrime.map((city: any) => ({
    name: city.city,
    crimes: city.crime_count,
  }))

  // Get unique cities
  const cities = Array.from(new Set(locations.map((loc: any) => loc.city))).filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Crime Analysis Dashboard</h1>
          <p className="text-slate-600">Comprehensive crime statistics and trends across locations</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Select Year</label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Select City</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city: any) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button asChild variant="outline">
                  <Link href="/map">View Map</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Crimes</CardTitle>
              <Calendar className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalCrimes.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">in {selectedYear}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Red Zones</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{redZones}</div>
              <p className="text-xs text-slate-500 mt-1">High risk areas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Amber Zones</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{amberZones}</div>
              <p className="text-xs text-slate-500 mt-1">Moderate risk areas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Green Zones</CardTitle>
              <MapPin className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{greenZones}</div>
              <p className="text-xs text-slate-500 mt-1">Safe areas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Zone Distribution</CardTitle>
              <CardDescription>Safety classification across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zoneDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 High-Crime Locations</CardTitle>
              <CardDescription>Locations with highest crime counts in {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topLocations} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="crimes" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Crime Trends Chart */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Crime Trends</CardTitle>
              <CardDescription>Crimes reported per month in {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyCrimeTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="crime_count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Crime Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Crime Types</CardTitle>
              <CardDescription>Most common crime types in {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topCrimeTypesData}
                    dataKey="crime_count"
                    nameKey="crime_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {topCrimeTypesData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Model Evaluation */}
        {evaluationData?.success && (
          <Card>
            <CardHeader>
              <CardTitle>ML Model Performance</CardTitle>
              <CardDescription>Latest model evaluation on 2024 test data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-slate-600 mb-1">RMSE</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {evaluationData.evaluation.metrics.rmse?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600 mb-1">MAE</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {evaluationData.evaluation.metrics.mae?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600 mb-1">Classification Accuracy</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {evaluationData.evaluation.metrics.classification_accuracy
                      ? `${(evaluationData.evaluation.metrics.classification_accuracy * 100).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Model: {evaluationData.evaluation.model_version} | Trained:{" "}
                {new Date(evaluationData.evaluation.trained_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading dashboard data...</p>
          </div>
        )}
      </div>
    </div>
  )
}
