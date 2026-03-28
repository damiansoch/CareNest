"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { isFuture, isPast, parseISO } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import { useSenior } from "@/hooks/useSeniors";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from "@/hooks/useAppointments";
import type { Appointment } from "@/types";

export default function AppointmentsPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <AppointmentsContent locale={locale} seniorId={id} />
      </AppShell>
    </AuthGuard>
  );
}

/** Convert form reminder checkboxes to reminder_configs array */
function buildReminderConfigs(
  reminder_on_day: boolean,
  reminder_2d: boolean,
  reminder_7d: boolean,
) {
  const configs: { offset_hours: 0 | 48 | 168; is_enabled: boolean }[] = [];
  if (reminder_7d) configs.push({ offset_hours: 168, is_enabled: true });
  if (reminder_2d) configs.push({ offset_hours: 48, is_enabled: true });
  if (reminder_on_day) configs.push({ offset_hours: 0, is_enabled: true });
  return configs;
}

function AppointmentsContent({ locale, seniorId }: { locale: string; seniorId: string }) {
  const t = useTranslations("appointments");

  const { data: senior } = useSenior(seniorId);
  const { data: appointments, isLoading } = useAppointments(seniorId);
  const create = useCreateAppointment(seniorId);
  const deleteAppt = useDeleteAppointment(seniorId);

  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const update = useUpdateAppointment(seniorId, editingAppt?.id ?? "");

  const upcoming = appointments?.filter((a) => isFuture(parseISO(a.datetime.slice(0, 16)))) ?? [];
  const past = appointments?.filter((a) => isPast(parseISO(a.datetime.slice(0, 16)))) ?? [];

  function handleDelete(id: string) {
    if (confirm(t("deleteConfirm"))) {
      deleteAppt.mutate(id);
    }
  }

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
            <Button><Plus size={16} />{t("addAppointment")}</Button>
          </DialogTrigger>
          <DialogContent title={t("addAppointment")}>
            <AppointmentForm
              onSubmit={async (data) => {
                try {
                  const { reminder_on_day, reminder_2d, reminder_7d, ...rest } = data;
                  await create.mutateAsync({
                    ...rest,
                    reminder_configs: buildReminderConfigs(reminder_on_day, reminder_2d, reminder_7d),
                  });
                  setCreateOpen(false);
                } catch {
                  // error toast handled by useCreateAppointment onError
                }
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <PageSpinner />}

      {!isLoading && upcoming.length === 0 && past.length === 0 && (
        <EmptyState
          icon={<Calendar size={24} />}
          title={t("noAppointments")}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />{t("addAppointment")}
            </Button>
          }
        />
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("upcoming")}
          </h2>
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                locale={locale}
                onEdit={setEditingAppt}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("past")}
          </h2>
          <div className="space-y-3">
            {past.slice(0, 5).map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                locale={locale}
                onEdit={setEditingAppt}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingAppt} onOpenChange={(open) => !open && setEditingAppt(null)}>
        <DialogContent title={t("editAppointment")}>
          {editingAppt && (
            <AppointmentForm
              defaultValues={editingAppt}
              onSubmit={async (data) => {
                try {
                  const { reminder_on_day, reminder_2d, reminder_7d, ...rest } = data;
                  await update.mutateAsync({
                    ...rest,
                    reminder_configs: buildReminderConfigs(reminder_on_day, reminder_2d, reminder_7d),
                  });
                  setEditingAppt(null);
                } catch {
                  // error toast handled by useUpdateAppointment onError
                }
              }}
              onCancel={() => setEditingAppt(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
