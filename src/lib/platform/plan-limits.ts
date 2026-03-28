export const PLAN_SITE_LIMITS: Record<string, number> = {
  free: 1,
  base: 2,
  medium: 3,
  enterprise: 5,
};

export function getMaxSitesForPlan(planCode: string | null | undefined): number {
  return PLAN_SITE_LIMITS[planCode || "free"] ?? PLAN_SITE_LIMITS.free;
}

export interface SiteCreationCheck {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  planCode: string;
}

export async function checkSiteCreationLimit(
  supabase: Pick<import("@supabase/supabase-js").SupabaseClient, "from">,
  userId: string
): Promise<SiteCreationCheck> {
  // Get all sites where this user is owner
  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("site_id, role")
    .eq("user_id", userId)
    .eq("role", "owner")
    .is("revoked_at", null);

  const ownedSiteIds = (memberships || []).map((m: Record<string, unknown>) => m.site_id as string);
  const currentCount = ownedSiteIds.length;

  // Get the best plan the user has across all their owned sites
  let bestPlan = "free";
  if (ownedSiteIds.length > 0) {
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("plan_code, status")
      .in("site_id", ownedSiteIds)
      .eq("status", "active");

    const planPriority = ["free", "base", "medium", "enterprise"];
    for (const sub of subscriptions || []) {
      if (planPriority.indexOf(sub.plan_code) > planPriority.indexOf(bestPlan)) {
        bestPlan = sub.plan_code;
      }
    }
  }

  const maxAllowed = getMaxSitesForPlan(bestPlan);

  return {
    allowed: currentCount < maxAllowed,
    currentCount,
    maxAllowed,
    planCode: bestPlan,
  };
}
