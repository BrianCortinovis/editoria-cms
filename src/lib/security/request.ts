export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) {
    return true;
  }

  const allowlist = (process.env.PUBLIC_API_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowlist.includes(origin);
}

export function isBearerAuthenticatedRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ");
}

export function assertTrustedMutationRequest(request: Request) {
  if (isBearerAuthenticatedRequest(request) || isTrustedOrigin(request)) {
    return null;
  }

  return new Response(JSON.stringify({ error: "Untrusted origin" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
