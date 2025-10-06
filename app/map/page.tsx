"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MapPin, TrendingUp, AlertCircle } from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Fix for default Leaflet icon not showing
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
  iconUrl: 'leaflet/images/marker-icon.png',
  shadowUrl: 'leaflet/images/marker-shadow.png',
});

export default function MapPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)

  const { data: locationsData, isLoading } = useSWR(`/api/locations?year=${selectedYear}`, fetcher)

  const locations = locationsData?.locations || []

  const getZoneColor = (zone: string | null) => {
    switch (zone) {
      case "red":
        return "#ef4444"
      case "amber":
        return "#f59e0b"
      case "green":
        return "#10b981"
      default:
        return "#94a3b8"
    }
  }

  const getZoneBadgeVariant = (zone: string | null) => {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Crime Heatmap</h1>
          <p className="text-slate-600">Interactive map showing crime zones across locations</p>
        </div>

        {/* Year Selector */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
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

              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm text-slate-600">Red Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span className="text-sm text-slate-600">Amber Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-600">Green Zone</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Placeholder */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
              <CardDescription>Click on a location to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg h-[600px] relative">
                <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} className="h-full w-full rounded-lg">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {locations.map((loc: any) => (
                    loc.latitude && loc.longitude && (
                      <Marker
                        key={loc.locationId}
                        position={[loc.latitude, loc.longitude]}
                        eventHandlers={{
                          click: () => setSelectedLocation(loc),
                        }}
                        icon={L.divIcon({
                          className: `custom-div-icon bg-${getZoneColor(loc.zone_classification).replace('#', '')} rounded-full flex items-center justify-center text-white shadow-lg`,
                          html: '<div style="background-color: ' + getZoneColor(loc.zone_classification) + '; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="h-4 w-4 text-white" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"></path></svg></div>',
                          iconSize: [24, 24],
                          iconAnchor: [12, 24],
                          popupAnchor: [0, -20],
                        })}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-semibold">{loc.locationName || loc.city}</h3>
                            <p>Crimes in {selectedYear}: {loc.year_crime_count?.toLocaleString() || 0}</p>
                            <p>Zone: <Badge variant={getZoneBadgeVariant(loc.zone_classification)}>{loc.zone_classification?.toUpperCase() || "UNKNOWN"}</Badge></p>
                            <Link href={`/location/${loc.locationId}`} className="text-blue-600 hover:underline mt-2 inline-block">View Details</Link>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                {selectedLocation ? "Selected location information" : "Select a location on the map"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedLocation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-1">
                      {selectedLocation.locationName || selectedLocation.city}
                    </h3>
                    <p className="text-sm text-slate-600">{selectedLocation.city}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Zone Classification:</span>
                    <Badge variant={getZoneBadgeVariant(selectedLocation.zone_classification)}>
                      {selectedLocation.zone_classification?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Crimes in {selectedYear}:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedLocation.year_crime_count?.toLocaleString() || 0}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Crimes:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedLocation.totalCrimes?.toLocaleString() || 0}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Coordinates:</span>
                      <span className="font-mono text-xs text-slate-900">
                        {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button asChild className="w-full">
                      <Link href={`/location/${selectedLocation.locationId}`}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Detailed Analysis
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a location marker to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading map data...</p>
          </div>
        )}
      </div>
    </div>
  )
}
