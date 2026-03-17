"use client";

import { Menu, Bell, ExternalLink, Search } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function Topbar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const { profile, currentTenant, currentRole } = useAuthStore();

  const roleLabels: Record<string, string> = {
    super_admin: "Admin",
    chief_editor: "Capo",
    editor: "Redattore",
    contributor: "Collab.",
    advertiser: "Comm.",
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#18181b]/80 backdrop-blur-xl border-b border-[#27272a] flex items-center px-6 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center hover:bg-[#27272a] rounded-lg transition text-gray-400"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-sm font-semibold text-gray-200 flex-1">{title}</h1>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-[#27272a] rounded-lg px-3 py-1.5 w-64">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Cerca..."
          className="bg-transparent border-0 text-sm text-gray-300 placeholder-gray-600 focus:outline-none w-full"
        />
        <kbd className="text-[10px] text-gray-600 bg-[#3f3f46] px-1.5 py-0.5 rounded font-mono">/</kbd>
      </div>

      <button className="w-8 h-8 flex items-center justify-center hover:bg-[#27272a] rounded-lg transition relative">
        <Bell className="w-4 h-4 text-gray-500" />
      </button>

      {currentTenant?.domain && (
        <a
          href={`https://${currentTenant.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <ExternalLink className="w-3 h-3" />
          Sito
        </a>
      )}

      {profile && (
        <div className="flex items-center gap-2.5">
          <div className="hidden md:block text-right">
            <p className="text-xs font-medium text-gray-300 leading-tight">
              {profile.full_name}
            </p>
            <p className="text-[10px] text-gray-600">
              {currentRole ? roleLabels[currentRole] : ""}
            </p>
          </div>
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-white uppercase">
            {profile.full_name?.charAt(0) || profile.email?.charAt(0)}
          </div>
        </div>
      )}
    </header>
  );
}
