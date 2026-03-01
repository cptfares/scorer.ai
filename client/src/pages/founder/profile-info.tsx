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
import { User, Save, Phone, Mail } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phoneNumber: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
});

export default function ProfileInfoPage() {
    const { toast } = useToast();
    const { data: authData } = useQuery<any>({
        queryKey: ["/api/auth/me"],
    });

    const user = authData?.user;

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        values: {
            name: user?.name || "",
            phoneNumber: user?.phoneNumber || "",
            bio: user?.bio || "",
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: z.infer<typeof profileSchema>) => {
            const response = await apiRequest("PATCH", "/api/users/me", data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            toast({ title: "Profile updated successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: z.infer<typeof profileSchema>) => {
        updateProfileMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
                <Header
                    title="Founder Profile"
                    subtitle="Keep your personal and contact details up to date"
                />
                <div className="p-8 max-w-2xl mx-auto">
                    <Card className="shadow-sm border-none bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <User className="text-[#0F7894]" size={20} />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        Full Name
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Enter your full name" className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                                    <Mail size={14} className="text-slate-400" />
                                                    Email Address (Read-Only)
                                                </label>
                                                <Input value={user?.email || ""} disabled className="bg-slate-100 text-slate-500 font-medium" />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="phoneNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Phone size={14} className="text-slate-400" />
                                                            Phone Number
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} value={field.value || ""} placeholder="+1 (555) 000-0000" className="bg-slate-50/50 border-slate-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="bio"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Short Bio</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            className="min-h-[140px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                                            {...field}
                                                            value={field.value || ""}
                                                            placeholder="Tell us about yourself..."
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="pt-6 border-t flex justify-end">
                                        <Button
                                            type="submit"
                                            className="bg-[#0F7894] hover:bg-[#0c6078] px-10 transition-transform active:scale-95 shadow-md shadow-[#0F7894]/10"
                                            disabled={updateProfileMutation.isPending}
                                        >
                                            <Save size={16} className="mr-2" />
                                            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
