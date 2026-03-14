"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Shield, User, Mail, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FieldError, FormError } from "@/components/ui/error-message";
import { Spinner } from "@/components/ui/spinner";
import { useMembers, useInvitations, useInvite } from "@/hooks/useFamily";
import { useAuthStore } from "@/store/auth";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Controller } from "react-hook-form";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

export default function TeamPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  return (
    <AuthGuard locale={locale}>
      <AppShell locale={locale}>
        <TeamContent locale={locale} />
      </AppShell>
    </AuthGuard>
  );
}

function TeamContent({ locale }: { locale: string }) {
  const t = useTranslations("team");
  const { user: currentUser } = useAuthStore();
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: invitations } = useInvitations();
  const invite = useInvite();
  const dateLocale = locale === "pl" ? pl : enUS;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "member" },
  });

  async function onSubmit(data: InviteFormValues) {
    try {
      await invite.mutateAsync(data);
      reset();
    } catch {
      setError("root", { message: "Nie udało się wysłać zaproszenia." });
    }
  }

  const pendingInvitations = invitations?.filter((i) => i.status === "pending") ?? [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Current members */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Opiekunowie
        </h2>
        <div className="rounded-xl border divide-y">
          {membersLoading && (
            <div className="p-4"><Spinner /></div>
          )}
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {m.user.first_name[0]}{m.user.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {m.user.first_name} {m.user.last_name}
                  {m.user.id === currentUser?.id && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(Ty)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                {m.role === "admin" ? (
                  <><Shield size={10} className="mr-1" />{t("roleAdmin")}</>
                ) : (
                  <><User size={10} className="mr-1" />{t("roleMember")}</>
                )}
              </Badge>
            </div>
          ))}
          {!membersLoading && (!members || members.length === 0) && (
            <div className="p-4 text-sm text-muted-foreground">{t("noMembers")}</div>
          )}
        </div>
      </section>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("pendingInvitations")}
          </h2>
          <div className="rounded-xl border divide-y">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{inv.email}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} />
                    Wygasa: {format(new Date(inv.expires_at), "d MMM yyyy", { locale: dateLocale })}
                  </div>
                </div>
                <Badge variant="warning">Oczekujące</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={18} />
              {t("inviteMember")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="invite-email">{t("inviteEmail")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  {...register("email")}
                  error={!!errors.email}
                  className="mt-1"
                  placeholder="jan@example.com"
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div>
                <Label>{t("inviteRole")}</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">{t("roleMember")}</SelectItem>
                        <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <FormError message={errors.root?.message} />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="h-4 w-4" />}
                <UserPlus size={16} />
                {t("inviteMember")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
