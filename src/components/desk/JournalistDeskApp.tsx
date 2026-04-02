'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import slugify from 'slugify';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { requestPublishTrigger } from '@/lib/publish/client';
import { useAuthStore } from '@/lib/store';
import { parseAIResponse } from '@/lib/utils/parse';
import TiptapEditor, { type TiptapEditorHandle } from '@/components/editor/TiptapEditor';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileAudio,
  FileText,
  Eye,
  Image as ImageIcon,
  Loader2,
  Mic,
  Monitor,
  Smartphone,
  Tablet,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Video,
  Wand2,
  Zap,
} from 'lucide-react';

type ArticleStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';

type JournalistArticle = {
  id: string;
  title: string;
  status: ArticleStatus;
  updated_at: string;
  published_at: string | null;
  summary: string | null;
  body: string;
  category_id: string | null;
  cover_image_url: string | null;
  import_metadata: Record<string, unknown> | null;
};

type Category = {
  id: string;
  name: string;
};

type MediaAttachment = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
};

type AIArticlePayload = {
  title: string;
  summary: string;
  body: string;
};

type JournalistDeskSettings = {
  allowContributorAccess: boolean;
  allowEditorAccess: boolean;
  allowChiefEditorAccess: boolean;
  allowClassicMode: boolean;
  allowAiMode: boolean;
  allowPhotoUpload: boolean;
  allowVideoUpload: boolean;
  allowAudioUpload: boolean;
  allowCategorySelection: boolean;
  allowCoverEdit: boolean;
  allowSendToReview: boolean;
  allowBreakingNewsManagement: boolean;
};

type BreakingItem = {
  id: string;
  text: string;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  expires_at: string | null;
};

const TONE_PRESETS = [
  { id: 'neutro', label: 'Neutro' },
  { id: 'giornalistico', label: 'Giornalistico' },
  { id: 'urgente', label: 'Urgente' },
  { id: 'coinvolgente', label: 'Coinvolgente' },
  { id: 'istituzionale', label: 'Istituzionale' },
  { id: 'narrativo', label: 'Narrativo' },
];

const STYLE_PRESETS = [
  { id: 'flash', label: 'Flash breve' },
  { id: 'classico', label: 'Articolo classico' },
  { id: 'approfondimento', label: 'Approfondimento' },
  { id: 'live', label: 'Aggiornamento live' },
  { id: 'intervista', label: 'Intervista / testimonianza' },
];

const ALLOWED_CAPTURE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
]);

const ALLOWED_CAPTURE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'mp4',
  'webm',
  'mov',
  'mp3',
  'm4a',
  'wav',
  'ogg',
]);

const MAX_UPLOAD_SIZE_BYTES = 150 * 1024 * 1024;
const DEFAULT_DESK_SETTINGS: JournalistDeskSettings = {
  allowContributorAccess: true,
  allowEditorAccess: true,
  allowChiefEditorAccess: true,
  allowClassicMode: true,
  allowAiMode: true,
  allowPhotoUpload: true,
  allowVideoUpload: true,
  allowAudioUpload: true,
  allowCategorySelection: true,
  allowCoverEdit: true,
  allowSendToReview: true,
  allowBreakingNewsManagement: true,
};

