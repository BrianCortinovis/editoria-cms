'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Sparkles, Settings, Brain, BarChart3, Loader2 } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  isActive: boolean;
}

interface JournalistProfile {
  id: string;
  name: string;
  email: string;
  style: string;
  tone: string;
  keywords: string[];
  articleCount: number;
  trainingStatus: 'pending' | 'training' | 'complete';
}

export default function IASettingsPage() {
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState<AIModel[]>([]);
  const [journalists, setJournalists] = useState<JournalistProfile[]>([]);
  const [publicationStyle, setPublicationStyle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/settings');
      const data = await res.json();
      setModels(data.models || []);
      setJournalists(data.journalists || []);
      setPublicationStyle(data.publicationStyle);
    } catch (error) {
      console.error('Error loading AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const trainOnArticles = async () => {
    setLoading(true);
    setTrainingProgress(0);
    try {
      const res = await fetch('/api/ai/train', {
        method: 'POST',
      });
      const data = await res.json();
      setJournalists(data.journalists);
      setPublicationStyle(data.publicationStyle);
    } catch (error) {
      console.error('Error training on articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={32} className="text-blue-500" />
            IA & Intelligenza Artificiale
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Configura modelli IA, addestramento e stili</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Settings size={16} /> Modelli
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Brain size={16} /> Addestramento
          </TabsTrigger>
          <TabsTrigger value="journalists" className="flex items-center gap-2">
            <BarChart3 size={16} /> Giornalisti
          </TabsTrigger>
          <TabsTrigger value="publication" className="flex items-center gap-2">
            <Sparkles size={16} /> Stile Rivista
          </TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Modelli IA Disponibili</CardTitle>
              <CardDescription>Configura quali modelli IA vuoi usare nel CMS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {models.map((model) => (
                <div key={model.id} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{model.name}</h3>
                    <p className="text-sm text-zinc-500">{model.provider.toUpperCase()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={model.isActive ? 'default' : 'outline'} size="sm">
                      {model.isActive ? 'Attivo' : 'Inattivo'}
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                <h4 className="font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Aggiungi nuovo modello</h4>
                <div className="space-y-3">
                  <Select
                    label="Provider"
                    options={[
                      { value: 'openai', label: 'OpenAI (GPT-4)' },
                      { value: 'anthropic', label: 'Anthropic (Claude)' },
                      { value: 'ollama', label: 'Ollama (Local)' },
                    ]}
                    onChange={() => {}}
                  />
                  <Input placeholder="Nome modello (es: Claude 3 Opus)" />
                  <Input placeholder="API Key (se applicabile)" type="password" />
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Aggiungi Modello</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Addestramento IA</CardTitle>
              <CardDescription>Addestra il sistema sugli articoli pubblicati per imparare stili e toni</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  L'addestramento analizzerà tutti gli articoli pubblicati per creare profili stilistici per ogni giornalista e un profilo generale della rivista.
                </p>
              </div>

              {trainingProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Addestramento in corso...</span>
                    <span>{trainingProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${trainingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={trainOnArticles}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Addestramento in corso...
                  </>
                ) : (
                  <>
                    <Brain size={16} className="mr-2" />
                    Avvia Addestramento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journalists Tab */}
        <TabsContent value="journalists" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profili Giornalisti</CardTitle>
              <CardDescription>Profili stilistici creati dall'addestramento</CardDescription>
            </CardHeader>
            <CardContent>
              {journalists.length === 0 ? (
                <div className="text-center py-8">
                  <Brain size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                  <p className="text-zinc-500">Nessun profilo ancora. Avvia l'addestramento prima.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalists.map((journalist) => (
                    <div key={journalist.id} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{journalist.name}</h3>
                          <p className="text-sm text-zinc-500">{journalist.email}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-xs rounded-full">
                          {journalist.articleCount} articoli
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Stile:</span>
                          <p className="text-zinc-600 dark:text-zinc-400">{journalist.style}</p>
                        </div>
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Tono:</span>
                          <p className="text-zinc-600 dark:text-zinc-400">{journalist.tone}</p>
                        </div>
                        {journalist.keywords.length > 0 && (
                          <div>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Parole chiave:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {journalist.keywords.slice(0, 5).map((keyword) => (
                                <span key={keyword} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded">
                                  {keyword}
                                </span>
                              ))}
                              {journalist.keywords.length > 5 && (
                                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded">
                                  +{journalist.keywords.length - 5} altro
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publication Style Tab */}
        <TabsContent value="publication" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Stile Generale Rivista</CardTitle>
              <CardDescription>Profilo stilistico complessivo della testata</CardDescription>
            </CardHeader>
            <CardContent>
              {publicationStyle ? (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg space-y-3">
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Tono Generale</h4>
                      <p className="text-zinc-600 dark:text-zinc-400">{publicationStyle.tone}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Orientamento Politico</h4>
                      <p className="text-zinc-600 dark:text-zinc-400">{publicationStyle.politicalOrientation || 'Non definito'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Settori Principali</h4>
                      <div className="flex flex-wrap gap-2">
                        {publicationStyle.mainSectors?.map((sector: string) => (
                          <span key={sector} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-sm rounded-full">
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Caratteristiche Stilistiche</h4>
                      <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {publicationStyle.characteristics?.map((char: string, i: number) => (
                          <li key={i}>• {char}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                  <p className="text-zinc-500">Nessun profilo creato. Avvia l'addestramento per analizzare la rivista.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
