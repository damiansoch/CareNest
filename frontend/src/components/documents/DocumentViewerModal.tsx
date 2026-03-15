"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PageViewer } from "./PageViewer";
import { useDocument } from "@/hooks/useDocuments";
import type { Document } from "@/types";
import { cn } from "@/lib/utils/cn";

interface DocumentViewerModalProps {
  seniorId: string;
  document: Document;
  open: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({
  seniorId,
  document: doc,
  open,
  onClose,
}: DocumentViewerModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const { data: detail, isLoading } = useDocument(seniorId, doc.id);

  useEffect(() => {
    if (open) setCurrentPage(0);
  }, [open, doc.id]);

  useEffect(() => {
    if (!open || !detail) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setCurrentPage((p) => Math.min(p + 1, detail.pages.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrentPage((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, detail]);

  const pages = detail?.pages ?? [];
  const activePage = pages[currentPage];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-5xl w-full p-0 gap-0 overflow-hidden"
        title={doc.name}
      >
        {/* Metadata row */}
        <div className="px-5 pb-3 flex items-center gap-2 flex-wrap border-b">
          <Badge variant="secondary" className="text-xs">
            {doc.category_display}
          </Badge>
          {doc.tags.map((tag) => (
            <span key={tag} className="text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {doc.page_count} {doc.page_count === 1 ? "strona" : "stron"}
          </span>
        </div>

        <div className="flex" style={{ minHeight: "480px" }}>
          {/* Sidebar — only when more than 1 page */}
          {pages.length > 1 && (
            <div className="w-16 flex-shrink-0 border-r bg-muted/30 overflow-y-auto flex flex-col gap-1.5 p-1.5">
              {pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPage(idx)}
                  className={cn(
                    "rounded-md py-2 text-xs font-medium transition-colors",
                    idx === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <FileText size={12} className="mx-auto mb-0.5" />
                  {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-5 overflow-auto flex items-center justify-center">
              {isLoading ? (
                <Spinner />
              ) : activePage ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePage.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="w-full"
                  >
                    <PageViewer seniorId={seniorId} docId={doc.id} page={activePage} />
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>

            {/* Navigation bar */}
            {pages.length > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t bg-card/80 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft size={14} />
                  Poprzednia
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentPage + 1} / {pages.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, pages.length - 1))}
                  disabled={currentPage === pages.length - 1}
                >
                  Następna
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
