import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useFieldArray } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, UserPlus, X } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StartupCard from "@/components/startup-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStartupSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const startupFormSchema = insertStartupSchema.extend({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

export default function Startups() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState<any>(null);
  const [filterCohortId, setFilterCohortId] = useState<string>("all");
  const { toast } = useToast();

  const { data: startups, isLoading } = useQuery({
    queryKey: ["/api/startups"],
  });

  const { data: cohorts = [] } = useQuery<any[]>({
    queryKey: ["/api/cohorts"],
  });

  const { data: activePhase } = useQuery({
    queryKey: ["/api/phases/active"],
  });

  // Fetch rounds for each cohort so we can show the active round per startup
  const uniqueCohortIds: number[] = useMemo(() =>
    [...new Set(((startups as any[]) || []).map((s: any) => s.cohortId).filter(Boolean))],
    [startups]
  );

  const cohortRoundsQueries = useQuery<Record<number, any[]>>({
    queryKey: ["cohort-rounds-bulk", uniqueCohortIds],
    enabled: uniqueCohortIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        uniqueCohortIds.map(async (cId) => {
          const res = await apiRequest("GET", `/api/cohorts/${cId}/rounds`);
          return [cId, await res.json()] as [number, any[]];
        })
      );
      return Object.fromEntries(results);
    },
  });

  const cohortRoundsMap: Record<number, any[]> = cohortRoundsQueries.data || {};

  // Active (or latest) round per cohort
  const activeRoundByCohort = useMemo(() => {
    const map: Record<number, any> = {};
    for (const [cohortId, rounds] of Object.entries(cohortRoundsMap)) {
      const sorted = [...(rounds as any[])].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
      map[Number(cohortId)] = sorted.find((r: any) => r.isActive) ?? sorted[0] ?? null;
    }
    return map;
  }, [cohortRoundsMap]);

  // Fetch jury assignments + evaluations for all active rounds
  const activeRoundIds: number[] = useMemo(() =>
    Object.values(activeRoundByCohort).filter(Boolean).map((r: any) => r.id),
    [activeRoundByCohort]
  );

  const { data: allAssignments = [] } = useQuery<any[]>({
    queryKey: ["jury-assignments-bulk", activeRoundIds],
    enabled: activeRoundIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        activeRoundIds.map(async (rId) => {
          const res = await apiRequest("GET", `/api/jury-assignments?roundId=${rId}`);
          return res.json();
        })
      );
      return results.flat();
    },
  });

  const { data: allEvaluations = [] } = useQuery<any[]>({
    queryKey: ["evaluations-bulk", activeRoundIds],
    enabled: activeRoundIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        activeRoundIds.map(async (rId) => {
          const res = await apiRequest("GET", `/api/evaluations?roundId=${rId}`);
          return res.json();
        })
      );
      return results.flat();
    },
  });

  const form = useForm<z.infer<typeof startupFormSchema>>({
    resolver: zodResolver(startupFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      founded: "",
      teamSize: "",
      stage: "",
      fundingSeek: "",
      website: "",
      cohortId: null,
      team: [],
      revenueModel: "",
      onePagerLink: "",
    },
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control: form.control,
    name: "team" as any,
  });

  const filteredStartups = filterCohortId === "all"
    ? startups
    : filterCohortId === "none"
      ? (startups as any[])?.filter((s: any) => !s.cohortId)
      : (startups as any[])?.filter((s: any) => String(s.cohortId) === filterCohortId);

  const getCohortName = (cohortId: number | null) => {
    if (!cohortId) return null;
    const cohort = (cohorts as any[]).find((c: any) => c.id === cohortId);
    return cohort?.name || null;
  };

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof startupFormSchema>) => {
      const response = await apiRequest("POST", "/api/startups", {
        ...data,
        phaseId: activePhase?.id || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      toast({ title: "Startup created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create startup", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof startupFormSchema>) => {
      const response = await apiRequest("PUT", `/api/startups/${editingStartup.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      toast({ title: "Startup updated successfully" });
      setIsDialogOpen(false);
      setEditingStartup(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update startup", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/startups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      toast({ title: "Startup deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete startup", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof startupFormSchema>) => {
    if (editingStartup) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (startup: any) => {
    setEditingStartup(startup);
    form.reset({
      name: startup.name ?? "",
      category: startup.category ?? "",
      description: startup.description ?? "",
      founded: startup.founded ?? "",
      teamSize: startup.teamSize ?? "",
      stage: startup.stage ?? "",
      fundingSeek: startup.fundingSeek ?? "",
      website: startup.website ?? "",
      cohortId: startup.cohortId ?? null,
      team: Array.isArray(startup.team) ? startup.team : [],
      revenueModel: startup.revenueModel ?? "",
      onePagerLink: startup.onePagerLink ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this startup?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingStartup(null);
    form.reset({
      name: "", category: "", description: "", founded: "",
      teamSize: "", stage: "", fundingSeek: "", website: "",
      cohortId: null, team: [], revenueModel: "", onePagerLink: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen">
        <Header 
          title="Startup Management" 
          subtitle="Manage startups in your current cohort"
          showAddButton
          onAddClick={handleAddNew}
        />
        
        <div className="p-8 space-y-6">
          {/* Cohort filter */}
          {(cohorts as any[]).length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Filter by cohort:</span>
              <Select value={filterCohortId} onValueChange={setFilterCohortId}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All startups</SelectItem>
                  <SelectItem value="none">No cohort</SelectItem>
                  {(cohorts as any[]).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filteredStartups as any[])?.map((startup: any) => {
                const activeRound = startup.cohortId ? activeRoundByCohort[startup.cohortId] : null;
                const roundId = activeRound?.id;
                const assigned = (allAssignments as any[]).filter((a: any) => a.startupId === startup.id && a.roundId === roundId);
                const completed = (allEvaluations as any[]).filter((e: any) => e.startupId === startup.id && e.roundId === roundId && e.isCompleted);
                return (
                <div key={startup.id} className="relative group">
                  <StartupCard
                    startup={{ ...startup, cohortName: getCohortName(startup.cohortId) }}
                    currentRound={activeRound?.name ?? null}
                    juryTotal={assigned.length}
                    juryCompleted={completed.length}
                    onEdit={() => handleEdit(startup)}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(startup.id)}
                      className="bg-white shadow-sm hover:bg-red-50 hover:text-red-600 border-red-200 text-red-500"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStartup ? "Edit Startup" : "Add New Startup"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Startup Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter startup name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AI/ML">AI/ML</SelectItem>
                              <SelectItem value="FinTech">FinTech</SelectItem>
                              <SelectItem value="HealthTech">HealthTech</SelectItem>
                              <SelectItem value="EdTech">EdTech</SelectItem>
                              <SelectItem value="CleanTech">CleanTech</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cohortId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cohort</FormLabel>
                        <Select
                          onValueChange={v => field.onChange(v === "none" ? null : parseInt(v))}
                          value={field.value ? String(field.value) : "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to a cohort (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No cohort</SelectItem>
                            {(cohorts as any[]).map((c: any) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the startup" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="founded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Founded</FormLabel>
                          <FormControl>
                            <Input placeholder="2023" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size</FormLabel>
                          <FormControl>
                            <Input placeholder="4 members" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Idea">Idea</SelectItem>
                              <SelectItem value="MVP">MVP</SelectItem>
                              <SelectItem value="Beta">Beta</SelectItem>
                              <SelectItem value="Growth">Growth</SelectItem>
                              <SelectItem value="Scale">Scale</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fundingSeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Sought</FormLabel>
                          <FormControl>
                            <Input placeholder="$250K" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://startup.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* One-Pager Link */}
                  <FormField
                    control={form.control}
                    name="onePagerLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>One-Pager Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://canva.com/..." {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Revenue Model */}
                  <FormField
                    control={form.control}
                    name="revenueModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Revenue Model</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the revenue model..." {...field} value={field.value ?? ""} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Team Members */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Team Members</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendTeam({ name: "", role: "" })}>
                        <UserPlus size={13} className="mr-1" /> Add Member
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {teamFields.map((field, idx) => (
                        <div key={field.id} className="flex gap-2 items-center">
                          <Input
                            placeholder="Name"
                            {...form.register(`team.${idx}.name` as any)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Role (e.g. CEO)"
                            {...form.register(`team.${idx}.role` as any)}
                            className="flex-1"
                          />
                          <Button type="button" variant="ghost" size="sm" className="px-2 text-gray-400 hover:text-red-500" onClick={() => removeTeam(idx)}>
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                      {teamFields.length === 0 && (
                        <p className="text-xs text-gray-400">No team members added yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#0F7894] hover:bg-[#0c6078] text-white border-[#0F7894] shadow-sm"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingStartup ? "Update" : "Create"} Startup
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
