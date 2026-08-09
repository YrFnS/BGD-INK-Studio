import type { PrintSurfaceDefinition } from '@/data/assets3d';
import type { DecalLayer } from '@/types';
import * as THREE from 'three';
import { normalizeArtworkAspectRatio } from './artworkAnalysis';
import {
  clampPositionToSurface,
  clampScaleToSurface,
  getArtworkModelDimensions,
} from './printArea';

export interface DecalTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  userRotation: number;
  scale: number;
}

export type DecalTransformPatch = Partial<DecalTransform>;

const cloneTuple = <T extends readonly number[]>(value: T): T => [...value] as unknown as T;

const tuplesEqual = (left: readonly number[], right: readonly number[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const readDecalTransform = (layer: DecalLayer): DecalTransform => ({
  position: cloneTuple(layer.position),
  rotation: cloneTuple(layer.rotation),
  userRotation: layer.userRotation,
  scale: layer.scale,
});

export const cloneDecalTransform = (transform: DecalTransform): DecalTransform => ({
  position: cloneTuple(transform.position),
  rotation: cloneTuple(transform.rotation),
  userRotation: transform.userRotation,
  scale: transform.scale,
});

export const areDecalTransformsEqual = (left: DecalTransform, right: DecalTransform): boolean =>
  left.scale === right.scale &&
  left.userRotation === right.userRotation &&
  tuplesEqual(left.position, right.position) &&
  tuplesEqual(left.rotation, right.rotation);

export const normalizeDecalTransform = (
  layer: DecalLayer,
  current: DecalTransform,
  updates: DecalTransformPatch,
  surface: PrintSurfaceDefinition,
): DecalTransform => {
  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const scale = clampScaleToSurface(updates.scale ?? current.scale, surface, aspectRatio);
  const position = clampPositionToSurface(
    updates.position ?? current.position,
    surface,
    scale,
    aspectRatio,
  );

  return {
    position: cloneTuple(position),
    rotation: cloneTuple(updates.rotation ?? current.rotation),
    userRotation: updates.userRotation ?? current.userRotation,
    scale,
  };
};

export const applyDecalTransform = (layer: DecalLayer, transform: DecalTransform): DecalLayer => ({
  ...layer,
  position: cloneTuple(transform.position),
  rotation: cloneTuple(transform.rotation),
  userRotation: transform.userRotation,
  scale: transform.scale,
  aspectRatio: normalizeArtworkAspectRatio(layer.aspectRatio),
});

export const getDecalRenderRotation = (
  rotation: [number, number, number],
  userRotation: number,
): [number, number, number] => {
  const orientation = new THREE.Euler(...rotation);
  const orientationQuaternion = new THREE.Quaternion().setFromEuler(orientation);
  const userQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    userRotation,
  );
  const finalEuler = new THREE.Euler().setFromQuaternion(
    orientationQuaternion.multiply(userQuaternion),
  );
  return [finalEuler.x, finalEuler.y, finalEuler.z];
};

export const applyDecalTransformToObject = (
  object: THREE.Object3D,
  layer: DecalLayer,
  transform: DecalTransform,
  surface: PrintSurfaceDefinition,
): void => {
  const dimensions = getArtworkModelDimensions(
    transform.scale,
    surface,
    normalizeArtworkAspectRatio(layer.aspectRatio),
  );
  const rotation = getDecalRenderRotation(transform.rotation, transform.userRotation);

  object.position.set(...transform.position);
  object.rotation.set(...rotation);
  object.scale.set(dimensions.width, dimensions.height, 0.02);
  object.updateMatrix();
  object.updateMatrixWorld(true);
};
