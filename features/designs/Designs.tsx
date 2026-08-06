import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { useSEO } from '../../hooks/useSEO';
import { isAbortError, platformApi } from '../../services/api';
import {
  deleteDesignDraft,
  DesignDraftSummary,
  duplicateDesignDraft,
  listDesignDrafts,
  releaseDraftSummaryObjectUrls,
  renameDesignDraft,
} from '../../services/drafts';
import { Language, Product } from '../../types';

interface DesignsProps {
  onOpenDraft: (draftId: string) => void;
  onCreateNew: () => void;
}

type WorkspaceStatus = 'loading' | 'ready' | 'error';
type DraftAction = 'rename' | 'duplicate' | 'delete';

interface BusyDraftAction {
  draftId: string;
  action: DraftAction;
}

interface WorkspaceCopy {
  title: string;
  subtitle: string;
  create: string;
  emptyTitle: string;
  emptyDescription: string;
  loading: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  untitled: string;
  updated: string;
  layers: string;
  noArtwork: string;
  draft: string;
  submitted: string;
  open: string;
  rename: string;
  duplicate: string;
  delete: string;
  cancel: string;
  save: string;
  confirmDelete: string;
  deleteQuestion: string;
  renameSuccess: string;
  duplicateSuccess: string;
  deleteSuccess: string;
  actionError: string;
  nameRequired: string;
  copyPrefix: string;
}

const WORKSPACE_COPY: Record<Language, WorkspaceCopy> = {
  en: {
    title: 'MY DESIGNS',
    subtitle:
      'Continue designs saved on this browser. Artwork and edits stay on this device until server storage is connected.',
    create: 'Create new design',
    emptyTitle: 'No saved designs yet',
    emptyDescription:
      'Choose a product and your design will appear here automatically as you work.',
    loading: 'Loading saved designs…',
    errorTitle: 'Saved designs could not be loaded',
    errorDescription: 'The browser database may be unavailable or temporarily blocked.',
    retry: 'Try again',
    untitled: 'Untitled design',
    updated: 'Updated',
    layers: 'artwork layers',
    noArtwork: 'No artwork yet',
    draft: 'Draft',
    submitted: 'Submitted',
    open: 'Open design',
    rename: 'Rename',
    duplicate: 'Duplicate',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save name',
    confirmDelete: 'Delete permanently',
    deleteQuestion: 'Delete this design and its stored artwork from this device?',
    renameSuccess: 'Design renamed',
    duplicateSuccess: 'Design duplicated',
    deleteSuccess: 'Design deleted',
    actionError: 'The design could not be updated. Try again.',
    nameRequired: 'Enter a name for this design.',
    copyPrefix: 'Copy of',
  },
  ar: {
    title: 'تصاميمي',
    subtitle:
      'كمّل التصاميم المحفوظة بهذا المتصفح. الملفات والتعديلات تبقى على هذا الجهاز لحين ربط التخزين بالسيرفر.',
    create: 'تصميم جديد',
    emptyTitle: 'ما عندك تصاميم محفوظة حالياً',
    emptyDescription: 'اختار موديل، وتصميمك راح يظهر هنا تلقائياً أثناء العمل.',
    loading: 'جاري تحميل التصاميم المحفوظة…',
    errorTitle: 'تعذر تحميل التصاميم المحفوظة',
    errorDescription: 'قد تكون قاعدة بيانات المتصفح غير متاحة أو محجوبة مؤقتاً.',
    retry: 'إعادة المحاولة',
    untitled: 'تصميم بدون اسم',
    updated: 'آخر تعديل',
    layers: 'طبقات تصميم',
    noArtwork: 'ماكو تصميم مرفوع بعد',
    draft: 'مسودة',
    submitted: 'تم الإرسال',
    open: 'فتح التصميم',
    rename: 'تغيير الاسم',
    duplicate: 'نسخ',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ الاسم',
    confirmDelete: 'حذف نهائي',
    deleteQuestion: 'تحذف هذا التصميم وملفاته المحفوظة من هذا الجهاز؟',
    renameSuccess: 'تم تغيير اسم التصميم',
    duplicateSuccess: 'تم نسخ التصميم',
    deleteSuccess: 'تم حذف التصميم',
    actionError: 'تعذر تحديث التصميم. حاول مرة ثانية.',
    nameRequired: 'اكتب اسم للتصميم.',
    copyPrefix: 'نسخة من',
  },
};

