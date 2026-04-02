import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, Send, CheckCircle, Clock, Circle, User, X,
  Building2, Users, TrendingUp, DollarSign, CalendarDays, Info,
} from "lucide-react";
import logo from "@/assets/logo.png";

// ─── cell helpers ────────────────────────────────────────────────────────────

function scoreColor(value: number, min: number, max: number) {
  const pct = (value - min) / (max - min);
  if (pct >= 0.8) return "bg-green-100 text-green-800";
  if (pct >= 0.6) return "bg-lime-100 text-lime-800";
  if (pct >= 0.4) return "bg-yellow-100 text-yellow-800";
  if (pct >= 0.2) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function ScaleCell({
  value, min, max, onChange, disabled,
}: { value: any; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const hasValue = typeof value === "number";
  const color = hasValue ? scoreColor(value, min, max) : "";

  const handleDecrement = () => {
    const current = hasValue ? value : min;
    onChange(Math.max(min, current - 1));
  };

  const handleIncrement = () => {
    // If no value yet, clicking + starts at min
    const current = hasValue ? value : min - 1;
    onChange(Math.min(max, current + 1));
  };

  return (
    <div className={cn("flex items-center justify-center gap-0.5 rounded px-1 py-1 min-w-[90px]", color || "bg-gray-50")}>
      <button
        type="button"
        disabled={disabled || (hasValue && value <= min)}
        onClick={handleDecrement}
        className="w-5 h-5 rounded text-sm font-bold hover:bg-black/10 disabled:opacity-30 shrink-0"
      >−</button>
      <input
        type="number"
        min={min}
        max={max}
        value={hasValue ? value : ""}
        disabled={disabled}
        placeholder="–"
        onChange={e => {
          const v = parseInt(e.target.value);
          if (!isNaN(v) && v >= min && v <= max) onChange(v);
        }}
        className="w-9 text-center bg-transparent font-bold text-sm border-none outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled || (hasValue && value >= max)}
        onClick={handleIncrement}
        className="w-5 h-5 rounded text-sm font-bold hover:bg-black/10 disabled:opacity-30 shrink-0"
      >+</button>
    </div>
  );
}

function BinaryCell({
  value, onChange, disabled,
}: { value: any; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1 justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value === "yes" ? "" : "yes")}
        className={cn(
          "px-2 py-0.5 text-xs font-semibold rounded border transition-colors",
          value === "yes"
            ? "bg-green-600 border-green-600 text-white"
            : "border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700",
        )}
      >Y</button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value === "no" ? "" : "no")}
        className={cn(
          "px-2 py-0.5 text-xs font-semibold rounded border transition-colors",
          value === "no"
            ? "bg-red-500 border-red-500 text-white"
            : "border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600",
        )}
      >N</button>
    </div>
  );
}

function DecisionCell({
  value, onChange, disabled,
}: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const opts = [
    { key: "yes",   label: "✓", active: "bg-green-600 border-green-600 text-white" },
    { key: "maybe", label: "?", active: "bg-amber-500 border-amber-500 text-white" },
    { key: "no",    label: "✗", active: "bg-red-500 border-red-500 text-white" },
  ] as const;
  return (
    <div className="flex gap-1 justify-center">
      {opts.map(o => (
        <button
          key={o.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === o.key ? "" : o.key)}
          className={cn(
            "w-6 h-6 text-xs font-bold rounded border transition-colors",
            value === o.key ? o.active : "border-gray-200 text-gray-500 hover:border-gray-400",
          )}
        >{o.label}</button>
      ))}
    </div>
  );
}

// ─── row state ────────────────────────────────────────────────────────────────

interface RowState {
  scores: Record<string, any>;
  decision: string;
  comments: string;
  evaluationId?: number;
  isDirty: boolean;
  isSaving: boolean;
  isSaved: boolean;
  isCompleted: boolean;
}

// ─── main component ───────────────────────────────────────────────────────────

