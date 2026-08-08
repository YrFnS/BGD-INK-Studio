export const MAX_ARTWORK_BYTES = 5 * 1024 * 1024;

const ALLOWED_ARTWORK_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export type ArtworkValidationError = 'unsupported-type' | 'file-too-large';

export const validateArtworkFile = (
  file: Pick<File, 'size' | 'type'>,
): ArtworkValidationError | null => {
  if (!ALLOWED_ARTWORK_TYPES.has(file.type)) {
    return 'unsupported-type';
  }

  if (file.size > MAX_ARTWORK_BYTES) {
    return 'file-too-large';
  }

  return null;
};
