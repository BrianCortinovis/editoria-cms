import nodemailer from "nodemailer";

type EmailTransport = "smtp" | "resend" | "console";

function getTransportMode(): EmailTransport {
  if (process.env.EMAIL_TRANSPORT === "resend") return "resend";
  if (process.env.SMTP_HOST) return "smtp";
  if (process.env.NODE_ENV === "production") {
    console.warn("[EMAIL] Nessun provider email configurato in produzione (SMTP_HOST o RESEND_API_KEY mancante). Modalità console attiva.");
  }
  return "console";
}

function createSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      `Configurazione SMTP incompleta: ${[!host && "SMTP_HOST", !user && "SMTP_USER", !pass && "SMTP_PASS"].filter(Boolean).join(", ")} mancante`
    );
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(
  payload: EmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mode = getTransportMode();
  const from =
    payload.from || process.env.EMAIL_FROM || "noreply@editoria.app";

  if (mode === "console") {
    console.log("[EMAIL-DEV]", {
      to: payload.to,
      subject: payload.subject,
      from,
    });
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  if (mode === "resend") {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: "RESEND_API_KEY mancante" };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(payload.to) ? payload.to : [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          reply_to: payload.replyTo,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        return { success: false, error: data.message || res.statusText };
      return { success: true, messageId: data.id };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  // SMTP mode
  try {
    const transport = createSmtpTransport();
    const info = await transport.sendMail({
      from,
      to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });
    return { success: true, messageId: info.messageId };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function sendBulkEmail(
  payload: EmailPayload & { to: string[] },
  options?: { concurrency?: number },
): Promise<{
  total: number;
  sent: number;
  failed: number;
  failures: Array<{ email: string; error: string }>;
}> {
  const uniqueRecipients = Array.from(
    new Set(
      payload.to
        .map((email) => String(email || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const concurrency = Math.max(1, Math.min(options?.concurrency || 5, 10));
  const failures: Array<{ email: string; error: string }> = [];
  let sent = 0;

  for (let index = 0; index < uniqueRecipients.length; index += concurrency) {
    const chunk = uniqueRecipients.slice(index, index + concurrency);
    const results = await Promise.all(
      chunk.map(async (email) => {
        const result = await sendEmail({
          ...payload,
          to: email,
        });
        return { email, result };
      }),
    );

    for (const item of results) {
      if (item.result.success) {
        sent += 1;
      } else {
        failures.push({
          email: item.email,
          error: item.result.error || "Send failed",
        });
      }
    }
  }

  return {
    total: uniqueRecipients.length,
    sent,
    failed: failures.length,
    failures,
  };
}

/**
 * Fire-and-forget email send. Logs errors but never throws or blocks.
 */
export function sendEmailAsync(payload: EmailPayload): void {
  sendEmail(payload).catch((err) => {
    console.error("[EMAIL-ASYNC] Failed to send email:", err);
  });
}
