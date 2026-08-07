import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Center, Decal, useGLTF, useTexture } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import {
  getPrintSurface,
  type PrintSurfaceDefinition,
  type ReadyProductModelConfig,
} from '@/data/assets3d';
import { DecalLayer, PrintSurfaceId } from '@/types';
import { normalizeArtworkAspectRatio } from './artworkAnalysis';
import {
  calculateMultiPointerTransform,
  calculateSinglePointerTransform,
  type ArtworkTransform,
  type CustomizerInteractionMode,
  type ScreenPoint,
} from './interactionGestures';
import {
  clampPositionToSurface,
  getArtworkModelDimensions,
  isPointOnSurfaceSide,
} from './printArea';
import * as THREE from 'three';

interface ShirtModelProps {
  modelConfig: ReadyProductModelConfig;
  selectedSurfaceId: PrintSurfaceId;
  color: string;
  decals: DecalLayer[];
  activeDecalId: string | null;
  interactionMode: CustomizerInteractionMode;
  idleAnimationEnabled: boolean;
  textureAnisotropy: 2 | 4 | 8;
  shadowsEnabled: boolean;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  onDecalTransformChange: (scale: number, rotation: number) => void;
  onDecalInteractionStart: () => void;
  onDecalInteractionEnd: () => void;
  setDraggingDecal: (dragging: boolean) => void;
}

interface LoadedGarmentModel {
  nodes: Record<string, THREE.Object3D>;
}

type TransformBaseline =
  | {
      kind: 'single';
      pointerId: number;
      start: ScreenPoint;
      initial: ArtworkTransform;
    }
  | {
      kind: 'multi';
      pointerIds: [number, number];
      startFirst: ScreenPoint;
      startSecond: ScreenPoint;
      initial: ArtworkTransform;
    };

export const ProceduralFallback = ({ color }: { color: string }) => (
  <Center>
    <mesh>
      <boxGeometry args={[1, 1.4, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  </Center>
);

const cloneColoredMaterial = (source: THREE.Material, color: string): THREE.Material => {
  const material = source.clone();
  if ('color' in material && material.color instanceof THREE.Color) {
    material.color.set(color);
  }
  material.needsUpdate = true;
  return material;
};

const DecalItem = ({
  layer,
  surface,
  isActive,
  order,
  textureAnisotropy,
}: {
  layer: DecalLayer;
  surface: PrintSurfaceDefinition;
  isActive: boolean;
  order: number;
  textureAnisotropy: 2 | 4 | 8;
}) => {
  const texture = useTexture(layer.url);
  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const dimensions = getArtworkModelDimensions(layer.scale, surface, aspectRatio);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = textureAnisotropy;
    texture.needsUpdate = true;
  }, [texture, textureAnisotropy]);

  const finalRotation = useMemo(() => {
    const orientation = new THREE.Euler(...layer.rotation);
    const orientationQuaternion = new THREE.Quaternion().setFromEuler(orientation);
    const userQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      layer.userRotation || 0,
    );
    const finalEuler = new THREE.Euler().setFromQuaternion(
      orientationQuaternion.multiply(userQuaternion),
    );
    return [finalEuler.x, finalEuler.y, finalEuler.z] as [number, number, number];
  }, [layer.rotation, layer.userRotation]);

  return (
    <Decal
      position={layer.position}
      rotation={finalRotation}
      scale={[dimensions.width, dimensions.height, 0.02]}
      debug={false}
      renderOrder={30 + order}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={isActive ? -100 : -4 - order * 2}
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </Decal>
  );
};

const PrintAreaGuide = ({ surface }: { surface: PrintSurfaceDefinition }) => {
  const geometry = useMemo(() => {
    const { minX, maxX, minY, maxY } = surface.modelBounds;
    const offset = surface.side === 'front' ? 0.008 : -0.008;
    const z = surface.defaultPosition[2] + offset;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(minX, minY, z),
      new THREE.Vector3(maxX, minY, z),
      new THREE.Vector3(maxX, minY, z),
      new THREE.Vector3(maxX, maxY, z),
      new THREE.Vector3(maxX, maxY, z),
      new THREE.Vector3(minX, maxY, z),
      new THREE.Vector3(minX, maxY, z),
      new THREE.Vector3(minX, minY, z),
    ]);
  }, [surface]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry} renderOrder={20}>
      <lineBasicMaterial
        color="#ef4444"
        transparent
        opacity={0.8}
        depthTest={false}
        depthWrite={false}
      />
    </lineSegments>
  );
};

