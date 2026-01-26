
import React, { Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { ShirtModel, ProceduralFallback } from './ShirtModel';
import { ProductType, Theme, DecalLayer } from '../../types';

interface SceneProps {
  productId: string;
  productType: ProductType;
  color: string;
  theme: Theme;
  decals: DecalLayer[];
  activeDecalId: string | null;
  enableControls: boolean;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

class ModelErrorBoundary extends React.Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("3D Model Load Failed:", error); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export const Scene: React.FC<SceneProps> = ({ 
  productId,
  productType, 
  color, 
  theme,
  decals,
  activeDecalId,
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
        <ModelErrorBoundary fallback={<ProceduralFallback color={color} />}>
          <ShirtModel 
            productId={productId}
            type={productType} 
            color={color} 
            decals={decals}
            activeDecalId={activeDecalId}
            onDecalChange={onDecalChange}
            setDraggingDecal={setDraggingDecal}
          />
        </ModelErrorBoundary>
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