function extractDeskMedia(meta: Record<string, unknown> | null | undefined): MediaAttachment[] {
  const raw = meta?.desk_media;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: String(item.id || ''),
      name: String(item.name || 'Media'),
      mimeType: String(item.mimeType || ''),
      url: String(item.url || ''),
    }))
    .filter((item) => item.id && item.url);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLocalDateTimeInputValue(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIsoDateTimeOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmbeddedMediaHtml(
  media: MediaAttachment,
  align: 'full' | 'left' | 'right' | 'center' = 'center'
) {
  const safeUrl = escapeHtml(media.url);
  const safeName = escapeHtml(media.name);
  const imageStyleMap: Record<'full' | 'left' | 'right' | 'center', string> = {
    full: 'display:block;width:100%;margin:16px 0;',
    center: 'display:block;max-width:80%;margin:16px auto;',
    left: 'float:left;max-width:50%;margin:0 16px 8px 0;',
    right: 'float:right;max-width:50%;margin:0 0 8px 16px;',
  };

  if (media.mimeType.startsWith('image/')) {
    return `<p><img src="${safeUrl}" alt="${safeName}" class="editor-image" data-align="${align}" style="${imageStyleMap[align]}" /></p>`;
  }

  if (media.mimeType.startsWith('video/')) {
    return `
      <figure data-type="uploaded-video" style="margin:16px 0;">
        <video controls preload="metadata" style="width:100%;border-radius:8px;" src="${safeUrl}"></video>
        <figcaption style="margin-top:8px;font-size:13px;color:var(--c-text-2);">${safeName}</figcaption>
      </figure>
    `;
  }

  if (media.mimeType.startsWith('audio/')) {
    return `
      <figure data-type="uploaded-audio" style="margin:16px 0;">
        <audio controls preload="metadata" style="width:100%;" src="${safeUrl}"></audio>
        <figcaption style="margin-top:8px;font-size:13px;color:var(--c-text-2);">${safeName}</figcaption>
      </figure>
    `;
  }

  return `<p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeName}</a></p>`;
}

function buildMediaGalleryHtml(items: MediaAttachment[]) {
  const imageItems = items.filter((item) => item.mimeType.startsWith('image/'));
  const videoItems = items.filter((item) => item.mimeType.startsWith('video/'));
  const audioItems = items.filter((item) => item.mimeType.startsWith('audio/'));

  const imageHtml = imageItems.map((item) => `
    <figure class="desk-gallery-item" data-gallery-kind="image">
      <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.name)}" loading="lazy" />
      <figcaption>${escapeHtml(item.name)}</figcaption>
    </figure>
  `).join('');

  const videoHtml = videoItems.map((item) => `
    <figure class="desk-gallery-item" data-gallery-kind="video">
      <video controls preload="metadata" src="${escapeHtml(item.url)}"></video>
      <figcaption>${escapeHtml(item.name)}</figcaption>
    </figure>
  `).join('');

  const audioHtml = audioItems.map((item) => `
    <figure class="desk-gallery-item" data-gallery-kind="audio">
      <audio controls preload="metadata" src="${escapeHtml(item.url)}"></audio>
      <figcaption>${escapeHtml(item.name)}</figcaption>
    </figure>
  `).join('');

  return `
    <section data-media-gallery="grid">
      ${imageHtml}
      ${videoHtml}
      ${audioHtml}
    </section>
  `;
}

type JournalistDeskAppProps = {
  showSettings?: boolean;
  standalone?: boolean;
  previewDevice?: 'phone' | 'tablet' | 'desktop';
  embeddedPreview?: boolean;
};

export default function JournalistDeskApp({
  showSettings = false,
  standalone = false,
  previewDevice = 'desktop',
  embeddedPreview = false,
}: JournalistDeskAppProps) {
  const supabase = useMemo(() => createClient(), []);
  const { currentTenant, currentRole, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'classic' | 'ai'>('classic');
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState<'editor' | 'preview'>('editor');
  const [showProjectsMobile, setShowProjectsMobile] = useState(false);
  const [deskSettings, setDeskSettings] = useState<JournalistDeskSettings>(DEFAULT_DESK_SETTINGS);
  const [savingDeskSettings, setSavingDeskSettings] = useState(false);
  const [deskPreviewDevice, setDeskPreviewDevice] = useState<'phone' | 'tablet' | 'desktop'>('phone');

  const [articles, setArticles] = useState<JournalistArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [breakingItems, setBreakingItems] = useState<BreakingItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const [previewNonce, setPreviewNonce] = useState(() => Date.now());
  const [showBreakingForm, setShowBreakingForm] = useState(false);
  const [editingBreakingId, setEditingBreakingId] = useState<string | null>(null);
  const [breakingText, setBreakingText] = useState('');
  const [breakingLinkUrl, setBreakingLinkUrl] = useState('');
  const [breakingPriority, setBreakingPriority] = useState(0);
  const [breakingExpiresAt, setBreakingExpiresAt] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFacts, setAiFacts] = useState('');
  const [aiInputs, setAiInputs] = useState('');
  const [tonePreset, setTonePreset] = useState('giornalistico');
  const [stylePreset, setStylePreset] = useState('classico');
  const [toneSlider, setToneSlider] = useState(45);
  const [lengthSlider, setLengthSlider] = useState(55);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bodyEditorRef = useRef<TiptapEditorHandle>(null);
  const canConfigureDesk = currentRole === 'admin' || currentRole === 'chief_editor';

  const canPublish =
    currentRole === 'admin' || currentRole === 'chief_editor' || currentRole === 'editor';
  const canManageBreaking =
    (currentRole === 'admin' || currentRole === 'chief_editor' || currentRole === 'editor') &&
    deskSettings.allowBreakingNewsManagement;
  const canUseDesk =
    currentRole === 'admin' ||
    (currentRole === 'chief_editor' && deskSettings.allowChiefEditorAccess) ||
    (currentRole === 'editor' && deskSettings.allowEditorAccess) ||
    (currentRole === 'contributor' && deskSettings.allowContributorAccess);

  const selectedArticle = articles.find((article) => article.id === selectedId) || null;
  const selectedGalleryItems = attachments.filter((item) => selectedAttachmentIds.includes(item.id));
  const previewDeviceConfig = {
    phone: { width: 390, height: 844, label: 'Smartphone' },
    tablet: { width: 820, height: 1080, label: 'Tablet' },
    desktop: { width: 1280, height: 900, label: 'Desktop' },
  }[previewDevice];

  const hydrateArticle = useCallback((article: JournalistArticle | null) => {
    if (!article) {
      setTitle('');
      setSummary('');
      setBody('');
      setCategoryId('');
      setCoverImageUrl('');
      setPublishedAt(null);
      setAttachments([]);
      setSelectedAttachmentIds([]);
      setAiPrompt('');
      setAiFacts('');
      setAiInputs('');
      return;
    }

    setTitle(article.title || '');
    setSummary(article.summary || '');
    setBody(article.body || '');
    setCategoryId(String(article.category_id || article.import_metadata?.desk_category_id || ''));
    setCoverImageUrl(article.cover_image_url || '');
    setPublishedAt(article.published_at || null);
    setAttachments(extractDeskMedia(article.import_metadata));
    setSelectedAttachmentIds([]);
    setPreviewNonce(Date.now());
    setMobileWorkspaceView('editor');
    setAiPrompt(String(article.import_metadata?.desk_ai_prompt || ''));
    setAiFacts(String(article.import_metadata?.desk_ai_facts || ''));
    setAiInputs(String(article.import_metadata?.desk_ai_inputs || ''));
    setTonePreset(String(article.import_metadata?.desk_tone_preset || 'giornalistico'));
    setStylePreset(String(article.import_metadata?.desk_style_preset || 'classico'));
    setToneSlider(
      clamp(Number(article.import_metadata?.desk_tone_slider ?? 45) || 45, 0, 100)
    );
    setLengthSlider(
      clamp(Number(article.import_metadata?.desk_length_slider ?? 55) || 55, 0, 100)
    );
  }, []);

  const loadDesk = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [articlesRes, categoriesRes, tenantRes, breakingRes] = await Promise.all([
      supabase
        .from('articles')
        .select('id, title, status, updated_at, published_at, summary, body, category_id, cover_image_url, import_metadata')
        .eq('tenant_id', currentTenant.id)
        .eq('author_id', user.id)
        .in('status', ['draft', 'in_review', 'approved'])
        .order('updated_at', { ascending: false })
        .limit(20),
      supabase
        .from('categories')
        .select('id, name')
        .eq('tenant_id', currentTenant.id)
        .order('sort_order'),
      supabase
        .from('tenants')
        .select('settings')
        .eq('id', currentTenant.id)
        .single(),
      fetch(`/api/cms/breaking-news?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      }).then(async (response) => {
        if (!response.ok) return [];
        const payload = (await response.json()) as { items?: BreakingItem[] };
        return Array.isArray(payload.items) ? payload.items : [];
      }).catch(() => [] as BreakingItem[]),
    ]);

    if (articlesRes.data) {
      const nextArticles = articlesRes.data as JournalistArticle[];
      setArticles(nextArticles);
      const nextSelected =
        nextArticles.find((item) => item.id === selectedId) || nextArticles[0] || null;
      setSelectedId(nextSelected?.id || null);
      hydrateArticle(nextSelected);
    }

    if (categoriesRes.data) {
      setCategories(categoriesRes.data as Category[]);
    }

    setBreakingItems(breakingRes);

    if (tenantRes.data) {
      const settings = (tenantRes.data.settings || {}) as Record<string, unknown>;
      const moduleConfig =
        settings.module_config && typeof settings.module_config === 'object'
          ? (settings.module_config as Record<string, unknown>)
          : {};
      const deskConfigRaw =
        moduleConfig.journalist_desk && typeof moduleConfig.journalist_desk === 'object'
          ? (moduleConfig.journalist_desk as Record<string, unknown>)
          : {};

      setDeskSettings({
        allowContributorAccess: deskConfigRaw.allowContributorAccess !== false,
        allowEditorAccess: deskConfigRaw.allowEditorAccess !== false,
        allowChiefEditorAccess: deskConfigRaw.allowChiefEditorAccess !== false,
        allowClassicMode: deskConfigRaw.allowClassicMode !== false,
        allowAiMode: deskConfigRaw.allowAiMode !== false,
        allowPhotoUpload: deskConfigRaw.allowPhotoUpload !== false,
        allowVideoUpload: deskConfigRaw.allowVideoUpload !== false,
        allowAudioUpload: deskConfigRaw.allowAudioUpload !== false,
        allowCategorySelection: deskConfigRaw.allowCategorySelection !== false,
        allowCoverEdit: deskConfigRaw.allowCoverEdit !== false,
        allowSendToReview: deskConfigRaw.allowSendToReview !== false,
        allowBreakingNewsManagement: deskConfigRaw.allowBreakingNewsManagement !== false,
      });
    }

    setLoading(false);
  }, [currentTenant, hydrateArticle, selectedId, supabase, user]);

  useEffect(() => {
    void loadDesk();
  }, [loadDesk]);

  useEffect(() => {
    if (!deskSettings.allowClassicMode && deskSettings.allowAiMode) {
      setMode('ai');
      return;
    }
    if (!deskSettings.allowAiMode && deskSettings.allowClassicMode) {
      setMode('classic');
    }
  }, [deskSettings]);

  const saveDeskSettings = async () => {
    if (!currentTenant || !canConfigureDesk) return;

    setSavingDeskSettings(true);
    const { data, error: loadError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', currentTenant.id)
      .single();

    if (loadError) {
      setSavingDeskSettings(false);
      toast.error('Errore lettura configurazione desk');
      return;
    }

    const currentSettings = (data?.settings || {}) as Record<string, unknown>;
    const currentModuleConfig =
      currentSettings.module_config && typeof currentSettings.module_config === 'object'
        ? (currentSettings.module_config as Record<string, unknown>)
        : {};

    const { error } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
          module_config: {
            ...currentModuleConfig,
            journalist_desk: deskSettings,
          },
        },
      })
      .eq('id', currentTenant.id);

    setSavingDeskSettings(false);
    if (error) {
      toast.error('Salvataggio configurazione desk non riuscito');
      return;
    }
    toast.success('Configurazione app giornalista salvata');
  };

  const createDraftProject = async () => {
    if (!currentTenant || !user) return;
    setCreating(true);
    const now = new Date();
    const tempTitle = `Bozza mobile ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const { data, error } = await supabase
      .from('articles')
      .insert({
        tenant_id: currentTenant.id,
        author_id: user.id,
        title: tempTitle,
        slug: slugify(tempTitle, { lower: true, strict: true, locale: 'it' }),
        body: '',
        summary: null,
        status: 'draft',
        published_at: null,
        import_source: 'journalist_desk',
        import_metadata: {
          desk_origin: 'mobile_journalist_app',
          desk_media: [],
        },
      })
      .select('id, title, status, updated_at, published_at, summary, body, category_id, cover_image_url, import_metadata')
      .single();

    setCreating(false);
    if (error || !data) {
      toast.error(error?.message || 'Creazione progetto non riuscita');
      return;
    }

    const article = data as JournalistArticle;
    setArticles((prev) => [article, ...prev]);
    setSelectedId(article.id);
    hydrateArticle(article);
    setShowProjectsMobile(false);
    toast.success('Progetto articolo creato');
  };

  const saveArticle = async (nextStatus?: ArticleStatus) => {
    if (!currentTenant || !user || !selectedId) {
      toast.error('Crea o seleziona prima un progetto articolo');
      return;
    }
    if (!title.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }

    setSaving(true);
    const finalStatus = nextStatus || selectedArticle?.status || 'draft';
    const nextPublishedAt =
      finalStatus === 'published'
        ? selectedArticle?.published_at || publishedAt || new Date().toISOString()
        : selectedArticle?.published_at || publishedAt || null;
    const payload = {
      title: title.trim(),
      slug: slugify(title, { lower: true, strict: true, locale: 'it' }),
      summary: summary.trim() || null,
      body,
      category_id: categoryId || null,
      cover_image_url: coverImageUrl || null,
      status: finalStatus,
      published_at: nextPublishedAt,
      import_metadata: {
        ...(selectedArticle?.import_metadata || {}),
        desk_origin: 'mobile_journalist_app',
        desk_category_id: categoryId || null,
        desk_media: attachments,
        desk_ai_prompt: aiPrompt,
        desk_ai_facts: aiFacts,
        desk_ai_inputs: aiInputs,
        desk_tone_preset: tonePreset,
        desk_style_preset: stylePreset,
        desk_tone_slider: toneSlider,
        desk_length_slider: lengthSlider,
      },
    };

    const { data, error } = await supabase
      .from('articles')
      .update(payload)
      .eq('id', selectedId)
      .select('id, title, status, updated_at, published_at, summary, body, category_id, cover_image_url, import_metadata')
      .single();

    setSaving(false);
    if (error || !data) {
      toast.error(error?.message || 'Salvataggio non riuscito');
      return;
    }

    const updated = data as JournalistArticle;
    setArticles((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setPublishedAt(updated.published_at || nextPublishedAt);
    hydrateArticle(updated);
    setPreviewNonce(Date.now());

    try {
      await requestPublishTrigger(currentTenant.id, [
        { type: 'article', articleId: updated.id },
        { type: 'homepage' },
        ...(categoryId ? [{ type: 'category' as const, categoryId }] : []),
      ]);
    } catch (publishError) {
      const publishMessage = publishError instanceof Error ? publishError.message : 'Publish non aggiornato';
      toast.error(`Contenuto salvato, ma il publish non e' stato aggiornato: ${publishMessage}`);
    }

    toast.success(
      finalStatus === 'in_review'
        ? 'Articolo inviato in revisione'
        : finalStatus === 'published'
          ? 'Articolo pubblicato'
          : 'Bozza salvata'
    );
  };

  const uploadCaptureFiles = async (files: FileList | null) => {
    if (!files || !currentTenant || !user || !selectedId) {
      toast.error('Crea prima un progetto articolo');
      return;
    }

    setUploading(true);
    const nextAttachments: MediaAttachment[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if ((!ALLOWED_CAPTURE_MIME_TYPES.has(file.type) && file.type !== '') || !ALLOWED_CAPTURE_EXTENSIONS.has(ext)) {
        toast.error(`Formato non consentito: ${file.name}`);
        continue;
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        toast.error(`${file.name} supera il limite di 150MB`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', currentTenant.id);
      formData.append('tenant_slug', currentTenant.slug);

      const response = await fetch('/api/cms/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.media) {
        toast.error(payload?.error || `Upload fallito: ${file.name}`);
        continue;
      }

      const attachment: MediaAttachment = {
        id: payload.media.id,
        name: payload.media.original_filename,
        mimeType: payload.media.mime_type,
        url: payload.media.url,
      };

      nextAttachments.push(attachment);
    }

    if (nextAttachments.length > 0) {
      const merged = [...attachments, ...nextAttachments];
      setAttachments(merged);
      const firstImage = merged.find((item) => item.mimeType.startsWith('image/'));
      if (!coverImageUrl && firstImage) {
        setCoverImageUrl(firstImage.url);
      }

      await supabase
        .from('articles')
        .update({
          cover_image_url: coverImageUrl || firstImage?.url || null,
          import_metadata: {
            ...(selectedArticle?.import_metadata || {}),
            desk_origin: 'mobile_journalist_app',
            desk_media: merged,
          },
        })
        .eq('id', selectedId);

      toast.success(`${nextAttachments.length} media collegati al progetto`);
    }

    setUploading(false);
  };

  const syncAttachmentState = useCallback(
    async (nextAttachments: MediaAttachment[], nextCoverImageUrl: string | null = coverImageUrl || null) => {
      if (!selectedId) return;

      const { error } = await supabase
        .from('articles')
        .update({
          cover_image_url: nextCoverImageUrl,
          import_metadata: {
            ...(selectedArticle?.import_metadata || {}),
            desk_origin: 'mobile_journalist_app',
            desk_media: nextAttachments,
          },
        })
        .eq('id', selectedId);

      if (error) {
        toast.error('Salvataggio raccolta media non riuscito');
      }
    },
    [coverImageUrl, selectedArticle?.import_metadata, selectedId, supabase]
  );

  const generateWithAI = async () => {
    if (!currentTenant || !selectedId) {
      toast.error('Crea prima un progetto articolo');
      return;
    }

    setGenerating(true);

    const promptInstructions = aiPrompt.trim();
    const systemPrompt = `Sei un assistente giornalistico italiano per cronaca e notizie locali.
Genera SEMPRE un JSON valido nel formato:
{
  "title": "...",
  "summary": "...",
  "body": "..."
}

Regole:
- Scrivi in italiano.
- Usa i dati ricevuti come fonte principale.
- Il tono e lo stile richiesti dal prompt utente hanno priorità assoluta su preset o slider.
- Se il prompt dell'utente chiede un tono specifico, seguilo anche se differisce dai preset.
- Il testo deve essere pubblicabile come prima bozza professionale.
- Non spiegare il JSON, non usare markdown, non aggiungere testo esterno al JSON.`;

    const composedPrompt = `
PROGETTO ARTICOLO
- Titolo attuale: ${title || 'non definito'}
- Categoria: ${categories.find((item) => item.id === categoryId)?.name || 'non definita'}
- Tono preset: ${tonePreset}
- Intensità tono slider (0-100): ${clamp(toneSlider, 0, 100)}
- Stile preset: ${stylePreset}
- Lunghezza slider (0-100): ${clamp(lengthSlider, 0, 100)}

INPUTS GREZZI
${aiInputs || 'Nessun input grezzo inserito.'}

FATTI / APPUNTI
${aiFacts || 'Nessun fatto aggiunto.'}

ISTRUZIONI UTENTE
${promptInstructions || 'Nessuna istruzione aggiuntiva.'}

MEDIA RACCOLTI
${attachments.length > 0 ? attachments.map((item) => `- ${item.name} (${item.mimeType})`).join('\n') : 'Nessun media caricato.'}

RICHIESTA
Genera un articolo completo con titolo, sommario e corpo. Se le istruzioni utente chiedono un tono speciale, quello prevale sui preset.`;

    try {
      const response = await fetch('/api/ai/freeform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          task: 'summary',
          system: systemPrompt,
          prompt: composedPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Generazione IA non riuscita');
        setGenerating(false);
        return;
      }

      const parsed = parseAIResponse<AIArticlePayload>(data.text);
      if (!parsed || typeof parsed === 'string') {
        toast.error('L’IA non ha restituito un JSON valido');
        setGenerating(false);
        return;
      }

      setTitle(parsed.title || title);
      setSummary(parsed.summary || summary);
      setBody(parsed.body || body);
      toast.success(`Bozza generata con ${data.provider}`);
    } catch (error) {
      console.error(error);
      toast.error('Errore di connessione IA');
    } finally {
      setGenerating(false);
    }
  };

  const audioCount = attachments.filter((item) => item.mimeType.startsWith('audio/')).length;
  const videoCount = attachments.filter((item) => item.mimeType.startsWith('video/')).length;
  const photoCount = attachments.filter((item) => item.mimeType.startsWith('image/')).length;
  const primaryActionLabel = canPublish ? 'Pubblica' : 'Invia in revisione';
  const primaryActionStatus: ArticleStatus = canPublish ? 'published' : 'in_review';
  const canShowPrimaryAction = canPublish || deskSettings.allowSendToReview;
  const previewUrl = selectedId ? `/giornalista/preview/${selectedId}?ts=${previewNonce}` : null;
  const deskShellPreviewUrl = `/giornalista?frame=1&device=${deskPreviewDevice}&ts=${previewNonce}`;
  const insertAttachmentIntoBody = useCallback((media: MediaAttachment, align: 'full' | 'left' | 'right' | 'center' = 'center') => {
    const html = buildEmbeddedMediaHtml(media, align);
    if (bodyEditorRef.current) {
      bodyEditorRef.current.focus();
      bodyEditorRef.current.insertHtml(html);
    } else {
      setBody((prev) => `${prev}${prev.trim() ? '\n' : ''}${html}`);
    }
    toast.success(`Media inserito nel corpo articolo: ${media.name}`);
  }, []);

  const toggleAttachmentSelection = useCallback((attachmentId: string) => {
    setSelectedAttachmentIds((prev) =>
      prev.includes(attachmentId) ? prev.filter((id) => id !== attachmentId) : [...prev, attachmentId]
    );
  }, []);

  const moveAttachment = useCallback((attachmentId: string, direction: -1 | 1) => {
    setAttachments((prev) => {
      const index = prev.findIndex((item) => item.id === attachmentId);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      void syncAttachmentState(next);
      return next;
    });
  }, [syncAttachmentState]);

  const removeAttachment = useCallback((attachmentId: string) => {
    const removedAttachment = attachments.find((item) => item.id === attachmentId) || null;
    const nextAttachments = attachments.filter((item) => item.id !== attachmentId);
    const nextCoverImageUrl =
      removedAttachment?.url && removedAttachment.url === coverImageUrl
        ? nextAttachments.find((item) => item.mimeType.startsWith('image/'))?.url || ''
        : coverImageUrl;

    setAttachments(nextAttachments);
    setSelectedAttachmentIds((prev) => prev.filter((id) => id !== attachmentId));
    if (nextCoverImageUrl !== coverImageUrl) {
      setCoverImageUrl(nextCoverImageUrl);
    }
    void syncAttachmentState(nextAttachments, nextCoverImageUrl || null);
    toast.success('Media rimosso dalla raccolta articolo');
  }, [attachments, coverImageUrl, syncAttachmentState]);

  const insertSelectedGallery = useCallback(() => {
    if (selectedGalleryItems.length === 0) {
      toast.error('Seleziona almeno un media per creare la gallery');
      return;
    }

    const html = buildMediaGalleryHtml(selectedGalleryItems);
    if (bodyEditorRef.current) {
      bodyEditorRef.current.focus();
      bodyEditorRef.current.insertHtml(html);
    } else {
      setBody((prev) => `${prev}${prev.trim() ? '\n' : ''}${html}`);
    }
    toast.success(`Gallery inserita con ${selectedGalleryItems.length} media`);
  }, [selectedGalleryItems]);

  const resetBreakingForm = useCallback(() => {
    setShowBreakingForm(false);
    setEditingBreakingId(null);
    setBreakingText('');
    setBreakingLinkUrl('');
    setBreakingPriority(0);
    setBreakingExpiresAt('');
  }, []);

  const startBreakingEdit = useCallback((item: BreakingItem) => {
    setEditingBreakingId(item.id);
    setBreakingText(item.text);
    setBreakingLinkUrl(item.link_url || '');
    setBreakingPriority(item.priority || 0);
    setBreakingExpiresAt(getLocalDateTimeInputValue(item.expires_at));
    setShowBreakingForm(true);
  }, []);

  const saveBreakingItem = useCallback(async () => {
    if (!currentTenant || !breakingText.trim()) {
      toast.error('Il testo della breaking news è obbligatorio');
      return;
    }

    const payload = {
      tenant_id: currentTenant.id,
      text: breakingText.trim(),
      link_url: breakingLinkUrl || null,
      priority: breakingPriority,
      expires_at: toIsoDateTimeOrNull(breakingExpiresAt),
      is_active: true,
    };

    const response = editingBreakingId
      ? await fetch(`/api/cms/breaking-news/${editingBreakingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        })
      : await fetch('/api/cms/breaking-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(data?.error || 'Salvataggio breaking news non riuscito');
      return;
    }

    await loadDesk();
    resetBreakingForm();
    toast.success(editingBreakingId ? 'Breaking news aggiornata' : 'Breaking news creata');
  }, [breakingExpiresAt, breakingLinkUrl, breakingPriority, breakingText, currentTenant, editingBreakingId, loadDesk, resetBreakingForm]);

  const toggleBreakingActive = useCallback(async (item: BreakingItem) => {
    if (!currentTenant) return;
    const response = await fetch(`/api/cms/breaking-news/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ tenant_id: currentTenant.id, is_active: !item.is_active }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(data?.error || 'Aggiornamento stato breaking non riuscito');
      return;
    }
    setBreakingItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, is_active: !entry.is_active } : entry));
  }, [currentTenant]);

  const deleteBreakingItem = useCallback(async (itemId: string) => {
    if (!currentTenant || !confirm('Eliminare questa breaking news?')) return;
    const response = await fetch(`/api/cms/breaking-news/${itemId}?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      toast.error(data?.error || 'Eliminazione breaking non riuscita');
      return;
    }
    setBreakingItems((prev) => prev.filter((entry) => entry.id !== itemId));
    toast.success('Breaking news eliminata');
  }, [currentTenant]);

  if (!canUseDesk) {
    return (
      <div className="rounded-2xl p-6 space-y-2" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>
          Accesso non disponibile
        </h2>
        <p className="text-sm max-w-3xl" style={{ color: 'var(--c-text-2)' }}>
          Il Desk Giornalisti è pensato per collaboratori, redattori, caporedattori e amministratori. Con il ruolo attuale non puoi usare questa interfaccia operativa.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--c-accent)' }} />
      </div>
    );
  }

  return (
    <div className={embeddedPreview ? 'space-y-4' : 'space-y-6'}>
      {embeddedPreview ? (
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--c-text-3)' }}>
            Preview Desk Giornalisti
          </div>
          <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
            Layout {previewDeviceConfig.label}
          </div>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
            Questa shell simula l’app reale che vedranno i giornalisti nel formato selezionato dal CMS platform.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--c-text-0)' }}>
              Desk Giornalisti
            </h2>
            <p className="text-sm max-w-4xl" style={{ color: 'var(--c-text-2)' }}>
              App giornalista reale per reporter e collaboratori: progetto articolo, raccolta media dal telefono, scrittura classica o generazione con IA rispettando prompt, tono e stile richiesti.
            </p>
          </div>
        </div>
      )}

      {showSettings && canConfigureDesk ? (
        <section className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Configurazione app giornalista
              </h3>
              <p className="text-xs mt-1 max-w-3xl" style={{ color: 'var(--c-text-2)' }}>
                Qui nel CMS completo decidi cosa vede e cosa può usare il giornalista nel Desk reale.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveDeskSettings()}
              disabled={savingDeskSettings}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--c-accent)' }}
            >
              <Save size={16} />
              {savingDeskSettings ? 'Salvataggio...' : 'Salva settaggi'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/giornalista"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
            >
              Apri app giornalista reale
            </Link>
            <div className="text-xs" style={{ color: 'var(--c-text-2)' }}>
              Questa apertura mostra la shell finale semplificata, fuori dal backoffice completo.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[
              ['allowContributorAccess', 'Accesso collaboratori'],
              ['allowEditorAccess', 'Accesso editor'],
              ['allowChiefEditorAccess', 'Accesso caporedattori'],
              ['allowClassicMode', 'Scrittura classica'],
              ['allowAiMode', 'Articolo con IA'],
              ['allowPhotoUpload', 'Upload foto'],
              ['allowVideoUpload', 'Upload video'],
              ['allowAudioUpload', 'Upload audio'],
              ['allowBreakingNewsManagement', 'Gestione breaking news'],
              ['allowCategorySelection', 'Scelta categoria'],
              ['allowCoverEdit', 'Modifica copertina'],
              ['allowSendToReview', 'Invio in revisione'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setDeskSettings((prev) => ({
                    ...prev,
                    [key]: !prev[key as keyof JournalistDeskSettings],
                  }))
                }
                className="rounded-2xl px-4 py-3 text-left transition"
                style={{
                  background: deskSettings[key as keyof JournalistDeskSettings] ? 'var(--c-accent-soft)' : 'var(--c-bg-2)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>{label}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
                  {deskSettings[key as keyof JournalistDeskSettings] ? 'Attivo' : 'Disattivo'}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                  Anteprima app giornalista
                </h4>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
                  Switcha tra smartphone, tablet e desktop per vedere dal CMS come apparirà la desk reale ai giornalisti.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ['phone', 'Smartphone', Smartphone],
                  ['tablet', 'Tablet', Tablet],
                  ['desktop', 'Desktop', Monitor],
                ] as const).map(([device, label, Icon]) => (
                  <button
                    key={device}
                    type="button"
                    onClick={() => setDeskPreviewDevice(device)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                    style={
                      deskPreviewDevice === device
                        ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }
                        : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }
                    }
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-auto rounded-2xl p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <div className="mx-auto rounded-[28px] p-2 shadow-xl" style={{ width: `${{
                phone: 390,
                tablet: 820,
                desktop: 1180,
              }[deskPreviewDevice]}px`, maxWidth: '100%', background: 'var(--c-bg-3)', border: '1px solid var(--c-border)' }}>
                <iframe
                  key={`${deskPreviewDevice}-${previewNonce}`}
                  src={deskShellPreviewUrl}
                  title={`Anteprima app giornalista ${deskPreviewDevice}`}
                  className="block w-full rounded-[20px] border-0"
                  style={{
                    height: `${{
                      phone: 844,
                      tablet: 960,
                      desktop: 780,
                    }[deskPreviewDevice]}px`,
                    background: 'var(--c-bg-0)',
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div
        className={`mx-auto transition-all duration-200 min-w-0 w-full ${embeddedPreview ? '' : standalone ? 'max-w-[1240px]' : 'max-w-[1180px]'}`}
        style={embeddedPreview ? { maxWidth: `${previewDeviceConfig.width}px` } : undefined}
      >
      <div className="grid grid-cols-1 gap-4 min-w-0 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section
          className="rounded-2xl p-4 space-y-4 self-start xl:sticky xl:top-4"
          style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
        >
          <div className="flex items-center justify-between gap-2 xl:block">
            <div className="xl:hidden">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-3)' }}>
                Progetti
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--c-text-2)' }}>
                {articles.length} bozz{articles.length === 1 ? 'a' : 'e'} aperte
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowProjectsMobile((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold xl:hidden"
              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
            >
              {showProjectsMobile ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showProjectsMobile ? 'Chiudi progetti' : 'Apri progetti'}
            </button>
          </div>

          <div className={showProjectsMobile ? 'space-y-4' : 'hidden xl:block xl:space-y-4'}>
          <button
            type="button"
            onClick={createDraftProject}
            disabled={creating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--c-accent)' }}
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Nuovo progetto articolo
          </button>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-3)' }}>
              Le mie bozze
            </div>
            {articles.length === 0 ? (
              <div className="rounded-xl px-3 py-3 text-sm" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
                Nessun progetto aperto. Crea una nuova bozza per iniziare dal telefono o dal desk.
              </div>
            ) : (
              articles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(article.id);
                    hydrateArticle(article);
                    setShowProjectsMobile(false);
                  }}
                  className="w-full text-left rounded-2xl px-3 py-3 transition"
                  style={
                    article.id === selectedId
                      ? { background: 'var(--c-accent-soft)', border: '1px solid rgba(14,165,233,0.15)' }
                      : { background: 'var(--c-bg-2)', border: '1px solid var(--c-border)' }
                  }
                >
                  <div className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--c-text-0)' }}>
                    {article.title}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
                    {article.status} · {article.published_at ? `pubblicato ${new Date(article.published_at).toLocaleDateString('it-IT')}` : `aggiornato ${new Date(article.updated_at).toLocaleString('it-IT')}`}
                  </div>
                </button>
              ))
            )}
          </div>
          </div>
        </section>

        <section className="rounded-2xl p-4 md:p-5 space-y-5 min-w-0" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
          {!selectedId ? (
            <div className="rounded-2xl px-4 py-8 text-center text-sm" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
              Crea o apri un progetto articolo per iniziare.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {deskSettings.allowClassicMode ? (
                  <button
                    type="button"
                    onClick={() => setMode('classic')}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl sm:w-auto sm:rounded-full text-left"
                    style={mode === 'classic' ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' } : { background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                  >
                    <FileText size={13} className="inline mr-1" />
                    Scrittura classica
                  </button>
                ) : null}
                {deskSettings.allowAiMode ? (
                  <button
                    type="button"
                    onClick={() => setMode('ai')}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl sm:w-auto sm:rounded-full text-left"
                    style={mode === 'ai' ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' } : { background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                  >
                    <Wand2 size={13} className="inline mr-1" />
                    Articolo con IA
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileWorkspaceView('editor')}
                  className="rounded-xl px-3 py-2 text-xs font-semibold"
                  style={
                    mobileWorkspaceView === 'editor'
                      ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }
                      : { background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }
                  }
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setMobileWorkspaceView('preview')}
                  className="rounded-xl px-3 py-2 text-xs font-semibold"
                  style={
                    mobileWorkspaceView === 'preview'
                      ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }
                      : { background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }
                  }
                >
                  Preview
                </button>
              </div>

              <div className={mobileWorkspaceView === 'preview' ? 'hidden sm:block' : 'block'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Titolo articolo
                    </span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full text-sm" placeholder="Titolo del pezzo" />
                  </label>
                {deskSettings.allowCategorySelection ? (
                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Categoria
                    </span>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input w-full text-sm">
                      <option value="">Nessuna categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {deskSettings.allowCoverEdit ? (
                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Copertina articolo
                    </span>
                    <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} className="input w-full text-sm" placeholder="URL immagine copertina" />
                  </label>
                ) : null}
              </div>
              </div>

              <div className={mobileWorkspaceView === 'preview' ? 'hidden sm:block' : 'block'}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                >
                  Stato: {selectedArticle?.status || 'draft'}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}
                >
                  Primo publish: {publishedAt ? new Date(publishedAt).toLocaleString('it-IT') : 'non ancora pubblicato'}
                </span>
              </div>
              </div>

              {canManageBreaking ? (
                <div className={mobileWorkspaceView === 'preview' ? 'hidden sm:block' : 'block'}>
                  <section
                    className="rounded-2xl p-4 space-y-4"
                    style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                          <Zap size={16} style={{ color: 'var(--c-danger, #ef4444)' }} />
                          Breaking news ticker
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
                          Da qui il giornalista può aggiornare completamente la barra breaking / ticker del sito.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (showBreakingForm && !editingBreakingId) {
                            resetBreakingForm();
                            return;
                          }
                          resetBreakingForm();
                          setShowBreakingForm(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                        style={{ background: 'var(--c-danger, #ef4444)' }}
                      >
                        <Plus size={14} />
                        Nuova breaking
                      </button>
                    </div>

                    {showBreakingForm ? (
                      <div
                        className="rounded-2xl p-4 space-y-4"
                        style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                            {editingBreakingId ? 'Modifica breaking news' : 'Nuova breaking news'}
                          </div>
                          <button
                            type="button"
                            onClick={resetBreakingForm}
                            className="rounded-lg px-2 py-1 text-xs font-semibold"
                            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                          >
                            Chiudi
                          </button>
                        </div>

                        <label className="space-y-1">
                          <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                            Testo ticker
                          </span>
                          <textarea
                            value={breakingText}
                            onChange={(e) => setBreakingText(e.target.value)}
                            rows={3}
                            placeholder="Es: Frana sulla provinciale, traffico deviato in entrambe le direzioni..."
                            className="w-full rounded-xl px-3 py-3 text-sm"
                            style={{ border: '1px solid var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}
                          />
                        </label>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <label className="space-y-1 md:col-span-2">
                            <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                              Link collegato
                            </span>
                            <div className="relative">
                              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-3)' }} />
                              <input
                                type="url"
                                value={breakingLinkUrl}
                                onChange={(e) => setBreakingLinkUrl(e.target.value)}
                                className="input w-full pl-9 text-sm"
                                placeholder="https://..."
                              />
                            </div>
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                              Priorità
                            </span>
                            <input
                              type="number"
                              value={breakingPriority}
                              min={0}
                              max={100}
                              onChange={(e) => setBreakingPriority(Number(e.target.value) || 0)}
                              className="input w-full text-sm"
                            />
                          </label>
                        </div>

                        <label className="space-y-1">
                          <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                            Scadenza ticker
                          </span>
                          <input
                            type="datetime-local"
                            min={getLocalDateTimeInputValue(new Date().toISOString())}
                            value={breakingExpiresAt}
                            onChange={(e) => setBreakingExpiresAt(e.target.value)}
                            className="input w-full text-sm"
                          />
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={resetBreakingForm}
                            className="rounded-xl px-4 py-2 text-sm font-semibold"
                            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveBreakingItem()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                            style={{ background: 'var(--c-danger, #ef4444)' }}
                          >
                            <Save size={14} />
                            {editingBreakingId ? 'Aggiorna breaking' : 'Pubblica breaking'}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      {breakingItems.length === 0 ? (
                        <div
                          className="rounded-xl px-3 py-3 text-sm"
                          style={{ background: 'var(--c-bg-1)', border: '1px dashed var(--c-border)', color: 'var(--c-text-2)' }}
                        >
                          Nessuna breaking news attiva o storicizzata per questo tenant.
                        </div>
                      ) : (
                        breakingItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl p-3 space-y-3"
                            style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                                    style={
                                      item.is_active
                                        ? { background: 'rgba(34,197,94,0.12)', color: 'var(--c-success, #16a34a)' }
                                        : { background: 'var(--c-bg-2)', color: 'var(--c-text-3)' }
                                    }
                                  >
                                    {item.is_active ? 'Attiva' : 'Disattiva'}
                                  </span>
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}
                                  >
                                    Priorità {item.priority}
                                  </span>
                                  <span className="text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                                    {new Date(item.created_at).toLocaleString('it-IT')}
                                  </span>
                                </div>
                                <div className="text-sm font-semibold leading-6" style={{ color: 'var(--c-text-0)' }}>
                                  {item.text}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--c-text-2)' }}>
                                  {item.link_url ? (
                                    <a
                                      href={item.link_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 hover:underline"
                                      style={{ color: 'var(--c-accent)' }}
                                    >
                                      <Link2 size={12} />
                                      Link ticker
                                    </a>
                                  ) : (
                                    <span>Nessun link</span>
                                  )}
                                  {item.expires_at ? (
                                    <span>Scade {new Date(item.expires_at).toLocaleString('it-IT')}</span>
                                  ) : (
                                    <span>Senza scadenza</span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => void toggleBreakingActive(item)}
                                  className="rounded-xl px-3 py-2 text-xs font-semibold"
                                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                                >
                                  {item.is_active ? 'Disattiva' : 'Attiva'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startBreakingEdit(item)}
                                  className="rounded-xl px-3 py-2 text-xs font-semibold"
                                  style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                                >
                                  Modifica
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteBreakingItem(item.id)}
                                  className="inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--c-danger, #ef4444)' }}
                                >
                                  <Trash2 size={12} />
                                  Elimina
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              ) : null}

              <div className={mobileWorkspaceView === 'preview' ? 'hidden sm:block' : 'block'}>
              <section className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                      Raccolta campo
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
                      Foto, video e audio vanno nella libreria media e restano collegati al progetto articolo.
                    </div>
                  </div>
                  {uploading ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--c-accent)' }} /> : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {deskSettings.allowPhotoUpload ? (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="rounded-2xl px-4 py-4 text-left"
                      style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
                    >
                      <Camera size={18} style={{ color: 'var(--c-accent)' }} />
                      <div className="text-sm font-semibold mt-2" style={{ color: 'var(--c-text-0)' }}>Foto</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>{photoCount} media immagine</div>
                    </button>
                  ) : null}
                  {deskSettings.allowVideoUpload ? (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="rounded-2xl px-4 py-4 text-left"
                      style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
                    >
                      <Video size={18} style={{ color: 'var(--c-accent)' }} />
                      <div className="text-sm font-semibold mt-2" style={{ color: 'var(--c-text-0)' }}>Video</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>{videoCount} video</div>
                    </button>
                  ) : null}
                  {deskSettings.allowAudioUpload ? (
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="rounded-2xl px-4 py-4 text-left"
                      style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
                    >
                      <Mic size={18} style={{ color: 'var(--c-accent)' }} />
                      <div className="text-sm font-semibold mt-2" style={{ color: 'var(--c-text-0)' }}>Audio</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>{audioCount} clip audio</div>
                    </button>
                  ) : null}
                </div>

                {deskSettings.allowPhotoUpload ? (
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(e) => void uploadCaptureFiles(e.target.files)}
                  />
                ) : null}
                {deskSettings.allowVideoUpload ? (
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(e) => void uploadCaptureFiles(e.target.files)}
                  />
                ) : null}
                {deskSettings.allowAudioUpload ? (
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    capture
                    multiple
                    className="hidden"
                    onChange={(e) => void uploadCaptureFiles(e.target.files)}
                  />
                ) : null}

                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    <div className="rounded-xl px-3 py-3 text-[11px] leading-5 sm:text-xs" style={{ background: 'var(--c-bg-1)', border: '1px dashed var(--c-border)', color: 'var(--c-text-2)' }}>
                      Posiziona il cursore nel punto desiderato dentro il corpo articolo e poi usa questi pulsanti: il media verra` inserito li`, non solo in fondo.
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
                      <div className="text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
                        {selectedGalleryItems.length > 0
                          ? `${selectedGalleryItems.length} media selezionati per la gallery`
                          : 'Seleziona piu media per comporre gallery immagini, video e audio da inserire dentro il testo.'}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={insertSelectedGallery}
                          disabled={selectedGalleryItems.length === 0}
                          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                        >
                          <ImageIcon size={14} />
                          Inserisci gallery nel testo
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAttachmentIds([])}
                          disabled={selectedGalleryItems.length === 0}
                          className="rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                        >
                          Deseleziona tutto
                        </button>
                      </div>
                    </div>
                    {attachments.map((item, index) => (
                      <div key={item.id} className="rounded-xl px-3 py-3 space-y-3" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
                        <div className="flex items-start gap-3">
                          <label className="mt-0.5 inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedAttachmentIds.includes(item.id)}
                              onChange={() => toggleAttachmentSelection(item.id)}
                              className="h-4 w-4 rounded border"
                            />
                          </label>
                          {item.mimeType.startsWith('image/') ? <ImageIcon size={16} /> : item.mimeType.startsWith('video/') ? <Video size={16} /> : <FileAudio size={16} />}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm truncate" style={{ color: 'var(--c-text-0)' }}>{item.name}</div>
                            <div className="text-xs truncate" style={{ color: 'var(--c-text-2)' }}>{item.mimeType}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveAttachment(item.id, -1)}
                              disabled={index === 0}
                              className="rounded-lg p-2 disabled:opacity-40"
                              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                              title="Sposta in alto"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveAttachment(item.id, 1)}
                              disabled={index === attachments.length - 1}
                              className="rounded-lg p-2 disabled:opacity-40"
                              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                              title="Sposta in basso"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAttachment(item.id)}
                              className="rounded-lg p-2"
                              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--c-danger, #ef4444)' }}
                              title="Rimuovi media"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => insertAttachmentIntoBody(item, item.mimeType.startsWith('image/') ? 'center' : 'full')}
                            className="rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold text-left sm:text-center"
                            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                          >
                            Inserisci qui nel testo
                          </button>
                          {item.mimeType.startsWith('image/') ? (
                            <>
                              <button
                                type="button"
                                onClick={() => insertAttachmentIntoBody(item, 'left')}
                                className="rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold text-left sm:text-center"
                                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                              >
                                Sinistra
                              </button>
                              <button
                                type="button"
                                onClick={() => insertAttachmentIntoBody(item, 'right')}
                                className="rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold text-left sm:text-center"
                                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                              >
                                Destra
                              </button>
                              <button
                                type="button"
                                onClick={() => insertAttachmentIntoBody(item, 'full')}
                                className="rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold text-left sm:text-center"
                                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                              >
                                Larghezza piena
                              </button>
                            </>
                          ) : null}
                          {item.mimeType.startsWith('image/') && deskSettings.allowCoverEdit ? (
                            <button
                              type="button"
                              onClick={() => setCoverImageUrl(item.url)}
                              className="rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold text-left sm:text-center"
                              style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                            >
                              Usa come copertina
                            </button>
                          ) : null}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold"
                            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                          >
                            <ExternalLink size={12} />
                            Apri file
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
              </div>

              <div className={mobileWorkspaceView === 'preview' ? 'hidden sm:block' : 'block'}>
              {mode === 'ai' && deskSettings.allowAiMode ? (
                <section className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>Preset tono</span>
                      <select value={tonePreset} onChange={(e) => setTonePreset(e.target.value)} className="input w-full text-sm">
                        {TONE_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>{preset.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>Preset stile</span>
                      <select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)} className="input w-full text-sm">
                        {STYLE_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>{preset.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Scelte rapide tono
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TONE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setTonePreset(preset.id)}
                          className="rounded-full px-3 py-2 text-xs font-semibold transition"
                          style={
                            tonePreset === preset.id
                              ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }
                              : { background: 'var(--c-bg-1)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
                          }
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Scelte rapide stile
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setStylePreset(preset.id)}
                          className="rounded-full px-3 py-2 text-xs font-semibold transition"
                          style={
                            stylePreset === preset.id
                              ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }
                              : { background: 'var(--c-bg-1)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
                          }
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>Intensità tono</span>
                        <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{toneSlider}</span>
                      </div>
                      <input type="range" min={0} max={100} value={toneSlider} onChange={(e) => setToneSlider(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>Lunghezza articolo</span>
                        <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{lengthSlider}</span>
                      </div>
                      <input type="range" min={0} max={100} value={lengthSlider} onChange={(e) => setLengthSlider(Number(e.target.value))} className="w-full" />
                    </label>
                  </div>

                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Input grezzi
                    </span>
                    <textarea
                      value={aiInputs}
                      onChange={(e) => setAiInputs(e.target.value)}
                      rows={4}
                      placeholder="Appunti rapidi, dichiarazioni, luoghi, persone, fatti..."
                      className="w-full rounded-xl px-3 py-3 text-sm"
                      style={{ border: '1px solid var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Fatti chiave
                    </span>
                    <textarea
                      value={aiFacts}
                      onChange={(e) => setAiFacts(e.target.value)}
                      rows={4}
                      placeholder="Fatti verificati da non perdere nel pezzo."
                      className="w-full rounded-xl px-3 py-3 text-sm"
                      style={{ border: '1px solid var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                      Prompt / istruzioni speciali
                    </span>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      placeholder="Se vuoi un tono o uno stile speciale, scrivilo qui: questa istruzione deve prevalere sui preset."
                      className="w-full rounded-xl px-3 py-3 text-sm"
                      style={{ border: '1px solid var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void generateWithAI()}
                    disabled={generating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: 'var(--c-accent)' }}
                  >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Genera articolo con IA
                  </button>

                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}>
                    Se nel prompt chiedi un tono specifico, quello deve prevalere sempre su preset e slider. Il pannello è impostato proprio per rispettare questa priorità.
                  </div>
                </section>
              ) : null}
              </div>

              <div className={mobileWorkspaceView === 'preview' ? 'hidden sm:block' : 'block'}>
              <section className="space-y-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                    Sommario
                  </span>
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: '1px solid var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }} />
                </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                          Corpo articolo
                      </span>
                      <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
                        Puoi alternare testo, foto, video, audio, link e embed: testo, media, testo, altri media, poi chiusura.
                      </p>
                      </div>
                    </div>
                  <TiptapEditor
                    ref={bodyEditorRef}
                    content={body}
                    onChange={setBody}
                    toolbarMode="expanded"
                    placeholder="Scrivi l'articolo con formattazione ricca, inserisci media, link e imposta l'allineamento delle immagini..."
                  />
                </div>
              </section>
              </div>

              {previewUrl ? (
                <div className={mobileWorkspaceView === 'editor' ? 'hidden sm:block' : 'block'}>
                <section className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
                        Anteprima articolo pubblica
                      </span>
                      <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
                        Questa vista usa il template reale del sito. Dopo il salvataggio la preview si aggiorna da sola; puoi anche forzare refresh o aprirla in una nuova scheda.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setPreviewNonce(Date.now())}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                        style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                      >
                        <RefreshCw size={14} />
                        Aggiorna preview
                      </button>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                        style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                      >
                        <ExternalLink size={14} />
                        Apri grande
                      </a>
                    </div>
                  </div>

                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2 text-xs"
                      style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-bg-1)', color: 'var(--c-text-2)' }}
                    >
                      <Eye size={14} />
                      Preview template pubblico
                    </div>
                    <iframe
                      key={previewNonce}
                      src={previewUrl}
                      title="Anteprima articolo"
                      className="block w-full border-0"
                      style={{ height: 'min(78vh, 980px)', background: '#fff' }}
                    />
                  </div>
                </section>
                </div>
              ) : null}

              <div className="hidden sm:flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void saveArticle('draft')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Salva bozza
                </button>
                {!canPublish && deskSettings.allowSendToReview ? (
                  <button
                    type="button"
                    onClick={() => void saveArticle('in_review')}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ background: '#d97706' }}
                  >
                    <Send size={15} />
                    Invia in revisione
                  </button>
                ) : (
                  canPublish ? (
                    <button
                      type="button"
                      onClick={() => void saveArticle('published')}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ background: 'var(--c-accent)' }}
                    >
                      <CheckCircle2 size={15} />
                      Pubblica
                    </button>
                  ) : null
                )}
              </div>

              {canShowPrimaryAction ? (
                <div
                  className="sm:hidden sticky bottom-3 z-20 -mx-1 mt-2"
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
                >
                <div
                  className="grid grid-cols-2 gap-2 rounded-2xl p-2 shadow-xl"
                  style={{ background: 'color-mix(in srgb, var(--c-bg-1) 92%, white 8%)', border: '1px solid var(--c-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => void saveArticle('draft')}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Bozza
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveArticle(primaryActionStatus)}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white"
                    style={{ background: canPublish ? 'var(--c-accent)' : '#d97706' }}
                  >
                    {canPublish ? <CheckCircle2 size={15} /> : <Send size={15} />}
                    {primaryActionLabel}
                  </button>
                </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
      </div>
    </div>
  );
}
