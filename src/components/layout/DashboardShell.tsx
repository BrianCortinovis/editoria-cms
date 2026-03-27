"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthProvider from "@/components/layout/AuthProvider";
import { GlobalAiChat } from "@/components/ai/GlobalAiChat";
import { DashboardInteractiveGuide } from "@/components/help/DashboardInteractiveGuide";
import type { InitialAuthPayload } from "@/lib/auth-bootstrap";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/cms": "Cloud CMS",
  "/dashboard/desktop-bridge": "Desktop Bridge",
  "/dashboard/menu": "Menu",
  "/dashboard/footer": "Footer",
  "/dashboard/editor": "Editor Grafico",
  "/dashboard/layout": "Layout Sito",
  "/dashboard/layout/content": "Regole Contenuto Slot",
  "/dashboard/templates": "Libreria Template",
  "/dashboard/articoli": "Articoli",
  "/dashboard/media": "Media Library",
  "/dashboard/categorie": "Categorie",
  "/dashboard/tag": "Tag",
  "/dashboard/breaking-news": "Breaking News",
  "/dashboard/eventi": "Eventi",
  "/dashboard/commenti": "Commenti",
  "/dashboard/redazione": "Redazione",
  "/dashboard/desk": "Desk Giornalisti",
  "/dashboard/social": "Social Publishing",
  "/dashboard/newsletter": "Newsletter",
  "/dashboard/adv": "ADV",
  "/dashboard/form": "Form & Submissions",
  "/dashboard/banner": "Banner Pubblicitari",
  "/dashboard/inserzionisti": "Inserzionisti",
  "/dashboard/testata": "Scheda Testata",
  "/dashboard/tecnico": "Pannello Tecnico",
  "/dashboard/migrazioni": "Migrazioni WordPress",
  "/dashboard/contabilita": "Contabilità",
  "/dashboard/seo": "SEO & Analytics",
  "/dashboard/redirect": "Redirect Legacy",
  "/dashboard/ia": "IA & Intelligenza Artificiale",
  "/dashboard/ai-debug": "AI Debug",
  "/dashboard/ai-test": "AI Test",
  "/dashboard/gdpr": "GDPR & Compliance",
  "/dashboard/moduli": "Moduli Premium",
  "/dashboard/utenti": "Team",
  "/dashboard/activity-log": "Log Attività",
  "/dashboard/impostazioni": "Impostazioni",
};

const fullscreenPages: string[] = [];

export default function DashboardShell({
  children,
  initialAuth,
}: {
  children: React.ReactNode;
  initialAuth: InitialAuthPayload;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isFullscreen = useMemo(() => fullscreenPages.includes(pathname), [pathname]);

  const title = useMemo(() => {
    return pageTitles[pathname] ?? pageTitles["/dashboard"] ?? "Dashboard";
  }, [pathname]);

  return (
    <AuthProvider initialAuth={initialAuth}>
      <div
        className={
          isFullscreen
            ? "h-screen min-h-0 w-full max-w-full flex flex-col overflow-hidden"
            : "min-h-screen w-full max-w-full flex flex-col"
        }
        style={{ background: "var(--c-bg-0)" }}
      >
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div
          className={
            isFullscreen
              ? "lg:ml-[82px] flex-1 min-w-0 flex flex-col overflow-hidden"
              : "lg:ml-[82px] min-h-screen min-w-0 flex flex-col"
          }
        >
          <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
          <main
            className={`flex-1 min-w-0 w-full ${
              isFullscreen
                ? "h-full overflow-hidden"
                : "overflow-visible p-2 sm:p-3 lg:p-4"
            }`}
          >
            <div
              className={
                isFullscreen
                  ? "h-full w-full min-w-0 overflow-hidden"
                  : "mx-auto w-full min-w-0 max-w-[1500px]"
              }
            >
              {!isFullscreen ? <DashboardInteractiveGuide /> : null}
              {children}
            </div>
          </main>
        </div>
      </div>
      <GlobalAiChat />
    </AuthProvider>
  );
}
