import type { SupabaseClient } from "@supabase/supabase-js";

export type PlacementDisplayMode = "duplicate" | "exclusive";

interface PlacementAssignmentRow {
  article_id: string;
  slot_id: string;
  display_mode?: string | null;
  expires_at?: string | null;
  assigned_at?: string | null;
}

export function normalizePlacementDisplayMode(value: unknown): PlacementDisplayMode {
  return value === "exclusive" ? "exclusive" : "duplicate";
}

export function isPlacementActive(expiresAt?: string | null, now = new Date()) {
  if (!expiresAt) {
    return true;
  }

  const expiresAtTimestamp = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresAtTimestamp)) {
    return true;
  }

  return expiresAtTimestamp > now.getTime();
}

export function buildPlacementExpiry(durationHours?: number | null, assignedAt = new Date()) {
  if (!durationHours || durationHours <= 0) {
    return null;
  }

  return new Date(assignedAt.getTime() + durationHours * 60 * 60 * 1000).toISOString();
}

export async function listActivePlacementAssignmentsForTenant(
  supabase: Pick<SupabaseClient, "from">,
  tenantId: string
) {
  const { data, error } = await supabase
    .from("slot_assignments")
    .select("article_id, slot_id, display_mode, expires_at, assigned_at")
    .eq("tenant_id", tenantId);

  if (error) {
    console.warn("Unable to load slot assignments for editorial placements:", error);
    return [] as Array<PlacementAssignmentRow & { display_mode: PlacementDisplayMode }>;
  }

  return (data || [])
    .filter((assignment) => isPlacementActive(assignment.expires_at))
    .map((assignment) => ({
      ...assignment,
      display_mode: normalizePlacementDisplayMode(assignment.display_mode),
    }));
}

export async function getActiveExclusivePlacementArticleIds(
  supabase: Pick<SupabaseClient, "from">,
  tenantId: string
) {
  const assignments = await listActivePlacementAssignmentsForTenant(supabase, tenantId);

  return [...new Set(
    assignments
      .filter((assignment) => assignment.display_mode === "exclusive")
      .map((assignment) => assignment.article_id)
  )];
}
