"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const LOCALES = [
  { code: "pl", label: "PL" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    // Replace current locale prefix with new locale
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            locale === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
