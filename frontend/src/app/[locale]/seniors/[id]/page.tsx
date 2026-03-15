"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Calendar, Pill, Printer, Archive } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/ui/spinner";
import { useSenior, useArchiveSenior } from "@/hooks/useSeniors";
import { useRouter } from "next/navigation";
import { DocumentsSection } from "@/components/documents/DocumentsSection";

export default function SeniorDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;

  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <SeniorDetailContent locale={locale} id={id} />
      </AppShell>
    </AuthGuard>
  );
}

function SeniorDetailContent({ locale, id }: { locale: string; id: string }) {
  const t = useTranslations("seniors");
  const tCommon = useTranslations("common");
  const tMedications = useTranslations("medications");
  const tAppointments = useTranslations("appointments");
  const tTracker = useTranslations("tracker");
  const router = useRouter();
  const { data: senior, isLoading } = useSenior(id);
  const archive = useArchiveSenior();

  if (isLoading) return <PageSpinner />;
  if (!senior) return <p className="text-muted-foreground">Nie znaleziono podopiecznego.</p>;

  function handleArchive() {
    if (confirm(t("archiveConfirm"))) {
      archive.mutate(id, {
        onSuccess: () => router.push(`/${locale}/seniors`),
      });
    }
  }

  const dateLocale = locale === "pl" ? "pl-PL" : "en-GB";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/seniors`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{senior.full_name}</h1>
          {senior.is_archived && <Badge variant="outline" className="mt-1">{t("archived")}</Badge>}
        </div>
        {!senior.is_archived && (
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/seniors/${id}/edit`}>
              <Button variant="outline" size="sm">{tCommon("edit")}</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive size={14} />
              {tCommon("archive")}
            </Button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">{t("dateOfBirth")}</p>
            <p className="font-medium">
              {senior.date_of_birth
                ? new Date(senior.date_of_birth).toLocaleDateString(dateLocale)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">{t("preferredLanguage")}</p>
            <p className="font-medium">{senior.preferred_language === "pl" ? "Polski" : "English"}</p>
          </CardContent>
        </Card>
        {senior.notes && (
          <Card className="md:col-span-1">
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground mb-1">{t("notes")}</p>
              <p className="text-sm">{senior.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation cards */}
      {!senior.is_archived && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href={`/${locale}/seniors/${id}/medications`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <Pill className="text-primary mb-2" size={24} />
                <CardTitle>{tMedications("title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Zarządzaj lekami podopiecznego
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/seniors/${id}/appointments`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <Calendar className="text-primary mb-2" size={24} />
                <CardTitle>{tAppointments("title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Planuj wizyty lekarskie
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/tracker/${id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <Printer className="text-primary mb-2" size={24} />
                <CardTitle>{tTracker("title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Drukuj plan leków na dzień
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Documents section */}
      {!senior.is_archived && (
        <div className="mt-8">
          <DocumentsSection seniorId={id} locale={locale} />
        </div>
      )}
    </div>
  );
}
