"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPersonalizedRecommendations } from "@/lib/api-client"
import { MapPin, Shield, TrendingDown, AlertCircle, User, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PredictPage() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    lat: "",
    lon: "",
    radius_km: "10",
    top_n: "5",
    year: "2024", // Add year to form data
  })

  const [recommendations, setRecommendations] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await getPersonalizedRecommendations({
        type: "personalized_recommend",
        name: formData.name,
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        lat: Number.parseFloat(formData.lat),
        lon: Number.parseFloat(formData.lon),
        radius_km: Number.parseFloat(formData.radius_km),
        top_n: Number.parseInt(formData.top_n),
        year: Number.parseInt(formData.year), // Pass year to API
      })

      if (result.success) {
        setRecommendations(result)
      } else {
        setError(result.error || "Failed to get recommendations")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "red":
        return "text-red-600 bg-red-50 border-red-200"
      case "amber":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "green":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  const getZoneBadgeVariant = (zone: string) => {
    switch (zone) {
      case "red":
        return "destructive"
      case "amber":
        return "default"
      case "green":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Preset locations for quick testing
  const presetLocations = [
    { name: "Mangalore", lat: 12.9141, lon: 74.856 },
    { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
    { name: "Mysore", lat: 12.2958, lon: 76.6394 },
    { name: "Udupi", lat: 13.3409, lon: 74.7421 },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Personalized Safety Recommendations
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Find Safe Areas Near You</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Get personalized safety recommendations based on your demographics and location preferences. Our AI analyzes
            crime patterns to suggest safer areas.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Enter your details to get personalized recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    min="1"
                    max="120"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Search Location</Label>
                  <p className="text-sm text-slate-500 mb-3">Enter coordinates or use a preset</p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {presetLocations.map((loc) => (
                      <Button
                        key={loc.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            lat: loc.lat.toString(),
                            lon: loc.lon.toString(),
                          })
                        }
                      >
                        {loc.name}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="lat" className="text-sm">
                        Latitude
                      </Label>
                      <Input
                        id="lat"
                        type="number"
                        step="0.0001"
                        placeholder="12.9141"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lon" className="text-sm">
                        Longitude
                      </Label>
                      <Input
                        id="lon"
                        type="number"
                        step="0.0001"
                        placeholder="74.8560"
                        value={formData.lon}
                        onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="radius">Search Radius (km)</Label>
                  <Select value={formData.radius_km} onValueChange={(v) => setFormData({ ...formData, radius_km: v })}>
                    <SelectTrigger id="radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="20">20 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="top_n">Number of Recommendations</Label>
                  <Select value={formData.top_n} onValueChange={(v) => setFormData({ ...formData, top_n: v })}>
                    <SelectTrigger id="top_n">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Top 3</SelectItem>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="year">Prediction Year</Label>
                  <Select value={formData.year} onValueChange={(v) => setFormData({ ...formData, year: v })}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2020">2020</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Find Safe Areas
                    </>
                  )}
                </Button>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Safety Recommendations</CardTitle>
              <CardDescription>
                {recommendations
                  ? `Found ${recommendations.recommendations.length} safe areas near you`
                  : "Enter your information to get personalized recommendations"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!recommendations && !isLoading && (
                <div className="text-center py-12 text-slate-400">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No recommendations yet</p>
                  <p className="text-sm">Fill out the form to get personalized safety recommendations</p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
                  <p className="text-slate-600">Analyzing crime data and generating recommendations...</p>
                </div>
              )}

              {recommendations && (
                <div className="space-y-6">
                  {/* User Profile Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Your Profile</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>
                        <span className="font-medium">Name:</span> {recommendations.user_profile.name}
                      </div>
                      <div>
                        <span className="font-medium">Age:</span> {recommendations.user_profile.age}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span>{" "}
                        {recommendations.user_profile.gender.charAt(0).toUpperCase() +
                          recommendations.user_profile.gender.slice(1)}
                      </div>
                      <div>
                        <span className="font-medium">Radius:</span> {recommendations.user_profile.radius_km} km
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      Analyzed {recommendations.total_locations_analyzed} locations in your area
                    </div>
                  </div>

                  {/* Recommendations List */}
                  <div className="space-y-4">
                    {recommendations.recommendations.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No locations found within the specified radius. Try increasing the search radius.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      recommendations.recommendations.map((rec: any, idx: number) => (
                        <Card key={rec.location_id} className={`border-2 ${getZoneColor(rec.zone_classification)}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-bold text-slate-900">#{idx + 1}</span>
                                  <h3 className="text-lg font-semibold text-slate-900">{rec.location_name}</h3>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>
                                    {rec.distance_km.toFixed(2)} km away • {rec.latitude.toFixed(4)},{" "}
                                    {rec.longitude.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={getZoneBadgeVariant(rec.zone_classification)}>
                                {rec.zone_classification.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 mb-3">
                              <div className="bg-white rounded-lg p-3 border">
                                <div className="text-xs text-slate-600 mb-1">Safety Score</div>
                                <div className="text-2xl font-bold text-slate-900">
                                  {(rec.safety_score || 0).toFixed(1)}
                                </div>
                                <div className="text-xs text-slate-500">Lower is safer</div>
                              </div>

                              <div className="bg-white rounded-lg p-3 border">
                                <div className="text-xs text-slate-600 mb-1">Avg Crimes/Month</div>
                                <div className="text-2xl font-bold text-slate-900">
                                  {(rec.avg_crime_count || 0).toFixed(1)}
                                </div>
                                <div className="text-xs text-slate-500">Recent 6 months</div>
                              </div>

                              <div className="bg-white rounded-lg p-3 border">
                                <div className="text-xs text-slate-600 mb-1">Confidence</div>
                                <div className="text-2xl font-bold text-slate-900">
                                  {((rec.confidence || 0) * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-slate-500">Prediction accuracy</div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border mb-3">
                              <div className="flex items-start gap-2">
                                <TrendingDown className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-medium text-slate-700 mb-1">Why this area?</div>
                                  <p className="text-sm text-slate-600">{rec.explanation}</p>
                                </div>
                              </div>
                            </div>

                            <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                              <Link href={`/location/${rec.location_id}`}>View Detailed Analysis</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Disclaimer */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Important:</strong> These recommendations are based on historical crime data and
                      statistical analysis. They should be used as one factor among many in decision-making. Crime
                      patterns can change, and no area is completely risk-free. Always exercise caution and use your
                      best judgment.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
