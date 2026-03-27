import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { CmsBridgeClaims } from "@/lib/platform/types";

interface SignedCmsBridgeClaims extends CmsBridgeClaims {
  exp: number;
  nonce: string;
}

function encodePayload(payload: SignedCmsBridgeClaims): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): SignedCmsBridgeClaims {
  const json = Buffer.from(encoded, "base64url").toString("utf8");
  return JSON.parse(json) as SignedCmsBridgeClaims;
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function signCmsBridgeToken(
  claims: CmsBridgeClaims,
  secret: string,
  ttlSeconds = 60,
): string {
  const payload: SignedCmsBridgeClaims = {
    ...claims,
    nonce: claims.nonce ?? randomUUID(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyCmsBridgeToken(
  token: string,
  secret: string,
): SignedCmsBridgeClaims {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Invalid CMS bridge token");
  }

  const expected = signPayload(encodedPayload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  const isValid =
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);

  if (!isValid) {
    throw new Error("Invalid CMS bridge token signature");
  }

  const payload = decodePayload(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error("Expired CMS bridge token");
  }

  return payload;
}
