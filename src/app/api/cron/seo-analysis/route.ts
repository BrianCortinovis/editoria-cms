import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { runSeoAnalysisCron } from "@/lib/cron/seo-analysis";

export async function GET(request: NextRequest) {
  const authError = authorizeCronRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const payload = await runSeoAnalysisCron();
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("SEO cron job error:", error);
    return NextResponse.json(
      { error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
