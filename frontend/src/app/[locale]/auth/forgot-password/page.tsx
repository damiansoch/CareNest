"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { authApi } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils/cn";

export default function ForgotPasswordPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CareNest</h1>
          <p className="mt-2 text-muted-foreground">{t("forgotPasswordTitle")}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{t("forgotPasswordSent")}</p>
              <Link
                href={`/${params.locale}/auth/login`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{t("forgotPasswordDesc")}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? "..." : t("forgotPasswordButton")}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link
                  href={`/${params.locale}/auth/login`}
                  className="font-medium text-primary hover:underline"
                >
                  {t("backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
