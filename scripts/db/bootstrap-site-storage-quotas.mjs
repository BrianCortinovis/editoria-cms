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
      }),
  );
}

function gb(value) {
  return Math.round(value * 1024 * 1024 * 1024);
}

async function main() {
  const env = readEnvFile();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: sites, error: sitesError } = await admin
    .from("sites")
    .select("id, tenant_id, status")
    .is("deleted_at", null);
  if (sitesError) throw sitesError;

  const { data: infrastructure, error: infraError } = await admin
    .from("site_infrastructure")
    .select("site_id, stack_kind, deploy_target_kind");
  if (infraError) throw infraError;

  const infraBySiteId = new Map((infrastructure || []).map((row) => [row.site_id, row]));
  const results = [];

  for (const site of sites || []) {
    const infra = infraBySiteId.get(site.id);
    const isEnterpriseVps = infra?.deploy_target_kind === "customer_vps";
    const isDedicated = infra?.stack_kind === "dedicated";

    const payload = {
      site_id: site.id,
      tenant_id: site.tenant_id,
      media_provider: "supabase",
      published_media_provider: isEnterpriseVps ? "customer_vps_local" : "cloudflare_r2",
      soft_limit_bytes: isEnterpriseVps || isDedicated ? gb(20) : gb(1),
      hard_limit_bytes: isEnterpriseVps || isDedicated ? gb(30) : gb(1.5),
      monthly_egress_limit_bytes: isEnterpriseVps || isDedicated ? gb(500) : gb(100),
      upload_blocked: false,
      publish_blocked: false,
      config: {
        source: "bootstrap-site-storage-quotas",
        profile: isEnterpriseVps || isDedicated ? "enterprise" : "standard",
      },
    };

    const { error } = await admin.from("site_storage_quotas").upsert(payload, { onConflict: "site_id" });
    if (error) throw error;

    results.push({
      siteId: site.id,
      tenantId: site.tenant_id,
      publishedProvider: payload.published_media_provider,
      hardLimitGb: payload.hard_limit_bytes / 1024 / 1024 / 1024,
    });
  }

  console.log(JSON.stringify({ ok: true, count: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
