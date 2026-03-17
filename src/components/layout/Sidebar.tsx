"use client";

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
  Settings,
  LogOut,
  ChevronDown,
  Layers,
  Building2,
  Activity,
  LayoutTemplate,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const mainNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/layout", label: "Layout", icon: LayoutTemplate },
  { href: "/dashboard/articoli", label: "Articoli", icon: FileText },
  { href: "/dashboard/media", label: "Media", icon: Image },
  { href: "/dashboard/categorie", label: "Categorie", icon: FolderOpen },
  { href: "/dashboard/tag", label: "Tag", icon: Tag },
];

const editorialNav = [
  { href: "/dashboard/breaking-news", label: "Breaking", icon: Zap },
  { href: "/dashboard/eventi", label: "Eventi", icon: Calendar },
  { href: "/dashboard/banner", label: "Banner", icon: Megaphone },
  { href: "/dashboard/inserzionisti", label: "Clienti", icon: Building2 },
];

const systemNav = [
  { href: "/dashboard/utenti", label: "Team", icon: Users },
  { href: "/dashboard/activity-log", label: "Log", icon: Activity },
  { href: "/dashboard/impostazioni", label: "Config", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl transition-all min-w-[64px] ${
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
      }`}
    >
      <Icon
        className={`w-[22px] h-[22px] transition-all ${
          isActive ? "text-blue-400" : ""
        }`}
        strokeWidth={isActive ? 2 : 1.5}
      />
      <span className="text-[10px] font-medium leading-none tracking-wide">
        {label}
      </span>
    </Link>
  );
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTenant, tenants, setCurrentTenant, reset, profile } =
    useAuthStore();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    reset();
    router.push("/auth/login");
  };

  const handleTenantSwitch = (tenantId: string) => {
    const t = tenants.find((t) => t.id === tenantId);
    if (t) {
      setCurrentTenant(t, t.role);
      localStorage.setItem("editoria_current_tenant", tenantId);
    }
  };

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-[88px] bg-[#111113] z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Tenant indicator */}
        {currentTenant && (
          <div className="mx-3 mb-2">
            {tenants.length > 1 ? (
              <div className="relative">
                <select
                  value={currentTenant.id}
                  onChange={(e) => handleTenantSwitch(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.06] text-[9px] text-gray-400 text-center rounded-lg py-1.5 appearance-none cursor-pointer focus:outline-none"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#111113]">
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
              </div>
            ) : (
              <p className="text-[9px] text-gray-600 text-center font-medium truncate">
                {currentTenant.name}
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-4 my-1" />

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
                onClick={onClose}
              />
            ))}
          </div>

          <div className="h-px bg-white/[0.06] mx-2 my-2" />

          <div className="space-y-0.5">
            {editorialNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
                onClick={onClose}
              />
            ))}
          </div>

          <div className="h-px bg-white/[0.06] mx-2 my-2" />

          <div className="space-y-0.5">
            {systemNav.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
                onClick={onClose}
              />
            ))}
          </div>
        </nav>

        {/* User + Logout */}
        <div className="p-2 border-t border-white/[0.06]">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-[11px] font-bold text-gray-300 uppercase">
              {profile?.full_name?.charAt(0) || "?"}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full py-1.5 text-gray-600 hover:text-gray-400 transition"
              title="Esci"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
