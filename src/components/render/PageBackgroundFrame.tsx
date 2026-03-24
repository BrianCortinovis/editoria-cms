import type { ReactNode } from "react";
import { extractPageBackgroundSettings, getPageBackgroundCustomCss, getPageBackgroundFrameStyle, getPageBackgroundImages } from "@/lib/page-settings";

interface PageBackgroundFrameProps {
  meta?: Record<string, unknown> | null;
  scopeId: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PageBackgroundFrame({ meta, scopeId, children, className, style }: PageBackgroundFrameProps) {
  const settings = extractPageBackgroundSettings(meta);
  const frameStyle = getPageBackgroundFrameStyle(settings);
  const slideshowImages = getPageBackgroundImages(settings);
  const scopedCss = getPageBackgroundCustomCss(scopeId, settings);
  const perSlideDuration = Math.max(settings.slideshowDurationMs / Math.max(slideshowImages.length, 1), 3000);

  return (
    <div
      data-page-bg-scope={scopeId}
      className={className}
      style={{ ...frameStyle, ...style }}
    >
      {settings.type === "slideshow" && slideshowImages.length > 0 && (
        <>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
            {slideshowImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url("${image}")`,
                  backgroundSize: settings.size,
                  backgroundPosition: settings.position,
                  backgroundRepeat: settings.repeat,
                  opacity: 0,
                  animation: `page-bg-fade ${settings.slideshowDurationMs}ms linear infinite`,
                  animationDelay: `${index * perSlideDuration}ms`,
                }}
              />
            ))}
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes page-bg-fade {
                  0% { opacity: 0; }
                  6% { opacity: 1; }
                  28% { opacity: 1; }
                  34% { opacity: 0; }
                  100% { opacity: 0; }
                }
              `,
            }}
          />
        </>
      )}
      {settings.overlay && (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: settings.overlay, zIndex: 0 }}
        />
      )}
      {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
      <div style={{ position: "relative", zIndex: 1, minHeight: "inherit" }}>{children}</div>
    </div>
  );
}
