import { BRAND } from '@/config/brand';
import type {
  PrintSurfaceDefinition,
  ReadyProductModelConfig,
} from '@/data/assets3d';
import type {
  DecalLayer,
  Language,
  PrintSurfaceId,
  Product,
  Size,
} from '@/types';
import {
  createArtworkQualityReport,
  normalizeArtworkAspectRatio,
} from './artworkAnalysis';
import {
  getArtworkEdgeClearanceCm,
  getArtworkPhysicalDimensions,
  getArtworkPlacementCm,
} from './printArea';

const EXPORT_FORMAT = 'bgd-ink-production-specification' as const;
const EXPORT_VERSION = 1 as const;
const PROOF_WIDTH = 1800;
const PROOF_MARGIN = 60;
const PROOF_HEADER_HEIGHT = 230;
const PROOF_PANEL_HEIGHT = 900;
const PROOF_PANEL_GAP = 40;
const PROOF_FOOTER_HEIGHT = 130;
const PROOF_COLUMNS = 2;
const IMAGE_LOAD_TIMEOUT_MS = 10_000;

const round = (value: number, digits = 3): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const radiansToDegrees = (value: number): number => round(value * (180 / Math.PI), 2);

export interface ProductionExportInput {
  draftId: string;
  draftName: string;
  product: Product;
  productName: string;
  size: Size;
  color: string;
  notes: string;
  modelConfig: ReadyProductModelConfig;
  decals: readonly DecalLayer[];
  language: Language;
  surfaceLabels: Partial<Record<PrintSurfaceId, string>>;
  generatedAt?: Date;
}

export interface ProductionLayerSpecification {
  id: string;
  name: string;
  order: number;
  visible: boolean;
  includedInProof: boolean;
  source: {
    assetId: string | null;
    fileName: string | null;
    mimeType: string | null;
    pixelWidth: number | null;
    pixelHeight: number | null;
    aspectRatio: number;
    hasTransparency: boolean | null;
    transparentPixelRatio: number | null;
    transparentPaddingRatio: number | null;
  };
  placement: {
    reference: 'surface-center-viewer-facing';
    centerXcm: number;
    centerYcm: number;
    leftCm: number;
    topCm: number;
    rightCm: number;
    bottomCm: number;
    widthCm: number;
    heightCm: number;
    rotationDegrees: number;
    safeEdgeClearanceCm: number;
  };
  quality: {
    estimatedDpi: number | null;
    level: string;
    warnings: string[];
  };
}

export interface ProductionSurfaceSpecification {
  id: PrintSurfaceId;
  label: string;
  physicalWidthCm: number;
  physicalHeightCm: number;
  safeMarginCm: number;
  layers: ProductionLayerSpecification[];
}

export interface ProductionSpecification {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  generatedAt: string;
  locale: Language;
  application: {
    id: string;
    name: string;
  };
  draft: {
    id: string;
    name: string;
    notes: string;
  };
  product: {
    id: string;
    name: string;
    type: string;
    size: Size;
    color: string;
  };
  coordinateSystem: {
    units: 'centimeters';
    origin: 'center of the selected physical print surface';
    positiveX: 'right when viewing the selected surface';
    positiveY: 'up when viewing the selected surface';
    rotation: 'clockwise degrees in the viewer-facing proof';
  };
  calibration: {
    status: 'unverified';
    requiresPhysicalConfirmation: true;
    note: string;
  };
  surfaces: ProductionSurfaceSpecification[];
}

const createLayerSpecification = (
  layer: DecalLayer,
  order: number,
  surface: PrintSurfaceDefinition,
): ProductionLayerSpecification => {
  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const dimensions = getArtworkPhysicalDimensions(layer.scale, surface, aspectRatio);
  const placement = getArtworkPlacementCm(layer.position, surface, layer.scale, aspectRatio);
  const edgeClearanceCm = getArtworkEdgeClearanceCm(
    layer.position,
    surface,
    layer.scale,
    aspectRatio,
  );
  const quality = createArtworkQualityReport(
    {
      pixelWidth: layer.pixelWidth ?? 0,
      pixelHeight: layer.pixelHeight ?? 0,
      aspectRatio,
      transparentPaddingRatio: layer.transparentPaddingRatio ?? 0,
    },
    dimensions.widthCm,
    dimensions.heightCm,
    edgeClearanceCm,
  );

  return {
    id: layer.id,
    name: layer.name,
    order,
    visible: layer.visible,
    includedInProof: layer.visible,
    source: {
      assetId: layer.assetId ?? null,
      fileName: layer.fileName ?? null,
      mimeType: layer.mimeType ?? null,
      pixelWidth: layer.pixelWidth ?? null,
      pixelHeight: layer.pixelHeight ?? null,
      aspectRatio: round(aspectRatio),
      hasTransparency:
        typeof layer.hasTransparency === 'boolean' ? layer.hasTransparency : null,
      transparentPixelRatio:
        typeof layer.transparentPixelRatio === 'number'
          ? round(layer.transparentPixelRatio)
          : null,
      transparentPaddingRatio:
        typeof layer.transparentPaddingRatio === 'number'
          ? round(layer.transparentPaddingRatio)
          : null,
    },
    placement: {
      reference: 'surface-center-viewer-facing',
      centerXcm: round(placement.centerXcm),
      centerYcm: round(placement.centerYcm),
      leftCm: round(placement.leftCm),
      topCm: round(placement.topCm),
      rightCm: round(placement.rightCm),
      bottomCm: round(placement.bottomCm),
      widthCm: round(dimensions.widthCm),
      heightCm: round(dimensions.heightCm),
      rotationDegrees: radiansToDegrees(layer.userRotation),
      safeEdgeClearanceCm: round(edgeClearanceCm),
    },
    quality: {
      estimatedDpi: quality.dpi === null ? null : round(quality.dpi, 1),
      level: quality.level,
      warnings: [...quality.warnings],
    },
  };
};

