import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, Eye, FileText, TrendingUp } from "lucide-react";
import { formatScore, getDecisionColor } from "@/lib/utils";

export default function Evaluations() {
  const { data: evaluations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/evaluations"],
  });

  const { data: startups } = useQuery<any[]>({
    queryKey: ["/api/startups"],
  });

  const { data: juryMembers } = useQuery<any[]>({
    queryKey: ["/api/users?role=jury"],
  });

  const completedEvaluations = evaluations?.filter((e: any) => e.isCompleted).length || 0;
  const totalPossible = (startups?.length || 0) * (juryMembers?.length || 0);
  const completionRate = totalPossible > 0 ? Math.round((completedEvaluations / totalPossible) * 100) : 0;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen">
        <Header
          title="Evaluations Overview"
          subtitle="Track evaluation progress and results"
        />

        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {evaluations?.length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--primary-100))] rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="text-[hsl(var(--primary-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {completedEvaluations}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--success-100))] rounded-lg flex items-center justify-center">
                    <FileText className="text-[hsl(var(--success-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {completionRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--info-100))] rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-[hsl(var(--info-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Score</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {evaluations?.length > 0 ?
                        evaluations.reduce((sum: number, e: any) => {
                          const scores = e.scores ? Object.values(e.scores) : [];
                          const avg = scores.length > 0 ? scores.reduce((a: any, b: any) => a + b, 0) / scores.length : 0;
                          return sum + avg;
                        }, 0) / evaluations.length : 0
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--warning-100))] rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-[hsl(var(--warning-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Progress by Startup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {startups?.map((startup: any) => {
                  const startupEvaluations = evaluations?.filter((e: any) => e.startupId === startup.id) || [];
                  const completed = startupEvaluations.filter((e: any) => e.isCompleted).length;
                  const total = juryMembers?.length || 0;
                  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
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
                      <div className="flex items-center space-x-4">
                        <div className="text-right min-w-[120px]">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[hsl(var(--success))] h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{progress}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{completed}/{total} evaluations</p>
                        </div>
                        <Link href={`/evaluate/${startup.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Evaluations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Startup</TableHead>
                    <TableHead>Jury Member</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations?.slice(0, 10).map((evaluation: any) => {
                    const startup = startups?.find((s: any) => s.id === evaluation.startupId);
                    const jury = juryMembers?.find((j: any) => j.id === evaluation.juryId);
                    const scores = evaluation.scores ? (Object.values(evaluation.scores) as any[]) : [];
                    const avgScore = scores.length > 0 ? scores.reduce((a: any, b: any) => a + b, 0) / scores.length : 0;

                    return (
                      <TableRow key={evaluation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{startup?.name || "Unknown"}</p>
                            <p className="text-sm text-gray-600">{startup?.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>{jury?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <span className="font-medium">{formatScore(avgScore)}</span>
                        </TableCell>
                        <TableCell>
                          {evaluation.decision && (
                            <Badge
                              variant="outline"
                              className={`decision-button ${evaluation.decision.toLowerCase()}`}
                            >
                              {evaluation.decision}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={evaluation.isCompleted ? "default" : "secondary"}>
                            {evaluation.isCompleted ? "Completed" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {evaluation.submittedAt ?
                            new Date(evaluation.submittedAt).toLocaleDateString() :
                            "Not submitted"
                          }
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
