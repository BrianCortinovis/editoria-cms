"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronDown, FoldVertical, HelpCircle, UnfoldVertical, X } from "lucide-react";

export interface GuideSheetSection {
  id: string;
  label: string;
  title: string;
  body: string[];
  bullets?: string[];
  note?: string;
}

export interface GuideSheetLink {
  href: string;
  label: string;
}

export function GuideSheet({
  eyebrow,
  title,
  intro,
  icon: Icon,
  summary,
  sections,
  links = [],
}: {
  eyebrow: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  summary: string[];
  sections: GuideSheetSection[];
  links?: GuideSheetLink[];
}) {
  const initialOpenState = useMemo(
    () => Object.fromEntries(sections.map((section, index) => [section.id, index < 2])),
    [sections]
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpenState);
  const [isOpen, setIsOpen] = useState(false);

  const expandAll = () => {
    setOpenSections(Object.fromEntries(sections.map((section) => [section.id, true])));
  };

  const collapseAll = () => {
    setOpenSections(Object.fromEntries(sections.map((section) => [section.id, false])));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  return (
    <>
      <div className="-mt-3 mb-0 flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative -top-1 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-80"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-1)" }}
          aria-label={`Apri guida: ${title}`}
        >
          <HelpCircle className="h-4 w-4" />
          Guida
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 h-full w-full"
            style={{ background: "rgba(15, 23, 42, 0.52)" }}
            onClick={() => setIsOpen(false)}
            aria-label="Chiudi guida"
          />

          <div className="absolute inset-x-3 top-3 bottom-3 mx-auto max-w-5xl overflow-hidden rounded-[28px] border shadow-2xl" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}>
            <div className="flex h-full flex-col">
              <header className="border-b px-5 py-4 sm:px-7" style={{ borderColor: "var(--c-border)" }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <div
                      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]"
                      style={{ color: "var(--c-text-3)" }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {eyebrow}
                    </div>
                    <h1 className="mt-3 text-[1.7rem] font-semibold leading-tight" style={{ color: "var(--c-text-0)" }}>
                      {title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
                      {intro}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {links.length > 0 ? (
                      <div className="hidden flex-wrap gap-3 text-sm md:flex">
                        {links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="inline-flex items-center gap-2 font-medium transition-opacity hover:opacity-70"
                            style={{ color: "var(--c-accent)" }}
                            onClick={() => setIsOpen(false)}
                          >
                            {link.label}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center justify-center rounded-full border p-2 transition-opacity hover:opacity-80"
                      style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)" }}
                      aria-label="Chiudi guida"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <section className="border-b pb-5" style={{ borderColor: "var(--c-border)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--c-text-3)" }}>
                      Sommario
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={expandAll}
                        className="inline-flex items-center gap-2 font-medium transition-opacity hover:opacity-70"
                        style={{ color: "var(--c-text-1)" }}
                      >
                        <UnfoldVertical className="h-4 w-4" />
                        Espandi tutto
                      </button>
                      <button
                        type="button"
                        onClick={collapseAll}
                        className="inline-flex items-center gap-2 font-medium transition-opacity hover:opacity-70"
                        style={{ color: "var(--c-text-1)" }}
                      >
                        <FoldVertical className="h-4 w-4" />
                        Riduci tutto
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                        style={{ color: "var(--c-text-1)" }}
                      >
                        {section.label}
                      </a>
                    ))}
                  </div>

                  {summary.length > 0 ? (
                    <ul className="mt-5 grid gap-2 md:grid-cols-2">
                      {summary.map((item) => (
                        <li key={item} className="list-none text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
                          <span style={{ color: "var(--c-text-3)" }}>• </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>

                <article className="py-6">
                  <div className="space-y-1">
                    {sections.map((section) => {
                      const sectionIsOpen = openSections[section.id] ?? false;

                      return (
                        <details
                          key={section.id}
                          id={section.id}
                          open={sectionIsOpen}
                          className="border-b py-4"
                          style={{ borderColor: "var(--c-border)" }}
                        >
                          <summary
                            className="flex cursor-pointer list-none items-start justify-between gap-4"
                            onClick={(event) => {
                              event.preventDefault();
                              toggleSection(section.id);
                            }}
                          >
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--c-text-3)" }}>
                                {section.label}
                              </div>
                              <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
                                {section.title}
                              </h2>
                            </div>
                            <ChevronDown
                              className={`mt-1 h-5 w-5 shrink-0 transition-transform ${sectionIsOpen ? "rotate-180" : ""}`}
                              style={{ color: "var(--c-text-3)" }}
                            />
                          </summary>

                          <div className="mt-5 space-y-4">
                            {section.body.map((paragraph) => (
                              <p key={paragraph} className="text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
                                {paragraph}
                              </p>
                            ))}

                            {section.bullets && section.bullets.length > 0 ? (
                              <ul className="space-y-2 pl-0">
                                {section.bullets.map((bullet) => (
                                  <li key={bullet} className="list-none text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
                                    <span style={{ color: "var(--c-text-3)" }}>• </span>
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            ) : null}

                            {section.note ? (
                              <p
                                className="border-l pl-4 text-sm leading-7 italic"
                                style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}
                              >
                                {section.note}
                              </p>
                            ) : null}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
