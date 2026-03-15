"use client";

import { useDocumentPageBlob } from "@/hooks/useDocuments";
import { Spinner } from "@/components/ui/spinner";
import type { DocumentPageMeta } from "@/types";

interface PageViewerProps {
  seniorId: string;
  docId: string;
  page: DocumentPageMeta;
}

export function PageViewer({ seniorId, docId, page }: PageViewerProps) {
  const { objectUrl, isLoading, error } = useDocumentPageBlob(
    seniorId,
    docId,
    page.id,
    true
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-sm text-muted-foreground">
        Nie udało się załadować strony.
      </div>
    );
  }

  if (page.mime_type === "application/pdf") {
    return (
      <iframe
        src={objectUrl}
        className="w-full h-full min-h-[500px] rounded-lg border"
        title={`Strona ${page.page_number}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={objectUrl}
      alt={`Strona ${page.page_number}`}
      className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
    />
  );
}
