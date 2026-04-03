'use client';

import { useEffect } from 'react';
import { CookieConsentManager } from '@/components/render/CookieConsentManager';
import { initializeAnimations } from '@/lib/runtime/animations';
import { buildCssGradient } from '@/lib/shapes/gradients';
import type { AdvancedGradient } from '@/lib/types';

interface ScrollGradientPayload {
  type: AdvancedGradient['type'];
  startAngle: number;
  endAngle: number;
  stops: AdvancedGradient['stops'];
}

function initializeScrollGradients() {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-gradient="true"]'));
  if (elements.length === 0) {
    return () => {};
  }

  const parsed = elements
    .map((element) => {
      const raw = element.dataset.gradientConfig;
      if (!raw) return null;
      try {
        const payload = JSON.parse(raw) as ScrollGradientPayload;
        return { element, payload };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is { element: HTMLElement; payload: ScrollGradientPayload } => Boolean(entry));

  const onScroll = () => {
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = window.scrollY / scrollable;

    parsed.forEach(({ element, payload }) => {
      const angle = payload.startAngle + (payload.endAngle - payload.startAngle) * progress;
      element.style.backgroundImage = buildCssGradient({
        type: payload.type,
        angle,
        stops: payload.stops,
        animated: false,
      });
    });
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}

interface Props {
  tenantSlug?: string;
  siteName?: string;
  analyticsId?: string;
  tagManagerId?: string;
  adsenseId?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  customMarketingScriptUrl?: string;
  customMarketingInlineScript?: string;
  forceCookieBanner?: boolean;
}

export function PublicSiteRuntime({
  tenantSlug = '',
  siteName = '',
  analyticsId = '',
  tagManagerId = '',
  adsenseId = '',
  privacyPolicyUrl = '',
  cookiePolicyUrl = '',
  customMarketingScriptUrl = '',
  customMarketingInlineScript = '',
  forceCookieBanner = false,
}: Props) {
  useEffect(() => {
    const cleanupAnimations = initializeAnimations() || (() => {});
    const cleanupGradients = initializeScrollGradients();

    return () => {
      cleanupAnimations();
      cleanupGradients();
    };
  }, []);

  return (
    <>
      <div
        hidden
        data-editoria-runtime="public-site"
        data-cookie-consent-managed="true"
        data-ga-configured={analyticsId ? "true" : "false"}
        data-gtm-configured={tagManagerId ? "true" : "false"}
        data-adsense-configured={adsenseId ? "true" : "false"}
      />
      <CookieConsentManager
        tenantSlug={tenantSlug}
        siteName={siteName}
        analyticsId={analyticsId}
        tagManagerId={tagManagerId}
        adsenseId={adsenseId}
        privacyPolicyUrl={privacyPolicyUrl}
        cookiePolicyUrl={cookiePolicyUrl}
        customMarketingScriptUrl={customMarketingScriptUrl}
        customMarketingInlineScript={customMarketingInlineScript}
        forceBanner={forceCookieBanner}
      />
    </>
  );
}
