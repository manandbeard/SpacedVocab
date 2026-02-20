import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type RecordAttemptInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useReviewQueue() {
  return useQuery({
    queryKey: [api.student.getReviewQueue.path],
    queryFn: async () => {
      const res = await fetch(api.student.getReviewQueue.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch review queue");
      return api.student.getReviewQueue.responses[200].parse(await res.json());
    },
  });
}

export function useStudentProgress() {
  return useQuery({
    queryKey: [api.student.myProgress.path],
    queryFn: async () => {
      const res = await fetch(api.student.myProgress.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch progress");
      return api.student.myProgress.responses[200].parse(await res.json());
    },
  });
}

export function useRecordAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RecordAttemptInput) => {
      const res = await fetch(api.student.recordAttempt.path, {
        method: api.student.recordAttempt.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record attempt");
      return api.student.recordAttempt.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.student.getReviewQueue.path] });
      queryClient.invalidateQueries({ queryKey: [api.student.myProgress.path] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
