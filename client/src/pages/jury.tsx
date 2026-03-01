import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertJuryAssignmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, UserPlus, Users, CheckCircle, Settings, Trash2, Rocket } from "lucide-react";
import { z } from "zod";

const juryInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["jury", "founder"]).default("jury"),
});

export default function Jury() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJury, setSelectedJury] = useState<any>(null);
  const [selectedStartups, setSelectedStartups] = useState<number[]>([]);
  const [invitationResult, setInvitationResult] = useState<{ email: string, name: string, password: string, role: string } | null>(null);
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"], // Fetch all users to filter by role
  });

  const juryMembers = Array.isArray(users) ? users.filter((u: any) => u.role === "jury") : [];
  const founders = Array.isArray(users) ? users.filter((u: any) => u.role === "founder") : [];

  const { data: startups } = useQuery<any[]>({
    queryKey: ["/api/startups"],
  });

  const { data: activePhase } = useQuery<any>({
    queryKey: ["/api/phases/active"],
  });

  const { data: allAssignments } = useQuery<any[]>({
    queryKey: ["/api/jury-assignments"],
  });

  const form = useForm<z.infer<typeof juryInviteSchema>>({
    resolver: zodResolver(juryInviteSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "jury",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof juryInviteSchema>) => {
      const response = await apiRequest("POST", "/api/users/invite", data);
      const resJSON = await response.json();
      return resJSON;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      form.reset();

      // Store result to show in the centered Dialog
      setInvitationResult({
        email: variables.email,
        name: variables.name,
        password: data.password,
        role: variables.role
      });

      toast({
        title: "Success",
        description: `${variables.name} has been added successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { juryId: number, startupIds: number[], phaseId: number }) => {
      const response = await apiRequest("POST", "/api/jury-assignments/bulk", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jury-assignments"] });
      setIsAssignDialogOpen(false);
      setSelectedStartups([]);
      toast({
        title: "Assignments Updated",
        description: "Startup assignments have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof juryInviteSchema>) => {
    inviteMutation.mutate(data);
  };

  const handleOpenAssignDialog = (member: any) => {
    setSelectedJury(member);
    const memberAssignments = allAssignments?.filter((a: any) => a.juryId === member.id) || [];
    setSelectedStartups(memberAssignments.map((a: any) => a.startupId));
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!selectedJury || !activePhase) return;
    assignMutation.mutate({
      juryId: selectedJury.id,
      startupIds: selectedStartups,
      phaseId: activePhase.id
    });
  };

  const toggleStartupSelection = (id: number) => {
    setSelectedStartups(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen">
        <Header
          title="User Management"
          subtitle="Manage all users, including jury members and founders"
          showAddButton={true}
          addButtonLabel="Invite New User"
          onAddClick={() => setIsDialogOpen(true)}
        />

        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jury</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {juryMembers.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--info-100))] rounded-lg flex items-center justify-center">
                    <Users className="text-[hsl(var(--info-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Founders</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {founders.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--primary-100))] rounded-lg flex items-center justify-center">
                    <Rocket className="text-[hsl(var(--primary-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {Array.isArray(users) ? users.filter((u: any) => u.isActive).length : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--success-100))] rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-[hsl(var(--success-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="jury" className="space-y-6">
            <TabsList>
              <TabsTrigger value="jury">Jury Members</TabsTrigger>
              <TabsTrigger value="founders">Founders</TabsTrigger>
            </TabsList>

            <TabsContent value="jury">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Jury Members</CardTitle>
                    <Button
                      onClick={() => {
                        form.setValue("role", "jury");
                        setIsDialogOpen(true);
                      }}
                      className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Invite Jury Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {juryMembers.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg group">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[hsl(var(--primary-100))] rounded-full flex items-center justify-center">
                              <span className="text-[hsl(var(--primary-600))] font-bold">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-600">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={member.isActive ? "default" : "secondary"}>
                              {member.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAssignDialog(member)}
                            >
                              Assign Startups
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${member.name}?`)) {
                                  deleteMutation.mutate(member.id);
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="founders">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Founders</CardTitle>
                    <Button
                      onClick={() => {
                        form.setValue("role", "founder");
                        setIsDialogOpen(true);
                      }}
                      className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Invite Founder
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {founders.map((member: any) => {
                        const founderStartup = startups?.find((s: any) => s.userId === member.id);
                        return (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg group">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-[hsl(var(--info-100))] rounded-full flex items-center justify-center">
                                <span className="text-[hsl(var(--info-600))] font-bold">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-600">{member.email}</p>
                                {founderStartup && (
                                  <p className="text-xs font-semibold text-[hsl(var(--primary-600))] mt-1">
                                    Startup: {founderStartup.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant={member.isActive ? "default" : "secondary"}>
                                {member.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${member.name}?`)) {
                                    deleteMutation.mutate(member.id);
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="jury">Jury Member</SelectItem>
                            <SelectItem value="founder">Founder</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#0F7894] hover:bg-[#0c6078] text-white border-[#0F7894] shadow-sm"
                      disabled={inviteMutation.isPending}
                    >
                      {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Startups to {selectedJury?.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>Select startups to assign for {activePhase?.name || "Active Phase"}</p>
                  <p>{selectedStartups.length} selected</p>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  {Array.isArray(startups) && startups.map((startup: any) => (
                    <div
                      key={startup.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => toggleStartupSelection(startup.id)}
                    >
                      <Checkbox
                        checked={selectedStartups.includes(startup.id)}
                        onCheckedChange={() => toggleStartupSelection(startup.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{startup.name}</p>
                        <p className="text-xs text-gray-500">{startup.category}</p>
                      </div>
                      <Badge variant="outline">{startup.stage}</Badge>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAssignDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignSubmit}
                    className="bg-[#0F7894] hover:bg-[#0c6078] text-white border-[#0F7894] shadow-sm"
                    disabled={assignMutation.isPending || !activePhase}
                  >
                    {assignMutation.isPending ? "Saving..." : "Save Assignments"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Centered Success Dialog for Invitation Results */}
          <Dialog open={!!invitationResult} onOpenChange={(open) => !open && setInvitationResult(null)}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <DialogTitle className="text-xl">
                  {invitationResult?.role.charAt(0).toUpperCase()}{invitationResult?.role.slice(1)} Created Successfully
                </DialogTitle>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <p className="text-slate-600">
                  User accounts have been created in both Supabase and our system.
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium text-slate-900">{invitationResult?.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-3 border-slate-200">
                    <span className="text-slate-500">Password:</span>
                    <span className="font-mono font-bold text-[#0F7894]">{invitationResult?.password}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-[#0F7894] hover:bg-[#0c6078]"
                  onClick={() => {
                    if (invitationResult) {
                      const info = `your login information is email : ${invitationResult.email} and password : ${invitationResult.password}`;
                      navigator.clipboard.writeText(info);
                      toast({ title: "Portal Credentials Copied" });
                    }
                  }}
                >
                  Copy Login Information
                </Button>

                <p className="text-xs text-amber-600 font-medium">
                  Please copy these credentials now. For security reasons, the password will not be shown again.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
