import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { runPublishMaintenance } from "@/lib/cron/publish-maintenance";

export async function GET(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const result = await runPublishMaintenance();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron maintenance failed";
    console.error("Publish maintenance cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        processedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
