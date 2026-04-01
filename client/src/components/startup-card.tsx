import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Layers, ListOrdered, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Startup } from "@shared/schema";

interface StartupCardProps {
  startup: Startup & { cohortName?: string | null };
  currentRound?: string | null;
  juryTotal?: number;
  juryCompleted?: number;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export default function StartupCard({
  startup,
  currentRound,
  juryTotal = 0,
  juryCompleted = 0,
  onView,
  onEdit,
}: StartupCardProps) {
  const allDone = juryTotal > 0 && juryCompleted >= juryTotal;
  const progress = juryTotal > 0 ? Math.round((juryCompleted / juryTotal) * 100) : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[hsl(var(--primary-100))] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-[hsl(var(--primary-600))] font-bold text-lg">
                {startup.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{startup.name}</h3>
              <p className="text-sm text-gray-500">{startup.category}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">{startup.stage || "—"}</Badge>
        </div>

        {/* Description */}
        {startup.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{startup.description}</p>
        )}

        {/* Cohort + Round */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {startup.cohortName ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <Layers className="h-3 w-3 text-[#0F7894]" />
              {startup.cohortName}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <Layers className="h-3 w-3" />
              No cohort
            </div>
          )}
          {currentRound ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <ListOrdered className="h-3 w-3 text-[#0F7894]" />
              {currentRound}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <ListOrdered className="h-3 w-3" />
              No round
            </div>
          )}
        </div>

        {/* Jury evaluation status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              {allDone
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                : <Clock className="h-3.5 w-3.5 text-amber-400" />}
              <span>Jury evaluations</span>
            </div>
            <span className={cn(
              "text-xs font-semibold",
              allDone ? "text-green-600" : juryCompleted > 0 ? "text-amber-600" : "text-gray-400"
            )}>
              {juryTotal === 0 ? "No jury assigned" : `${juryCompleted}/${juryTotal}`}
            </span>
          </div>
          {juryTotal > 0 && (
            <Progress
              value={progress}
              className={cn("h-1.5", allDone ? "[&>div]:bg-green-500" : juryCompleted > 0 ? "[&>div]:bg-amber-400" : "")}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[#0F7894] border-[#0F7894] hover:bg-blue-50 shadow-sm"
            onClick={() => onView?.(startup.id)}
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm"
            onClick={() => onEdit?.(startup.id)}
          >
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
