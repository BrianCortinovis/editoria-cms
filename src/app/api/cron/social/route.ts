import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { processScheduledSocialPosts } from "@/lib/social/scheduled-processor";

/**
 * GET /api/cron/social
 * Eseguito ogni minuto da Vercel Cron.
 * Cerca post con scheduled_at <= now() e status = 'pending', li invia.
 */
export async function GET(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  try {
    const result = await processScheduledSocialPosts();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social cron failed";
    console.error("Social cron failed:", error);
    return NextResponse.json(
      { success: false, error: message, processedAt: new Date().toISOString() },
      { status: 500 },
    );
  }
}
