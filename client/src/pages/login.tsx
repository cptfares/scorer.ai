import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, User, Lock } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Also call our backend to verify the user exists in our DB and get their local info
      const response = await apiRequest("POST", "/api/auth/login", {
        email: data.email,
        session: authData.session
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Login successful" });
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user.role;
      if (role === 'admin') {
        setLocation("/dashboard");
      } else if (role === 'founder') {
        setLocation("/founder/evaluation");
      } else if (role === 'jury') {
        setLocation("/jury-dashboard");
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-sm">
            <img src={logo} alt="Scorer Ai Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Scorer Ai</h1>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-slate-800">Welcome back</CardTitle>
            <p className="text-sm text-slate-600 text-center">
              Enter your credentials to access the platform
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 text-slate-400" size={18} />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
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
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-[hsl(var(--gray-200))]">
              <p className="text-xs text-[hsl(var(--gray-500))] text-center">
                For jury members: Use the email and password provided by your administrator
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}