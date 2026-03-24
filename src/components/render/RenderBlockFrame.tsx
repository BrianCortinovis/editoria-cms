import type { Block, BlockAnimation, BlockStyle } from '@/lib/types/block';
import { generateDividerSvg } from '@/lib/shapes/dividers';
import { buildCssGradient, buildAnimatedGradientKeyframes } from '@/lib/shapes/gradients';
import { sanitizeCss } from '@/lib/security/html';

interface Props {
  block: Block;
  style: React.CSSProperties;
  children: React.ReactNode;
}

function createAnimationAttrs(animation: BlockAnimation | null) {
  if (!animation) {
    return {};
  }

  return {
    'data-animate': animation.trigger,
    'data-effect': animation.effect,
    'data-duration': animation.duration,
    'data-delay': animation.delay,
    'data-easing': animation.easing,
  };
}

function createGradientAttrs(block: Block) {
  const gradient = block.style.background.advancedGradient;
  if (!gradient?.scrollDriven) {
    return {};
  }

  return {
    'data-scroll-gradient': 'true',
    'data-gradient-config': JSON.stringify({
      type: gradient.type,
      startAngle: gradient.angle ?? 0,
      endAngle: (gradient.angle ?? 0) + 180,
      stops: gradient.stops,
    }),
  };
}

function buildWrapperStyle(block: Block, style: React.CSSProperties) {
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
  };

  if (style.filter) wrapperStyle.filter = style.filter;
  if (style.backdropFilter) wrapperStyle.backdropFilter = style.backdropFilter;
  if ((style as Record<string, unknown>).WebkitBackdropFilter) {
    (wrapperStyle as Record<string, unknown>).WebkitBackdropFilter = (style as Record<string, unknown>).WebkitBackdropFilter;
  }
  if (style.mixBlendMode) wrapperStyle.mixBlendMode = style.mixBlendMode;
  if (block.shape?.type === 'clip-path' && block.shape.value && block.shape.value !== 'none') {
    wrapperStyle.clipPath = block.shape.value;
    (wrapperStyle as Record<string, unknown>).WebkitClipPath = block.shape.value;
    wrapperStyle.overflow = 'hidden';
  }

  return wrapperStyle;
}

function buildScopedCss(block: Block, style: BlockStyle) {
  const cssParts: string[] = [];
  const animationStartState: Record<string, string> = {
    'fade-in': 'opacity: 0;',
    'slide-up': 'opacity: 0; transform: translateY(40px);',
    'slide-down': 'opacity: 0; transform: translateY(-40px);',
    'slide-left': 'opacity: 0; transform: translateX(40px);',
    'slide-right': 'opacity: 0; transform: translateX(-40px);',
    'zoom-in': 'opacity: 0; transform: scale(0.92);',
    'zoom-out': 'opacity: 0; transform: scale(1.08);',
    rotate: 'opacity: 0; transform: rotate(-6deg);',
    bounce: 'opacity: 0; transform: translateY(24px);',
    flip: 'opacity: 0; transform: rotateY(90deg);',
    none: 'opacity: 1;',
  };

  if (style.customCss) {
    cssParts.push(
      `#block-${block.id} {\n${sanitizeCss(style.customCss)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n')}\n}`
    );
  }

  if (style.effects?.noise?.enabled) {
    cssParts.push(`
#block-${block.id}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${style.effects.noise.opacity};
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0, transparent 35%),
    radial-gradient(circle at 80% 30%, rgba(0,0,0,0.12) 0, transparent 35%),
    radial-gradient(circle at 40% 80%, rgba(255,255,255,0.12) 0, transparent 25%);
  mix-blend-mode: overlay;
}
    `.trim());
  }

  if (style.effects?.grain?.enabled) {
    cssParts.push(`
#block-${block.id}::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: ${style.effects.grain.opacity};
  background-image: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.05) 0,
    rgba(0,0,0,0.05) ${Math.max(style.effects.grain.size, 1)}px,
    transparent ${Math.max(style.effects.grain.size, 1)}px,
    transparent ${Math.max(style.effects.grain.size * 2, 2)}px
  );
}
    `.trim());
  }

  if (style.background.advancedGradient) {
    cssParts.push(`#block-${block.id}{background-image:${buildCssGradient(style.background.advancedGradient)};}`);

    const animationCss = buildAnimatedGradientKeyframes(`block-${block.id}`, style.background.advancedGradient);
    if (animationCss) {
      cssParts.push(animationCss);
    }

    if (style.background.advancedGradient.hoverDriven) {
      cssParts.push(
        `#block-${block.id}:hover{background-image:${buildCssGradient({
          ...style.background.advancedGradient,
          angle: (style.background.advancedGradient.angle ?? 0) + 90,
          animated: false,
        })};}`
      );
    }
  }

  if (!block.animation) {
    return cssParts.join('\n');
  }

  const duration = `${block.animation.duration}ms`;
  const delay = `${block.animation.delay}ms`;
  const easing = block.animation.easing || 'ease-out';
  const effect = block.animation.effect;
  const effectName = effect === 'none' ? 'fade-in' : effect;

  if (block.animation.trigger === 'entrance' || block.animation.trigger === 'scroll') {
    cssParts.push(`#block-${block.id}{${animationStartState[effect] || animationStartState['fade-in']}}`);
  } else if (block.animation.trigger === 'hover') {
    cssParts.push(`#block-${block.id}:hover{animation:${effectName} ${duration} ${easing} ${delay} both;}`);
  }

  return cssParts.join('\n');
}

export function RenderBlockFrame({ block, style, children }: Props) {
  const wrapperStyle = buildWrapperStyle(block, style);
  const scopedCss = buildScopedCss(block, block.style);

  return (
    <>
      {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
      {block.shape?.topDivider && (
        <div
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: generateDividerSvg(
              block.shape.topDivider.shape,
              1440,
              block.shape.topDivider.height,
              block.shape.topDivider.color,
              block.shape.topDivider.flip,
              block.shape.topDivider.invert,
              block.shape.topDivider.opacity ?? 1
            ),
          }}
        />
      )}
      <div
        id={`block-${block.id}`}
        style={wrapperStyle}
        data-block-wrapper={block.type}
        {...createAnimationAttrs(block.animation)}
        {...createGradientAttrs(block)}
      >
        {children}
      </div>
      {block.shape?.bottomDivider && (
        <div
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: generateDividerSvg(
              block.shape.bottomDivider.shape,
              1440,
              block.shape.bottomDivider.height,
              block.shape.bottomDivider.color,
              block.shape.bottomDivider.flip,
              block.shape.bottomDivider.invert,
              block.shape.bottomDivider.opacity ?? 1
            ),
          }}
        />
      )}
    </>
  );
}
