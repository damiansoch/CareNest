import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/lib/api/endpoints";
import type { Appointment } from "@/types";
import { toast } from "@/store/toast";
import { extractApiErrors } from "@/lib/utils/apiErrors";

export function useAllAppointments() {
  return useQuery({
    queryKey: ["all-appointments"],
    queryFn: async () => {
      const res = await appointmentsApi.listAll();
      return res.data.results as (Appointment & { senior_id: string; senior_name: string })[];
    },
  });
}

export function useAppointments(seniorId: string) {
  return useQuery({
    queryKey: ["appointments", seniorId],
    queryFn: async () => {
      const res = await appointmentsApi.list(seniorId);
      return res.data.results;
    },
    enabled: !!seniorId,
  });
}

export function useCreateAppointment(seniorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Appointment>) => appointmentsApi.create(seniorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", seniorId] });
      qc.invalidateQueries({ queryKey: ["upcoming-appointments"] });
      toast({ title: "Wizyta dodana" });
    },
    onError: (error) => toast({ title: "Błąd", description: extractApiErrors(error), variant: "destructive" }),
  });
}

export function useUpdateAppointment(seniorId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Appointment>) => appointmentsApi.update(seniorId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", seniorId] });
      qc.invalidateQueries({ queryKey: ["upcoming-appointments"] });
      toast({ title: "Wizyta zaktualizowana" });
    },
    onError: (error) => toast({ title: "Błąd", description: extractApiErrors(error), variant: "destructive" }),
  });
}

export function useDeleteAppointment(seniorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(seniorId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments", seniorId] });
      qc.invalidateQueries({ queryKey: ["upcoming-appointments"] });
      toast({ title: "Wizyta usunięta" });
    },
    onError: (error) => toast({ title: "Błąd", description: extractApiErrors(error), variant: "destructive" }),
  });
}
