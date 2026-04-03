export interface CookieConsentCategories {
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentState {
  version: number;
  mode: "accepted_all" | "rejected_all" | "custom";
  categories: CookieConsentCategories;
  updatedAt: string;
}

const COOKIE_CONSENT_VERSION = 1;
const COOKIE_CONSENT_TTL_MS = 1000 * 60 * 60 * 24 * 180;
const STORAGE_PREFIX = "editoria_cookie_consent";
const COOKIE_PREFIX = "editoria_cookie_consent";

export function buildCookieConsentStorageKey(tenantSlug: string) {
  return `${STORAGE_PREFIX}:${tenantSlug}`;
}

export function buildCookieConsentCookieName(tenantSlug: string) {
  return `${COOKIE_PREFIX}_${tenantSlug.replace(/[^a-z0-9_-]/gi, "_")}`;
}

export function createRejectedConsentState(): CookieConsentState {
  return {
    version: COOKIE_CONSENT_VERSION,
    mode: "rejected_all",
    categories: {
      analytics: false,
      marketing: false,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createAcceptedConsentState(): CookieConsentState {
  return {
    version: COOKIE_CONSENT_VERSION,
    mode: "accepted_all",
    categories: {
      analytics: true,
      marketing: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createCustomConsentState(categories: CookieConsentCategories): CookieConsentState {
  return {
    version: COOKIE_CONSENT_VERSION,
    mode: "custom",
    categories: {
      analytics: Boolean(categories.analytics),
      marketing: Boolean(categories.marketing),
    },
    updatedAt: new Date().toISOString(),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function normalizeCookieConsentState(input: unknown): CookieConsentState | null {
  const record = asRecord(input);
  const categories = asRecord(record.categories);

  if (!record.updatedAt || typeof record.updatedAt !== "string") {
    return null;
  }

  const updatedAt = new Date(record.updatedAt).getTime();
  if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > COOKIE_CONSENT_TTL_MS) {
    return null;
  }

  return {
    version: typeof record.version === "number" ? record.version : COOKIE_CONSENT_VERSION,
    mode:
      record.mode === "accepted_all" || record.mode === "rejected_all" || record.mode === "custom"
        ? record.mode
        : "custom",
    categories: {
      analytics: Boolean(categories.analytics),
      marketing: Boolean(categories.marketing),
    },
    updatedAt: record.updatedAt,
  };
}

export function serializeCookieConsentState(consent: CookieConsentState) {
  return JSON.stringify(consent);
}

export function parseCookieConsentState(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  try {
    return normalizeCookieConsentState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setCookieConsentCookie(tenantSlug: string, consent: CookieConsentState) {
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${buildCookieConsentCookieName(tenantSlug)}=${encodeURIComponent(
    serializeCookieConsentState(consent)
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getCookieConsentFromCookie(tenantSlug: string) {
  const cookieName = `${buildCookieConsentCookieName(tenantSlug)}=`;
  const cookies = document.cookie.split(";").map((entry) => entry.trim());
  const match = cookies.find((entry) => entry.startsWith(cookieName));
  if (!match) {
    return null;
  }

  return parseCookieConsentState(decodeURIComponent(match.slice(cookieName.length)));
}

export function getCookieConsentFromStorage(tenantSlug: string) {
  try {
    return parseCookieConsentState(localStorage.getItem(buildCookieConsentStorageKey(tenantSlug)));
  } catch {
    return null;
  }
}

export function persistCookieConsent(tenantSlug: string, consent: CookieConsentState) {
  try {
    localStorage.setItem(buildCookieConsentStorageKey(tenantSlug), serializeCookieConsentState(consent));
  } catch {
    // localStorage can be unavailable in privacy mode.
  }

  setCookieConsentCookie(tenantSlug, consent);
}

export function resolveStoredCookieConsent(tenantSlug: string) {
  return getCookieConsentFromStorage(tenantSlug) || getCookieConsentFromCookie(tenantSlug);
}

export function consentAllowsAnalytics(consent: CookieConsentState | null) {
  return Boolean(consent?.categories.analytics);
}

export function consentAllowsMarketing(consent: CookieConsentState | null) {
  return Boolean(consent?.categories.marketing);
}
