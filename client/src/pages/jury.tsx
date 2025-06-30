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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertJuryAssignmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, UserPlus, Users, CheckCircle, Settings } from "lucide-react";
import { z } from "zod";

const juryInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
});

export default function Jury() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJury, setSelectedJury] = useState<any>(null);
  const [selectedStartups, setSelectedStartups] = useState<number[]>([]);
  const { toast } = useToast();

  const { data: juryMembers, isLoading } = useQuery({
    queryKey: ["/api/users", { role: "jury" }],
    queryFn: () => fetch("/api/users?role=jury").then(res => res.json()),
  });

  const { data: startups } = useQuery({
    queryKey: ["/api/startups"],
  });

  const form = useForm<z.infer<typeof juryInviteSchema>>({
    resolver: zodResolver(juryInviteSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof juryInviteSchema>) => {
      const response = await fetch("/api/jury/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite jury member");
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Jury Member Invited",
        description: `Login credentials: Email: ${result.email}, Password: ${result.password}`,
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

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen">
        <Header 
          title="Jury Management" 
          subtitle="Manage jury members and assignments"
          showAddButton={true}
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
                      {juryMembers?.length || 0}
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
                    <p className="text-sm font-medium text-gray-600">Active Members</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {juryMembers?.filter((j: any) => j.isActive).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--success-100))] rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-[hsl(var(--success-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Assignments</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {startups?.length && juryMembers?.length ? 
                        Math.ceil(startups.length / juryMembers.length) : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--primary-100))] rounded-lg flex items-center justify-center">
                    <Mail className="text-[hsl(var(--primary-600))]" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jury Members List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Jury Members</CardTitle>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
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
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-32"></div>
                          <div className="h-3 bg-gray-300 rounded w-48"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {juryMembers?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[hsl(var(--primary-100))] rounded-full flex items-center justify-center">
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
                        <Badge 
                          variant={member.isActive ? "default" : "secondary"}
                          className={member.isActive ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]" : ""}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Assignments
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Jury Member</DialogTitle>
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
        </div>
      </main>
    </div>
  );
}
