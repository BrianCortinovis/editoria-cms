"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import {
  Activity,
  FileText,
  Image,
  Users,
  Megaphone,
  Calendar,
  Zap,
  Settings,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user: { full_name: string; email: string } | null;
}

const entityIcons: Record<string, typeof FileText> = {
  article: FileText,
  media: Image,
  user: Users,
  banner: Megaphone,
  event: Calendar,
  breaking_news: Zap,
  settings: Settings,
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "text-[var(--c-accent)]",
  delete: "bg-red-100 text-red-600",
  publish: "bg-purple-100 text-purple-700",
  archive: "text-[var(--c-text-2)]",
  login: "bg-yellow-100 text-yellow-700",
};

const PAGE_SIZE = 50;

export default function ActivityLogPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isAdmin = currentRole === "admin" || currentRole === "chief_editor";

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("activity_log")
      .select("id, action, entity_type, entity_id, details, created_at, profiles!activity_log_user_id_fkey(full_name, email)")
      .eq("tenant_id", currentTenant.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEntries(data.map((d: any) => ({
        id: d.id,
        action: d.action,
        entity_type: d.entity_type,
        entity_id: d.entity_id,
        details: d.details,
        created_at: d.created_at,
        user: d.profiles,
      })));
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [currentTenant, page]);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Solo admin e caporedattori possono vedere il log attività</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: "var(--c-text-3)" }} />
          <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Registro attività</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded disabled:opacity-30"
            style={{ border: "1px solid var(--c-border)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs" style={{ color: "var(--c-text-2)" }}>Pagina {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="w-8 h-8 flex items-center justify-center rounded disabled:opacity-30"
            style={{ border: "1px solid var(--c-border)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessuna attività registrata</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {entries.map(entry => {
              const Icon = entityIcons[entry.entity_type] || Activity;
              const actionColor = actionColors[entry.action] || "text-[var(--c-text-2)]";
              return (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3 transition"
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 shrink-0" style={{ background: "var(--c-bg-2)" }}>
                    <Icon className="w-4 h-4" style={{ color: "var(--c-text-2)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>
                        {entry.user?.full_name || "Sistema"}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${actionColor}`}
                        style={actionColor.startsWith("text-[var") ? { background: "var(--c-bg-2)" } : undefined}>
                        {entry.action}
                      </span>
                      <span className="text-xs" style={{ color: "var(--c-text-2)" }}>
                        {entry.entity_type}
                      </span>
                    </div>
                    {entry.details && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--c-text-3)" }}>
                        {JSON.stringify(entry.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] shrink-0 whitespace-nowrap" style={{ color: "var(--c-text-3)" }}>
                    {new Date(entry.created_at).toLocaleString("it-IT", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