export const ShirtModel: React.FC<ShirtModelProps> = ({
  modelConfig,
  selectedSurfaceId,
  color,
  decals,
  activeDecalId,
  interactionMode,
  idleAnimationEnabled,
  textureAnisotropy,
  shadowsEnabled,
  onDecalChange,
  onDecalTransformChange,
  onDecalInteractionStart,
  onDecalInteractionEnd,
  setDraggingDecal,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const activePointersRef = useRef(new Map<number, ScreenPoint>());
  const transformBaselineRef = useRef<TransformBaseline | null>(null);
  const isManipulatingRef = useRef(false);
  const [isManipulating, setIsManipulating] = useState(false);
  const { nodes } = useGLTF(modelConfig.modelUrl) as unknown as LoadedGarmentModel;
  const targetMesh = useMemo(() => {
    const node = nodes[modelConfig.garmentMeshName];
    if (!(node instanceof THREE.Mesh)) {
      throw new Error(
        `The garment mesh "${modelConfig.garmentMeshName}" was not found in ${modelConfig.modelUrl}.`,
      );
    }
    return node;
  }, [modelConfig.garmentMeshName, modelConfig.modelUrl, nodes]);
  const coloredMaterial = useMemo(
    () =>
      Array.isArray(targetMesh.material)
        ? targetMesh.material.map((material) => cloneColoredMaterial(material, color))
        : cloneColoredMaterial(targetMesh.material, color),
    [color, targetMesh.material],
  );
  const activeLayer =
    decals.find((layer) => layer.id === activeDecalId && layer.visible) ?? null;
  const activeLayerRef = useRef<DecalLayer | null>(activeLayer);
  activeLayerRef.current = activeLayer;
  const selectedSurface = getPrintSurface(modelConfig, selectedSurfaceId);

  useEffect(
    () => () => {
      if (Array.isArray(coloredMaterial)) {
        coloredMaterial.forEach((material) => material.dispose());
      } else {
        coloredMaterial.dispose();
      }
    },
    [coloredMaterial],
  );

  useEffect(() => {
    if (!idleAnimationEnabled && groupRef.current) groupRef.current.rotation.y = 0;
  }, [idleAnimationEnabled]);

  useFrame((state) => {
    if (groupRef.current && idleAnimationEnabled && !isManipulating) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const beginManipulation = useCallback(() => {
    if (isManipulatingRef.current) return;
    isManipulatingRef.current = true;
    setIsManipulating(true);
    setDraggingDecal(true);
    onDecalInteractionStart();
  }, [onDecalInteractionStart, setDraggingDecal]);

  const finishManipulation = useCallback(() => {
    activePointersRef.current.clear();
    transformBaselineRef.current = null;
    if (isManipulatingRef.current) onDecalInteractionEnd();
    isManipulatingRef.current = false;
    setIsManipulating(false);
    setDraggingDecal(false);
  }, [onDecalInteractionEnd, setDraggingDecal]);

  useEffect(() => finishManipulation, [activeDecalId, finishManipulation, interactionMode]);

  const resetTransformBaseline = () => {
    const layer = activeLayerRef.current;
    if (!layer) {
      transformBaselineRef.current = null;
      return;
    }

    const pointers = Array.from(activePointersRef.current.entries());
    const initial = { scale: layer.scale, rotation: layer.userRotation };

    if (pointers.length >= 2) {
      const [[firstId, first], [secondId, second]] = pointers;
      transformBaselineRef.current = {
        kind: 'multi',
        pointerIds: [firstId, secondId],
        startFirst: first,
        startSecond: second,
        initial,
      };
    } else if (pointers[0]) {
      const [pointerId, start] = pointers[0];
      transformBaselineRef.current = { kind: 'single', pointerId, start, initial };
    } else {
      transformBaselineRef.current = null;
    }
  };

  const updateDecalPosition = (event: ThreeEvent<PointerEvent>) => {
    const layer = activeLayerRef.current;
    if (!event.face || !layer) return;

    const surface = getPrintSurface(modelConfig, layer.surfaceId);
    const mesh = event.object as THREE.Mesh;
    const localPoint = mesh.worldToLocal(event.point.clone());
    if (!isPointOnSurfaceSide(localPoint.z, surface)) return;

    const normal = event.face.normal.clone();
    const target = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(target, normal);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    const position = clampPositionToSurface(
      [localPoint.x, localPoint.y, localPoint.z],
      surface,
      layer.scale,
      normalizeArtworkAspectRatio(layer.aspectRatio),
    );

    onDecalChange(position, [euler.x, euler.y, euler.z]);
  };

  const updateDecalTransform = () => {
    const baseline = transformBaselineRef.current;
    if (!baseline) return;

    if (baseline.kind === 'single') {
      const current = activePointersRef.current.get(baseline.pointerId);
      if (!current) return;
      const transform = calculateSinglePointerTransform(
        baseline.initial,
        baseline.start,
        current,
      );
      onDecalTransformChange(transform.scale, transform.rotation);
      return;
    }

    const currentFirst = activePointersRef.current.get(baseline.pointerIds[0]);
    const currentSecond = activePointersRef.current.get(baseline.pointerIds[1]);
    if (!currentFirst || !currentSecond) return;

    const transform = calculateMultiPointerTransform(
      baseline.initial,
      baseline.startFirst,
      baseline.startSecond,
      currentFirst,
      currentSecond,
    );
    onDecalTransformChange(transform.scale, transform.rotation);
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!activeLayer || interactionMode === 'view') return;

    event.stopPropagation();
    const target = event.target as EventTarget & {
      setPointerCapture?: (pointerId: number) => void;
    };
    target.setPointerCapture?.(event.pointerId);
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    beginManipulation();

    if (interactionMode === 'move') updateDecalPosition(event);
    else resetTransformBaseline();
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isManipulatingRef.current || interactionMode === 'view') return;
    if (!activePointersRef.current.has(event.pointerId)) return;

    event.stopPropagation();
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (interactionMode === 'move') updateDecalPosition(event);
    else {
      const pointerCount = activePointersRef.current.size;
      const baseline = transformBaselineRef.current;
      if (
        (pointerCount >= 2 && baseline?.kind !== 'multi') ||
        (pointerCount === 1 && baseline?.kind !== 'single')
      ) {
        resetTransformBaseline();
      }
      updateDecalTransform();
    }
  };

  const handlePointerEnd = (event: ThreeEvent<PointerEvent>) => {
    const target = event.target as EventTarget & {
      releasePointerCapture?: (pointerId: number) => void;
    };
    target.releasePointerCapture?.(event.pointerId);
    activePointersRef.current.delete(event.pointerId);

    if (interactionMode === 'transform' && activePointersRef.current.size > 0) {
      resetTransformBaseline();
    } else {
      finishManipulation();
    }
  };

  return (
    <Center>
      <group
        ref={groupRef}
        dispose={null}
        position={modelConfig.position}
        scale={modelConfig.scale}
      >
        <group rotation={modelConfig.rotation}>
          <mesh
            castShadow={shadowsEnabled}
            receiveShadow={shadowsEnabled}
            geometry={targetMesh.geometry}
            material={coloredMaterial}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onPointerMove={handlePointerMove}
          >
            <PrintAreaGuide surface={selectedSurface} />
            {decals.map((layer, order) =>
              layer.visible ? (
                <DecalItem
                  key={layer.id}
                  layer={layer}
                  surface={getPrintSurface(modelConfig, layer.surfaceId)}
                  isActive={layer.id === activeDecalId}
                  order={order}
                  textureAnisotropy={textureAnisotropy}
                />
              ) : null,
            )}
          </mesh>
        </group>
      </group>
    </Center>
  );
};
