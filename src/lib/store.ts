import { create } from "zustand";
import type { Tables, UserRole } from "@/types/database";

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Tables<"profiles"> | null;
  currentTenant: Tables<"tenants"> | null;
  currentRole: UserRole | null;
  tenants: (Tables<"tenants"> & { role: UserRole })[];
  setUser: (user: AuthState["user"]) => void;
  setProfile: (profile: Tables<"profiles"> | null) => void;
  setCurrentTenant: (tenant: Tables<"tenants"> | null, role: UserRole | null) => void;
  setTenants: (tenants: AuthState["tenants"]) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  currentTenant: null,
  currentRole: null,
  tenants: [],
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCurrentTenant: (currentTenant, currentRole) => set({ currentTenant, currentRole }),
  setTenants: (tenants) => set({ tenants }),
  reset: () =>
    set({
      user: null,
      profile: null,
      currentTenant: null,
      currentRole: null,
      tenants: [],
    }),
}));
