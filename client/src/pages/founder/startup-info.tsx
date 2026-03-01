import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Save } from "lucide-react";
import { z } from "zod";

const startupEditSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
    category: z.string().min(1, "Category is required"),
    founded: z.string().optional().nullable(),
    teamSize: z.coerce.string().optional().nullable(),
    stage: z.string().optional().nullable(),
    fundingSeek: z.coerce.string().optional().nullable(),
    website: z.string().optional().nullable(),
});

export default function StartupInfoPage() {
    const { toast } = useToast();
    const { data: startup, isLoading } = useQuery<any>({
        queryKey: ["/api/startups/me"],
    });

    const form = useForm<z.infer<typeof startupEditSchema>>({
        resolver: zodResolver(startupEditSchema),
        values: {
            name: startup?.name || "",
            description: startup?.description || "",
            category: startup?.category || "",
            founded: startup?.founded || "",
            teamSize: startup?.teamSize || "",
            stage: startup?.stage || "",
            fundingSeek: startup?.fundingSeek || "",
            website: startup?.website || "",
        },
    });

    const updateStartupMutation = useMutation({
        mutationFn: async (data: z.infer<typeof startupEditSchema>) => {
            const response = await apiRequest("PUT", `/api/startups/${startup.id}`, data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/startups/me"] });
            toast({ title: "Startup updated successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: z.infer<typeof startupEditSchema>) => {
        updateStartupMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
                <Header
                    title="Startup Information"
                    subtitle="Manage your company's public profile and details"
                />
                <div className="p-8 max-w-4xl mx-auto">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rocket className="text-[#0F7894]" size={20} />
                                Startup Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="py-20 text-center text-slate-400">Loading startup details...</div>
                            ) : (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Startup Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
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
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
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
                                                        <Textarea className="min-h-[120px]" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="stage"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Stage</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="fundingSeek"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Funding Sought ($)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} value={field.value || ""} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="teamSize"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Team Size</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} value={field.value || ""} />
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
                                                            <Input {...field} value={field.value || ""} placeholder="https://..." />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="flex justify-end pt-4 border-t">
                                            <Button
                                                type="submit"
                                                className="bg-[#0F7894] hover:bg-[#0c6078] px-8"
                                                disabled={updateStartupMutation.isPending}
                                            >
                                                <Save size={16} className="mr-2" />
                                                {updateStartupMutation.isPending ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
