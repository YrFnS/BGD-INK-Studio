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

export const cloneEditorSnapshot = (snapshot: EditorSnapshot): EditorSnapshot => ({
  ...snapshot,
  decals: snapshot.decals.map(cloneLayer),
});

export const areEditorSnapshotsEqual = (
  left: EditorSnapshot,
  right: EditorSnapshot,
): boolean => JSON.stringify(left) === JSON.stringify(right);

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
