"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { authApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils/cn";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    try {
      const res = await authApi.login(data.email, data.password);
      setTokens(res.data.access, res.data.refresh);
      const meRes = await authApi.me();
      setUser(meRes.data);
      router.push(`/${params.locale}`);
    } catch {
      setError("root", { message: "Invalid email or password." });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CareNest</h1>
          <p className="mt-2 text-muted-foreground">{t("login")}</p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("email")}</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
                  errors.email && "border-destructive"
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("password")}</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
                  errors.password && "border-destructive"
                )}
              />
            </div>

            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? "..." : t("loginButton")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link
              href={`/${params.locale}/auth/register`}
              className="font-medium text-primary hover:underline"
            >
              {t("registerButton")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
