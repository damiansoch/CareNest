import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const BLUE = "#3b82f6";
const DARK_BLUE = "#1d4ed8";
const WHITE = "#ffffff";

const copy: Record<string, { tagline: string; description: string }> = {
  pl: {
    tagline: "Platforma opieki rodzinnej",
    description:
      "Zarządzaj lekami, wizytami lekarskimi i zespołem opiekunów w jednym miejscu.",
  },
  en: {
    tagline: "Family Caregiving Platform",
    description:
      "Manage medications, appointments and your caregiving team — all in one place.",
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const locale = searchParams.get("locale") === "en" ? "en" : "pl";
  const c = copy[locale];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${BLUE} 0%, ${DARK_BLUE} 100%)`,
          padding: "60px 72px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "auto",
          }}
        >
          {/* Heart icon */}
          <div
            style={{
              width: 72,
              height: 72,
              background: "rgba(255,255,255,0.2)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
            🏠
          </div>
          <span
            style={{
              fontSize: "52px",
              fontWeight: 800,
              color: WHITE,
              letterSpacing: "-1px",
            }}
          >
            CareNest
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: WHITE,
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            {c.tagline}
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            {c.description}
          </div>
        </div>

        {/* Bottom badge */}
        <div
          style={{
            marginTop: "48px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "100px",
              padding: "10px 24px",
              fontSize: "22px",
              color: WHITE,
              fontWeight: 500,
            }}
          >
            carenest.kinhub.eu
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
