import type { DesignDraftSummary } from './types';

export const releaseDraftSummaryObjectUrls = (
  summaries: Array<Pick<DesignDraftSummary, 'previewUrl'>>,
): void => {
  summaries.forEach(({ previewUrl }) => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  });
};
