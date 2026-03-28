function getAllowlistedOrigins() {
  return (process.env.PUBLIC_API_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function areEquivalentLocalOrigins(origin: string, requestOrigin: string) {
  try {
    const left = new URL(origin);
    const right = new URL(requestOrigin);

    return (
      left.protocol === right.protocol &&
      left.port === right.port &&
      isLoopbackHost(left.hostname) &&
      isLoopbackHost(right.hostname)
    );
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin: string, requestOrigin: string) {
  if (origin === requestOrigin || areEquivalentLocalOrigins(origin, requestOrigin)) {
    return true;
  }

  return getAllowlistedOrigins().some((allowedOrigin) =>
    allowedOrigin === origin || areEquivalentLocalOrigins(allowedOrigin, origin)
  );
}

export function isTrustedOrigin(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(request.url);
    if (url.protocol !== 'https:') {
      return false;
    }
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestOrigin = new URL(request.url).origin;

  if (!origin) {
    if (!referer) {
      return false;
    }

    try {
      return isAllowedOrigin(new URL(referer).origin, requestOrigin);
    } catch {
      return false;
    }
  }

  return isAllowedOrigin(origin, requestOrigin);
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
