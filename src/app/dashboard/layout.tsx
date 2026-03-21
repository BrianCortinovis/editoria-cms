"use client";

import { useState, useEffect } from "react";
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

// Pages that should be fullscreen (no padding)
const fullscreenPages = ["/dashboard/editor"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    setIsFullscreen(fullscreenPages.includes(path));
  }, []);

  const getTitle = () => {
    if (typeof window === "undefined") return "Dashboard";
    const path = window.location.pathname;
    for (const [key, value] of Object.entries(pageTitles)) {
      if (path === key || (key !== "/dashboard" && path.startsWith(key))) return value;
    }
    return "Dashboard";
  };

  return (
    <AuthProvider>
      <div className="h-screen flex flex-col" style={{ background: "var(--c-bg-0)" }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-[82px] flex-1 flex flex-col overflow-hidden">
          <Topbar title={getTitle()} onMenuClick={() => setSidebarOpen(true)} />
          <main className={`flex-1 overflow-hidden ${isFullscreen ? "" : "p-2 sm:p-3"} w-full h-full`}>
            <div className={isFullscreen ? "h-full w-full" : "w-full h-full overflow-auto"}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
