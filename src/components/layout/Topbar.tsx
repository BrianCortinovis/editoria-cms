"use client";

import { Menu, Bell, ExternalLink, Search } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { profile, currentTenant, currentRole } = useAuthStore();
  const roleLabels: Record<string, string> = { super_admin: "Admin", chief_editor: "Capo", editor: "Redattore", contributor: "Collab.", advertiser: "Comm." };

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center px-5 gap-4 backdrop-blur-xl border-b"
      style={{ background: "color-mix(in srgb, var(--c-bg-1) 80%, transparent)", borderColor: "var(--c-border)" }}>
      <button onClick={onMenuClick} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition" style={{ color: "var(--c-text-2)" }}>
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-sm font-semibold flex-1" style={{ color: "var(--c-text-0)" }}>{title}</h1>

      <div className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 w-60" style={{ background: "var(--c-bg-3)" }}>
        <Search className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
        <input type="text" placeholder="Cerca..." className="bg-transparent border-0 text-sm focus:outline-none w-full" style={{ color: "var(--c-text-0)" }} />
        <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--c-border)", color: "var(--c-text-3)" }}>/</kbd>
      </div>

      <button className="w-8 h-8 flex items-center justify-center rounded-lg transition relative" style={{ color: "var(--c-text-2)" }}>
        <Bell className="w-4 h-4" />
      </button>

      {currentTenant?.domain && (
        <a href={`https://${currentTenant.domain}`} target="_blank" rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition"
          style={{ background: "var(--c-accent)" }}>
          <ExternalLink className="w-3 h-3" /> Sito
        </a>
      )}

      {profile && (
        <div className="hidden md:flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-medium leading-tight" style={{ color: "var(--c-text-0)" }}>{profile.full_name}</p>
            <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>{currentRole ? roleLabels[currentRole] : ""}</p>
          </div>
        </div>
      )}
    </header>
  );
}
