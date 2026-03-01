import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, FileText, TrendingUp } from "lucide-react";

export default function EvaluationPage() {
    const [, setLocation] = useLocation();
    const { data: startup, isLoading } = useQuery<any>({
        queryKey: ["/api/startups/me"],
    });

    const { data: authData } = useQuery<any>({
        queryKey: ["/api/auth/me"],
    });

    useEffect(() => {
        // ONLY redirect if user is a founder and has no startup
        if (!isLoading && authData?.user?.role === 'founder' && !startup) {
            setLocation("/founder-onboarding");
        }
    }, [isLoading, startup, authData, setLocation]);

    const { data: evaluations } = useQuery<any[]>({
        queryKey: [startup?.id ? `/api/startups/${startup.id}/evaluations` : null],
        enabled: !!startup?.id,
    });

    if (isLoading || !startup) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 animate-pulse font-medium">Loading evaluation data...</p>
            </div>
        );
    }

    // Calculate average score
    const avgScore = evaluations && evaluations.length > 0
        ? (evaluations.reduce((acc, curr) => {
            const scores = Object.values(curr.scores || {}).map(v => Number(v));
            const sum = scores.reduce((a, b) => a + b, 0);
            return acc + (sum / scores.length);
        }, 0) / evaluations.length).toFixed(1)
        : "N/A";

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
                <Header
                    title="Startup Evaluation"
                    subtitle="Track your startup's performance and jury feedback"
                />
                <div className="p-8 space-y-8 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-[#0F7894] to-[#0c6078] text-white">
                            <CardContent className="p-6 text-center">
                                <Award className="mx-auto mb-2 opacity-50" size={32} />
                                <p className="text-white/80 text-sm font-medium">Average Score</p>
                                <p className="text-4xl font-bold mt-1">{avgScore}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 text-center">
                                <FileText className="mx-auto mb-2 text-[#0F7894]/20" size={32} />
                                <p className="text-slate-500 text-sm font-medium">Total Evaluations</p>
                                <p className="text-4xl font-bold text-slate-900 mt-1">{evaluations?.length || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 text-center">
                                <TrendingUp className="mx-auto mb-2 text-[#0F7894]/20" size={32} />
                                <p className="text-slate-500 text-sm font-medium">Category</p>
                                <p className="text-xl font-bold text-slate-900 mt-2 truncate">
                                    {startup?.category || "N/A"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm overflow-hidden">
                        <CardHeader className="bg-white border-b">
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <Award className="text-[#0F7894]" size={20} />
                                Jury Feedback Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {!evaluations || evaluations.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 italic">
                                        No evaluations received yet. Check back soon!
                                    </div>
                                ) : (
                                    evaluations.map((evalItem, idx) => (
                                        <div key={idx} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-[#0F7894] uppercase tracking-wider bg-[#0F7894]/10 px-2 py-1 rounded">
                                                    Evaluation #{idx + 1}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {evalItem.submittedAt ? new Date(evalItem.submittedAt).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {Object.entries(evalItem.scores || {}).map(([key, value]: [string, any]) => (
                                                    <div key={key} className="flex flex-col p-3 bg-white border rounded-xl shadow-sm">
                                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{key}</span>
                                                        <span className="text-2xl font-black text-slate-900">{value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {evalItem.comments && (
                                                <div className="p-4 bg-blue-50/50 rounded-xl text-sm text-slate-700 border border-blue-100 italic">
                                                    <p className="font-bold text-[#0F7894] mb-1 not-italic text-xs uppercase tracking-tight">Jury Comment:</p>
                                                    "{evalItem.comments}"
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
