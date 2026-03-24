import type { CSSProperties } from "react";
import { sanitizeCss, sanitizeExternalUrl } from "@/lib/security/html";

export type PageBackgroundType = "none" | "color" | "gradient" | "image" | "slideshow" | "custom-css";

export interface PageBackgroundSettings {
  type: PageBackgroundType;
  value: string;
  images: string[];
  overlay: string;
  size: string;
  position: string;
  repeat: string;
  fixed: boolean;
  customCss: string;
  minHeight: string;
  slideshowDurationMs: number;
}

export interface EditorPageMeta {
  builder?: {
    pageBackground?: Partial<PageBackgroundSettings>;
  };
  [key: string]: unknown;
}

export const DEFAULT_PAGE_BACKGROUND: PageBackgroundSettings = {
  type: "none",
  value: "",
  images: [],
  overlay: "",
  size: "cover",
  position: "center",
  repeat: "no-repeat",
  fixed: false,
  customCss: "",
  minHeight: "100%",
  slideshowDurationMs: 16000,
};

export function extractPageBackgroundSettings(meta: Record<string, unknown> | null | undefined): PageBackgroundSettings {
  const builder = (meta?.builder as Record<string, unknown> | undefined) || {};
  const raw = (builder.pageBackground as Partial<PageBackgroundSettings> | undefined) || {};
  const images = Array.isArray(raw.images)
    ? raw.images.map((item) => sanitizeExternalUrl(String(item || "")) || "").filter(Boolean)
    : [];

  return {
    type: isValidBackgroundType(raw.type) ? raw.type : DEFAULT_PAGE_BACKGROUND.type,
    value: normalizeBackgroundValue(raw.type, raw.value),
    images,
    overlay: typeof raw.overlay === "string" ? raw.overlay : DEFAULT_PAGE_BACKGROUND.overlay,
    size: typeof raw.size === "string" && raw.size ? raw.size : DEFAULT_PAGE_BACKGROUND.size,
    position: typeof raw.position === "string" && raw.position ? raw.position : DEFAULT_PAGE_BACKGROUND.position,
    repeat: typeof raw.repeat === "string" && raw.repeat ? raw.repeat : DEFAULT_PAGE_BACKGROUND.repeat,
    fixed: Boolean(raw.fixed),
    customCss: sanitizeCss(typeof raw.customCss === "string" ? raw.customCss : ""),
    minHeight: typeof raw.minHeight === "string" && raw.minHeight ? raw.minHeight : DEFAULT_PAGE_BACKGROUND.minHeight,
    slideshowDurationMs: typeof raw.slideshowDurationMs === "number" && raw.slideshowDurationMs >= 4000
      ? raw.slideshowDurationMs
      : DEFAULT_PAGE_BACKGROUND.slideshowDurationMs,
  };
}

export function upsertPageBackgroundMeta(
  meta: Record<string, unknown> | null | undefined,
  settings: Partial<PageBackgroundSettings>
) {
  const current = extractPageBackgroundSettings(meta);
  const next = {
    ...current,
    ...settings,
    value: normalizeBackgroundValue(settings.type ?? current.type, settings.value ?? current.value),
    images: Array.isArray(settings.images)
      ? settings.images.map((item) => sanitizeExternalUrl(String(item || "")) || "").filter(Boolean)
      : current.images,
    customCss: sanitizeCss(settings.customCss ?? current.customCss),
  };

  return {
    ...(meta || {}),
    builder: {
      ...(((meta || {}) as EditorPageMeta).builder || {}),
      pageBackground: next,
    },
  };
}

export function getPageBackgroundFrameStyle(settings: PageBackgroundSettings): CSSProperties {
  const style: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    minHeight: settings.minHeight || "100%",
  };

  if (settings.type === "color") {
    style.background = settings.value || "#ffffff";
  } else if (settings.type === "gradient") {
    style.backgroundImage = settings.value;
  } else if (settings.type === "image") {
    const safeUrl = sanitizeExternalUrl(settings.value);
    if (safeUrl) {
      style.backgroundImage = `url("${safeUrl}")`;
      style.backgroundSize = settings.size;
      style.backgroundPosition = settings.position;
      style.backgroundRepeat = settings.repeat;
      if (settings.fixed) {
        style.backgroundAttachment = "fixed";
      }
    }
  }

  return style;
}

export function getPageBackgroundCustomCss(scopeId: string, settings: PageBackgroundSettings) {
  if (settings.type !== "custom-css" || !settings.customCss.trim()) {
    return "";
  }

  return sanitizeCss(settings.customCss).replace(/:scope/g, `[data-page-bg-scope="${scopeId}"]`);
}

export function getPageBackgroundImages(settings: PageBackgroundSettings) {
  if (settings.type !== "slideshow") {
    return [];
  }

  return settings.images.map((item) => sanitizeExternalUrl(item)).filter((item): item is string => Boolean(item));
}

function isValidBackgroundType(value: unknown): value is PageBackgroundType {
  return ["none", "color", "gradient", "image", "slideshow", "custom-css"].includes(String(value || ""));
}

function normalizeBackgroundValue(type: unknown, value: unknown) {
  if (type === "image") {
    return sanitizeExternalUrl(typeof value === "string" ? value : "") || "";
  }
  return typeof value === "string" ? value : "";
}
