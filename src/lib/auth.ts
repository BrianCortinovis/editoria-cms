import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  return user;
}

export async function getUserTenants(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("user_tenants")
    .select("role, tenants(*)")
    .eq("user_id", userId);

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    ...item.tenants,
    role: item.role as UserRole,
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
  return ["super_admin", "chief_editor", "editor"].includes(role);
}

export function canApproveArticles(role: UserRole): boolean {
  return ["super_admin", "chief_editor"].includes(role);
}

export function canPublishArticles(role: UserRole): boolean {
  return ["super_admin", "chief_editor"].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return role === "super_admin";
}

export function canManageBanners(role: UserRole): boolean {
  return ["super_admin", "chief_editor", "advertiser"].includes(role);
}

export function canDeleteContent(role: UserRole): boolean {
  return role === "super_admin";
}
