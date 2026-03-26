"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/types/database";

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

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { setUser, setProfile, setTenants, setCurrentTenant } = useAuthStore();

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = userTenants.map((ut: any) => ({
          ...sanitizeTenantForClient(ut.tenants || {}),
          role: ut.role as UserRole,
        }));

        setTenants(mapped as unknown as ReturnType<typeof useAuthStore.getState>["tenants"]);

        // Restore last tenant or use first
        const savedTenantId = localStorage.getItem("editoria_current_tenant");
        const saved = mapped.find((t: { id: string }) => t.id === savedTenantId);
        const selected = saved || mapped[0];
        setCurrentTenant(
          selected as unknown as ReturnType<typeof useAuthStore.getState>["currentTenant"],
          selected.role
        );
      }

      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          useAuthStore.getState().reset();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setTenants, setCurrentTenant]);

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
