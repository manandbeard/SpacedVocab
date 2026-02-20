import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Landing from "@/pages/Landing";
import StudentStudy from "@/pages/StudentStudy";
import StudentProgress from "@/pages/StudentProgress";
import TeacherDashboard from "@/pages/TeacherDashboard";
import ManageVocabulary from "@/pages/ManageVocabulary";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/study" component={StudentStudy} />
      <Route path="/progress" component={StudentProgress} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/vocabulary" component={ManageVocabulary} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
