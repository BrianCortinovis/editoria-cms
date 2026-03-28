import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { runPublishMaintenance } from "@/lib/cron/publish-maintenance";
import { runSeoAnalysisCron } from "@/lib/cron/seo-analysis";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { getPlatformCronSettings, savePlatformCronSettings } from "@/lib/cron/platform-settings";
import { requireSuperAdminApi } from "@/lib/superadmin/api";

export async function GET() {
  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const settings = await getPlatformCronSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  const publishMaintenanceEnabled = typeof body?.publishMaintenanceEnabled === "boolean" ? body.publishMaintenanceEnabled : null;
  const seoAnalysisEnabled = typeof body?.seoAnalysisEnabled === "boolean" ? body.seoAnalysisEnabled : null;

  if (publishMaintenanceEnabled === null || seoAnalysisEnabled === null) {
    return NextResponse.json(
      { error: "publishMaintenanceEnabled e seoAnalysisEnabled obbligatori" },
      { status: 400 }
    );
  }

  const settings = await savePlatformCronSettings(
    { publishMaintenanceEnabled, seoAnalysisEnabled },
    access.user.id
  );

  return NextResponse.json({ ok: true, settings });
}

export async function POST(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) {
    const trustedOriginError = assertTrustedMutationRequest(request);
    if (trustedOriginError) {
      return trustedOriginError;
    }
  }

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  const job = typeof body?.job === "string" ? body.job : null;

  try {
    if (job === "publish-maintenance") {
      const result = await runPublishMaintenance();
      return NextResponse.json({ ok: true, job, result });
    }

    if (job === "seo-analysis") {
      const result = await runSeoAnalysisCron();
      return NextResponse.json({ ok: true, job, result });
    }

    return NextResponse.json({ error: "job non supportato" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Run cron failed" },
      { status: 500 }
    );
  }
}
