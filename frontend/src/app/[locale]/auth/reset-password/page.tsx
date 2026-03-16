"use client";

import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils/cn";

function ResetPasswordForm({ params }: { params: { locale: string } }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidLink = !!uid && !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.confirmPasswordReset(uid, token, password);
      setSuccess(true);
      setTimeout(() => router.push(`/${params.locale}/auth/login`), 2500);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg =
        (data?.detail as string) ||
        (Array.isArray(data?.password) ? (data.password as string[])[0] : null) ||
        t("resetLinkInvalid");
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CareNest</h1>
          <p className="mt-2 text-muted-foreground">{t("resetPasswordTitle")}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
          {!isValidLink ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-destructive">{t("resetLinkInvalid")}</p>
              <Link
                href={`/${params.locale}/auth/forgot-password`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("forgotPasswordTitle")}
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{t("resetPasswordSuccess")}</p>
              <Link
                href={`/${params.locale}/auth/login`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{t("resetPasswordDesc")}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("newPassword")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className={cn(
                      "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
                      error && "border-destructive focus:ring-destructive"
                    )}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? "..." : t("resetPasswordButton")}
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

export default function ResetPasswordPage({ params }: { params: { locale: string } }) {
  return (
    <Suspense>
      <ResetPasswordForm params={params} />
    </Suspense>
  );
}
