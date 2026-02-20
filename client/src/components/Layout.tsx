import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="container mx-auto p-4 lg:p-8 max-w-6xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
