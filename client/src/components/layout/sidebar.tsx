import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  Rocket, 
  ClipboardCheck, 
  TrendingUp, 
  FileText,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Startups", href: "/startups", icon: Rocket },
  { name: "Jury Management", href: "/jury", icon: Users },
  { name: "Evaluations", href: "/evaluations", icon: ClipboardCheck },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: FileText },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-30">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[hsl(var(--primary-500))] rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white text-lg" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">StartupEval</h1>
            <p className="text-sm text-gray-500">Pro Platform</p>
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
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">Administrator</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
