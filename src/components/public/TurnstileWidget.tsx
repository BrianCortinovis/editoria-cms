'use client';

import { useEffect, useId, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface Props {
  onTokenChange: (token: string) => void;
  onReadyStateChange?: (ready: boolean) => void;
  resetSignal?: number;
  theme?: 'light' | 'dark' | 'auto';
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';

export function isTurnstileWidgetConfigured() {
  return Boolean(TURNSTILE_SITE_KEY);
}

function ensureTurnstileScript() {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return existing;
  }

  const script = document.createElement('script');
  script.id = TURNSTILE_SCRIPT_ID;
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  return script;
}

export function TurnstileWidget({
  onTokenChange,
  onReadyStateChange,
  resetSignal = 0,
  theme = 'auto',
}: Props) {
  const elementId = useId().replace(/:/g, '');
  const widgetIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    if (!isTurnstileWidgetConfigured()) {
      onReadyStateChange?.(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const script = ensureTurnstileScript();

    const renderWidget = () => {
      if (!mountedRef.current || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(`#${elementId}`, {
        sitekey: TURNSTILE_SITE_KEY,
        theme,
        callback: (token: unknown) => {
          onTokenChange(typeof token === 'string' ? token : '');
        },
        'expired-callback': () => {
          onTokenChange('');
        },
        'error-callback': () => {
          onTokenChange('');
        },
      });
      onReadyStateChange?.(true);
    };

    if (window.turnstile) {
      renderWidget();
    } else if (script) {
      script.addEventListener('load', renderWidget);
    }

    return () => {
      mountedRef.current = false;
      if (script) {
        script.removeEventListener('load', renderWidget);
      }
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [elementId, onReadyStateChange, onTokenChange, theme]);

  useEffect(() => {
    if (!window.turnstile || !widgetIdRef.current || resetSignal === 0) {
      return;
    }

    window.turnstile.reset(widgetIdRef.current);
    onTokenChange('');
  }, [onTokenChange, resetSignal]);

  if (!isTurnstileWidgetConfigured()) {
    return null;
  }

  return <div id={elementId} />;
}
