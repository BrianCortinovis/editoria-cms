"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthProvider from "@/components/layout/AuthProvider";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/layout": "Layout Sito",
  "/dashboard/articoli": "Articoli",
  "/dashboard/media": "Media Library",
  "/dashboard/categorie": "Categorie",
  "/dashboard/tag": "Tag",
  "/dashboard/breaking-news": "Breaking News",
  "/dashboard/eventi": "Eventi",
  "/dashboard/banner": "Banner Pubblicitari",
  "/dashboard/inserzionisti": "Inserzionisti",
  "/dashboard/utenti": "Team",
  "/dashboard/activity-log": "Log Attività",
  "/dashboard/impostazioni": "Impostazioni",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTitle = () => {
    if (typeof window === "undefined") return "Dashboard";
    const path = window.location.pathname;
    for (const [key, value] of Object.entries(pageTitles)) {
      if (path === key || (key !== "/dashboard" && path.startsWith(key))) {
        return value;
      }
    }
    return "Dashboard";
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0f0f11]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-[88px]">
          <Topbar
            title={getTitle()}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="p-5 max-w-[1400px] mx-auto">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
