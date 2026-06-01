import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PlayerId, SpriteAssetDiagnostic } from '../../game/types'
import {
  getSpriteAnimation,
  resolveSpriteAnimations,
  type SpriteFighterConfig,
} from '../../game/spriteFighters'
import { SpriteAnimator } from '../../game/spriteAnimator'
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
  uniform float uTextureWidth;
  uniform float uFilterPaleBackground;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float halfTexel = 0.5 / max(1.0, uTextureWidth);
    float frameStart = uFrame / uFrameCount;
    float frameEnd = (uFrame + 1.0) / uFrameCount;
    vec2 atlasUv = vec2(mix(frameStart + halfTexel, frameEnd - halfTexel, vUv.x), vUv.y);
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
  const gameplayAnimation = useGameStore((state) => getSpriteAnimation(state.fighters[id]))
  const previewAnimation = useGameStore((state) => state.spriteAnimationPreview)
  const showFrameBounds = useGameStore((state) => state.debugSpriteBounds)
  const showOrigin = useGameStore((state) => state.debugSpriteOrigin)
  const desiredAnimation = previewAnimation ?? gameplayAnimation
  const animator = useRef(new SpriteAnimator(desiredAnimation))
  const [animationName, setAnimationName] = useState(desiredAnimation)
  const animations = useMemo(() => resolveSpriteAnimations(config), [config])
  const animation = animations[animationName]
  const loaded = useSafeTexture(animation.file)
  const alternateAnimation = animation.fallbackAnimation
    ? animations[animation.fallbackAnimation]
    : undefined
  const alternateLoaded = useSafeTexture(alternateAnimation?.file)
  const frame = useRef(0)
  const transition = useRef(1)
  const visual = useRef<THREE.Group>(null)
  const facing = useRef<THREE.Group>(null)
  const material = useRef<THREE.ShaderMaterial>(null)
  const lastReportedFrame = useRef(-1)
  const fallbackTexture = useMemo(() => createFallbackTexture(accent), [accent])
  const renderedSheet = loaded.texture ? animation : alternateLoaded.texture && alternateAnimation ? alternateAnimation : animation
  const texture = loaded.texture ?? alternateLoaded.texture ?? fallbackTexture
  const usingGeneratedFallback = texture === fallbackTexture
  const usingAlternateSheet = !loaded.texture && Boolean(alternateLoaded.texture)
  const renderedFrameCount = usingGeneratedFallback ? 1 : renderedSheet.frameCount
  const uniforms = useMemo(
    () => ({
      uMap: { value: fallbackTexture as THREE.Texture },
      uFrame: { value: 0 },
      uFrameCount: { value: 1 },
      uTextureWidth: { value: 1 },
      uFilterPaleBackground: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [fallbackTexture],
  )

  useEffect(() => () => fallbackTexture.dispose(), [fallbackTexture])

  useEffect(() => {
    uniforms.uMap.value = texture
    uniforms.uFrame.value = 0
    uniforms.uFrameCount.value = renderedFrameCount
    uniforms.uTextureWidth.value = (texture.image as { width?: number } | undefined)?.width ?? 1
    uniforms.uFilterPaleBackground.value = usingGeneratedFallback ? 0 : 1
    if (material.current) material.current.uniformsNeedUpdate = true
  }, [renderedFrameCount, texture, uniforms, usingGeneratedFallback])

  useEffect(() => {
    const message =
      loaded.status === 'loaded'
        ? `Loaded ${animation.file}`
        : loaded.status === 'error'
          ? usingAlternateSheet
            ? `Missing ${animation.file}; using ${animation.fallbackAnimation} sheet fallback.`
            : `Missing ${animation.file}; using fallback silhouette.`
          : `Loading ${animation.file}`
    onStatus({
      animation: animationName,
      filePath: animation.file,
      status: loaded.status,
      message,
      frameIndex: frame.current,
      frameCount: animation.frameCount,
      fps: animation.fps,
      usingFallback: usingGeneratedFallback || usingAlternateSheet,
    })
  }, [animation.fallbackAnimation, animation.file, animation.frameCount, animation.fps, animationName, loaded.status, onStatus, usingAlternateSheet, usingGeneratedFallback])

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    const fighter = state.fighters[id]
    const frozen = state.phase === 'paused' || state.hitStop > 0
    const playbackDelta = delta * (state.slowMotion > 0 ? 0.34 : 1)
    const snapshot = animator.current.update({
      animations,
      desiredAnimation: state.spriteAnimationPreview ?? getSpriteAnimation(fighter),
      delta: playbackDelta,
      frozen,
      paused: state.spriteAnimationPaused,
      stepRequest: state.spriteAnimationStepRequest,
      forcePreview: state.spriteAnimationPreview !== null,
    })
    if (snapshot.entered) {
      transition.current = 0
      lastReportedFrame.current = -1
      uniforms.uFrame.value = 0
      setAnimationName(snapshot.animation)
    }
    frame.current = snapshot.frameIndex
    if (!frozen && !state.spriteAnimationPaused) {
      transition.current = Math.min(1, transition.current + playbackDelta / 0.085)
    }

    if (!usingGeneratedFallback) {
      uniforms.uFrame.value = Math.min(
        renderedFrameCount - 1,
        Math.floor((frame.current * renderedFrameCount) / animation.frameCount),
      )
    }

    const sourceWidth = (texture.image as { width?: number } | undefined)?.width ?? 1
    uniforms.uMap.value = texture
    uniforms.uFrameCount.value = renderedFrameCount
    uniforms.uTextureWidth.value = sourceWidth
    uniforms.uFilterPaleBackground.value = usingGeneratedFallback ? 0 : 1
    if (facing.current) facing.current.scale.x = fighter.facing * config.sourceFacing

    if (state.debugSprites && frame.current !== lastReportedFrame.current) {
      lastReportedFrame.current = frame.current
      onStatus({
        animation: animationName,
        filePath: animation.file,
        status: loaded.status,
        message: loaded.status === 'loaded' ? `Loaded ${animation.file}` : `Using safe fallback for ${animation.file}`,
        frameIndex: frame.current,
        frameCount: animation.frameCount,
        fps: animation.fps,
        usingFallback: usingGeneratedFallback || usingAlternateSheet,
      })
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
  const frameWidth = config.frameWidth ?? (source?.width ?? 1) / renderedSheet.frameCount
  const frameHeight = config.frameHeight ?? source?.height ?? 1
  const worldHeight = config.scale * (animation.scale ?? 1)
  const worldWidth = worldHeight * (frameWidth / frameHeight)
  const originX = animation.originX ?? config.originX
  const originY = animation.originY ?? config.originY

  return (
    <group
      position={[
        config.horizontalOffset + (animation.offsetX ?? 0),
        config.verticalOffset + (animation.offsetY ?? 0),
        0,
      ]}
      ref={facing}
    >
      <group ref={visual}>
        <mesh position={[(0.5 - originX) * worldWidth, (0.5 - originY) * worldHeight, 0.18]} renderOrder={15}>
          <planeGeometry args={[worldWidth, worldHeight]} />
          <shaderMaterial
            depthWrite={false}
            fragmentShader={fragmentShader}
            ref={material}
            side={THREE.DoubleSide}
            toneMapped={false}
            transparent
            uniforms={uniforms}
            vertexShader={vertexShader}
          />
        </mesh>
        {showFrameBounds && (
          <mesh position={[(0.5 - originX) * worldWidth, (0.5 - originY) * worldHeight, 0.2]}>
            <planeGeometry args={[worldWidth, worldHeight]} />
            <meshBasicMaterial color="#ffe05c" transparent opacity={0.8} wireframe />
          </mesh>
        )}
        {showOrigin && (
          <group position={[0, 0, 0.22]}>
            <mesh>
              <circleGeometry args={[0.07, 18]} />
              <meshBasicMaterial color="#ff4f9a" />
            </mesh>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[worldWidth * 1.35, 0.018]} />
              <meshBasicMaterial color="#60e8ff" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
}
