import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  onDecalInteractionStart: () => void;
  onDecalInteractionEnd: () => void;
  setDraggingDecal: (dragging: boolean) => void;
}

interface LoadedGarmentModel {
  nodes: Record<string, THREE.Object3D>;
}

export const ProceduralFallback = ({ color }: { color: string }) => (
  <Center>
    <mesh castShadow receiveShadow>
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
}: {
  layer: DecalLayer;
  surface: PrintSurfaceDefinition;
  isActive: boolean;
  order: number;
}) => {
  const texture = useTexture(layer.url);
  const aspectRatio = normalizeArtworkAspectRatio(layer.aspectRatio);
  const dimensions = getArtworkModelDimensions(layer.scale, surface, aspectRatio);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

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
  onDecalChange,
  onDecalInteractionStart,
  onDecalInteractionEnd,
  setDraggingDecal,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  useFrame((state) => {
    if (groupRef.current && !isDragging) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const updateDecal = (event: ThreeEvent<PointerEvent>) => {
    if (!event.face || !activeLayer) return;

    const surface = getPrintSurface(modelConfig, activeLayer.surfaceId);
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
      activeLayer.scale,
      normalizeArtworkAspectRatio(activeLayer.aspectRatio),
    );

    onDecalChange(position, [euler.x, euler.y, euler.z]);
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!activeLayer) return;
    event.stopPropagation();
    onDecalInteractionStart();
    setIsDragging(true);
    setDraggingDecal(true);
    updateDecal(event);
  };

  const stopDragging = () => {
    if (isDragging) onDecalInteractionEnd();
    setIsDragging(false);
    setDraggingDecal(false);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (isDragging && activeLayer) {
      event.stopPropagation();
      updateDecal(event);
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
            castShadow
            receiveShadow
            geometry={targetMesh.geometry}
            material={coloredMaterial}
            onPointerDown={handlePointerDown}
            onPointerUp={stopDragging}
            onPointerLeave={stopDragging}
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
                />
              ) : null,
            )}
          </mesh>
        </group>
      </group>
    </Center>
  );
};
