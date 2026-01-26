
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { ShirtModel } from './ShirtModel';
import { ProductType, Theme } from '../../types';

interface SceneProps {
  productType: ProductType;
  color: string;
  theme: Theme;
  decalImage: string | null;
  decalPosition: [number, number, number];
  decalRotation: [number, number, number];
  decalScale: number;
  enableControls: boolean;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

export const Scene: React.FC<SceneProps> = ({ 
  productType, 
  color, 
  theme,
  decalImage,
  decalPosition,
  decalRotation,
  decalScale,
  enableControls,
  onDecalChange,
  setDraggingDecal
}) => {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => setDraggingDecal(false)}
    >
      <Stage
        environment={theme === 'dark' ? 'city' : 'studio'}
        intensity={theme === 'dark' ? 0.5 : 1}
        adjustCamera={false}
        shadows={{ type: 'accumulative', color: '#000000', opacity: 0.2 }}
      >
        <ShirtModel 
          type={productType} 
          color={color} 
          decalImage={decalImage}
          decalPosition={decalPosition}
          decalRotation={decalRotation}
          decalScale={decalScale}
          onDecalChange={onDecalChange}
          setDraggingDecal={setDraggingDecal}
        />
      </Stage>

      <OrbitControls 
        makeDefault 
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={6}
        enabled={enableControls}
      />
    </Canvas>
  );
};
