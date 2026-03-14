"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { SeniorForm } from "@/components/seniors/SeniorForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCreateSenior } from "@/hooks/useSeniors";
import Link from "next/link";

export default function NewSeniorPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <NewSeniorContent locale={locale} />
      </AppShell>
    </AuthGuard>
  );
}

function NewSeniorContent({ locale }: { locale: string }) {
  const t = useTranslations("seniors");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const create = useCreateSenior();

  async function handleSubmit(data: Parameters<typeof create.mutateAsync>[0]) {
    await create.mutateAsync(data);
    router.push(`/${locale}/seniors`);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/seniors`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("addSenior")}</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <SeniorForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${locale}/seniors`)}
        />
      </div>
    </div>
  );
}
