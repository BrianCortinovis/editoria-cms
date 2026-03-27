import { ProfileSettingsForm } from "@/components/platform/ProfileSettingsForm";
import { requirePlatformUser } from "@/lib/platform/server";

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
          Gestisci le informazioni platform-level del tuo account. L&apos;email di login resta {user.email}.
        </p>
      </section>
      <section className="border-y py-4" style={{ borderColor: "var(--c-border)" }}>
        <ProfileSettingsForm profile={profile || null} />
      </section>
      </div>
  );
}
