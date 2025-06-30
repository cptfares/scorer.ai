import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
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
  const { toast } = useToast();

  const { data: startups, isLoading } = useQuery({
    queryKey: ["/api/startups"],
  });

  const { data: activePhase } = useQuery({
    queryKey: ["/api/phases/active"],
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
      phaseId: activePhase?.id,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof startupFormSchema>) => {
      const response = await apiRequest("POST", "/api/startups", {
        ...data,
        phaseId: activePhase?.id,
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
    form.reset(startup);
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
      name: "",
      category: "",
      description: "",
      founded: "",
      teamSize: "",
      stage: "",
      fundingSeek: "",
      website: "",
      phaseId: activePhase?.id,
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
        
        <div className="p-8">
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
              {startups?.map((startup: any) => (
                <div key={startup.id} className="relative group">
                  <StartupCard
                    startup={startup}
                    evaluationProgress={Math.floor(Math.random() * 100)}
                    totalEvaluations={18}
                    completedEvaluations={Math.floor(Math.random() * 18)}
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
              ))}
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
