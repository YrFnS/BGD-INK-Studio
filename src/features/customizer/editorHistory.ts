import { incrementRuntimeCounter } from '@/runtime/performanceMetrics';
import { DecalLayer, PrintSurfaceId, Size } from '@/types';

export interface EditorSnapshot {
  color: string;
  size: Size;
  selectedSurfaceId: PrintSurfaceId;
  activeDecalId: string | null;
  decals: DecalLayer[];
}

export interface EditorHistory {
  past: EditorSnapshot[];
  present: EditorSnapshot;
  future: EditorSnapshot[];
}

const cloneTuple = <T extends readonly number[]>(value: T): T => [...value] as unknown as T;

const cloneLayer = (layer: DecalLayer): DecalLayer => ({
  ...layer,
  position: cloneTuple(layer.position),
  rotation: cloneTuple(layer.rotation),
});

const tuplesEqual = (left: readonly number[], right: readonly number[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const areLayersEqual = (left: DecalLayer, right: DecalLayer): boolean =>
  left.id === right.id &&
  left.name === right.name &&
  left.visible === right.visible &&
  left.url === right.url &&
  left.assetId === right.assetId &&
  left.fileName === right.fileName &&
  left.mimeType === right.mimeType &&
  left.surfaceId === right.surfaceId &&
  tuplesEqual(left.position, right.position) &&
  tuplesEqual(left.rotation, right.rotation) &&
  left.userRotation === right.userRotation &&
  left.scale === right.scale &&
  left.pixelWidth === right.pixelWidth &&
  left.pixelHeight === right.pixelHeight &&
  left.aspectRatio === right.aspectRatio &&
  left.hasTransparency === right.hasTransparency &&
  left.transparentPixelRatio === right.transparentPixelRatio &&
  left.transparentPaddingRatio === right.transparentPaddingRatio;

export const cloneEditorSnapshot = (snapshot: EditorSnapshot): EditorSnapshot => ({
  ...snapshot,
  decals: snapshot.decals.map(cloneLayer),
});

export const areEditorSnapshotsEqual = (left: EditorSnapshot, right: EditorSnapshot): boolean =>
  left === right ||
  (left.color === right.color &&
    left.size === right.size &&
    left.selectedSurfaceId === right.selectedSurfaceId &&
    left.activeDecalId === right.activeDecalId &&
    left.decals.length === right.decals.length &&
    left.decals.every((layer, index) => areLayersEqual(layer, right.decals[index])));

export const createEditorHistory = (initial: EditorSnapshot): EditorHistory => ({
  past: [],
  present: cloneEditorSnapshot(initial),
  future: [],
});

export const commitEditorHistory = (
  history: EditorHistory,
  next: EditorSnapshot,
  limit = 50,
): EditorHistory => {
  if (areEditorSnapshotsEqual(history.present, next)) return history;

  incrementRuntimeCounter('editorHistoryCommits');
  return {
    past: [...history.past, cloneEditorSnapshot(history.present)].slice(-limit),
    present: cloneEditorSnapshot(next),
    future: [],
  };
};

export const undoEditorHistory = (history: EditorHistory): EditorHistory => {
  const previous = history.past.at(-1);
  if (!previous) return history;

  return {
    past: history.past.slice(0, -1),
    present: cloneEditorSnapshot(previous),
    future: [cloneEditorSnapshot(history.present), ...history.future],
  };
};

export const redoEditorHistory = (history: EditorHistory): EditorHistory => {
  const next = history.future[0];
  if (!next) return history;

  return {
    past: [...history.past, cloneEditorSnapshot(history.present)],
    present: cloneEditorSnapshot(next),
    future: history.future.slice(1),
  };
};
