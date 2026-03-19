import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that are part of the CMS app (not public site)
const CMS_ROUTES = ["/dashboard", "/auth", "/api"];

function isCmsRoute(pathname: string): boolean {
  return CMS_ROUTES.some((route) => pathname.startsWith(route)) || pathname === "/";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Public site routes (/site/[tenant]/...) — no auth required
  if (pathname.startsWith("/site/")) {
    // Extract tenant slug and inject as header for downstream use
    const segments = pathname.split("/");
    const tenantSlug = segments[2]; // /site/[tenantSlug]/...
    if (tenantSlug) {
      supabaseResponse.headers.set("x-tenant-slug", tenantSlug);
    }
    return supabaseResponse;
  }

  // CMS routes — handle auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (
    !user &&
    pathname.startsWith("/dashboard")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && pathname.startsWith("/auth/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
