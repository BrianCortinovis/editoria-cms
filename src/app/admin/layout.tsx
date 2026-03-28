import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireSuperAdmin } from "@/lib/superadmin/service";

const SuperadminAiChat = dynamic(
  () => import("@/components/admin/SuperadminAiChat"),
  { ssr: false }
);

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await requireSuperAdmin();
  const userName =
    profile?.first_name ||
    profile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Superadmin";

  return (
    <div className="platform-shell min-h-screen lg:flex">
      <AdminNav userName={userName} />
      <div className="flex-1">
        <div className="platform-topbar border-b px-6 py-4" style={{ borderColor: "var(--c-border)" }}>
          <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
                Control Plane
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
                Superadmin
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)", background: "var(--c-bg-1)" }}
              >
                Torna alla Platform
              </Link>
              <Link
                href="/dashboard/cms"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition"
                style={{ background: "var(--c-danger)" }}
              >
                Apri CMS
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
      <SuperadminAiChat />
    </div>
  );
}
