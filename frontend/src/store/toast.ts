import { create } from "zustand";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  open: boolean;
}

interface ToastStore {
  toasts: ToastItem[];
  toast: (opts: Omit<ToastItem, "id" | "open">) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  toast: (opts) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...opts, id, open: true }] }));
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.map((t) => (t.id === id ? { ...t, open: false } : t)),
      }));
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 300);
    }, 4000);
  },

  dismiss: (id) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, open: false } : t)),
    })),
}));

export const toast = (opts: Omit<ToastItem, "id" | "open">) =>
  useToastStore.getState().toast(opts);
