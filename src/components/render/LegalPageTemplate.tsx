import type { ResolvedCompliancePage } from "@/lib/legal/public-compliance";

interface Props {
  page: ResolvedCompliancePage;
  siteName: string;
}

function renderBlock(block: string, index: number) {
  const trimmed = block.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("### ")) {
    return (
      <h3 key={index} style={{ margin: "0 0 14px", fontSize: "1.15rem", lineHeight: 1.3, color: "var(--e-color-text)" }}>
        {trimmed.slice(4)}
      </h3>
    );
  }

  if (trimmed.startsWith("## ")) {
    return (
      <h2 key={index} style={{ margin: "24px 0 14px", fontSize: "1.45rem", lineHeight: 1.25, color: "var(--e-color-text)" }}>
        {trimmed.slice(3)}
      </h2>
    );
  }

  if (trimmed.startsWith("# ")) {
    return (
      <h1 key={index} style={{ margin: "0 0 16px", fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1, color: "var(--e-color-text)" }}>
        {trimmed.slice(2)}
      </h1>
    );
  }

  const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
    return (
      <ul key={index} style={{ margin: "0 0 18px", paddingLeft: "20px", color: "var(--e-color-textSecondary)", lineHeight: 1.8 }}>
        {lines.map((line, itemIndex) => (
          <li key={itemIndex}>{line.slice(2)}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={index} style={{ margin: "0 0 18px", color: "var(--e-color-textSecondary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
      {trimmed}
    </p>
  );
}

export function LegalPageTemplate({ page, siteName }: Props) {
  const blocks = page.content.split(/\n{2,}/g).map((block) => block.trim()).filter(Boolean);

  return (
    <article style={{ maxWidth: "880px", margin: "0 auto", padding: "48px 0 64px" }}>
      <header style={{ borderBottom: "1px solid var(--e-color-border, #dee2e6)", paddingBottom: "20px", marginBottom: "28px" }}>
        <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--e-color-accent, #0f766e)" }}>
          Compliance Center
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1, color: "var(--e-color-text)" }}>
          {page.title}
        </h1>
        <p style={{ margin: "14px 0 0", color: "var(--e-color-textSecondary)", lineHeight: 1.7 }}>
          {page.summary || `Documentazione legale di ${siteName}`}
        </p>
        <p style={{ margin: "10px 0 0", fontSize: "13px", color: "var(--e-color-textSecondary)" }}>
          Ultimo aggiornamento: {new Date(page.updatedAt).toLocaleDateString("it-IT")}
        </p>
      </header>

      <section>
        {blocks.map((block, index) => renderBlock(block, index))}
      </section>
    </article>
  );
}
