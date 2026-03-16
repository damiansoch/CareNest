"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import type { Medication, Senior, TimeOfDay } from "@/types";

const TIME_ORDER: TimeOfDay[] = [
  "morning",
  "midday",
  "afternoon",
  "evening",
  "bedtime",
  "custom",
];

interface TrackerProps {
  senior: Senior;
  medications: Medication[];
  locale: string;
  date?: Date;
}

export function MedicationTracker({
  senior,
  medications,
  locale,
  date = new Date(),
}: TrackerProps) {
  const t = useTranslations("tracker");
  const tMeds = useTranslations("medications");
  const dateLocale = locale === "pl" ? pl : enUS;

  const grouped = TIME_ORDER.reduce<Record<TimeOfDay, Medication[]>>(
    (acc, tod) => {
      acc[tod] = medications.filter(
        (m) => m.is_active && m.schedules.some((s) => s.time_of_day === tod)
      );
      return acc;
    },
    {} as Record<TimeOfDay, Medication[]>
  );

  const hasAny = medications.some((m) => m.is_active && m.schedules.length > 0);

  return (
    <div className="tracker-page font-sans">
      {/* Header */}
      <div className="tracker-header border-b-2 border-black pb-4 mb-6 print:pb-2 print:mb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="tracker-title text-3xl font-bold text-black print:text-lg">
              {t("title")}
            </h1>
            <p className="tracker-senior text-2xl font-semibold text-black mt-1 print:text-sm print:mt-0">
              {senior.full_name}
            </p>
          </div>
          <div className="text-right">
            <p className="tracker-date text-xl font-medium text-black print:text-sm">
              {format(date, "d MMMM yyyy", { locale: dateLocale })}
            </p>
            <p className="text-sm text-gray-600 mt-1 print:text-xs print:mt-0">CareNest</p>
          </div>
        </div>
      </div>

      {!hasAny ? (
        <p className="text-xl text-gray-600 print:text-sm">{t("noMedications")}</p>
      ) : (
        <div className="tracker-sections space-y-6 print:space-y-2">
          {TIME_ORDER.map((tod) => {
            const meds = grouped[tod];
            if (meds.length === 0) return null;
            return (
              <TrackerSection
                key={tod}
                timeOfDay={tod}
                medications={meds}
                label={t(tod as Parameters<typeof t>[0])}
                tMeds={tMeds}
              />
            );
          })}
        </div>
      )}

      {/* Notes section */}
      <div className="tracker-notes mt-8 pt-4 border-t-2 border-black print:mt-3 print:pt-2">
        <h3 className="text-xl font-bold text-black mb-3 print:text-sm print:mb-1">{t("notes")}</h3>
        <div className="notes-lines">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-b border-gray-400 h-10 mb-1 print:h-5 print:mb-0.5" />
          ))}
        </div>
      </div>

      {/* Print button — hidden when printing */}
      <div className="mt-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("printTracker")}
        </button>
      </div>
    </div>
  );
}

function TrackerSection({
  timeOfDay,
  medications,
  label,
  tMeds,
}: {
  timeOfDay: TimeOfDay;
  medications: Medication[];
  label: string;
  tMeds: ReturnType<typeof useTranslations<"medications">>;
}) {
  const ICONS: Record<TimeOfDay, string> = {
    morning: "🌅",
    midday: "☀️",
    afternoon: "🌤️",
    evening: "🌆",
    bedtime: "🌙",
    custom: "⏰",
  };

  return (
    <div className="tracker-section">
      <h2 className="text-2xl font-bold text-black mb-3 flex items-center gap-2 print:text-sm print:mb-1 print:gap-1">
        <span>{ICONS[timeOfDay]}</span>
        <span>{label}</span>
      </h2>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden print:border">
        {medications.map((med, idx) => {
          const schedule = med.schedules.find((s) => s.time_of_day === timeOfDay);
          return (
            <div
              key={med.id}
              className={`flex items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 print:px-2 print:py-0.5 print:gap-2 ${
                idx < medications.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 w-8 h-8 border-2 border-black rounded print:w-4 print:h-4 print:border" />

              {/* Medication info */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-black print:text-xs print:leading-tight">
                  {med.name}
                  {med.dosage && (
                    <span className="ml-2 text-base font-normal text-gray-700 print:text-xs">
                      {med.dosage}
                    </span>
                  )}
                </p>
                {med.form && (
                  <p className="text-sm text-gray-600 print:text-xs print:leading-none">
                    {tMeds(`forms.${med.form}` as Parameters<typeof tMeds>[0])}
                  </p>
                )}
              </div>

              {/* Instructions */}
              {med.instructions && (
                <p className="text-xs text-gray-600 italic sm:text-sm md:max-w-48 md:text-right print:text-xs print:max-w-28">
                  {med.instructions}
                </p>
              )}

              {/* Custom time */}
              {schedule?.custom_time && (
                <p className="flex-shrink-0 text-base font-medium text-black print:text-xs">
                  {schedule.custom_time.slice(0, 5)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
