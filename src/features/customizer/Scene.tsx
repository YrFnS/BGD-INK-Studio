import React, { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ProductType, Theme, DecalLayer } from '@/types';
import { ProceduralFallback, ShirtModel } from './ShirtModel';

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

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends React.Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    if (import.meta.env.DEV) {
      console.error('3D model load failed:', error);
    }
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
}) => {
  const isDark = theme === 'dark';

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      onPointerMissed={() => setDraggingDecal(false)}
    >
      <ambientLight intensity={isDark ? 0.7 : 1.1} />
      <hemisphereLight
        intensity={isDark ? 0.55 : 0.8}
        color={isDark ? '#dbeafe' : '#ffffff'}
        groundColor={isDark ? '#111827' : '#d4d4d8'}
      />
      <directionalLight
        castShadow
        intensity={isDark ? 1.6 : 2.1}
        position={[3, 5, 4]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight intensity={0.65} position={[-4, 2, -3]} />

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

      <OrbitControls
        makeDefault
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={6}
        enabled={enableControls}
      />
    </Canvas>
  );
};
