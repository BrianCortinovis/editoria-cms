import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Cron job to run daily SEO analysis
 *
 * This endpoint should be called by Vercel Cron or an external scheduler
 * at https://editoria-cms.vercel.app/api/cron/seo-analysis
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/seo-analysis",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Get all tenants that have AI module enabled
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, settings")
      .limit(100);

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({ analyzed: 0, message: "No tenants found" });
    }

    const results = [];

    for (const tenant of tenants) {
      const settings = (tenant.settings ?? {}) as Record<string, unknown>;
      const aiModule = (settings.modules as any)?.ai_assistant;

      if (!aiModule?.enabled) {
        continue;
      }

      try {
        // Get articles for this tenant
        const { data: articles } = await supabase
          .from("articles")
          .select("id, title, slug, body, summary, meta_title, meta_description, og_image_url, view_count, published_at")
          .eq("tenant_id", tenant.id)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(50);

        if (!articles || articles.length === 0) {
          continue;
        }

        // Call SEO analysis endpoint
        const response = await fetch(
          `${process.env.NEXTAUTH_URL || "https://editoria-cms.vercel.app"}/api/ai/seo-tools`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              tenant_id: tenant.id,
              action: "analyze_seo",
              articles,
            }),
          }
        );

        const analysisResult = await response.json();

        // Store the analysis result in a new table (if it exists)
        if (response.ok) {
          const { data: stored } = await supabase
            .from("seo_analysis_history")
            .insert({
              tenant_id: tenant.id,
              analysis_date: new Date().toISOString(),
              article_count: articles.length,
              result: analysisResult,
            })
            .select();

          results.push({
            tenant_id: tenant.id,
            status: "success",
            articles_analyzed: articles.length,
            stored: !!stored,
          });
        } else {
          results.push({
            tenant_id: tenant.id,
            status: "error",
            message: analysisResult.error,
          });
        }
      } catch (error) {
        results.push({
          tenant_id: tenant.id,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      tenants_processed: tenants.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("SEO cron job error:", error);
    return NextResponse.json(
      { error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
