import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             `${SITE_NAME} — Platforma opieki rodzinnej`,
    short_name:       SITE_NAME,
    description:      "Zarządzaj lekami, wizytami i opiekunami w jednym miejscu.",
    start_url:        "/pl",
    scope:            "/",
    display:          "standalone",
    orientation:      "portrait-primary",
    background_color: "#ffffff",
    theme_color:      "#3b82f6",
    lang:             "pl",
    dir:              "ltr",
    categories:       ["health", "lifestyle", "medical"],
    icons: [
      {
        src:     "/icon-192.png",
        sizes:   "192x192",
        type:    "image/png",
        purpose: "any",
      },
      {
        src:     "/icon-512.png",
        sizes:   "512x512",
        type:    "image/png",
        purpose: "any",
      },
      {
        src:     "/icon-maskable-512.png",
        sizes:   "512x512",
        type:    "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src:          "/og-image.png",
        sizes:        "1200x630",
        type:         "image/png",
        // @ts-expect-error — form_factor is valid per spec but not yet in Next.js types
        form_factor:  "wide",
        label:        "CareNest Dashboard",
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
