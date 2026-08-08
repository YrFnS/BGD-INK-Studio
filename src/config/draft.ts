export const MIN_DRAFT_QUANTITY = 1;
export const MAX_DRAFT_QUANTITY = 50;

export const normalizeDraftQuantity = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return MIN_DRAFT_QUANTITY;

  return Math.min(MAX_DRAFT_QUANTITY, Math.max(MIN_DRAFT_QUANTITY, Math.round(value)));
};

export const calculateLocalDraftEstimate = (
  configuredUnitPrice: number,
  quantity: number,
): number => Math.max(0, configuredUnitPrice) * normalizeDraftQuantity(quantity);
