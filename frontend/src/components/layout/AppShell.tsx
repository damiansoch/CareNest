"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users,
  Pill,
  Calendar,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/store/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

function useNavItems(locale: string): NavItem[] {
  const base = `/${locale}`;
  return [
    { href: `${base}`, labelKey: "dashboard", icon: <Home size={18} /> },
    { href: `${base}/seniors`, labelKey: "seniors", icon: <Users size={18} /> },
    { href: `${base}/appointments`, labelKey: "appointments", icon: <Calendar size={18} /> },
    { href: `${base}/settings/team`, labelKey: "team", icon: <UserCog size={18} /> },
  ];
}

export function AppShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = useNavItems(locale);

  const NavLinks = () => (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.icon}
            {t(item.labelKey as Parameters<typeof t>[0])}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card px-4 py-6 print:hidden">
        <div className="mb-8">
          <span className="text-xl font-bold text-primary">CareNest</span>
        </div>
        <NavLinks />
        <div className="mt-auto flex flex-col gap-3">
          <LanguageSwitcher locale={locale} />
          {user && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="truncate">{user.first_name} {user.last_name}</span>
              <button
                onClick={logout}
                className="ml-2 p-1 rounded hover:text-destructive transition-colors"
                aria-label={t("logout")}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-card px-4 py-3 print:hidden">
        <span className="text-lg font-bold text-primary">CareNest</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          className="p-1"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-14 px-4 py-4 print:hidden">
          <NavLinks />
          <div className="mt-6">
            <LanguageSwitcher locale={locale} />
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
            >
              <LogOut size={16} />
              {t("logout")}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:pt-0 pt-14">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