export const Designs: React.FC<DesignsProps> = ({ onOpenDraft, onCreateNew }) => {
  const { language, t } = useAppContext();
  const { showToast } = useToast();
  const copy = WORKSPACE_COPY[language];

  useSEO('seo.designs.title', 'seo.designs.description');

  const [status, setStatus] = useState<WorkspaceStatus>('loading');
  const [summaries, setSummaries] = useState<DesignDraftSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [busyAction, setBusyAction] = useState<BusyDraftAction | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const summariesRef = useRef<DesignDraftSummary[]>([]);

  const replaceSummaries = useCallback((nextSummaries: DesignDraftSummary[]) => {
    releaseDraftSummaryObjectUrls(summariesRef.current);
    summariesRef.current = nextSummaries;
    setSummaries(nextSummaries);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let loadedSummaries: DesignDraftSummary[] | null = null;
    setStatus('loading');

    void (async () => {
      try {
        loadedSummaries = await listDesignDrafts();
        const nextProducts = await platformApi.catalog.listProducts(controller.signal);

        if (disposed) {
          releaseDraftSummaryObjectUrls(loadedSummaries);
          return;
        }

        replaceSummaries(loadedSummaries);
        setProducts(nextProducts);
        setStatus('ready');
      } catch (error: unknown) {
        if (loadedSummaries) releaseDraftSummaryObjectUrls(loadedSummaries);
        if (disposed || isAbortError(error)) return;
        replaceSummaries([]);
        setProducts([]);
        setStatus('error');
      }
    })();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [reloadToken, replaceSummaries]);

  useEffect(
    () => () => {
      releaseDraftSummaryObjectUrls(summariesRef.current);
      summariesRef.current = [];
    },
    [],
  );

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-IQ' : 'en-IQ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [language],
  );

  const getDisplayName = useCallback(
    (summary: DesignDraftSummary): string => {
      if (summary.name.trim()) return summary.name;
      const product = productsById.get(summary.productId);
      return product ? `${t(product.name)} — ${copy.untitled}` : copy.untitled;
    },
    [copy.untitled, productsById, t],
  );

  const startRename = (summary: DesignDraftSummary) => {
    setEditingDraftId(summary.id);
    setDraftName(summary.name || getDisplayName(summary));
    setDeleteConfirmationId(null);
  };

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingDraftId) return;

    const normalizedName = draftName.trim();
    if (!normalizedName) {
      showToast(copy.nameRequired, 'error');
      return;
    }

    setBusyAction({ draftId: editingDraftId, action: 'rename' });
    try {
      await renameDesignDraft(editingDraftId, normalizedName);
      setEditingDraftId(null);
      setDraftName('');
      showToast(copy.renameSuccess, 'success');
      setReloadToken((value) => value + 1);
    } catch {
      showToast(copy.actionError, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDuplicate = async (summary: DesignDraftSummary) => {
    setBusyAction({ draftId: summary.id, action: 'duplicate' });
    setDeleteConfirmationId(null);

    try {
      const duplicatedDraft = await duplicateDesignDraft(
        summary.id,
        `${copy.copyPrefix} ${getDisplayName(summary)}`,
      );
      showToast(copy.duplicateSuccess, 'success');
      onOpenDraft(duplicatedDraft.id);
    } catch {
      showToast(copy.actionError, 'error');
      setBusyAction(null);
    }
  };

  const handleDelete = async (summary: DesignDraftSummary) => {
    setBusyAction({ draftId: summary.id, action: 'delete' });

    try {
      await deleteDesignDraft(summary.id);
      if (summary.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(summary.previewUrl);
      const nextSummaries = summariesRef.current.filter((item) => item.id !== summary.id);
      summariesRef.current = nextSummaries;
      setSummaries(nextSummaries);
      setDeleteConfirmationId(null);
      if (editingDraftId === summary.id) {
        setEditingDraftId(null);
        setDraftName('');
      }
      showToast(copy.deleteSuccess, 'success');
    } catch {
      showToast(copy.actionError, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const isBusy = (draftId: string): boolean => busyAction?.draftId === draftId;

  return (
    <section className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-20 pt-28 md:px-8 md:pt-36">
      <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-accent">
            BGD/INK Studio
          </p>
          <h1
            className={`mb-4 text-4xl font-bold tracking-tighter md:text-6xl ${language === 'en' ? 'font-display' : ''}`}
          >
            {copy.title}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400 md:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-white shadow-lg shadow-red-950/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span aria-hidden="true">+</span>
          {copy.create}
        </button>
      </div>

      {status === 'loading' && (
        <div role="status" aria-live="polite">
          <p className="sr-only">{copy.loading}</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                aria-hidden="true"
              >
                <div className="aspect-[16/10] animate-pulse bg-gray-200 dark:bg-zinc-800" />
                <div className="space-y-4 p-6">
                  <div className="h-7 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
                  <div className="h-11 w-full animate-pulse rounded-full bg-gray-100 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h2 className="mb-3 text-2xl font-bold text-red-950 dark:text-red-100">
            {copy.errorTitle}
          </h2>
          <p className="mb-6 text-red-800/80 dark:text-red-200/80">{copy.errorDescription}</p>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="rounded-full bg-black px-6 py-3 font-bold text-white dark:bg-white dark:text-black"
          >
            {copy.retry}
          </button>
        </div>
      )}

      {status === 'ready' && summaries.length === 0 && (
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50 md:p-16">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-gray-200 bg-white text-3xl shadow-sm dark:border-zinc-700 dark:bg-black"
            aria-hidden="true"
          >
            ✦
          </div>
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">{copy.emptyTitle}</h2>
          <p className="mx-auto mb-8 max-w-lg leading-relaxed text-gray-600 dark:text-gray-400">
            {copy.emptyDescription}
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-full bg-black px-7 py-3 font-bold text-white dark:bg-white dark:text-black"
          >
            {copy.create}
          </button>
        </div>
      )}

      {status === 'ready' && summaries.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summary) => {
            const product = productsById.get(summary.productId);
            const displayName = getDisplayName(summary);
            const submitted = Boolean(summary.submittedOrderId);
            const busy = isBusy(summary.id);
            const editing = editingDraftId === summary.id;
            const confirmingDelete = deleteConfirmationId === summary.id;

            return (
              <article
                key={summary.id}
                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover opacity-80 grayscale transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top,#ffffff22,transparent_60%)]" />
                  )}
                  <div
                    className="absolute inset-0 opacity-35 mix-blend-multiply"
                    style={{ backgroundColor: summary.color }}
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />

                  {summary.previewUrl ? (
                    <div className="absolute bottom-4 end-4 h-24 w-24 overflow-hidden rounded-2xl border border-white/30 bg-white/95 p-2 shadow-2xl backdrop-blur dark:bg-black/90">
                      <img
                        src={summary.previewUrl}
                        alt={language === 'ar' ? 'معاينة التصميم المرفوع' : 'Uploaded artwork preview'}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="absolute bottom-4 end-4 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                      {copy.noArtwork}
                    </div>
                  )}

                  <div className="absolute start-4 top-4 flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold backdrop-blur ${
                        submitted
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-white/90 text-black dark:bg-black/80 dark:text-white'
                      }`}
                    >
                      {submitted ? copy.submitted : copy.draft}
                    </span>
                    <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {summary.size}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {editing ? (
                    <form onSubmit={handleRename} className="mb-5 space-y-3">
                      <label htmlFor={`draft-name-${summary.id}`} className="sr-only">
                        {copy.rename}
                      </label>
                      <input
                        id={`draft-name-${summary.id}`}
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        maxLength={80}
                        autoFocus
                        disabled={busy}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-bold text-black outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-zinc-700 dark:bg-black dark:text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={busy}
                          className="flex-1 rounded-full bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-black"
                        >
                          {copy.save}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDraftId(null);
                            setDraftName('');
                          }}
                          disabled={busy}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold disabled:opacity-50 dark:border-zinc-700"
                        >
                          {copy.cancel}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <h2 className="mb-2 truncate text-2xl font-bold tracking-tight" title={displayName}>
                      {displayName}
                    </h2>
                  )}

                  <p className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {product ? t(product.name) : summary.productId}
                  </p>

                  <dl className="mb-6 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-4 text-sm dark:bg-black/35">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-500">{copy.updated}</dt>
                      <dd className="mt-1 font-semibold">
                        {dateFormatter.format(new Date(summary.updatedAt))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-500">{copy.layers}</dt>
                      <dd className="mt-1 font-semibold">{summary.layerCount}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => onOpenDraft(summary.id)}
                    disabled={busy}
                    className="mb-3 w-full rounded-full bg-accent px-5 py-3 font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-wait disabled:opacity-50"
                  >
                    {copy.open}
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => startRename(summary)}
                      disabled={busy || editing}
                      className="rounded-full border border-gray-200 px-3 py-2 text-xs font-bold transition-colors hover:border-black disabled:opacity-40 dark:border-zinc-700 dark:hover:border-white"
                    >
                      {copy.rename}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicate(summary)}
                      disabled={busy}
                      className="rounded-full border border-gray-200 px-3 py-2 text-xs font-bold transition-colors hover:border-black disabled:opacity-40 dark:border-zinc-700 dark:hover:border-white"
                    >
                      {busyAction?.draftId === summary.id && busyAction.action === 'duplicate'
                        ? '…'
                        : copy.duplicate}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmationId(summary.id);
                        setEditingDraftId(null);
                        setDraftName('');
                      }}
                      disabled={busy}
                      className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:border-red-500 disabled:opacity-40 dark:border-red-900/70 dark:text-red-400"
                    >
                      {copy.delete}
                    </button>
                  </div>

                  {confirmingDelete && (
                    <div
                      className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30"
                      role="group"
                      aria-label={copy.deleteQuestion}
                    >
                      <p className="mb-3 text-sm font-medium text-red-900 dark:text-red-100">
                        {copy.deleteQuestion}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDelete(summary)}
                          disabled={busy}
                          className="flex-1 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {busy ? '…' : copy.confirmDelete}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmationId(null)}
                          disabled={busy}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-800 disabled:opacity-50 dark:border-red-800 dark:text-red-200"
                        >
                          {copy.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
