/**
 * Centralised SEO copy and constants.
 * All metadata strings for both locales live here — one place to update.
 */

export const SITE_NAME = "CareNest";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://carenest.kinhub.eu"
).replace(/\/$/, "");

// ── Bilingual copy ────────────────────────────────────────────────────────────

const PL = {
  tagline: "Platforma opieki rodzinnej",
  description:
    "CareNest to platforma dla rodzin sprawujących opiekę nad seniorami. Zarządzaj lekami, wizytami lekarskimi i zespołem opiekunów w jednym miejscu.",
  keywords: [
    "opieka nad seniorem",
    "zarządzanie lekami",
    "wizyty lekarskie",
    "opiekun",
    "platforma rodzinna",
    "CareNest",
    "opieka zdrowotna",
    "senior",
  ],

  pages: {
    login: {
      title: "Zaloguj się",
      description:
        "Zaloguj się do CareNest, aby zarządzać opieką nad swoimi podopiecznymi.",
    },
    register: {
      title: "Utwórz konto",
      description:
        "Dołącz do CareNest i zacznij zarządzać opieką nad swoją rodziną. Rejestracja jest bezpłatna.",
    },
    dashboard: {
      title: "Pulpit",
      description:
        "Przegląd podopiecznych, nadchodzących wizyt i aktywnych leków.",
    },
    seniors: {
      title: "Podopieczni",
      description: "Lista podopiecznych przypisanych do Twojej rodziny.",
    },
    seniorDetail: {
      title: "Profil podopiecznego",
      description: "Szczegółowe informacje, leki i wizyty podopiecznego.",
    },
    newSenior: {
      title: "Dodaj podopiecznego",
      description:
        "Dodaj nową osobę objętą opieką do swojej rodziny w CareNest.",
    },
    editSenior: {
      title: "Edytuj podopiecznego",
      description: "Zaktualizuj dane podopiecznego.",
    },
    medications: {
      title: "Leki",
      description: "Plan leków i harmonogram dawkowania podopiecznego.",
    },
    appointments: {
      title: "Wizyty lekarskie",
      description: "Nadchodzące i poprzednie wizyty lekarskie podopiecznego.",
    },
    tracker: {
      title: "Tracker leków",
      description:
        "Dzienny plan przyjmowania leków — drukuj lub wyświetlaj na ekranie.",
    },
    team: {
      title: "Zespół opiekunów",
      description: "Zarządzaj opiekunami i uprawnieniami w swojej rodzinie.",
    },
    allAppointments: {
      title: "Wszystkie wizyty",
      description: "Przegląd nadchodzących wizyt wszystkich podopiecznych.",
    },
  },
} as const;

const EN = {
  tagline: "Family Caregiving Platform",
  description:
    "CareNest is a platform for families caring for seniors. Manage medications, medical appointments and your caregiving team all in one place.",
  keywords: [
    "senior care",
    "medication management",
    "medical appointments",
    "caregiver",
    "family platform",
    "CareNest",
    "healthcare",
    "elderly care",
  ],

  pages: {
    login: {
      title: "Sign in",
      description: "Sign in to CareNest to manage care for your loved ones.",
    },
    register: {
      title: "Create account",
      description:
        "Join CareNest and start managing care for your family. Registration is free.",
    },
    dashboard: {
      title: "Dashboard",
      description:
        "Overview of seniors, upcoming appointments and active medications.",
    },
    seniors: {
      title: "Seniors",
      description: "List of seniors assigned to your family.",
    },
    seniorDetail: {
      title: "Senior Profile",
      description:
        "Detailed information, medications and appointments for the senior.",
    },
    newSenior: {
      title: "Add Senior",
      description: "Add a new person under care to your family in CareNest.",
    },
    editSenior: {
      title: "Edit Senior",
      description: "Update the senior's details.",
    },
    medications: {
      title: "Medications",
      description: "Medication plan and dosage schedule for the senior.",
    },
    appointments: {
      title: "Appointments",
      description: "Upcoming and past medical appointments for the senior.",
    },
    tracker: {
      title: "Medication Tracker",
      description:
        "Daily medication administration plan — print or display on screen.",
    },
    team: {
      title: "Caregiver Team",
      description: "Manage caregivers and permissions in your family.",
    },
    allAppointments: {
      title: "All Appointments",
      description: "Overview of upcoming appointments for all seniors.",
    },
  },
} as const;

export const SEO_COPY = { pl: PL, en: EN } as const;
export type SupportedLocale = keyof typeof SEO_COPY;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCopy(locale: string) {
  return SEO_COPY[
    (locale as SupportedLocale) in SEO_COPY ? (locale as SupportedLocale) : "pl"
  ];
}

/** Canonical URL for a given path */
export function canonical(locale: string, path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}/${locale}${cleanPath}`;
}

/** hreflang alternates for a given path (without locale prefix) */
export function hreflang(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return {
    pl: `${SITE_URL}/pl${cleanPath}`,
    en: `${SITE_URL}/en${cleanPath}`,
    "x-default": `${SITE_URL}/pl${cleanPath}`,
  };
}

/** OpenGraph locale string */
export function ogLocale(locale: string) {
  return locale === "pl" ? "pl_PL" : "en_US";
}
