"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { isFuture, isToday, format, type Locale } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Plus, Users, Calendar, Printer } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSeniors } from "@/hooks/useSeniors";
import { useFamily } from "@/hooks/useFamily";
import { useAuthStore } from "@/store/auth";
import { appointmentsApi } from "@/lib/api/endpoints";
import type { Appointment } from "@/types";

export default function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <DashboardContent locale={locale} />
      </AppShell>
    </AuthGuard>
  );
}

function DashboardContent({ locale }: { locale: string }) {
  const t = useTranslations("dashboard");
  const { user } = useAuthStore();
  const { data: family } = useFamily();
  const { data: seniors } = useSeniors();
  const dateLocale = locale === "pl" ? pl : enUS;

  const appointmentQueries = useQueries({
    queries: (seniors ?? []).map((senior) => ({
      queryKey: ["appointments", senior.id],
      queryFn: async () => {
        const res = await appointmentsApi.list(senior.id);
        return res.data.results.map((a) => ({
          ...a,
          seniorName: senior.full_name,
          seniorId: senior.id,
        }));
      },
      enabled: !!senior.id,
    })),
  });

  const allUpcoming = appointmentQueries
    .flatMap((q) => (q.data as (Appointment & { seniorName: string; seniorId: string })[]) ?? [])
    .filter((a) => isFuture(new Date(a.datetime)))
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const todayAppts = allUpcoming.filter((a) => isToday(new Date(a.datetime)));
  const upcomingAppts = allUpcoming.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t("welcome", { name: user?.first_name ?? "" })}
        </h1>
        {family && (
          <p className="text-muted-foreground mt-1">
            {t("familyName", { name: family.name })}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Users size={20} className="text-primary" />} label={t("activeSeniors")} value={seniors?.length ?? 0} />
        <StatCard icon={<Calendar size={20} className="text-primary" />} label={t("todayAppointments")} value={todayAppts.length} />
        <StatCard icon={<Calendar size={20} className="text-primary" />} label={t("upcomingAppointments")} value={upcomingAppts.length} />
      </div>

      {/* Today */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">{t("todayAppointments")}</h2>
        {todayAppts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noTodayAppointments")}</p>
        ) : (
          <div className="space-y-2">
            {todayAppts.map((a) => (
              <ApptRow key={a.id} appt={a} locale={locale} dateLocale={dateLocale} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcomingAppts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{t("upcomingAppointments")}</h2>
          <div className="space-y-2">
            {upcomingAppts.map((a) => (
              <ApptRow key={a.id} appt={a} locale={locale} dateLocale={dateLocale} />
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t("quickActions")}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/seniors/new`}>
            <Button variant="outline"><Plus size={16} />{t("addSenior")}</Button>
          </Link>
          {seniors && seniors[0] && (
            <Link href={`/${locale}/seniors/${seniors[0].id}/appointments`}>
              <Button variant="outline"><Plus size={16} />{t("addAppointment")}</Button>
            </Link>
          )}
          {seniors && seniors[0] && (
            <Link href={`/${locale}/tracker/${seniors[0].id}`}>
              <Button variant="outline"><Printer size={16} />{t("printTracker")}</Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ApptRow({
  appt,
  locale,
  dateLocale,
}: {
  appt: Appointment & { seniorName: string; seniorId: string };
  locale: string;
  dateLocale: Locale;
}) {
  const apptDate = new Date(appt.datetime);
  return (
    <Link href={`/${locale}/seniors/${appt.seniorId}/appointments`}>
      <div className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent/50 transition-colors">
        <div className="text-center w-12">
          <p className="text-xs text-primary font-medium uppercase">
            {format(apptDate, "MMM", { locale: dateLocale })}
          </p>
          <p className="text-xl font-bold text-primary leading-tight">
            {format(apptDate, "d")}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{appt.title}</p>
          <p className="text-xs text-muted-foreground">
            {appt.seniorName}
            {appt.doctor_name ? ` • ${appt.doctor_name}` : ""}
            {" • "}
            {format(apptDate, "HH:mm")}
          </p>
        </div>
      </div>
    </Link>
  );
}