export const buildProductionSpecification = (
  input: ProductionExportInput,
): ProductionSpecification => {
  const generatedAt = input.generatedAt ?? new Date();

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    generatedAt: generatedAt.toISOString(),
    locale: input.language,
    application: {
      id: BRAND.id,
      name: BRAND.productName,
    },
    draft: {
      id: input.draftId,
      name: input.draftName.trim() || input.draftId,
      notes: input.notes,
    },
    product: {
      id: input.product.id,
      name: input.productName,
      type: input.product.type,
      size: input.size,
      color: input.color,
    },
    coordinateSystem: {
      units: 'centimeters',
      origin: 'center of the selected physical print surface',
      positiveX: 'right when viewing the selected surface',
      positiveY: 'up when viewing the selected surface',
      rotation: 'clockwise degrees in the viewer-facing proof',
    },
    calibration: {
      status: 'unverified',
      requiresPhysicalConfirmation: true,
      note:
        'The configured physical print areas are local planning values and must be confirmed against the exact garment blank and printing process before production.',
    },
    surfaces: input.modelConfig.surfaces.map((surface) => ({
      id: surface.id,
      label: input.surfaceLabels[surface.id] ?? surface.id,
      physicalWidthCm: surface.physicalWidthCm,
      physicalHeightCm: surface.physicalHeightCm,
      safeMarginCm: surface.safeMarginCm,
      layers: input.decals
        .map((layer, order) => ({ layer, order }))
        .filter(({ layer }) => layer.surfaceId === surface.id)
        .map(({ layer, order }) => createLayerSpecification(layer, order, surface)),
    })),
  };
};

const sanitizeFileSegment = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

export const getProductionExportFileNames = (
  draftId: string,
  draftName: string,
): { proof: string; specification: string } => {
  const readableName = sanitizeFileSegment(draftName) || sanitizeFileSegment(draftId) || 'design';
  const draftToken = sanitizeFileSegment(draftId).slice(-18) || 'draft';
  const base = `${BRAND.id}-${readableName}-${draftToken}`;

  return {
    proof: `${base}-proof.png`,
    specification: `${base}-specification.json`,
  };
};

