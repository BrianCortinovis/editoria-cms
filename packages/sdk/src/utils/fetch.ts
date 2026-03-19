// Ultra-light fetch wrapper — zero dependencies
import type { EditoriaConfig } from '../types';

export class FetchError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'FetchError';
  }
}

// Simple in-memory LRU cache
const cache = new Map<string, { data: unknown; expires: number }>();
const MAX_CACHE = 200;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown, ttl: number) {
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, { data, expires: Date.now() + ttl * 1000 });
}

export async function apiFetch<T>(
  config: EditoriaConfig,
  path: string,
  params: Record<string, string> = {},
  options?: { method?: string; body?: unknown; noCache?: boolean }
): Promise<T> {
  const url = new URL(`${config.baseUrl}${path}`);
  url.searchParams.set('tenant', config.tenant);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, v);
  }

  const cacheKey = url.toString();
  const ttl = config.cache?.ttl ?? 60;

  // Check cache for GET requests
  if (!options?.method && !options?.noCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached as T;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(url.toString(), {
    method: options?.method || 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new FetchError(res.status, err.error || res.statusText);
  }

  const data = await res.json();

  // Cache GET responses
  if (!options?.method && ttl > 0) {
    setCache(cacheKey, data, ttl);
  }

  return data as T;
}
