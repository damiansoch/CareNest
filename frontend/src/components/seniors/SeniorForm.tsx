"use client";

import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FieldError, FormError } from "@/components/ui/error-message";
import { Spinner } from "@/components/ui/spinner";
import type { Senior } from "@/types";

const seniorSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().optional(),
  preferred_language: z.enum(["pl", "en"]),
  notes: z.string().optional(),
});

type SeniorFormValues = z.infer<typeof seniorSchema>;

interface SeniorFormProps {
  defaultValues?: Partial<Senior>;
  onSubmit: (data: SeniorFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function SeniorForm({ defaultValues, onSubmit, onCancel }: SeniorFormProps) {
  const t = useTranslations("seniors");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SeniorFormValues>({
    resolver: zodResolver(seniorSchema),
    defaultValues: {
      first_name: defaultValues?.first_name ?? "",
      last_name: defaultValues?.last_name ?? "",
      date_of_birth: defaultValues?.date_of_birth ?? "",
      preferred_language: defaultValues?.preferred_language ?? "pl",
      notes: defaultValues?.notes ?? "",
    },
  });

  async function handleFormSubmit(data: SeniorFormValues) {
    try {
      await onSubmit(data);
    } catch {
      setError("root", { message: "Wystąpił błąd. Spróbuj ponownie." });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">{t("firstName")} *</Label>
          <Input
            id="first_name"
            {...register("first_name")}
            error={!!errors.first_name}
            className="mt-1"
          />
          <FieldError message={errors.first_name?.message} />
        </div>
        <div>
          <Label htmlFor="last_name">{t("lastName")} *</Label>
          <Input
            id="last_name"
            {...register("last_name")}
            error={!!errors.last_name}
            className="mt-1"
          />
          <FieldError message={errors.last_name?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="date_of_birth">{t("dateOfBirth")}</Label>
        <Input
          id="date_of_birth"
          type="date"
          {...register("date_of_birth")}
          className="mt-1"
        />
      </div>

      <div>
        <Label>{t("preferredLanguage")}</Label>
        <Controller
          control={control}
          name="preferred_language"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">Polski</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <Label htmlFor="notes">{t("notes")}</Label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={3}
          className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
