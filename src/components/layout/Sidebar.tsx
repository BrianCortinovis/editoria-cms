"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Image,
  FolderOpen,
  Tag,
  Users,
  Megaphone,
  Calendar,
  Zap,
  MessageSquare,
  FormInput,
  Settings,
  LogOut,
  ChevronDown,
  Layers,
  Building2,
  Activity,
  Sun,
  Moon,
  Shield,
  BarChart3,
  Receipt,
  Cpu,
  Package,
  Globe,
  Sparkles,
  Newspaper,
  BadgeDollarSign,
  Menu,
  PanelBottom,
  Mail,
  Download,
  Share2,
  ScanLine,
  Upload,
  LayoutGrid,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";
import { isModuleActive } from "@/lib/modules";

export const mainNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/pagine", label: "Pagine", icon: FileText },
  { href: "/dashboard/menu", label: "Menu", icon: Menu },
  { href: "/dashboard/footer", label: "Footer", icon: PanelBottom },
  { href: "/dashboard/layout/content", label: "Regole Slot", icon: ScanLine },
  { href: "/dashboard/articoli", label: "Articoli", icon: FileText },
  { href: "/dashboard/media", label: "Media", icon: Image },
  { href: "/dashboard/categorie", label: "Categorie", icon: FolderOpen },
  { href: "/dashboard/tag", label: "Tag", icon: Tag },
];

export const editorialNav = [
  { href: "/dashboard/redazione", label: "Redazione", icon: Newspaper },
  { href: "/dashboard/desk", label: "Desk", icon: FileText },
  { href: "/dashboard/social", label: "Social", icon: Share2 },
  { href: "/dashboard/newsletter", label: "Newsletter", icon: Mail },
  { href: "/dashboard/breaking-news", label: "Breaking", icon: Zap },
  { href: "/dashboard/eventi", label: "Eventi", icon: Calendar },
  { href: "/dashboard/commenti", label: "Commenti", icon: MessageSquare },
  { href: "/dashboard/form", label: "Form", icon: FormInput },
];

export const advNav = [
  { href: "/dashboard/adv", label: "ADV", icon: BadgeDollarSign },
  { href: "/dashboard/banner", label: "Banner", icon: Megaphone },
  { href: "/dashboard/inserzionisti", label: "Clienti", icon: Building2 },
  { href: "/dashboard/contabilita", label: "Conti", icon: Receipt },
];

export const systemNav = [
  { href: "/dashboard/zone-sito", label: "Zone Sito", icon: LayoutGrid },
  { href: "/dashboard/testata", label: "Testata", icon: Building2 },
  { href: "/dashboard/importa-sito", label: "Importa Sito", icon: Upload },
  { href: "/dashboard/tecnico", label: "Tecnico", icon: Cpu },
  { href: "/dashboard/migrazioni", label: "Migraz.", icon: Download },
  { href: "/dashboard/seo", label: "SEO", icon: BarChart3 },
  { href: "/dashboard/redirect", label: "Redirect", icon: Globe },
  { href: "/dashboard/ia", label: "IA", icon: Sparkles },
  { href: "/dashboard/gdpr", label: "GDPR", icon: Shield },
  { href: "/dashboard/utenti", label: "Team", icon: Users },
  { href: "/dashboard/moduli", label: "Moduli", icon: Package },
  { href: "/dashboard/activity-log", label: "Log", icon: Activity },
  { href: "/dashboard/impostazioni", label: "Config", icon: Settings },
];

function filterNavByRole(
  items: Array<{ href: string; label: string; icon: typeof LayoutDashboard }>,
  role: UserRole | null,
  section: "main" | "editorial" | "adv" | "system"
) {
  if (!role) return items;

  if (role === "contributor") {
    const contributorAllowed = new Set(
      section === "main"
        ? ["/dashboard", "/dashboard/articoli", "/dashboard/media"]
        : section === "editorial"
          ? ["/dashboard/desk"]
          : []
    );
    return items.filter((item) => contributorAllowed.has(item.href));
  }

  if (role === "advertiser") {
    const advertiserAllowed = new Set(
      section === "main"
        ? ["/dashboard", "/dashboard/media"]
        : section === "adv"
          ? ["/dashboard/adv", "/dashboard/banner", "/dashboard/inserzionisti", "/dashboard/contabilita"]
          : section === "system"
            ? ["/dashboard/impostazioni"]
            : []
    );
    return items.filter((item) => advertiserAllowed.has(item.href));
  }

  if (role === "editor") {
    if (section === "system") {
      const editorAllowed = new Set([
        "/dashboard/seo",
        "/dashboard/ia",
        "/dashboard/activity-log",
      ]);
      return items.filter((item) => editorAllowed.has(item.href));
    }
    return items;
  }

  if (role === "chief_editor") {
    if (section === "system") {
      const chiefAllowed = new Set([
        "/dashboard/testata",
        "/dashboard/seo",
        "/dashboard/redirect",
        "/dashboard/ia",
        "/dashboard/utenti",
        "/dashboard/activity-log",
        "/dashboard/impostazioni",
      ]);
      return items.filter((item) => chiefAllowed.has(item.href));
    }
    return items;
  }

  return items;
}
function NavItem({ href, label, icon: Icon, isActive, onClick }: {
  href: string; label: string; icon: typeof LayoutDashboard; isActive: boolean; onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all min-w-[64px]"
      style={{
        background: isActive ? "var(--c-accent-soft)" : "transparent",
        color: isActive ? "var(--c-accent)" : "var(--c-text-2)",
      }}
    >
      <Icon className="w-[20px] h-[20px] transition-all" strokeWidth={isActive ? 2 : 1.5} />
      <span className="text-[9px] font-medium leading-none tracking-wide">{label}</span>
    </Link>
  );
}

