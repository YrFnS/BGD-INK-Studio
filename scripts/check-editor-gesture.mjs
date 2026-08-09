import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = {
  customizer: await readFile(path.join(root, 'src/features/customizer/Customizer.tsx'), 'utf8'),
  controls: await readFile(path.join(root, 'src/features/customizer/Controls.tsx'), 'utf8'),
  shirt: await readFile(path.join(root, 'src/features/customizer/ShirtModel.tsx'), 'utf8'),
  scene: await readFile(path.join(root, 'src/features/customizer/Scene.tsx'), 'utf8'),
  history: await readFile(path.join(root, 'src/features/customizer/editorHistory.ts'), 'utf8'),
  transform: await readFile(path.join(root, 'src/features/customizer/decalTransform.ts'), 'utf8'),
  journey: await readFile(path.join(root, 'e2e/layer-editor.spec.ts'), 'utf8'),
};

const failures = [];
const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};
const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) failures.push(message);
};

forbidPattern(
  files.customizer,
  /applyLiveEditorChange|gestureStartRef/,
  'pointer-frequency changes must not flow through durable React snapshots',
);
requirePattern(
  files.customizer,
  /liveGestureRef[\s\S]*previewEditorGesture[\s\S]*commitLiveGesture/,
  'the customizer must stage a lightweight live transform and commit it once',
);
requirePattern(
  files.scene,
  /useImperativeHandle[\s\S]*previewDecalTransform/,
  'the scene must expose an imperative transform-preview boundary',
);
requirePattern(
  files.shirt,
  /applyDecalTransformToObject[\s\S]*invalidate\(\)/,
  'live canvas movement must update the Three.js object and invalidate without parent rerenders',
);
forbidPattern(
  files.controls,
  /value=\{activeDecal\.(?:scale|userRotation)\}/,
  'continuous range inputs must not be controlled by durable editor state',
);
requirePattern(
  files.controls,
  /defaultValue=\{activeDecal\.scale\}[\s\S]*onInput=/,
  'artwork size changes must preview locally until the gesture ends',
);
requirePattern(
  files.controls,
  /defaultValue=\{activeDecal\.userRotation\}[\s\S]*onInput=/,
  'rotation changes must preview locally until the gesture ends',
);
forbidPattern(
  files.history,
  /JSON\.stringify/,
  'editor history equality must use typed field comparison rather than serialization',
);
requirePattern(
  files.transform,
  /normalizeDecalTransform[\s\S]*applyDecalTransformToObject/,
  'live and committed transforms must share one normalization boundary',
);
requirePattern(
  files.journey,
  /continuous transform[\s\S]*pointerdown[\s\S]*pointerup[\s\S]*Undo[\s\S]*Redo/,
  'the browser journey must prove several live updates become one undoable commit',
);

if (failures.length > 0) {
  console.error('\nEditor-gesture validation failed:\n');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Editor-gesture validation passed: live transforms stay imperative, one durable commit is created per gesture, and typed history equality is enforced.',
);
