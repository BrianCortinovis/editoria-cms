import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();

  const { error } = await supabase.rpc("refresh_materialized_views");

  if (error) {
    console.error("MV refresh error:", error.message);
    return NextResponse.json(
      { error: "Refresh failed", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    refreshed: true,
    views: [
      "mv_related_articles",
      "mv_tenant_stats",
      "mv_category_stats",
      "mv_trending_articles",
    ],
    timestamp: new Date().toISOString(),
  });
}
