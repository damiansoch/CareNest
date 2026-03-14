"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { SeniorCard } from "@/components/seniors/SeniorCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useSeniors, useArchiveSenior } from "@/hooks/useSeniors";

export default function SeniorsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <SeniorsContent locale={locale} />
      </AppShell>
    </AuthGuard>
  );
}

function SeniorsContent({ locale }: { locale: string }) {
  const t = useTranslations("seniors");
  const [showArchived, setShowArchived] = useState(false);
  const { data: seniors, isLoading } = useSeniors(showArchived);
  const archive = useArchiveSenior();

  function handleArchive(id: string) {
    if (confirm(t("archiveConfirm"))) archive.mutate(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showArchived ? "Ukryj zarchiwizowanych" : t("showArchived")}
          </button>
          <Link href={`/${locale}/seniors/new`}>
            <Button>
              <Plus size={16} />
              {t("addSenior")}
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && <PageSpinner />}

      {!isLoading && seniors?.length === 0 && (
        <EmptyState
          icon={<Users size={24} />}
          title={t("noSeniors")}
          action={
            <Link href={`/${locale}/seniors/new`}>
              <Button>
                <Plus size={16} />
                {t("addSenior")}
              </Button>
            </Link>
          }
        />
      )}

      {!isLoading && seniors && seniors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {seniors.map((senior) => (
            <SeniorCard
              key={senior.id}
              senior={senior}
              locale={locale}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
