"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthProvider from "@/components/layout/AuthProvider";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/editor": "Editor Grafico",
  "/dashboard/layout": "Layout Sito",
  "/dashboard/articoli": "Articoli",
  "/dashboard/media": "Media Library",
  "/dashboard/categorie": "Categorie",
  "/dashboard/tag": "Tag",
  "/dashboard/breaking-news": "Breaking News",
  "/dashboard/eventi": "Eventi",
  "/dashboard/banner": "Banner Pubblicitari",
  "/dashboard/inserzionisti": "Inserzionisti",
  "/dashboard/testata": "Scheda Testata",
  "/dashboard/tecnico": "Pannello Tecnico",
  "/dashboard/contabilita": "Contabilità",
  "/dashboard/seo": "SEO & Analytics",
  "/dashboard/ia": "IA & Intelligenza Artificiale",
  "/dashboard/gdpr": "GDPR & Compliance",
  "/dashboard/moduli": "Moduli Premium",
  "/dashboard/utenti": "Team",
  "/dashboard/activity-log": "Log Attività",
  "/dashboard/impostazioni": "Impostazioni",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTitle = () => {
    if (typeof window === "undefined") return "Dashboard";
    const path = window.location.pathname;
    for (const [key, value] of Object.entries(pageTitles)) {
      if (path === key || (key !== "/dashboard" && path.startsWith(key))) return value;
    }
    return "Dashboard";
  };

  const isEditor = typeof window !== "undefined" && window.location.pathname === "/dashboard/editor";

  return (
    <AuthProvider>
      <div className="h-screen flex flex-col" style={{ background: "var(--c-bg-0)" }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-[82px] flex-1 flex flex-col overflow-hidden">
          <Topbar title={getTitle()} onMenuClick={() => setSidebarOpen(true)} />
          <main className={`flex-1 overflow-hidden ${isEditor ? "" : "p-4 sm:p-5"} w-full h-full`}>
            <div className={isEditor ? "h-full w-full" : "max-w-[1400px] mx-auto h-full overflow-auto"}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
