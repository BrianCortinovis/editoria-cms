import { CreateSiteForm } from "@/components/platform/CreateSiteForm";
import { getPlatformSitesForUser, requirePlatformUser } from "@/lib/platform/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const { user } = await requirePlatformUser();
  const sites = await getPlatformSitesForUser(user.id);

  if (sites.length > 0) {
    redirect("/app");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
      <section className="rounded-[2rem] border p-7" style={{ borderColor: "var(--c-border)", background: "linear-gradient(135deg, rgba(124,138,170,0.12) 0%, rgba(28,28,31,1) 55%)" }}>
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--c-text-2)" }}>
          Onboarding
        </p>
        <h2 className="mt-3 text-3xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          La tua dashboard e` pronta. Ora creiamo il primo sito.
        </h2>
      </section>
      <section className="rounded-[2rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <CreateSiteForm />
      </section>
    </div>
  );
}
