import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicationsApi } from "@/lib/api/endpoints";
import type { Medication } from "@/types";
import { toast } from "@/store/toast";
import { extractApiErrors } from "@/lib/utils/apiErrors";

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
    onError: (error) => toast({ title: "Błąd", description: extractApiErrors(error), variant: "destructive" }),
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
    onError: (error) => toast({ title: "Błąd", description: extractApiErrors(error), variant: "destructive" }),
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
