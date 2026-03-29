"use client";

import { Layout, FileText, Building2, Plus } from "lucide-react";
import { PAGE_TEMPLATES } from "@/lib/templates/page-templates";
import type { Block } from "@/lib/types/block";

interface Props {
  onSelect: (blocks: Block[]) => void;
  onSkip: () => void;
}

const CATEGORY_META = {
  editorial: { label: "Editoriale", Icon: FileText, color: "#c0392b" },
  business:  { label: "Business",   Icon: Building2, color: "#2980b9" },
  generic:   { label: "Generico",   Icon: Layout,    color: "#7f8c8d" },
} as const;

export default function PageTemplateSelector({ onSelect, onSkip }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "var(--c-bg-1)",
          border: "1px solid var(--c-border)",
          borderRadius: "12px",
          width: "min(960px, 92vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px 16px",
            borderBottom: "1px solid var(--c-border)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--c-text-0)",
            }}
          >
            Scegli un template di pagina
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "var(--c-text-2)",
            }}
          >
            Parti da una struttura pronta oppure inizia con una pagina vuota.
          </p>
        </div>

        {/* Template grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 28px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "14px",
            alignContent: "start",
          }}
        >
          {PAGE_TEMPLATES.map((tpl) => {
            const meta = CATEGORY_META[tpl.category];
            const Icon = meta.Icon;

            return (
              <div
                key={tpl.id}
                style={{
                  background: "var(--c-bg-0)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--c-accent)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 0 0 2px color-mix(in srgb, var(--c-accent) 20%, transparent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--c-border)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                {/* Colour preview bar */}
                <div
                  style={{
                    height: "6px",
                    background: tpl.previewColor,
                    flexShrink: 0,
                  }}
                />

                {/* Card body */}
                <div style={{ padding: "14px 16px 12px", flex: 1 }}>
                  {/* Category badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      background: `${meta.color}18`,
                      color: meta.color,
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    <Icon size={10} />
                    {meta.label}
                  </div>

                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--c-text-0)",
                      lineHeight: 1.3,
                    }}
                  >
                    {tpl.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "var(--c-text-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {tpl.description}
                  </p>

                  {/* Block count hint */}
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "11px",
                      color: "var(--c-text-3, var(--c-text-2))",
                    }}
                  >
                    {tpl.blocks.length} blocchi
                  </p>
                </div>

                {/* CTA */}
                <div style={{ padding: "0 16px 14px", flexShrink: 0 }}>
                  <button
                    onClick={() => onSelect(tpl.blocks)}
                    style={{
                      width: "100%",
                      padding: "7px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--c-accent)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
                    }
                  >
                    Usa template
                  </button>
                </div>
              </div>
            );
          })}

          {/* Blank page card */}
          <div
            style={{
              background: "var(--c-bg-0)",
              border: "1px dashed var(--c-border)",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 16px",
              gap: "10px",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onClick={onSkip}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--c-accent)";
              (e.currentTarget as HTMLDivElement).style.background =
                "color-mix(in srgb, var(--c-accent) 5%, var(--c-bg-0))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--c-border)";
              (e.currentTarget as HTMLDivElement).style.background =
                "var(--c-bg-0)";
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1.5px dashed var(--c-text-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--c-text-2)",
              }}
            >
              <Plus size={18} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--c-text-1)",
              }}
            >
              Pagina vuota
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "var(--c-text-2)",
                textAlign: "center",
              }}
            >
              Inizia da zero senza blocchi predefiniti
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
