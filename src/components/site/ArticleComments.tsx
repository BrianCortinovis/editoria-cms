'use client';

import { useEffect, useState } from 'react';

interface CommentItem {
  id: string;
  parent_id: string | null;
  author_name: string;
  author_url?: string | null;
  body: string;
  created_at: string;
}

interface ArticleCommentsProps {
  tenantSlug: string;
  articleSlug: string;
}

export function ArticleComments({ tenantSlug, articleSlug }: ArticleCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState({
    author_name: '',
    author_email: '',
    author_url: '',
    body: '',
    website: '',
  });

  useEffect(() => {
    let active = true;

    async function loadComments() {
      try {
        const response = await fetch(`/api/v1/articles/${articleSlug}/comments?tenant=${tenantSlug}`);
        const data = await response.json();
        if (!active) return;
        setCommentsEnabled(data.commentsEnabled !== false);
        setComments(data.comments || []);
      } catch {
        if (!active) return;
        setCommentsEnabled(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadComments();
    return () => {
      active = false;
    };
  }, [articleSlug, tenantSlug]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/v1/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenantSlug,
          ...formState,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Errore invio commento');
      }

      setMessage(data.message || 'Commento inviato.');
      setFormState({
        author_name: '',
        author_email: '',
        author_url: '',
        body: '',
        website: '',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore invio commento');
    } finally {
      setSubmitting(false);
    }
  };

  if (!commentsEnabled && !loading) {
    return null;
  }

  return (
    <section style={{ marginTop: '56px' }}>
      <h2 style={{ fontFamily: 'var(--e-font-heading)', fontSize: '28px', fontWeight: 800, color: 'var(--e-color-text)' }}>
        Commenti
      </h2>

      <div style={{ marginTop: '20px', display: 'grid', gap: '20px' }}>
        {loading ? (
          <p style={{ color: 'var(--e-color-textSecondary)' }}>Caricamento commenti...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: 'var(--e-color-textSecondary)' }}>Nessun commento approvato. Puoi essere il primo a commentare.</p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              style={{
                border: '1px solid var(--e-color-border)',
                borderRadius: 'var(--e-border-radius, 8px)',
                padding: '16px',
                background: 'var(--e-color-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--e-color-text)' }}>
                  {comment.author_url ? (
                    <a href={comment.author_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {comment.author_name}
                    </a>
                  ) : (
                    comment.author_name
                  )}
                </strong>
                <time style={{ color: 'var(--e-color-textSecondary)', fontSize: '13px' }}>
                  {new Date(comment.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              </div>
              <p style={{ color: 'var(--e-color-textSecondary)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {comment.body}
              </p>
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: '28px',
          border: '1px solid var(--e-color-border)',
          borderRadius: 'var(--e-border-radius, 8px)',
          padding: '20px',
          display: 'grid',
          gap: '14px',
        }}
      >
        <h3 style={{ margin: 0, color: 'var(--e-color-text)', fontSize: '18px', fontWeight: 700 }}>
          Lascia un commento
        </h3>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <input
            value={formState.author_name}
            onChange={(event) => setFormState((prev) => ({ ...prev, author_name: event.target.value }))}
            placeholder="Nome"
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--e-color-border)' }}
          />
          <input
            value={formState.author_email}
            onChange={(event) => setFormState((prev) => ({ ...prev, author_email: event.target.value }))}
            placeholder="Email"
            type="email"
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--e-color-border)' }}
          />
        </div>
        <input
          value={formState.author_url}
          onChange={(event) => setFormState((prev) => ({ ...prev, author_url: event.target.value }))}
          placeholder="Sito web (opzionale)"
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--e-color-border)' }}
        />
        <input
          value={formState.website}
          onChange={(event) => setFormState((prev) => ({ ...prev, website: event.target.value }))}
          placeholder="Website"
          tabIndex={-1}
          autoComplete="off"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
        />
        <textarea
          value={formState.body}
          onChange={(event) => setFormState((prev) => ({ ...prev, body: event.target.value }))}
          placeholder="Scrivi il tuo commento"
          required
          rows={5}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--e-color-border)' }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            border: 0,
            background: 'var(--e-color-primary)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Invio...' : 'Invia commento'}
        </button>
        {message && (
          <p style={{ margin: 0, color: 'var(--e-color-textSecondary)', fontSize: '14px' }}>
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
