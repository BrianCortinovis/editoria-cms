type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var __editoriaRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store = globalThis.__editoriaRateLimitStore ?? new Map<string, RateLimitEntry>();
globalThis.__editoriaRateLimitStore = store;

function now() {
  return Date.now();
}

async function checkRateLimitRemote(key: string, maxRequests: number, windowMs: number) {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!restUrl || !restToken) {
    return null;
  }

  const safeKey = encodeURIComponent(`ratelimit:${key}`);
  const headers = { Authorization: `Bearer ${restToken}` };
  const incrResponse = await fetch(`${restUrl}/incr/${safeKey}`, { method: "POST", headers, cache: "no-store" });
  if (!incrResponse.ok) {
    throw new Error(`Rate limit backend error: ${incrResponse.status}`);
  }

  const incrPayload = (await incrResponse.json()) as { result?: number | string };
  const count = Number(incrPayload.result || 0);
  const windowSeconds = Math.max(Math.ceil(windowMs / 1000), 1);

  if (count === 1) {
    await fetch(`${restUrl}/expire/${safeKey}/${windowSeconds}`, { method: "POST", headers, cache: "no-store" });
  }

  const ttlResponse = await fetch(`${restUrl}/ttl/${safeKey}`, { method: "GET", headers, cache: "no-store" });
  const ttlPayload = ttlResponse.ok ? ((await ttlResponse.json()) as { result?: number | string }) : { result: windowSeconds };
  const ttlSeconds = Math.max(Number(ttlPayload.result || windowSeconds), 1);

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(maxRequests - count, 0),
    retryAfterMs: ttlSeconds * 1000,
  };
}

export function getClientIp(request: Request) {
  const cfIp = request.headers.get('cf-connecting-ip') || '';
  const trueClientIp = request.headers.get('true-client-ip') || '';
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const realIp = request.headers.get('x-real-ip') || '';
  const candidate =
    cfIp.trim() ||
    trueClientIp.trim() ||
    forwardedFor.split(',')[0]?.trim() ||
    realIp.trim() ||
    'unknown';
  return candidate || 'unknown';
}

export async function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const remoteResult = await checkRateLimitRemote(key, maxRequests, windowMs).catch(() => null);
  if (remoteResult) {
    return remoteResult;
  }

  const current = now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= current) {
    const next = { count: 1, resetAt: current + windowMs };
    store.set(key, next);
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: windowMs };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(existing.resetAt - current, 1000),
    };
  }

  existing.count += 1;
  store.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(maxRequests - existing.count, 0),
    retryAfterMs: Math.max(existing.resetAt - current, 1000),
  };
}
