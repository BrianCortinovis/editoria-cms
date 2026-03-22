'use client';

import { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

interface TestResult {
  name: string;
  description: string;
  expectedType: 'json' | 'text';
  status: 'pending' | 'passed' | 'failed' | 'error';
  response: string;
  validation?: { valid: boolean; actionCount?: number; types?: string[] };
  error?: string;
  provider?: string;
  model?: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: string;
}

export default function AiTestPage() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setLoading(true);
    setSummary(null);
    setResults([]);

    try {
      const res = await fetch('/api/ai/test', { method: 'POST' });
      const data = await res.json();

      if (data.summary) {
        setSummary(data.summary);
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'failed':
        return <XCircle size={20} className="text-red-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-yellow-500" />;
      case 'pending':
        return <Loader size={20} className="text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full p-6 overflow-auto" style={{ background: 'var(--c-bg-0)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--c-text-0)' }}>
              AI Module Test Suite
            </h1>
            <p style={{ color: 'var(--c-text-2)' }}>
              Test automatici per validare il sistema IA
            </p>
          </div>
          <button
            onClick={runTests}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            style={{ background: 'var(--c-accent)', color: '#fff' }}
          >
            <Play size={18} />
            {loading ? 'Esecuzione...' : 'Esegui Test'}
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <div className="text-sm" style={{ color: 'var(--c-text-2)' }}>Total Tests</div>
              <div className="text-3xl font-bold" style={{ color: 'var(--c-text-0)' }}>{summary.total}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <div className="text-sm" style={{ color: 'var(--c-text-2)' }}>Passed</div>
              <div className="text-3xl font-bold text-green-500">{summary.passed}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <div className="text-sm" style={{ color: 'var(--c-text-2)' }}>Failed</div>
              <div className="text-3xl font-bold text-red-500">{summary.failed}</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <div className="text-sm" style={{ color: 'var(--c-text-2)' }}>Success Rate</div>
              <div className="text-3xl font-bold" style={{ color: 'var(--c-accent)' }}>{summary.successRate}</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="rounded-lg overflow-hidden border"
              style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}
            >
              <div
                className="p-4 flex items-start gap-4 cursor-pointer hover:opacity-80 transition"
                style={{
                  background: result.status === 'passed' ? 'rgba(34, 197, 94, 0.1)' : result.status === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                }}
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--c-text-0)' }}>
                    {result.name}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: 'var(--c-text-2)' }}>
                    {result.description}
                  </p>
                  <div className="flex gap-4 text-xs mb-2">
                    <span style={{ color: 'var(--c-text-3)' }}>Expected: {result.expectedType}</span>
                    {result.provider && <span style={{ color: 'var(--c-text-3)' }}>Provider: {result.provider}</span>}
                    {result.model && <span style={{ color: 'var(--c-text-3)' }}>Model: {result.model}</span>}
                  </div>

                  {result.validation && result.validation.valid && (
                    <div className="text-xs mb-2 p-2 rounded" style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}>
                      Valid JSON - {result.validation.actionCount} blocchi - Types: {result.validation.types?.join(', ')}
                    </div>
                  )}

                  {result.error && (
                    <div className="text-xs mb-2 p-2 rounded text-red-500" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                      {result.error}
                    </div>
                  )}

                  <div
                    className="text-xs p-2 rounded font-mono overflow-auto max-h-32"
                    style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-2)' }}
                  >
                    {result.response}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && results.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--c-text-2)' }}>
            <p>Premi il bottone per eseguire i test</p>
          </div>
        )}
      </div>
    </div>
  );
}
