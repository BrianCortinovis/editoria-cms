import { ProfileSettingsForm } from "@/components/platform/ProfileSettingsForm";
import { requirePlatformUser } from "@/lib/platform/server";
import Link from "next/link";
import { Bot, Globe, Puzzle, Share2, Users } from "lucide-react";

export default async function ProfilePage() {
  const { profile, user } = await requirePlatformUser();

  return (
    <div className="space-y-6">
      <section className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Account
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Profilo account
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Gestisci le informazioni personali del tuo account. Setup tenant e configurazioni platform ora sono divisi in sezioni dedicate nella sidebar.
        </p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { href: "/app/profile/site", label: "Sito & SEO", icon: Globe },
          { href: "/app/profile/social", label: "Social & API", icon: Share2 },
          { href: "/app/profile/ai", label: "IA & API", icon: Bot },
          { href: "/app/profile/modules", label: "Moduli", icon: Puzzle },
          { href: "/app/profile/team", label: "Team", icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border p-4 transition"
              style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: "var(--c-bg-2)", color: "var(--c-accent)" }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                    {item.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
                    Apri sezione dedicata
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
      <section className="border-y py-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="mb-4 text-sm" style={{ color: "var(--c-text-1)" }}>
          Email di login: <strong style={{ color: "var(--c-text-0)" }}>{user.email}</strong>
        </p>
        <ProfileSettingsForm profile={profile || null} />
      </section>
    </div>
  );
}
