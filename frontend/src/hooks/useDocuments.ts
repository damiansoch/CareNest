"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { documentsApi } from "@/lib/api/endpoints";
import { extractApiErrors } from "@/lib/utils/apiErrors";
import { toast } from "@/store/toast";

// ── List / Detail ─────────────────────────────────────────────────────────────

export function useDocuments(
  seniorId: string,
  filters?: { category?: string; tags?: string; ordering?: string }
) {
  return useQuery({
    queryKey: ["documents", seniorId, filters],
    queryFn: async () => {
      const res = await documentsApi.list(seniorId, filters);
      return res.data.results;
    },
    enabled: !!seniorId,
  });
}

export function useDocument(seniorId: string, id: string) {
  return useQuery({
    queryKey: ["document", seniorId, id],
    queryFn: async () => {
      const res = await documentsApi.get(seniorId, id);
      return res.data;
    },
    enabled: !!seniorId && !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useUploadDocument(seniorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => documentsApi.upload(seniorId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", seniorId] });
      toast({ title: "Dokument przesłany" });
    },
    onError: (error) =>
      toast({
        title: "Błąd przesyłania",
        description: extractApiErrors(error),
        variant: "destructive",
      }),
  });
}

export function useUpdateDocument(seniorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; category?: string; tags?: string[] };
    }) => documentsApi.update(seniorId, id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["documents", seniorId] });
      qc.invalidateQueries({ queryKey: ["document", seniorId, id] });
      toast({ title: "Dokument zaktualizowany" });
    },
    onError: (error) =>
      toast({
        title: "Błąd",
        description: extractApiErrors(error),
        variant: "destructive",
      }),
  });
}

export function useDeleteDocument(seniorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(seniorId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", seniorId] });
      toast({ title: "Dokument usunięty" });
    },
    onError: (error) =>
      toast({
        title: "Błąd",
        description: extractApiErrors(error),
        variant: "destructive",
      }),
  });
}

// ── Binary page blob ──────────────────────────────────────────────────────────

/**
 * Fetches the binary content of a document page via the authenticated API
 * and returns a stable object URL suitable for use as an <img> or <iframe> src.
 *
 * The object URL is automatically revoked on unmount or when deps change.
 */
export function useDocumentPageBlob(
  seniorId: string,
  docId: string,
  pageId: string,
  enabled: boolean
): { objectUrl: string | null; isLoading: boolean; error: Error | null } {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !seniorId || !docId || !pageId) return;

    let cancelled = false;
    let createdUrl: string | null = null;

    setIsLoading(true);
    setError(null);
    setObjectUrl(null);

    const url = documentsApi.pageContentUrl(seniorId, docId, pageId);
    apiClient
      .get(url, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const blob: Blob = res.data;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [enabled, seniorId, docId, pageId]);

  return { objectUrl, isLoading, error };
}
