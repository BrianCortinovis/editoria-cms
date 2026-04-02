"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  CreditCard,
  Globe,
  LayoutDashboard,
  Lock,
  PlusCircle,
  ChevronRight,
  Puzzle,
  Share2,
  Sparkles,
  UserCircle2,
  Users,
} from "lucide-react";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/app", label: "Overview", icon: LayoutDashboard },
      { href: "/app/sites", label: "Siti", icon: Globe },
      { href: "/app/sites/new", label: "Nuovo Sito", icon: PlusCircle },
    ],
  },
  {
    label: "Profilo",
    items: [
      { href: "/app/profile", label: "Account", icon: UserCircle2 },
      { href: "/app/profile/site", label: "Sito & SEO", icon: Globe },
      { href: "/app/profile/social", label: "Social & API", icon: Share2 },
      { href: "/app/profile/ai", label: "IA & API", icon: Bot },
      { href: "/app/profile/modules", label: "Moduli", icon: Puzzle },
      { href: "/app/profile/team", label: "Team", icon: Users },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/app/security", label: "Sicurezza", icon: Lock },
      { href: "/app/notifications", label: "Notifiche", icon: Bell },
      { href: "/app/billing", label: "Billing", icon: CreditCard },
    ],
  },
];

function isActiveNavItem(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformNav({
  userName,
  unreadCount,
}: {
  userName: string;
  unreadCount: number;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="platform-sidebar w-full lg:w-[292px] lg:min-h-screen lg:sticky lg:top-0"
    >
      <div className="border-b px-6 py-7" style={{ borderColor: "var(--c-border)" }}>
        <Link href="/" className="inline-flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: "var(--c-accent)",
              boxShadow: "0 10px 24px rgba(37, 99, 235, 0.16)",
            }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
              Platform App
            </span>
            <span className="block text-lg font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
              Editoria Cloud
            </span>
          </span>
        </Link>
      </div>

      <div className="px-6 py-5">
        <div className="space-y-3 border-b pb-5" style={{ borderColor: "var(--c-border)" }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
              Account
            </p>
            <p className="mt-2 text-base font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
              {userName}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--c-text-2)" }}>
            <span className="inline-flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Workspace
            </span>
            <strong style={{ color: unreadCount > 0 ? "var(--c-accent)" : "var(--c-text-0)" }}>
              {unreadCount > 0 ? `${unreadCount} notifiche` : "Pronto"}
            </strong>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-6">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-2 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
                {group.label}
              </p>
            </div>
            {group.items.map((item) => {
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
                  <Icon className="h-4 w-4" style={{ color: active ? "var(--c-accent-hover)" : "var(--c-text-2)" }} />
                  <span className="flex-1">{item.label}</span>
                  {active ? <ChevronRight className="h-4 w-4" style={{ color: "var(--c-text-2)" }} /> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
