# CrimeSafe - Crime Analysis & Prediction Platform

A comprehensive full-stack application for analyzing crime patterns, predicting future trends, and providing personalized safety recommendations using machine learning.

## Features

### 1. Interactive Dashboard
- Real-time crime statistics and trends
- Zone classification (Red/Amber/Green) based on crime rates
- Top high-crime locations visualization
- ML model performance metrics

### 2. Crime Heatmap
- Interactive map showing crime zones across locations
- Year-based filtering
- Detailed location information
- Color-coded safety zones

### 3. Personalized Safe-Area Finder
- Demographic-aware recommendations (age, gender)
- Radius-based location search
- Safety scores and confidence intervals
- Explainable AI with detailed reasoning

### 4. Location Analysis
- Historical crime trends (2020-2024)
- Monthly and yearly crime patterns
- Top crime types breakdown
- Zone classification over time

### 5. ML-Powered Predictions
- XGBoost regression for crime forecasting
- Prophet time-series analysis
- SHAP values for model explainability
- Confidence intervals for predictions

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **SWR** - Data fetching and caching

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Neon PostgreSQL** - Serverless database
- **Python** - ML training pipeline
- **XGBoost** - Gradient boosting for predictions
- **Prophet** - Time-series forecasting
- **SHAP** - Model explainability

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Neon PostgreSQL database

### Installation

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd crimesafe
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

