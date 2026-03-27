#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEnvFile() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  return Object.fromEntries(
    envContent
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      })
  );
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || "Local Superadmin";

  if (!email || !password) {
    throw new Error("Uso: node scripts/ensure-test-superadmin.mjs <email> <password> [full_name]");
  }

  const env = readEnvFile();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const usersRes = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersRes.error) {
    throw usersRes.error;
  }

  let user = usersRes.data.users.find((item) => (item.email || "").toLowerCase() === email.toLowerCase());

  if (user) {
    const updateRes = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (updateRes.error) {
      throw updateRes.error;
    }
    user = updateRes.data.user;
  } else {
    const createRes = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createRes.error || !createRes.data.user) {
      throw createRes.error || new Error("User creation failed");
    }
    user = createRes.data.user;
  }

  const profileRes = await admin.from("profiles").upsert({
    id: user.id,
    email,
    full_name: fullName,
  });
  if (profileRes.error) {
    throw profileRes.error;
  }

  const tenantsRes = await admin.from("tenants").select("id, slug");
  if (tenantsRes.error) {
    throw tenantsRes.error;
  }

  for (const tenant of tenantsRes.data || []) {
    const membershipRes = await admin
      .from("user_tenants")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (membershipRes.error) {
      throw membershipRes.error;
    }

    if (membershipRes.data?.id) {
      const updateMembershipRes = await admin
        .from("user_tenants")
        .update({ role: "super_admin" })
        .eq("id", membershipRes.data.id);
      if (updateMembershipRes.error) {
        throw updateMembershipRes.error;
      }
    } else {
      const insertMembershipRes = await admin.from("user_tenants").insert({
        user_id: user.id,
        tenant_id: tenant.id,
        role: "super_admin",
      });
      if (insertMembershipRes.error) {
        throw insertMembershipRes.error;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: user.id,
        email,
        tenantsLinked: (tenantsRes.data || []).map((tenant) => tenant.slug),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
