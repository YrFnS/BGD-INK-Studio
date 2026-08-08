import { describe, expect, it } from 'vitest';
import { DEFAULT_PRINT_SURFACE_ID, Size, type DecalLayer } from '@/types';
import {
  commitEditorHistory,
  createEditorHistory,
  redoEditorHistory,
  undoEditorHistory,
  type EditorSnapshot,
} from './editorHistory';

const layer = (id: string, name = id): DecalLayer => ({
  id,
  name,
  visible: true,
  url: `blob:${id}`,
  assetId: `asset-${id}`,
  fileName: `${id}.png`,
  mimeType: 'image/png',
  surfaceId: DEFAULT_PRINT_SURFACE_ID,
  position: [0, 0, 0.16],
  rotation: [0, 0, 0],
  userRotation: 0,
  scale: 0.2,
});

const snapshot = (decals: DecalLayer[] = []): EditorSnapshot => ({
  color: '#000000',
  size: Size.L,
  selectedSurfaceId: DEFAULT_PRINT_SURFACE_ID,
  activeDecalId: decals[0]?.id ?? null,
  decals,
});

describe('customizer editor history', () => {
  it('undoes and redoes layer changes without mutating saved snapshots', () => {
    const initial = snapshot([layer('one')]);
    let history = createEditorHistory(initial);
    history = commitEditorHistory(history, snapshot([layer('one'), layer('two')]));

    history.present.decals[0].name = 'mutated current';
    history = undoEditorHistory(history);

    expect(history.present.decals).toHaveLength(1);
    expect(history.present.decals[0].name).toBe('one');

    history = redoEditorHistory(history);
    expect(history.present.decals).toHaveLength(2);
    expect(history.present.decals[0].name).toBe('mutated current');
  });

  it('clears redo state after a new committed edit', () => {
    let history = createEditorHistory(snapshot());
    history = commitEditorHistory(history, snapshot([layer('one')]));
    history = undoEditorHistory(history);
    expect(history.future).toHaveLength(1);

    history = commitEditorHistory(history, {
      ...history.present,
      color: '#ffffff',
    });

    expect(history.future).toHaveLength(0);
    expect(history.present.color).toBe('#ffffff');
  });

  it('keeps only the configured number of past snapshots', () => {
    let history = createEditorHistory(snapshot());

    for (let index = 0; index < 6; index += 1) {
      history = commitEditorHistory(history, snapshot([layer(`layer-${index}`)]), 3);
    }

    expect(history.past).toHaveLength(3);
    expect(history.present.decals[0].id).toBe('layer-5');
  });
});
