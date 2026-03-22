'use client';

import { useState } from 'react';
import { Upload, Settings, History, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/store';

interface MigrationJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  itemsProcessed: number;
  totalItems: number;
  startedAt: Date;
}

export function WordPressMigrationPanel() {
  const { currentTenant, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'config' | 'history'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [config, setConfig] = useState({
    importCategories: true,
    importTags: true,
    importAuthors: true,
    importDates: true,
    importComments: true,
    importImages: true,
    importSlugs: true,
  });

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
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartMigration = async () => {
    if (!file) return;

    setIsProcessing(true);
    const jobId = Math.random().toString(36).substring(7);
    const newJob: MigrationJob = {
      id: jobId,
      fileName: file.name,
      status: 'processing',
      progress: 0,
      itemsProcessed: 0,
      totalItems: 0,
      startedAt: new Date(),
    };

    setJobs([newJob, ...jobs]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', currentTenant?.id || '');
      formData.append('default_author_id', user?.id || '');
      Object.entries(config).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

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
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--c-border)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2'
            )}
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

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {/* Upload Area */}
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

            {/* Selected File */}
            {file && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--c-text-0)' }}>{file.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-1)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-xs mt-2 px-2 py-1 rounded"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Migration Options Preview */}
            {file && (
              <button
                onClick={handleStartMigration}
                disabled={isProcessing || !currentTenant || !user}
                className="w-full py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--c-accent)',
                  color: 'white',
                }}
              >
                {isProcessing ? 'Processing...' : !currentTenant ? 'Seleziona una testata' : 'Start Migration'}
              </button>
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
