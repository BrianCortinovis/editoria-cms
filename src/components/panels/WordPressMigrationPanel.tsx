'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/store';
import AIButton from '@/components/ai/AIButton';

interface MigrationJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  itemsProcessed: number;
  totalItems: number;
  startedAt: Date;
}

interface PreviewSummary {
  totalPosts: number;
  postsInSelection: number;
  range: {
    offset: number;
    limit: number | null;
    yearFrom: number | null;
    yearTo: number | null;
  };
  yearDistribution: Array<{ year: number; count: number }>;
  topCategories: Array<{ name: string; count: number }>;
  topTags: Array<{ name: string; count: number }>;
  sampleTitles: string[];
  estimatedComments: number;
  estimatedImages: number;
  potentialDuplicates: Array<{ title: string; slug: string; reason: string }>;
}

export function WordPressMigrationPanel() {
  const { currentTenant, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'config' | 'analysis' | 'history'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [migrationNotes, setMigrationNotes] = useState('');

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

  const canRun = Boolean(file && currentTenant && user);

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
      setPreview(null);
      setMigrationNotes('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setMigrationNotes('');
    }
  };

  const appendCommonFormData = (formData: FormData, previewOnly: boolean) => {
    formData.append('file', file as File);
    formData.append('tenant_id', currentTenant?.id || '');
    formData.append('default_author_id', user?.id || '');
    formData.append('previewOnly', String(previewOnly));
    formData.append('offset', String(batchConfig.offset || 0));
    formData.append('limit', String(batchConfig.limit || 0));
    formData.append('yearFrom', batchConfig.yearFrom || '');
    formData.append('yearTo', batchConfig.yearTo || '');
    Object.entries(config).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  };

  const handleAnalyzeArchive = async () => {
    if (!canRun || !file) return;

    setIsAnalyzing(true);
    setMigrationNotes('');

    try {
      const formData = new FormData();
      appendCommonFormData(formData, true);

      const response = await fetch('/api/migrations/wordpress', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Preview failed');
      }

      setPreview((data.preview || null) as PreviewSummary | null);
      setActiveTab('analysis');
    } catch (error) {
      setMigrationNotes(error instanceof Error ? error.message : 'Anteprima non riuscita');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartMigration = async () => {
    if (!file || !canRun) return;

    setIsProcessing(true);
    const jobId = Math.random().toString(36).substring(7);
    const newJob: MigrationJob = {
      id: jobId,
      fileName: file.name,
      status: 'processing',
      progress: 0,
      itemsProcessed: 0,
      totalItems: preview?.postsInSelection || 0,
      startedAt: new Date(),
    };

    setJobs([newJob, ...jobs]);

    try {
      const formData = new FormData();
      appendCommonFormData(formData, false);

      const response = await fetch('/api/migrations/wordpress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Migration failed');

      const data = await response.json();

      setJobs(prev => prev.map(j => j.id === jobId
        ? {
            ...j,
            status: 'completed',
            progress: 100,
            itemsProcessed: data.processed || 0,
            totalItems: data.total || 0,
          }
        : j
      ));

      setFile(null);
      setPreview(null);
    } catch {
      setJobs(prev => prev.map(j => j.id === jobId
        ? { ...j, status: 'failed', progress: 0 }
        : j
      ));
    } finally {
      setIsProcessing(false);
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
                  disabled={isAnalyzing || isProcessing || !canRun}
                  className="w-full py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  style={{
                    background: 'var(--c-bg-2)',
                    color: 'var(--c-text-0)',
                  }}
                >
                  {isAnalyzing ? 'Analisi archivio…' : 'Analizza archivio prima di importare'}
                </button>
                <button
                  onClick={handleStartMigration}
                  disabled={isProcessing || !canRun}
                  className="w-full py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  style={{
                    background: 'var(--c-accent)',
                    color: 'white',
                  }}
                >
                  {isProcessing ? 'Processing...' : !currentTenant ? 'Seleziona una testata' : 'Start Migration'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-3">
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
                    Offset {preview.range.offset} · Limite {preview.range.limit ?? 'tutto'} · Anni {preview.range.yearFrom ?? 'inizio'} → {preview.range.yearTo ?? 'oggi'}
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

                {preview.potentialDuplicates.length > 0 && (
                  <div className="rounded-lg p-3" style={{ background: 'rgba(245, 158, 11, 0.12)' }}>
                    <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--c-text-0)' }}>
                      <AlertTriangle size={12} /> Possibili duplicati
                    </p>
                    <div className="mt-2 space-y-1">
                      {preview.potentialDuplicates.slice(0, 8).map((item) => (
                        <div key={`${item.slug}-${item.title}`} className="text-[11px]" style={{ color: 'var(--c-text-1)' }}>
                          <strong>{item.slug}</strong> — {item.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
            {jobs.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--c-text-1)' }}>
                No migrations yet
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
                        {job.startedAt.toLocaleString()}
                      </p>
                    </div>
                    {job.status === 'completed' && (
                      <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    )}
                    {job.status === 'processing' && (
                      <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    )}
                  </div>

                  {job.status === 'processing' && (
                    <div className="w-full h-2 rounded-full" style={{ background: 'var(--c-bg-2)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${job.progress}%`, background: 'var(--c-accent)' }}
                      />
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <p className="text-xs" style={{ color: 'var(--c-text-1)' }}>
                      ✓ {job.itemsProcessed} posts imported
                    </p>
                  )}

                  {job.status === 'failed' && (
                    <p className="text-xs" style={{ color: 'var(--c-danger)' }}>
                      ✗ Migration failed
                    </p>
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
