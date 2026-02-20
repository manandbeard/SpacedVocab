import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.teacher.getDashboard.path],
    queryFn: async () => {
      const res = await fetch(api.teacher.getDashboard.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.teacher.getDashboard.responses[200].parse(await res.json());
    },
  });
}

export function useStudentStats() {
  return useQuery({
    queryKey: [api.teacher.getStudentStats.path],
    queryFn: async () => {
      const res = await fetch(api.teacher.getStudentStats.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch student stats");
      return api.teacher.getStudentStats.responses[200].parse(await res.json());
    },
  });
}
