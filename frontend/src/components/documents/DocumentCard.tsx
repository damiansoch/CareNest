"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Eye, Trash2, Calendar, Layers, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/ui/tilt-card";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { EditDocumentModal } from "./EditDocumentModal";
import { useDeleteDocument } from "@/hooks/useDocuments";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Document, DocumentCategory } from "@/types";

// Color map per category for visual differentiation
const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  medical_report:    "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  prescription:      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  lab_result:        "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  insurance:         "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  identity:          "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  consent_form:      "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  referral:          "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  discharge_summary: "bg-red-500/10 text-red-700 dark:text-red-400",
  other:             "bg-muted text-muted-foreground",
};

interface DocumentCardProps {
  seniorId: string;
  document: Document;
  locale: string;
  onTagClick?: (tag: string) => void;
  activeTags?: string[];
}

export function DocumentCard({ seniorId, document: doc, locale, onTagClick, activeTags = [] }: DocumentCardProps) {
  const t = useTranslations("documents");
  const deleteDoc = useDeleteDocument(seniorId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dateLocale = locale === "pl" ? pl : undefined;
  const formattedDate = format(new Date(doc.created_at), "d MMM yyyy", { locale: dateLocale });

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    await deleteDoc.mutateAsync(doc.id);
  };

  return (
    <>
      <TiltCard maxTilt={4}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center",
                CATEGORY_COLORS[doc.category]
              )}>
                <FileText size={18} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    CATEGORY_COLORS[doc.category]
                  )}>
                    {doc.category_display}
                  </span>
                  {doc.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onTagClick?.(tag)}
                      className={cn(
                        "text-[11px] transition-colors",
                        activeTags.includes(tag)
                          ? "text-primary font-semibold"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-[11px] text-muted-foreground">+{doc.tags.length - 3}</span>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    {doc.page_count} {doc.page_count === 1 ? "str." : "str."}
                  </span>
                  {doc.total_size_bytes > 0 && (
                    <span>{formatBytes(doc.total_size_bytes)}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:h-7 md:w-7"
                  onClick={() => setViewerOpen(true)}
                  aria-label={t("viewDocument")}
                >
                  <Eye size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:h-7 md:w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditOpen(true)}
                  aria-label="Edytuj dokument"
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 md:h-7 md:w-7 transition-colors",
                    confirmDelete
                      ? "text-destructive bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground"
                      : "text-muted-foreground hover:text-destructive"
                  )}
                  onClick={handleDelete}
                  disabled={deleteDoc.isPending}
                  aria-label={confirmDelete ? t("deleteConfirm") : "Usuń"}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            {/* Confirm delete hint */}
            {confirmDelete && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-destructive mt-2"
              >
                Kliknij ponownie, aby potwierdzić usunięcie
              </motion.p>
            )}
          </CardContent>
        </Card>
      </TiltCard>

      {viewerOpen && (
        <DocumentViewerModal
          seniorId={seniorId}
          document={doc}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {editOpen && (
        <EditDocumentModal
          seniorId={seniorId}
          document={doc}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
