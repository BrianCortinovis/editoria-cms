export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getPlatformBaseDomain(): string {
  return (process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN || "localhost")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

export function buildDefaultHostname(subdomain: string): string {
  return `${subdomain}.${getPlatformBaseDomain()}`;
}

export function getDomainProviderMode(): "vercel" | "vps" {
  return process.env.PLATFORM_DOMAIN_PROVIDER === "vercel" ? "vercel" : "vps";
}

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "support",
  "status",
  "mail",
]);
