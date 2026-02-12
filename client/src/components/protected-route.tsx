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

  useEffect(() => {
    if (!isLoading && (error || !authData?.user)) {
      setLocation("/login");
    } else if (!isLoading && requireAdmin && authData?.user?.role !== 'admin') {
      if (authData?.user?.role === 'jury') {
        setLocation("/jury-dashboard");
      } else if (authData?.user?.role === 'founder') {
        setLocation("/founder-onboarding");
      } else {
        setLocation("/login");
      }
    } else if (!isLoading && authData?.user?.role === 'founder' && window.location.pathname !== '/founder-onboarding') {
      setLocation("/founder-onboarding");
    }
  }, [isLoading, error, authData, setLocation, requireAdmin]);

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