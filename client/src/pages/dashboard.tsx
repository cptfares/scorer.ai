import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { formatScore } from "@/lib/utils";
import {
  Rocket, Users, ClipboardCheck, Star, Layers,
  ListOrdered, CheckCircle2, Clock, TrendingUp, Award
} from "lucide-react";

export default function Dashboard() {
  const { data: cohorts = [] } = useQuery<any[]>({ queryKey: ["/api/cohorts"] });
  const { data: startups = [] } = useQuery<any[]>({ queryKey: ["/api/startups"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  // Fetch rounds for all cohorts
  const { data: allRounds = [] } = useQuery<any[]>({
    queryKey: ["all-rounds", (cohorts as any[]).map((c: any) => c.id)],
    enabled: (cohorts as any[]).length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        (cohorts as any[]).map(async (c: any) => {
          const res = await apiRequest("GET", `/api/cohorts/${c.id}/rounds`);
          const rounds = await res.json();
          return rounds.map((r: any) => ({ ...r, cohortName: c.name }));
        })
      );
      return results.flat();
    },
  });

  // Latest active round per cohort (for evaluations)
  const activeRounds = useMemo(() =>
    (allRounds as any[]).filter((r: any) => r.isActive),
    [allRounds]
  );

  // Fetch evaluations for all active rounds
  const { data: activeEvals = [] } = useQuery<any[]>({
    queryKey: ["active-evals", activeRounds.map((r: any) => r.id)],
    enabled: activeRounds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        activeRounds.map(async (r: any) => {
          const res = await apiRequest("GET", `/api/evaluations?roundId=${r.id}`);
          const evals = await res.json();
          return evals.map((e: any) => ({ ...e, roundName: r.name, cohortName: r.cohortName }));
        })
      );
      return results.flat();
    },
  });

  // Fetch startups + jury assignments for active rounds
  const { data: activeRoundStartups = [] } = useQuery<any[]>({
    queryKey: ["active-round-startups", activeRounds.map((r: any) => r.id)],
    enabled: activeRounds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        activeRounds.map(async (r: any) => {
          const res = await apiRequest("GET", `/api/rounds/${r.id}/startups`);
          return res.json();
        })
      );
      return results.flat();
    },
  });

  const juryUsers = (users as any[]).filter((u: any) => u.role === "jury");
  const completedEvals = (activeEvals as any[]).filter((e: any) => e.isCompleted);

  // Per-startup avg score in active rounds
  const startupScores = useMemo(() => {
    return (activeRoundStartups as any[]).map((s: any) => {
      const evals = (activeEvals as any[]).filter((e: any) => e.startupId === s.id && e.isCompleted);
      if (!evals.length) return { ...s, avg: null, evalCount: 0 };
      const scores = evals.flatMap((e: any) => {
        if (!e.scores) return [];
        return Object.values(e.scores)
          .map((v: any) => typeof v === "number" ? v : parseFloat(v))
          .filter((v: any) => !isNaN(v));
      });
      const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;
      return { ...s, avg, evalCount: evals.length };
    }).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  }, [activeRoundStartups, activeEvals]);

  const overallAvg = useMemo(() => {
    const scored = startupScores.filter((s: any) => s.avg !== null);
    if (!scored.length) return null;
    return scored.reduce((sum: number, s: any) => sum + s.avg, 0) / scored.length;
  }, [startupScores]);

  const statCards = [
    { label: "Cohorts", value: (cohorts as any[]).length, icon: Layers, bg: "bg-[#0F7894]/10", color: "text-[#0F7894]" },
    { label: "Rounds", value: (allRounds as any[]).length, icon: ListOrdered, bg: "bg-purple-50", color: "text-purple-600" },
    { label: "Startups", value: (startups as any[]).length, icon: Rocket, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Jury Members", value: juryUsers.length, icon: Users, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Evaluations", value: completedEvals.length, icon: ClipboardCheck, bg: "bg-green-50", color: "text-green-600" },
    { label: "Avg Score", value: overallAvg !== null ? formatScore(overallAvg) : "—", icon: Star, bg: "bg-rose-50", color: "text-rose-600" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Header title="Dashboard" subtitle="Platform overview" />

        <div className="p-8 space-y-8">

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map(({ label, value, icon: Icon, bg, color }) => (
              <Card key={label} className="shadow-sm border-slate-200">
                <CardContent className="p-5">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                    <Icon className={`h-4.5 w-4.5 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Cohort overview */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Cohorts & Rounds</h2>
              {(cohorts as any[]).length === 0 ? (
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-6 text-center text-sm text-slate-400">No cohorts yet</CardContent>
                </Card>
              ) : (cohorts as any[]).map((cohort: any) => {
                const cohortRounds = (allRounds as any[]).filter((r: any) => r.cohortId === cohort.id);
                const active = cohortRounds.find((r: any) => r.isActive);
                return (
                  <Card key={cohort.id} className="shadow-sm border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{cohort.name}</p>
                          <p className="text-xs text-slate-400">{cohortRounds.length} rounds</p>
                        </div>
                        {cohort.isActive && (
                          <Badge className="bg-[#0F7894]/10 text-[#0F7894] hover:bg-[#0F7894]/10 text-[10px]">Active</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cohortRounds.map((r: any) => (
                          <span
                            key={r.id}
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              r.isActive
                                ? "bg-[#0F7894] text-white border-[#0F7894]"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                      {active && (
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Active: {active.name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Active round startup rankings */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Active Round Rankings
                </h2>
                {activeRounds.length > 0 && (
                  <span className="text-xs text-slate-400">
                    {activeRounds.map((r: any) => r.name).join(", ")}
                  </span>
                )}
              </div>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                  {startupScores.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">
                      No startups in active rounds
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {startupScores.slice(0, 8).map((s: any, i: number) => (
                        <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 ${
                            i === 0 ? "bg-yellow-100 text-yellow-700" :
                            i === 1 ? "bg-slate-200 text-slate-600" :
                            i === 2 ? "bg-orange-100 text-orange-600" :
                            "bg-slate-100 text-slate-400"
                          }`}>{i + 1}</span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                              <span className="text-sm font-bold text-[#0F7894] ml-2 shrink-0">
                                {s.avg !== null ? formatScore(s.avg) : "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={s.avg !== null ? (s.avg / 10) * 100 : 0}
                                className="h-1.5 flex-1"
                              />
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {s.evalCount} eval{s.evalCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          <Badge variant="outline" className="text-[10px] shrink-0">{s.category}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Jury members quick view */}
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide pt-2">Jury Members</h2>
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4">
                  {juryUsers.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-2">No jury members yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {juryUsers.map((u: any) => (
                        <div key={u.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                          <div className="h-5 w-5 rounded-full bg-[#0F7894]/20 flex items-center justify-center text-[10px] font-bold text-[#0F7894]">
                            {u.name?.charAt(0) || u.email?.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-700">{u.name || u.email}</span>
                          {completedEvals.filter((e: any) => e.juryId === u.id).length > 0 && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
