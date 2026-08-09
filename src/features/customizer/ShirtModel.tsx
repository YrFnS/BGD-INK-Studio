import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Center, Decal, useGLTF } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  getPrintSurface,
  type PrintSurfaceDefinition,
  type ReadyProductModelConfig,
} from '@/data/assets3d';
import { DecalLayer, PrintSurfaceId } from '@/types';
import { normalizeArtworkAspectRatio } from './artworkAnalysis';
import { useOptimizedArtworkTexture } from './artworkTexture';
import {
  applyDecalTransformToObject,
  getDecalRenderRotation,
  normalizeDecalTransform,
  readDecalTransform,
  type DecalTransform,
} from './decalTransform';
import {
  calculateMultiPointerTransform,
  calculateSinglePointerTransform,
  type ArtworkTransform,
  type CustomizerInteractionMode,
  type ScreenPoint,
} from './interactionGestures';
import { getArtworkModelDimensions, isPointOnSurfaceSide } from './printArea';
import type { RenderingQuality } from './renderingCapabilities';
import * as THREE from 'three';

interface ShirtModelProps {
  modelConfig: ReadyProductModelConfig;
  selectedSurfaceId: PrintSurfaceId;
  color: string;
  decals: DecalLayer[];
  activeDecalId: string | null;
  interactionMode: CustomizerInteractionMode;
  textureAnisotropy: 2 | 4 | 8;
  renderingQuality: RenderingQuality;
  shadowsEnabled: boolean;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  onDecalTransformChange: (scale: number, rotation: number) => void;
  onDecalInteractionStart: () => void;
  onDecalInteractionEnd: () => void;
  setDraggingDecal: (dragging: boolean) => void;
}

