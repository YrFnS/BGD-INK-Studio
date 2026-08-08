import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Center, Decal, useTexture, useGLTF } from '@react-three/drei';
import { ProductType, DecalLayer } from '@/types';
import { ASSET_CONFIGS } from '@/data/assets3d';
import * as THREE from 'three';

interface ShirtModelProps {
  productId: string;
  type: ProductType;
  color: string;
  decals: DecalLayer[];
  activeDecalId: string | null;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

export const ProceduralFallback = ({ color }: { color: string }) => (
  <Center>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 1.4, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  </Center>
);

const DecalItem = ({ layer, isActive }: { layer: DecalLayer; isActive: boolean }) => {
  const texture = useTexture(layer.url);
  texture.anisotropy = 16;

  // Combine the surface normal rotation with the user's custom Z-rotation
  const finalRotation = React.useMemo(() => {
    // 1. Create quaternion from the surface normal orientation
    const orientation = new THREE.Euler(...layer.rotation);
    const qOrientation = new THREE.Quaternion().setFromEuler(orientation);

    // 2. Create quaternion for user's rotation around the Z axis (spin)
    const qUser = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      layer.userRotation || 0,
    );

    // 3. Combine: Align to surface, then spin around Z
    const finalQ = qOrientation.multiply(qUser);

    // 4. Convert back to Euler for the Decal component
    const finalEuler = new THREE.Euler().setFromQuaternion(finalQ);
    return [finalEuler.x, finalEuler.y, finalEuler.z] as [number, number, number];
  }, [layer.rotation, layer.userRotation]);

  return (
    <Decal
      position={layer.position}
      rotation={finalRotation}
      scale={[layer.scale, layer.scale, 0.15]}
      debug={false}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={isActive ? -10 : -4} // Active layer sits on top
        depthTest={true}
        depthWrite={false}
      />
    </Decal>
  );
};

export const ShirtModel: React.FC<ShirtModelProps> = ({
  productId,
  color,
  decals,
  activeDecalId,
  onDecalChange,
  setDraggingDecal,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get configuration
  const config = ASSET_CONFIGS[productId] || Object.values(ASSET_CONFIGS)[0];
  const { nodes, materials } = useGLTF(config.url) as any;

  // Apply Color to Material
  useEffect(() => {
    Object.values(materials).forEach((material: any) => {
      if (material.name !== 'label' && material.name !== 'Label') {
        material.color = new THREE.Color(color);
        material.needsUpdate = true;
      }
    });
  }, [color, materials]);

  // Idle Animation
  useFrame((state) => {
    if (groupRef.current && !isDragging) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  // Dragging Logic
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!activeDecalId) return;
    // We stop propagation only if we hit the shirt mesh to drag the decal
    // This allows OrbitControls to work if we click outside the mesh
    e.stopPropagation();
    setIsDragging(true);
    setDraggingDecal(true);
    updateDecal(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDraggingDecal(false);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging && activeDecalId) {
      e.stopPropagation();
      updateDecal(e);
    }
  };

  const updateDecal = (e: ThreeEvent<PointerEvent>) => {
    if (!e.face) return;

    const mesh = e.object as THREE.Mesh;
    const localPoint = mesh.worldToLocal(e.point.clone());

    // Calculate rotation to align with face normal
    const normal = e.face.normal.clone();
    const target = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(target, normal);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    onDecalChange([localPoint.x, localPoint.y, localPoint.z], [euler.x, euler.y, euler.z]);
  };

  const TargetMesh = nodes[config.nodeName] || Object.values(nodes).find((n: any) => n.isMesh);

  if (!TargetMesh) return null;

  return (
    <Center>
      <group ref={groupRef} dispose={null} position={config.position} scale={config.scale}>
        <group rotation={config.rotation}>
          <mesh
            castShadow
            receiveShadow
            geometry={TargetMesh.geometry}
            material={TargetMesh.material}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
          >
            {decals.map((layer) => (
              <DecalItem key={layer.id} layer={layer} isActive={layer.id === activeDecalId} />
            ))}
          </mesh>
        </group>
      </group>
    </Center>
  );
};
