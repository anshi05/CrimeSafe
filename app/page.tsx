import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Map, TrendingUp, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            AI-Powered Crime Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 text-balance">
            CrimeSafe: Your Personal Safety Intelligence Platform
          </h1>
          <p className="text-xl text-slate-600 mb-8 text-pretty">
            Analyze crime patterns, predict future trends, and discover safer areas with advanced machine learning and
            personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg bg-transparent">
              <Link href="/predict">Find Safe Areas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Map className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Interactive Maps</CardTitle>
              <CardDescription>
                Visualize crime hotspots with color-coded heatmaps showing red, amber, and green zones across years
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>
                ML-powered forecasting using XGBoost and Prophet to predict future crime rates with confidence intervals
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Personalized Safety</CardTitle>
              <CardDescription>
                Get tailored recommendations based on your age, gender, and location preferences with demographic
                analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Explainable AI</CardTitle>
              <CardDescription>
                Understand predictions with SHAP values and feature importance showing why areas are classified as safe
                or risky
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">2020-2024</div>
                <div className="text-blue-100">Years of Data</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">ML-Powered</div>
                <div className="text-blue-100">Predictions</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Real-Time</div>
                <div className="text-blue-100">Analysis</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to explore safer areas?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Start analyzing crime data and get personalized safety recommendations for your area.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
