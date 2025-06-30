import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScoreChart from "@/components/charts/score-chart";
import RadarChart from "@/components/charts/radar-chart";
import { 
  Rocket, 
  Users, 
  ClipboardCheck, 
  Star,
  TrendingUp,
  CheckCircle,
  Clock,
  MessageSquare,
  UserPlus
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: startupScores, isLoading: scoresLoading } = useQuery({
    queryKey: ["/api/analytics/startup-scores"],
  });

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ["/api/startups"],
  });

  const scoreChartData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [{
      label: "Number of Evaluations",
      data: [2, 8, 45, 78, 32],
      backgroundColor: [
        "hsl(var(--error))",
        "hsl(var(--warning))",
        "#6b7280",
        "hsl(var(--info))",
        "hsl(var(--success))"
      ]
    }]
  };

  const radarChartData = {
    labels: ["Market Opportunity", "Team Strength", "Product Innovation", "Business Model", "Scalability"],
    datasets: [{
      label: "Average Score",
      data: [4.2, 4.5, 3.8, 4.0, 3.9],
      backgroundColor: "hsla(var(--primary-500), 0.1)",
      borderColor: "hsl(var(--primary-500))",
      borderWidth: 2,
      pointBackgroundColor: "hsl(var(--primary-500))",
      pointBorderColor: "#fff",
      pointBorderWidth: 2
    }]
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen">
        <Header 
          title="Dashboard Overview" 
          subtitle="Cohort 2024 - Spring Program"
          showAddButton
        />
        
        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Startups</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats?.totalStartups || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Rocket className="text-[#0F7894] text-xl" size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[hsl(var(--success-600))] flex items-center">
                    <TrendingUp size={14} className="mr-1" />
                    +12%
                  </span>
                  <span className="text-gray-500 ml-2">vs last cohort</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jury</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">18</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="text-purple-600 text-xl" size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[hsl(var(--success-600))] flex items-center">
                    <CheckCircle size={14} className="mr-1" />
                    100%
                  </span>
                  <span className="text-gray-500 ml-2">response rate</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Evaluations</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats?.totalEvaluations || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="text-green-600 text-xl" size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[hsl(var(--warning-600))] flex items-center">
                    <Clock size={14} className="mr-1" />
                    78%
                  </span>
                  <span className="text-gray-500 ml-2">completed</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Score</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats?.avgScore ? stats.avgScore.toFixed(1) : "0.0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--chart-2),_0.2)] rounded-lg flex items-center justify-center">
                    <Star className="text-[hsl(var(--chart-2))] text-xl" size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[hsl(var(--success-600))] flex items-center">
                    <TrendingUp size={14} className="mr-1" />
                    +0.3
                  </span>
                  <span className="text-gray-500 ml-2">vs baseline</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Score Distribution</CardTitle>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary-500))]">
                    <option>All Startups</option>
                    <option>Tech Startups</option>
                    <option>Healthcare</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <ScoreChart data={scoreChartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Evaluation Progress</CardTitle>
                  <Button variant="ghost" size="sm" className="text-[hsl(var(--primary-600))]">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {startups?.slice(0, 3).map((startup: any) => (
                    <div key={startup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[hsl(var(--primary-100))] rounded-lg flex items-center justify-center">
                          <span className="text-[hsl(var(--primary-600))] font-bold">
                            {startup.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{startup.name}</p>
                          <p className="text-sm text-gray-600">{startup.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-[hsl(var(--success))] h-2 rounded-full" style={{width: "85%"}}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">85%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">15/18 evaluations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Dashboard Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <p className="text-gray-600 mt-1">Comprehensive performance insights and data visualization</p>
                </div>
                <div className="flex space-x-3">
                  <Button className="bg-[#0F7894] hover:bg-[#0c6078] text-white border-[#0F7894] shadow-sm">
                    Export Report
                  </Button>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary-500))]">
                    <option>Current Cohort</option>
                    <option>All Cohorts</option>
                    <option>Spring 2024</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Criteria Performance</h4>
                  <RadarChart data={radarChartData} />
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[hsl(var(--success-100))] rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="text-[hsl(var(--success-600))]" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Sarah Chen</span> completed evaluation for 
                          <span className="font-medium text-[hsl(var(--primary-600))]"> TechFlow AI</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[hsl(var(--info-100))] rounded-full flex items-center justify-center flex-shrink-0">
                        <UserPlus className="text-[hsl(var(--info-600))]" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          New jury member <span className="font-medium">Dr. Martinez</span> invited
                        </p>
                        <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[hsl(var(--warning-100))] rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="text-[hsl(var(--warning-600))]" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">James Wilson</span> added comment to 
                          <span className="font-medium text-[hsl(var(--primary-600))]"> HealthSync</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
