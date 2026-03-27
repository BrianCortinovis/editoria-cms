import { AlertTriangle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getSuperadminOverview } from "@/lib/superadmin/service";

const statusIconMap = {
  queued: Clock3,
  running: Clock3,
  succeeded: CheckCircle2,
  failed: XCircle,
  canceled: AlertTriangle,
} as const;

export default async function AdminPublishPage() {
  const overview = await getSuperadminOverview();
  const cronLogs = overview.recentAuditLogs.filter(
    (entry) => entry.action === "cron.publish_maintenance" || entry.action === "cron.seo_analysis"
  );

  return (
    <div className="space-y-6">
      <div className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Publish Pipeline
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Publish
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
            Cron Runs
          </p>
          <h3 className="mt-1 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
            Ultimi job schedulati
          </h3>
        </div>
        {cronLogs.length === 0 ? (
          <div className="border-y px-4 py-3 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
            Nessun run cron registrato ancora.
          </div>
        ) : (
          <div className="border-y" style={{ borderColor: "var(--c-border)" }}>
            {cronLogs.map((log) => (
            <article key={log.id} className="border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                    {log.action}
                  </h4>
                  <p className="mt-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                    {log.tenant_id ? "Sito collegato" : "Run globale"}
                  </p>
                </div>
                <div className="text-right text-xs" style={{ color: "var(--c-text-2)" }}>
                  {new Date(log.created_at).toLocaleString("it-IT")}
                </div>
              </div>
              <pre
                className="mt-3 overflow-auto border-l pl-3 text-xs"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)" }}
              >
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </article>
          ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {overview.publishJobs.length === 0 ? (
          <div className="border-y px-4 py-3 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
            Nessun job publish registrato ancora.
          </div>
        ) : (
          <div className="border-y" style={{ borderColor: "var(--c-border)" }}>
          {overview.publishJobs.map((job) => {
            const Icon = statusIconMap[job.status as keyof typeof statusIconMap] || Clock3;
            return (
              <article key={job.id} className="border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--c-border)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: job.status === "failed" ? "var(--c-danger)" : "var(--c-accent)" }} />
                      <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                        {job.siteName || job.siteId}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                      {job.jobType} · {job.status} {job.releaseVersion ? `· release ${job.releaseVersion}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs" style={{ color: "var(--c-text-2)" }}>
                    <p>Creato: {new Date(job.createdAt).toLocaleString("it-IT")}</p>
                    <p>Avvio: {job.startedAt ? new Date(job.startedAt).toLocaleString("it-IT") : "n/d"}</p>
                    <p>Fine: {job.finishedAt ? new Date(job.finishedAt).toLocaleString("it-IT") : "n/d"}</p>
                  </div>
                </div>
                {job.errorMessage ? (
                  <div className="mt-3 border-l pl-3 text-sm" style={{ borderColor: "var(--c-danger)", color: "var(--c-danger)" }}>
                    {job.errorMessage}
                  </div>
                ) : null}
              </article>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
