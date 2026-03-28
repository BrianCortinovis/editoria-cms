import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import { getSuperadminOverview } from "@/lib/superadmin/service";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { callAI } from "@/lib/ai/providers";
import type { AIMessage } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  const message = body?.message;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Messaggio richiesto" }, { status: 400 });
  }

  // Fetch real platform data
  const overview = await getSuperadminOverview();

  // Build context from real data
  const platformContext = `
DATI PIATTAFORMA (verificati in tempo reale):
- Utenti totali: ${overview.summary.totalUsers}
- Siti totali: ${overview.summary.totalSites}
- Tenant totali: ${overview.summary.totalTenants}
- Domini attivi: ${overview.summary.activeDomains}
- Abbonamenti attivi: ${overview.summary.activeSubscriptions}
- Siti shared: ${overview.summary.sharedSites}
- Siti dedicated: ${overview.summary.dedicatedSites}
- Siti con upload bloccato: ${overview.summary.blockedUploadSites}
- Siti media Cloudflare R2: ${overview.summary.cloudflareMediaSites}
- Siti media VPS: ${overview.summary.vpsMediaSites}

DETTAGLIO SITI:
${overview.sites
  .slice(0, 20)
  .map(
    (s) =>
      `- ${s.name} (${s.slug}): piano=${s.planCode || "nessuno"}, stack=${s.stackKind}, storage=${Math.round(s.storageUsagePercent || 0)}% (${Math.round((s.storageUsedBytes || 0) / 1024 / 1024)}MB/${Math.round((s.storageHardLimitBytes || 0) / 1024 / 1024)}MB), moduli=[${(s.activeModules || []).join(",")}], upload_bloccato=${s.uploadBlocked ? "SI" : "no"}, publish_bloccato=${s.publishBlocked ? "SI" : "no"}, ultimo_publish=${s.lastPublishAt || "mai"}`
  )
  .join("\n")}

DOMINI:
${overview.domains
  .slice(0, 20)
  .map(
    (d) =>
      `- ${d.hostname}: status=${d.status}, tipo=${d.kind}, primario=${d.isPrimary ? "SI" : "no"}, sito=${d.siteName}`
  )
  .join("\n")}

ULTIMI AUDIT LOG:
${(overview.recentAuditLogs || [])
  .slice(0, 5)
  .map((l) => `- ${l.created_at}: ${l.action} (${l.resource_type})`)
  .join("\n")}
`.trim();

  const systemPrompt = `Sei l'assistente IA del superadmin della piattaforma Editoria CMS.

REGOLE ASSOLUTE:
1. Rispondi SOLO basandoti sui dati reali forniti nel contesto qui sotto.
2. NON inventare MAI metriche, numeri, status, problemi o suggerimenti basati su dati che non hai.
3. Se non hai dati sufficienti per rispondere, di': "Non ho questo dato disponibile. Ti consiglio di verificare nel pannello [sezione appropriata]."
4. Puoi analizzare trend e dare suggerimenti SOLO basandoti sui dati reali forniti.
5. Se trovi anomalie nei dati (storage alto, upload bloccati, siti senza publish recente), segnalale.
6. Rispondi in italiano.
7. Sii conciso e pratico.
8. Se ti viene chiesto qualcosa che non è nei dati, rispondi: "Non ho questo dato disponibile. Ti consiglio di verificare nel pannello [sezione appropriata]."

${platformContext}`;

  try {
    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    const apiKey = process.env.ANTHROPIC_API_KEY || "";
    const response = await callAI("claude", messages, {
      apiKey,
      model: "claude-sonnet-4-20250514",
    });

    return NextResponse.json({
      response: response.text,
      provider: response.provider,
    });
  } catch (error) {
    console.error("Superadmin AI error:", error);
    return NextResponse.json(
      {
        error:
          "Errore nella risposta IA. Verifica la configurazione API key.",
      },
      { status: 500 }
    );
  }
}
