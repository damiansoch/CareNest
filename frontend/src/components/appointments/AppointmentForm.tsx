"use client";

import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormError } from "@/components/ui/error-message";
import { Spinner } from "@/components/ui/spinner";
import type { Appointment } from "@/types";

const appointmentSchema = z.object({
  title: z.string().min(1),
  doctor_name: z.string().optional(),
  location: z.string().optional(),
  datetime: z.string().min(1),
  notes: z.string().optional(),
  reminder_24h: z.boolean(),
  reminder_2h: z.boolean(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  defaultValues?: Partial<Appointment>;
  onSubmit: (data: AppointmentFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function AppointmentForm({ defaultValues, onSubmit, onCancel }: AppointmentFormProps) {
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");

  const existing24h = defaultValues?.reminder_configs?.some(
    (r) => r.offset_hours === 24 && r.is_enabled
  );
  const existing2h = defaultValues?.reminder_configs?.some(
    (r) => r.offset_hours === 2 && r.is_enabled
  );

  // Convert stored UTC datetime to local datetime-local input format
  const defaultDatetime = defaultValues?.datetime
    ? new Date(defaultValues.datetime).toISOString().slice(0, 16)
    : "";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      doctor_name: defaultValues?.doctor_name ?? "",
      location: defaultValues?.location ?? "",
      datetime: defaultDatetime,
      notes: defaultValues?.notes ?? "",
      reminder_24h: existing24h ?? true,
      reminder_2h: existing2h ?? true,
    },
  });

  async function handleFormSubmit(values: AppointmentFormValues) {
    try {
      await onSubmit(values);
    } catch {
      setError("root", { message: "Wystąpił błąd. Spróbuj ponownie." });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">{t("appointmentTitle")} *</Label>
        <Input
          id="title"
          {...register("title")}
          error={!!errors.title}
          className="mt-1"
          placeholder="np. Wizyta u kardiologa"
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="doctor_name">{t("doctorName")}</Label>
          <Input
            id="doctor_name"
            {...register("doctor_name")}
            className="mt-1"
            placeholder="np. dr Anna Kowalska"
          />
        </div>
        <div>
          <Label htmlFor="datetime">{t("datetime")} *</Label>
          <Input
            id="datetime"
            type="datetime-local"
            {...register("datetime")}
            error={!!errors.datetime}
            className="mt-1"
          />
          <FieldError message={errors.datetime?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="location">{t("location")}</Label>
        <Input
          id="location"
          {...register("location")}
          className="mt-1"
          placeholder="np. ul. Główna 10, Warszawa"
        />
      </div>

      <div>
        <Label htmlFor="notes">{t("notes")}</Label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={2}
          className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      {/* Reminders */}
      <div>
        <Label className="mb-2 block">{t("reminders")}</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("reminder_24h")}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">{t("reminder24h")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("reminder_2h")}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">{t("reminder2h")}</span>
          </label>
        </div>
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
