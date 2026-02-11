import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatScore, getDecisionColor } from "@/lib/utils";
import {
  Rocket,
  Users,
  ClipboardCheck,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  UserPlus,
  Award,
  BarChart3,
  Eye,
  Info
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";

export default function Dashboard() {
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: startupScores, isLoading: scoresLoading } = useQuery<any[]>({
    queryKey: ["/api/analytics/startup-scores"],
  });

  const { data: startups, isLoading: startupsLoading } = useQuery<any[]>({
    queryKey: ["/api/startups"],
  });

  const { data: evaluations } = useQuery<any[]>({
    queryKey: ["/api/evaluations"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: criteria } = useQuery<any[]>({
    queryKey: ["/api/evaluation-criteria"],
  });

  const finalDecisionMutation = useMutation({
    mutationFn: async ({ startupId, decision }: { startupId: number; decision: 'accept' | 'reject' }) => {
      const response = await apiRequest("PATCH", `/api/startups/${startupId}/decision`, { finalDecision: decision });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      toast({
        title: "Decision Updated",
        description: "Final decision has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions for data processing
  const getStartupEvaluations = (startupId: number) => {
    return Array.isArray(evaluations) ? evaluations.filter((evaluation: any) => evaluation.startupId === startupId) : [];
  };

  const getStartupAverageScore = (startupId: number) => {
    const startupEvals = getStartupEvaluations(startupId);
    if (!startupEvals.length) return 0;

    const totalScore = startupEvals.reduce((sum: number, evaluation: any) => {
      if (!evaluation.scores || typeof evaluation.scores !== 'object') return sum;
      const evalScores = Object.values(evaluation.scores) as number[];
      if (evalScores.length === 0) return sum;
      const avgScore = evalScores.reduce((a: number, b: number) => a + b, 0) / evalScores.length;
      return sum + avgScore;
    }, 0);

    return startupEvals.length > 0 ? totalScore / startupEvals.length : 0;
  };

  const getStartupRanking = () => {
    if (!startups || !Array.isArray(startups)) return [];

    return [...startups]
      .map((startup: any) => ({
        ...startup,
        averageScore: getStartupAverageScore(startup.id),
        evaluationCount: getStartupEvaluations(startup.id).length,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  };

  const getCriteriaScores = (startupId: number, criteriaName: string) => {
    const startupEvals = getStartupEvaluations(startupId);
    return startupEvals.map((evaluation: any) => evaluation.scores?.[criteriaName] || 0);
  };

  const getJuryMemberName = (juryId: number) => {
    const jury = Array.isArray(users) ? users.find((user: any) => user.id === juryId) : undefined;
    return jury ? jury.name || jury.email : `Jury Member ${juryId}`;
  };

  const getRadarData = (startupId: number) => {
    if (!criteria || !Array.isArray(criteria) || !evaluations || !Array.isArray(evaluations)) return [];

    const startupEvals = evaluations.filter((e: any) => e.startupId === startupId);
    if (startupEvals.length === 0) return [];

    return criteria.map((c: any) => {
      const scores = startupEvals.map((e: any) => e.scores?.[c.id.toString()] || 0);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return {
        subject: c.name,
        A: avg,
        fullMark: 5,
      };
    });
  };

  // Loading states
  const isLoading = statsLoading || scoresLoading || startupsLoading;

  const rankedStartups = getStartupRanking();
  const totalEvaluations = Array.isArray(evaluations) ? evaluations.length : 0;
  const completedEvaluations = Array.isArray(evaluations) ? evaluations.filter((e: any) => e.isCompleted).length : 0;
  const avgScore = Array.isArray(evaluations) && evaluations.length ?
    evaluations.reduce((sum: number, e: any) => {
      if (!e.scores || typeof e.scores !== 'object') return sum;
      const scores = Object.values(e.scores) as number[];
      const scoreAvg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
      return sum + scoreAvg;
    }, 0) / evaluations.length : 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F7894] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen">
        <Header
          title="Analytics & Decision Center"
          subtitle="Review evaluations and make final startup decisions"
        />

        <div className="p-8 space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Startups</p>
                    <p className="text-3xl font-bold text-gray-900">{(stats as any)?.totalStartups || (Array.isArray(startups) ? startups.length : 0)}</p>
                  </div>
                  <div className="h-12 w-12 bg-[#0F7894]/10 rounded-lg flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-[#0F7894]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
                    <p className="text-3xl font-bold text-gray-900">{totalEvaluations}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{totalEvaluations ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0}%</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">{formatScore(avgScore)}</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Tabs */}
          <Tabs defaultValue="rankings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rankings">Startup Rankings</TabsTrigger>
              <TabsTrigger value="evaluations">Detailed Evaluations</TabsTrigger>
              <TabsTrigger value="decisions">Final Decisions</TabsTrigger>
            </TabsList>

            {/* Startup Rankings Tab */}
            <TabsContent value="rankings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Startup Rankings by Average Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Startup</TableHead>
                        <TableHead>Average Score</TableHead>
                        <TableHead>Evaluations</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(rankedStartups) && rankedStartups.map((startup: any, index: number) => (
                        <TableRow key={startup.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">#{index + 1}</span>
                              {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{startup.name}</p>
                              <p className="text-sm text-gray-500">{startup.category || startup.industry || 'No category'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{formatScore(startup.averageScore)}</span>
                              <div className="w-16">
                                <Progress value={(startup.averageScore / 5) * 100} className="h-2" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {startup.evaluationCount} evaluations
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={startup.finalDecision === 'accept' ? 'default' :
                                startup.finalDecision === 'reject' ? 'destructive' : 'secondary'}
                            >
                              {startup.finalDecision || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStartup(startup)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Detailed Evaluations Tab */}
            <TabsContent value="evaluations" className="space-y-6">
              <div className="grid gap-6">
                {Array.isArray(rankedStartups) && rankedStartups.map((startup: any) => {
                  const startupEvals = getStartupEvaluations(startup.id);
                  return (
                    <Card key={startup.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{startup.name} - Jury Evaluations</span>
                          <Badge variant="outline">{startupEvals.length} evaluations</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Jury Member</TableHead>
                              {Array.isArray(criteria) && criteria.map((c: any) => (
                                <TableHead key={c.id}>{c.name}</TableHead>
                              ))}
                              <TableHead>Average</TableHead>
                              <TableHead>Decision</TableHead>
                              <TableHead>Comments</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {startupEvals.map((evaluation: any) => {
                              const evalScores = Object.values(evaluation.scores || {}) as number[];
                              const avgScore = evalScores.reduce((a: number, b: number) => a + b, 0) / evalScores.length;

                              return (
                                <TableRow key={evaluation.id}>
                                  <TableCell className="font-medium">
                                    {getJuryMemberName(evaluation.juryId)}
                                  </TableCell>
                                  {Array.isArray(criteria) && criteria.map((c: any) => (
                                    <TableCell key={c.id}>
                                      <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        {evaluation.scores?.[c.id.toString()] || 0}
                                      </div>
                                    </TableCell>
                                  ))}
                                  <TableCell>
                                    <span className="font-semibold">{formatScore(avgScore)}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={getDecisionColor(evaluation.decision)}
                                    >
                                      {evaluation.decision}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <p className="text-sm truncate" title={evaluation.comments}>
                                      {evaluation.comments || "No comments"}
                                    </p>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Final Decisions Tab */}
            <TabsContent value="decisions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Make Final Decisions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Startup</TableHead>
                        <TableHead>Average Score</TableHead>
                        <TableHead>Evaluations</TableHead>
                        <TableHead>Jury Recommendations</TableHead>
                        <TableHead>Current Status</TableHead>
                        <TableHead>Final Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankedStartups.map((startup: any) => {
                        const startupEvals = getStartupEvaluations(startup.id);
                        const recommendations = startupEvals.reduce((acc: any, evaluation: any) => {
                          acc[evaluation.decision] = (acc[evaluation.decision] || 0) + 1;
                          return acc;
                        }, {});

                        return (
                          <TableRow key={startup.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{startup.name}</p>
                                <p className="text-sm text-gray-500">{startup.industry}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{formatScore(startup.averageScore)}</span>
                                <div className="w-16">
                                  <Progress value={(startup.averageScore / 5) * 100} className="h-2" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {startup.evaluationCount} evaluations
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {recommendations.yes && (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    {recommendations.yes} Yes
                                  </Badge>
                                )}
                                {recommendations.maybe && (
                                  <Badge variant="secondary">
                                    {recommendations.maybe} Maybe
                                  </Badge>
                                )}
                                {recommendations.no && (
                                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                                    {recommendations.no} No
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={startup.finalDecision === 'accept' ? 'default' :
                                  startup.finalDecision === 'reject' ? 'destructive' : 'secondary'}
                              >
                                {startup.finalDecision || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => finalDecisionMutation.mutate({
                                    startupId: startup.id,
                                    decision: 'accept'
                                  })}
                                  disabled={finalDecisionMutation.isPending || startup.finalDecision === 'accept'}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => finalDecisionMutation.mutate({
                                    startupId: startup.id,
                                    decision: 'reject'
                                  })}
                                  disabled={finalDecisionMutation.isPending || startup.finalDecision === 'reject'}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Startup Details Modal */}
      {selectedStartup && (
        <Dialog open={!!selectedStartup} onOpenChange={() => setSelectedStartup(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedStartup.name} - Detailed Analysis</DialogTitle>
            </DialogHeader>
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Analytics */}
                <div className="lg:col-span-7">
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 h-full flex flex-col">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#0F7894]" />
                      Performance Radar
                    </h4>
                    <div className="flex-1 min-h-[350px] w-full items-center justify-center flex">
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(selectedStartup.id)}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 5]}
                            tick={{ fill: '#94a3b8' }}
                          />
                          <Radar
                            name={selectedStartup.name}
                            dataKey="A"
                            stroke="#0F7894"
                            fill="#0F7894"
                            fillOpacity={0.6}
                          />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 text-center italic">
                      Visual representation of average jury scores across all criteria
                    </div>
                  </div>
                </div>

                {/* Score Summary Cards */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 h-full">
                    <Card className="shadow-none border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                          <Rocket className="h-4 w-4" />
                          Startup Snapshot
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-sm text-slate-600">Industry</span>
                          <Badge variant="secondary" className="font-normal">{selectedStartup.industry}</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-sm text-slate-600">Stage</span>
                          <span className="text-sm font-medium">{selectedStartup.stage}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-sm text-slate-600">Team Size</span>
                          <span className="text-sm font-medium">{selectedStartup.teamSize}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-sm text-slate-600">Founded</span>
                          <span className="text-sm font-medium">{selectedStartup.founded}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Evaluation Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Average Overall</p>
                            <p className="text-3xl font-bold text-[#0F7894]">{formatScore(selectedStartup.averageScore)}</p>
                          </div>
                          <div className="h-12 w-12 bg-[#0F7894]/10 rounded-full flex items-center justify-center">
                            <Star className="h-6 w-6 text-[#0F7894] fill-[#0F7894]/20" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                            <span>Score Distribution</span>
                            <span>{Math.round((selectedStartup.averageScore / 5) * 100)}%</span>
                          </div>
                          <Progress value={(selectedStartup.averageScore / 5) * 100} className="h-2 bg-slate-100" />
                        </div>

                        <div className="pt-2">
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <ClipboardCheck className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-600">Total Jury Reviews</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900">{selectedStartup.evaluationCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Info className="h-5 w-5 text-slate-400" />
                    Individual Review Breakdown
                  </h4>
                  <Badge variant="outline" className="text-slate-500 border-slate-200">
                    {selectedStartup.evaluationCount} Responses
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jury Member</TableHead>
                      {criteria?.map((c: any) => (
                        <TableHead key={c.id}>{c.name}</TableHead>
                      ))}
                      <TableHead>Decision</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(getStartupEvaluations(selectedStartup.id)) && getStartupEvaluations(selectedStartup.id).map((evaluation: any) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">
                          {getJuryMemberName(evaluation.juryId)}
                        </TableCell>
                        {Array.isArray(criteria) && criteria.map((c: any) => (
                          <TableCell key={c.id}>
                            {evaluation.scores?.[c.id.toString()] || 0}/5
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge variant="outline" className={getDecisionColor(evaluation.decision)}>
                            {evaluation.decision}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {evaluation.comments || "No comments"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}