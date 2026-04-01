import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Layers, Plus, ChevronRight, Calendar, Pencil, Trash2 } from "lucide-react";

export default function Cohorts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editCohort, setEditCohort] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", isActive: true });

  const { data: cohorts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/cohorts"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/cohorts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      setShowCreate(false);
      setForm({ name: "", description: "", isActive: true });
      toast({ title: "Cohort created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/cohorts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      setEditCohort(null);
      toast({ title: "Cohort updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/cohorts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      toast({ title: "Cohort deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (cohort: any) => {
    setEditCohort(cohort);
    setForm({ name: cohort.name, description: cohort.description || "", isActive: cohort.isActive });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editCohort) updateMutation.mutate({ id: editCohort.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Header title="Cohorts" subtitle="Manage evaluation cohorts and their rounds" />
        <div className="p-8 space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => { setShowCreate(true); setForm({ name: "", description: "", isActive: true }); }}>
              <Plus className="h-4 w-4 mr-2" /> New Cohort
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F7894]" />
            </div>
          ) : cohorts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Layers className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No cohorts yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first cohort to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {cohorts.map((cohort: any) => (
                <Card key={cohort.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4" onClick={() => navigate(`/cohorts/${cohort.id}`)}>
                        <div className="h-10 w-10 bg-[#0F7894]/10 rounded-lg flex items-center justify-center">
                          <Layers className="h-5 w-5 text-[#0F7894]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{cohort.name}</h3>
                            <Badge variant={cohort.isActive ? "default" : "secondary"}>
                              {cohort.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {cohort.description && (
                            <p className="text-sm text-gray-500 mt-1">{cohort.description}</p>
                          )}
                          {(cohort.startDate || cohort.endDate) && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Calendar className="h-3 w-3" />
                              {cohort.startDate && new Date(cohort.startDate).toLocaleDateString()}
                              {cohort.startDate && cohort.endDate && " – "}
                              {cohort.endDate && new Date(cohort.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cohort)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { if (confirm("Delete this cohort?")) deleteMutation.mutate(cohort.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/cohorts/${cohort.id}`)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showCreate || !!editCohort} onOpenChange={() => { setShowCreate(false); setEditCohort(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCohort ? "Edit Cohort" : "New Cohort"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Spring 2026"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditCohort(null); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editCohort ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
