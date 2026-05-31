import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { PlayerId } from '../../game/types'
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
  varying vec2 vUv;

  void main() {
    vec2 atlasUv = vec2((uFrame + vUv.x) / uFrameCount, vUv.y);
    vec4 pixel = texture2D(uMap, atlasUv);
    float brightest = max(pixel.r, max(pixel.g, pixel.b));
    float darkest = min(pixel.r, min(pixel.g, pixel.b));
    float saturation = brightest - darkest;
    float paleNeutral = smoothstep(0.82, 0.97, brightest) * (1.0 - smoothstep(0.025, 0.12, saturation));
    float alpha = pixel.a * (1.0 - paleNeutral * uFilterPaleBackground);

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
}: {
  id: PlayerId
  config: SpriteFighterConfig
  accent: string
}) => {
  const fighter = useGameStore((state) => state.fighters[id])
  const animationName = getSpriteAnimation(fighter)
  const animation = config.animations[animationName]
  const loaded = useSafeTexture(animation.filePath)
  const elapsed = useRef(0)
  const frame = useRef(0)
  const fallbackTexture = useMemo(() => createFallbackTexture(accent), [accent])
  const texture = loaded.texture ?? fallbackTexture
  const frameCount = loaded.texture ? animation.frameCount : 1
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uFrame: { value: 0 },
      uFrameCount: { value: frameCount },
      uFilterPaleBackground: { value: loaded.texture ? 1 : 0 },
    }),
    [frameCount, loaded.texture, texture],
  )

  useEffect(() => {
    elapsed.current = 0
    frame.current = 0
  }, [animationName])

  useEffect(() => () => fallbackTexture.dispose(), [fallbackTexture])

  useFrame((_, delta) => {
    if (!loaded.texture) return
    elapsed.current += delta
    const nextFrame = Math.floor(elapsed.current * animation.fps)
    frame.current = animation.loop
      ? nextFrame % animation.frameCount
      : Math.min(animation.frameCount - 1, nextFrame)
    uniforms.uFrame.value = frame.current
  })

  const source = loaded.texture?.image as { width?: number; height?: number } | undefined
  const frameWidth = config.frameWidth ?? (source?.width ?? 1) / animation.frameCount
  const frameHeight = config.frameHeight ?? source?.height ?? 1
  const worldHeight = config.scale
  const worldWidth = worldHeight * (frameWidth / frameHeight)

  return (
    <group
      position={[config.horizontalOffset, config.verticalOffset, 0]}
      scale={[fighter.facing, 1, 1]}
    >
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
  )
}
