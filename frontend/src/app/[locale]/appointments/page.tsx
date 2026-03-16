"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Calendar, ShoppingCart, CalendarDays } from "lucide-react";
import { isFuture, isPast, format, type Locale } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Clock, MapPin, User, Bell, Link as LinkIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import { useAllAppointments } from "@/hooks/useAppointments";
import type { Appointment } from "@/types";

export default function AppointmentsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <AllAppointmentsContent locale={locale} />
      </AppShell>
    </AuthGuard>
  );
}

type AppointmentWithSenior = Appointment & { senior_id: string; senior_name: string };

function AllAppointmentsContent({ locale }: { locale: string }) {
  const t = useTranslations("appointments");
  const { data: appointments, isLoading } = useAllAppointments();
  const dateLocale = locale === "pl" ? pl : enUS;

  const upcoming = appointments?.filter((a) => isFuture(new Date(a.datetime))) ?? [];
  const past = appointments?.filter((a) => isPast(new Date(a.datetime))) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {isLoading && <PageSpinner />}

      {!isLoading && upcoming.length === 0 && past.length === 0 && (
        <EmptyState
          icon={<Calendar size={24} />}
          title={t("noAppointments")}
        />
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("upcoming")}
          </h2>
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appointment={appt}
                locale={locale}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("past")}
          </h2>
          <div className="space-y-3">
            {past.slice(0, 10).map((appt) => (
              <AppointmentRow
                key={appt.id}
                appointment={appt}
                locale={locale}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AppointmentRow({
  appointment,
  locale,
  dateLocale,
}: {
  appointment: AppointmentWithSenior;
  locale: string;
  dateLocale: Locale;
}) {
  const t = useTranslations("appointments");
  const apptDate = new Date(appointment.datetime);
  const isUpcoming = isFuture(apptDate);
  const hasReminders = appointment.reminder_configs.some((r) => r.is_enabled);

  const TypeIcon = appointment.event_type === "shopping" ? ShoppingCart : CalendarDays;
  const typeLabel = {
    appointment: t("eventTypeAppointment"),
    shopping: t("eventTypeShopping"),
    other: t("eventTypeOther"),
  }[appointment.event_type];

  return (
    <Link href={`/${locale}/seniors/${appointment.senior_id}/appointments`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isUpcoming ? "" : "opacity-70"}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Date block */}
            <div className="flex-shrink-0 w-14 text-center rounded-lg bg-primary/10 p-2">
              <p className="text-xs text-primary font-medium">
                {format(apptDate, "MMM", { locale: dateLocale })}
              </p>
              <p className="text-2xl font-bold text-primary leading-none">
                {format(apptDate, "d")}
              </p>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <TypeIcon size={13} className="text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm">{appointment.title}</h3>
                <Badge variant="outline" className="text-xs font-normal">
                  {appointment.senior_name}
                </Badge>
                <Badge variant="secondary" className="text-xs font-normal">
                  {typeLabel}
                </Badge>
                {!isUpcoming && (
                  <Badge variant="secondary" className="text-xs">
                    {locale === "pl" ? "Przeszłe" : "Past"}
                  </Badge>
                )}
                {isUpcoming && hasReminders && (
                  <Bell size={12} className="text-primary" />
                )}
              </div>

              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={11} />
                  {format(apptDate, "HH:mm", { locale: dateLocale })}
                  {" — "}
                  {format(apptDate, "d MMMM yyyy", { locale: dateLocale })}
                </div>
                {appointment.doctor_name && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User size={11} />
                    {appointment.doctor_name}
                  </div>
                )}
                {appointment.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={11} />
                    {appointment.location}
                  </div>
                )}
                {appointment.url && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LinkIcon size={11} />
                    <span className="truncate max-w-[240px]">{appointment.url}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
