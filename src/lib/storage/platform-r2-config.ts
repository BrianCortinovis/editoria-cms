import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret, encryptSecret } from "@/lib/security/secrets";

export const PLATFORM_R2_AUDIT_ACTION = "platform.r2.config";

export interface PlatformR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function normalizePlatformR2Config(input: unknown): PlatformR2Config {
  const record = asRecord(input);
  const encryptedSecret = typeof record.secretAccessKeyEncrypted === "string" ? record.secretAccessKeyEncrypted : "";
  const rawSecret = typeof record.secretAccessKey === "string" ? record.secretAccessKey : "";

  return {
    accountId: typeof record.accountId === "string" ? record.accountId : "",
    accessKeyId: typeof record.accessKeyId === "string" ? record.accessKeyId : "",
    secretAccessKey: encryptedSecret ? decryptSecret(encryptedSecret) : rawSecret,
    bucketName: typeof record.bucketName === "string" ? record.bucketName : "",
    publicUrl: typeof record.publicUrl === "string" ? record.publicUrl : "",
  };
}

export function serializePlatformR2Config(config: PlatformR2Config) {
  return {
    accountId: config.accountId,
    accessKeyId: config.accessKeyId,
    secretAccessKeyEncrypted: config.secretAccessKey ? encryptSecret(config.secretAccessKey) : "",
    bucketName: config.bucketName,
    publicUrl: config.publicUrl,
  };
}

export async function readLatestPlatformR2Config(client: SupabaseClient): Promise<PlatformR2Config | null> {
  const { data } = await client
    .from("audit_logs")
    .select("metadata")
    .eq("action", PLATFORM_R2_AUDIT_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.metadata) {
    return null;
  }

  const config = normalizePlatformR2Config(data.metadata);
  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    return null;
  }

  return config;
}
