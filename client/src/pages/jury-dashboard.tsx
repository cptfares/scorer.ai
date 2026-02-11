import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  ClipboardCheck,
  Star,
  LogOut,
  User,
  Eye
} from "lucide-react";

export default function JuryDashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: [`/api/jury-assignments?juryId=${user?.user?.id}`],
    enabled: !!user?.user?.id,
  });

  const { data: startups, isLoading: startupsLoading } = useQuery<any[]>({
    queryKey: ["/api/startups"],
  });

  const { data: evaluations } = useQuery<any[]>({
    queryKey: ["/api/evaluations"],
  });

  // Filter startups based on assignments - ONLY show if explicitly assigned
  const assignedStartupIds = Array.isArray(assignments) ? assignments.map((a: any) => a.startupId) : [];
  const assignedStartups = (Array.isArray(startups) && Array.isArray(assignments))
    ? startups.filter(s => assignedStartupIds.includes(s.id))
    : [];

  const myEvaluations = Array.isArray(evaluations) ? evaluations.filter((evaluation: any) =>
    evaluation.juryId === user?.user?.id
  ) : [];

  const completedEvaluations = myEvaluations.filter((e: any) => e.isCompleted).length;
  const totalAssigned = assignedStartups.length;
  const completionRate = totalAssigned > 0 ? Math.round((completedEvaluations / totalAssigned) * 100) : 0;

  const logout = async () => {
    // Standard fetch is fine here since it's a simple POST to logout
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-50))]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[hsl(var(--gray-200))]">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[hsl(var(--primary-500))] rounded-lg flex items-center justify-center">
                <ClipboardCheck className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--gray-700))]">StartupEval</h1>
                <p className="text-[hsl(var(--gray-500))]">Jury Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[hsl(var(--gray-300))] rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--gray-700))]">{user?.user?.name}</p>
                  <p className="text-xs text-[hsl(var(--gray-500))]">Jury Member</p>
                </div>
              </div>
              <Button variant="outline" onClick={logout} className="text-[hsl(var(--gray-600))]">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Welcome back, {user?.user?.name}
            </h2>
            <p className="text-slate-600">
              You have {assignedStartups.length} startups assigned for evaluation
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--gray-600))]">Assigned Startups</p>
                    <p className="text-3xl font-bold text-[hsl(var(--gray-700))] mt-2">
                      {totalAssigned}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Rocket className="text-[#0F7894]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--gray-600))]">Completed</p>
                    <p className="text-3xl font-bold text-[hsl(var(--gray-700))] mt-2">
                      {completedEvaluations}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--success-100))] rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="text-[hsl(var(--success-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--gray-600))]">Progress</p>
                    <p className="text-3xl font-bold text-[hsl(var(--gray-700))] mt-2">
                      {completionRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--info-100))] rounded-lg flex items-center justify-center">
                    <Star className="text-[hsl(var(--info-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[hsl(var(--gray-700))]">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--gray-600))]">Evaluation Progress</span>
                  <span className="font-medium text-[hsl(var(--gray-700))]">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
                <p className="text-xs text-[hsl(var(--gray-500))]">
                  {completedEvaluations} of {totalAssigned} evaluations completed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Startups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[hsl(var(--gray-700))]">Your Assigned Startups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedStartups.map((startup: any) => {
                  const evaluation = myEvaluations.find((e: any) => e.startupId === startup.id);
                  const isCompleted = evaluation?.isCompleted;

                  return (
                    <div key={startup.id} className="border border-[hsl(var(--gray-200))] rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[hsl(var(--primary-100))] rounded-lg flex items-center justify-center">
                            <span className="text-[hsl(var(--primary-600))] font-bold text-lg">
                              {startup.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-[hsl(var(--gray-700))]">{startup.name}</h3>
                            <p className="text-sm text-[hsl(var(--gray-500))]">{startup.category}</p>
                          </div>
                        </div>
                        <Badge
                          variant={isCompleted ? "default" : "secondary"}
                          className={cn(
                            isCompleted ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {isCompleted ? "Completed" : "Pending"}
                        </Badge>
                      </div>

                      <p className="text-sm text-[hsl(var(--gray-600))] mb-4 line-clamp-2">
                        {startup.description}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-[hsl(var(--gray-500))]">Stage:</span>
                          <span className="font-medium text-[hsl(var(--gray-700))]">{startup.stage}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[hsl(var(--gray-500))]">Team Size:</span>
                          <span className="font-medium text-[hsl(var(--gray-700))]">{startup.teamSize}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[hsl(var(--gray-500))]">Seeking:</span>
                          <span className="font-medium text-[hsl(var(--gray-700))]">{startup.fundingSeek}</span>
                        </div>
                      </div>

                      <Link href={`/evaluate/${startup.id}`}>
                        <Button
                          className="w-full bg-[#0F7894] hover:bg-[#0c6078] text-white shadow-md font-bold"
                        >
                          <Eye size={16} className="mr-2" />
                          {isCompleted ? "View Evaluation" : "Start Evaluation"}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {assignedStartups.length === 0 && (
                <div className="text-center py-12">
                  <Rocket className="mx-auto h-12 w-12 text-[hsl(var(--gray-400))] mb-4" />
                  <h3 className="text-lg font-medium text-[hsl(var(--gray-700))] mb-2">No startups assigned</h3>
                  <p className="text-[hsl(var(--gray-500))]">
                    You don't have any startups assigned for evaluation yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}