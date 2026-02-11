import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileSpreadsheet,
    Download,
    FileText,
    Users,
    Rocket,
    ClipboardCheck,
    AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { formatScore } from "@/lib/utils";

export default function Reports() {
    const { data: evaluations, isLoading: evalsLoading } = useQuery<any[]>({
        queryKey: ["/api/evaluations"],
    });

    const { data: startups, isLoading: startupsLoading } = useQuery<any[]>({
        queryKey: ["/api/startups"],
    });

    const { data: users, isLoading: usersLoading } = useQuery<any[]>({
        queryKey: ["/api/users"],
    });

    const { data: criteria, isLoading: criteriaLoading } = useQuery<any[]>({
        queryKey: ["/api/evaluation-criteria"],
    });

    const isLoading = evalsLoading || startupsLoading || usersLoading || criteriaLoading;

    const exportToExcel = () => {
        if (!evaluations || !startups || !users || !criteria) return;

        // Prepare data for export
        const exportData = evaluations.map((evaluation: any) => {
            const startup = startups.find(s => s.id === evaluation.startupId);
            const jury = users.find(u => u.id === evaluation.juryId);

            const row: any = {
                "Startup Name": startup?.name || "Unknown",
                "Category": startup?.category || "N/A",
                "Jury Member": jury?.name || jury?.email || `Jury ${evaluation.juryId}`,
                "Status": evaluation.isCompleted ? "Completed" : "Draft",
                "Date Submitted": evaluation.submittedAt ? format(new Date(evaluation.submittedAt), "yyyy-MM-dd HH:mm") : "N/A",
            };

            // Add scores for each criterion
            let totalScore = 0;
            let scoreCount = 0;

            criteria.forEach((c: any) => {
                const score = evaluation.scores?.[c.id.toString()] || 0;
                row[c.name] = score;
                if (score > 0) {
                    totalScore += score;
                    scoreCount++;
                }
            });

            row["Average Score"] = scoreCount > 0 ? formatScore(totalScore / scoreCount) : "0.0";
            row["Final Decision"] = evaluation.decision || "Pending";
            row["Comments"] = evaluation.comments || "";

            return row;
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Evaluations");

        // Generate filename
        const fileName = `StartupEval_Report_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;

        // Save file
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen">
                <Header
                    title="Reporting Center"
                    subtitle="Generate and export evaluation data for analysis"
                />

                <div className="p-8 max-w-5xl mx-auto space-y-8">
                    {/* Main Action Card */}
                    <Card className="border-t-4 border-t-[#0F7894] shadow-md">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-bold text-slate-900">Evaluation Master Report</CardTitle>
                                    <p className="text-slate-500 mt-1">Export all jury reviews and scores to a structured Excel file.</p>
                                </div>
                                <div className="h-14 w-14 bg-[#0F7894]/10 rounded-xl flex items-center justify-center">
                                    <FileSpreadsheet className="h-8 w-8 text-[#0F7894]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <ClipboardCheck className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluations</p>
                                        <p className="text-xl font-bold text-slate-800">{evaluations?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Rocket className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Startups</p>
                                        <p className="text-xl font-bold text-slate-800">{startups?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Users className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jury Members</p>
                                        <p className="text-xl font-bold text-slate-800">{users?.filter(u => u.role === 'jury').length || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 mb-8">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800">
                                    The report will include all individual criterion scores, final team decisions, and qualitative feedback comments for every evaluation in the system.
                                </p>
                            </div>

                            <Button
                                onClick={exportToExcel}
                                disabled={isLoading || !evaluations?.length}
                                className="w-full md:w-auto h-12 px-8 bg-[#0F7894] hover:bg-[#0c6078] text-white font-bold text-lg shadow-lg gap-2"
                            >
                                <Download className="h-5 w-5" />
                                Download Excel Report (.xlsx)
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Report Contents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-slate-600 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-[#0F7894] rounded-full" />
                                        Complete startup and jury metadata
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-[#0F7894] rounded-full" />
                                        Individual scoring breakdown (1-5)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-[#0F7894] rounded-full" />
                                        Average scores and completion status
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-[#0F7894] rounded-full" />
                                        Full feedback text and final decisions
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200 bg-slate-100/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Usage Note
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    This report is generated directly in your browser. All dates are formatted to your local timezone. For best results, ensure all jury members have submitted their final evaluations before generating the master report.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
