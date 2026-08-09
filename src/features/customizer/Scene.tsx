import React, { ReactNode, useEffect, useImperativeHandle, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import {
  getPrintSurface,
  type PrintSurfaceDefinition,
  type ReadyProductModelConfig,
} from '@/data/assets3d';
import { DecalLayer, PrintSurfaceId, Theme } from '@/types';
import type { DecalTransform } from './decalTransform';
import type { CustomizerInteractionMode } from './interactionGestures';
import type { RenderingProfile } from './renderingCapabilities';
import { ProceduralFallback, ShirtModel, type ShirtModelHandle } from './ShirtModel';

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

export interface SceneHandle {
  previewDecalTransform: (layerId: string, transform: DecalTransform) => void;
}

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError: (error: unknown) => void;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

const WEBGL_CONTEXT_OPTIONS = {
  antialias: true,
  powerPreference: 'default' as WebGLPowerPreference,
};

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

const DemandRenderCoordinator = ({
  activeDecalId,
  color,
  decals,
  interactionMode,
  isPageVisible,
  renderingProfile,
  selectedSurfaceId,
  theme,
}: {
  activeDecalId: string | null;
  color: string;
  decals: DecalLayer[];
  interactionMode: CustomizerInteractionMode;
  isPageVisible: boolean;
  renderingProfile: RenderingProfile;
  selectedSurfaceId: PrintSurfaceId;
  theme: Theme;
}) => {
  const { gl, invalidate, setDpr, size } = useThree();

  useEffect(() => {
    const devicePixelRatio =
      typeof window === 'undefined' ? 1 : Math.max(1, window.devicePixelRatio || 1);
    setDpr(Math.min(devicePixelRatio, renderingProfile.maximumDpr));
    gl.shadowMap.enabled = renderingProfile.shadows;
    gl.shadowMap.autoUpdate = renderingProfile.shadows;
    gl.shadowMap.needsUpdate = true;
    if (isPageVisible) invalidate();
  }, [
    gl,
    invalidate,
    isPageVisible,
    renderingProfile.maximumDpr,
    renderingProfile.shadowMapSize,
    renderingProfile.shadows,
    setDpr,
  ]);

  useEffect(() => {
    if (isPageVisible) invalidate();
  }, [
    activeDecalId,
    color,
    decals,
    interactionMode,
    invalidate,
    isPageVisible,
    renderingProfile.quality,
    renderingProfile.shadowMapSize,
    selectedSurfaceId,
    size.height,
    size.width,
    theme,
  ]);

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

const DemandOrbitControls = ({
  enabled,
  surface,
}: {
  enabled: boolean;
  surface: PrintSurfaceDefinition;
}) => {
  const invalidate = useThree((state) => state.invalidate);

  return (
    <OrbitControls
      makeDefault
      target={surface.cameraTarget}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 1.8}
      enablePan={false}
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.08}
      minDistance={2}
      maxDistance={6}
      enabled={enabled}
      onStart={() => invalidate()}
      onChange={() => invalidate()}
      onEnd={() => invalidate()}
    />
  );
};

export const Scene = React.forwardRef<SceneHandle, SceneProps>(
  (
    {
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
    },
    ref,
  ) => {
    const shirtModelRef = useRef<ShirtModelHandle>(null);
    const isDark = theme === 'dark';
    const selectedSurface = getPrintSurface(modelConfig, selectedSurfaceId);

    useImperativeHandle(
      ref,
      () => ({
        previewDecalTransform: (layerId, transform) => {
          shirtModelRef.current?.previewDecalTransform(layerId, transform);
        },
      }),
      [],
    );

    const stopDecalInteraction = () => {
      shirtModelRef.current?.finishDecalInteraction();
      setDraggingDecal(false);
    };

    return (
      <Canvas
        shadows={renderingProfile.shadows}
        dpr={[1, renderingProfile.maximumDpr]}
        frameloop={isPageVisible ? 'demand' : 'never'}
        camera={{ position: selectedSurface.cameraPosition, fov: 45 }}
        gl={WEBGL_CONTEXT_OPTIONS}
        style={{ background: 'transparent', touchAction: 'none' }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = renderingProfile.shadows;
          gl.shadowMap.autoUpdate = renderingProfile.shadows;
        }}
        onPointerMissed={stopDecalInteraction}
      >
        <DemandRenderCoordinator
          activeDecalId={activeDecalId}
          color={color}
          decals={decals}
          interactionMode={interactionMode}
          isPageVisible={isPageVisible}
          renderingProfile={renderingProfile}
          selectedSurfaceId={selectedSurfaceId}
          theme={theme}
        />
        <WebGLContextMonitor onContextLost={onContextLost} onContextRestored={onContextRestored} />
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

        <ModelErrorBoundary fallback={<ProceduralFallback color={color} />} onError={onModelError}>
          <ShirtModel
            ref={shirtModelRef}
            modelConfig={modelConfig}
            selectedSurfaceId={selectedSurfaceId}
            color={color}
            decals={decals}
            activeDecalId={activeDecalId}
            interactionMode={interactionMode}
            textureAnisotropy={renderingProfile.textureAnisotropy}
            renderingQuality={renderingProfile.quality}
            shadowsEnabled={renderingProfile.shadows}
            onDecalChange={onDecalChange}
            onDecalTransformChange={onDecalTransformChange}
            onDecalInteractionStart={onDecalInteractionStart}
            onDecalInteractionEnd={onDecalInteractionEnd}
            setDraggingDecal={setDraggingDecal}
          />
        </ModelErrorBoundary>

        <DemandOrbitControls
          key={selectedSurface.id}
          surface={selectedSurface}
          enabled={interactionMode === 'view'}
        />
      </Canvas>
    );
  },
);

Scene.displayName = 'Scene';
