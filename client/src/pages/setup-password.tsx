import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle2, BarChart3 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.png";

const setupPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function SetupPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<z.infer<typeof setupPasswordSchema>>({
        resolver: zodResolver(setupPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof setupPasswordSchema>) => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) throw error;

            setIsSuccess(true);
            toast({
                title: "Password Set Successfully",
                description: "You can now log in to the dashboard.",
            });

            setTimeout(() => {
                setLocation("/login");
            }, 3000);
        } catch (error: any) {
            toast({
                title: "Setup Failed",
                description: error.message || "Failed to set password",
                variant: "destructive",
            });
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-0 bg-white text-center p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <CheckCircle2 className="text-green-600" size={32} />
                    </div>
                    <CardTitle className="text-2xl text-slate-800 mb-2">Password Setup Complete!</CardTitle>
                    <p className="text-slate-600 mb-6">
                        Your account is ready. Redirecting you to login...
                    </p>
                    <Button
                        onClick={() => setLocation("/login")}
                        className="w-full bg-[#0F7894] hover:bg-[#0c6078]"
                    >
                        Go to Login
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-sm">
                        <img src={logo} alt="Scorer Ai Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Scorer Ai</h1>
                    <p className="text-slate-600 mt-2">Finish setting up your account</p>
                </div>

                <Card className="shadow-xl border-0 bg-white">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl text-center text-slate-800">Set Your Password</CardTitle>
                        <p className="text-sm text-slate-600 text-center">
                            Choose a strong password to secure your account
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-medium">New Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="Min 8 characters"
                                                        className="pl-10 h-12 border-slate-300 focus:border-[#0F7894] focus:ring-2 focus:ring-[#0F7894]/20 bg-white"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-medium">Confirm Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="Repeat password"
                                                        className="pl-10 h-12 border-slate-300 focus:border-[#0F7894] focus:ring-2 focus:ring-[#0F7894]/20 bg-white"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-[#0F7894] hover:bg-[#0c6078] text-white font-medium border-[#0F7894] shadow-sm"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? "Setting password..." : "Finish Account Setup"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
