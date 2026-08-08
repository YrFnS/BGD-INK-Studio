import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { getReadyProductModelConfig, type ReadyProductModelConfig } from '@/data/assets3d';
import { platformApi } from '@/services/api';
import {
  loadDesignDraft,
  releaseDraftObjectUrls,
  type HydratedDesignDraft,
} from '@/services/drafts';
import type { PrintSurfaceId, Product } from '@/types';
import { ProductionExportPanel } from './ProductionExportPanel';
import type { ProductionExportInput } from './productionExport';

interface ProductionExportDockProps {
  draftId: string;
}

type ExportKind = 'proof' | 'specification';

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const loadStableDraft = async (draftId: string): Promise<HydratedDesignDraft> => {
  await wait(750);
  let current = await loadDesignDraft(draftId);
  if (!current) throw new Error('DRAFT_NOT_FOUND');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await wait(280);
    const next = await loadDesignDraft(draftId);
    if (!next) {
      releaseDraftObjectUrls(current);
      throw new Error('DRAFT_NOT_FOUND');
    }

    if (next.updatedAt === current.updatedAt) {
      releaseDraftObjectUrls(next);
      return current;
    }

    releaseDraftObjectUrls(current);
    current = next;
  }

  return current;
};

const createExportInput = (
  draft: HydratedDesignDraft,
  product: Product,
  modelConfig: ReadyProductModelConfig,
  productName: string,
  language: 'en' | 'ar',
  surfaceLabels: Partial<Record<PrintSurfaceId, string>>,
  generatedAt: Date,
): ProductionExportInput => ({
  draftId: draft.id,
  draftName: draft.name,
  product,
  productName,
  size: draft.size,
  color: draft.color,
  notes: draft.notes,
  modelConfig,
  decals: draft.decals,
  language,
  surfaceLabels,
  generatedAt,
});

export const ProductionExportDock: React.FC<ProductionExportDockProps> = ({ draftId }) => {
  const { language, t } = useAppContext();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const copy =
    language === 'ar'
      ? {
          open: 'ملفات التسليم المحلية',
          successProof: 'تم تنزيل إثبات PNG على هذا الجهاز.',
          successSpecification: 'تم تنزيل ملف مواصفات JSON على هذا الجهاز.',
          noArtwork: 'أضف طبقة ظاهرة واحدة على الأقل قبل إنشاء ملفات التسليم.',
          unavailable: 'ملفات التسليم مو متاحة لهذه المسودة حالياً.',
          missing: 'هذه المسودة مو موجودة أو انحذفت من هذا الجهاز.',
          failed: 'ما گدرنا ننشئ ملف التسليم على هذا الجهاز. جرّب مرة ثانية.',
        }
      : {
          open: 'Local handoff files',
          successProof: 'The PNG proof was downloaded to this device.',
          successSpecification: 'The JSON specification was downloaded to this device.',
          noArtwork: 'Add at least one visible artwork layer before generating handoff files.',
          unavailable: 'Handoff files are not available for this draft yet.',
          missing: 'This draft is missing or was deleted from this device.',
          failed: 'The handoff file could not be generated on this device. Try again.',
        };

  const runExport = async (kind: ExportKind): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);
    let draft: HydratedDesignDraft | null = null;

    try {
      draft = await loadStableDraft(draftId);
      if (!draft.decals.some((layer) => layer.visible)) {
        showToast(copy.noArtwork, 'error');
        return;
      }

      const products = await platformApi.catalog.listProducts();
      const product = products.find((candidate) => candidate.id === draft?.productId);
      const modelConfig = product ? getReadyProductModelConfig(product.id) : null;
      if (!product || !modelConfig) {
        showToast(copy.unavailable, 'error');
        return;
      }

      const generatedAt = new Date();
      const surfaceLabels = Object.fromEntries(
        modelConfig.surfaces.map((surface) => [surface.id, t(surface.labelKey)]),
      ) as Partial<Record<PrintSurfaceId, string>>;
      const input = createExportInput(
        draft,
        product,
        modelConfig,
        t(product.name),
        language,
        surfaceLabels,
        generatedAt,
      );
      const {
        buildProductionSpecification,
        createProductionProofBlob,
        createProductionSpecificationBlob,
        downloadBlob,
        getProductionExportFileNames,
      } = await import('./productionExport');
      const fileNames = getProductionExportFileNames(draft.id, draft.name);

      if (kind === 'proof') {
        const proof = await createProductionProofBlob(input);
        downloadBlob(proof, fileNames.proof);
        showToast(copy.successProof, 'success');
      } else {
        const specification = buildProductionSpecification(input);
        downloadBlob(createProductionSpecificationBlob(specification), fileNames.specification);
        showToast(copy.successSpecification, 'success');
      }
    } catch (error: unknown) {
      showToast(
        error instanceof Error && error.message === 'DRAFT_NOT_FOUND' ? copy.missing : copy.failed,
        'error',
      );
    } finally {
      if (draft) releaseDraftObjectUrls(draft);
      setIsExporting(false);
    }
  };

  return (
    <details
      className="group mx-auto mb-10 mt-4 w-[min(48rem,calc(100%-2rem))]"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <summary
        data-testid="production-export-toggle"
        aria-label={copy.open}
        aria-busy={isExporting}
        className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-5 py-3 text-xs font-black uppercase tracking-wider text-amber-950 shadow-lg transition-transform hover:scale-[1.02] dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true">⇩</span>
        <span>{copy.open}</span>
      </summary>
      <div className="mt-3 w-full">
        <ProductionExportPanel
          hasVisibleArtwork={null}
          isExporting={isExporting}
          onDownloadProof={() => runExport('proof')}
          onDownloadSpecification={() => runExport('specification')}
        />
      </div>
    </details>
  );
};
