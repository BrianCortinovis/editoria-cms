'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, Zap, AlertCircle, Server, Brain } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MetricData {
  value: number;
  timestamp: number;
}

interface MiniChartProps {
  data: MetricData[];
  height?: number;
  color?: string;
}

function MiniChart({ data, height = 40, color = 'var(--c-accent)' }: MiniChartProps) {
  if (data.length < 2) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (((d.value - minValue) / range) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" height={height} className="w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const percentage = (value / max) * 100;
  let color = 'bg-green-500';
  if (percentage > 75) color = 'bg-red-500';
  else if (percentage > 50) color = 'bg-amber-500';
  else if (percentage > 25) color = 'bg-yellow-500';

  return (
    <div>
      {label && <p className="text-xs mb-1" style={{ color: 'var(--c-text-1)' }}>{label}</p>}
      <div className="w-full h-2 rounded-full" style={{ background: 'var(--c-bg-2)' }}>
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function SystemPanel() {
  const [cpuData, setCpuData] = useState<MetricData[]>([]);
  const [memoryData, setMemoryData] = useState<MetricData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'storage' | 'ai' | 'hosting' | 'issues'>('overview');

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCpu = [...cpuData, { value: Math.random() * 80 + 10, timestamp: now }].slice(-20);
      const newMemory = [...memoryData, { value: Math.random() * 60 + 20, timestamp: now }].slice(-20);
      setCpuData(newCpu);
      setMemoryData(newMemory);
    }, 5000);

    return () => clearInterval(interval);
  }, [cpuData, memoryData]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'performance' as const, label: 'Performance', icon: Zap },
    { id: 'storage' as const, label: 'Storage', icon: Database },
    { id: 'ai' as const, label: 'IA', icon: Brain },
    { id: 'hosting' as const, label: 'Hosting', icon: Server },
    { id: 'issues' as const, label: 'Issues', icon: AlertCircle },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b shrink-0" style={{ borderColor: 'var(--c-border)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2'
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
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>System Status</h3>
              <div className="space-y-2">
                <ProgressBar value={42} label="CPU Usage" />
                <ProgressBar value={58} label="Memory" />
                <ProgressBar value={73} label="Storage" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg text-center" style={{ background: 'var(--c-bg-1)' }}>
                <p className="text-[10px]" style={{ color: 'var(--c-text-1)' }}>Uptime</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>99.9%</p>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'var(--c-bg-1)' }}>
                <p className="text-[10px]" style={{ color: 'var(--c-text-1)' }}>Response Time</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>124ms</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--c-text-0)' }}>CPU Usage (last 20s)</h3>
              <MiniChart data={cpuData} color="var(--c-accent)" />
              <p className="text-xs mt-2" style={{ color: 'var(--c-text-1)' }}>
                Current: {cpuData.length > 0 ? Math.round(cpuData[cpuData.length - 1].value) : 0}%
              </p>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
              <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--c-text-0)' }}>Memory Usage (last 20s)</h3>
              <MiniChart data={memoryData} color="#ef4444" />
              <p className="text-xs mt-2" style={{ color: 'var(--c-text-1)' }}>
                Current: {memoryData.length > 0 ? Math.round(memoryData[memoryData.length - 1].value) : 0}MB
              </p>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>Storage Breakdown</h3>
              <div className="space-y-2">
                <ProgressBar value={2.4} max={5} label="Database (2.4GB / 5GB)" />
                <ProgressBar value={1.8} max={5} label="Files (1.8GB / 5GB)" />
                <ProgressBar value={0.6} max={5} label="Backups (0.6GB / 5GB)" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>AI Tokens</h3>
              <div className="space-y-2">
                <ProgressBar value={127450} max={1000000} label="Used Tokens (127.4K / 1M)" />
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--c-text-1)' }}>
                This month: 847 requests | Avg latency: 320ms
              </p>
            </div>
          </div>
        )}

        {activeTab === 'hosting' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>Vercel Deployment</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--c-text-1)' }}>Status</span>
                  <span style={{ color: '#10b981' }}>● Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--c-text-1)' }}>Region</span>
                  <span style={{ color: 'var(--c-text-0)' }}>iad (us-east)</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--c-text-1)' }}>Last Deploy</span>
                  <span style={{ color: 'var(--c-text-0)' }}>2m ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-2">
            <div className="p-3 rounded-lg" style={{ background: 'var(--c-bg-1)' }}>
              <div className="flex items-start gap-2">
                <AlertCircle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--c-text-0)' }}>High Memory Usage</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--c-text-1)' }}>
                    Memory at 68% of capacity. Consider optimizing large queries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
