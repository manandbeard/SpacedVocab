import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Library, 
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Study Session", href: "/study", icon: BookOpen },
    { name: "My Progress", href: "/progress", icon: GraduationCap },
    { name: "Teacher Dashboard", href: "/teacher", icon: LayoutDashboard },
    { name: "Vocabulary", href: "/vocabulary", icon: Library },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={toggleSidebar}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Recall.io
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Spaced Retrieval</p>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
