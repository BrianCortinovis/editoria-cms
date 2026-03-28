"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChevronRight,
  Database,
  Globe,
  HardDrive,
  LayoutDashboard,
  TimerReset,
  Shield,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/sites", label: "Siti", icon: Database },
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/storage", label: "Storage", icon: HardDrive },
  { href: "/admin/domains", label: "Domini", icon: Globe },
  { href: "/admin/publish", label: "Publish", icon: Activity },
  { href: "/admin/cron", label: "Cron", icon: TimerReset },
];

function isActiveNavItem(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="platform-sidebar w-full lg:w-[304px] lg:min-h-screen lg:sticky lg:top-0">
      <div className="border-b px-6 py-7" style={{ borderColor: "var(--c-border)" }}>
        <Link href="/admin" className="inline-flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: "var(--c-danger)", boxShadow: "0 10px 24px rgba(220, 38, 38, 0.18)" }}
          >
            <Shield className="h-5 w-5 text-white" />
          </span>
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
              Superadmin
            </span>
            <span className="block text-lg font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
              Control Panel
            </span>
          </span>
        </Link>
      </div>

      <div className="px-6 py-5">
        <div className="space-y-3 border-b pb-5" style={{ borderColor: "var(--c-border)" }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
              Operatore
            </p>
            <p className="mt-2 text-base font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
              {userName}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Control Plane
        </p>
      </div>

      <nav className="px-4 pb-6">
        {navItems.map((item) => {
          const active = isActiveNavItem(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="mb-1.5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition"
              style={{
                background: active ? "var(--c-bg-2)" : "transparent",
                color: active ? "var(--c-text-0)" : "var(--c-text-1)",
                border: active ? "1px solid var(--c-border-light)" : "1px solid transparent",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: active ? "var(--c-danger)" : "var(--c-text-2)" }} />
              <span className="flex-1">{item.label}</span>
              {active ? <ChevronRight className="h-4 w-4" style={{ color: "var(--c-text-2)" }} /> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
