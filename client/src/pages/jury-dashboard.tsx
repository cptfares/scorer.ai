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
  Eye,
  ListOrdered,
  Table2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logo from "@/assets/logo.png";

export default function JuryDashboard() {
  const { data: user } = useQuery<{ user: { id: number, name: string, role: string } } | null>({
    queryKey: ["/api/auth/me"],
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: [`/api/jury-assignments?juryId=${user?.user?.id}`],
    enabled: !!user?.user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jury-assignments?juryId=${user?.user?.id}`);
      return res.json();
    }
  });

  const { data: startups, isLoading: startupsLoading } = useQuery<any[]>({
    queryKey: ["/api/startups"],
  });

  const { data: evaluations } = useQuery<any[]>({
    queryKey: ["/api/evaluations"],
  });

  // Get unique round IDs from assignments
  const roundIds = [...new Set((assignments || []).filter((a: any) => a.roundId).map((a: any) => a.roundId))];

  // Fetch all rounds the jury is assigned to
  const { data: rounds = [] } = useQuery<any[]>({
    queryKey: ["jury-rounds", roundIds],
    enabled: roundIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(roundIds.map(async (rid) => {
        const res = await apiRequest("GET", `/api/rounds/${rid}`);
        return res.json();
      }));
      return results.filter(Boolean);
    }
  });

  // Assignments grouped by round (roundId or null for legacy)
  const assignmentsByRound: Record<string, any[]> = {};
  (assignments || []).forEach((a: any) => {
    const key = a.roundId ? String(a.roundId) : "legacy";
    if (!assignmentsByRound[key]) assignmentsByRound[key] = [];
    assignmentsByRound[key].push(a);
  });

  // For summary stats - flat list of assigned startup IDs
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
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                <img src={logo} alt="Scorer Ai Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--gray-700))]">Scorer Ai</h1>
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

          {/* Assignments grouped by round */}
          {Object.keys(assignmentsByRound).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Rocket className="mx-auto h-12 w-12 text-[hsl(var(--gray-400))] mb-4" />
                <h3 className="text-lg font-medium text-[hsl(var(--gray-700))] mb-2">No startups assigned</h3>
                <p className="text-[hsl(var(--gray-500))]">You don't have any startups assigned for evaluation yet.</p>
              </CardContent>
            </Card>
          ) : Object.entries(assignmentsByRound).map(([roundKey, roundAssignments]: [string, any[]]) => {
            const round = rounds.find((r: any) => String(r.id) === roundKey);
            const roundStartupIds = roundAssignments.map((a: any) => a.startupId);
            const roundStartups = (startups || []).filter((s: any) => roundStartupIds.includes(s.id));

            return (
              <Card key={roundKey}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-[hsl(var(--gray-700))]">
                      <ListOrdered className="h-5 w-5 text-[#0F7894]" />
                      {round ? round.name : "Assigned Startups"}
                      <Badge variant="outline">{roundStartups.length} startups</Badge>
                    </CardTitle>
                    {roundKey !== "legacy" && (
                      <Link href={`/jury-scoresheet?roundId=${roundKey}`}>
                        <Button size="sm" className="bg-[#0F7894] hover:bg-[#0c6078] text-white">
                          <Table2 size={14} className="mr-1.5" />
                          Grade All
                        </Button>
                      </Link>
                    )}
                  </div>
                  {round?.description && (
                    <p className="text-sm text-gray-500">{round.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roundStartups.map((startup: any) => {
                      const evaluation = myEvaluations.find((e: any) =>
                        e.startupId === startup.id && (roundKey === "legacy" || e.roundId === parseInt(roundKey))
                      );
                      const isCompleted = evaluation?.isCompleted;
                      const evalLink = roundKey !== "legacy"
                        ? `/evaluate/${startup.id}?roundId=${roundKey}`
                        : `/evaluate/${startup.id}`;

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
                              className={cn(isCompleted ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-100 text-slate-600")}
                            >
                              {isCompleted ? "Completed" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-sm text-[hsl(var(--gray-600))] mb-4 line-clamp-2">{startup.description}</p>
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-[hsl(var(--gray-500))]">Stage:</span>
                              <span className="font-medium">{startup.stage || "—"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-[hsl(var(--gray-500))]">Team Size:</span>
                              <span className="font-medium">{startup.teamSize || "—"}</span>
                            </div>
                          </div>
                          <Link href={evalLink}>
                            <Button className="w-full bg-[#0F7894] hover:bg-[#0c6078] text-white shadow-md font-bold">
                              <Eye size={16} className="mr-2" />
                              {isCompleted ? "View Evaluation" : "Start Evaluation"}
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}