'use client';

import { useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  FileText,
  MessageSquare,
  Newspaper,
  PanelLeft,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

type GuideSection = {
  id: string;
  label: string;
  title: string;
  intro: string;
  bullets: string[];
  tips: string[];
  icon: typeof FileText;
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'overview',
    label: 'Panoramica',
    title: 'Cos’è la pagina Redazione',
    intro: 'Redazione è l’hub operativo del CMS: non sostituisce i moduli, li organizza per il lavoro quotidiano della testata.',
    bullets: [
      'In alto vedi subito quante bozze, revisioni, approvazioni, programmati e breaking sono attivi.',
      'Le card rapide portano ai moduli veri: articoli, commenti, breaking, eventi e strumenti IA.',
      'La colonna “Da lavorare adesso” raccoglie i contenuti editoriali che richiedono attenzione immediata.',
    ],
    tips: [
      'Usala come schermata iniziale di desk.',
      'Se una redazione entra ogni giorno qui, ha subito il quadro operativo.',
    ],
    icon: Newspaper,
  },
  {
    id: 'workflow',
    label: 'Workflow',
    title: 'Come scorre il flusso editoriale',
    intro: 'La pagina riflette il flusso umano classico di una redazione: scrittura, revisione, approvazione, programmazione e pubblicazione.',
    bullets: [
      'Bozza: il redattore prepara il contenuto.',
      'In revisione: il pezzo passa al desk o al caporedattore.',
      'Approvato: il contenuto è pronto per uscire o per essere programmato.',
      'Pubblicato / Breaking: il pezzo è online e può alimentare homepage, ticker o slot editoriali.',
    ],
    tips: [
      'Le etichette stato vanno lette come priorità di lavoro, non solo come semplice archivio.',
      'I programmati aiutano il desk a capire cosa sta per uscire senza aprire ogni articolo.',
    ],
    icon: CheckCircle2,
  },
  {
    id: 'desk',
    label: 'Desk',
    title: 'Cosa fare davvero ogni giorno',
    intro: 'La parte utile non è solo visualizzare dati: è sapere dove cliccare e in che ordine lavorare.',
    bullets: [
      'Nuovo articolo: apre subito la scrittura di un nuovo pezzo.',
      'Tutti gli articoli: controllo largo su archivio, filtri e stati.',
      'Moderazione commenti: presidio qualità e rischio spam.',
      'Desk breaking e Agenda eventi: gestione del contenuto caldo e programmato.',
    ],
    tips: [
      'Per un desk giornalistico, i collegamenti rapidi devono evitare passaggi inutili.',
      'Se un modulo serve tutti i giorni, qui deve essere sempre a un click.',
    ],
    icon: FileText,
  },
  {
    id: 'automation',
    label: 'Automazioni',
    title: 'A cosa servono le regole automatiche',
    intro: 'Le regole non scrivono al posto della redazione: aiutano a mantenere homepage e flussi coerenti.',
    bullets: [
      'Homepage Fresh Hours indica quanto recente deve essere un contenuto per entrare nei riempimenti automatici.',
      'Questa logica aiuta il sito pubblico a restare vivo senza cambiare manualmente ogni slot.',
      'Il valore va deciso dal desk in base al ritmo della testata.',
    ],
    tips: [
      'Una testata veloce usa soglie più strette.',
      'Una testata locale con meno uscite può permettersi una finestra più ampia.',
    ],
    icon: Sparkles,
  },
  {
    id: 'roles',
    label: 'Sicurezza',
    title: 'Ruoli, responsabilità e sicurezza',
    intro: 'Redazione deve essere veloce, ma anche controllata: i moduli dietro restano soggetti a ruoli e permessi CMS.',
    bullets: [
      'Le query sono filtrate per tenant corrente.',
      'Le operazioni reali restano nei moduli CMS che applicano auth, ruoli e regole di accesso.',
      'La pagina Redazione non deve inventare bypass: deve fare da pannello di regia, non da scorciatoia insicura.',
    ],
    tips: [
      'Un caporedattore deve vedere tutto il flusso.',
      'Un collaboratore dovrebbe avere accesso solo a ciò che gli serve davvero.',
    ],
    icon: ShieldCheck,
  },
];

