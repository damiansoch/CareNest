"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Pill, Calendar, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Senior } from "@/types";

interface SeniorCardProps {
  senior: Senior;
  locale: string;
  onArchive?: (id: string) => void;
}

export function SeniorCard({ senior, locale, onArchive }: SeniorCardProps) {
  const t = useTranslations("seniors");
  const base = `/${locale}/seniors/${senior.id}`;

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        senior.is_archived && "opacity-60"
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {senior.photo ? (
              <Image
                src={senior.photo}
                alt={senior.full_name}
                width={48}
                height={48}
                className="rounded-full object-cover h-12 w-12"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                {senior.first_name[0]}{senior.last_name[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={base}
                className="text-base font-semibold hover:text-primary transition-colors"
              >
                {senior.full_name}
              </Link>
              {senior.is_archived && (
                <Badge variant="outline">{t("archived")}</Badge>
              )}
            </div>
            {senior.date_of_birth && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date(senior.date_of_birth).toLocaleDateString(
                  locale === "pl" ? "pl-PL" : "en-GB"
                )}
              </p>
            )}
            {senior.notes && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {senior.notes}
              </p>
            )}
          </div>

          {/* Actions menu */}
          {!senior.is_archived && (
            <div className="flex-shrink-0">
              <SeniorActions senior={senior} locale={locale} onArchive={onArchive} />
            </div>
          )}
        </div>

        {/* Quick action links */}
        {!senior.is_archived && (
          <div className="border-t flex divide-x">
            <Link
              href={`${base}/medications`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
            >
              <Pill size={13} />
              {useTranslations("medications")("title")}
            </Link>
            <Link
              href={`${base}/appointments`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
            >
              <Calendar size={13} />
              {useTranslations("appointments")("title")}
            </Link>
            <Link
              href={`/${locale}/tracker/${senior.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
            >
              <Printer size={13} />
              {useTranslations("tracker")("printTracker")}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SeniorActions({
  senior,
  locale,
  onArchive,
}: {
  senior: Senior;
  locale: string;
  onArchive?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Link href={`/${locale}/seniors/${senior.id}/edit`}>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          {useTranslations("common")("edit")}
        </Button>
      </Link>
      {onArchive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => onArchive(senior.id)}
        >
          {useTranslations("common")("archive")}
        </Button>
      )}
    </div>
  );
}
