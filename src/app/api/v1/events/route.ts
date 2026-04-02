import { NextResponse } from "next/server";
import { readPublishedJson } from "@/lib/publish/storage";
import { getPublicApiCorsHeaders } from "@/lib/security/cors";
import type { PublishedEventsDocument } from "@/lib/publish/types";
import { resolvePublicTenantContext } from "@/lib/site/runtime";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const upcoming = searchParams.get("upcoming") !== "false";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const publishedEvents = await readPublishedJson<PublishedEventsDocument>(`sites/${encodeURIComponent(tenantSlug)}/events.json`);
  if (publishedEvents?.events) {
    const events = upcoming
      ? publishedEvents.events.filter((event) => {
          const startsAt = typeof event.starts_at === "string" ? new Date(event.starts_at).getTime() : NaN;
          return !Number.isNaN(startsAt) && startsAt >= Date.now();
        })
      : publishedEvents.events;

    return NextResponse.json({ events: events.slice(0, limit) }, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        ...getPublicApiCorsHeaders(request),
      },
    });
  }

  const context = await resolvePublicTenantContext(tenantSlug);
  if (!context) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { tenant, runtimeClient } = context;

  let query = runtimeClient
    .from("events")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (upcoming) {
    query = query.gte("starts_at", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data }, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      ...getPublicApiCorsHeaders(request),
    },
  });
}
