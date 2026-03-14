"use client";

import * as Toast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToastStore } from "@/store/toast";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          open={t.open}
          onOpenChange={(open) => !open && dismiss(t.id)}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-card p-4 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out data-[state=open]:fade-in",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            t.variant === "destructive" && "border-destructive/50 bg-destructive/5"
          )}
        >
          <div className="flex-1 min-w-0">
            {t.title && (
              <Toast.Title className="text-sm font-semibold">{t.title}</Toast.Title>
            )}
            {t.description && (
              <Toast.Description className="text-sm text-muted-foreground mt-1">
                {t.description}
              </Toast.Description>
            )}
          </div>
          <Toast.Close
            onClick={() => dismiss(t.id)}
            className="flex-shrink-0 rounded opacity-70 hover:opacity-100"
          >
            <X size={14} />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm" />
    </Toast.Provider>
  );
}
