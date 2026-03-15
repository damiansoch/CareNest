"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api/endpoints";
import { PageSpinner } from "@/components/ui/spinner";
import { useState } from "react";

export function AuthGuard({ children, locale }: { children: React.ReactNode; locale: string }) {
  const { isAuthenticated, setUser, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    async function verify() {
      if (!isAuthenticated) {
        router.replace(`/${locale}/auth/login`);
        setChecking(false);
        return;
      }
      // Verify token is still valid and hydrate user
      try {
        const { data } = await authApi.me();
        setUser(data);
      } catch {
        logout();
        router.replace(`/${locale}/auth/login`);
      } finally {
        setChecking(false);
      }
    }
    verify();
  }, [isAuthenticated, locale, pathname, _hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) return <PageSpinner />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
