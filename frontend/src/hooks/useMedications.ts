import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicationsApi } from "@/lib/api/endpoints";
import type { Medication } from "@/types";
import { toast } from "@/store/toast";

export function useMedications(seniorId: string, activeOnly = false) {
  return useQuery({
    queryKey: ["medications", seniorId, { active: activeOnly }],
    queryFn: async () => {
      const res = await medicationsApi.list(seniorId, { active: activeOnly || undefined });
      return res.data.results;
    },
    enabled: !!seniorId,
  });
}

export function useCreateMedication(seniorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Medication>) => medicationsApi.create(seniorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications", seniorId] });
      toast({ title: "Lek dodany" });
    },
    onError: () => toast({ title: "Błąd", description: "Nie udało się dodać leku.", variant: "destructive" }),
  });
}

export function useUpdateMedication(seniorId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Medication>) => medicationsApi.update(seniorId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications", seniorId] });
      toast({ title: "Lek zaktualizowany" });
    },
    onError: () => toast({ title: "Błąd", description: "Nie udało się zapisać.", variant: "destructive" }),
  });
}

export function useDeactivateMedication(seniorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicationsApi.deactivate(seniorId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications", seniorId] });
      toast({ title: "Lek dezaktywowany" });
    },
    onError: () => toast({ title: "Błąd", variant: "destructive" }),
  });
}
