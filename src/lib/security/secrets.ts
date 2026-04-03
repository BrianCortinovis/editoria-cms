import crypto from "node:crypto";

const ENCRYPTION_PREFIX = "enc:v1:";

function getSecretEncryptionKey() {
  const material = process.env.PLATFORM_SECRET_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!material) {
    return null;
  }

  return crypto.createHash("sha256").update(material).digest();
}

export function encryptSecret(value: string) {
  if (!value) {
    return "";
  }

  const key = getSecretEncryptionKey();
  if (!key) {
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string) {
  if (!value) {
    return "";
  }

  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const key = getSecretEncryptionKey();
  if (!key) {
    return "";
  }

  const payload = value.slice(ENCRYPTION_PREFIX.length);
  const [ivBase64, authTagBase64, encryptedBase64] = payload.split(":");
  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    return "";
  }

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivBase64, "base64"));
    decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}
