import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const LOCALES = ["pl", "en"] as const;

// Only public (unauthenticated) routes belong in the sitemap.
// All app pages require login and are excluded intentionally.
const PUBLIC_ROUTES = [
  { path: "",              priority: 1.0, changeFrequency: "monthly" as const },
  { path: "/auth/login",   priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/auth/register",priority: 0.8, changeFrequency: "monthly" as const },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return LOCALES.flatMap((locale) =>
    PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
      url:             `${SITE_URL}/${locale}${path}`,
      lastModified:    now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          pl:          `${SITE_URL}/pl${path}`,
          en:          `${SITE_URL}/en${path}`,
          "x-default": `${SITE_URL}/pl${path}`,
        },
      },
    }))
  );
}
