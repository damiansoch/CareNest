import type { Metadata } from "next";
import { getCopy } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = getCopy(locale).pages.seniorDetail;
  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}

export default function SeniorDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
