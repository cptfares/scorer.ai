import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft, Plus, Pencil, Trash2, ClipboardList,
  Rocket, Users, GripVertical, Check, ToggleLeft, AlignLeft, Hash,
  Link2, Copy, KeyRound,
} from "lucide-react";

function JuryAccessPanel({ roundId }: { roundId: string }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<{ joinUrl: string; codes: { id: number; name: string; email: string; code: string }[] }>({
    queryKey: [`/api/rounds/${roundId}/jury-codes`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/rounds/${roundId}/jury-codes`);
      return res.json();
    },
  });

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  if (isLoading) return null;
  if (!data?.codes?.length) return null;

  return (
    <Card className="border-[#0F7894]/20 bg-[#0F7894]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-[#0F7894]">
          <KeyRound className="h-4 w-4" />
          Quick Access — share with jury members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Join link */}
        <div className="flex items-center gap-2 bg-white rounded-lg border border-[#0F7894]/20 px-3 py-2">
          <Link2 className="h-4 w-4 text-[#0F7894] shrink-0" />
          <span className="text-sm text-gray-600 font-mono truncate flex-1">{data.joinUrl}</span>
          <Button size="sm" variant="ghost" className="px-2 h-7 text-[#0F7894]" onClick={() => copy(data.joinUrl, "Link")}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Per-member codes */}
        <div className="grid gap-2">
          {data.codes.map(m => (
            <div key={m.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
                <div className="text-xs text-gray-400 truncate">{m.email}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm font-bold tracking-widest text-[#0F7894] bg-[#0F7894]/10 px-2 py-0.5 rounded">
                  {m.code}
                </span>
                <Button size="sm" variant="ghost" className="px-2 h-7" onClick={() => copy(m.code, "Code")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RoundDetail() {
  const { cohortId, roundId } = useParams<{ cohortId: string; roundId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Criteria state
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [editCriteria, setEditCriteria] = useState<any>(null);
  const [criteriaForm, setCriteriaForm] = useState({ name: "", description: "", type: "scale" as "scale" | "binary" | "text", scaleMin: 1, scaleMax: 5, order: 0, weight: 1 });

  // Startup state
  const [showAddStartup, setShowAddStartup] = useState(false);
  const [selectedStartupIds, setSelectedStartupIds] = useState<number[]>([]);

  // Jury assignment state
  const [showAssignJury, setShowAssignJury] = useState(false);
  const [assignJuryId, setAssignJuryId] = useState<string>("");
  const [assignStartupIds, setAssignStartupIds] = useState<number[]>([]);
  const [jurySearch, setJurySearch] = useState("");
  const [assignedResult, setAssignedResult] = useState<{ name: string; code: string; joinUrl: string } | null>(null);

  const { data: round } = useQuery<any>({ queryKey: [`/api/rounds/${roundId}`] });
  const { data: criteria = [], isLoading: criteriaLoading } = useQuery<any[]>({
    queryKey: [`/api/rounds/${roundId}/criteria`]
  });
  const { data: roundStartups = [], isLoading: startupsLoading } = useQuery<any[]>({
    queryKey: [`/api/rounds/${roundId}/startups`]
  });
  const { data: allStartups = [] } = useQuery<any[]>({
    queryKey: [`/api/startups`, cohortId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/startups?cohortId=${cohortId}`);
      return res.json();
    }
  });
  const { data: juryUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users", "jury"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users?role=jury");
      return res.json();
    }
  });
  const { data: juryAssignments = [] } = useQuery<any[]>({
    queryKey: [`/api/jury-assignments`, roundId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/jury-assignments?roundId=${roundId}`);
      return res.json();
    }
  });

  // Criteria mutations
  const createCriteriaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/rounds/${roundId}/criteria`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rounds/${roundId}/criteria`] });
      setShowCriteriaForm(false);
      setCriteriaForm({ name: "", description: "", type: "scale", scaleMin: 1, scaleMax: 5, order: criteria.length, weight: 1 });
      toast({ title: "Criteria added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCriteriaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/rounds/${roundId}/criteria/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rounds/${roundId}/criteria`] });
      setEditCriteria(null);
      toast({ title: "Criteria updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCriteriaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/rounds/${roundId}/criteria/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rounds/${roundId}/criteria`] });
      toast({ title: "Criteria deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Startup mutations
  const addStartupMutation = useMutation({
    mutationFn: async (startupIds: number[]) => {
      for (const startupId of startupIds) {
        await apiRequest("POST", `/api/rounds/${roundId}/startups`, { startupId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rounds/${roundId}/startups`] });
      setShowAddStartup(false);
      setSelectedStartupIds([]);
      toast({ title: "Startups added to round" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeStartupMutation = useMutation({
    mutationFn: async (startupId: number) => {
      const res = await apiRequest("DELETE", `/api/rounds/${roundId}/startups/${startupId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rounds/${roundId}/startups`] });
      toast({ title: "Startup removed from round" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Jury assignment mutation
  const assignJuryMutation = useMutation({
    mutationFn: async ({ juryId, startupIds }: { juryId: number; startupIds: number[] }) => {
      const res = await apiRequest("POST", "/api/jury-assignments/bulk", {
        juryId,
        startupIds,
        roundId: parseInt(roundId)
      });
      return res.json();
    },
    onSuccess: async (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/jury-assignments`, roundId] });
      queryClient.invalidateQueries({ queryKey: [`/api/rounds/${roundId}/jury-codes`] });
      // Fetch the code for the just-assigned jury member
      try {
        const res = await apiRequest("GET", `/api/rounds/${roundId}/jury-codes`);
        const data = await res.json();
        const member = data.codes.find((c: any) => c.id === vars.juryId);
        if (member) {
          setAssignedResult({ name: member.name, code: member.code, joinUrl: data.joinUrl });
        }
      } catch {
        toast({ title: "Jury assigned" });
        setShowAssignJury(false);
        setAssignJuryId("");
        setAssignStartupIds([]);
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEditCriteria = (c: any) => {
    setEditCriteria(c);
    setCriteriaForm({ name: c.name, description: c.description || "", type: c.type || "scale", scaleMin: c.scaleMin ?? 1, scaleMax: c.scaleMax ?? 5, order: c.order || 0, weight: c.weight ?? 1 });
  };

  const handleCriteriaSubmit = () => {
    if (!criteriaForm.name.trim()) return;
    if (editCriteria) updateCriteriaMutation.mutate({ id: editCriteria.id, data: criteriaForm });
    else createCriteriaMutation.mutate({ ...criteriaForm, order: criteria.length });
  };

  const toggleAssignStartup = (startupId: number) => {
    setAssignStartupIds(ids =>
      ids.includes(startupId) ? ids.filter(id => id !== startupId) : [...ids, startupId]
    );
  };

  const startupIds = new Set(roundStartups.map((s: any) => s.id));
  const availableStartups = allStartups.filter((s: any) => !startupIds.has(s.id));

  const getJuryName = (juryId: number) => {
    const jury = juryUsers.find((u: any) => u.id === juryId);
    return jury?.name || `Jury ${juryId}`;
  };

  const getStartupName = (startupId: number) => {
    const startup = roundStartups.find((s: any) => s.id === startupId) ||
      allStartups.find((s: any) => s.id === startupId);
    return startup?.name || `Startup ${startupId}`;
  };

  // Group assignments by jury member
  const assignmentsByJury = juryAssignments.reduce((acc: any, a: any) => {
    if (!acc[a.juryId]) acc[a.juryId] = [];
    acc[a.juryId].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Header
          title={round?.name || "Round"}
          subtitle={round?.description || "Manage criteria, startups, and jury for this round"}
        />
        <div className="p-8 space-y-6">
          <Button variant="ghost" onClick={() => navigate(`/cohorts/${cohortId}`)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Cohort
          </Button>

          <Tabs defaultValue="criteria">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="criteria">
                <ClipboardList className="h-4 w-4 mr-2" /> Criteria
              </TabsTrigger>
              <TabsTrigger value="startups">
                <Rocket className="h-4 w-4 mr-2" /> Startups
              </TabsTrigger>
              <TabsTrigger value="jury">
                <Users className="h-4 w-4 mr-2" /> Jury Assignments
              </TabsTrigger>
            </TabsList>

            {/* ── Criteria Tab ─────────────────────────────── */}
            <TabsContent value="criteria" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Define what jury members will score for this round. Each criterion is scored 1–5.
                </p>
                <Button onClick={() => { setShowCriteriaForm(true); setCriteriaForm({ name: "", description: "", type: "scale", scaleMin: 1, scaleMax: 5, order: criteria.length, weight: 1 }); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Criterion
                </Button>
              </div>

              {criteriaLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0F7894]" />
                </div>
              ) : criteria.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardList className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500">No criteria yet. Add scoring criteria for this round.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {criteria.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <GripVertical className="h-4 w-4 text-gray-300" />
                            </TableCell>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-sm text-gray-500">{c.description || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 flex-wrap">
                                {c.type === "scale" && (
                                  <Badge variant="outline" className="gap-1"><Hash className="h-3 w-3" />Scale {c.scaleMin ?? 1}–{c.scaleMax ?? 5}</Badge>
                                )}
                                {c.type === "binary" && (
                                  <Badge variant="outline" className="gap-1"><ToggleLeft className="h-3 w-3" />Yes / No</Badge>
                                )}
                                {c.type === "text" && (
                                  <Badge variant="outline" className="gap-1"><AlignLeft className="h-3 w-3" />Text</Badge>
                                )}
                                {(c.weight ?? 1) !== 1 && (
                                  <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-200">×{c.weight}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditCriteria(c)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => { if (confirm("Delete this criterion?")) deleteCriteriaMutation.mutate(c.id); }}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Startups Tab ──────────────────────────────── */}
            <TabsContent value="startups" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Startups in this round. Add from the cohort or remove to exclude from evaluation.
                </p>
                <Button onClick={() => setShowAddStartup(true)} disabled={availableStartups.length === 0}>
                  <Plus className="h-4 w-4 mr-2" /> Add Startup
                </Button>
              </div>

              {startupsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0F7894]" />
                </div>
              ) : roundStartups.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Rocket className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500">No startups in this round yet.</p>
                    {allStartups.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Add startups to the cohort first.</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roundStartups.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                            <TableCell className="text-sm text-gray-500">{s.stage || "—"}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => { if (confirm(`Remove ${s.name} from this round?`)) removeStartupMutation.mutate(s.id); }}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Jury Tab ──────────────────────────────────── */}
            <TabsContent value="jury" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Assign jury members to evaluate specific startups in this round.
                </p>
                <Button onClick={() => { setShowAssignJury(true); setAssignJuryId(""); setAssignStartupIds([]); }}>
                  <Plus className="h-4 w-4 mr-2" /> Assign Jury
                </Button>
              </div>

              {/* Quick Access — join link + per-jury codes */}
              <JuryAccessPanel roundId={roundId!} />

              {Object.keys(assignmentsByJury).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500">No jury assigned to this round yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {Object.entries(assignmentsByJury).map(([juryId, assignments]: [string, any]) => (
                    <Card key={juryId}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#0F7894]" />
                          {getJuryName(parseInt(juryId))}
                          <Badge variant="outline">{assignments.length} startups</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {assignments.map((a: any) => (
                            <Badge key={a.id} variant="secondary">{getStartupName(a.startupId)}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Criteria Dialog */}
      <Dialog open={showCriteriaForm || !!editCriteria} onOpenChange={() => { setShowCriteriaForm(false); setEditCriteria(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCriteria ? "Edit Criterion" : "Add Criterion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={criteriaForm.name}
                onChange={e => setCriteriaForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Market Opportunity"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={criteriaForm.description}
                onChange={e => setCriteriaForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What should jury members consider when scoring this?"
                rows={3}
              />
            </div>
            <div>
              <Label>Score Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {([
                  { value: "scale", label: "Scale", sub: "Numeric range", icon: Hash },
                  { value: "binary", label: "Yes / No", sub: "Binary decision", icon: ToggleLeft },
                  { value: "text", label: "Text", sub: "Free text answer", icon: AlignLeft },
                ] as const).map(({ value, label, sub, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCriteriaForm(f => ({ ...f, type: value }))}
                    className={`flex flex-col items-center gap-1 border rounded-lg p-3 text-sm transition-colors ${
                      criteriaForm.type === value
                        ? "border-[#0F7894] bg-[#0F7894]/5 text-[#0F7894]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                    <span className="text-xs opacity-70">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {criteriaForm.type === "scale" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={criteriaForm.scaleMin}
                    min={0}
                    onChange={e => setCriteriaForm(f => ({ ...f, scaleMin: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={criteriaForm.scaleMax}
                    min={criteriaForm.scaleMin + 1}
                    max={100}
                    onChange={e => setCriteriaForm(f => ({ ...f, scaleMax: parseInt(e.target.value) || criteriaForm.scaleMin + 1 }))}
                  />
                </div>
                <p className="col-span-2 text-xs text-gray-400">
                  Jury will score from {criteriaForm.scaleMin} to {criteriaForm.scaleMax}
                </p>
              </div>
            )}
            <div>
              <Label>Weight</Label>
              <Input
                type="number"
                value={criteriaForm.weight}
                min={1}
                step={1}
                onChange={e => setCriteriaForm(f => ({ ...f, weight: parseFloat(e.target.value) || 1 }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Score × weight = contribution to total (default 1)</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCriteriaForm(false); setEditCriteria(null); }}>Cancel</Button>
              <Button onClick={handleCriteriaSubmit} disabled={createCriteriaMutation.isPending || updateCriteriaMutation.isPending}>
                {editCriteria ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Startup Dialog */}
      <Dialog open={showAddStartup} onOpenChange={(open) => { setShowAddStartup(open); if (!open) setSelectedStartupIds([]); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Startups to Round</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availableStartups.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">All cohort startups are already in this round.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{availableStartups.length} startups available</p>
                  <button
                    type="button"
                    className="text-xs text-[#0F7894] hover:underline"
                    onClick={() => {
                      const allIds = availableStartups.map((s: any) => s.id);
                      const allSelected = allIds.every((id: number) => selectedStartupIds.includes(id));
                      setSelectedStartupIds(allSelected ? [] : allIds);
                    }}
                  >
                    {availableStartups.every((s: any) => selectedStartupIds.includes(s.id)) ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                  {availableStartups.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50 text-left"
                      onClick={() => setSelectedStartupIds(ids =>
                        ids.includes(s.id) ? ids.filter(id => id !== s.id) : [...ids, s.id]
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.category}</p>
                      </div>
                      {selectedStartupIds.includes(s.id) && <Check className="h-4 w-4 text-[#0F7894] shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddStartup(false); setSelectedStartupIds([]); }}>Cancel</Button>
              <Button
                onClick={() => addStartupMutation.mutate(selectedStartupIds)}
                disabled={selectedStartupIds.length === 0 || addStartupMutation.isPending}
              >
                Add {selectedStartupIds.length > 0 ? `(${selectedStartupIds.length})` : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Jury Dialog */}
      <Dialog open={showAssignJury} onOpenChange={(open) => {
        setShowAssignJury(open);
        if (!open) { setJurySearch(""); setAssignJuryId(""); setAssignStartupIds([]); setAssignedResult(null); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{assignedResult ? "Jury Assigned" : "Assign Jury Member"}</DialogTitle>
          </DialogHeader>

          {assignedResult ? (
            /* ── Step 2: show link + code ── */
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Share the link and code below with <span className="font-semibold">{assignedResult.name}</span> so they can join directly.
              </p>

              {/* Join link */}
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Round join link</Label>
                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                  <Link2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-mono text-gray-700 truncate flex-1">{assignedResult.joinUrl}</span>
                  <Button size="sm" variant="ghost" className="px-2 h-7 shrink-0" onClick={() => { navigator.clipboard.writeText(assignedResult.joinUrl); toast({ title: "Link copied" }); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Code */}
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Access code for {assignedResult.name}</Label>
                <div className="flex items-center gap-3 bg-[#0F7894]/5 border border-[#0F7894]/20 rounded-lg px-4 py-3">
                  <KeyRound className="h-5 w-5 text-[#0F7894] shrink-0" />
                  <span className="font-mono text-2xl font-bold tracking-[0.3em] text-[#0F7894] flex-1">
                    {assignedResult.code}
                  </span>
                  <Button size="sm" variant="ghost" className="px-2 h-7 shrink-0" onClick={() => { navigator.clipboard.writeText(assignedResult.code); toast({ title: "Code copied" }); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setAssignedResult(null); setAssignJuryId(""); setAssignStartupIds([]); }}>
                  Assign another
                </Button>
                <Button className="bg-[#0F7894] hover:bg-[#0c6078] text-white" onClick={() => { setShowAssignJury(false); setAssignedResult(null); }}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* ── Step 1: assign form ── */
            <div className="space-y-4">
              <div>
                <Label>Jury Member</Label>
                <Input
                  className="mt-1 mb-2"
                  placeholder="Search by name or email..."
                  value={jurySearch}
                  onChange={e => setJurySearch(e.target.value)}
                />
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                  {juryUsers
                    .filter((u: any) =>
                      !jurySearch ||
                      u.name?.toLowerCase().includes(jurySearch.toLowerCase()) ||
                      u.email?.toLowerCase().includes(jurySearch.toLowerCase())
                    )
                    .map((u: any) => (
                      <button
                        key={u.id}
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left ${assignJuryId === u.id.toString() ? "bg-[#0F7894]/5" : ""}`}
                        onClick={() => setAssignJuryId(u.id.toString())}
                      >
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        {assignJuryId === u.id.toString() && <Check className="h-4 w-4 text-[#0F7894] shrink-0" />}
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Startups to Evaluate</Label>
                  {roundStartups.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-[#0F7894] hover:underline"
                      onClick={() => {
                        const allIds = roundStartups.map((s: any) => s.id);
                        const allSelected = allIds.every((id: number) => assignStartupIds.includes(id));
                        setAssignStartupIds(allSelected ? [] : allIds);
                      }}
                    >
                      {roundStartups.every((s: any) => assignStartupIds.includes(s.id)) ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2">Select which startups this jury member will evaluate</p>
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {roundStartups.length === 0 ? (
                    <p className="text-sm text-gray-400 p-3">No startups in this round yet</p>
                  ) : roundStartups.map((s: any) => (
                    <button
                      key={s.id}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                      onClick={() => toggleAssignStartup(s.id)}
                    >
                      <span className="text-sm">{s.name}</span>
                      {assignStartupIds.includes(s.id) && <Check className="h-4 w-4 text-[#0F7894]" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAssignJury(false)}>Cancel</Button>
                <Button
                  onClick={() => assignJuryId && assignJuryMutation.mutate({ juryId: parseInt(assignJuryId), startupIds: assignStartupIds })}
                  disabled={!assignJuryId || assignStartupIds.length === 0 || assignJuryMutation.isPending}
                >
                  Assign ({assignStartupIds.length} startups)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
