import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { runPublishMaintenance } from "@/lib/cron/publish-maintenance";
import { runSeoAnalysisCron } from "@/lib/cron/seo-analysis";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { getPlatformCronSettings, savePlatformCronSettings } from "@/lib/cron/platform-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUserSuperAdmin } from "@/lib/superadmin/service";

async function requireSuperAdminSession() {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }

  const allowed = await isUserSuperAdmin(user.id);
  if (!allowed) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }

  return { error: null, user };
}

export async function GET() {
  const session = await requireSuperAdminSession();
  if (session.error) {
    return session.error;
  }

  const settings = await getPlatformCronSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const session = await requireSuperAdminSession();
  if (session.error || !session.user) {
    return session.error!;
  }

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
    session.user.id
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

  const session = await requireSuperAdminSession();
  if (session.error) {
    return session.error;
  }

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
