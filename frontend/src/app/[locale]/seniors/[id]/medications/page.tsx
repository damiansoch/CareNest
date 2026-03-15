"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Plus, Pill } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { MedicationForm } from "@/components/medications/MedicationForm";
import { MedicationRow } from "@/components/medications/MedicationRow";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import { useSenior } from "@/hooks/useSeniors";
import {
  useMedications,
  useCreateMedication,
  useUpdateMedication,
  useDeactivateMedication,
} from "@/hooks/useMedications";
import type { Medication } from "@/types";

export default function MedicationsPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <MedicationsContent locale={locale} seniorId={id} />
      </AppShell>
    </AuthGuard>
  );
}

function MedicationsContent({ locale, seniorId }: { locale: string; seniorId: string }) {
  const t = useTranslations("medications");
  const tCommon = useTranslations("common");

  const { data: senior } = useSenior(seniorId);
  const { data: medications, isLoading } = useMedications(seniorId);
  const create = useCreateMedication(seniorId);
  const deactivate = useDeactivateMedication(seniorId);

  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const update = useUpdateMedication(seniorId, editingMed?.id ?? "");

  const active = medications?.filter((m) => m.is_active) ?? [];
  const inactive = medications?.filter((m) => !m.is_active) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/seniors/${seniorId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{senior?.full_name}</p>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} />{t("addMedication")}</Button>
          </DialogTrigger>
          <DialogContent title={t("addMedication")} className="max-h-[90vh] overflow-y-auto">
            <MedicationForm
              onSubmit={async (data) => {
                try {
                  await create.mutateAsync(data);
                  setCreateOpen(false);
                } catch {
                  // error toast handled by useCreateMedication onError
                }
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <PageSpinner />}

      {!isLoading && active.length === 0 && inactive.length === 0 && (
        <EmptyState
          icon={<Pill size={24} />}
          title={t("noMedications")}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />{t("addMedication")}
            </Button>
          }
        />
      )}

      {/* Active medications */}
      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("active")}
          </h2>
          <div className="rounded-xl border divide-y">
            {active.map((med) => (
              <MedicationRow
                key={med.id}
                medication={med}
                onEdit={setEditingMed}
                onDeactivate={(id) => deactivate.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inactive medications */}
      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("inactive")}
          </h2>
          <div className="rounded-xl border divide-y opacity-60">
            {inactive.map((med) => (
              <MedicationRow
                key={med.id}
                medication={med}
                onEdit={setEditingMed}
                onDeactivate={(id) => deactivate.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingMed} onOpenChange={(open) => !open && setEditingMed(null)}>
        <DialogContent title={t("editMedication")} className="max-h-[90vh] overflow-y-auto">
          {editingMed && (
            <MedicationForm
              defaultValues={editingMed}
              onSubmit={async (data) => {
                try {
                  await update.mutateAsync(data);
                  setEditingMed(null);
                } catch {
                  // error toast handled by useUpdateMedication onError
                }
              }}
              onCancel={() => setEditingMed(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