function SectionToggle({
  label,
  isOpen,
  onToggle,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-1 pt-2 pb-1 flex items-center justify-center gap-1.5 rounded-lg transition"
      style={{ color: "var(--c-text-3)" }}
      title={isOpen ? `Chiudi ${label}` : `Apri ${label}`}
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-center">
        {label}
      </span>
      <ChevronDown
        className="w-3 h-3 transition-transform"
        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
      />
    </button>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTenant, currentRole, tenants, setCurrentTenant, reset, profile } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const aiModuleEnabled = isModuleActive((currentTenant?.settings as Record<string, unknown>) || {}, "ai_assistant");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    reset();
    router.push("/auth/login");
  };

  const handleTenantSwitch = (tenantId: string) => {
    const t = tenants.find((t) => t.id === tenantId);
    if (t) { setCurrentTenant(t, t.role); localStorage.setItem("editoria_current_tenant", tenantId); }
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  const visibleMainNav = filterNavByRole(mainNav, currentRole, "main");
  const visibleEditorialNav = filterNavByRole(editorialNav, currentRole, "editorial");
  const visibleAdvNav = filterNavByRole(advNav, currentRole, "adv");
  const visibleSystemNav = filterNavByRole(systemNav, currentRole, "system")
    .filter((item) => item.href !== "/dashboard/ia" || aiModuleEnabled);
  const [collapsedSections, setCollapsedSections] = useState({
    main: false,
    editorial: false,
    adv: false,
    system: false,
  });

  const toggleSection = (section: "main" | "editorial" | "adv" | "system") => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />}

      <aside
        className="fixed left-0 top-0 bottom-0 w-[82px] z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 border-r"
        style={{
          background: "var(--c-sidebar)",
          borderColor: "var(--c-border)",
          transform: open ? "translateX(0)" : undefined,
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--c-accent)" }}>
            <Layers className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Tenant */}
        {currentTenant && (
          <div className="mx-2 mb-1">
            {tenants.length > 1 ? (
              <div className="relative">
                <select value={currentTenant.id} onChange={e => handleTenantSwitch(e.target.value)}
                  className="w-full text-[8px] text-center rounded-lg py-1 appearance-none cursor-pointer focus:outline-none"
                  style={{ background: "var(--c-bg-3)", color: "var(--c-text-2)", border: "1px solid var(--c-border)" }}>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none" style={{ color: "var(--c-text-3)" }} />
              </div>
            ) : (
              <p className="text-[8px] text-center font-medium truncate" style={{ color: "var(--c-text-3)" }}>{currentTenant.name}</p>
            )}
          </div>
        )}

        <div className="h-px mx-3 my-1" style={{ background: "var(--c-border)" }} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
          {visibleMainNav.length > 0 && (
            <>
              <SectionToggle label="CMS" isOpen={!collapsedSections.main} onToggle={() => toggleSection("main")} />
              {!collapsedSections.main ? visibleMainNav.map(item => <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />) : null}
            </>
          )}
          {visibleEditorialNav.length > 0 && (
            <>
              <div className="h-px mx-2 my-1.5" style={{ background: "var(--c-border)" }} />
              <SectionToggle label="Redazione" isOpen={!collapsedSections.editorial} onToggle={() => toggleSection("editorial")} />
              {!collapsedSections.editorial ? visibleEditorialNav.map(item => <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />) : null}
            </>
          )}
          {visibleAdvNav.length > 0 && (
            <>
              <div className="h-px mx-2 my-1.5" style={{ background: "var(--c-border)" }} />
              <SectionToggle label="ADV" isOpen={!collapsedSections.adv} onToggle={() => toggleSection("adv")} />
              {!collapsedSections.adv ? visibleAdvNav.map(item => <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />) : null}
            </>
          )}
          {visibleSystemNav.length > 0 && (
            <>
              <div className="h-px mx-2 my-1.5" style={{ background: "var(--c-border)" }} />
              <SectionToggle label="Sistema" isOpen={!collapsedSections.system} onToggle={() => toggleSection("system")} />
              {!collapsedSections.system ? visibleSystemNav.map(item => <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={onClose} />) : null}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-1.5 space-y-1" style={{ borderTop: "1px solid var(--c-border)" }}>
          <button onClick={toggleTheme} className="w-full flex items-center justify-center py-1.5 rounded-lg transition" style={{ color: "var(--c-text-2)" }} title={theme === "dark" ? "Tema chiaro" : "Tema scuro"}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase mx-auto" style={{ background: "var(--c-accent)", color: "#fff" }}>
            {profile?.full_name?.charAt(0) || "?"}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center py-1 transition" style={{ color: "var(--c-text-3)" }} title="Esci">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
}
