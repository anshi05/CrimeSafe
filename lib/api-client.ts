// Client-side API wrapper functions

export interface LocationForecastRequest {
  type: "location_forecast"
  location_id: string
  horizon_months: number
}

export interface PersonalizedRecommendRequest {
  type: "personalized_recommend"
  name: string
  age: number
  gender: string
  lat: number
  lon: number
  radius_km: number
  top_n: number
  year: number // Add year to the request interface
}

export async function trainModel() {
  const response = await fetch("/api/train", {
    method: "POST",
  })
  return response.json()
}

export async function getTrainingRuns() {
  const response = await fetch("/api/train")
  return response.json()
}

export async function evaluateModel() {
  const response = await fetch("/api/evaluate")
  return response.json()
}

export async function predictLocationForecast(request: LocationForecastRequest) {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })
  return response.json()
}

export async function getPersonalizedRecommendations(request: PersonalizedRecommendRequest) {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })
  return response.json()
}

export async function getLocationHistory(locationId: string) {
  const response = await fetch(`/api/location/${locationId}/history`)
  return response.json()
}

export async function getLocations(year?: number, city?: string) {
  const params = new URLSearchParams()
  if (year) params.append("year", year.toString())
  if (city) params.append("city", city)

  const response = await fetch(`/api/locations?${params.toString()}`)
  return response.json()
}
