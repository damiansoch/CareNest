"use client";

import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { MedicationTracker } from "@/components/tracker/MedicationTracker";
import { PageSpinner } from "@/components/ui/spinner";
import { useSenior } from "@/hooks/useSeniors";
import { useMedications } from "@/hooks/useMedications";

export default function TrackerPage({
  params,
}: {
  params: { locale: string; seniorId: string };
}) {
  const { locale, seniorId } = params;

  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <TrackerContent locale={locale} seniorId={seniorId} />
      </AppShell>
    </AuthGuard>
  );
}

function TrackerContent({ locale, seniorId }: { locale: string; seniorId: string }) {
  const { data: senior, isLoading: seniorLoading } = useSenior(seniorId);
  // Fetch all medications (active only) for the tracker
  const { data: medications, isLoading: medsLoading } = useMedications(seniorId, true);

  if (seniorLoading || medsLoading) return <PageSpinner />;
  if (!senior) return <p className="text-muted-foreground">Nie znaleziono podopiecznego.</p>;

  return (
    <MedicationTracker
      senior={senior}
      medications={medications ?? []}
      locale={locale}
    />
  );
}
