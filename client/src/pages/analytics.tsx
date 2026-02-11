import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatScore, getDecisionColor, cn } from "@/lib/utils";
import {
    BarChart3,
    Star,
    Award,
    Rocket,
    ClipboardCheck,
    TrendingUp,
    Info,
    Search
} from "lucide-react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from "recharts";

export default function Analytics() {
    const [selectedStartupId, setSelectedStartupId] = useState<number | null>(null);

    const { data: startups, isLoading: startupsLoading } = useQuery<any[]>({
        queryKey: ["/api/startups"],
    });

    const { data: evaluations, isLoading: evaluationsLoading } = useQuery<any[]>({
        queryKey: ["/api/evaluations"],
    });

    const { data: criteria } = useQuery<any[]>({
        queryKey: ["/api/evaluation-criteria"],
    });

    const { data: users } = useQuery<any[]>({
        queryKey: ["/api/users"],
    });

    const isLoading = startupsLoading || evaluationsLoading;

    if (!selectedStartupId && startups && startups.length > 0) {
        setSelectedStartupId(startups[0].id);
    }

    const selectedStartup = startups?.find(s => s.id === selectedStartupId);
    const startupEvals = evaluations?.filter(e => e.startupId === selectedStartupId) || [];

    const getJuryMemberName = (juryId: number) => {
        const jury = Array.isArray(users) ? users.find((user: any) => user.id === juryId) : undefined;
        return jury ? jury.name || jury.email : `Jury Member ${juryId}`;
    };

    const getRadarData = (startupId: number) => {
        if (!criteria || !Array.isArray(criteria) || !evaluations || !Array.isArray(evaluations)) return [];

        const relevantEvals = evaluations.filter((e: any) => e.startupId === startupId);
        if (relevantEvals.length === 0) return [];

        return criteria.map((c: any) => {
            const scores = relevantEvals.map((e: any) => e.scores?.[c.id.toString()] || 0);
            const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

            // Calculate overall average for comparison
            const allEvals = evaluations;
            const allScores = allEvals.map((e: any) => e.scores?.[c.id.toString()] || 0);
            const overallAvg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

            return {
                subject: c.name,
                Startup: avg,
                Average: overallAvg,
                fullMark: 5,
            };
        });
    };

    const getOverallAverage = (startupId: number) => {
        const relevantEvals = evaluations?.filter((e: any) => e.startupId === startupId) || [];
        if (relevantEvals.length === 0) return 0;

        const totalScore = relevantEvals.reduce((sum: number, evaluation: any) => {
            if (!evaluation.scores || typeof evaluation.scores !== 'object') return sum;
            const evalScores = Object.values(evaluation.scores).map(v => typeof v === 'number' ? v : 0) as number[];
            if (evalScores.length === 0) return sum;
            const avgScore = evalScores.reduce((a: number, b: number) => a + b, 0) / evalScores.length;
            return sum + avgScore;
        }, 0);

        return relevantEvals.length > 0 ? totalScore / relevantEvals.length : 0;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex bg-gray-50">
                <Sidebar />
                <main className="flex-1 ml-64 min-h-screen p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F7894] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading analytics...</p>
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
                    title="Startup Intelligence"
                    subtitle="Detailed performance analysis and comparison"
                />

                <div className="p-8 space-y-8">
                    {/* Startup Selector */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-[#0F7894]/10 rounded-lg flex items-center justify-center">
                                <Search className="h-6 w-6 text-[#0F7894]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Select Startup</h3>
                                <p className="text-sm text-slate-500">Pick a startup for deep-dive analysis</p>
                            </div>
                        </div>

                        <div className="w-full md:w-72">
                            <Select
                                value={selectedStartupId?.toString()}
                                onValueChange={(v) => setSelectedStartupId(parseInt(v))}
                            >
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select startup..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {startups?.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedStartup ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Comparative Radar Chart */}
                                <Card className="lg:col-span-8 shadow-sm border-slate-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-[#0F7894]" />
                                            Performance Comparison
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(selectedStartup.id)}>
                                                    <PolarGrid stroke="#e2e8f0" />
                                                    <PolarAngleAxis
                                                        dataKey="subject"
                                                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                                    />
                                                    <PolarRadiusAxis
                                                        angle={30}
                                                        domain={[0, 5]}
                                                        tick={{ fill: '#94a3b8' }}
                                                    />
                                                    <Radar
                                                        name={selectedStartup.name}
                                                        dataKey="Startup"
                                                        stroke="#0F7894"
                                                        fill="#0F7894"
                                                        fillOpacity={0.6}
                                                    />
                                                    <Radar
                                                        name="Cohort Average"
                                                        dataKey="Average"
                                                        stroke="#94a3b8"
                                                        fill="#94a3b8"
                                                        strokeDasharray="4 4"
                                                        fillOpacity={0.2}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Performance Highlights */}
                                <div className="lg:col-span-4 space-y-6">
                                    <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-[#0F7894] to-[#0c6078] text-white overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Award size={120} />
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="text-white/80 text-sm font-medium uppercase tracking-wider">Overall Ranking Score</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <p className="text-5xl font-bold">{formatScore(getOverallAverage(selectedStartup.id))}</p>
                                                <p className="text-white/60 text-xs mt-1">Out of 5.0 points</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span>Progress</span>
                                                    <span>{Math.round((getOverallAverage(selectedStartup.id) / 5) * 100)}%</span>
                                                </div>
                                                <Progress value={(getOverallAverage(selectedStartup.id) / 5) * 100} className="h-2 bg-white/20" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-sm border-slate-200">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-slate-800 text-sm font-bold flex items-center gap-2">
                                                <Rocket className="h-4 w-4 text-[#0F7894]" />
                                                Vitals
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-500 font-medium">Stage</span>
                                                <span className="text-sm font-bold text-slate-900">{selectedStartup.stage}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-500 font-medium">Category</span>
                                                <Badge variant="outline" className="text-[#0F7894] border-[#0F7894]/20 bg-[#0F7894]/5 font-bold">
                                                    {selectedStartup.category}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between py-2">
                                                <span className="text-sm text-slate-500 font-medium">Reviews</span>
                                                <Badge className="bg-slate-900 text-white font-bold">{startupEvals.length}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Detailed Scoring Table */}
                            <Card className="shadow-sm border-slate-200 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2 text-slate-800">
                                        <ClipboardCheck className="h-5 w-5 text-[#0F7894]" />
                                        Raw Scoring Data
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold py-4">Jury Member</TableHead>
                                                {criteria?.map((c: any) => (
                                                    <TableHead key={c.id} className="text-center font-bold px-2">{c.name}</TableHead>
                                                ))}
                                                <TableHead className="text-center font-bold">Decision</TableHead>
                                                <TableHead className="py-4">Comments</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {startupEvals.map((evaluation: any) => (
                                                <TableRow key={evaluation.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="font-semibold text-slate-900 py-4">
                                                        {getJuryMemberName(evaluation.juryId)}
                                                    </TableCell>
                                                    {criteria?.map((c: any) => {
                                                        const score = evaluation.scores?.[c.id.toString()] || 0;
                                                        return (
                                                            <TableCell key={c.id} className="text-center">
                                                                <span className={cn(
                                                                    "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
                                                                    score >= 4 ? "bg-green-100 text-green-700" :
                                                                        score >= 3 ? "bg-amber-100 text-amber-700" :
                                                                            "bg-slate-100 text-slate-500"
                                                                )}>
                                                                    {score}
                                                                </span>
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn("font-bold", getDecisionColor(evaluation.decision))}>
                                                            {evaluation.decision}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs py-4">
                                                        <p className="text-sm text-slate-600 line-clamp-2" title={evaluation.comments}>
                                                            {evaluation.comments || <span className="italic text-slate-400">No feedback provided</span>}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Info className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">No Startup Selected</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">Please choose a startup from the dropdown above to view its detailed analytical performance.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
