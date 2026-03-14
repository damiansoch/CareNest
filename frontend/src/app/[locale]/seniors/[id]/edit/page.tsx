"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { SeniorForm } from "@/components/seniors/SeniorForm";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useSenior, useUpdateSenior } from "@/hooks/useSeniors";

export default function EditSeniorPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <EditSeniorContent locale={locale} id={id} />
      </AppShell>
    </AuthGuard>
  );
}

function EditSeniorContent({ locale, id }: { locale: string; id: string }) {
  const t = useTranslations("seniors");
  const router = useRouter();
  const { data: senior, isLoading } = useSenior(id);
  const update = useUpdateSenior(id);

  if (isLoading) return <PageSpinner />;
  if (!senior) return null;

  async function handleSubmit(data: Parameters<typeof update.mutateAsync>[0]) {
    await update.mutateAsync(data);
    router.push(`/${locale}/seniors/${id}`);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/seniors/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("editSenior")}</h1>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <SeniorForm
          defaultValues={senior}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${locale}/seniors/${id}`)}
        />
      </div>
    </div>
  );
}
