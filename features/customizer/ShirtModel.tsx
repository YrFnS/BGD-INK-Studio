
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Center, Decal, useTexture, useGLTF } from '@react-three/drei';
import { ProductType } from '../../types';
import { ASSET_CONFIGS } from '../../data/assets3d';
import * as THREE from 'three';

interface ShirtModelProps {
  productId: string;
  type: ProductType;
  color: string;
  decalImage?: string | null;
  decalPosition?: [number, number, number];
  decalRotation?: [number, number, number];
  decalScale?: number;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

// Fallback component to display if GLTF fails to load
export const ProceduralFallback = ({ color }: { color: string }) => (
  <Center>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 1.4, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  </Center>
);

// Sub-component to safely load texture
const DecalLayer = ({ 
  textureUrl, 
  position, 
  rotation, 
  scale 
}: { 
  textureUrl: string, 
  position: [number, number, number], 
  rotation: [number, number, number],
  scale: number 
}) => {
  const texture = useTexture(textureUrl);
  texture.anisotropy = 16;
  
  return (
    <Decal 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, 0.6]} 
      debug={false}
    >
      <meshBasicMaterial 
        map={texture} 
        transparent 
        polygonOffset 
        polygonOffsetFactor={-4} 
        depthTest={true}
        depthWrite={false}
      />
    </Decal>
  );
};

export const ShirtModel: React.FC<ShirtModelProps> = ({ 
  productId,
  color,
  decalImage,
  decalPosition = [0, 0.04, 0.15],
  decalRotation = [0, 0, 0],
  decalScale = 0.15,
  onDecalChange,
  setDraggingDecal
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get configuration based on productId, fallback to first if missing
  const config = ASSET_CONFIGS[productId] || Object.values(ASSET_CONFIGS)[0];
  
  // Load GLTF Model (Will throw if network fails, caught by Boundary)
  const { nodes, materials } = useGLTF(config.url) as any;

  // Apply Color to Material
  useEffect(() => {
    // Traverse materials to find the fabric material and apply color
    Object.values(materials).forEach((material: any) => {
      if (material.name !== 'label' && material.name !== 'Label') { 
        material.color = new THREE.Color(color);
        material.needsUpdate = true;
      }
    });
  }, [color, materials]);

  // Idle Animation (Spins the outer group)
  useFrame((state) => {
    if (groupRef.current) {
      // Simple idle sway/spin
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  // Dragging Logic
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!decalImage) return;
    e.stopPropagation();
    setIsDragging(true);
    setDraggingDecal(true);
    updateDecal(e);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    setIsDragging(false);
    setDraggingDecal(false);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      e.stopPropagation();
      updateDecal(e);
    }
  };

  const updateDecal = (e: ThreeEvent<PointerEvent>) => {
    if (!e.face) return;
    
    const mesh = e.object as THREE.Mesh;
    // Convert world point to local point so decal moves with the mesh
    const localPoint = mesh.worldToLocal(e.point.clone());
    
    // Calculate rotation to align with face normal
    const normal = e.face.normal.clone();
    const target = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(target, normal);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    onDecalChange(
      [localPoint.x, localPoint.y, localPoint.z],
      [euler.x, euler.y, euler.z]
    );
  };

  // Identify the target mesh node from the GLTF
  const TargetMesh = nodes[config.nodeName] || Object.values(nodes).find((n: any) => n.isMesh);

  if (!TargetMesh) return null;

  return (
    <Center>
      {/* Outer Group: Handles Animation & Scene Positioning */}
      <group 
        ref={groupRef} 
        dispose={null} 
        position={config.position} 
        scale={config.scale}
      >
        {/* Inner Group: Handles Static Orientation Correction */}
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
            {decalImage && decalPosition && decalRotation && (
               <DecalLayer 
                 textureUrl={decalImage} 
                 position={decalPosition}
                 rotation={decalRotation}
                 scale={decalScale} 
               />
            )}
          </mesh>
        </group>
      </group>
    </Center>
  );
};
