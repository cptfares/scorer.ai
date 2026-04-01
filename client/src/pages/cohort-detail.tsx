import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChevronLeft, Plus, ChevronRight, Pencil, Trash2, ListOrdered } from "lucide-react";

export default function CohortDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editRound, setEditRound] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", order: 1 });

  const { data: cohort } = useQuery<any>({ queryKey: [`/api/cohorts/${id}`] });
  const { data: rounds = [], isLoading } = useQuery<any[]>({ queryKey: [`/api/cohorts/${id}/rounds`] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/cohorts/${id}/rounds`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cohorts/${id}/rounds`] });
      setShowCreate(false);
      setForm({ name: "", description: "", order: rounds.length + 1 });
      toast({ title: "Round created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ roundId, data }: { roundId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/rounds/${roundId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cohorts/${id}/rounds`] });
      setEditRound(null);
      toast({ title: "Round updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (roundId: number) => {
      const res = await apiRequest("DELETE", `/api/rounds/${roundId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cohorts/${id}/rounds`] });
      toast({ title: "Round deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (round: any) => {
    setEditRound(round);
    setForm({ name: round.name, description: round.description || "", order: round.order || 1 });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editRound) updateMutation.mutate({ roundId: editRound.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Header
          title={cohort?.name || "Cohort"}
          subtitle={cohort?.description || "Manage rounds for this cohort"}
        />
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/cohorts")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Cohorts
            </Button>
            <Button onClick={() => { setShowCreate(true); setForm({ name: "", description: "", order: rounds.length + 1 }); }}>
              <Plus className="h-4 w-4 mr-2" /> New Round
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F7894]" />
            </div>
          ) : rounds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ListOrdered className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No rounds yet</p>
                <p className="text-gray-400 text-sm mt-1">Create rounds to organize evaluations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rounds.map((round: any) => (
                <Card key={round.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-4 cursor-pointer flex-1"
                        onClick={() => navigate(`/cohorts/${id}/rounds/${round.id}`)}
                      >
                        <div className="h-10 w-10 bg-[#0F7894]/10 rounded-lg flex items-center justify-center font-bold text-[#0F7894]">
                          {round.order || "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{round.name}</h3>
                            <Badge variant={round.isActive ? "default" : "secondary"}>
                              {round.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {round.description && (
                            <p className="text-sm text-gray-500 mt-1">{round.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(round)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { if (confirm("Delete this round?")) deleteMutation.mutate(round.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/cohorts/${id}/rounds/${round.id}`)}>
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

      <Dialog open={showCreate || !!editRound} onOpenChange={() => { setShowCreate(false); setEditRound(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRound ? "Edit Round" : "New Round"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Round 1: Screening"
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
            <div>
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                min={1}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditRound(null); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editRound ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
