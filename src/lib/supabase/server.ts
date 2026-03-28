import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Service role clients — shared (singleton) + dedicated (cached per tenant)
// ---------------------------------------------------------------------------

let _serviceRoleClient: SupabaseClient | null = null;

/** Shared platform service role client (singleton per process). */
export async function createServiceRoleClient(): Promise<SupabaseClient> {
  if (_serviceRoleClient) return _serviceRoleClient;

  const { createClient } = await import("@supabase/supabase-js");
  _serviceRoleClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return _serviceRoleClient;
}

// Cache: dedicated clients keyed by tenant ID, with 5-minute TTL.
const _dedicatedClients = new Map<string, { client: SupabaseClient; expiresAt: number }>();

interface DedicatedDbConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

/**
 * Returns a service role client for the given tenant.
 * - For shared tenants: returns the platform singleton.
 * - For dedicated tenants (enterprise): creates a client connected to their
 *   own Supabase instance (VPS) using credentials from site_infrastructure.
 *
 * Falls back to the shared client if no dedicated config is found.
 */
export async function createServiceRoleClientForTenant(
  tenantId: string
): Promise<SupabaseClient> {
  // Check in-memory cache first
  const cached = _dedicatedClients.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.client;
  }

  // Lookup infrastructure config from the shared platform DB
  const platformClient = await createServiceRoleClient();
  const { data: infra } = await platformClient
    .from("site_infrastructure")
    .select("stack_kind, supabase_url, supabase_service_role_key")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // Shared tenant or no infra row → use platform client
  if (
    !infra ||
    infra.stack_kind !== "dedicated" ||
    !infra.supabase_url ||
    !infra.supabase_service_role_key
  ) {
    return platformClient;
  }

  // Build dedicated client
  const { createClient } = await import("@supabase/supabase-js");
  const dedicatedClient = createClient(infra.supabase_url, infra.supabase_service_role_key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Cache for 5 minutes
  _dedicatedClients.set(tenantId, {
    client: dedicatedClient,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return dedicatedClient;
}

/**
 * Resolve the dedicated DB config for a tenant (if any).
 * Useful when you need the raw URL/key without a client instance.
 */
export async function getDedicatedDbConfig(
  tenantId: string
): Promise<DedicatedDbConfig | null> {
  const platformClient = await createServiceRoleClient();
  const { data: infra } = await platformClient
    .from("site_infrastructure")
    .select("stack_kind, supabase_url, supabase_service_role_key")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (
    !infra ||
    infra.stack_kind !== "dedicated" ||
    !infra.supabase_url ||
    !infra.supabase_service_role_key
  ) {
    return null;
  }

  return {
    supabaseUrl: infra.supabase_url,
    serviceRoleKey: infra.supabase_service_role_key,
  };
}
