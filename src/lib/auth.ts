import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Tables, UserRole } from "@/types/database";
import { normalizeCmsRole } from "@/lib/cms/roles";

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function getUserTenants(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("user_tenants")
    .select("role, tenants(*)")
    .eq("user_id", userId);

  if (!data) return [];

  return data.map((item) => ({
    ...(item.tenants as unknown as Tables<"tenants">),
    role: (normalizeCmsRole(item.role) ?? "contributor") as UserRole,
  }));
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export function canManageArticles(role: UserRole): boolean {
  return ["admin", "chief_editor", "editor"].includes(normalizeCmsRole(role) ?? role);
}

export function canApproveArticles(role: UserRole): boolean {
  return ["admin", "chief_editor"].includes(normalizeCmsRole(role) ?? role);
}

export function canPublishArticles(role: UserRole): boolean {
  return ["admin", "chief_editor"].includes(normalizeCmsRole(role) ?? role);
}

export function canManageUsers(role: UserRole): boolean {
  return (normalizeCmsRole(role) ?? role) === "admin";
}

export function canManageBanners(role: UserRole): boolean {
  return ["admin", "chief_editor", "advertiser"].includes(normalizeCmsRole(role) ?? role);
}

export function canDeleteContent(role: UserRole): boolean {
  return (normalizeCmsRole(role) ?? role) === "admin";
}
