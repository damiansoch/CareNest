"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "./TagInput";
import { useUpdateDocument, useDocuments } from "@/hooks/useDocuments";
import type { Document } from "@/types";

interface EditDocumentModalProps {
  seniorId: string;
  document: Document;
  open: boolean;
  onClose: () => void;
}

export function EditDocumentModal({ seniorId, document: doc, open, onClose }: EditDocumentModalProps) {
  const t = useTranslations("documents");
  const update = useUpdateDocument(seniorId);
  const [name, setName] = useState(doc.name);
  const [tags, setTags] = useState<string[]>(doc.tags);
  const [nameError, setNameError] = useState("");

  // Collect all tags used across all documents for this senior (React Query cache — no extra request)
  const { data: allDocs } = useDocuments(seniorId);
  const existingTags = useMemo(() => {
    if (!allDocs) return [];
    return Array.from(new Set(allDocs.flatMap((d) => d.tags))).sort();
  }, [allDocs]);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Nazwa dokumentu jest wymagana.");
      return;
    }
    setNameError("");
    await update.mutateAsync({ id: doc.id, data: { name: name.trim(), tags } });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md w-full" title="Edytuj dokument">
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-doc-name">Nazwa dokumentu</Label>
            <Input
              id="edit-doc-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              className="mt-1"
              error={!!nameError}
            />
            {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
          </div>

          <div>
            <Label>{t("tags")}</Label>
            <div className="mt-1">
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder={t("tagsPlaceholder")}
                suggestions={existingTags}
                suggestionsLabel={existingTags.length > 0 ? t("quickTagsLabel") : undefined}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
