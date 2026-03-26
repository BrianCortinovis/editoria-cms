import Link from "next/link";
import { ArrowRight, LayoutTemplate, Newspaper } from "lucide-react";
import { BlockRenderer } from "@/components/render/BlockRenderer";
import { DASHBOARD_TEMPLATE_LIBRARY, TEMPLATE_CATEGORIES } from "@/lib/templates/dashboard-template-library";
import { DashboardTemplateActions } from "@/components/templates/DashboardTemplateActions";

function TemplatePreview({
  blocks,
  previewScale,
  previewHeight,
}: {
  blocks: Parameters<typeof BlockRenderer>[0]["blocks"];
  previewScale: number;
  previewHeight: number;
}) {
  const canvasWidth = 1360;

  return (
    <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-100 p-3">
      <div
        className="mx-auto overflow-hidden rounded-[22px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
        style={{
          width: `${canvasWidth * previewScale}px`,
          height: `${previewHeight}px`,
        }}
      >
        <div
          style={{
            width: `${canvasWidth}px`,
            transform: `scale(${previewScale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        >
          <BlockRenderer blocks={blocks} tenantId="template-preview" tenantSlug="template-preview" />
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Template CMS reali
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                Template completi fatti davvero con i blocchi dell&apos;editor
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                Qui non ci sono mock o disegni finti. Ogni preview è una vera pagina composta con il
                motore del CMS: navigation, hero, slideshow, gallery, banner, social, mappe, quote,
                CTA, footer e moduli editoriali. La libreria ora è divisa in 10 template editoriali e
                10 template portfolio, ispirati ai pattern migliori dei temi WordPress moderni e dei
                portfolio modulari stile Squarespace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Template veri</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-950">{DASHBOARD_TEMPLATE_LIBRARY.length}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Categorie</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-950">{TEMPLATE_CATEGORIES.length}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Uso</div>
                <div className="mt-1 text-sm font-medium text-zinc-950">brief, layout, editor, demo cliente</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {["Newsroom", "Video", "Corporate", "Lifestyle"].map((label, index) => (
              <div
                key={label}
                className="rounded-[24px] border border-zinc-200 p-4 text-white shadow-sm"
                style={{
                  background:
                    index === 0
                      ? "linear-gradient(145deg, #0f172a 0%, #2563eb 100%)"
                      : index === 1
                        ? "linear-gradient(145deg, #111827 0%, #ef4444 100%)"
                        : index === 2
                          ? "linear-gradient(145deg, #1f2937 0%, #14b8a6 100%)"
                          : "linear-gradient(145deg, #111111 0%, #ec4899 100%)",
                }}
              >
                <div className="mb-8 inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]">
                  {label}
                </div>
                <div className="text-sm font-semibold">Template fatti col renderer del CMS</div>
                <div className="mt-1 text-xs text-white/80">
                  Ogni preview è una pagina vera costruita con blocchi reali.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {TEMPLATE_CATEGORIES.map((category) => {
        const templates = DASHBOARD_TEMPLATE_LIBRARY.filter((template) => template.category === category);

        return (
          <section
            key={category}
            className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  <Newspaper className="h-3.5 w-3.5" />
                  {category}
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                  Template {category.toLowerCase()}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                  Layout completi molto diversi tra loro, utili per partire da una direzione visiva
                  già credibile e poi rifinirla dentro `Layout` o `Editor`. I portfolio sono più
                  modulari e case-study driven; gli editoriali spingono gerarchia, news blocks,
                  side rail, video strips e homepage redazionali.
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <TemplatePreview
                    blocks={template.blocks}
                    previewScale={template.previewScale}
                    previewHeight={template.previewHeight}
                  />

                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                        {template.category}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                        {template.audience}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-zinc-950">{template.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">{template.description}</p>
                    </div>

                    <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Mood
                      </div>
                      <div className="text-sm text-zinc-700">{template.mood}</div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Blocchi chiave
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {template.blocksSummary.map((block) => (
                          <span
                            key={block}
                            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
                          >
                            {block}
                          </span>
                        ))}
                      </div>
                    </div>

                    <DashboardTemplateActions
                      templateId={template.id}
                      templateName={template.name}
                      templateDescription={template.description}
                      blocks={template.blocks}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="rounded-[24px] border border-zinc-200 bg-gradient-to-r from-zinc-950 to-zinc-800 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Template reali CMS
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">
              Scegli qui la base giusta, poi portala in Layout o nell&apos;Editor
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Ogni template che vedi in questa libreria è una pagina vera costruita con blocchi reali,
              quindi la direzione creativa che scegli qui è già coerente con il motore del CMS.
            </p>
          </div>
          <Link
            href="/dashboard/layout"
            className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
          >
            Vai al Layout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
