# Deployment Guide

This guide covers deploying CrimeSafe to production using Vercel and Neon PostgreSQL.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Neon account (free tier works)
- Domain name (optional)

## Step 1: Database Setup

### Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project: "crimesafe-production"
3. Copy the connection string
4. Note: Keep this secure!

### Run Migrations

1. Connect to your Neon database using a SQL client
2. Execute the SQL scripts in order:
   - `scripts/create_tables.sql`
   - Any seed data scripts

### Verify Database

\`\`\`sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check data
SELECT COUNT(*) FROM locations;
SELECT COUNT(*) FROM crimes;
\`\`\`

## Step 2: Prepare Repository

### Push to GitHub

\`\`\`bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote
git remote add origin https://github.com/yourusername/crimesafe.git

# Push
git push -u origin main
\`\`\`

### Environment Variables

Create a `.env.example` file for documentation:

\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Optional: Mapbox
NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_api_key
\`\`\`

## Step 3: Vercel Deployment

### Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select "crimesafe" repository

### Configure Project

**Framework Preset:** Next.js

**Root Directory:** ./

**Build Command:** `npm run build`

**Output Directory:** .next

**Install Command:** `npm install`

### Add Environment Variables

In Vercel project settings:

1. Go to Settings → Environment Variables
2. Add the following:

\`\`\`
DATABASE_URL = your_neon_connection_string
\`\`\`

3. Select all environments (Production, Preview, Development)
4. Click "Save"

### Deploy

1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Visit your deployment URL

## Step 4: Train Initial Model

### Option 1: Local Training, Upload Results

\`\`\`bash
# Train locally
python scripts/train_model.py

# Model metadata is stored in database
# Verify in Neon console
\`\`\`

### Option 2: API Endpoint

\`\`\`bash
# Call training endpoint
curl -X POST https://your-app.vercel.app/api/train
\`\`\`

Note: Training via API may timeout on Vercel's free tier (10s limit). Consider:
- Training locally and storing results
- Using Vercel Pro for longer timeouts
- Setting up a separate training service

## Step 5: Verify Deployment

### Test Endpoints

\`\`\`bash
# Test locations endpoint
curl https://your-app.vercel.app/api/locations?year=2024

# Test evaluation endpoint
curl https://your-app.vercel.app/api/evaluate

# Test prediction endpoint
curl -X POST https://your-app.vercel.app/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "type": "single_location",
    "location_id": 1,
    "year": 2025,
    "month": 1
  }'
\`\`\`

### Test UI

1. Visit your deployment URL
2. Navigate to Dashboard
3. Check Map page
4. Test Safe-Area Finder
5. View Location Details

## Step 6: Custom Domain (Optional)

### Add Domain

1. Go to Vercel project settings
2. Navigate to Domains
3. Add your domain
4. Follow DNS configuration instructions

### Update Environment Variables

If using custom domain, update any hardcoded URLs:

\`\`\`env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
\`\`\`

## Step 7: Performance Optimization

### Database Indexes

Ensure indexes are created for performance:

\`\`\`sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_crimes_location_date 
ON crimes(locationId, crimeDate);

CREATE INDEX IF NOT EXISTS idx_crimes_date 
ON crimes(crimeDate);

CREATE INDEX IF NOT EXISTS idx_aggregates_location_year 
ON crime_aggregates(locationId, year, month);
\`\`\`

### Vercel Configuration

Create `vercel.json` for optimization:

\`\`\`json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
\`\`\`

## Step 8: Monitoring

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor page views and performance
3. Track Core Web Vitals

### Database Monitoring

1. Use Neon dashboard for query performance
2. Monitor connection pool usage
3. Set up alerts for high usage

### Error Tracking

Consider adding error tracking:

\`\`\`bash
npm install @vercel/analytics
\`\`\`

Update `app/layout.tsx`:

\`\`\`typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
\`\`\`

## Step 9: Security

### Environment Variables

- Never commit `.env` files
- Use Vercel's environment variable encryption
- Rotate database credentials periodically

### Database Security

- Use connection pooling
- Enable SSL for database connections
- Restrict database access by IP (if possible)

### API Security

Consider adding:

\`\`\`typescript
// Rate limiting
import rateLimit from 'express-rate-limit'

// CORS configuration
const allowedOrigins = ['https://yourdomain.com']
\`\`\`

## Step 10: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Pushes to `main` branch
- **Preview:** Pull requests and other branches

### Deployment Protection

1. Enable deployment protection in Vercel
2. Require approval for production deployments
3. Set up branch protection rules in GitHub

## Troubleshooting

### Build Failures

**Issue:** Build fails with module errors

**Solution:**
\`\`\`bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
\`\`\`

### Database Connection Issues

**Issue:** Cannot connect to database

**Solution:**
- Verify DATABASE_URL is correct
- Check Neon database is active
- Ensure connection string includes SSL parameters

### API Timeouts

**Issue:** Training endpoint times out

**Solution:**
- Train model locally
- Use Vercel Pro for longer timeouts
- Split training into smaller batches

### Missing Data

**Issue:** Dashboard shows no data

**Solution:**
- Verify database has data
- Check API endpoints return data
- Review browser console for errors

## Maintenance

### Regular Tasks

- **Weekly:** Review error logs
- **Monthly:** Update dependencies
- **Quarterly:** Retrain ML model with new data
- **Yearly:** Review and optimize database

### Updates

\`\`\`bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
\`\`\`

## Scaling Considerations

### Database

- Monitor query performance
- Add indexes as needed
- Consider read replicas for high traffic

### API

- Implement caching strategies
- Use CDN for static assets
- Consider API rate limiting

### ML Model

- Schedule regular retraining
- Version control for models
- A/B test model improvements

## Support

For deployment issues:
- Check Vercel documentation
- Review Neon documentation
- Open GitHub issue
- Contact support teams

---

Deployment checklist:
- [ ] Database created and migrated
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Initial deployment successful
- [ ] ML model trained
- [ ] All pages tested
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled
- [ ] Security measures implemented
