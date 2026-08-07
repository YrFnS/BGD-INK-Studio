import React, { ReactNode, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import {
  getPrintSurface,
  type PrintSurfaceDefinition,
  type ReadyProductModelConfig,
} from '@/data/assets3d';
import { DecalLayer, PrintSurfaceId, Theme } from '@/types';
import type { CustomizerInteractionMode } from './interactionGestures';
import type { RenderingProfile } from './renderingCapabilities';
import { ProceduralFallback, ShirtModel } from './ShirtModel';

interface SceneProps {
  modelConfig: ReadyProductModelConfig;
  selectedSurfaceId: PrintSurfaceId;
  color: string;
  theme: Theme;
  decals: DecalLayer[];
  activeDecalId: string | null;
  interactionMode: CustomizerInteractionMode;
  renderingProfile: RenderingProfile;
  isPageVisible: boolean;
  onDecalChange: (pos: [number, number, number], rot: [number, number, number]) => void;
  onDecalTransformChange: (scale: number, rotation: number) => void;
  onDecalInteractionStart: () => void;
  onDecalInteractionEnd: () => void;
  onContextLost: () => void;
  onContextRestored: () => void;
  onModelError: (error: unknown) => void;
  setDraggingDecal: (dragging: boolean) => void;
}

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError: (error: unknown) => void;
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
    this.props.onError(error);
    if (import.meta.env.DEV) console.error('3D model load failed:', error);
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const CameraRig = ({ surface }: { surface: PrintSurfaceDefinition }) => {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    camera.position.set(...surface.cameraPosition);
    camera.lookAt(...surface.cameraTarget);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, surface]);

  return null;
};

const WebGLContextMonitor = ({
  onContextLost,
  onContextRestored,
}: {
  onContextLost: () => void;
  onContextRestored: () => void;
}) => {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    const handleContextRestored = () => {
      invalidate();
      onContextRestored();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
    };
  }, [gl, invalidate, onContextLost, onContextRestored]);

  return null;
};

export const Scene: React.FC<SceneProps> = ({
  modelConfig,
  selectedSurfaceId,
  color,
  theme,
  decals,
  activeDecalId,
  interactionMode,
  renderingProfile,
  isPageVisible,
  onDecalChange,
  onDecalTransformChange,
  onDecalInteractionStart,
  onDecalInteractionEnd,
  onContextLost,
  onContextRestored,
  onModelError,
  setDraggingDecal,
}) => {
  const isDark = theme === 'dark';
  const selectedSurface = getPrintSurface(modelConfig, selectedSurfaceId);
  const frameLoop = !isPageVisible
    ? 'never'
    : renderingProfile.idleAnimation
      ? 'always'
      : 'demand';

  const stopDecalInteraction = () => {
    setDraggingDecal(false);
    onDecalInteractionEnd();
  };

  return (
    <Canvas
      shadows={renderingProfile.shadows}
      dpr={[1, renderingProfile.maximumDpr]}
      frameloop={frameLoop}
      camera={{ position: selectedSurface.cameraPosition, fov: 45 }}
      gl={{
        antialias: renderingProfile.antialias,
        powerPreference: renderingProfile.powerPreference,
      }}
      style={{ background: 'transparent', touchAction: 'none' }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = renderingProfile.shadows;
      }}
      onPointerMissed={stopDecalInteraction}
    >
      <WebGLContextMonitor
        onContextLost={onContextLost}
        onContextRestored={onContextRestored}
      />
      <CameraRig surface={selectedSurface} />

      <ambientLight intensity={isDark ? 0.7 : 1.1} />
      <hemisphereLight
        intensity={isDark ? 0.55 : 0.8}
        color={isDark ? '#dbeafe' : '#ffffff'}
        groundColor={isDark ? '#111827' : '#d4d4d8'}
      />
      <directionalLight
        castShadow={renderingProfile.shadows}
        intensity={isDark ? 1.6 : 2.1}
        position={[3, 5, 4]}
        shadow-mapSize-width={renderingProfile.shadowMapSize}
        shadow-mapSize-height={renderingProfile.shadowMapSize}
      />
      {renderingProfile.quality !== 'low' && (
        <directionalLight intensity={0.65} position={[-4, 2, -3]} />
      )}

      <ModelErrorBoundary
        fallback={<ProceduralFallback color={color} />}
        onError={onModelError}
      >
        <ShirtModel
          modelConfig={modelConfig}
          selectedSurfaceId={selectedSurfaceId}
          color={color}
          decals={decals}
          activeDecalId={activeDecalId}
          interactionMode={interactionMode}
          idleAnimationEnabled={renderingProfile.idleAnimation && isPageVisible}
          textureAnisotropy={renderingProfile.textureAnisotropy}
          shadowsEnabled={renderingProfile.shadows}
          onDecalChange={onDecalChange}
          onDecalTransformChange={onDecalTransformChange}
          onDecalInteractionStart={onDecalInteractionStart}
          onDecalInteractionEnd={onDecalInteractionEnd}
          setDraggingDecal={setDraggingDecal}
        />
      </ModelErrorBoundary>

      <OrbitControls
        key={selectedSurface.id}
        makeDefault
        target={selectedSurface.cameraTarget}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        enablePan={false}
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={6}
        enabled={interactionMode === 'view'}
      />
    </Canvas>
  );
};
