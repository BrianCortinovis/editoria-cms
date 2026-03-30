import fs from "node:fs";
import { triggerPublish } from "../src/lib/publish/runner";
import { createServiceRoleClient } from "../src/lib/supabase/server";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const localEnv = loadEnvFile(".env.local");
for (const [key, value] of Object.entries(localEnv)) {
  if (!(key in process.env)) {
    process.env[key] = String(value);
  }
}

async function main() {
  const tenantSlug = process.argv[2] || "valbrembana";
  const supabase = await createServiceRoleClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, slug")
    .eq("slug", tenantSlug)
    .single();

  if (error || !tenant) {
    throw error || new Error(`Tenant ${tenantSlug} not found`);
  }

  const manifest = await triggerPublish(tenant.id, [{ type: "full_rebuild" }], null);
  console.log(JSON.stringify({ tenant: tenant.slug, manifest }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
