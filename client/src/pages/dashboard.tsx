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
import { queryClient } from "@/lib/queryClient";
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
  Eye
} from "lucide-react";

export default function Dashboard() {
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: startupScores, isLoading: scoresLoading } = useQuery({
    queryKey: ["/api/analytics/startup-scores"],
  });

  const { data: startups, isLoading: startupsLoading } = useQuery({
    queryKey: ["/api/startups"],
  });

  const { data: evaluations } = useQuery({
    queryKey: ["/api/evaluations"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: criteria } = useQuery({
    queryKey: ["/api/evaluation-criteria"],
  });

  const finalDecisionMutation = useMutation({
    mutationFn: async ({ startupId, decision }: { startupId: number; decision: 'accept' | 'reject' }) => {
      const response = await fetch(`/api/startups/${startupId}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalDecision: decision }),
      });
      if (!response.ok) throw new Error("Failed to update decision");
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
      const evalScores = Object.values(evaluation.scores || {}) as number[];
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

  // Loading states
  const isLoading = statsLoading || scoresLoading || startupsLoading;

  const rankedStartups = getStartupRanking();
  const totalEvaluations = Array.isArray(evaluations) ? evaluations.length : 0;
  const completedEvaluations = Array.isArray(evaluations) ? evaluations.filter((e: any) => e.isCompleted).length : 0;
  const avgScore = Array.isArray(evaluations) && evaluations.length ? 
    evaluations.reduce((sum: number, e: any) => {
      const scores = Object.values(e.scores || {}) as number[];
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
                                        {evaluation.scores?.[c.name] || 0}
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Startup Information</h4>
                  <p><strong>Industry:</strong> {selectedStartup.industry}</p>
                  <p><strong>Stage:</strong> {selectedStartup.stage}</p>
                  <p><strong>Team Size:</strong> {selectedStartup.teamSize}</p>
                  <p><strong>Founded:</strong> {selectedStartup.founded}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Evaluation Summary</h4>
                  <p><strong>Average Score:</strong> {formatScore(selectedStartup.averageScore)}</p>
                  <p><strong>Total Evaluations:</strong> {selectedStartup.evaluationCount}</p>
                  <p><strong>Status:</strong> {selectedStartup.finalDecision || 'Pending Decision'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Individual Jury Evaluations</h4>
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
                    {getStartupEvaluations(selectedStartup.id).map((evaluation: any) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">
                          {getJuryMemberName(evaluation.juryId)}
                        </TableCell>
                        {criteria?.map((c: any) => (
                          <TableCell key={c.id}>
                            {evaluation.scores?.[c.name] || 0}/5
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