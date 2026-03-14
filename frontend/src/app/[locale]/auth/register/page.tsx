"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Suspense } from "react";
import { authApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils/cn";

const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  family_name: z.string().optional(),
  invitation_token: z.string().optional(),
  mode: z.enum(["new_family", "join_family"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterForm({ params }: { params: { locale: string } }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") ?? "";
  const { setTokens, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      mode: inviteToken ? "join_family" : "new_family",
      invitation_token: inviteToken,
    },
  });

  const mode = watch("mode");

  async function onSubmit(data: RegisterForm) {
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        ...(mode === "new_family" ? { family_name: data.family_name } : {}),
        ...(mode === "join_family" ? { invitation_token: data.invitation_token } : {}),
      };
      const res = await authApi.register(payload);
      setTokens(res.data.access, res.data.refresh);
      setUser(res.data.user);
      router.push(`/${params.locale}`);
    } catch {
      setError("root", { message: "Registration failed. Please check your details." });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CareNest</h1>
          <p className="mt-2 text-muted-foreground">{t("register")}</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("firstName")}</label>
                <input
                  {...register("first_name")}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("lastName")}</label>
                <input
                  {...register("last_name")}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("email")}</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("password")}</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(["new_family", "join_family"] as const).map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    mode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <input
                    {...register("mode")}
                    type="radio"
                    value={m}
                    className="sr-only"
                  />
                  {m === "new_family" ? t("createFamily") : t("joinFamily")}
                </label>
              ))}
            </div>

            {mode === "new_family" && (
              <div>
                <label className="block text-sm font-medium mb-1">{t("familyName")}</label>
                <input
                  {...register("family_name")}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {mode === "join_family" && (
              <div>
                <label className="block text-sm font-medium mb-1">{t("invitationToken")}</label>
                <input
                  {...register("invitation_token")}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? "..." : t("registerButton")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link
              href={`/${params.locale}/auth/login`}
              className="font-medium text-primary hover:underline"
            >
              {t("loginButton")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage({ params }: { params: { locale: string } }) {
  return (
    <Suspense>
      <RegisterForm params={params} />
    </Suspense>
  );
}
