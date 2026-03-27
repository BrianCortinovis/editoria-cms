import { Bell } from "lucide-react";
import { requirePlatformUser } from "@/lib/platform/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const { user } = await requirePlatformUser();
  const supabase = await createServerSupabaseClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-4">
      <div className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Notifiche
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
          Eventi account, problemi dominio e azioni rilevanti della piattaforma.
        </p>
      </div>
      <div className="border-y" style={{ borderColor: "var(--c-border)" }}>
        {(notifications || []).map((notification) => (
          <article key={notification.id} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--c-border)" }}>
            <Bell className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--c-accent-hover)" }} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                  {notification.title}
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                  {notification.severity}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
                {notification.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
