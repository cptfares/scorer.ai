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
}

export default function Header({
  title,
  subtitle,
  showAddButton,
  addButtonLabel,
  onAddClick,
  showBackButton,
  backHref = "/"
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
          </div>
        </div>
      </div>
    </header>
  );
}
