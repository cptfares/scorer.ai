import { Button } from "@/components/ui/button";
import { Bell, Plus, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  showBackButton?: boolean;
  backHref?: string;
  user?: { name: string; role: string };
  logout?: () => Promise<void>;
}

export default function Header({
  title,
  subtitle,
  showAddButton,
  addButtonLabel,
  onAddClick,
  showBackButton,
  backHref = "/",
  user,
  logout
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100 rounded-full h-10 w-10">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {showAddButton && (
              <Button
                onClick={onAddClick}
                className="bg-[#0F7894] hover:bg-[#0c6078] text-white border-[#0F7894] shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                {addButtonLabel || (title === "Jury Management" || title === "User Management" ? "Invite User" : "Add Startup")}
              </Button>
            )}
            <div className="flex items-center space-x-2 text-gray-500">
              <Bell size={20} />
              <span className="bg-[hsl(var(--error))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </div>
            {user && (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-3 text-right">
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="text-gray-500" size={16} />
                  </div>
                </div>
                {logout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    <span className="ml-2 hidden lg:inline">Logout</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
import { User, LogOut } from "lucide-react";
