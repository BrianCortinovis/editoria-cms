import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { sendEmail } from "@/lib/email/service";

export async function POST(request: NextRequest) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  const to = body?.to;
  if (!to || typeof to !== "string" || !to.includes("@")) {
    return NextResponse.json(
      { error: "Valid email address required" },
      { status: 400 }
    );
  }

  const transport = process.env.EMAIL_TRANSPORT === "resend"
    ? "resend"
    : process.env.SMTP_HOST
      ? "smtp"
      : "console";

  const result = await sendEmail({
    to,
    subject: "Test email - Editoria CMS",
    html: `<div style="font-family:sans-serif;padding:20px">
      <h2>Email di test</h2>
      <p>Se stai leggendo questa email, la configurazione del servizio email funziona correttamente.</p>
      <p><strong>Transport:</strong> ${transport}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>`,
    text: `Email di test - Editoria CMS\n\nSe stai leggendo questa email, la configurazione funziona.\nTransport: ${transport}\nTimestamp: ${new Date().toISOString()}`,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Send failed", transport },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    messageId: result.messageId,
    transport,
  });
}
