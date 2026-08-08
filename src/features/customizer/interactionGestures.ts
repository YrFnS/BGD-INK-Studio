export type CustomizerInteractionMode = 'view' | 'move' | 'transform';

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface ArtworkTransform {
  scale: number;
  rotation: number;
}

export const getPointerDistance = (first: ScreenPoint, second: ScreenPoint): number =>
  Math.hypot(second.x - first.x, second.y - first.y);

export const getPointerAngle = (first: ScreenPoint, second: ScreenPoint): number =>
  Math.atan2(second.y - first.y, second.x - first.x);

export const calculateSinglePointerTransform = (
  initial: ArtworkTransform,
  start: ScreenPoint,
  current: ScreenPoint,
): ArtworkTransform => {
  const horizontalDelta = current.x - start.x;
  const verticalDelta = current.y - start.y;

  return {
    scale: initial.scale * Math.exp(-verticalDelta * 0.006),
    rotation: initial.rotation + horizontalDelta * 0.012,
  };
};

export const calculateMultiPointerTransform = (
  initial: ArtworkTransform,
  startFirst: ScreenPoint,
  startSecond: ScreenPoint,
  currentFirst: ScreenPoint,
  currentSecond: ScreenPoint,
): ArtworkTransform => {
  const startDistance = Math.max(1, getPointerDistance(startFirst, startSecond));
  const currentDistance = Math.max(1, getPointerDistance(currentFirst, currentSecond));
  const angleDelta =
    getPointerAngle(currentFirst, currentSecond) - getPointerAngle(startFirst, startSecond);

  return {
    scale: initial.scale * (currentDistance / startDistance),
    rotation: initial.rotation + angleDelta,
  };
};
