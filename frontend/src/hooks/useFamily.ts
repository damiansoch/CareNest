import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyApi } from "@/lib/api/endpoints";
import { toast } from "@/store/toast";

export function useFamily() {
  return useQuery({
    queryKey: ["family"],
    queryFn: async () => {
      const res = await familyApi.get();
      return res.data;
    },
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ["family-members"],
    queryFn: async () => {
      const res = await familyApi.members();
      return res.data.results;
    },
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ["family-invitations"],
    queryFn: async () => {
      const res = await familyApi.invitations();
      return res.data.results;
    },
  });
}

export function useInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) => familyApi.invite(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family-invitations"] });
      toast({ title: "Zaproszenie wysłane" });
    },
    onError: () => toast({ title: "Błąd", description: "Nie udało się wysłać zaproszenia.", variant: "destructive" }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => familyApi.removeMember(membershipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family-members"] });
    },
    onError: () => toast({ title: "Błąd", description: "Nie udało się usunąć opiekuna.", variant: "destructive" }),
  });
}
