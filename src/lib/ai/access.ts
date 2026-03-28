import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Check if AI is enabled for a specific user (platform-level toggle).
 * Controlled by superadmin via profiles.ai_enabled field.
 * Returns true by default if the field doesn't exist yet.
 */
export async function isAiEnabledForUser(userId: string): Promise<boolean> {
  try {
    const supabase = await createServiceRoleClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_enabled")
      .eq("id", userId)
      .maybeSingle();

    // Default to true if column doesn't exist or profile not found
    if (!profile) return true;
    return profile.ai_enabled !== false;
  } catch {
    // If column doesn't exist yet, allow AI
    return true;
  }
}
