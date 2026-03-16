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
import type { Appointment, EventType } from "@/types";

const appointmentSchema = z.object({
  event_type: z.enum(["appointment", "shopping", "other"]),
  title: z.string().min(1),
  doctor_name: z.string().optional(),
  location: z.string().optional(),
  url: z.string().optional(),
  datetime: z.string().min(1),
  notes: z.string().optional(),
  reminder_on_day: z.boolean(),
  reminder_2d: z.boolean(),
  reminder_7d: z.boolean(),
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

  const existingOnDay = defaultValues?.reminder_configs?.some(
    (r) => r.offset_hours === 0 && r.is_enabled
  );
  const existing2d = defaultValues?.reminder_configs?.some(
    (r) => r.offset_hours === 48 && r.is_enabled
  );
  const existing7d = defaultValues?.reminder_configs?.some(
    (r) => r.offset_hours === 168 && r.is_enabled
  );

  // Convert stored UTC datetime to local datetime-local input format
  const defaultDatetime = defaultValues?.datetime
    ? new Date(defaultValues.datetime).toISOString().slice(0, 16)
    : "";

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      event_type: (defaultValues?.event_type as EventType) ?? "appointment",
      title: defaultValues?.title ?? "",
      doctor_name: defaultValues?.doctor_name ?? "",
      location: defaultValues?.location ?? "",
      url: defaultValues?.url ?? "",
      datetime: defaultDatetime,
      notes: defaultValues?.notes ?? "",
      reminder_on_day: existingOnDay ?? true,
      reminder_2d: existing2d ?? true,
      reminder_7d: existing7d ?? false,
    },
  });

  const eventType = watch("event_type");
  const isAppointment = eventType === "appointment";
  const showUrl = eventType === "shopping" || eventType === "other";

  async function handleFormSubmit(values: AppointmentFormValues) {
    try {
      await onSubmit(values);
    } catch {
      setError("root", { message: "Wystąpił błąd. Spróbuj ponownie." });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Event type */}
      <div>
        <Label htmlFor="event_type">{t("eventType")} *</Label>
        <select
          id="event_type"
          {...register("event_type")}
          className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="appointment">{t("eventTypeAppointment")}</option>
          <option value="shopping">{t("eventTypeShopping")}</option>
          <option value="other">{t("eventTypeOther")}</option>
        </select>
      </div>

      {/* Title + datetime */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">{t("appointmentTitle")} *</Label>
          <Input
            id="title"
            {...register("title")}
            error={!!errors.title}
            className="mt-1"
          />
          <FieldError message={errors.title?.message} />
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

      {/* Appointment-specific fields */}
      {isAppointment && (
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
            <Label htmlFor="location">{t("location")}</Label>
            <Input
              id="location"
              {...register("location")}
              className="mt-1"
              placeholder="np. ul. Główna 10, Warszawa"
            />
          </div>
        </div>
      )}

      {/* URL field for shopping / other */}
      {showUrl && (
        <div>
          <Label htmlFor="url">{t("url")}</Label>
          <Input
            id="url"
            type="url"
            {...register("url")}
            className="mt-1"
            placeholder="https://"
          />
        </div>
      )}

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

      {/* Reminders */}
      <div>
        <Label className="mb-2 block">{t("reminders")}</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("reminder_7d")}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">{t("reminder7d")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("reminder_2d")}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">{t("reminder2d")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("reminder_on_day")}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">{t("reminderOnDay")}</span>
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
