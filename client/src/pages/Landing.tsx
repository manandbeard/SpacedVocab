import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, BrainCircuit, Zap, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/study");
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Hero */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-xl mx-auto lg:mx-0">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-primary/20 rounded-lg">
              <BrainCircuit className="w-8 h-8 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Recall.io</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight mb-6">
            Master Any Subject with <span className="text-primary">Spaced Retrieval</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Stop forgetting what you learn. Our smart algorithm adapts to your memory, scheduling reviews exactly when you need them for maximum retention.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h3 className="font-semibold">Smart Scheduling</h3>
              <p className="text-sm text-muted-foreground">SM-2 algorithm optimizes your review intervals.</p>
            </div>
            <div className="flex flex-col gap-2">
              <BarChart3 className="w-6 h-6 text-green-400" />
              <h3 className="font-semibold">Detailed Analytics</h3>
              <p className="text-sm text-muted-foreground">Track your mastery and retention rates.</p>
            </div>
            <div className="flex flex-col gap-2">
              <BrainCircuit className="w-6 h-6 text-blue-400" />
              <h3 className="font-semibold">Active Recall</h3>
              <p className="text-sm text-muted-foreground">Test yourself instead of passively reading.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="lg:w-1/2 bg-card border-l border-border p-8 lg:p-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-display">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Sign in to access your study deck</p>
          </div>

          <div className="space-y-4">
            <Button 
              className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20" 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
            >
              Log in with Replit
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By logging in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
