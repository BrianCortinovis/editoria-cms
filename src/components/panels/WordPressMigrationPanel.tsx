'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Upload,
  Settings,
  History,
  CheckCircle,
  Clock,
  Search,
  Bot,
  AlertTriangle,
  Database,
  StopCircle,
  ImageIcon,
  FileText,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import AIButton from '@/components/ai/AIButton';
import { parseWpXml, parseWpJson, filterByYear } from '@/lib/migrations/wp-parser';
import type { WpPost } from '@/lib/migrations/wp-parser';
import { runClientMigration, type MigrationProgress } from '@/lib/migrations/wp-client-migration';

interface MigrationJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: MigrationProgress | null;
  startedAt: Date;
  finishedAt: Date | null;
}

interface PreviewSummary {
  totalPosts: number;
  postsInSelection: number;
  yearDistribution: Array<{ year: number; count: number }>;
  topCategories: Array<{ name: string; count: number }>;
  topTags: Array<{ name: string; count: number }>;
  sampleTitles: string[];
  estimatedComments: number;
  estimatedImages: number;
}

function buildPreview(posts: WpPost[]): PreviewSummary {
  const yearCounts = new Map<number, number>();
  const catCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  let totalComments = 0;
  let totalImages = 0;

  for (const p of posts) {
    const d = new Date(p.pubDate);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
    }
    for (const c of p.categories) catCounts.set(c, (catCounts.get(c) || 0) + 1);
    for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    totalComments += p.comments.length;
    totalImages += p.images.length;
  }

  const sortMap = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  return {
    totalPosts: posts.length,
    postsInSelection: posts.length,
    yearDistribution: [...yearCounts.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
    topCategories: sortMap(catCounts).slice(0, 10),
    topTags: sortMap(tagCounts).slice(0, 10),
    sampleTitles: posts.slice(0, 12).map((p) => p.title),
    estimatedComments: totalComments,
    estimatedImages: totalImages,
  };
}