export interface ShirtModelHandle {
  previewDecalTransform: (layerId: string, transform: DecalTransform) => void;
  finishDecalInteraction: () => void;
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
  renderingQuality,
  onMeshChange,
}: {
  layer: DecalLayer;
  surface: PrintSurfaceDefinition;
  isActive: boolean;
  order: number;
  textureAnisotropy: 2 | 4 | 8;
  renderingQuality: RenderingQuality;
  onMeshChange: (mesh: THREE.Mesh | null) => void;
}) => {
  const texture = useOptimizedArtworkTexture(layer, renderingQuality, textureAnisotropy);
  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const dimensions = getArtworkModelDimensions(layer.scale, surface, aspectRatio);
  const finalRotation = useMemo(
    () => getDecalRenderRotation(layer.rotation, layer.userRotation),
    [layer.rotation, layer.userRotation],
  );

  if (!texture) return null;

  return (
    <Decal
      ref={(mesh) => onMeshChange(mesh as THREE.Mesh | null)}
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

export const ShirtModel = React.forwardRef<ShirtModelHandle, ShirtModelProps>(
  (
    {
      modelConfig,
      selectedSurfaceId,
      color,
      decals,
      activeDecalId,
      interactionMode,
      textureAnisotropy,
      renderingQuality,
      shadowsEnabled,
      onDecalChange,
      onDecalTransformChange,
      onDecalInteractionStart,
      onDecalInteractionEnd,
      setDraggingDecal,
    },
    ref,
  ) => {
    const invalidate = useThree((state) => state.invalidate);
    const activePointersRef = useRef(new Map<number, ScreenPoint>());
    const transformBaselineRef = useRef<TransformBaseline | null>(null);
    const isManipulatingRef = useRef(false);
    const decalMeshesRef = useRef(new Map<string, THREE.Mesh>());
    const liveTransformRef = useRef<{ layerId: string; transform: DecalTransform } | null>(null);
    const decalsRef = useRef(decals);
    decalsRef.current = decals;

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
    const activeLayer = decals.find((layer) => layer.id === activeDecalId && layer.visible) ?? null;
    const activeLayerRef = useRef<DecalLayer | null>(activeLayer);
    activeLayerRef.current = activeLayer;
    const selectedSurface = getPrintSurface(modelConfig, selectedSurfaceId);

    const applyPreview = useCallback(
      (layerId: string, transform: DecalTransform) => {
        const layer = decalsRef.current.find((candidate) => candidate.id === layerId);
        const mesh = decalMeshesRef.current.get(layerId);
        if (!layer || !mesh) return;

        applyDecalTransformToObject(
          mesh,
          layer,
          transform,
          getPrintSurface(modelConfig, layer.surfaceId),
        );
        invalidate();
      },
      [invalidate, modelConfig],
    );

    const previewLayerTransform = useCallback(
      (layerId: string, transform: DecalTransform) => {
        liveTransformRef.current = { layerId, transform };
        applyPreview(layerId, transform);
      },
      [applyPreview],
    );

    const registerDecalMesh = useCallback(
      (layerId: string, mesh: THREE.Mesh | null) => {
        if (mesh) decalMeshesRef.current.set(layerId, mesh);
        else decalMeshesRef.current.delete(layerId);

        const live = liveTransformRef.current;
        if (mesh && live?.layerId === layerId) applyPreview(layerId, live.transform);
      },
      [applyPreview],
    );

    const getActiveTransform = useCallback((): DecalTransform | null => {
      const layer = activeLayerRef.current;
      if (!layer) return null;
      const live = liveTransformRef.current;
      return live?.layerId === layer.id ? live.transform : readDecalTransform(layer);
    }, []);

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
      liveTransformRef.current = null;
    }, [activeDecalId, decals]);

    const beginManipulation = useCallback(() => {
      const layer = activeLayerRef.current;
      if (!layer || isManipulatingRef.current) return;

      if (liveTransformRef.current?.layerId !== layer.id) {
        liveTransformRef.current = { layerId: layer.id, transform: readDecalTransform(layer) };
      }
      isManipulatingRef.current = true;
      setDraggingDecal(true);
      onDecalInteractionStart();
    }, [onDecalInteractionStart, setDraggingDecal]);

    const finishManipulation = useCallback(() => {
      activePointersRef.current.clear();
      transformBaselineRef.current = null;
      if (isManipulatingRef.current) onDecalInteractionEnd();
      isManipulatingRef.current = false;
      setDraggingDecal(false);
    }, [onDecalInteractionEnd, setDraggingDecal]);

    useImperativeHandle(
      ref,
      () => ({
        previewDecalTransform: previewLayerTransform,
        finishDecalInteraction: finishManipulation,
      }),
      [finishManipulation, previewLayerTransform],
    );

    useEffect(
      () => () => {
        finishManipulation();
      },
      [activeDecalId, finishManipulation, interactionMode],
    );

    const resetTransformBaseline = () => {
      const current = getActiveTransform();
      if (!current) {
        transformBaselineRef.current = null;
        return;
      }

      const pointers = Array.from(activePointersRef.current.entries());
      const initial = { scale: current.scale, rotation: current.userRotation };

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
      const current = getActiveTransform();
      if (!event.face || !layer || !current) return;

      const surface = getPrintSurface(modelConfig, layer.surfaceId);
      const mesh = event.object as THREE.Mesh;
      const localPoint = mesh.worldToLocal(event.point.clone());
      if (!isPointOnSurfaceSide(localPoint.z, surface)) return;

      const normal = event.face.normal.clone();
      const target = new THREE.Vector3(0, 0, 1);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(target, normal);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);
      const next = normalizeDecalTransform(
        layer,
        current,
        {
          position: [localPoint.x, localPoint.y, localPoint.z],
          rotation: [euler.x, euler.y, euler.z],
        },
        surface,
      );

      previewLayerTransform(layer.id, next);
      onDecalChange(next.position, next.rotation);
    };

    const updateDecalTransform = () => {
      const baseline = transformBaselineRef.current;
      const layer = activeLayerRef.current;
      const current = getActiveTransform();
      if (!baseline || !layer || !current) return;

      let calculated: ArtworkTransform | null = null;
      if (baseline.kind === 'single') {
        const pointer = activePointersRef.current.get(baseline.pointerId);
        if (pointer) {
          calculated = calculateSinglePointerTransform(baseline.initial, baseline.start, pointer);
        }
      } else {
        const currentFirst = activePointersRef.current.get(baseline.pointerIds[0]);
        const currentSecond = activePointersRef.current.get(baseline.pointerIds[1]);
        if (currentFirst && currentSecond) {
          calculated = calculateMultiPointerTransform(
            baseline.initial,
            baseline.startFirst,
            baseline.startSecond,
            currentFirst,
            currentSecond,
          );
        }
      }
      if (!calculated) return;

      const next = normalizeDecalTransform(
        layer,
        current,
        { scale: calculated.scale, userRotation: calculated.rotation },
        getPrintSurface(modelConfig, layer.surfaceId),
      );
      previewLayerTransform(layer.id, next);
      onDecalTransformChange(next.scale, next.userRotation);
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
        <group dispose={null} position={modelConfig.position} scale={modelConfig.scale}>
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
                    renderingQuality={renderingQuality}
                    onMeshChange={(mesh) => registerDecalMesh(layer.id, mesh)}
                  />
                ) : null,
              )}
            </mesh>
          </group>
        </group>
      </Center>
    );
  },
);

ShirtModel.displayName = 'ShirtModel';
