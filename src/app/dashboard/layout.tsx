"use client";

import { useState, useMemo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthProvider from "@/components/layout/AuthProvider";
import { GlobalAiChat } from "@/components/ai/GlobalAiChat";

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

// Pages that should be fullscreen (no padding) - editors need maximum viewport space for tool panels and canvas
const fullscreenPages = ["/dashboard/editor"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isFullscreen = useMemo(() => {
    if (typeof window === "undefined") return false;
    return fullscreenPages.includes(window.location.pathname);
  }, []);

  const title = useMemo(() => {
    if (typeof window === "undefined") return "Dashboard";
    const path = window.location.pathname;
    return pageTitles[path] ?? pageTitles["/dashboard"] ?? "Dashboard";
  }, []);

  return (
    <AuthProvider>
      <div className="h-screen flex flex-col" style={{ background: "var(--c-bg-0)" }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-[82px] flex-1 flex flex-col overflow-hidden">
          <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
          <main className={`flex-1 overflow-hidden w-full h-full ${!isFullscreen && "p-2 sm:p-3"}`}>
            <div className={isFullscreen ? "h-full w-full" : "w-full h-full overflow-auto"}>
              {children}
            </div>
          </main>
        </div>
        {/* Global AI Chat */}
        <GlobalAiChat />
      </div>
    </AuthProvider>
  );
}
