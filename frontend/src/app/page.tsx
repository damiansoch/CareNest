import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — Family Caregiving Platform`,
  description:
    "CareNest helps families manage care for loved ones. Track medications, manage appointments and coordinate caregivers in one place.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Family Caregiving Platform`,
    description:
      "CareNest helps families manage care for loved ones. Track medications, manage appointments and coordinate caregivers in one place.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Family Caregiving Platform`,
    description:
      "CareNest helps families manage care for loved ones. Track medications, manage appointments and coordinate caregivers in one place.",
    images: ["/og-image.png"],
  },
};

function detectLocale(acceptLanguage: string | null): "pl" | "en" {
  if (!acceptLanguage) return "pl";

  const value = acceptLanguage.toLowerCase();

  if (value.includes("pl-pl") || value.includes("pl")) {
    return "pl";
  }

  if (
    value.includes("en-us") ||
    value.includes("en-gb") ||
    value.includes("en")
  ) {
    return "en";
  }

  return "pl";
}

export default async function RootPage() {
  const acceptLanguage = (await headers()).get("accept-language");
  const locale = detectLocale(acceptLanguage);

  redirect(`/${locale}`);
}
