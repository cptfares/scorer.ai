import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertStartupSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Rocket, User, Phone, FileText } from "lucide-react";
import { z } from "zod";

const onboardingSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    bio: z.string().min(10, "Bio must be at least 10 characters"),
    startup: insertStartupSchema.omit({ phaseId: true }),
});

export default function FounderOnboarding() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);

    const { data: authData } = useQuery<any>({
        queryKey: ["/api/auth/me"],
    });

    const { data: activePhase } = useQuery<any>({
        queryKey: ["/api/phases/active"],
    });

    const form = useForm<z.infer<typeof onboardingSchema>>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            name: authData?.user?.name || "",
            phoneNumber: "",
            bio: "",
            startup: {
                name: "",
                description: "",
                category: "",
                founded: "",
                teamSize: "1",
                stage: "Ideation",
                fundingSeek: "0",
                website: "",
                logoUrl: "",
            },
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest("PATCH", "/api/users/me", {
                name: data.name,
                phoneNumber: data.phoneNumber,
                bio: data.bio,
            });
            return response.json();
        },
        onSuccess: () => {
            setStep(2);
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved. Now let's add your startup.",
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

    const createStartupMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!activePhase?.id) {
                throw new Error("No active application phase found. Please contact an admin.");
            }
            const response = await apiRequest("POST", "/api/startups", {
                ...data,
                phaseId: activePhase.id,
            });
            return response.json();
        },
        onSuccess: () => {
            setStep(3);
            toast({
                title: "Startup Created",
                description: "Your startup has been registered successfully!",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleProfileNext = async () => {
        const isValid = await form.trigger(["name", "phoneNumber", "bio"]);
        if (isValid) {
            updateProfileMutation.mutate(form.getValues());
        }
    };

    const onStartupSubmit = (data: any) => {
        // Since the schema is partial, we need to ensure required fields are present here
        try {
            insertStartupSchema.omit({ phaseId: true }).parse(data.startup);
            createStartupMutation.mutate(data.startup);
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.errors.forEach(err => {
                    form.setError(`startup.${err.path[0]}` as any, {
                        type: "manual",
                        message: err.message
                    });
                });
            }
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <main className="flex-1 min-h-screen flex items-center justify-center p-8">
                <div className="max-w-2xl w-full space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, Founder!</h1>
                        <p className="text-gray-600">Let's get your profile and startup set up.</p>
                    </div>

                    <div className="flex justify-center space-x-4 mb-8">
                        <div className={`flex items-center space-x-2 ${step >= 1 ? "text-[hsl(var(--primary-600))]" : "text-gray-400"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-[hsl(var(--primary-600))] bg-[hsl(var(--primary-100))]" : "border-gray-300"}`}>
                                <User size={16} />
                            </div>
                            <span className="font-medium">Profile</span>
                        </div>
                        <div className="w-8 border-t-2 border-gray-300 mt-4"></div>
                        <div className={`flex items-center space-x-2 ${step >= 2 ? "text-[hsl(var(--primary-600))]" : "text-gray-400"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-[hsl(var(--primary-600))] bg-[hsl(var(--primary-100))]" : "border-gray-300"}`}>
                                <Rocket size={16} />
                            </div>
                            <span className="font-medium">Startup</span>
                        </div>
                        <div className="w-8 border-t-2 border-gray-300 mt-4"></div>
                        <div className={`flex items-center space-x-2 ${step >= 3 ? "text-[hsl(var(--primary-600))]" : "text-gray-400"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-[hsl(var(--primary-600))] bg-[hsl(var(--primary-100))]" : "border-gray-300"}`}>
                                <CheckCircle size={16} />
                            </div>
                            <span className="font-medium">Complete</span>
                        </div>
                    </div>

                    <Card className="shadow-xl border-t-4 border-t-[hsl(var(--primary-500))]">
                        {step === 1 && (
                            <>
                                <CardHeader>
                                    <CardTitle>Personal Profile</CardTitle>
                                    <CardDescription>Tell us a bit about yourself.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter your full name" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phoneNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                                                                <Input className="pl-10" placeholder="Enter your phone number" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="bio"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bio</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Write a short bio about your entrepreneurial journey..."
                                                                className="min-h-[100px]"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                className="w-full bg-primary hover:bg-primary/90"
                                                disabled={updateProfileMutation.isPending}
                                                onClick={handleProfileNext}
                                            >
                                                {updateProfileMutation.isPending ? "Saving..." : "Next: Startup Info"}
                                            </Button>
                                        </div>
                                    </Form>
                                </CardContent>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <CardHeader>
                                    <CardTitle>Startup Information</CardTitle>
                                    <CardDescription>Tell us about your company.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onStartupSubmit)} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="startup.name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Startup Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Company name" {...field} value={field.value || ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="startup.category"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Category</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Fintech, Edtech" {...field} value={field.value || ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="startup.founded"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Founded Date/Year</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. 2024" {...field} value={field.value || ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="startup.description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="What problem are you solving?"
                                                                className="min-h-[80px]"
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="startup.stage"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Stage</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Seed, Series A" {...field} value={field.value || ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="startup.fundingSeek"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Funding Sought ($)</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value)} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="startup.teamSize"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Team Size</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value)} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="startup.website"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Website</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="https://..." {...field} value={field.value || ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full bg-primary hover:bg-primary/90"
                                                disabled={createStartupMutation.isPending}
                                            >
                                                {createStartupMutation.isPending ? "Creating..." : "Finish Onboarding"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="w-full mt-2"
                                                onClick={() => setStep(1)}
                                            >
                                                Back to Profile
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </>
                        )}

                        {step === 3 && (
                            <CardContent className="py-12 text-center space-y-6">
                                <div className="w-20 h-20 bg-[hsl(var(--success-100))] rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="text-[hsl(var(--success-600))]" size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-gray-900">All Set!</h2>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        Your profile and startup have been successfully set up. You now have access to the dashboard.
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90"
                                    onClick={() => window.location.href = "/"}
                                >
                                    Go to Dashboard
                                </Button>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