export function RedazioneGuide() {
  const [active, setActive] = useState<string>(GUIDE_SECTIONS[0].id);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const current = useMemo(
    () => GUIDE_SECTIONS.find((section) => section.id === active) || GUIDE_SECTIONS[0],
    [active]
  );

  const Icon = current.icon;

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
    >
      <button
        type="button"
        onClick={() => setSectionOpen((value) => !value)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
          >
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>
              Guida Interattiva Redazione
            </h3>
            <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--c-text-2)' }}>
              Sommario a sinistra, spiegazioni a destra, apribile solo quando ti serve.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 shrink-0">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
          >
            {sectionOpen ? 'Chiudi guida' : 'Apri guida'}
          </span>
          <ChevronDown
            size={18}
            className={sectionOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
            style={{ color: 'var(--c-text-3)' }}
          />
        </div>
      </button>

      {sectionOpen ? (
      <div className="p-5 pt-0 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
        <aside
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center gap-2">
              <PanelLeft size={15} style={{ color: 'var(--c-accent)' }} />
              <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Sommario guida
              </h4>
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--c-text-3)' }}>
              {GUIDE_SECTIONS.length} sezioni
            </span>
          </div>
          <div className="p-3 space-y-2">
            {GUIDE_SECTIONS.map((section, index) => {
              const SectionIcon = section.icon;
              const activeItem = section.id === current.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    if (section.id === current.id) {
                      setExpanded((value) => !value);
                      return;
                    }
                    setActive(section.id);
                    setExpanded(true);
                  }}
                  className="w-full text-left rounded-2xl px-3 py-3 transition"
                  style={
                    activeItem
                      ? { background: 'var(--c-accent-soft)', border: '1px solid rgba(14,165,233,0.15)' }
                      : { background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={activeItem ? { background: 'rgba(255,255,255,0.75)', color: 'var(--c-accent)' } : { background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}
                    >
                      <SectionIcon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: activeItem ? 'var(--c-accent)' : 'var(--c-text-3)' }}>
                          Step {index + 1}
                        </span>
                        {activeItem ? (
                          <ChevronDown
                            size={14}
                            className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                            style={{ color: 'var(--c-accent)' }}
                          />
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--c-text-0)' }}>
                        {section.label}
                      </div>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: activeItem ? 'var(--c-text-1)' : 'var(--c-text-2)' }}>
                        {section.intro}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
        >
          <div
            className="px-5 py-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
            style={{ borderBottom: '1px solid var(--c-border)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
              >
                <Icon size={18} />
              </div>
              <div>
                <h4 className="text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>
                  {current.title}
                </h4>
                <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--c-text-2)' }}>
                  {current.intro}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition"
                style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
              >
                <ChevronDown
                  size={14}
                  className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                />
                {expanded ? 'Chiudi spiegazione' : 'Apri spiegazione'}
              </button>
            </div>
          </div>

          {expanded ? (
            <div className="p-5 space-y-4">
              <div className="rounded-2xl p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={16} style={{ color: 'var(--c-accent)' }} />
                  <h5 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                    Spiegazione operativa
                  </h5>
                </div>
                <div className="space-y-3">
                  {current.bullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl px-4 py-3 text-sm"
                      style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4">
                <div className="rounded-2xl p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} style={{ color: 'var(--c-accent)' }} />
                    <h5 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                      Consigli pratici
                    </h5>
                  </div>
                  <div className="space-y-2">
                    {current.tips.map((tip) => (
                      <div key={tip} className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.10), rgba(59,130,246,0.05))', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarClock size={16} style={{ color: 'var(--c-accent)' }} />
                    <h5 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                      Lettura rapida della pagina
                    </h5>
                  </div>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--c-text-1)' }}>
                    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      1. Guarda i numeri in alto per capire il carico del desk.
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      2. Entra in “Da lavorare adesso” per i pezzi operativi.
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      3. Usa le azioni rapide per non perdere tempo a cercare i moduli.
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      4. Controlla le regole automatiche se la homepage deve cambiare comportamento.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}>
                Sezione richiusa. Dal sommario a sinistra puoi cambiare argomento, oppure riaprire questa spiegazione quando ti serve.
              </div>
            </div>
          )}
        </div>
      </div>
      ) : null}
    </section>
  );
}