export const createProductionSpecificationBlob = (
  specification: ProductionSpecification,
): Blob =>
  new Blob([`${JSON.stringify(specification, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  });

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const loadArtworkImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = '';
      reject(new Error('Artwork preview timed out while generating the proof.'));
    }, IMAGE_LOAD_TIMEOUT_MS);

    image.decoding = 'async';
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Artwork preview could not be decoded for the proof.'));
    };
    image.src = url;
  });

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const drawProofLayer = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  layer: DecalLayer,
  surface: PrintSurfaceDefinition,
  printAreaX: number,
  printAreaY: number,
  pixelsPerCm: number,
  order: number,
): void => {
  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const dimensions = getArtworkPhysicalDimensions(layer.scale, surface, aspectRatio);
  const placement = getArtworkPlacementCm(layer.position, surface, layer.scale, aspectRatio);
  const width = dimensions.widthCm * pixelsPerCm;
  const height = dimensions.heightCm * pixelsPerCm;
  const centerX = printAreaX + (placement.leftCm + dimensions.widthCm / 2) * pixelsPerCm;
  const centerY = printAreaY + (placement.topCm + dimensions.heightCm / 2) * pixelsPerCm;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(layer.userRotation);
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.strokeStyle = 'rgba(17, 24, 39, 0.65)';
  context.lineWidth = 2;
  context.setLineDash([8, 6]);
  context.strokeRect(-width / 2, -height / 2, width, height);
  context.setLineDash([]);
  context.fillStyle = 'rgba(17, 24, 39, 0.88)';
  context.beginPath();
  context.arc(-width / 2 + 13, -height / 2 + 13, 13, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#ffffff';
  context.font = '700 14px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(order + 1), -width / 2 + 13, -height / 2 + 13);
  context.restore();
};

const getProofCopy = (language: Language) =>
  language === 'ar'
    ? {
        title: 'إثبات إعداد الطباعة المحلي',
        draft: 'المسودة',
        product: 'المنتج',
        size: 'المقاس',
        color: 'اللون',
        printArea: 'مساحة الطباعة',
        safeMargin: 'الهامش الآمن',
        visibleLayers: 'الطبقات الظاهرة',
        noArtwork: 'لا توجد طبقات ظاهرة على هذه الجهة.',
        calibration:
          'تنبيه: القياسات الحالية للتخطيط فقط ويجب تأكيدها على القطعة وطريقة الطباعة الفعلية قبل الإنتاج.',
        generated: 'تم الإنشاء',
      }
    : {
        title: 'Local production proof',
        draft: 'Draft',
        product: 'Product',
        size: 'Size',
        color: 'Color',
        printArea: 'Print area',
        safeMargin: 'Safe margin',
        visibleLayers: 'Visible layers',
        noArtwork: 'No visible artwork is placed on this surface.',
        calibration:
          'Calibration notice: these dimensions are planning values and must be confirmed on the exact garment and print process before production.',
        generated: 'Generated',
      };

const drawSurfacePanel = (
  context: CanvasRenderingContext2D,
  input: ProductionExportInput,
  surface: PrintSurfaceDefinition,
  surfaceIndex: number,
  images: ReadonlyMap<string, HTMLImageElement>,
  panelX: number,
  panelY: number,
  panelWidth: number,
): void => {
  const copy = getProofCopy(input.language);
  const visibleLayers = input.decals
    .map((layer, order) => ({ layer, order }))
    .filter(({ layer }) => layer.visible && layer.surfaceId === surface.id);
  const surfaceLabel = input.surfaceLabels[surface.id] ?? surface.id;

  context.save();
  drawRoundedRect(context, panelX, panelY, panelWidth, PROOF_PANEL_HEIGHT, 32);
  context.fillStyle = '#ffffff';
  context.fill();
  context.strokeStyle = '#ddd7cc';
  context.lineWidth = 2;
  context.stroke();

  context.direction = input.language === 'ar' ? 'rtl' : 'ltr';
  context.textAlign = input.language === 'ar' ? 'right' : 'left';
  const textX = input.language === 'ar' ? panelX + panelWidth - 38 : panelX + 38;

  context.fillStyle = '#111827';
  context.font = '800 30px Arial, sans-serif';
  context.fillText(`${surfaceIndex + 1}. ${surfaceLabel}`, textX, panelY + 54);
  context.fillStyle = '#6b7280';
  context.font = '600 17px Arial, sans-serif';
  context.fillText(
    `${copy.printArea}: ${surface.physicalWidthCm} × ${surface.physicalHeightCm} cm · ${copy.safeMargin}: ${surface.safeMarginCm} cm`,
    textX,
    panelY + 88,
  );

  const maximumAreaWidth = panelWidth - 250;
  const maximumAreaHeight = 560;
  const pixelsPerCm = Math.min(
    maximumAreaWidth / surface.physicalWidthCm,
    maximumAreaHeight / surface.physicalHeightCm,
  );
  const areaWidth = surface.physicalWidthCm * pixelsPerCm;
  const areaHeight = surface.physicalHeightCm * pixelsPerCm;
  const printAreaX = panelX + (panelWidth - areaWidth) / 2;
  const printAreaY = panelY + 145;

  context.fillStyle = input.color;
  drawRoundedRect(context, printAreaX - 38, printAreaY - 38, areaWidth + 76, areaHeight + 76, 42);
  context.fill();

  context.fillStyle = 'rgba(255, 255, 255, 0.92)';
  context.fillRect(printAreaX, printAreaY, areaWidth, areaHeight);
  context.strokeStyle = '#ef4444';
  context.lineWidth = 4;
  context.setLineDash([14, 10]);
  context.strokeRect(printAreaX, printAreaY, areaWidth, areaHeight);
  context.setLineDash([]);

  const safeInset = surface.safeMarginCm * pixelsPerCm;
  context.strokeStyle = 'rgba(17, 24, 39, 0.45)';
  context.lineWidth = 2;
  context.setLineDash([7, 7]);
  context.strokeRect(
    printAreaX + safeInset,
    printAreaY + safeInset,
    areaWidth - safeInset * 2,
    areaHeight - safeInset * 2,
  );
  context.setLineDash([]);

  visibleLayers.forEach(({ layer, order }) => {
    const image = images.get(layer.id);
    if (image) {
      drawProofLayer(
        context,
        image,
        layer,
        surface,
        printAreaX,
        printAreaY,
        pixelsPerCm,
        order,
      );
    }
  });

  if (visibleLayers.length === 0) {
    context.fillStyle = '#6b7280';
    context.font = '600 18px Arial, sans-serif';
    context.textAlign = 'center';
    context.direction = input.language === 'ar' ? 'rtl' : 'ltr';
    context.fillText(copy.noArtwork, printAreaX + areaWidth / 2, printAreaY + areaHeight / 2);
  }

  context.direction = input.language === 'ar' ? 'rtl' : 'ltr';
  context.textAlign = input.language === 'ar' ? 'right' : 'left';
  context.fillStyle = '#111827';
  context.font = '700 17px Arial, sans-serif';
  context.fillText(
    `${copy.visibleLayers}: ${visibleLayers.length}`,
    textX,
    panelY + PROOF_PANEL_HEIGHT - 108,
  );
  context.fillStyle = '#6b7280';
  context.font = '500 15px Arial, sans-serif';
  const layerNames = visibleLayers.map(({ layer }, index) => `${index + 1}. ${layer.name}`).join('  ·  ');
  context.fillText(layerNames || '—', textX, panelY + PROOF_PANEL_HEIGHT - 76, panelWidth - 76);
  context.restore();
};

const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The browser could not encode the production proof.'));
    }, 'image/png');
  });

export const createProductionProofBlob = async (
  input: ProductionExportInput,
): Promise<Blob> => {
  const visibleLayers = input.decals.filter((layer) => layer.visible);
  const imageEntries = await Promise.all(
    visibleLayers.map(async (layer) => [layer.id, await loadArtworkImage(layer.url)] as const),
  );
  const images = new Map(imageEntries);
  const panelGapWidth = PROOF_PANEL_GAP * (PROOF_COLUMNS - 1);
  const panelWidth =
    (PROOF_WIDTH - PROOF_MARGIN * 2 - panelGapWidth) / PROOF_COLUMNS;
  const rows = Math.max(1, Math.ceil(input.modelConfig.surfaces.length / PROOF_COLUMNS));
  const canvas = document.createElement('canvas');
  canvas.width = PROOF_WIDTH;
  canvas.height =
    PROOF_HEADER_HEIGHT +
    rows * PROOF_PANEL_HEIGHT +
    Math.max(0, rows - 1) * PROOF_PANEL_GAP +
    PROOF_FOOTER_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('The browser cannot create a production proof canvas.');

  const copy = getProofCopy(input.language);
  context.fillStyle = '#f3efe7';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.direction = input.language === 'ar' ? 'rtl' : 'ltr';
  context.textAlign = input.language === 'ar' ? 'right' : 'left';
  const headerX = input.language === 'ar' ? canvas.width - PROOF_MARGIN : PROOF_MARGIN;

  context.fillStyle = '#111827';
  context.font = '900 54px Arial, sans-serif';
  context.fillText(`${BRAND.displayName} · ${copy.title}`, headerX, 78);
  context.fillStyle = '#4b5563';
  context.font = '600 21px Arial, sans-serif';
  context.fillText(
    `${copy.draft}: ${input.draftName.trim() || input.draftId} · ${copy.product}: ${input.productName} · ${copy.size}: ${input.size} · ${copy.color}: ${input.color}`,
    headerX,
    124,
  );
  context.fillText(`${copy.draft} ID: ${input.draftId}`, headerX, 160);

  input.modelConfig.surfaces.forEach((surface, index) => {
    const column = index % PROOF_COLUMNS;
    const row = Math.floor(index / PROOF_COLUMNS);
    const panelX = PROOF_MARGIN + column * (panelWidth + PROOF_PANEL_GAP);
    const panelY = PROOF_HEADER_HEIGHT + row * (PROOF_PANEL_HEIGHT + PROOF_PANEL_GAP);
    drawSurfacePanel(context, input, surface, index, images, panelX, panelY, panelWidth);
  });

  context.direction = input.language === 'ar' ? 'rtl' : 'ltr';
  context.textAlign = input.language === 'ar' ? 'right' : 'left';
  context.fillStyle = '#92400e';
  context.font = '700 17px Arial, sans-serif';
  context.fillText(
    copy.calibration,
    headerX,
    canvas.height - 72,
    canvas.width - PROOF_MARGIN * 2,
  );
  context.fillStyle = '#6b7280';
  context.font = '500 15px Arial, sans-serif';
  const generatedAt = input.generatedAt ?? new Date();
  context.fillText(
    `${copy.generated}: ${new Intl.DateTimeFormat(input.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(generatedAt)}`,
    headerX,
    canvas.height - 36,
  );

  return canvasToPngBlob(canvas);
};
