import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  const { data: authData, isLoading, error } = useQuery<{
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
    } | null;
  }>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 0, // Always check auth on protected routes
  });

  const { data: startup, isLoading: isStartupLoading } = useQuery<any>({
    queryKey: ["/api/startups/me"],
    enabled: !!authData?.user && authData.user.role === 'founder',
  });

  useEffect(() => {
    if (isLoading || isStartupLoading) return;

    if (error || !authData?.user) {
      setLocation("/login");
      return;
    }

    const { role } = authData.user;
    const { pathname } = window.location;

    // Admin requirement check
    if (requireAdmin && role !== 'admin') {
      if (role === 'jury') setLocation("/jury-dashboard");
      else if (role === 'founder') {
        if (!startup) setLocation("/founder-onboarding");
        else setLocation("/founder/evaluation");
      }
      else setLocation("/login");
      return;
    }

    // Founder onboarding check
    if (role === 'founder' && !startup && pathname !== '/founder-onboarding') {
      setLocation("/founder-onboarding");
    } else if (role === 'founder' && startup && pathname === '/founder-onboarding') {
      setLocation("/founder/evaluation");
    }
  }, [isLoading, isStartupLoading, error, authData, startup, setLocation, requireAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-50))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[hsl(var(--primary-500))] rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white rounded"></div>
          </div>
          <p className="text-[hsl(var(--gray-500))]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !authData?.user) {
    return null;
  }

  if (requireAdmin && authData?.user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}