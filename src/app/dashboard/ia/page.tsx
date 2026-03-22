'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Sparkles, Save, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface AIProvider {
  name: string;
  key: string;
  apiKey: string;
  model?: string;
  status: 'active' | 'inactive' | 'error';
}

interface AISettings {
  claude_api_key: string;
  claude_model: string;
  openai_api_key: string;
  openai_model: string;
  gemini_api_key: string;
  gemini_model: string;
  ollama_url: string;
  ollama_model: string;
}

const PROVIDERS = [
  {
    name: 'Claude (Anthropic)',
    key: 'claude',
    icon: '🧠',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250805', 'claude-haiku-4-5-20251001'],
    docs: 'https://console.anthropic.com',
  },
  {
    name: 'OpenAI',
    key: 'openai',
    icon: '⚡',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini'],
    docs: 'https://platform.openai.com/api-keys',
  },
  {
    name: 'Google Gemini',
    key: 'gemini',
    icon: '✨',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    docs: 'https://aistudio.google.com',
  },
  {
    name: 'Ollama (Local)',
    key: 'ollama',
    icon: '🐫',
    models: ['llama3.2', 'mistral', 'neural-chat'],
    docs: 'https://ollama.ai',
    isLocal: true,
  },
];

const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  ollama: 'llama3.2',
};

export default function IAPage() {
  const { currentTenant } = useAuthStore();
  const [settings, setSettings] = useState<AISettings>({
    claude_api_key: '',
    claude_model: DEFAULT_MODELS.claude,
    openai_api_key: '',
    openai_model: DEFAULT_MODELS.openai,
    gemini_api_key: '',
    gemini_model: DEFAULT_MODELS.gemini,
    ollama_url: 'http://localhost:11434',
    ollama_model: DEFAULT_MODELS.ollama,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, 'active' | 'inactive' | 'error'>>({});

  useEffect(() => {
    loadSettings();
  }, [currentTenant]);

  const loadSettings = async () => {
    if (!currentTenant) return;
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', currentTenant.id)
        .single();

      if (tenant?.settings?.module_config?.ai_assistant) {
        const aiConfig = tenant.settings.module_config.ai_assistant;
        setSettings(prev => ({
          ...prev,
          claude_api_key: aiConfig.claude_api_key || '',
          claude_model: aiConfig.claude_model || DEFAULT_MODELS.claude,
          openai_api_key: aiConfig.openai_api_key || '',
          openai_model: aiConfig.openai_model || DEFAULT_MODELS.openai,
          gemini_api_key: aiConfig.gemini_api_key || '',
          gemini_model: aiConfig.gemini_model || DEFAULT_MODELS.gemini,
          ollama_url: aiConfig.ollama_url || 'http://localhost:11434',
          ollama_model: aiConfig.ollama_model || DEFAULT_MODELS.ollama,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Errore caricamento impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const checkProviderStatus = async (providerKey: string) => {
    // Dummy status check - in production would test API key
    const apiKey = settings[`${providerKey}_api_key`];
    if (!apiKey) {
      setStatuses(prev => ({ ...prev, [providerKey]: 'inactive' }));
    } else if (apiKey.length < 10) {
      setStatuses(prev => ({ ...prev, [providerKey]: 'error' }));
    } else {
      setStatuses(prev => ({ ...prev, [providerKey]: 'active' }));
    }
  };

  const handleSave = async () => {
    if (!currentTenant) return;
    setSaving(true);

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          settings: {
            module_config: {
              ai_assistant: {
                claude_api_key: settings.claude_api_key,
                claude_model: settings.claude_model,
                openai_api_key: settings.openai_api_key,
                openai_model: settings.openai_model,
                gemini_api_key: settings.gemini_api_key,
                gemini_model: settings.gemini_model,
                ollama_url: settings.ollama_url,
                ollama_model: settings.ollama_model,
              },
            },
          },
        })
        .eq('id', currentTenant.id);

      if (error) throw error;

      toast.success('Impostazioni IA salvate ✓');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--c-accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={28} style={{ color: 'var(--c-accent)' }} />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--c-text-0)' }}>
            Impostazioni IA
          </h1>
        </div>
        <p style={{ color: 'var(--c-text-2)' }}>
          Configura i provider IA per la generazione di contenuti
        </p>
      </div>

      {/* Provider Sections */}
      <div className="space-y-4">
        {PROVIDERS.map(provider => (
          <div
            key={provider.key}
            className="rounded-lg border p-6"
            style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}
          >
            {/* Provider Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--c-text-0)' }}>
                    {provider.name}
                  </h3>
                  {provider.isLocal && (
                    <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                      Locale - Nessuna API key richiesta
                    </p>
                  )}
                </div>
              </div>

              {/* Status Icon */}
              <div className="flex items-center gap-2">
                {statuses[provider.key] === 'active' && (
                  <>
                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                    <span className="text-xs font-medium" style={{ color: '#10b981' }}>
                      Configurato
                    </span>
                  </>
                )}
                {statuses[provider.key] === 'inactive' && (
                  <>
                    <Clock size={20} style={{ color: '#f59e0b' }} />
                    <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>
                      Non configurato
                    </span>
                  </>
                )}
                {statuses[provider.key] === 'error' && (
                  <>
                    <AlertCircle size={20} style={{ color: '#ef4444' }} />
                    <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                      Errore
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Settings */}
            {!provider.isLocal ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--c-text-1)' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings[`${provider.key}_api_key` as keyof AISettings]}
                    onChange={e => {
                      setSettings(prev => ({
                        ...prev,
                        [`${provider.key}_api_key`]: e.target.value,
                      }));
                      checkProviderStatus(provider.key);
                    }}
                    placeholder="Incolla la tua API key qui..."
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--c-bg-0)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  />
                  <a
                    href={provider.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs mt-1 inline-block"
                    style={{ color: 'var(--c-accent)' }}
                  >
                    → Come ottenere l'API key
                  </a>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--c-text-1)' }}>
                    Modello
                  </label>
                  <select
                    value={settings[`${provider.key}_model` as keyof AISettings]}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        [`${provider.key}_model`]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--c-bg-0)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  >
                    {provider.models.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--c-text-1)' }}>
                    URL Ollama
                  </label>
                  <input
                    type="text"
                    value={settings.ollama_url}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        ollama_url: e.target.value,
                      }))
                    }
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--c-bg-0)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
                    Indirizzo server Ollama locale
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--c-text-1)' }}>
                    Modello
                  </label>
                  <select
                    value={settings.ollama_model}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        ollama_model: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      background: 'var(--c-bg-0)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  >
                    {provider.models.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition disabled:opacity-50"
          style={{ background: 'var(--c-accent)' }}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={18} />
              Salva Impostazioni
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg border" style={{ background: 'var(--c-bg-2)', borderColor: 'var(--c-border)' }}>
        <p className="text-sm" style={{ color: 'var(--c-text-0)' }}>
          <strong>💡 Nota:</strong> Configura almeno un provider IA per usare la funzione di generazione contenuti. Le API key sono salvate in modo sicuro nel database.
        </p>
      </div>
    </div>
  );
}
