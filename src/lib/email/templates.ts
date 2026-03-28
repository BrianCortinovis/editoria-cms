const PLATFORM_NAME = process.env.PLATFORM_NAME || "Editoria CMS";

/* ---------- shared layout ---------- */

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:100%">
<tr><td style="padding:32px 28px">${body}</td></tr>
</table>
<p style="font-size:12px;color:#71717a;margin-top:24px">${PLATFORM_NAME}</p>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 24px;font-size:22px;color:#18181b">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46">${text}</p>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td>
<a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px">${label}</a>
</td></tr></table>`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/* ---------- template: welcome ---------- */

export interface WelcomeData {
  name: string;
  loginUrl?: string;
}

export function welcome(data: WelcomeData) {
  const subject = `Benvenuto su ${PLATFORM_NAME}`;
  const html = wrap(
    heading(`Benvenuto, ${data.name}!`) +
      paragraph(
        `Il tuo account su ${PLATFORM_NAME} è stato creato con successo. Puoi accedere alla dashboard per iniziare a gestire i tuoi contenuti.`
      ) +
      (data.loginUrl ? button("Accedi alla dashboard", data.loginUrl) : "") +
      paragraph("Se non hai richiesto questa registrazione, puoi ignorare questa email.")
  );
  return { subject, html, text: stripHtml(html) };
}

/* ---------- template: password reset ---------- */

export interface PasswordResetData {
  name: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function passwordReset(data: PasswordResetData) {
  const expiry = data.expiresInMinutes || 60;
  const subject = `Reimposta la tua password - ${PLATFORM_NAME}`;
  const html = wrap(
    heading("Reimposta la password") +
      paragraph(
        `Ciao ${data.name}, abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account.`
      ) +
      button("Reimposta password", data.resetUrl) +
      paragraph(
        `Questo link scade tra <strong>${expiry} minuti</strong>. Se non hai richiesto il reset, ignora questa email.`
      )
  );
  return { subject, html, text: stripHtml(html) };
}

/* ---------- template: invitation ---------- */

export interface InvitationData {
  inviterName: string;
  siteName: string;
  role: string;
  acceptUrl: string;
}

export function invitation(data: InvitationData) {
  const subject = `Sei stato invitato a collaborare su ${data.siteName}`;
  const html = wrap(
    heading("Invito a collaborare") +
      paragraph(
        `<strong>${data.inviterName}</strong> ti ha invitato a partecipare al sito <strong>${data.siteName}</strong> con il ruolo di <strong>${data.role}</strong>.`
      ) +
      button("Accetta invito", data.acceptUrl) +
      paragraph("Se non conosci questa persona, puoi ignorare questa email.")
  );
  return { subject, html, text: stripHtml(html) };
}

/* ---------- template: article published ---------- */

export interface ArticlePublishedData {
  editorName: string;
  articleTitle: string;
  articleUrl: string;
  siteName: string;
}

export function articlePublished(data: ArticlePublishedData) {
  const subject = `Articolo pubblicato: ${data.articleTitle}`;
  const html = wrap(
    heading("Nuovo articolo pubblicato") +
      paragraph(
        `<strong>${data.editorName}</strong> ha pubblicato l'articolo <strong>"${data.articleTitle}"</strong> su ${data.siteName}.`
      ) +
      button("Visualizza articolo", data.articleUrl)
  );
  return { subject, html, text: stripHtml(html) };
}

/* ---------- template: form submission notification ---------- */

export interface FormSubmissionData {
  formName: string;
  siteName: string;
  submitterName?: string;
  submitterEmail?: string;
  fields: Record<string, unknown>;
  sourcePage?: string;
}

export function formSubmission(data: FormSubmissionData) {
  const subject = `Nuova compilazione: ${data.formName} - ${data.siteName}`;

  const rows = Object.entries(data.fields)
    .map(
      ([key, value]) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-weight:600;font-size:14px;color:#3f3f46;white-space:nowrap;vertical-align:top">${escapeHtml(key)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#52525b">${escapeHtml(String(value ?? ""))}</td>
        </tr>`
    )
    .join("");

  const meta: string[] = [];
  if (data.submitterName) meta.push(`<strong>Nome:</strong> ${escapeHtml(data.submitterName)}`);
  if (data.submitterEmail) meta.push(`<strong>Email:</strong> ${escapeHtml(data.submitterEmail)}`);
  if (data.sourcePage) meta.push(`<strong>Pagina:</strong> ${escapeHtml(data.sourcePage)}`);

  const html = wrap(
    heading(`Nuova compilazione: ${escapeHtml(data.formName)}`) +
      (meta.length > 0 ? paragraph(meta.join(" &middot; ")) : "") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;margin:16px 0">${rows}</table>` +
      paragraph(`<em>Sito: ${escapeHtml(data.siteName)}</em>`)
  );
  return { subject, html, text: stripHtml(html) };
}

/* ---------- helpers ---------- */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
