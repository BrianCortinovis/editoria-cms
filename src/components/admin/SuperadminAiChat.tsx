"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const MAX_MESSAGES = 50;

export default function SuperadminAiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore di rete" }));
        const errMsg: ChatMessage = {
          role: "assistant",
          content: `Errore: ${err.error || res.statusText}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), errMsg]);
        return;
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.response || "Nessuna risposta.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "Errore di connessione. Riprova.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
      {open && (
        <div
          className="flex w-[400px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            background: "var(--c-bg-0)",
            borderColor: "var(--c-border)",
            maxHeight: "520px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" style={{ color: "var(--c-danger)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                Assistente Superadmin
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="rounded-lg p-1.5 transition hover:opacity-70"
                  title="Cancella chat"
                >
                  <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--c-text-2)" }} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition hover:opacity-70"
              >
                <ChevronDown className="h-4 w-4" style={{ color: "var(--c-text-2)" }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: "280px" }}>
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center py-12">
                <p className="text-center text-sm" style={{ color: "var(--c-text-2)" }}>
                  Chiedimi qualsiasi cosa sulla piattaforma.
                  <br />
                  <span className="text-xs">Rispondo solo con dati reali verificati.</span>
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap"
                  style={{
                    background: msg.role === "user" ? "var(--c-danger)" : "var(--c-bg-2)",
                    color: msg.role === "user" ? "#fff" : "var(--c-text-0)",
                    border: msg.role === "assistant" ? "1px solid var(--c-border)" : "none",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm"
                  style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--c-text-2)" }} />
                  <span style={{ color: "var(--c-text-2)" }}>Analisi in corso...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 border-t px-3 py-3"
            style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio..."
              disabled={loading}
              className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition"
              style={{
                background: "var(--c-bg-0)",
                borderColor: "var(--c-border)",
                color: "var(--c-text-0)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-xl p-2 transition hover:opacity-80 disabled:opacity-40"
              style={{ background: "var(--c-danger)", color: "#fff" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition hover:scale-105"
        style={{ background: "var(--c-danger)", color: "#fff" }}
        title="Assistente IA Superadmin"
      >
        {open ? <ChevronDown className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>
    </div>
  );
}
