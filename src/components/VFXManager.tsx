import { useMemo } from 'react'
import * as THREE from 'three'
import { VFX_ASSETS } from '../game/vfx'
import type { VfxEvent } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { useSafeTexture } from './assets/useSafeTexture'

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D uMap;
  uniform vec2 uGrid;
  uniform float uFrame;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float column = mod(uFrame, uGrid.x);
    float row = floor(uFrame / uGrid.x);
    vec2 atlasUv = (vec2(column, uGrid.y - row - 1.0) + vUv) / uGrid;
    vec4 pixel = texture2D(uMap, atlasUv);

    float brightest = max(pixel.r, max(pixel.g, pixel.b));
    float darkest = min(pixel.r, min(pixel.g, pixel.b));
    float saturation = brightest - darkest;
    float paleNeutral = smoothstep(0.82, 0.96, brightest) * (1.0 - smoothstep(0.025, 0.12, saturation));
    float alpha = pixel.a * (1.0 - paleNeutral) * uOpacity;

    if (alpha < 0.035) discard;
    gl_FragColor = vec4(pixel.rgb, alpha);
  }
`

const SpriteSheetEffect = ({ effect }: { effect: VfxEvent }) => {
  const config = VFX_ASSETS[effect.kind]
  const { texture } = useSafeTexture(config.imagePath)
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uGrid: { value: new THREE.Vector2(config.columns, config.rows) },
      uFrame: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [config.columns, config.rows, texture],
  )

  if (!texture) return null

  const progress = Math.min(0.999, effect.age / effect.life)
  const frameIndex = Math.min(config.frames.length - 1, Math.floor(progress * config.frames.length))
  uniforms.uMap.value = texture
  uniforms.uFrame.value = config.frames[frameIndex]
  uniforms.uOpacity.value = Math.min(1, (1 - progress) * 1.4)

  return (
    <mesh
      position={[effect.x, effect.y, effect.z]}
      renderOrder={30}
      scale={[config.size[0] * effect.scale * effect.direction, config.size[1] * effect.scale, 1]}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={config.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthTest={false}
        depthWrite={false}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  )
}

export const VFXManager = () => {
  const effects = useGameStore((state) => state.vfx)

  return (
    <group>
      {effects.map((effect) => (
        <SpriteSheetEffect effect={effect} key={effect.id} />
      ))}
    </group>
  )
}
