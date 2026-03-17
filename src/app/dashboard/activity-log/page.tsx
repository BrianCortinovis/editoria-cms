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
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-600",
  publish: "bg-purple-100 text-purple-700",
  archive: "bg-gray-100 text-gray-600",
  login: "bg-yellow-100 text-yellow-700",
};

const PAGE_SIZE = 50;

export default function ActivityLogPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isAdmin = currentRole === "super_admin" || currentRole === "chief_editor";

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
        <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Solo admin e caporedattori possono vedere il log attività</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Registro attività</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500">Pagina {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B0000]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nessuna attività registrata</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map(entry => {
              const Icon = entityIcons[entry.entity_type] || Activity;
              const actionColor = actionColors[entry.action] || "bg-gray-100 text-gray-600";
              return (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.user?.full_name || "Sistema"}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${actionColor}`}>
                        {entry.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        {entry.entity_type}
                      </span>
                    </div>
                    {entry.details && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {JSON.stringify(entry.details).slice(0, 100)}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
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