export default function JuryScoresheet() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const roundId = searchParams.get("roundId") ? parseInt(searchParams.get("roundId")!) : undefined;

  const { data: authData } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const user = authData?.user;
  const juryId = user?.id;

  const { data: round } = useQuery<any>({
    queryKey: [`/api/rounds/${roundId}`],
    enabled: !!roundId,
  });

  const { data: criteria = [] } = useQuery<any[]>({
    queryKey: [`/api/rounds/${roundId}/criteria`],
    enabled: !!roundId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/rounds/${roundId}/criteria`);
      return res.json();
    },
  });

  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: [`/api/jury-assignments?juryId=${juryId}`],
    enabled: !!juryId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jury-assignments?juryId=${juryId}`);
      return res.json();
    },
  });

  const { data: startups = [] } = useQuery<any[]>({ queryKey: ["/api/startups"] });
  const { data: allEvaluations = [] } = useQuery<any[]>({ queryKey: ["/api/evaluations"] });

  const roundAssignments = (assignments as any[]).filter((a: any) => a.roundId === roundId);
  const assignedStartupIds = roundAssignments.map((a: any) => a.startupId);
  const assignedStartups = (startups as any[]).filter((s: any) => assignedStartupIds.includes(s.id));
  const myRoundEvals = (allEvaluations as any[]).filter(
    (e: any) => e.juryId === juryId && e.roundId === roundId,
  );

  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [initialized, setInitialized] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);

  useEffect(() => {
    if (!assignedStartups.length || !(criteria as any[]).length || initialized) return;
    const initial: Record<number, RowState> = {};
    for (const s of assignedStartups) {
      const existing = myRoundEvals.find((e: any) => e.startupId === s.id);
      initial[s.id] = {
        scores: existing?.scores ?? {},
        decision: existing?.decision ?? "",
        comments: existing?.comments ?? "",
        evaluationId: existing?.id,
        isDirty: false,
        isSaving: false,
        isSaved: !!existing,
        isCompleted: existing?.isCompleted ?? false,
      };
    }
    setRows(initial);
    setInitialized(true);
  }, [assignedStartups, criteria, myRoundEvals, initialized]);

  const updateRow = useCallback((startupId: number, patch: Partial<RowState>) => {
    setRows(prev => ({
      ...prev,
      [startupId]: { ...prev[startupId], ...patch, isDirty: true, isSaved: false },
    }));
  }, []);

  const saveRow = useCallback(async (startupId: number, completed = false) => {
    setRows(prev => {
      const row = prev[startupId];
      if (!row) return prev;
      return { ...prev, [startupId]: { ...row, isSaving: true } };
    });

    // Capture current row state for the API call
    const currentRow = rows[startupId];
    if (!currentRow || !juryId || !roundId) return;

    try {
      const payload = {
        juryId,
        startupId,
        roundId,
        scores: currentRow.scores,
        decision: currentRow.decision || undefined,
        comments: currentRow.comments || undefined,
        isCompleted: completed,
        ...(completed ? { submittedAt: new Date().toISOString() } : {}),
      };

      let evalId = currentRow.evaluationId;
      if (evalId) {
        await apiRequest("PUT", `/api/evaluations/${evalId}`, payload);
      } else {
        const res = await apiRequest("POST", "/api/evaluations", payload);
        const data = await res.json();
        evalId = data.id;
      }

      setRows(prev => ({
        ...prev,
        [startupId]: {
          ...prev[startupId],
          evaluationId: evalId,
          isDirty: false,
          isSaving: false,
          isSaved: true,
          isCompleted: completed,
        },
      }));

      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
    } catch {
      setRows(prev => ({ ...prev, [startupId]: { ...prev[startupId], isSaving: false } }));
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }, [rows, juryId, roundId, toast]);

  const saveDraft = async () => {
    const dirty = assignedStartups.filter(s => rows[s.id]?.isDirty);
    if (!dirty.length) { toast({ title: "Nothing to save" }); return; }
    await Promise.all(dirty.map(s => saveRow(s.id, false)));
    toast({ title: "Draft saved" });
  };

  const submitAll = async () => {
    await Promise.all(assignedStartups.map(s => saveRow(s.id, true)));
    toast({ title: "All evaluations submitted!" });
  };

  // Order: scale → binary → text
  const orderedCriteria = [
    ...(criteria as any[]).filter((c: any) => c.type === "scale"),
    ...(criteria as any[]).filter((c: any) => c.type === "binary"),
    ...(criteria as any[]).filter((c: any) => c.type === "text"),
  ];

  const completedCount = Object.values(rows).filter(r => r.isCompleted).length;
  const total = assignedStartups.length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded overflow-hidden shadow-sm shrink-0">
            <img src={logo} alt="Scorer Ai" className="w-full h-full object-contain" />
          </div>
          <button
            onClick={() => setLocation("/jury-dashboard")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="h-4 border-l border-gray-200" />
          <div>
            <span className="font-semibold text-gray-800 text-sm">{round?.name ?? "Scoresheet"}</span>
            {round?.description && (
              <span className="text-gray-400 text-xs ml-2">{round.description}</span>
            )}
          </div>
          <div className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            completedCount === total && total > 0
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500",
          )}>
            {completedCount}/{total} submitted
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <User size={13} />
            <span>{user?.name}</span>
          </div>
          <div className="h-4 border-l border-gray-200" />
          <Button variant="outline" size="sm" onClick={saveDraft} className="text-gray-600">
            <Save size={13} className="mr-1" />
            Save Draft
          </Button>
          <Button
            size="sm"
            className="bg-[#0F7894] hover:bg-[#0c6078] text-white"
            onClick={submitAll}
          >
            <Send size={13} className="mr-1" />
            Submit All
          </Button>
        </div>
      </header>

      {/* ── Scoresheet table ── */}
      <div className="flex-1 overflow-auto">
        {!initialized ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>
        ) : assignedStartups.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No startups assigned for this round.
          </div>
        ) : (
          <table className="border-collapse text-sm" style={{ minWidth: "100%" }}>
            <thead>
              <tr className="bg-gray-100 sticky top-0 z-20">
                {/* Startup */}
                <th
                  scope="col"
                  className="sticky left-0 z-30 bg-gray-100 border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                  style={{ minWidth: 200 }}
                >
                  Startup
                </th>

                {/* Criteria */}
                {orderedCriteria.map((c: any) => (
                  <th
                    key={c.id}
                    scope="col"
                    className="border border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap"
                    style={{ minWidth: c.type === "text" ? 180 : 110 }}
                  >
                    <div className="text-xs">{c.name}</div>
                    <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                      {c.type === "scale"
                        ? `${c.scaleMin ?? 1} – ${c.scaleMax ?? 5}`
                        : c.type}
                    </div>
                  </th>
                ))}

                {/* Decision */}
                <th
                  scope="col"
                  className="border border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap"
                  style={{ minWidth: 100 }}
                >
                  <div className="text-xs">Decision</div>
                  <div className="text-[10px] font-normal text-gray-400 mt-0.5">✓ ? ✗</div>
                </th>

                {/* Comments */}
                <th
                  scope="col"
                  className="border border-gray-200 px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                  style={{ minWidth: 200 }}
                >
                  <div className="text-xs">Comments</div>
                </th>

                {/* Status */}
                <th
                  scope="col"
                  className="border border-gray-200 px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap"
                  style={{ minWidth: 80 }}
                >
                  <div className="text-xs">Status</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {assignedStartups.map((startup: any, idx: number) => {
                const row = rows[startup.id];
                if (!row) return null;
                const stripeBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/60";

                return (
                  <tr
                    key={startup.id}
                    className={cn("group transition-colors hover:bg-blue-50/40", stripeBg)}
                  >
                    {/* ── Startup name (sticky) ── */}
                    <td
                      className={cn(
                        "sticky left-0 z-10 border border-gray-200 px-4 py-2.5 whitespace-nowrap group-hover:bg-blue-50/40",
                        stripeBg,
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedStartup(startup)}
                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left w-full"
                      >
                        <div className="w-7 h-7 rounded-md bg-[hsl(var(--primary-100))] flex items-center justify-center shrink-0">
                          <span className="text-[hsl(var(--primary-600))] font-bold text-xs">
                            {startup.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#0F7894] text-xs leading-tight underline decoration-dotted underline-offset-2">
                            {startup.name}
                          </div>
                          <div className="text-[10px] text-gray-400">{startup.category}</div>
                        </div>
                      </button>
                    </td>

                    {/* ── Criteria cells ── */}
                    {orderedCriteria.map((c: any) => {
                      const val = row.scores[c.id.toString()];

                      if (c.type === "scale") {
                        return (
                          <td key={c.id} className="border border-gray-200 px-1.5 py-1.5 text-center">
                            <ScaleCell
                              value={val}
                              min={c.scaleMin ?? 1}
                              max={c.scaleMax ?? 5}
                              onChange={v =>
                                updateRow(startup.id, {
                                  scores: { ...row.scores, [c.id.toString()]: v },
                                })
                              }
                              disabled={row.isCompleted}
                            />
                          </td>
                        );
                      }

                      if (c.type === "binary") {
                        return (
                          <td key={c.id} className="border border-gray-200 px-1.5 py-1.5 text-center">
                            <BinaryCell
                              value={val}
                              onChange={v =>
                                updateRow(startup.id, {
                                  scores: { ...row.scores, [c.id.toString()]: v },
                                })
                              }
                              disabled={row.isCompleted}
                            />
                          </td>
                        );
                      }

                      // text
                      return (
                        <td key={c.id} className="border border-gray-200 px-1.5 py-1.5">
                          <input
                            type="text"
                            value={val ?? ""}
                            disabled={row.isCompleted}
                            placeholder="…"
                            onChange={e =>
                              updateRow(startup.id, {
                                scores: { ...row.scores, [c.id.toString()]: e.target.value },
                              })
                            }
                            onBlur={() => { if (row.isDirty) saveRow(startup.id, false); }}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#0F7894] disabled:opacity-50 bg-transparent"
                          />
                        </td>
                      );
                    })}

                    {/* ── Decision ── */}
                    <td className="border border-gray-200 px-1.5 py-1.5 text-center">
                      <DecisionCell
                        value={row.decision}
                        onChange={v => updateRow(startup.id, { decision: v })}
                        disabled={row.isCompleted}
                      />
                    </td>

                    {/* ── Comments ── */}
                    <td className="border border-gray-200 px-1.5 py-1.5">
                      <input
                        type="text"
                        value={row.comments}
                        disabled={row.isCompleted}
                        placeholder="Add a comment…"
                        onChange={e => updateRow(startup.id, { comments: e.target.value })}
                        onBlur={() => { if (row.isDirty) saveRow(startup.id, false); }}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#0F7894] disabled:opacity-50 bg-transparent"
                      />
                    </td>

                    {/* ── Status ── */}
                    <td className="border border-gray-200 px-1.5 py-1.5 text-center">
                      {row.isSaving ? (
                        <span className="text-[10px] text-gray-400 animate-pulse">saving…</span>
                      ) : row.isCompleted ? (
                        <span className="flex items-center justify-center gap-1 text-[10px] text-green-600 font-semibold">
                          <CheckCircle size={11} /> Done
                        </span>
                      ) : row.isSaved ? (
                        <span className="flex items-center justify-center gap-1 text-[10px] text-blue-500">
                          <Clock size={11} /> Draft
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                          <Circle size={11} /> Empty
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Startup info panel ── */}
      {selectedStartup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setSelectedStartup(null)}
          />
          {/* Slide-in panel */}
          <aside className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary-100))] flex items-center justify-center">
                  <span className="text-[hsl(var(--primary-600))] font-bold text-base">
                    {selectedStartup.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{selectedStartup.name}</h3>
                  <p className="text-xs text-gray-400">{selectedStartup.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Stage badge */}
              {selectedStartup.stage && (
                <div>
                  <Badge variant="outline" className="text-xs font-medium">
                    {selectedStartup.stage}
                  </Badge>
                </div>
              )}

              {/* Description */}
              {selectedStartup.description && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Info size={11} />
                    About
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedStartup.description}</p>
                </div>
              )}

              <div className="border-t border-gray-100" />

              {/* Key details */}
              <div className="space-y-3">
                {selectedStartup.founded && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                      <CalendarDays size={13} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Founded</div>
                      <div className="text-sm font-medium text-gray-800">{selectedStartup.founded}</div>
                    </div>
                  </div>
                )}
                {selectedStartup.teamSize && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                      <Users size={13} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Team Size</div>
                      <div className="text-sm font-medium text-gray-800">{selectedStartup.teamSize}</div>
                    </div>
                  </div>
                )}
                {selectedStartup.fundingSeek && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                      <DollarSign size={13} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Seeking</div>
                      <div className="text-sm font-medium text-gray-800">{selectedStartup.fundingSeek}</div>
                    </div>
                  </div>
                )}
                {selectedStartup.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-gray-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Website</div>
                      <div className="text-sm font-medium text-[#0F7894] break-all">{selectedStartup.website}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current row scores summary */}
              {rows[selectedStartup.id] && Object.keys(rows[selectedStartup.id].scores).length > 0 && (
                <>
                  <div className="border-t border-gray-100" />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      <TrendingUp size={11} />
                      Your Scores
                    </div>
                    <div className="space-y-1.5">
                      {orderedCriteria.map((c: any) => {
                        const val = rows[selectedStartup.id]?.scores[c.id.toString()];
                        if (val == null || val === "") return null;
                        return (
                          <div key={c.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 truncate max-w-[150px]">{c.name}</span>
                            <span className={cn(
                              "font-semibold px-1.5 py-0.5 rounded text-xs",
                              c.type === "scale"
                                ? scoreColor(val, c.scaleMin ?? 1, c.scaleMax ?? 5)
                                : val === "yes"
                                ? "bg-green-100 text-green-700"
                                : val === "no"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600",
                            )}>
                              {c.type === "scale" ? `${val}/${c.scaleMax ?? 5}` : val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
