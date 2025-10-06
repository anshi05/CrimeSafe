"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, PieChart, Map, TrendingUp, Users, Shield, Target, Activity, AlertTriangle } from "lucide-react"

export default function GraphicalAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Crime Data Graphical Analysis</h1>
          <p className="text-slate-600 text-lg">
            Comprehensive visual analysis of crime patterns, trends, and predictive models
          </p>
        </div>

        {/* Main Tabs for different analysis categories */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
             <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Predictive Models
            </TabsTrigger>
            <TabsTrigger value="demographics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demographics
            </TabsTrigger>
           
           
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Crime Trends & Top Cities Component */}
              <Card className="shadow-lg">
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Activity className="h-5 w-5" />
                    Crime Overview Dashboard
                  </CardTitle>
                  <CardDescription>
                    Monthly crime trends, top cities by crime count, crime types, and age distribution
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/images/graphs/monthly-trends-top-analysis.png" 
                        alt="Monthly Crime Trends & Top Analysis"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>• Monthly Crime Trends</div>
                      <div>• Top 15 Cities by Crime</div>
                      <div>• Top 10 Crime Types</div>
                      <div>• Victim Age Distribution</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Crime Distribution by Age Group and City */}
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <PieChart className="h-5 w-5" />
                    Crime Distribution Analysis
                  </CardTitle>
                  <CardDescription>
                    Crime distribution patterns across different genders.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                     <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
  <img 
    src="/images/graphs/top10-crime-prone-cities-distribution.png" 
    alt="Top 10 Crime Prone Cities & Distribution"
    className="w-full h-full object-cover"
  />
</div>
                   
                  </div>
                </CardContent>
              </Card>

              {/* Heatmap Component */}
              <Card className="shadow-lg">
                <CardHeader className="bg-red-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Map className="h-5 w-5" />
                    Crime Heatmap Analysis
                  </CardTitle>
                  <CardDescription>
                    Heatmap visualization of crimes by age group and geographic location
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/images/graphs/crime-heatmap-age-group-city.png" 
                        alt="Crime Heatmap: Age Group vs City"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Crime Prone Cities Component */}
              <Card className="shadow-lg">
                <CardHeader className="bg-amber-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    Top Crime Prone Cities Analysis
                  </CardTitle>
                  <CardDescription>
                    Analysis of top 10 crime-prone cities and crime distribution patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                   <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
  <img 
    src="/images/graphs/crime-distribution-age-group-city.png" 
    alt="Crime Distribution by Age Group & City"
    className="w-full h-full object-contain scale-80"
  />
</div>


                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>• Top 10 Crime Prone Cities</div>
                      <div>• Crime Distribution in Top Cities</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Crime Trend by City Over Years */}
              <Card className="shadow-lg">
                <CardHeader className="bg-purple-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <TrendingUp className="h-5 w-5" />
                    Crime Trends by City Over Years
                  </CardTitle>
                  <CardDescription>
                    Historical crime trends across different cities over multiple years
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/images/graphs/crime-trend-by-city-over-years.png" 
                        alt="Crime Trend by City Over Years"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Crime Distribution by Victim Gender, Types and Weapons */}
              <Card className="shadow-lg">
                <CardHeader className="bg-indigo-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-indigo-800">
                    <Users className="h-5 w-5" />
                    Victim Demographics & Crime Methods
                  </CardTitle>
                  <CardDescription>
                    Analysis of crime distribution by victim gender, crime types, and weapons used
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                   <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
  <img 
    src="/images/graphs/crime-gender-types-weapons.png" 
    alt="Crime by Gender, Types & Weapons"
    className="w-full h-full object-cover"
  />
</div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>• Victim Gender</div>
                      <div>• Crime Types</div>
                      <div>• Weapons Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

         
          {/* Predictive Models Tab */}
          <TabsContent value="predictive">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model Accuracy vs Error Tolerance */}
              <Card className="shadow-lg">
                <CardHeader className="bg-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Target className="h-5 w-5" />
                    Model Performance Analysis
                  </CardTitle>
                  <CardDescription>
                    Model accuracy metrics vs error tolerance thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/images/graphs/model-accuracy-error-tolerance.png" 
                        alt="Model Accuracy vs Error Tolerance"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Model Evaluation */}
              <Card className="shadow-lg">
                <CardHeader className="bg-orange-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Shield className="h-5 w-5" />
                    Predictive Model Evaluation
                  </CardTitle>
                  <CardDescription>
                    Distribution of predicted errors, actual vs predicted, and cumulative accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/images/graphs/model-evaluation-metrics.png" 
                        alt="Model Evaluation Metrics"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>• Predicted Errors Distribution</div>
                      <div>• Actual vs Predicted</div>
                      <div>• Cumulative Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Access Grid for All Visualizations */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">All Visualizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Visualization 1 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/monthly-trends-top-analysis.png" 
                    alt="Monthly Trends & Top Analysis"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center">
                  Monthly Trends & Top Analysis
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">4 combined graphs</p>
              </CardContent>
            </Card>

            {/* Visualization 2 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/crime-distribution-age-group-city.png" 
                    alt="Age Group & City Distribution"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center">
                  Age Group & City Distribution
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">Distribution analysis</p>
              </CardContent>
            </Card>

            {/* Visualization 3 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/crime-heatmap-age-group-city.png" 
                    alt="Crime Heatmap Analysis"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center">
                  Crime Heatmap Analysis
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">Geographic visualization</p>
              </CardContent>
            </Card>

            {/* Visualization 4 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/top10-crime-prone-cities-distribution.png" 
                    alt="Top Crime Prone Cities"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center ">
                  Top Crime Prone Cities
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">Male, Female, Others</p>
              </CardContent>
            </Card>

            {/* Visualization 5 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/crime-trend-by-city-over-years.png" 
                    alt="Crime Trends by City"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center">
                  Crime Trends by City
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">Multi-year analysis</p>
              </CardContent>
            </Card>

            {/* Visualization 6 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/crime-gender-types-weapons.png" 
                    alt="Victim Demographics"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center">
                  Victim Demographics
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">Gender, types & weapons</p>
              </CardContent>
            </Card>

            {/* Visualization 7 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/model-accuracy-error-tolerance.png" 
                    alt="Model Accuracy Analysis"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center">
                  Model Accuracy Analysis
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">Performance metrics</p>
              </CardContent>
            </Card>

            {/* Visualization 8 */}
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-3">
                  <img 
                    src="/images/graphs/model-evaluation-metrics.png" 
                    alt="Model Evaluation"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm text-center">
                  Model Evaluation
                </h3>
                <p className="text-xs text-slate-500 text-center mt-1">3 evaluation graphs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}