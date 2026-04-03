"use client";

interface SeoSerpPreviewProps {
  title: string;
  description: string;
  url: string;
  eyebrow?: string;
}

export function SeoSerpPreview({
  title,
  description,
  url,
  eyebrow = "Anteprima Google",
}: SeoSerpPreviewProps) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--c-text-2)" }}
      >
        {eyebrow}
      </p>
      <div className="mt-3 space-y-1.5">
        <div
          className="text-sm font-medium"
          style={{ color: "#1a0dab", lineHeight: 1.35 }}
        >
          {title || "Titolo SEO non impostato"}
        </div>
        <div className="text-xs" style={{ color: "#188038" }}>
          {url || "https://example.com/percorso"}
        </div>
        <p className="text-sm leading-6" style={{ color: "#4d5156" }}>
          {description || "La meta description comparira' qui quando verra' compilata nel CMS."}
        </p>
      </div>
    </div>
  );
}
