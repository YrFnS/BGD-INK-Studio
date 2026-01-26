import React, { useRef, forwardRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Center, Decal, useTexture } from '@react-three/drei';
import { ProductType } from '../../types';
import * as THREE from 'three';

// Augment JSX.IntrinsicElements to include R3F elements
// We declare both global and module scopes to cover different TS/React configurations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      boxGeometry: any;
      cylinderGeometry: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      boxGeometry: any;
      cylinderGeometry: any;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      boxGeometry: any;
      cylinderGeometry: any;
    }
  }
}

interface ShirtModelProps {
  type: ProductType;
  color: string;
  decalImage?: string | null;
  decalPosition?: [number, number, number];
  decalRotation?: [number, number, number];
  decalScale?: number;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

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

interface ProceduralProps {
  color: string;
  decalImage?: string | null;
  decalPosition?: [number, number, number];
  decalRotation?: [number, number, number];
  decalScale?: number;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

const ProceduralShirt = forwardRef<THREE.Group, ProceduralProps>(
  ({ color, decalImage, decalPosition, decalRotation, decalScale, onDecalChange, setDraggingDecal }, ref) => {
    const [isDragging, setIsDragging] = useState(false);

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (!decalImage) return;
      e.stopPropagation();
      setIsDragging(true);
      setDraggingDecal(true);
      // Immediately place decal on click
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
      // Convert world point to local point so decal moves with the mesh animation
      const localPoint = mesh.worldToLocal(e.point.clone());
      
      // Calculate rotation to align with face normal
      // Note: For BoxGeometry, face.normal is usually in local space.
      const normal = e.face.normal.clone();
      const target = new THREE.Vector3(0, 0, 1); // Decal projects along Z
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(target, normal);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      onDecalChange(
        [localPoint.x, localPoint.y, localPoint.z],
        [euler.x, euler.y, euler.z]
      );
    };

    return (
      <group ref={ref}>
        {/* Torso - Interactive for Decal */}
        <mesh 
          position={[0, 0, 0]} 
          castShadow 
          receiveShadow
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
        >
          <boxGeometry args={[1, 1.4, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.8} />
          
          {decalImage && decalPosition && decalRotation && (
             <DecalLayer 
               textureUrl={decalImage} 
               position={decalPosition}
               rotation={decalRotation}
               scale={decalScale || 0.15} 
             />
          )}
        </mesh>

        {/* Sleeves */}
        <mesh position={[-0.65, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.5, 0.35]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0.65, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.5, 0.35]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>

        {/* Neck Area */}
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
           <meshStandardMaterial color={new THREE.Color(color).offsetHSL(0, 0, -0.1)} roughness={0.9} />
        </mesh>
      </group>
    );
  }
);

const ProceduralHoodie = forwardRef<THREE.Group, ProceduralProps>(
  ({ color, decalImage, decalPosition, decalRotation, decalScale, onDecalChange, setDraggingDecal }, ref) => {
    const [isDragging, setIsDragging] = useState(false);

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
      const localPoint = mesh.worldToLocal(e.point.clone());
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

    return (
      <group ref={ref}>
        {/* Torso */}
        <mesh 
          position={[0, 0, 0]} 
          castShadow 
          receiveShadow
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
        >
          <boxGeometry args={[1.1, 1.45, 0.45]} />
          <meshStandardMaterial color={color} roughness={0.9} />
           {decalImage && decalPosition && decalRotation && (
             <DecalLayer 
               textureUrl={decalImage} 
               position={decalPosition}
               rotation={decalRotation}
               scale={decalScale || 0.15} 
             />
          )}
        </mesh>
        
        {/* Sleeves */}
        <mesh position={[-0.7, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.1, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        <mesh position={[0.7, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.1, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        
        {/* Hood */}
        <mesh position={[0, 0.8, -0.1]} castShadow receiveShadow>
           <boxGeometry args={[0.6, 0.5, 0.5]} />
           <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        
         {/* Pocket */}
        <mesh position={[0, -0.4, 0.25]} castShadow receiveShadow>
           <boxGeometry args={[0.6, 0.3, 0.1]} />
           <meshStandardMaterial color={new THREE.Color(color).offsetHSL(0, 0, -0.05)} roughness={0.9} />
        </mesh>
      </group>
    );
  }
);

export const ShirtModel: React.FC<ShirtModelProps> = ({ 
  type, 
  color,
  decalImage,
  decalPosition = [0, 0.04, 0.15],
  decalRotation = [0, 0, 0],
  decalScale = 0.15,
  onDecalChange,
  setDraggingDecal
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Idle Animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1) * 0.02;
    }
  });

  const commonProps = {
    color,
    decalImage,
    decalPosition,
    decalRotation,
    decalScale,
    onDecalChange,
    setDraggingDecal
  };

  return (
    <Center>
      {type === ProductType.HOODIE ? (
        <ProceduralHoodie ref={groupRef} {...commonProps} />
      ) : (
        <ProceduralShirt ref={groupRef} {...commonProps} />
      )}
    </Center>
  );
};