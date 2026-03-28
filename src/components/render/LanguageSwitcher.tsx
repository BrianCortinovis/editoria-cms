"use client";

interface LanguageSwitcherProps {
  currentLang: string;
  translations: { lang: string; href: string; label: string }[];
}

const LANG_LABELS: Record<string, string> = {
  it: "IT", en: "EN", de: "DE", fr: "FR", es: "ES", pt: "PT",
  nl: "NL", pl: "PL", ro: "RO", hr: "HR", sl: "SL",
};

export function LanguageSwitcher({ currentLang, translations }: LanguageSwitcherProps) {
  if (translations.length === 0) return null;

  return (
    <nav aria-label="Language" className="inline-flex items-center gap-1 text-sm">
      <span className="font-semibold uppercase" style={{ color: 'var(--c-text-0, #111)' }}>
        {LANG_LABELS[currentLang] || currentLang.toUpperCase()}
      </span>
      {translations.map((t) => (
        <a
          key={t.lang}
          href={t.href}
          hrefLang={t.lang}
          className="uppercase px-1.5 py-0.5 rounded hover:underline"
          style={{ color: 'var(--c-text-2, #666)' }}
        >
          {LANG_LABELS[t.lang] || t.lang.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
