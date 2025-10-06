"use client"

import { use } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useSWR(`/api/location/${id}/history`, fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Loading location data...</p>
        </div>
      </div>
    )
  }

  if (!data?.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Location Not Found</CardTitle>
            <CardDescription>The requested location could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { location, monthly_data, yearly_summary, top_crime_types } = data

  // Prepare time series data
  const timeSeriesData = monthly_data.map((d: any) => ({
    date: `${d.year}-${String(d.month).padStart(2, "0")}`,
    crimes: d.crime_count,
    year: d.year,
    month: d.month,
  }))

  // Prepare yearly comparison data
  const yearlyData = yearly_summary.map((y: any) => ({
    year: y.year,
    total: y.total_crimes,
    avg: y.avg_crime_count,
    red: y.red_months,
    amber: y.amber_months,
    green: y.green_months,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/map">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Map
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{location.name}</h1>
              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location.city}</span>
                </div>
                <span className="font-mono text-sm">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Crimes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{location.total_crimes.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Population</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{location.population?.toLocaleString() || "N/A"}</div>
              <p className="text-xs text-slate-500 mt-1">Estimated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Data Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{monthly_data.length}</div>
              <p className="text-xs text-slate-500 mt-1">Monthly records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Years Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{yearly_summary.length}</div>
              <p className="text-xs text-slate-500 mt-1">2020-2024</p>
            </CardContent>
          </Card>
        </div>

        {/* Time Series Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Crime Trend Over Time</CardTitle>
            <CardDescription>Monthly crime counts from 2020 to 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="crimes" stroke="#3b82f6" strokeWidth={2} name="Crime Count" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Yearly Comparison */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Crime Totals</CardTitle>
              <CardDescription>Total crimes per year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Total Crimes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zone Classification by Year</CardTitle>
              <CardDescription>Number of months in each zone per year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="green" fill="#10b981" name="Green Months" stackId="a" />
                  <Bar dataKey="amber" fill="#f59e0b" name="Amber Months" stackId="a" />
                  <Bar dataKey="red" fill="#ef4444" name="Red Months" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Crime Types */}
        <Card>
          <CardHeader>
            <CardTitle>Top Crime Types</CardTitle>
            <CardDescription>Most common crimes in this location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_crime_types.map((crime: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{crime.crime_description}</div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(crime.count / top_crime_types[0].count) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-sm font-semibold text-slate-900">{crime.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
