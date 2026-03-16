"use client";

import { useTranslations } from "next-intl";
import { format, isPast, isFuture } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { MapPin, User, Clock, Bell, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types";

interface AppointmentCardProps {
  appointment: Appointment;
  locale: string;
  onEdit: (appt: Appointment) => void;
  onDelete: (id: string) => void;
}

export function AppointmentCard({ appointment, locale, onEdit, onDelete }: AppointmentCardProps) {
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const dateLocale = locale === "pl" ? pl : enUS;

  const apptDate = new Date(appointment.datetime);
  const isUpcoming = isFuture(apptDate);
  const hasReminders = appointment.reminder_configs.some((r) => r.is_enabled);

  return (
    <Card className={isUpcoming ? "" : "opacity-70"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Date block */}
          <div className="flex-shrink-0 w-14 text-center rounded-lg bg-primary/10 p-2">
            <p className="text-xs text-primary font-medium">
              {format(apptDate, "MMM", { locale: dateLocale })}
            </p>
            <p className="text-2xl font-bold text-primary leading-none">
              {format(apptDate, "d")}
            </p>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{appointment.title}</h3>
              {!isUpcoming && (
                <Badge variant="secondary" className="text-xs">Przeszła</Badge>
              )}
              {isUpcoming && hasReminders && (
                <Bell size={12} className="text-primary" />
              )}
            </div>

            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={11} />
                {format(apptDate, "HH:mm", { locale: dateLocale })}
                {" — "}
                {format(apptDate, locale === "pl" ? "d MMMM yyyy" : "d MMMM yyyy", { locale: dateLocale })}
              </div>
              {appointment.doctor_name && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User size={11} />
                  {appointment.doctor_name}
                </div>
              )}
              {appointment.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={11} />
                  {appointment.location}
                </div>
              )}
            </div>

            {appointment.notes && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 italic">
                {appointment.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:h-7 md:w-7"
              onClick={() => onEdit(appointment)}
              title={tCommon("edit")}
            >
              <Pencil size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:h-7 md:w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(appointment.id)}
              title={tCommon("delete")}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
