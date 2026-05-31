import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getStage, type StageConfig, type StageParallaxLayer } from '../game/stages'
import { useGameStore } from '../store/gameStore'
import { Arena } from './Arena'
import { useSafeTexture } from './assets/useSafeTexture'

const TexturedPlane = ({
  texture,
  width,
  height,
  opacity = 1,
}: {
  texture: THREE.Texture
  width: number
  height: number
  opacity?: number
}) => (
  <mesh>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
  </mesh>
)

const ParallaxPlane = ({ layer }: { layer: StageParallaxLayer }) => {
  const plane = useRef<THREE.Group>(null)
  const { texture } = useSafeTexture(layer.imagePath)

  useFrame(({ camera }) => {
    if (!plane.current) return
    plane.current.position.x = (layer.x ?? 0) + camera.position.x * layer.followFactor
  })

  if (!texture) return null
  return (
    <group ref={plane} position={[layer.x ?? 0, layer.y ?? 0, layer.z]}>
      <TexturedPlane texture={texture} width={layer.width} height={layer.height} opacity={layer.opacity} />
    </group>
  )
}

const ForegroundPlane = ({
  imagePath,
  opacity,
  followFactor,
}: {
  imagePath: string
  opacity: number
  followFactor: number
}) => {
  const plane = useRef<THREE.Group>(null)
  const { texture } = useSafeTexture(imagePath)

  useFrame(({ camera }) => {
    if (plane.current) plane.current.position.x = camera.position.x * followFactor
  })

  if (!texture) return null
  return (
    <group ref={plane} position={[0, 4.6, 2.2]}>
      <TexturedPlane texture={texture} width={22} height={12.38} opacity={opacity} />
    </group>
  )
}

const StageFloor = ({
  texturePath,
  repeat = [5, 2],
  opacity = 1,
}: {
  texturePath?: string
  repeat?: [number, number]
  opacity?: number
}) => {
  const { texture } = useSafeTexture(texturePath)

  useEffect(() => {
    if (!texture) return
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(...repeat)
    texture.needsUpdate = true
  }, [repeat, texture])

  return (
    <mesh receiveShadow position={[0, 0.02, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[19, 6.4]} />
      <meshStandardMaterial
        map={texture}
        color={texture ? '#ffffff' : '#2c2d38'}
        opacity={opacity}
        roughness={0.74}
        metalness={0.18}
        transparent={opacity < 1}
      />
    </mesh>
  )
}

const AmbientParticles = ({ stage }: { stage: StageConfig }) => {
  const particles = useRef<THREE.Points>(null)
  const config = stage.ambientParticles
  const geometry = useMemo(() => {
    const positions = Array.from({ length: config.count * 3 }, (_, index) => {
      const particle = Math.floor(index / 3)
      const axis = index % 3
      if (axis === 0) return -10 + ((particle * 47) % 200) / 10
      if (axis === 1) return 0.4 + ((particle * 29) % 58) / 10
      return -3.4 + ((particle * 17) % 64) / 10
    })
    return new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    )
  }, [config.count])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock, camera }) => {
    if (!particles.current) return
    particles.current.position.x = camera.position.x * 0.2
    particles.current.rotation.z = Math.sin(clock.elapsedTime * config.speed) * 0.035
  })

  if (!config.enabled) return null
  return (
    <points ref={particles} geometry={geometry}>
      <pointsMaterial
        color={config.color}
        opacity={config.opacity}
        size={0.045}
        transparent
        depthWrite={false}
      />
    </points>
  )
}

const ConfiguredStage = ({ stage }: { stage: StageConfig }) => {
  const background = useSafeTexture(stage.backgroundImage)
  const backgroundPlane = useRef<THREE.Group>(null)

  useFrame(({ camera }) => {
    if (backgroundPlane.current) {
      backgroundPlane.current.position.x = camera.position.x * (stage.backgroundFollowFactor ?? 0)
    }
  })

  // Keep the playable procedural stage visible while a required background loads or fails.
  if (stage.backgroundImage && background.status !== 'loaded') return <Arena />

  return (
    <>
      <color attach="background" args={[stage.lighting.backgroundColor]} />
      <fog attach="fog" args={[stage.lighting.fogColor, stage.lighting.fogNear, stage.lighting.fogFar]} />
      <ambientLight intensity={stage.lighting.ambientIntensity} color={stage.lighting.ambientColor} />
      <directionalLight
        castShadow
        position={stage.lighting.directionalPosition}
        intensity={stage.lighting.directionalIntensity}
        color={stage.lighting.directionalColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {stage.lighting.pointLights.map((light, index) => (
        <pointLight key={index} {...light} />
      ))}
      {background.texture && (
        <group ref={backgroundPlane} position={[0, 4.9, -8]}>
          <TexturedPlane texture={background.texture} width={26} height={14.63} />
        </group>
      )}
      {stage.parallaxLayers.map((layer) => (
        <ParallaxPlane key={layer.id} layer={layer} />
      ))}
      <StageFloor
        texturePath={stage.floorTexture}
        repeat={stage.floorTextureRepeat}
        opacity={stage.floorOpacity}
      />
      {stage.foregroundOverlay && (
        <ForegroundPlane
          imagePath={stage.foregroundOverlay}
          opacity={stage.foregroundOpacity ?? 0.28}
          followFactor={stage.foregroundFollowFactor ?? 0.42}
        />
      )}
      <AmbientParticles stage={stage} />
    </>
  )
}

export const StageManager = ({ stageId }: { stageId?: string }) => {
  const selectedStageId = useGameStore((state) => state.selectedStageId)
  const stage = getStage(stageId ?? selectedStageId)
  return stage.artEnabled ? <ConfiguredStage stage={stage} /> : <Arena />
}
