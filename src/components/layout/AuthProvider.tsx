"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/types/database";
import type { InitialAuthPayload } from "@/lib/auth-bootstrap";
import { normalizeCmsRole } from "@/lib/cms/roles";

function sanitizeTenantForClient(tenant: Record<string, unknown>) {
  const rawSettings =
    tenant.settings && typeof tenant.settings === "object"
      ? (tenant.settings as Record<string, unknown>)
      : {};
  const activeModules = Array.isArray(rawSettings.active_modules)
    ? rawSettings.active_modules.filter((value): value is string => typeof value === "string")
    : [];

  return {
    id: String(tenant.id ?? ""),
    name: String(tenant.name ?? ""),
    slug: String(tenant.slug ?? ""),
    domain: typeof tenant.domain === "string" ? tenant.domain : null,
    logo_url: typeof tenant.logo_url === "string" ? tenant.logo_url : null,
    theme_config:
      tenant.theme_config && typeof tenant.theme_config === "object"
        ? (tenant.theme_config as Record<string, unknown>)
        : {},
    settings: {
      active_modules: activeModules,
    },
    created_at: String(tenant.created_at ?? ""),
    updated_at: String(tenant.updated_at ?? ""),
  };
}

function resolvePreferredTenantId(tenantIds: string[]) {
  if (typeof window === "undefined" || tenantIds.length === 0) {
    return null;
  }

  const queryTenantId = new URLSearchParams(window.location.search).get("tenant");
  if (queryTenantId && tenantIds.includes(queryTenantId)) {
    return queryTenantId;
  }

  const savedTenantId = localStorage.getItem("editoria_current_tenant");
  if (savedTenantId && tenantIds.includes(savedTenantId)) {
    return savedTenantId;
  }

  return null;
}

type AuthProviderProps = {
  children: React.ReactNode;
  initialAuth?: InitialAuthPayload;
};

export default function AuthProvider({ children, initialAuth }: AuthProviderProps) {
  const {
    user,
    setUser,
    setProfile,
    setTenants,
    setCurrentTenant,
  } = useAuthStore();
  const hasInitialBootstrap = Boolean(initialAuth?.user);
  const [loading, setLoading] = useState(() => !hasInitialBootstrap && !user);

  useLayoutEffect(() => {
    if (!initialAuth) {
      return;
    }

    const preferredTenantId = resolvePreferredTenantId(initialAuth.tenants.map((tenant) => tenant.id));
    const selectedTenant =
      initialAuth.tenants.find((tenant) => tenant.id === preferredTenantId) ?? initialAuth.tenants[0] ?? null;

    setUser(initialAuth.user);
    setProfile(initialAuth.profile);
    setTenants(initialAuth.tenants);

    if (selectedTenant) {
      localStorage.setItem("editoria_current_tenant", selectedTenant.id);
      setCurrentTenant(selectedTenant, selectedTenant.role);
    } else {
      setCurrentTenant(null, null);
    }

  }, [initialAuth, setCurrentTenant, setProfile, setTenants, setUser]);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUser({ id: user.id, email: user.email ?? "" });

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) setProfile(profile);

      // Fetch tenants with roles
      const { data: userTenants } = await supabase
        .from("user_tenants")
        .select("role, tenants(id, name, slug, domain, logo_url, theme_config, settings, created_at, updated_at)")
        .eq("user_id", user.id);

      if (userTenants && userTenants.length > 0) {
        const mapped = userTenants.map((ut) => ({
          ...sanitizeTenantForClient((ut.tenants ?? {}) as unknown as Record<string, unknown>),
          role: (normalizeCmsRole(ut.role) ?? "contributor") as UserRole,
        }));

        setTenants(mapped as unknown as ReturnType<typeof useAuthStore.getState>["tenants"]);

        // Restore tenant from query string first, then local storage, then first available.
        const preferredTenantId = resolvePreferredTenantId(mapped.map((tenant: { id: string }) => tenant.id));
        const saved = mapped.find((t: { id: string }) => t.id === preferredTenantId);
        const selected = saved || mapped[0];
        localStorage.setItem("editoria_current_tenant", selected.id);
        setCurrentTenant(
          selected as unknown as ReturnType<typeof useAuthStore.getState>["currentTenant"],
          selected.role
        );
      } else {
        setTenants([]);
        setCurrentTenant(null, null);
      }

      setLoading(false);
    }

    void init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          useAuthStore.getState().reset();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setCurrentTenant, setProfile, setTenants, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg-0)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--c-accent)] mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Caricamento redazione...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