\`\`\`env
# Database
DATABASE_URL=your_neon_database_url

# Optional: Mapbox for full map features
NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_api_key
\`\`\`

4. **Set up the database**

Run the SQL scripts to create tables and seed data:

\`\`\`bash
# The scripts are in the /scripts folder
# Execute them in order:
# 1. create_tables.sql
# 2. seed_data.sql (if available)
\`\`\`

You can run these directly from the v0 interface or use your database client.

5. **Train the ML model**

\`\`\`bash
# Run the training script
node --experimental-strip-types scripts/train-model.ts
\`\`\`

Or execute the Python training script directly:

\`\`\`bash
python scripts/train_model.py
\`\`\`

6. **Start the development server**

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
crimesafe/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── dashboard/           # Dashboard page
│   ├── map/                 # Heatmap page
│   ├── predict/             # Safe-area finder
│   ├── location/[id]/       # Location details
│   ├── api/                 # API routes
│   │   ├── train/           # Model training endpoint
│   │   ├── predict/         # Prediction endpoint
│   │   ├── evaluate/        # Model evaluation
│   │   ├── locations/       # Location data
│   │   └── location/[id]/   # Location history
│   └── layout.tsx           # Root layout
├── components/              # React components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utility functions
│   ├── db.ts               # Database client
│   └── api-client.ts       # API client functions
├── scripts/                 # Executable scripts
│   ├── create_tables.sql   # Database schema
│   └── train_model.py      # ML training pipeline
└── README.md               # This file
\`\`\`

## API Endpoints

### Training & Evaluation

**POST /api/train**
- Trains the ML model on historical data
- Returns model metrics and version info

**GET /api/evaluate**
- Evaluates model performance on test data
- Returns RMSE, MAE, and classification accuracy

### Predictions

**POST /api/predict**
- Makes crime predictions for locations
- Supports multiple prediction types:
  - `single_location`: Predict for one location
  - `batch_locations`: Predict for multiple locations
  - `personalized_recommend`: Get personalized safe-area recommendations

### Data Retrieval

**GET /api/locations**
- Query parameters: `year`, `city`
- Returns location data with crime statistics

**GET /api/location/[id]/history**
- Returns detailed historical data for a specific location
- Includes monthly trends, yearly summaries, and top crime types

## Database Schema

### Tables

**locations**
- `locationId` (PK): Unique location identifier
- `locationName`: Location name
- `city`: City name
- `latitude`, `longitude`: Coordinates
- `population`: Population estimate

**crimes**
- `crimeId` (PK): Unique crime identifier
- `locationId` (FK): Reference to location
- `crimeDate`: Date of crime
- `crimeType`: Type of crime
- `crimeDescription`: Detailed description
- `victimAge`: Victim's age
- `victimGender`: Victim's gender

**crime_aggregates**
- Pre-computed monthly aggregates for performance
- Includes crime counts and zone classifications

**ml_models**
- Stores trained model metadata
- Version tracking and performance metrics

**predictions**
- Stores prediction results
- Includes confidence intervals and SHAP values

## ML Pipeline

### Training Process

1. **Data Preparation**
   - Fetch historical crime data (2020-2023)
   - Aggregate by location and month
   - Engineer features (trends, seasonality, demographics)

2. **Model Training**
   - XGBoost for regression (crime count prediction)
   - Prophet for time-series forecasting
   - Train/test split (80/20)

3. **Evaluation**
   - RMSE and MAE for regression
   - Classification accuracy for zone prediction
   - SHAP values for explainability

4. **Model Storage**
   - Save model metadata to database
   - Store feature importance and SHAP values

### Prediction Types

**Single Location Prediction**
\`\`\`json
{
  "type": "single_location",
  "location_id": 1,
  "year": 2025,
  "month": 1
}
\`\`\`

**Personalized Recommendations**
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

## Zone Classification

Locations are classified into three safety zones based on crime rates:

- **Green Zone**: Low crime rate (< 33rd percentile)
- **Amber Zone**: Moderate crime rate (33rd - 66th percentile)
- **Red Zone**: High crime rate (> 66th percentile)

Classification considers:
- Historical crime counts
- Crime trends
- Demographic factors
- Seasonal patterns

## Personalized Recommendations

The recommendation system considers:

1. **Demographic Weighting**
   - Crimes affecting similar age groups weighted higher
   - Gender-specific crime patterns considered

2. **Distance Calculation**
   - Haversine formula for accurate distance
   - Radius-based filtering

3. **Safety Scoring**
   - Combines crime rate, trends, and demographic factors
   - Normalized to 0-100 scale

4. **Explainability**
   - SHAP values explain feature contributions
   - Human-readable explanations generated

## Testing

### Manual Testing

Test the API endpoints using the provided test script:

\`\`\`bash
node scripts/test-api.ts
\`\`\`

### Test Scenarios

1. **Dashboard Loading**
   - Navigate to `/dashboard`
   - Select different years and cities
   - Verify statistics update correctly

2. **Map Interaction**
   - Navigate to `/map`
   - Click on location markers
   - Verify details panel updates

3. **Safe-Area Finder**
   - Navigate to `/predict`
   - Fill in personal information
   - Use preset locations or custom coordinates
   - Verify recommendations appear

4. **Location Details**
   - Click on any location from map or dashboard
   - Verify historical charts load
   - Check yearly comparisons

## Performance Optimization

- **Database Indexing**: Indexes on frequently queried columns
- **Data Aggregation**: Pre-computed monthly aggregates
- **SWR Caching**: Client-side data caching
- **Lazy Loading**: Components load on demand
- **Responsive Design**: Mobile-first approach

## Security Considerations

- **SQL Injection**: Parameterized queries used throughout
- **Input Validation**: All user inputs validated
- **Rate Limiting**: Consider adding for production
- **Environment Variables**: Sensitive data in env vars
- **CORS**: Configure for production domains

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Setup

1. Create Neon database
2. Run migration scripts
3. Seed with initial data
4. Train initial model

## Future Enhancements

- [ ] Real-time crime data integration
- [ ] Mobile app (React Native)
- [ ] Advanced map features with Mapbox
- [ ] User accounts and saved preferences
- [ ] Email alerts for high-crime areas
- [ ] Multi-language support
- [ ] Crime reporting feature
- [ ] Integration with local police APIs

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes. Please ensure compliance with local data privacy laws when using crime data.

## Support

For issues or questions:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

## Acknowledgments

- Crime data sources (specify your sources)
- Open-source libraries and frameworks
- Community contributors

---

Built with Next.js, TypeScript, and Machine Learning
