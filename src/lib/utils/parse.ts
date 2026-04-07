/**
 * Safely parse JSON with fallback to original value.
 * Returns the parsed object/array if valid JSON, otherwise returns the original value.
 */
export function safeParse<T = unknown>(value: string): T | string {
  if (typeof value !== 'string') {
    return value as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    console.warn('Failed to parse JSON string', { value: value.slice(0, 100) });
    return value;
  }
}

/**
 * Safely parse JSON from AI responses that may be strings or already-parsed objects.
 * Common case: backend returns `{ result: "{...json...}" }` instead of `{ result: {...} }`
 */
export function parseAIResponse<T = unknown>(data: unknown): T | string {
  if (typeof data === 'string') {
    return safeParse<T>(data);
  }
  return data as T;
}
