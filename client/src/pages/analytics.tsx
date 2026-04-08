import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatScore, getDecisionColor, cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Award, Rocket, ClipboardCheck, TrendingUp, Search, Layers, ChevronRight, BarChart3, Star, X, Download } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, Cell
} from "recharts";

const COLORS = ["#0F7894", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function Analytics() {
  const [cohortSearch, setCohortSearch] = useState("");
  const [cohortFocused, setCohortFocused] = useState(false);
  const [startupSearch, setStartupSearch] = useState("");
  const [startupFocused, setStartupFocused] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [selectedStartupId, setSelectedStartupId] = useState<number | null>(null);
  const [showAllRankings, setShowAllRankings] = useState(false);

  const { data: cohorts = [] } = useQuery<any[]>({ queryKey: ["/api/cohorts"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const { data: allStartups = [] } = useQuery<any[]>({ queryKey: ["/api/startups"] });

  // Rounds the searched startup belongs to
  const { data: startupRounds = [] } = useQuery<any[]>({
    queryKey: [`/api/startups/${selectedStartupId}/rounds`],
    enabled: !!selectedStartupId,
    queryFn: async () => (await apiRequest("GET", `/api/startups/${selectedStartupId}/rounds`)).json(),
  });

  const { data: rounds = [] } = useQuery<any[]>({
    queryKey: [`/api/cohorts/${selectedCohortId}/rounds`],
    enabled: !!selectedCohortId,
    queryFn: async () => (await apiRequest("GET", `/api/cohorts/${selectedCohortId}/rounds`)).json(),
  });

  // Auto-select most recent cohort on load
  useEffect(() => {
    if (selectedCohortId || !(cohorts as any[]).length) return;
    // cohorts are ordered by created_at DESC from the API, so index 0 is most recent
    const cohort = (cohorts as any[])[0];
    if (cohort) {
      setSelectedCohortId(cohort.id);
      setCohortSearch(cohort.name);
    }
  }, [cohorts]);

  // Auto-select active round (or last round) once rounds load
  useEffect(() => {
    if (selectedRoundId || !(rounds as any[]).length) return;
    const active = (rounds as any[]).find((r: any) => r.isActive) ?? (rounds as any[]).at(-1);
    if (active) setSelectedRoundId(active.id);
  }, [rounds]);

  const { data: roundStartups = [] } = useQuery<any[]>({
    queryKey: [`/api/rounds/${selectedRoundId}/startups`],
    enabled: !!selectedRoundId,
    queryFn: async () => (await apiRequest("GET", `/api/rounds/${selectedRoundId}/startups`)).json(),
  });

  const { data: roundCriteria = [] } = useQuery<any[]>({
    queryKey: [`/api/rounds/${selectedRoundId}/criteria`],
    enabled: !!selectedRoundId,
    queryFn: async () => (await apiRequest("GET", `/api/rounds/${selectedRoundId}/criteria`)).json(),
  });

  const { data: roundEvaluations = [] } = useQuery<any[]>({
    queryKey: [`/api/evaluations`, selectedRoundId],
    enabled: !!selectedRoundId,
    queryFn: async () => (await apiRequest("GET", `/api/evaluations?roundId=${selectedRoundId}`)).json(),
  });

  const allRoundEvals = useQuery<any[][]>({
    queryKey: ["all-round-evals", rounds.map((r: any) => r.id)],
    enabled: rounds.length > 0,
    queryFn: async () =>
      Promise.all(rounds.map(async (r: any) => (await apiRequest("GET", `/api/evaluations?roundId=${r.id}`)).json())),
  });

  const getJuryName = (juryId: number) => {
    const u = (users as any[]).find((u: any) => u.id === juryId);
    return u?.name || u?.email || `Jury ${juryId}`;
  };

  const avgOf = (vals: number[]) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

  const getAvgScore = (evals: any[]) => {
    const scores = evals.flatMap((e: any) => {
      if (!e.scores) return [];
      return Object.values(e.scores).map((v: any) => typeof v === "number" ? v : parseFloat(v)).filter((v: any) => !isNaN(v));
    });
    return avgOf(scores);
  };

  const getStartupAvg = (startupId: number, evals: any[]) =>
    getAvgScore(evals.filter((e: any) => e.startupId === startupId));

  const rankings = useMemo(() =>
    [...roundStartups].map((s: any) => ({
      ...s,
      avg: getStartupAvg(s.id, roundEvaluations),
      evalCount: roundEvaluations.filter((e: any) => e.startupId === s.id).length,
    })).sort((a, b) => b.avg - a.avg),
    [roundStartups, roundEvaluations]
  );

  const scaleMax = (roundCriteria as any[]).find((c: any) => c.type === "scale")?.scaleMax ?? 5;

  const radarData = useMemo(() => {
    if (!selectedStartupId) return [];
    const sevals = roundEvaluations.filter((e: any) => e.startupId === selectedStartupId);
    return (roundCriteria as any[]).filter((c: any) => c.type === "scale").map((c: any) => {
      const key = c.id.toString();
      const sv = sevals.map((e: any) => e.scores?.[key]).filter((v: any) => typeof v === "number");
      const av = roundEvaluations.map((e: any) => e.scores?.[key]).filter((v: any) => typeof v === "number");
      return { subject: c.name, Startup: avgOf(sv), Average: avgOf(av), fullMark: c.scaleMax ?? 5 };
    });
  }, [selectedStartupId, roundCriteria, roundEvaluations]);

  const crossRoundData = useMemo(() => {
    if (!selectedStartupId || !allRoundEvals.data) return [];
    return rounds.map((r: any, i: number) => ({
      round: r.name,
      score: getStartupAvg(selectedStartupId, allRoundEvals.data![i] || []),
    }));
  }, [selectedStartupId, rounds, allRoundEvals.data]);

  const filteredCohorts = (cohorts as any[]).filter((c: any) =>
    !cohortSearch || c.name.toLowerCase().includes(cohortSearch.toLowerCase())
  );

  const selectedCohort = (cohorts as any[]).find((c: any) => c.id === selectedCohortId);
  const selectedRound = (rounds as any[]).find((r: any) => r.id === selectedRoundId);
  const selectedStartup = (roundStartups as any[]).find((s: any) => s.id === selectedStartupId)
    || (allStartups as any[]).find((s: any) => s.id === selectedStartupId);
  const startupEvals = roundEvaluations.filter((e: any) => e.startupId === selectedStartupId);
  const overallAvg = selectedStartupId ? getStartupAvg(selectedStartupId, roundEvaluations) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="no-print">
        <Sidebar />
      </div>

      <div className="flex-1 ml-64 flex flex-col overflow-hidden print-content">
        <div className="no-print">
          <Header title="Startup Intelligence" subtitle="Performance analysis by cohort, round & startup" />
        </div>

        {/* ── Horizontal nav bar ── */}
        <div className="no-print bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center gap-0 shrink-0">

          {/* Cohorts — outside overflow so dropdown isn't clipped */}
          <div className="flex items-center gap-3 shrink-0 pr-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
              <Layers className="h-3.5 w-3.5" /> Cohort
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              <Input
                className="pl-7 h-8 text-sm w-40 bg-slate-50"
                placeholder="Search cohort..."
                value={cohortSearch}
                onChange={e => { setCohortSearch(e.target.value); setSelectedCohortId(null); setSelectedRoundId(null); setSelectedStartupId(null); }}
                onFocus={() => setCohortFocused(true)}
                onBlur={() => setTimeout(() => setCohortFocused(false), 200)}
              />
              {cohortFocused && cohortSearch.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredCohorts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">No cohorts found</p>
                  ) : filteredCohorts.map((c: any) => (
                    <button
                      key={c.id}
                      onMouseDown={() => {
                        setSelectedCohortId(c.id);
                        setCohortSearch(c.name);
                        setCohortFocused(false);
                        setSelectedRoundId(null);
                        setSelectedStartupId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                    >
                      <Layers className="h-3.5 w-3.5 text-[#0F7894] shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        {c.description && <p className="text-[10px] text-slate-400">{c.description}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCohortId && (
              <button
                onClick={() => { setSelectedCohortId(null); setCohortSearch(""); setSelectedRoundId(null); setSelectedStartupId(null); }}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

        {/* Rounds + Startups in scrollable section */}
        <div className="flex items-center gap-0 overflow-x-auto flex-1 min-w-0">

          {/* Rounds section */}
          {selectedCohortId && (
            <>
              <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 mx-1" />
              <div className="flex items-center gap-3 shrink-0 px-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Rounds</span>
                <div className="flex items-center gap-1.5">
                  {(rounds as any[]).length === 0
                    ? <span className="text-sm text-slate-300">None</span>
                    : (rounds as any[]).map((r: any) => (
                      <button
                        key={r.id}
                        onClick={() => { setSelectedRoundId(r.id === selectedRoundId ? null : r.id); setSelectedStartupId(null); }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                          selectedRoundId === r.id
                            ? "bg-[#0F7894] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {r.name}
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Startups section */}
          {selectedRoundId && (
            <>
              <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 mx-1" />
              <div className="flex items-center gap-3 shrink-0 px-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Startups</span>
                <div className="flex items-center gap-1.5">
                  {(roundStartups as any[]).length === 0
                    ? <span className="text-sm text-slate-300">None</span>
                    : (roundStartups as any[]).map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStartupId(s.id === selectedStartupId ? null : s.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                          selectedStartupId === s.id
                            ? "bg-[#0F7894] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}

        </div>{/* end scrollable section */}

          {/* Divider */}
          <div className="w-px h-7 bg-slate-200 shrink-0 mx-3" />

          {/* Startup search — outside overflow container so dropdown is never clipped */}
          <div className="flex items-center gap-3 shrink-0 relative">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
              <Search className="inline h-3.5 w-3.5 mr-0.5" /> Startup
            </span>
            <div className="relative">
              <Input
                className="h-8 text-sm w-44 bg-slate-50"
                placeholder="Search startup..."
                value={startupSearch}
                onChange={e => { setStartupSearch(e.target.value); setSelectedStartupId(null); }}
                onFocus={() => setStartupFocused(true)}
                onBlur={() => setTimeout(() => setStartupFocused(false), 200)}
              />
              {startupFocused && startupSearch.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {(allStartups as any[])
                    .filter((s: any) => s.name.toLowerCase().includes(startupSearch.toLowerCase()))
                    .slice(0, 10)
                    .map((s: any) => (
                      <button
                        key={s.id}
                        onMouseDown={() => {
                          setSelectedStartupId(s.id);
                          setStartupSearch(s.name);
                          setStartupFocused(false);
                          // Auto-select cohort if startup has one
                          if (s.cohortId) setSelectedCohortId(s.cohortId);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                      >
                        <Rocket className="h-3 w-3 text-[#0F7894] shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400">{s.category}</p>
                        </div>
                      </button>
                    ))}
                  {(allStartups as any[]).filter((s: any) => s.name.toLowerCase().includes(startupSearch.toLowerCase())).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-3">No startups found</p>
                  )}
                </div>
              )}
            </div>

            {/* Round toggles when startup is selected and in multiple rounds */}
            {selectedStartupId && (startupRounds as any[]).length > 0 && (
              <div className="flex items-center gap-1">
                {(startupRounds as any[]).map((r: any) => (
                  <button
                    key={r.roundId}
                    onClick={() => {
                      setSelectedRoundId(r.roundId);
                      setSelectedCohortId(r.cohortId);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border",
                      selectedRoundId === r.roundId
                        ? "bg-[#0F7894] border-[#0F7894] text-white"
                        : "border-slate-200 text-slate-500 hover:border-[#0F7894] hover:text-[#0F7894]"
                    )}
                    title={r.cohortName}
                  >
                    {r.roundName}
                  </button>
                ))}
              </div>
            )}

            {selectedStartupId && startupSearch && (
              <button
                onClick={() => { setSelectedStartupId(null); setStartupSearch(""); setSelectedRoundId(null); }}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clear all */}
          {(selectedCohortId || selectedStartupId) && (
            <button
              onClick={() => { setSelectedCohortId(null); setSelectedRoundId(null); setSelectedStartupId(null); setStartupSearch(""); }}
              className="ml-auto shrink-0 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-0">

            {/* Download PDF button */}
            {selectedRoundId && (
              <div className="no-print flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0F7894] text-white text-sm font-medium rounded-lg hover:bg-[#0c6078] transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>
            )}

            {/* Empty state */}
            {!selectedCohortId && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Layers className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Select a cohort to get started</p>
              </div>
            )}

            {/* Cohort — no round */}
            {selectedCohortId && !selectedRoundId && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800">{selectedCohort?.name}</h2>
                  {selectedCohort?.description && <span className="text-xs text-slate-400">{selectedCohort.description}</span>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Rounds", value: (rounds as any[]).length, icon: BarChart3, bg: "bg-purple-50", color: "text-purple-500" },
                    { label: "Active Round", value: (rounds as any[]).find((r: any) => r.isActive)?.name || "None", icon: Star, bg: "bg-amber-50", color: "text-amber-500" },
                    { label: "Total Evaluations", value: "—", icon: ClipboardCheck, bg: "bg-green-50", color: "text-green-500" },
                  ].map(({ label, value, icon: Icon, bg, color }) => (
                    <Card key={label} className="shadow-sm border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bg)}>
                          <Icon className={cn("h-4 w-4", color)} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-sm font-bold">{value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <p className="text-xs text-slate-400">← Select a round in the tree to drill down</p>
              </div>
            )}

            {/* Round — no startup */}
            {selectedRoundId && !selectedStartupId && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="font-medium text-slate-600">{selectedCohort?.name}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-semibold text-[#0F7894]">{selectedRound?.name}</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Startups", value: (roundStartups as any[]).length, icon: Rocket, bg: "bg-blue-50", color: "text-blue-500" },
                    { label: "Criteria", value: (roundCriteria as any[]).length, icon: ClipboardCheck, bg: "bg-purple-50", color: "text-purple-500" },
                    { label: "Evaluations", value: (roundEvaluations as any[]).length, icon: BarChart3, bg: "bg-green-50", color: "text-green-500" },
                    { label: "Avg Score", value: formatScore(getAvgScore(roundEvaluations)), icon: Star, bg: "bg-amber-50", color: "text-amber-500" },
                  ].map(({ label, value, icon: Icon, bg, color }) => (
                    <Card key={label} className="shadow-sm border-slate-200">
                      <CardContent className="p-3 flex items-center gap-2">
                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", bg)}>
                          <Icon className={cn("h-3.5 w-3.5", color)} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="text-sm font-bold">{value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Rankings + bar chart side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-[#0F7894]" /> Rankings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-50">
                        {rankings.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">No startups yet</p>
                        ) : (showAllRankings ? rankings : rankings.slice(0, 6)).map((s: any, i: number) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedStartupId(s.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors text-left"
                          >
                            <span className={cn(
                              "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0",
                              i === 0 ? "bg-yellow-100 text-yellow-700" :
                                i === 1 ? "bg-gray-200 text-gray-700" :
                                  i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"
                            )}>{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">{s.name}</p>
                              <p className="text-[10px] text-slate-400">{s.category}</p>
                            </div>
                            <span className="text-xs font-bold text-[#0F7894] shrink-0">{s.avg > 0 ? formatScore(s.avg) : "—"}</span>
                          </button>
                        ))}
                      </div>
                      {rankings.length > 6 && (
                        <button
                          onClick={() => setShowAllRankings(v => !v)}
                          className="w-full text-center text-[10px] font-medium text-[#0F7894] hover:text-[#0c6078] py-2 border-t border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          {showAllRankings ? "Show less" : `See all ${rankings.length} startups`}
                        </button>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-[#0F7894]" /> Score Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 px-2 pb-2">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={rankings.map((s: any) => ({ name: s.name.split(" ")[0], score: parseFloat(formatScore(s.avg)) }))} barSize={18}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, scaleMax]} tick={{ fontSize: 10 }} width={22} />
                          <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }} />
                          <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                            {rankings.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Startup deep dive */}
            {selectedStartupId && selectedStartup && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="font-medium text-slate-600">{selectedCohort?.name}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{selectedRound?.name}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-semibold text-[#0F7894]">{selectedStartup.name}</span>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  {/* Radar */}
                  <Card className="col-span-7 shadow-sm border-slate-200">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-[#0F7894]" /> Performance vs Round Average
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      {radarData.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-xs text-slate-400">No scale criteria</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, radarData[0]?.fullMark || 5]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                            <Radar name={selectedStartup.name} dataKey="Startup" stroke="#0F7894" fill="#0F7894" fillOpacity={0.6} />
                            <Radar name="Round Avg" dataKey="Average" stroke="#94a3b8" fill="#94a3b8" strokeDasharray="4 4" fillOpacity={0.2} />
                            <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Score + vitals */}
                  <div className="col-span-5 flex flex-col gap-3">
                    <Card className="shadow-sm bg-gradient-to-br from-[#0F7894] to-[#0c6078] text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 opacity-10 p-4"><Award size={64} /></div>
                      <CardContent className="p-4">
                        <p className="text-white/70 text-[10px] uppercase tracking-wider mb-1">Overall Score</p>
                        <p className="text-4xl font-bold leading-none">{formatScore(overallAvg)}</p>
                        <p className="text-white/50 text-[10px] mt-1">{startupEvals.length} evaluations · out of {scaleMax}</p>
                        <Progress value={(overallAvg / scaleMax) * 100} className="mt-3 h-1.5 bg-white/20" />
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 flex-1">
                      <CardContent className="p-3 space-y-2">
                        {[
                          { label: "Stage", value: selectedStartup.stage || "N/A" },
                          { label: "Category", value: selectedStartup.category || "N/A" },
                          { label: "Reviews", value: String(startupEvals.length) },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                            <span className="text-xs text-slate-400">{label}</span>
                            <span className="text-xs font-semibold text-slate-700">{value}</span>
                          </div>
                        ))}
                        {crossRoundData.length > 1 && (
                          <div className="pt-1">
                            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">Round Progress</p>
                            <ResponsiveContainer width="100%" height={70}>
                              <BarChart data={crossRoundData} barSize={12}>
                                <XAxis dataKey="round" tick={{ fontSize: 9 }} />
                                <YAxis domain={[0, scaleMax]} tick={{ fontSize: 9 }} width={18} />
                                <RechartsTooltip contentStyle={{ borderRadius: "6px", border: "none", fontSize: 10 }} />
                                <Bar dataKey="score" fill="#0F7894" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Scoring table */}
                <Card className="shadow-sm border-slate-200 overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5 text-[#0F7894]" /> Raw Scoring Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-xs py-2 font-bold">Jury</TableHead>
                          {(roundCriteria as any[]).map((c: any) => (
                            <TableHead key={c.id} className="text-xs text-center font-bold px-2 py-2">{c.name}</TableHead>
                          ))}
                          <TableHead className="text-xs text-center font-bold py-2">Decision</TableHead>
                          <TableHead className="text-xs py-2">Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {startupEvals.map((e: any) => (
                          <TableRow key={e.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs font-semibold py-2">{getJuryName(e.juryId)}</TableCell>
                            {(roundCriteria as any[]).map((c: any) => {
                              const val = e.scores?.[c.id.toString()];
                              return (
                                <TableCell key={c.id} className="text-center py-2">
                                  {c.type === "scale" ? (
                                    <span className={cn(
                                      "inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold",
                                      val >= 4 ? "bg-green-100 text-green-700" : val >= 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                    )}>{val ?? "—"}</span>
                                  ) : c.type === "binary" ? (
                                    <Badge variant={val === "yes" ? "default" : "destructive"} className="text-[10px] px-1.5">{val ?? "—"}</Badge>
                                  ) : (
                                    <span className="text-[10px] text-gray-500 truncate max-w-[80px] block">{val ?? "—"}</span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center py-2">
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 font-bold", getDecisionColor(e.decision))}>
                                {e.decision ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-[140px] py-2">
                              <p className="truncate" title={e.comments}>{e.comments || <span className="italic text-slate-300">—</span>}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                        {startupEvals.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={(roundCriteria as any[]).length + 3} className="text-center text-xs text-slate-400 py-6">
                              No evaluations yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

