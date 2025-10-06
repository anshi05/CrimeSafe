# API Documentation

Complete reference for all CrimeSafe API endpoints.

## Base URL

\`\`\`
Development: http://localhost:3000
Production: https://your-domain.vercel.app
\`\`\`

## Authentication

Currently, the API does not require authentication. For production, consider adding API keys or OAuth.

## Endpoints

### 1. Get Locations

Retrieve location data with crime statistics.

**Endpoint:** `GET /api/locations`

**Query Parameters:**
- `year` (optional): Filter by year (2020-2024)
- `city` (optional): Filter by city name

**Example Request:**
\`\`\`bash
curl "https://your-domain.vercel.app/api/locations?year=2024&city=Mangalore"
\`\`\`

**Example Response:**
\`\`\`json
{
  "success": true,
  "locations": [
    {
      "locationId": 1,
      "locationName": "MG Road",
      "city": "Mangalore",
      "latitude": 12.9141,
      "longitude": 74.8560,
      "population": 50000,
      "totalCrimes": 1250,
      "year_crime_count": 245,
      "zone_classification": "amber"
    }
  ],
  "count": 1
}
\`\`\`

**Status Codes:**
- `200`: Success
- `500`: Server error

---

### 2. Get Location History

Retrieve detailed historical data for a specific location.

**Endpoint:** `GET /api/location/[id]/history`

**Path Parameters:**
- `id`: Location ID

**Example Request:**
\`\`\`bash
curl "https://your-domain.vercel.app/api/location/1/history"
\`\`\`

**Example Response:**
\`\`\`json
{
  "success": true,
  "location": {
    "id": 1,
    "name": "MG Road",
    "city": "Mangalore",
    "latitude": 12.9141,
    "longitude": 74.8560,
    "total_crimes": 1250
  },
  "monthly_data": [
    {
      "year": 2024,
      "month": 1,
      "crime_count": 20,
      "zone": "green"
    }
  ],
  "yearly_summary": [
    {
      "year": 2024,
      "total_crimes": 245,
      "avg_crime_count": 20.4,
      "red_months": 2,
      "amber_months": 5,
      "green_months": 5
    }
  ],
  "top_crime_types": [
    {
      "crime_description": "Theft",
      "count": 450
    }
  ]
}
\`\`\`

**Status Codes:**
- `200`: Success
- `404`: Location not found
- `500`: Server error

---

### 3. Train Model

Train the ML model on historical data.

**Endpoint:** `POST /api/train`

**Request Body:** None required

**Example Request:**
\`\`\`bash
curl -X POST "https://your-domain.vercel.app/api/train"
\`\`\`

**Example Response:**
\`\`\`json
{
  "success": true,
  "message": "Model training completed successfully",
  "model": {
    "version": "v1.0.0",
    "trained_at": "2024-01-15T10:30:00Z",
    "metrics": {
      "rmse": 5.23,
      "mae": 3.87,
      "r2_score": 0.85
    },
    "training_samples": 5000,
    "test_samples": 1250
  }
}
\`\`\`

**Status Codes:**
- `200`: Success
- `500`: Training failed

**Notes:**
- Training may take 30-60 seconds
- May timeout on Vercel free tier
- Consider training locally for production

---

### 4. Evaluate Model

Get current model performance metrics.

**Endpoint:** `GET /api/evaluate`

**Example Request:**
\`\`\`bash
curl "https://your-domain.vercel.app/api/evaluate"
\`\`\`

**Example Response:**
\`\`\`json
{
  "success": true,
  "evaluation": {
    "model_version": "v1.0.0",
    "trained_at": "2024-01-15T10:30:00Z",
    "metrics": {
      "rmse": 5.23,
      "mae": 3.87,
      "r2_score": 0.85,
      "classification_accuracy": 0.78
    },
    "test_period": "2024-01-01 to 2024-12-31",
    "test_samples": 1250
  }
}
\`\`\`

**Status Codes:**
- `200`: Success
- `404`: No trained model found
- `500`: Server error

---

### 5. Make Predictions

Make crime predictions using the trained model.

**Endpoint:** `POST /api/predict`

**Request Body Types:**

#### A. Single Location Prediction

\`\`\`json
{
  "type": "single_location",
  "location_id": 1,
  "year": 2025,
  "month": 1
}
\`\`\`

#### B. Batch Predictions

\`\`\`json
{
  "type": "batch_locations",
  "location_ids": [1, 2, 3],
  "year": 2025,
  "month": 1
}
\`\`\`

#### C. Personalized Recommendations

\`\`\`json
{
  "type": "personalized_recommend",
  "name": "John Doe",
  "age": 30,
  "gender": "male",
  "lat": 12.9141,
  "lon": 74.8560,
  "radius_km": 10,
  "top_n": 5
}
\`\`\`

**Example Request:**
\`\`\`bash
curl -X POST "https://your-domain.vercel.app/api/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "personalized_recommend",
    "name": "John Doe",
    "age": 30,
    "gender": "male",
    "lat": 12.9141,
    "lon": 74.8560,
    "radius_km": 10,
    "top_n": 5
  }'
\`\`\`

**Example Response (Personalized):**
\`\`\`json
{
  "success": true,
  "user_profile": {
    "name": "John Doe",
    "age": 30,
    "gender": "male",
    "search_location": [12.9141, 74.8560],
    "radius_km": 10
  },
  "recommendations": [
    {
      "location_id": 5,
      "location_name": "Kadri Park",
      "latitude": 12.9200,
      "longitude": 74.8600,
      "distance_km": 2.3,
      "safety_score": 15.2,
      "avg_crime_count": 8.5,
      "zone_classification": "green",
      "confidence": 0.89,
      "explanation": "This area has consistently low crime rates..."
    }
  ],
  "total_locations_analyzed": 25
}
\`\`\`

**Status Codes:**
- `200`: Success
- `400`: Invalid request body
- `404`: No trained model or location not found
- `500`: Prediction failed

---

## Error Responses

All endpoints return errors in this format:

\`\`\`json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
\`\`\`

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:

- 100 requests per minute per IP
- 1000 requests per hour per IP
- Special limits for training endpoint

## Data Formats

### Date Format
ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`

### Coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180

### Gender Values
- `male`
- `female`
- `other`

### Zone Classifications
- `red`: High crime rate
- `amber`: Moderate crime rate
- `green`: Low crime rate

## Best Practices

1. **Caching**: Cache location data for 5-10 minutes
2. **Batch Requests**: Use batch endpoints when possible
3. **Error Handling**: Always check `success` field
4. **Timeouts**: Set reasonable timeouts (30s for predictions)
5. **Retry Logic**: Implement exponential backoff for failures

## Examples

### JavaScript/TypeScript

\`\`\`typescript
async function getLocations(year: number) {
  const response = await fetch(
    `https://your-domain.vercel.app/api/locations?year=${year}`
  )
  const data = await response.json()
  
  if (data.success) {
    return data.locations
  } else {
    throw new Error(data.error)
  }
}
\`\`\`

### Python

\`\`\`python
import requests

def get_recommendations(user_data):
    url = "https://your-domain.vercel.app/api/predict"
    response = requests.post(url, json=user_data)
    
    if response.ok:
        data = response.json()
        if data['success']:
            return data['recommendations']
    
    raise Exception("Failed to get recommendations")
\`\`\`

### cURL

\`\`\`bash
# Get locations
curl "https://your-domain.vercel.app/api/locations?year=2024"

# Make prediction
curl -X POST "https://your-domain.vercel.app/api/predict" \
  -H "Content-Type: application/json" \
  -d '{"type":"single_location","location_id":1,"year":2025,"month":1}'
\`\`\`

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- All core endpoints implemented
- Basic error handling

---

For questions or issues, please open a GitHub issue.
