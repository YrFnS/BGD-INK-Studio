import { describe, expect, it } from 'vitest';
import { MAX_ARTWORK_BYTES, validateArtworkFile } from './artworkValidation';

describe('artwork validation', () => {
  it('accepts supported artwork at the size limit', () => {
    expect(validateArtworkFile({ type: 'image/png', size: MAX_ARTWORK_BYTES })).toBeNull();
  });

  it('rejects unsupported files', () => {
    expect(validateArtworkFile({ type: 'application/pdf', size: 1024 })).toBe('unsupported-type');
  });

  it('rejects artwork larger than five megabytes', () => {
    expect(validateArtworkFile({ type: 'image/webp', size: MAX_ARTWORK_BYTES + 1 })).toBe(
      'file-too-large',
    );
  });
});
