"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Check, MessageSquare, ShieldAlert, Trash2 } from "lucide-react";

interface CommentRow {
  id: string;
  author_name: string;
  author_email: string;
  body: string;
  status: string;
  created_at: string;
  articles?: { title: string; slug: string } | null;
}

export default function CommentiPage() {
  const { currentTenant } = useAuthStore();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleReady, setModuleReady] = useState(true);

  const loadComments = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("article_comments")
      .select("id, author_name, author_email, body, status, created_at, articles(title, slug)")
      .eq("tenant_id", currentTenant.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (error.message.toLowerCase().includes("article_comments")) {
        setModuleReady(false);
      } else {
        toast.error(error.message);
      }
      setComments([]);
    } else {
      setModuleReady(true);
      setComments((data || []) as unknown as CommentRow[]);
    }
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadComments();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadComments]);

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("article_comments")
      .update({
        status,
        published_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Commento aggiornato");
    setComments((prev) => prev.map((comment) => (comment.id === id ? { ...comment, status } : comment)));
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Commenti</h2>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Moderazione commenti sito e import WordPress.</p>
        </div>
      </div>

      {!moduleReady ? (
        <div className="rounded-lg p-5" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-sm" style={{ color: "var(--c-text-1)" }}>
            Il modulo commenti è pronto nel codice ma la tabella non è ancora applicata al database dev.
          </p>
        </div>
      ) : loading ? (
        <div className="rounded-lg p-5" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Caricamento commenti...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg p-5" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Nessun commento disponibile.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-lg p-4"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
                    <strong style={{ color: "var(--c-text-0)" }}>{comment.author_name}</strong>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                      {comment.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--c-text-3)" }}>
                    {comment.author_email} · {comment.articles?.title || "Articolo"} · {new Date(comment.created_at).toLocaleString("it-IT")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(comment.id, "approved")} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                    <Check className="w-4 h-4" /> Approva
                  </button>
                  <button onClick={() => updateStatus(comment.id, "spam")} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#b45309" }}>
                    <ShieldAlert className="w-4 h-4" /> Spam
                  </button>
                  <button onClick={() => updateStatus(comment.id, "trash")} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5" style={{ background: "rgba(239, 68, 68, 0.12)", color: "var(--c-danger)" }}>
                    <Trash2 className="w-4 h-4" /> Cestina
                  </button>
                </div>
              </div>
              <p className="text-sm mt-3 whitespace-pre-wrap" style={{ color: "var(--c-text-1)" }}>
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
