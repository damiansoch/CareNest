"use client";

import { useTranslations } from "next-intl";
import { Pencil, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Medication } from "@/types";

const TIME_ICONS: Record<string, string> = {
  morning: "🌅",
  midday: "☀️",
  afternoon: "🌤️",
  evening: "🌆",
  bedtime: "🌙",
  custom: "⏰",
};

interface MedicationRowProps {
  medication: Medication;
  onEdit: (med: Medication) => void;
  onDeactivate: (id: string) => void;
}

export function MedicationRow({ medication, onEdit, onDeactivate }: MedicationRowProps) {
  const t = useTranslations("medications");
  const tCommon = useTranslations("common");

  return (
    <div className="flex items-start gap-4 px-4 py-3 hover:bg-accent/40 transition-colors rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{medication.name}</span>
          {medication.dosage && (
            <span className="text-sm text-muted-foreground">{medication.dosage}</span>
          )}
          <Badge variant="outline" className="text-xs">
            {t(`forms.${medication.form}` as Parameters<typeof t>[0])}
          </Badge>
          {!medication.is_active && (
            <Badge variant="secondary" className="text-xs">{t("inactive")}</Badge>
          )}
        </div>

        {medication.instructions && (
          <p className="text-xs text-muted-foreground mt-0.5">{medication.instructions}</p>
        )}

        {medication.schedules.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {medication.schedules.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {TIME_ICONS[s.time_of_day]}
                {t(s.time_of_day as Parameters<typeof t>[0])}
                {s.custom_time && ` ${s.custom_time.slice(0, 5)}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(medication)}
          title={tCommon("edit")}
        >
          <Pencil size={13} />
        </Button>
        {medication.is_active && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDeactivate(medication.id)}
            title={t("inactive")}
          >
            <PowerOff size={13} />
          </Button>
        )}
      </div>
    </div>
  );
}
