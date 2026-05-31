import { useGLTF } from '@react-three/drei'
import { Component, Suspense, useEffect, useMemo, type ErrorInfo, type ReactNode } from 'react'
import * as THREE from 'three'
import type { ModelDiagnostic } from '../../game/types'

const TARGET_SKIN_HEIGHT = 2.75

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown GLB loading error.'

const LoadingFallback = ({
  accent,
  modelUrl,
  onStatus,
}: {
  accent: string
  modelUrl: string
  onStatus?: (diagnostic: ModelDiagnostic) => void
}) => {
  useEffect(() => {
    const diagnostic: ModelDiagnostic = {
      modelUrl,
      status: 'loading',
      message: `Loading ${modelUrl}`,
    }
    console.info(`[GLB] loading ${modelUrl}`)
    onStatus?.(diagnostic)
  }, [modelUrl, onStatus])

  return <FallbackSkin accent={accent} />
}

class GlbErrorBoundary extends Component<
  {
    children: ReactNode
    fallback: ReactNode
    modelUrl: string
    onStatus?: (diagnostic: ModelDiagnostic) => void
  },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, _info: ErrorInfo) {
    const message = errorMessage(error)
    console.error(`[GLB] failed ${this.props.modelUrl}: ${message}`)
    this.props.onStatus?.({
      modelUrl: this.props.modelUrl,
      status: 'error',
      message,
    })
  }

  componentDidUpdate(previous: Readonly<{ modelUrl: string }>) {
    if (previous.modelUrl !== this.props.modelUrl && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const LoadedGlbSkin = ({
  modelUrl,
  scale,
  onStatus,
}: {
  modelUrl: string
  scale: number
  onStatus?: (diagnostic: ModelDiagnostic) => void
}) => {
  const { scene } = useGLTF(modelUrl)
  const normalized = useMemo(() => {
    const clone = scene.clone(true)
    let meshes = 0
    let nodes = 0

    clone.traverse((child) => {
      nodes += 1
      if (child instanceof THREE.Mesh) {
        meshes += 1
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    clone.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())

    if (meshes === 0 || !Number.isFinite(size.y) || size.y <= 0.0001) {
      throw new Error('GLB loaded, but it does not contain measurable mesh geometry.')
    }

    return {
      clone,
      meshes,
      nodes,
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
      normalizedScale: TARGET_SKIN_HEIGHT / size.y,
      sourceSize: { x: size.x, y: size.y, z: size.z },
    }
  }, [scene])

  useEffect(() => {
    const diagnostic: ModelDiagnostic = {
      modelUrl,
      status: 'loaded',
      message: `Loaded ${normalized.meshes} mesh${normalized.meshes === 1 ? '' : 'es'}.`,
      meshes: normalized.meshes,
      nodes: normalized.nodes,
      normalizedScale: normalized.normalizedScale,
      sourceSize: normalized.sourceSize,
    }
    console.info(`[GLB] loaded ${modelUrl}`, diagnostic)
    onStatus?.(diagnostic)
  }, [modelUrl, normalized, onStatus])

  return (
    <group scale={normalized.normalizedScale * scale}>
      <group position={normalized.offset}>
        <primitive object={normalized.clone} dispose={null} />
      </group>
    </group>
  )
}

export const FallbackSkin = ({ accent = '#ff5267' }: { accent?: string }) => (
  <group>
    <mesh position={[0, 1.45, 0]} castShadow>
      <boxGeometry args={[0.82, 1.5, 0.5]} />
      <meshStandardMaterial color={accent} roughness={0.55} />
    </mesh>
    <mesh position={[0, 2.5, 0]} castShadow>
      <boxGeometry args={[0.62, 0.62, 0.58]} />
      <meshStandardMaterial color={accent} roughness={0.5} />
    </mesh>
    {[-0.3, 0.3].map((x) => (
      <mesh key={x} position={[x, 0.42, 0]} castShadow>
        <boxGeometry args={[0.27, 0.95, 0.3]} />
        <meshStandardMaterial color="#17213b" roughness={0.7} />
      </mesh>
    ))}
  </group>
)

export const GlbModel = ({
  modelUrl,
  scale = 1,
  accent,
  onStatus,
}: {
  modelUrl: string
  scale?: number
  accent?: string
  onStatus?: (diagnostic: ModelDiagnostic) => void
}) => (
  <GlbErrorBoundary
    fallback={<FallbackSkin accent={accent} />}
    modelUrl={modelUrl}
    onStatus={onStatus}
  >
    <Suspense fallback={<LoadingFallback accent={accent ?? '#ff5267'} modelUrl={modelUrl} onStatus={onStatus} />}>
      <LoadedGlbSkin modelUrl={modelUrl} scale={scale} onStatus={onStatus} />
    </Suspense>
  </GlbErrorBoundary>
)
