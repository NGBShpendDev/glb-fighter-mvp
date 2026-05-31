import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CONTROLS } from '../game/constants'
import { useGameStore } from '../store/gameStore'
import { FighterController } from './FighterController'
import { StageManager } from './StageManager'
import { VFXManager } from './VFXManager'

const GAME_KEYS = new Set([
  ...Object.values(CONTROLS.p1),
  ...Object.values(CONTROLS.p2),
  'KeyB',
  'Space',
  'Escape',
])

const ControlsBridge = () => {
  const setKey = useGameStore((state) => state.setKey)
  const startMatch = useGameStore((state) => state.startMatch)
  const toggleHitboxes = useGameStore((state) => state.toggleHitboxes)
  const togglePause = useGameStore((state) => state.togglePause)
  const clearInput = useGameStore((state) => state.clearInput)

  useEffect(() => {
    const handleKey = (event: KeyboardEvent, down: boolean) => {
      if (!GAME_KEYS.has(event.code)) return
      event.preventDefault()
      if (down && !event.repeat && event.code === 'KeyB') toggleHitboxes()
      if (down && !event.repeat && event.code === 'Space' && useGameStore.getState().phase === 'title') {
        startMatch()
      }
      if (down && !event.repeat && event.code === 'Escape') togglePause()
      setKey(event.code, down)
    }
    const down = (event: KeyboardEvent) => handleKey(event, true)
    const up = (event: KeyboardEvent) => handleKey(event, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clearInput)
    const handleVisibility = () => {
      if (document.hidden) clearInput()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clearInput)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [clearInput, setKey, startMatch, toggleHitboxes, togglePause])

  return null
}

const MatchLoop = () => {
  const update = useGameStore((state) => state.update)
  useFrame((_, delta) => update(delta), -10)
  return null
}

const CameraRig = () => {
  const target = useRef(new THREE.Vector3())

  useFrame(({ camera, clock }) => {
    const { fighters, shake } = useGameStore.getState()
    const midpoint = (fighters.p1.x + fighters.p2.x) / 2
    const distance = Math.abs(fighters.p1.x - fighters.p2.x)
    const jitterX = Math.sin(clock.elapsedTime * 92) * shake
    const jitterY = Math.cos(clock.elapsedTime * 76) * shake * 0.6
    const jitterZ = Math.sin(clock.elapsedTime * 128) * shake * 0.38
    target.current.set(midpoint + jitterX, 2.55 + jitterY, 11.4 + distance * 0.12 + jitterZ)
    camera.position.lerp(target.current, 0.075)
    camera.rotation.z = Math.sin(clock.elapsedTime * 104) * shake * 0.012
    camera.lookAt(midpoint, 1.65, 0)
  })
  return null
}

const Sparks = () => {
  const sparks = useGameStore((state) => state.sparks)
  return (
    <>
      {sparks.map((spark) => {
        const progress = spark.age / spark.life
        const burst = Math.sin(progress * Math.PI)
        const isSpecial = spark.kind === 'special'
        const scale = 0.38 + burst * (spark.blocked ? 0.72 : isSpecial ? 1.75 : 1.2)
        return (
          <group key={spark.id} position={[spark.x, spark.y, 0.8]} scale={scale}>
            <pointLight color={spark.color} intensity={spark.blocked ? 3.2 : isSpecial ? 10 : 6} distance={isSpecial ? 5 : 3} />
            <mesh scale={0.28 + burst * 0.34}>
              <sphereGeometry args={[0.34, 10, 10]} />
              <meshBasicMaterial color="#fff8cf" transparent opacity={(1 - progress) * 0.92} />
            </mesh>
            <mesh rotation={[0, 0, progress * Math.PI]} scale={0.55 + progress * (isSpecial ? 2.7 : 1.8)}>
              <torusGeometry args={[0.38, isSpecial ? 0.08 : 0.045, 7, 28]} />
              <meshBasicMaterial color={spark.color} transparent opacity={(1 - progress) * 0.78} />
            </mesh>
            {isSpecial && (
              <mesh rotation={[0, 0, -progress * Math.PI * 1.4]} scale={0.32 + progress * 2.2}>
                <torusGeometry args={[0.62, 0.055, 6, 24]} />
                <meshBasicMaterial color="#b8f8ff" transparent opacity={(1 - progress) * 0.7} />
              </mesh>
            )}
            {Array.from({ length: spark.blocked ? 6 : isSpecial ? 14 : 9 }).map((_, index) => (
              <mesh key={index} rotation={[0, 0, (Math.PI * 2 * index) / (spark.blocked ? 5 : 8)]}>
                <planeGeometry args={[spark.blocked ? 0.08 : 0.13, spark.blocked ? 0.72 : isSpecial ? 1.48 : 1.05]} />
                <meshBasicMaterial color={spark.color} transparent opacity={1 - progress} />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

export const GameScene = () => {
  const phase = useGameStore((state) => state.phase)

  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      frameloop={phase === 'title' ? 'demand' : 'always'}
      camera={{ position: [0, 2.55, 11.4], fov: 44, near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <ControlsBridge />
      <MatchLoop />
      <CameraRig />
      <Suspense fallback={null}>
        <StageManager />
        <FighterController id="p1" />
        <FighterController id="p2" />
        <Sparks />
        <VFXManager />
      </Suspense>
    </Canvas>
  )
}
