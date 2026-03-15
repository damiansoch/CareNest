import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { seniorsApi } from "@/lib/api/endpoints";
import type { Senior } from "@/types";
import { toast } from "@/store/toast";
import { extractApiErrors } from "@/lib/utils/apiErrors";

export function useSeniors(includeArchived = false) {
  return useQuery({
    queryKey: ["seniors", { archived: includeArchived }],
    queryFn: async () => {
      const res = await seniorsApi.list({ archived: includeArchived || undefined });
      return res.data.results;
    },
  });
}

export function useSenior(id: string) {
  return useQuery({
    queryKey: ["seniors", id],
    queryFn: async () => {
      const res = await seniorsApi.get(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateSenior() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Senior>) => seniorsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seniors"] });
      toast({ title: "Podopieczny dodany", variant: "default" });
    },
    onError: (error) => toast({ title: "Błąd", description: extractApiErrors(error), variant: "destructive" }),
  });
}

export function useUpdateSenior(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Senior>) => seniorsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seniors"] });
      qc.invalidateQueries({ queryKey: ["seniors", id] });
      toast({ title: "Zapisano zmiany" });
    },
    onError: (error) => toast({ title: "Błąd", description: extractApiErrors(error), variant: "destructive" }),
  });
}

export function useArchiveSenior() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seniorsApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seniors"] });
      toast({ title: "Podopieczny zarchiwizowany" });
    },
    onError: () => toast({ title: "Błąd", variant: "destructive" }),
  });
}
