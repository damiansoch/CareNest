"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Upload, FolderOpen, X, Tag } from "lucide-react";
import { AnimatedList, AnimatedItem } from "@/components/ui/animated-list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { DocumentCard } from "./DocumentCard";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { useDocuments } from "@/hooks/useDocuments";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all",               label: "Wszystkie kategorie" },
  { value: "medical_report",    label: "Raport medyczny" },
  { value: "prescription",      label: "Recepta" },
  { value: "lab_result",        label: "Wynik badań" },
  { value: "insurance",         label: "Ubezpieczenie" },
  { value: "identity",          label: "Dokument tożsamości" },
  { value: "consent_form",      label: "Formularz zgody" },
  { value: "referral",          label: "Skierowanie" },
  { value: "discharge_summary", label: "Karta wypisowa" },
  { value: "other",             label: "Inne" },
];

const ORDERINGS: { value: string; label: string }[] = [
  { value: "-created_at", label: "Najnowsze" },
  { value: "created_at",  label: "Najstarsze" },
  { value: "name",        label: "Nazwa A→Z" },
  { value: "-name",       label: "Nazwa Z→A" },
  { value: "category",    label: "Kategoria" },
];

interface DocumentsSectionProps {
  seniorId: string;
  locale: string;
}

export function DocumentsSection({ seniorId, locale }: DocumentsSectionProps) {
  const t = useTranslations("documents");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [ordering, setOrdering] = useState("-created_at");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  // Accumulate all tags ever seen for this senior (survives filter changes)
  const [knownTags, setKnownTags] = useState<string[]>([]);

  const filters = {
    category: category !== "all" ? category : undefined,
    ordering,
    tags: activeTags.length > 0 ? activeTags.join(",") : undefined,
  };

  const { data: documents, isLoading } = useDocuments(seniorId, filters);

  // Accumulate unique tags from every result set so the tag strip
  // doesn't disappear when a tag filter is active
  useEffect(() => {
    if (!documents) return;
    const incoming = documents.flatMap((d) => d.tags);
    setKnownTags((prev) => {
      const merged = Array.from(new Set([...prev, ...incoming])).sort();
      return merged;
    });
  }, [documents]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setCategory("all");
    setActiveTags([]);
  };

  const hasActiveFilters = category !== "all" || activeTags.length > 0;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen size={20} className="text-primary" />
          {t("title")}
        </h2>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload size={14} />
          {t("uploadDocument")}
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ordering} onValueChange={setOrdering}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDERINGS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-dashed"
          >
            <X size={11} />
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Tag chip strip */}
      {knownTags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Tag size={11} />
              Tagi:
            </span>
            {knownTags.map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  #{tag}
                  {isActive && <X size={9} className="opacity-70" />}
                </button>
              );
            })}
          </div>

          {activeTags.length > 0 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Filtrowanie po {activeTags.length === 1 ? "tagu" : "tagach"}:{" "}
              <span className="text-primary font-medium">
                {activeTags.map((t) => `#${t}`).join(", ")}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : !documents || documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
          <FolderOpen size={36} className="mb-3 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? "Brak dokumentów pasujących do filtrów."
              : t("noDocuments")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      ) : (
        <AnimatedList className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <AnimatedItem key={doc.id}>
              <DocumentCard
                seniorId={seniorId}
                document={doc}
                locale={locale}
                onTagClick={toggleTag}
                activeTags={activeTags}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      <UploadDocumentModal
        seniorId={seniorId}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}
