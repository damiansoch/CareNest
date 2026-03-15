import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      setTokens: (access, refresh) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(ACCESS_TOKEN_KEY, access);
          localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
        }
        set({ isAuthenticated: true });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "carenest-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
