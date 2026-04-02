'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { SOCIAL_PLATFORMS, type SocialPlatformKey } from '@/lib/social/platforms';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  tenant_id: string;
  article_id: string;
  platform: string;
  target_label: string;
  custom_text: string | null;
  scheduled_at: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'canceled';
  posted_at: string | null;
  post_id: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  articles?: { title: string; slug: string; cover_image_url: string | null };
}

interface ArticleOption {
  id: string;
  title: string;
  slug: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: 'var(--c-warning, #f59e0b)' },
  sending: { label: 'Invio in corso', color: 'var(--c-accent)' },
  sent: { label: 'Inviato', color: 'var(--c-success, #22c55e)' },
  failed: { label: 'Fallito', color: 'var(--c-danger, #ef4444)' },
  canceled: { label: 'Annullato', color: 'var(--c-text-3)' },
};

const ACTIVE_PLATFORMS = SOCIAL_PLATFORMS.filter((p) => p.supportsDirectApi);

function getLocalDateTimeInputMin() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function ScheduledPostsManager() {
  const { currentTenant } = useAuthStore();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformKey>('telegram');
  const [targetLabel, setTargetLabel] = useState('');
  const [customText, setCustomText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tenantId = currentTenant?.id;

  const loadPosts = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/cms/social/scheduled?tenant_id=${tenantId}`);
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch {
      toast.error('Errore caricamento post programmati');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const loadArticles = useCallback(async () => {
    if (!tenantId) return;
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100);
    if (data) setArticles(data);
  }, [tenantId]);

  useEffect(() => {
    void loadPosts();
    void loadArticles();
  }, [loadPosts, loadArticles]);

  const handleSubmit = async () => {
    if (!tenantId || !selectedArticleId || !scheduledAt) {
      toast.error('Seleziona articolo e data/ora');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/cms/social/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          posts: [{
            article_id: selectedArticleId,
            platform: selectedPlatform,
            target_label: targetLabel,
            custom_text: customText || null,
            scheduled_at: new Date(scheduledAt).toISOString(),
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      toast.success('Post programmato!');
      setShowForm(false);
      resetForm();
      void loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore programmazione post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (postId: string) => {
    if (!tenantId) return;
    try {
      const res = await fetch('/api/cms/social/scheduled', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, id: postId, status: 'canceled' }),
      });
      if (!res.ok) throw new Error('Errore annullamento');
      toast.success('Post annullato');
      void loadPosts();
    } catch {
      toast.error('Errore annullamento post');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!tenantId) return;
    try {
      const res = await fetch('/api/cms/social/scheduled', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, id: postId }),
      });
      if (!res.ok) throw new Error('Errore eliminazione');
      toast.success('Post eliminato');
      void loadPosts();
    } catch {
      toast.error('Errore eliminazione post');
    }
  };

  const resetForm = () => {
    setSelectedArticleId('');
    setSelectedPlatform('telegram');
    setTargetLabel('');
    setCustomText('');
    setScheduledAt('');
  };

  const pendingPosts = posts.filter((p) => p.status === 'pending' || p.status === 'sending');
  const completedPosts = posts.filter((p) => p.status === 'sent' || p.status === 'failed' || p.status === 'canceled');

  if (loading) {
    return (
      <div className="py-6 text-sm flex items-center gap-2" style={{ color: 'var(--c-text-2)' }}>
        <Loader2 size={14} className="animate-spin" /> Caricamento post programmati...
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} style={{ color: 'var(--c-accent)' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--c-text-0)' }}>
            Post programmati
          </h3>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
          >
            {pendingPosts.length} in coda
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setLoading(true); void loadPosts(); }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
          >
            <RefreshCw size={13} /> Aggiorna
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: 'var(--c-accent)' }}
          >
            <Plus size={13} /> Programma post
          </button>
        </div>
      </div>

      {/* Form nuovo post programmato */}
      {showForm && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-accent)', borderStyle: 'dashed' }}
        >
          <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
            Nuovo post programmato
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                Articolo *
              </span>
              <select
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">Seleziona articolo...</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                Piattaforma *
              </span>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatformKey)}
                className="input w-full text-sm"
              >
                {ACTIVE_PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                Data e ora *
              </span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input w-full text-sm"
                min={getLocalDateTimeInputMin()}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                Etichetta target
              </span>
              <input
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
                placeholder="Es: Gruppo A, Canale news..."
                className="input w-full text-sm"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                Testo personalizzato (opzionale, altrimenti usa summary articolo)
              </span>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={2}
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ border: '1px solid var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}
                placeholder="Testo del post social..."
              />
            </label>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedArticleId || !scheduledAt}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--c-accent)' }}
            >
              {submitting ? 'Salvataggio...' : 'Programma'}
            </button>
          </div>
        </div>
      )}

      {/* Lista post in coda */}
      {pendingPosts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>
            In coda ({pendingPosts.length})
          </h4>
          {pendingPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCancel={() => handleCancel(post.id)}
              onDelete={() => handleDelete(post.id)}
            />
          ))}
        </div>
      )}

      {/* Post completati/falliti */}
      {completedPosts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>
            Storico ({completedPosts.length})
          </h4>
          {completedPosts.slice(0, 20).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={() => handleDelete(post.id)}
            />
          ))}
        </div>
      )}

      {posts.length === 0 && !showForm && (
        <div
          className="rounded-2xl px-6 py-10 text-center"
          style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
        >
          <CalendarClock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--c-text-3)' }} />
          <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
            Nessun post programmato. Clicca &quot;Programma post&quot; per iniziare.
          </p>
        </div>
      )}
    </section>
  );
}

function PostCard({
  post,
  onCancel,
  onDelete,
}: {
  post: ScheduledPost;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const statusInfo = STATUS_LABELS[post.status] || { label: post.status, color: 'var(--c-text-2)' };
  const platformLabel = SOCIAL_PLATFORMS.find((p) => p.key === post.platform)?.label || post.platform;
  const scheduledDate = new Date(post.scheduled_at);
  const isPast = scheduledDate < new Date();

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
      style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
            {post.articles?.title || 'Articolo'}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
          >
            {platformLabel}
          </span>
          {post.target_label && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}
            >
              {post.target_label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--c-text-2)' }}>
            <Clock size={11} />
            {scheduledDate.toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: statusInfo.color }}>
            {post.status === 'sent' ? <CheckCircle2 size={11} /> : post.status === 'failed' ? <XCircle size={11} /> : null}
            {statusInfo.label}
          </span>
          {post.error_message && (
            <span className="text-xs" style={{ color: 'var(--c-danger, #ef4444)' }}>
              {post.error_message}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {post.status === 'pending' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
          >
            Annulla
          </button>
        )}
        {(post.status === 'failed' || post.status === 'canceled') && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-xs"
            style={{ color: 'var(--c-danger, #ef4444)' }}
            title="Elimina"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
