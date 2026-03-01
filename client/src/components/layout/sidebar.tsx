import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  Rocket,
  ClipboardCheck,
  TrendingUp,
  FileText,
  LogOut,
  User,
  Info,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const adminNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Startups", href: "/startups", icon: Rocket },
  { name: "User Management", href: "/jury", icon: Users },
  { name: "Evaluations", href: "/evaluations", icon: ClipboardCheck },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: FileText },
];

const juryNavigation = [
  { name: "Dashboard", href: "/jury-dashboard", icon: BarChart3 },
];

const founderNavigation = [
  { name: "Evaluation", href: "/founder/evaluation", icon: Award },
  { name: "Startup Info", href: "/founder/startup", icon: Info },
  { name: "Founder Info", href: "/founder/profile", icon: User },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: authData } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("user");
      setLocation("/login");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  const user = authData?.user;
  const isAdmin = user?.role === 'admin';
  const isFounder = user?.role === 'founder';

  const navigation = isAdmin
    ? adminNavigation
    : isFounder
      ? founderNavigation
      : juryNavigation;

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-30">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            <img src={logo} alt="Scorer Ai Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900"> Scorer Ai</h1>
            <p className="text-sm text-slate-500">Pro Platform</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "sidebar-nav-item",
                isActive && "active"
              )}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role || "Role"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
