"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users,
  Calendar,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          >
            {/* Sliding active pill — the magic ✨ */}
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.82))",
                  boxShadow: "0 2px 14px hsl(var(--primary)/0.35)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex items-center gap-3 transition-colors",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              {t(item.labelKey as Parameters<typeof t>[0])}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-64 flex-col border-r bg-card px-4 py-6 print:hidden"
      >
        {/* Gradient logo */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <span
            className="text-xl font-bold"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.65))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CareNest
          </span>
        </motion.div>

        <NavLinks />

        <div className="mt-auto flex flex-col gap-3">
          <LanguageSwitcher locale={locale} />
          {user && (
            <motion.div
              className="flex items-center justify-between text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <span className="truncate">{user.first_name} {user.last_name}</span>
              <button
                onClick={logout}
                className="ml-2 p-1 rounded hover:text-destructive transition-colors"
                aria-label={t("logout")}
              >
                <LogOut size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* Mobile header — frosted glass */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-card/90 backdrop-blur-md px-4 py-3 print:hidden">
        <span
          className="text-lg font-bold"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.65))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          CareNest
        </span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          className="p-1"
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                <X size={22} />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                <Menu size={22} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu — blur reveal */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-14 px-4 py-4 print:hidden"
          >
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="mt-6">
              <LanguageSwitcher locale={locale} />
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut size={16} />
                {t("logout")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — blur + scale page transitions */}
      <main className="flex-1 lg:pt-0 pt-14 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)", scale: 0.99 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.1 } }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-5xl px-4 py-8 lg:px-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