export function WordPressMigrationPanel() {
  const { currentTenant, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'config' | 'analysis' | 'history'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedPosts, setParsedPosts] = useState<WpPost[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [migrationNotes, setMigrationNotes] = useState('');
  const [liveProgress, setLiveProgress] = useState<MigrationProgress | null>(null);
  const cancelTokenRef = useRef({ cancelled: false });

  const [config, setConfig] = useState({
    importCategories: true,
    importTags: true,
    importAuthors: true,
    importDates: true,
    importComments: true,
    importImages: true,
    importSlugs: true,
  });

  const [batchConfig, setBatchConfig] = useState({
    offset: 0,
    limit: 1000,
    yearFrom: '',
    yearTo: '',
  });

  const canRun = Boolean(file && currentTenant && user && parsedPosts.length > 0);

  const analysisContext = useMemo(() => {
    if (!preview) return '';
    return JSON.stringify(preview);
  }, [preview]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setFile(files[0]);
      setParsedPosts([]);
      setPreview(null);
      setMigrationNotes('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setParsedPosts([]);
      setPreview(null);
      setMigrationNotes('');
    }
  };

  // Parse + analyze entirely in browser — zero server calls
  const handleAnalyzeArchive = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setMigrationNotes('');

    try {
      const text = await file.text();
      const allPosts = file.name.endsWith('.json') ? parseWpJson(text) : parseWpXml(text);

      const yearFrom = batchConfig.yearFrom ? Number(batchConfig.yearFrom) : null;
      const yearTo = batchConfig.yearTo ? Number(batchConfig.yearTo) : null;
      let filtered = filterByYear(allPosts, yearFrom, yearTo);

      if (batchConfig.limit > 0) {
        filtered = filtered.slice(batchConfig.offset, batchConfig.offset + batchConfig.limit);
      } else if (batchConfig.offset > 0) {
        filtered = filtered.slice(batchConfig.offset);
      }

      setParsedPosts(filtered);
      setPreview(buildPreview(filtered));
      setActiveTab('analysis');
    } catch (error) {
      setMigrationNotes(error instanceof Error ? error.message : 'Errore nel parsing del file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancel = useCallback(() => {
    cancelTokenRef.current.cancelled = true;
  }, []);

  // Run migration entirely client-side: browser → Supabase direct + R2 via upload API
  const handleStartMigration = async () => {
    if (!canRun || !currentTenant || !user) return;

    setIsProcessing(true);
    cancelTokenRef.current = { cancelled: false };

    const jobId = Math.random().toString(36).substring(7);
    const newJob: MigrationJob = {
      id: jobId,
      fileName: file!.name,
      status: 'processing',
      progress: null,
      startedAt: new Date(),
      finishedAt: null,
    };
    setJobs((prev) => [newJob, ...prev]);

    try {
      const supabase = createClient();
      const result = await runClientMigration(
        supabase,
        currentTenant.id,
        currentTenant.slug,
        user.id,
        parsedPosts,
        config,
        (progress) => {
          setLiveProgress({ ...progress });
          setJobs((prev) => prev.map((j) =>
            j.id === jobId ? { ...j, progress: { ...progress } } : j
          ));
        },
        cancelTokenRef.current,
      );

      setJobs((prev) => prev.map((j) =>
        j.id === jobId
          ? { ...j, status: result.cancelled ? 'cancelled' : 'completed', progress: result, finishedAt: new Date() }
          : j
      ));

      if (!result.cancelled) {
        setFile(null);
        setParsedPosts([]);
        setPreview(null);
      }
    } catch (err) {
      setJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, status: 'failed', finishedAt: new Date() } : j
      ));
      setMigrationNotes(err instanceof Error ? err.message : 'Migrazione fallita');
    } finally {
      setIsProcessing(false);
      setLiveProgress(null);
    }
  };

  const tabs = [
    { id: 'upload' as const, label: 'Upload', icon: Upload },
    { id: 'config' as const, label: 'Config', icon: Settings },
    { id: 'analysis' as const, label: 'Analisi', icon: Search },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b" style={{ borderColor: 'var(--c-border)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2')}
            style={{
              borderColor: activeTab === id ? 'var(--c-accent)' : 'transparent',
              color: activeTab === id ? 'var(--c-accent)' : 'var(--c-text-1)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <AIButton
                compact
                taskType="chatbot"
                actions={[
                  {
                    id: 'wp_upload_requirements',
                    label: 'Verifica file e requisiti',
                    prompt: 'Spiega cosa controllare prima di caricare un export WordPress in questo CMS: formato file, limiti, immagini, commenti, autori e rischi di import: {context}',
                  },
                ]}
                contextData={JSON.stringify({
                  hasFile: Boolean(file),
                  fileName: file?.name || null,
                  fileSize: file?.size || null,
                  currentTenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                }, null, 2)}
                onResult={(result) => setMigrationNotes(result)}
                autoApply
              />
            </div>

            <div
              onClick={() => document.getElementById('file-input')?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                isDragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' : ''
              )}
              style={{
                borderColor: isDragging ? '#60a5fa' : 'var(--c-border)',
                background: isDragging ? undefined : 'var(--c-bg-1)',
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".xml,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload size={32} className="mx-auto mb-2" style={{ color: 'var(--c-text-1)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--c-text-0)' }}>
                Drag WordPress export here
              </p>
              <p className="text-xs" style={{ color: 'var(--c-text-1)' }}>
                or click to select .xml or .json file
              </p>
            </div>

            {file && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--c-text-0)' }}>{file.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-1)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {preview && (
                  <p className="text-[11px] mt-2" style={{ color: 'var(--c-text-1)' }}>
                    Lotto pronto: {preview.postsInSelection} contenuti selezionati
                  </p>
                )}
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setMigrationNotes('');
                  }}
                  className="text-xs mt-2 px-2 py-1 rounded"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                >
                  Remove
                </button>
              </div>
            )}

            {file && (
              <div className="space-y-2">
                <button
                  onClick={handleAnalyzeArchive}
                  disabled={isAnalyzing || isProcessing}
                  className="w-full py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
                >
                  {isAnalyzing ? 'Analisi in corso (locale)...' : 'Analizza archivio'}
                </button>
                <button
                  onClick={handleStartMigration}
                  disabled={isProcessing || !canRun}
                  className="w-full py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  style={{ background: 'var(--c-accent)', color: 'white' }}
                >
                  {isProcessing ? 'Migrazione in corso...' : !currentTenant ? 'Seleziona un sito' : `Avvia migrazione (${parsedPosts.length} articoli)`}
                </button>
                {isProcessing && (
                  <button
                    onClick={handleCancel}
                    className="w-full py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                  >
                    <StopCircle size={14} /> Annulla migrazione
                  </button>
                )}
              </div>
            )}

            {/* Live progress */}
            {liveProgress && (
              <div className="space-y-3 p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
                    {liveProgress.phase === 'categories' && 'Creazione categorie...'}
                    {liveProgress.phase === 'tags' && 'Creazione tag...'}
                    {liveProgress.phase === 'articles' && 'Importazione articoli...'}
                    {liveProgress.phase === 'images' && 'Migrazione immagini su R2...'}
                    {liveProgress.phase === 'done' && 'Completato!'}
                  </p>
                  <span className="text-xs font-mono" style={{ color: 'var(--c-text-2)' }}>
                    {liveProgress.current}/{liveProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--c-bg-2)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${liveProgress.total > 0 ? Math.round((liveProgress.current / liveProgress.total) * 100) : 0}%`,
                      background: liveProgress.phase === 'done' ? '#10b981' : 'var(--c-accent)',
                    }}
                  />
                </div>
                <p className="text-[11px] truncate" style={{ color: 'var(--c-text-2)' }}>
                  {liveProgress.currentItem}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: 'var(--c-text-1)' }}>
                  <span className="flex items-center gap-1"><FileText size={10} /> {liveProgress.articlesInserted} inseriti, {liveProgress.articlesUpdated} aggiornati</span>
                  <span className="flex items-center gap-1"><ImageIcon size={10} /> {liveProgress.imagesMigrated} immagini ({liveProgress.imagesFailed} fallite)</span>
                  <span className="flex items-center gap-1"><MessageSquare size={10} /> {liveProgress.commentsMigrated} commenti</span>
                  <span className="flex items-center gap-1"><ExternalLink size={10} /> {liveProgress.redirectsCreated} redirect</span>
                </div>
                {liveProgress.failures.length > 0 && (
                  <div className="text-[11px] mt-2" style={{ color: '#ef4444' }}>
                    {liveProgress.failures.slice(-3).map((f, i) => (
                      <p key={i}>Errore: {f.title} — {f.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-3">
            <div className="flex items-center justify-end">
              <AIButton
                compact
                taskType="chatbot"
                actions={[
                  {
                    id: 'wp_config_review',
                    label: 'Rivedi configurazione',
                    prompt: 'Analizza questa configurazione di migrazione WordPress e suggerisci settaggi migliori per categorie, tag, autori, date, commenti, immagini, slugs e batch: {context}',
                  },
                ]}
                contextData={JSON.stringify({
                  config,
                  batchConfig,
                  preview,
                  currentTenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                }, null, 2)}
                onResult={(result) => setMigrationNotes(result)}
                autoApply
              />
            </div>

            {[
              { key: 'importCategories', label: 'Import Categories' },
              { key: 'importTags', label: 'Import Tags' },
              { key: 'importAuthors', label: 'Import Authors' },
              { key: 'importDates', label: 'Import Dates' },
              { key: 'importComments', label: 'Import Comments' },
              { key: 'importImages', label: 'Import Images' },
              { key: 'importSlugs', label: 'Import Slugs' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer" style={{ background: 'var(--c-bg-1)' }}>
                <input
                  type="checkbox"
                  checked={config[key as keyof typeof config]}
                  onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-xs" style={{ color: 'var(--c-text-0)' }}>{label}</span>
              </label>
            ))}

            <div className="mt-4 pt-3 border-t space-y-3" style={{ borderColor: 'var(--c-border)' }}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-1)' }}>
                <Database size={12} /> Batch & filtri
              </div>
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--c-text-1)' }}>Offset</span>
                <input
                  type="number"
                  value={batchConfig.offset}
                  onChange={(e) => setBatchConfig((prev) => ({ ...prev, offset: Number(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)', color: 'var(--c-text-0)' }}
                />
              </label>
              <label className="block">
                <span className="text-xs" style={{ color: 'var(--c-text-1)' }}>Lotto massimo</span>
                <input
                  type="number"
                  value={batchConfig.limit}
                  onChange={(e) => setBatchConfig((prev) => ({ ...prev, limit: Number(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)', color: 'var(--c-text-0)' }}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs" style={{ color: 'var(--c-text-1)' }}>Anno da</span>
                  <input
                    type="number"
                    value={batchConfig.yearFrom}
                    onChange={(e) => setBatchConfig((prev) => ({ ...prev, yearFrom: e.target.value }))}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)', color: 'var(--c-text-0)' }}
                  />
                </label>
                <label className="block">
                  <span className="text-xs" style={{ color: 'var(--c-text-1)' }}>Anno a</span>
                  <input
                    type="number"
                    value={batchConfig.yearTo}
                    onChange={(e) => setBatchConfig((prev) => ({ ...prev, yearTo: e.target.value }))}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)', color: 'var(--c-text-0)' }}
                  />
                </label>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>
                Per archivi grandi conviene lavorare per anno o lotti da 500-2000 articoli.
              </p>
              {preview && (
                <div className="rounded-lg p-3" style={{ background: 'var(--c-bg-1)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--c-text-0)' }}>
                    Lotto corrente: {preview.postsInSelection} / {preview.totalPosts}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--c-text-1)' }}>
                    Offset {batchConfig.offset} · Limite {batchConfig.limit || 'tutto'} · Anni {batchConfig.yearFrom || 'inizio'} → {batchConfig.yearTo || 'oggi'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {!preview ? (
              <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--c-text-0)' }}>Nessuna analisi disponibile</p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-1)' }}>
                  Carica un export e usa “Analizza archivio prima di importare”.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Post nel file" value={preview.totalPosts} />
                  <MetricCard label="Post nel lotto" value={preview.postsInSelection} />
                  <MetricCard label="Commenti stimati" value={preview.estimatedComments} />
                  <MetricCard label="Immagini stimate" value={preview.estimatedImages} />
                </div>

                <InfoCard title="Distribuzione per anno">
                  <div className="flex flex-wrap gap-2">
                    {preview.yearDistribution.slice(0, 18).map((item) => (
                      <span key={item.year} className="px-2 py-1 rounded-full text-[11px]" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}>
                        {item.year}: {item.count}
                      </span>
                    ))}
                  </div>
                </InfoCard>

                <InfoCard title="Top categorie">
                  <SimpleCountList items={preview.topCategories.slice(0, 8)} />
                </InfoCard>

                <InfoCard title="Top tag">
                  <SimpleCountList items={preview.topTags.slice(0, 8)} />
                </InfoCard>

                <InfoCard title="Titoli campione">
                  <div className="space-y-1">
                    {preview.sampleTitles.slice(0, 8).map((title) => (
                      <div key={title} className="text-[11px]" style={{ color: 'var(--c-text-1)' }}>• {title}</div>
                    ))}
                  </div>
                </InfoCard>

                <InfoCard title="Suggerimenti IA per il tecnico" icon={<Bot size={12} />}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>
                      Ottieni strategia di migrazione e checklist di controllo per questo archivio.
                    </p>
                    <AIButton
                      compact
                      taskType="chatbot"
                      actions={[
                        {
                          id: 'wp_import_strategy',
                          label: 'Piano migrazione',
                          prompt: 'Analizza questo archivio WordPress e suggerisci il piano tecnico migliore di migrazione a batch, con ordine operativo, dimensione lotti, verifiche e rischi: {context}',
                        },
                        {
                          id: 'wp_import_checks',
                          label: 'Checklist controlli',
                          prompt: 'Genera una checklist tecnica di controllo post-import per una testata giornalistica che migra WordPress su un CMS custom: {context}',
                        },
                      ]}
                      contextData={analysisContext}
                      onResult={(result) => setMigrationNotes(result)}
                      autoApply
                    />
                  </div>
                  {migrationNotes ? (
                    <div className="text-[11px] whitespace-pre-wrap" style={{ color: 'var(--c-text-1)' }}>
                      {migrationNotes}
                    </div>
                  ) : null}
                </InfoCard>
              </>
            )}

            {migrationNotes && !preview && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--c-text-0)' }}>
                {migrationNotes}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="flex items-center justify-end">
              <AIButton
                compact
                taskType="chatbot"
                actions={[
                  {
                    id: 'wp_history_summary',
                    label: 'Leggi storico',
                    prompt: 'Riassumi lo storico migrazioni visibile e suggerisci prossimi controlli tecnici o editoriali post-import: {context}',
                  },
                ]}
                contextData={JSON.stringify({
                  jobs,
                  migrationNotes,
                  currentTenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                }, null, 2)}
                onResult={(result) => setMigrationNotes(result)}
                autoApply
              />
            </div>

            {jobs.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--c-text-1)' }}>
                Nessuna migrazione effettuata
              </p>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--c-text-0)' }}>
                        {job.fileName}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--c-text-1)' }}>
                        {job.startedAt.toLocaleString('it-IT')}
                        {job.finishedAt && ` → ${job.finishedAt.toLocaleString('it-IT')}`}
                      </p>
                    </div>
                    {job.status === 'completed' && <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />}
                    {job.status === 'processing' && <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                    {job.status === 'cancelled' && <StopCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                    {job.status === 'failed' && <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />}
                  </div>

                  {job.progress && (
                    <div className="grid grid-cols-2 gap-1 text-[11px] mt-2" style={{ color: 'var(--c-text-1)' }}>
                      <span>{job.progress.articlesInserted} articoli inseriti</span>
                      <span>{job.progress.articlesUpdated} aggiornati</span>
                      <span>{job.progress.imagesMigrated} immagini migrate</span>
                      <span>{job.progress.imagesFailed} immagini fallite</span>
                      <span>{job.progress.commentsMigrated} commenti</span>
                      <span>{job.progress.redirectsCreated} redirect 301</span>
                    </div>
                  )}

                  {job.status === 'cancelled' && (
                    <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
                      Interrotta — riavviabile senza duplicati (legacy_wp_id)
                    </p>
                  )}

                  {job.status === 'failed' && (
                    <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
                      Migrazione fallita — riprova, i duplicati vengono gestiti
                    </p>
                  )}

                  {job.progress && job.progress.failures.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-[11px] cursor-pointer" style={{ color: '#ef4444' }}>
                        {job.progress.failures.length} errori
                      </summary>
                      <div className="mt-1 space-y-0.5 text-[10px]" style={{ color: 'var(--c-text-2)' }}>
                        {job.progress.failures.map((f, i) => (
                          <p key={i}>{f.title}: {f.reason}</p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--c-bg-1)' }}>
      <p className="text-[11px]" style={{ color: 'var(--c-text-1)' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: 'var(--c-text-0)' }}>{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--c-bg-1)' }}>
      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--c-text-0)' }}>
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function SimpleCountList({ items }: { items: Array<{ name: string; count: number }> }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between text-xs" style={{ color: 'var(--c-text-1)' }}>
          <span>{item.name}</span>
          <span>{item.count}</span>
        </div>
      ))}
    </div>
  );
}
