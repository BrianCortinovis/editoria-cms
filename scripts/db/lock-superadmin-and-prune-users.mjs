#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APPLY = process.argv.includes("--apply");

const SUPERADMIN_EMAIL = "briansnow86@gmail.com";
const SUPERADMIN_PASSWORD = "12345678";
const SUPERADMIN_NAME = "Brian Snow";
const VALBREMBANA_MANAGER_EMAIL = "briancortinovis@gmail.com";

function readEnvFile() {
  const envPath = path.join(__dirname, "..", "..", ".env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");

  return Object.fromEntries(
    envContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      }),
  );
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesValbrembanaSite(site) {
  const haystack = [
    site?.slug,
    site?.default_subdomain,
    site?.name,
  ]
    .map(normalize)
    .join(" ");

  return (
    haystack.includes("valbrembana-web") ||
    haystack.includes("valbrembanaweb") ||
    haystack.includes("val brembana web")
  );
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;

  while (true) {
    const response = await admin.auth.admin.listUsers({ page, perPage: 500 });
    if (response.error) {
      throw response.error;
    }

    const batch = response.data.users || [];
    users.push(...batch);

    if (batch.length < 500) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureSuperadminUser(admin, users) {
  let user = users.find((item) => normalize(item.email) === SUPERADMIN_EMAIL);

  if (user) {
    const result = await admin.auth.admin.updateUserById(user.id, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: SUPERADMIN_NAME,
      },
    });

    if (result.error || !result.data.user) {
      throw result.error || new Error("Unable to update superadmin user");
    }

    user = result.data.user;
  } else {
    const result = await admin.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: SUPERADMIN_NAME,
      },
    });

    if (result.error || !result.data.user) {
      throw result.error || new Error("Unable to create superadmin user");
    }

    user = result.data.user;
  }

  const profilePayload = {
    id: user.id,
    email: SUPERADMIN_EMAIL,
    full_name: SUPERADMIN_NAME,
    first_name: "Brian",
    last_name: "Snow",
    is_platform_superadmin: true,
    deleted_at: null,
  };

  const { error: profileError } = await admin.from("profiles").upsert(profilePayload);
  if (profileError) {
    throw profileError;
  }

  return user;
}

async function findValbrembanaSite(admin) {
  const { data: sites, error } = await admin
    .from("sites")
    .select("id, tenant_id, owner_user_id, slug, default_subdomain, name")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (sites || []).find(matchesValbrembanaSite) || null;
}

async function ensureValbrembanaManager(admin, site, managerUserId) {
  if (!site || !managerUserId) {
    return;
  }

  const { data: legacyMembership } = await admin
    .from("user_tenants")
    .select("id, role")
    .eq("tenant_id", site.tenant_id)
    .eq("user_id", managerUserId)
    .maybeSingle();

  if (legacyMembership?.id) {
    await admin.from("user_tenants").update({ role: "admin" }).eq("id", legacyMembership.id);
  } else {
    await admin.from("user_tenants").insert({
      tenant_id: site.tenant_id,
      user_id: managerUserId,
      role: "admin",
    });
  }

  const { data: platformMembership } = await admin
    .from("tenant_memberships")
    .select("id, revoked_at, role")
    .eq("site_id", site.id)
    .eq("user_id", managerUserId)
    .maybeSingle();

  if (platformMembership?.id) {
    await admin
      .from("tenant_memberships")
      .update({
        role: platformMembership.role === "owner" ? "owner" : "admin",
        revoked_at: null,
        joined_at: platformMembership.revoked_at ? new Date().toISOString() : undefined,
      })
      .eq("id", platformMembership.id);
  } else {
    await admin.from("tenant_memberships").insert({
      tenant_id: site.tenant_id,
      site_id: site.id,
      user_id: managerUserId,
      role: "owner",
      joined_at: new Date().toISOString(),
    });
  }
}

async function main() {
  const env = readEnvFile();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const users = await listAllUsers(admin);
  const superadminUser = await ensureSuperadminUser(admin, users);
  const site = await findValbrembanaSite(admin);

  if (!site) {
    throw new Error("Sito Val Brembana Web non trovato");
  }

  const managerUser = users.find((item) => normalize(item.email) === VALBREMBANA_MANAGER_EMAIL) || null;
  if (!managerUser) {
    throw new Error(`Utente manager non trovato: ${VALBREMBANA_MANAGER_EMAIL}`);
  }

  await ensureValbrembanaManager(admin, site, managerUser?.id || null);

  const [{ data: tenantMemberships }, { data: legacyMemberships }, { data: profiles }] = await Promise.all([
    admin
      .from("tenant_memberships")
      .select("user_id, role, revoked_at")
      .eq("site_id", site.id)
      .is("revoked_at", null),
    admin
      .from("user_tenants")
      .select("user_id, role")
      .eq("tenant_id", site.tenant_id),
    admin
      .from("profiles")
      .select("id, email, full_name, is_platform_superadmin, deleted_at"),
  ]);

  const keepUserIds = new Set([superadminUser.id]);
  for (const membership of tenantMemberships || []) {
    keepUserIds.add(membership.user_id);
  }
  for (const membership of legacyMemberships || []) {
    keepUserIds.add(membership.user_id);
  }
  if (managerUser?.id) {
    keepUserIds.add(managerUser.id);
  }

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const keepUsers = [...keepUserIds].map((id) => profileById.get(id) || { id, email: null, full_name: null });
  const deleteCandidates = users.filter((user) => !keepUserIds.has(user.id));

  const summary = {
    mode: APPLY ? "apply" : "dry-run",
    superadmin: {
      id: superadminUser.id,
      email: superadminUser.email,
    },
    valbrembanaSite: {
      id: site.id,
      tenantId: site.tenant_id,
      name: site.name,
      slug: site.slug,
    },
    keepUsers: keepUsers.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
    })),
    deleteCandidates: deleteCandidates.map((user) => ({
      id: user.id,
      email: user.email,
    })),
  };

  if (!APPLY) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const timestamp = new Date().toISOString();

  await admin
    .from("profiles")
    .update({ is_platform_superadmin: false })
    .neq("id", superadminUser.id);

  await admin
    .from("profiles")
    .update({ is_platform_superadmin: true, deleted_at: null })
    .eq("id", superadminUser.id);

  await admin
    .from("tenant_memberships")
    .update({ revoked_at: timestamp })
    .eq("user_id", superadminUser.id)
    .is("revoked_at", null);

  await admin
    .from("user_tenants")
    .delete()
    .eq("user_id", superadminUser.id);

  const deleteIds = deleteCandidates.map((user) => user.id);

  if (deleteIds.length > 0) {
    await admin
      .from("sites")
      .update({ owner_user_id: superadminUser.id })
      .in("owner_user_id", deleteIds);

    await admin
      .from("tenant_memberships")
      .update({ revoked_at: timestamp })
      .in("user_id", deleteIds)
      .is("revoked_at", null);

    await admin
      .from("user_tenants")
      .delete()
      .in("user_id", deleteIds);

    await admin
      .from("profiles")
      .update({
        deleted_at: timestamp,
        is_platform_superadmin: false,
      })
      .in("id", deleteIds);
  }

  const deletionResults = [];
  for (const user of deleteCandidates) {
    const result = await admin.auth.admin.deleteUser(user.id, true);
    deletionResults.push({
      id: user.id,
      email: user.email,
      ok: !result.error,
      error: result.error?.message || null,
    });
  }

  console.log(
    JSON.stringify(
      {
        ...summary,
        appliedAt: timestamp,
        deletionResults,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
