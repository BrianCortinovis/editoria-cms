'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  consentAllowsAnalytics,
  consentAllowsMarketing,
  createAcceptedConsentState,
  createCustomConsentState,
  createRejectedConsentState,
  persistCookieConsent,
  resolveStoredCookieConsent,
  type CookieConsentState,
} from '@/lib/legal/cookie-consent';

interface Props {
  tenantSlug: string;
  siteName: string;
  analyticsId?: string;
  tagManagerId?: string;
  adsenseId?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  customMarketingScriptUrl?: string;
  customMarketingInlineScript?: string;
  forceBanner?: boolean;
}

function appendInlineScript(scriptId: string, code: string) {
  if (!code || document.getElementById(scriptId)) {
    return;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.text = code;
  document.head.appendChild(script);
}

function appendExternalScript(scriptId: string, src: string, attributes?: Record<string, string>) {
  if (!src || document.getElementById(scriptId)) {
    return;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.src = src;
  script.async = true;

  Object.entries(attributes || {}).forEach(([key, value]) => {
    script.setAttribute(key, value);
  });

  document.head.appendChild(script);
}

function activateTrackers(options: {
  analyticsId?: string;
  tagManagerId?: string;
  adsenseId?: string;
  customMarketingScriptUrl?: string;
  customMarketingInlineScript?: string;
  consent: CookieConsentState;
}) {
  const { analyticsId, tagManagerId, adsenseId, customMarketingScriptUrl, customMarketingInlineScript, consent } = options;

  if (analyticsId && consentAllowsAnalytics(consent)) {
    appendExternalScript(
      `editoria-ga-lib-${analyticsId}`,
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`
    );
    appendInlineScript(
      `editoria-ga-init-${analyticsId}`,
      `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${analyticsId}');
      `
    );
  }

  if (tagManagerId && consentAllowsMarketing(consent)) {
    appendInlineScript(
      `editoria-gtm-init-${tagManagerId}`,
      `
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
      `
    );
    appendExternalScript(
      `editoria-gtm-lib-${tagManagerId}`,
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(tagManagerId)}`
    );
  }

  if (adsenseId && consentAllowsMarketing(consent)) {
    appendExternalScript(
      `editoria-adsense-lib-${adsenseId}`,
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      {
        crossorigin: 'anonymous',
        'data-ad-client': adsenseId,
      }
    );
  }

  if (customMarketingScriptUrl && consentAllowsMarketing(consent)) {
    appendExternalScript('editoria-custom-marketing-script', customMarketingScriptUrl);
  }

  if (customMarketingInlineScript && consentAllowsMarketing(consent)) {
    appendInlineScript('editoria-custom-marketing-inline', customMarketingInlineScript);
  }
}

export function CookieConsentManager({
  tenantSlug,
  siteName,
  analyticsId = '',
  tagManagerId = '',
  adsenseId = '',
  privacyPolicyUrl = '',
  cookiePolicyUrl = '',
  customMarketingScriptUrl = '',
  customMarketingInlineScript = '',
  forceBanner = false,
}: Props) {
  const hasAnalytics = Boolean(analyticsId);
  const hasMarketing = Boolean(tagManagerId || adsenseId || customMarketingScriptUrl || customMarketingInlineScript);
  const shouldRender = forceBanner || hasAnalytics || hasMarketing;
  const initialConsent =
    typeof window === 'undefined' || !shouldRender ? null : resolveStoredCookieConsent(tenantSlug);

  const [consent, setConsent] = useState<CookieConsentState | null>(initialConsent);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(Boolean(initialConsent?.categories.analytics));
  const [draftMarketing, setDraftMarketing] = useState(Boolean(initialConsent?.categories.marketing));
  const consentResolved = consent !== null;

  useEffect(() => {
    if (!shouldRender || !consent) {
      return;
    }

    activateTrackers({
      analyticsId,
      tagManagerId,
      adsenseId,
      customMarketingScriptUrl,
      customMarketingInlineScript,
      consent,
    });
  }, [shouldRender, consent, analyticsId, tagManagerId, adsenseId, customMarketingScriptUrl, customMarketingInlineScript]);

  const privacyUrl = useMemo(() => privacyPolicyUrl || `/site/${tenantSlug}/privacy-policy`, [privacyPolicyUrl, tenantSlug]);
  const cookiesUrl = useMemo(() => cookiePolicyUrl || `/site/${tenantSlug}/cookie-policy`, [cookiePolicyUrl, tenantSlug]);

  if (!shouldRender) {
    return null;
  }

  const saveConsent = (nextConsent: CookieConsentState) => {
    const previousConsent = consent;
    const previousTrackingEnabled = consentAllowsAnalytics(previousConsent) || consentAllowsMarketing(previousConsent);
    const nextTrackingEnabled = consentAllowsAnalytics(nextConsent) || consentAllowsMarketing(nextConsent);
    const categoriesChanged =
      previousConsent?.categories.analytics !== nextConsent.categories.analytics ||
      previousConsent?.categories.marketing !== nextConsent.categories.marketing;

    persistCookieConsent(tenantSlug, nextConsent);
    setConsent(nextConsent);
    setDraftAnalytics(Boolean(nextConsent.categories.analytics));
    setDraftMarketing(Boolean(nextConsent.categories.marketing));
    setPreferencesOpen(false);

    if (!previousTrackingEnabled && nextTrackingEnabled) {
      activateTrackers({
        analyticsId,
        tagManagerId,
        adsenseId,
        customMarketingScriptUrl,
        customMarketingInlineScript,
        consent: nextConsent,
      });
      return;
    }

    if (previousTrackingEnabled && categoriesChanged) {
      window.location.reload();
    }
  };

  const acceptAll = () => {
    saveConsent(createAcceptedConsentState());
  };

  const rejectAll = () => {
    saveConsent(createRejectedConsentState());
  };

  const saveCustom = () => {
    saveConsent(
      createCustomConsentState({
        analytics: hasAnalytics ? draftAnalytics : false,
        marketing: hasMarketing ? draftMarketing : false,
      })
    );
  };

  const showBanner = !consentResolved;

  return (
    <>
      {showBanner ? (
        <div
          style={{
            position: 'fixed',
            left: '20px',
            right: '20px',
            bottom: '20px',
            zIndex: 9999,
            background: 'rgba(14, 23, 38, 0.96)',
            color: '#f8fafc',
            borderRadius: '24px',
            border: '1px solid rgba(148, 163, 184, 0.28)',
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(18px)',
            padding: '20px',
            maxWidth: '960px',
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7dd3fc' }}>
                  Cookie e tracciamento
                </p>
                <h3 style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.3 }}>
                  {siteName} usa cookie tecnici e, solo con il tuo consenso, strumenti analytics o marketing.
                </h3>
              </div>
              <button
                type="button"
                onClick={rejectAll}
                aria-label="Continua senza accettare"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7, fontSize: '14px' }}>
              Puoi continuare con i soli cookie tecnici, accettare tutti i cookie oppure personalizzare le preferenze.
              {' '}Puoi cambiare idea in qualsiasi momento dal pulsante &quot;I miei consensi&quot;.
            </p>

            {preferencesOpen ? (
              <div
                style={{
                  display: 'grid',
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  padding: '14px',
                  borderRadius: '18px',
                  background: 'rgba(30, 41, 59, 0.78)',
                }}
              >
                <div style={{ padding: '10px 12px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.55)' }}>
                  <strong style={{ display: 'block', marginBottom: '6px' }}>Tecnici</strong>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6 }}>
                    Necessari per sicurezza, sessione, preferenze e funzionamento base del sito.
                  </p>
                </div>

                {hasAnalytics ? (
                  <label style={{ display: 'block', padding: '10px 12px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.55)' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                      <strong>Analytics</strong>
                      <input type="checkbox" checked={draftAnalytics} onChange={(event) => setDraftAnalytics(event.target.checked)} />
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6 }}>
                      Misurazione visite e performance in forma configurabile dal titolare.
                    </span>
                  </label>
                ) : null}

                {hasMarketing ? (
                  <label style={{ display: 'block', padding: '10px 12px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.55)' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '6px' }}>
                      <strong>Marketing e terze parti</strong>
                      <input type="checkbox" checked={draftMarketing} onChange={(event) => setDraftMarketing(event.target.checked)} />
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6 }}>
                      Tag manager, advertising, embed o script di terze parti che possono tracciare l&apos;utente.
                    </span>
                  </label>
                ) : null}
              </div>
            ) : null}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={rejectAll}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  background: 'transparent',
                  color: '#f8fafc',
                  borderRadius: '999px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Rifiuta tutto
              </button>
              <button
                type="button"
                onClick={() => setPreferencesOpen((current) => !current)}
                style={{
                  border: '1px solid rgba(14, 165, 233, 0.4)',
                  background: preferencesOpen ? 'rgba(8, 145, 178, 0.18)' : 'transparent',
                  color: '#e0f2fe',
                  borderRadius: '999px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {preferencesOpen ? 'Chiudi preferenze' : 'Personalizza'}
              </button>
              {preferencesOpen ? (
                <button
                  type="button"
                  onClick={saveCustom}
                  style={{
                    border: 'none',
                    background: '#0ea5e9',
                    color: '#082f49',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  Salva preferenze
                </button>
              ) : (
                <button
                  type="button"
                  onClick={acceptAll}
                  style={{
                    border: 'none',
                    background: '#22c55e',
                    color: '#052e16',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  Accetta tutto
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '13px' }}>
              <a href={privacyUrl} style={{ color: '#bae6fd' }}>Privacy policy</a>
              <a href={cookiesUrl} style={{ color: '#bae6fd' }}>Cookie policy</a>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setPreferencesOpen((current) => !current)}
        style={{
          position: 'fixed',
          right: '18px',
          bottom: '18px',
          zIndex: 9998,
          border: '1px solid rgba(148, 163, 184, 0.3)',
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#f8fafc',
          borderRadius: '999px',
          padding: '10px 14px',
          cursor: 'pointer',
          boxShadow: '0 14px 40px rgba(15, 23, 42, 0.25)',
          display: consentResolved ? 'inline-flex' : 'none',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        I miei consensi
      </button>

      {consentResolved && preferencesOpen ? (
        <div
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '66px',
            width: 'min(360px, calc(100vw - 36px))',
            zIndex: 9999,
            borderRadius: '20px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            background: 'rgba(15, 23, 42, 0.96)',
            color: '#f8fafc',
            padding: '16px',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.35)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7dd3fc' }}>
            Preferenze cookie
          </p>
          <p style={{ margin: '0 0 14px', color: '#cbd5e1', lineHeight: 1.6, fontSize: '14px' }}>
            Puoi aggiornare o revocare il consenso in qualsiasi momento. Se disattivi categorie gia&apos; abilitate, la pagina verra&apos; ricaricata.
          </p>

          {hasAnalytics ? (
            <label style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <span>Analytics</span>
              <input type="checkbox" checked={draftAnalytics} onChange={(event) => setDraftAnalytics(event.target.checked)} />
            </label>
          ) : null}

          {hasMarketing ? (
            <label style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
              <span>Marketing</span>
              <input type="checkbox" checked={draftMarketing} onChange={(event) => setDraftMarketing(event.target.checked)} />
            </label>
          ) : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              onClick={saveCustom}
              style={{
                border: 'none',
                background: '#38bdf8',
                color: '#082f49',
                borderRadius: '999px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              Aggiorna preferenze
            </button>
            <button
              type="button"
              onClick={rejectAll}
              style={{
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: '#f8fafc',
                borderRadius: '999px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Revoca tutto
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
