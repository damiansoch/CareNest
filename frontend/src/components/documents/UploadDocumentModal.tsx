"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TagInput } from "./TagInput";
import { useUploadDocument } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils/cn";
import { formatBytes } from "@/lib/utils/format";
import type { DocumentCategory } from "@/types";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
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

interface SelectedFile {
  file: File;
  preview: string | null;
}

interface UploadDocumentModalProps {
  seniorId: string;
  open: boolean;
  onClose: () => void;
  existingTags?: string[];
}

export function UploadDocumentModal({ seniorId, open, onClose, existingTags = [] }: UploadDocumentModalProps) {
  const t = useTranslations("documents");
  const upload = useUploadDocument(seniorId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [tags, setTags] = useState<string[]>([]);
  const [nameError, setNameError] = useState("");

  const resetState = () => {
    setStep(1);
    files.forEach((sf) => { if (sf.preview) URL.revokeObjectURL(sf.preview); });
    setFiles([]);
    setName("");
    setCategory("other");
    setTags([]);
    setNameError("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const newFiles: SelectedFile[] = list.map((f) => ({
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const next = [...prev];
      if (next[idx].preview) URL.revokeObjectURL(next[idx].preview!);
      next.splice(idx, 1);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError("Nazwa dokumentu jest wymagana.");
      return;
    }
    setNameError("");

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category", category);
    formData.append("tags", JSON.stringify(tags));
    files.forEach((sf) => formData.append("pages", sf.file));

    try {
      await upload.mutateAsync(formData);
      handleClose();
    } catch {
      // errors handled by hook toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg w-full" title={t("uploadDocument")}>
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-5">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors",
                  step === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : step > s
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {s}
              </span>
              <span className={cn("text-xs font-medium", step === s ? "text-foreground" : "text-muted-foreground")}>
                {s === 1 ? t("uploadStep1") : t("uploadStep2")}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
            >
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30"
                )}
              >
                <Upload size={22} className="mx-auto text-muted-foreground mb-2 sm:w-7 sm:h-7" />
                <p className="text-sm font-medium">{t("dropFilesHere")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("supportedFormats")}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>

              {/* Selected files list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {files.map((sf, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 bg-card"
                    >
                      <div className="w-9 h-9 rounded flex-shrink-0 flex items-center justify-center bg-muted overflow-hidden">
                        {sf.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sf.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FileText size={16} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sf.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sf.file.type === "application/pdf" ? "PDF" : "Obraz"} · {formatBytes(sf.file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="p-1 hover:text-destructive transition-colors"
                        aria-label="Usuń plik"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-5">
                <Button onClick={() => setStep(2)} disabled={files.length === 0}>
                  Dalej <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-name">{t("documentName")} *</Label>
                  <Input
                    id="doc-name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameError(""); }}
                    placeholder="np. Wyniki krwi — styczeń 2025"
                    className="mt-1"
                    error={!!nameError}
                  />
                  {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
                </div>

                <div>
                  <Label>{t("category")}</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                    <SelectTrigger className="mt-1">
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
                </div>

                <div>
                  <Label>{t("tags")}</Label>
                  <TagInput
                    value={tags}
                    onChange={setTags}
                    placeholder={t("tagsPlaceholder")}
                    suggestions={existingTags}
                    suggestionsLabel={existingTags.length > 0 ? t("quickTagsLabel") : undefined}
                    className="mt-1"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {files.length} {files.length === 1 ? "strona gotowa" : "strony/stron gotowych"} do przesłania
                </p>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Wstecz
                </Button>
                <Button onClick={handleSubmit} disabled={upload.isPending}>
                  {upload.isPending ? "Przesyłanie..." : t("uploadDocument")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
