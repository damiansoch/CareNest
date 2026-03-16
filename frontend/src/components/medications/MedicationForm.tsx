"use client";

import { useTranslations } from "next-intl";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FieldError, FormError } from "@/components/ui/error-message";
import { Spinner } from "@/components/ui/spinner";
import type { Medication, MedicationForm as MedForm, TimeOfDay } from "@/types";

const TIME_OF_DAY_VALUES = ["morning", "midday", "afternoon", "evening", "bedtime", "custom"] as const;
const MED_FORM_VALUES = ["tablet", "capsule", "liquid", "injection", "patch", "drops", "inhaler", "other"] as const;

const scheduleSchema = z.object({
  time_of_day: z.enum(TIME_OF_DAY_VALUES),
  custom_time: z.string().optional(),
});

const medicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  form: z.enum(MED_FORM_VALUES),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  schedules: z.array(scheduleSchema),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

interface MedicationFormProps {
  defaultValues?: Partial<Medication>;
  onSubmit: (data: MedicationFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function MedicationForm({ defaultValues, onSubmit, onCancel }: MedicationFormProps) {
  const t = useTranslations("medications");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      dosage: defaultValues?.dosage ?? "",
      form: (defaultValues?.form as MedForm) ?? "tablet",
      instructions: defaultValues?.instructions ?? "",
      notes: defaultValues?.notes ?? "",
      start_date: defaultValues?.start_date ?? new Date().toISOString().slice(0, 10),
      end_date: defaultValues?.end_date ?? "",
      schedules: defaultValues?.schedules?.map((s) => ({
        time_of_day: s.time_of_day,
        custom_time: s.custom_time ?? "",
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });
  const schedules = watch("schedules");

  async function handleFormSubmit(data: MedicationFormValues) {
    try {
      await onSubmit(data);
    } catch {
      setError("root", { message: "Wystąpił błąd. Spróbuj ponownie." });
    }
  }

  const usedTimes = new Set(schedules.map((s) => s.time_of_day));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Name + dosage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">{t("name")} *</Label>
          <Input id="name" {...register("name")} error={!!errors.name} className="mt-1" />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="dosage">{t("dosage")}</Label>
          <Input id="dosage" {...register("dosage")} className="mt-1" placeholder="np. 500mg" />
        </div>
      </div>

      {/* Form */}
      <div>
        <Label>{t("form")}</Label>
        <Controller
          control={control}
          name="form"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MED_FORM_VALUES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {t(`forms.${f}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Instructions */}
      <div>
        <Label htmlFor="instructions">{t("instructions")}</Label>
        <Input id="instructions" {...register("instructions")} className="mt-1" placeholder="np. przyjmować z posiłkiem" />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">{t("startDate")} *</Label>
          <Input
            id="start_date"
            type="date"
            {...register("start_date")}
            error={!!errors.start_date}
            className="mt-1"
          />
          <FieldError message={errors.start_date?.message} />
        </div>
        <div>
          <Label htmlFor="end_date">{t("endDate")}</Label>
          <Input id="end_date" type="date" {...register("end_date")} className="mt-1" />
        </div>
      </div>

      {/* Schedule */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{t("schedule")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ time_of_day: "morning", custom_time: "" })}
          >
            <Plus size={14} />
            {t("timeOfDay")}
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2 rounded-lg border p-3">
              <Controller
                control={control}
                name={`schedules.${idx}.time_of_day`}
                render={({ field: f }) => (
                  <Select value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OF_DAY_VALUES.map((tod) => (
                        <SelectItem
                          key={tod}
                          value={tod}
                        >
                          {t(tod as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {schedules[idx]?.time_of_day === "custom" && (
                <Input
                  type="time"
                  {...register(`schedules.${idx}.custom_time`)}
                  className="w-24 sm:w-32"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8"
                onClick={() => remove(idx)}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              Brak przypisanych pór dnia. Dodaj harmonogram.
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">{t("notes")}</Label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={2}
          className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <FormError message={errors.root?.message} />

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="h-4 w-4" />}
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
