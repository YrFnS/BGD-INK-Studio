import { OrbitControls, Stage } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { ReactNode } from 'react';
import { DecalLayer, ProductType, Theme } from '../../types';
import { ProceduralFallback, ShirtModel } from './ShirtModel';

interface SceneProps {
  productId: string;
  productType: ProductType;
  color: string;
  theme: Theme;
  decals: DecalLayer[];
  activeDecalId: string | null;
  enableControls: boolean;
  onDecalChange: (
    position: [number, number, number],
    rotation: [number, number, number],
  ) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends React.Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error('3D model load failed:', error);
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
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
  setDraggingDecal,
}) => (
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
      enableZoom
      minDistance={2}
      maxDistance={6}
      enabled={enableControls}
    />
  </Canvas>
);
