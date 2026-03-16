import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "../providers";
import { SITE_NAME, SITE_URL, getCopy, canonical, hreflang, ogLocale } from "@/lib/seo";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = getCopy(locale);

  return {
    metadataBase: new URL(SITE_URL),

    // Title template propagates to all child pages
    title: {
      template: `%s | ${SITE_NAME}`,
      default:  `${SITE_NAME} — ${copy.tagline}`,
    },
    description: copy.description,
    keywords:    copy.keywords as unknown as string[],

    // Authorship
    authors:          [{ name: SITE_NAME, url: SITE_URL }],
    creator:          SITE_NAME,
    publisher:        SITE_NAME,
    applicationName:  SITE_NAME,
    generator:        "Next.js",
    referrer:         "origin-when-cross-origin",

    // Private app — authenticated pages should not be indexed by default.
    // Individual route layouts override this for public pages (login/register).
    robots: {
      index:     false,
      follow:    false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },

    // OpenGraph
    openGraph: {
      type:            "website",
      locale:          ogLocale(locale),
      alternateLocale: locale === "pl" ? "en_US" : "pl_PL",
      url:             canonical(locale),
      siteName:        SITE_NAME,
      title:           `${SITE_NAME} — ${copy.tagline}`,
      description:     copy.description,
      images: [
        {
          url:    "/og-image.png",
          width:  1200,
          height: 630,
          alt:    `${SITE_NAME} — ${copy.tagline}`,
          type:   "image/png",
        },
      ],
    },

    // Twitter / X card
    twitter: {
      card:        "summary_large_image",
      title:       `${SITE_NAME} — ${copy.tagline}`,
      description: copy.description,
      images:      ["/og-image.png"],
    },

    // Canonical + hreflang
    alternates: {
      canonical:  canonical(locale),
      languages:  hreflang(),
    },

    // Icons
    icons: {
      icon: [
        { url: "/favicon.ico",        sizes: "any" },
        { url: "/icon.svg",           type: "image/svg+xml" },
        { url: "/favicon-16x16.png",  sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png",  sizes: "32x32", type: "image/png" },
      ],
      apple:    "/apple-touch-icon.png",
      shortcut: "/favicon.ico",
    },

    // PWA manifest
    manifest: "/manifest.webmanifest",

    // App category
    category: "health",
  };
}

// ── JSON-LD: WebApplication schema ────────────────────────────────────────────
function JsonLd({ locale }: { locale: string }) {
  const copy = getCopy(locale);

  const schema = {
    "@context":          "https://schema.org",
    "@type":             "WebApplication",
    name:                SITE_NAME,
    url:                 SITE_URL,
    description:         copy.description,
    applicationCategory: "HealthApplication",
    operatingSystem:     "Web Browser",
    inLanguage:          ["pl-PL", "en-US"],
    offers: {
      "@type":       "Offer",
      price:         "0",
      priceCurrency: "PLN",
    },
    featureList:
      locale === "pl"
        ? ["Zarządzanie lekami", "Wizyty lekarskie", "Powiadomienia email", "Drukowanie trackerów leków", "Wieloosobowy dostęp"]
        : ["Medication management", "Medical appointments", "Email reminders", "Printable medication trackers", "Multi-user access"],
    screenshot: `${SITE_URL}/og-image.png`,
    provider: {
      "@type": "Organization",
      name:    SITE_NAME,
      url:     SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "pl")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <JsonLd locale={locale} />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <meta name="msapplication-TileColor" content="#3b82f6" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
