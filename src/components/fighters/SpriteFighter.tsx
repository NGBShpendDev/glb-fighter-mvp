import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { PlayerId, SpriteAssetDiagnostic } from '../../game/types'
import {
  getSpriteAnimation,
  type SpriteFighterConfig,
} from '../../game/spriteFighters'
import { useGameStore } from '../../store/gameStore'
import { useSafeTexture } from '../assets/useSafeTexture'

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D uMap;
  uniform float uFrame;
  uniform float uFrameCount;
  uniform float uFilterPaleBackground;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 atlasUv = vec2((uFrame + vUv.x) / uFrameCount, vUv.y);
    vec4 pixel = texture2D(uMap, atlasUv);
    float brightest = max(pixel.r, max(pixel.g, pixel.b));
    float darkest = min(pixel.r, min(pixel.g, pixel.b));
    float saturation = brightest - darkest;
    float paleNeutral = smoothstep(0.82, 0.97, brightest) * (1.0 - smoothstep(0.025, 0.12, saturation));
    float alpha = pixel.a * (1.0 - paleNeutral * uFilterPaleBackground) * uOpacity;

    if (alpha < 0.035) discard;
    gl_FragColor = vec4(pixel.rgb, alpha);
  }
`

const createFallbackTexture = (accent: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')

  if (context) {
    context.clearRect(0, 0, 256, 256)
    context.fillStyle = 'rgba(7, 10, 23, 0.42)'
    context.beginPath()
    context.ellipse(128, 232, 62, 13, 0, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = accent
    context.strokeStyle = '#f4f7ff'
    context.lineWidth = 8
    context.lineJoin = 'round'
    context.beginPath()
    context.arc(128, 58, 31, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.fillRect(92, 91, 72, 84)
    context.strokeRect(92, 91, 72, 84)
    context.fillRect(56, 102, 38, 22)
    context.strokeRect(56, 102, 38, 22)
    context.fillRect(162, 102, 38, 22)
    context.strokeRect(162, 102, 38, 22)
    context.fillRect(96, 172, 24, 58)
    context.strokeRect(96, 172, 24, 58)
    context.fillRect(136, 172, 24, 58)
    context.strokeRect(136, 172, 24, 58)
    context.fillStyle = '#10192d'
    context.fillRect(108, 51, 12, 8)
    context.fillRect(136, 51, 12, 8)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export const SpriteFighter = ({
  id,
  config,
  accent,
  onStatus,
}: {
  id: PlayerId
  config: SpriteFighterConfig
  accent: string
  onStatus: (diagnostic: SpriteAssetDiagnostic) => void
}) => {
  const fighter = useGameStore((state) => state.fighters[id])
  const animationName = getSpriteAnimation(fighter)
  const animation = config.animations[animationName]
  const loaded = useSafeTexture(animation.filePath)
  const alternateAnimation = animation.fallbackAnimation
    ? config.animations[animation.fallbackAnimation]
    : undefined
  const alternateLoaded = useSafeTexture(alternateAnimation?.filePath)
  const elapsed = useRef(0)
  const frame = useRef(0)
  const transition = useRef(1)
  const visual = useRef<THREE.Group>(null)
  const fallbackTexture = useMemo(() => createFallbackTexture(accent), [accent])
  const playback = loaded.texture ? animation : alternateLoaded.texture && alternateAnimation ? alternateAnimation : animation
  const texture = loaded.texture ?? alternateLoaded.texture ?? fallbackTexture
  const usingGeneratedFallback = texture === fallbackTexture
  const usingAlternateSheet = !loaded.texture && Boolean(alternateLoaded.texture)
  const frameCount = usingGeneratedFallback ? 1 : playback.frameCount
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uFrame: { value: 0 },
      uFrameCount: { value: frameCount },
      uFilterPaleBackground: { value: usingGeneratedFallback ? 0 : 1 },
      uOpacity: { value: 1 },
    }),
    [frameCount, texture, usingGeneratedFallback],
  )

  useEffect(() => {
    elapsed.current = 0
    frame.current = 0
    transition.current = 0
    uniforms.uFrame.value = 0
  }, [animationName])

  useEffect(() => () => fallbackTexture.dispose(), [fallbackTexture])

  useEffect(() => {
    const message =
      loaded.status === 'loaded'
        ? `Loaded ${animation.filePath}`
        : loaded.status === 'error'
          ? usingAlternateSheet
            ? `Missing ${animation.filePath}; using ${animation.fallbackAnimation} sheet fallback.`
            : `Missing ${animation.filePath}; using fallback silhouette.`
          : `Loading ${animation.filePath}`
    onStatus({ animation: animationName, filePath: animation.filePath, status: loaded.status, message })
  }, [animation.fallbackAnimation, animation.filePath, animationName, loaded.status, onStatus, usingAlternateSheet])

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    const frozen = state.phase === 'paused' || state.hitStop > 0
    if (!frozen) {
      elapsed.current += delta
      transition.current = Math.min(1, transition.current + delta / 0.085)
    }

    if (!usingGeneratedFallback) {
      const nextFrame = Math.floor(elapsed.current * playback.fps)
      frame.current = playback.loop
        ? nextFrame % playback.frameCount
        : Math.min(playback.frameCount - 1, nextFrame)
      uniforms.uFrame.value = frame.current
    }

    const ease = 1 - Math.pow(1 - transition.current, 3)
    uniforms.uOpacity.value = 0.72 + ease * 0.28
    if (visual.current) {
      const settle = 0.94 + ease * 0.06
      visual.current.scale.setScalar(settle)
      visual.current.position.y = (1 - ease) * -0.045
    }
  })

  const source = (usingGeneratedFallback ? undefined : texture.image) as { width?: number; height?: number } | undefined
  const frameWidth = config.frameWidth ?? (source?.width ?? 1) / playback.frameCount
  const frameHeight = config.frameHeight ?? source?.height ?? 1
  const worldHeight = config.scale * (animation.scale ?? 1)
  const worldWidth = worldHeight * (frameWidth / frameHeight)

  return (
    <group
      position={[
        config.horizontalOffset + (animation.horizontalOffset ?? 0),
        config.verticalOffset + (animation.verticalOffset ?? 0),
        0,
      ]}
      scale={[fighter.facing, 1, 1]}
    >
      <group ref={visual}>
        <mesh position={[0, worldHeight / 2, 0.18]} renderOrder={15}>
          <planeGeometry args={[worldWidth, worldHeight]} />
          <shaderMaterial
            depthWrite={false}
            fragmentShader={fragmentShader}
            side={THREE.DoubleSide}
            toneMapped={false}
            transparent
            uniforms={uniforms}
            vertexShader={vertexShader}
          />
        </mesh>
      </group>
    </group>
  )
}
