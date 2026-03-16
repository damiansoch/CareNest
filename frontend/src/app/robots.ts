import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/pl/auth/login",
          "/pl/auth/register",
          "/en/auth/login",
          "/en/auth/register",
          "/og-image.png",
          "/favicon.ico",
          "/icon.svg",
          "/apple-touch-icon.png",
          "/manifest.webmanifest",
        ],
        disallow: [
          "/pl/seniors/",
          "/pl/tracker/",
          "/pl/settings/",
          "/pl/appointments/",
          "/en/seniors/",
          "/en/tracker/",
          "/en/settings/",
          "/en/appointments/",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Omgilibot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
