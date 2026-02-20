import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type WordInput, type WordUpdateInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useWords() {
  return useQuery({
    queryKey: [api.words.list.path],
    queryFn: async () => {
      const res = await fetch(api.words.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch words");
      return api.words.list.responses[200].parse(await res.json());
    },
  });
}

export function useWord(id: number) {
  return useQuery({
    queryKey: [api.words.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.words.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch word");
      return api.words.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateWord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: WordInput) => {
      const res = await fetch(api.words.create.path, {
        method: api.words.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create word");
      return api.words.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.words.list.path] });
      toast({ title: "Success", description: "Vocabulary word added successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateWord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: WordUpdateInput & { id: number }) => {
      const url = buildUrl(api.words.update.path, { id });
      const res = await fetch(url, {
        method: api.words.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update word");
      return api.words.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.words.list.path] });
      toast({ title: "Success", description: "Word updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteWord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.words.delete.path, { id });
      const res = await fetch(url, {
        method: api.words.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete word");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.words.list.path] });
      toast({ title: "Success", description: "Word deleted successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useGenerateAiQuestions() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ wordIds }: { wordIds: number[] }) => {
      const res = await fetch(api.teacher.generateQuestions.path, {
        method: api.teacher.generateQuestions.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate AI questions");
      return api.teacher.generateQuestions.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "AI Success", description: "Questions generated successfully." });
    },
    onError: (error) => {
      toast({ title: "AI Error", description: error.message, variant: "destructive" });
    },
  });
}
