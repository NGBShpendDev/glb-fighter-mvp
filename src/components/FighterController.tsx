import { useFrame } from '@react-three/fiber'
import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import { ATTACKS } from '../game/constants'
import { getAttackHitbox, getHurtbox } from '../game/hitboxes'
import type { ModelDiagnostic, PlayerId } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { GlbModel } from './models/GlbModel'

const DebugBoxes = ({ id }: { id: PlayerId }) => {
  const fighter = useGameStore((state) => state.fighters[id])
  const enabled = useGameStore((state) => state.debugHitboxes)
  if (!enabled) return null

  const hurtbox = getHurtbox(fighter)
  const hitbox = getAttackHitbox(fighter)

  return (
    <>
      <mesh position={[hurtbox.x - fighter.x, hurtbox.y - fighter.y, 0.1]}>
        <boxGeometry args={[hurtbox.width, hurtbox.height, 0.3]} />
        <meshBasicMaterial color="#49dfff" wireframe transparent opacity={0.75} />
      </mesh>
      {hitbox && (
        <mesh position={[hitbox.x - fighter.x, hitbox.y - fighter.y, 0.2]}>
          <boxGeometry args={[hitbox.width, hitbox.height, 0.34]} />
          <meshBasicMaterial color="#ff5a36" wireframe transparent opacity={0.9} />
        </mesh>
      )}
    </>
  )
}

export const FighterController = ({ id }: { id: PlayerId }) => {
  const root = useRef<THREE.Group>(null)
  const skin = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!root.current || !skin.current) return
    const fighter = useGameStore.getState().fighters[id]
    const idle = Math.sin(clock.elapsedTime * 4.2 + (id === 'p1' ? 0 : 1.4))
    const settings = fighter.modelSettings

    root.current.position.set(fighter.x, fighter.y, 0)
    root.current.rotation.set(0, 0, 0)
    skin.current.position.set(settings.horizontalOffset, settings.verticalOffset + idle * 0.035, 0)
    skin.current.rotation.set(0, settings.rotationY + (fighter.facing === 1 ? 0 : Math.PI), 0)
    skin.current.scale.setScalar(1)

    if (!fighter.grounded) {
      const jumpStretch = Math.min(0.14, Math.abs(fighter.vy) * 0.015)
      skin.current.scale.set(1 - jumpStretch * 0.45, 1 + jumpStretch, 1 - jumpStretch * 0.45)
    }

    if (fighter.attack) {
      const spec = ATTACKS[fighter.attack.type]
      const progress = fighter.attack.elapsed / spec.duration
      const pulse = Math.sin(progress * Math.PI)
      skin.current.position.x =
        settings.horizontalOffset + fighter.facing * pulse * (fighter.attack.type === 'special' ? 0.64 : 0.36)

      if (fighter.attack.type === 'kick') {
        skin.current.rotation.z = -pulse * 0.72
        skin.current.rotation.y += fighter.facing * pulse * Math.PI * 1.65
      }

      if (fighter.attack.type === 'special') {
        skin.current.rotation.z = -pulse * 0.18
        skin.current.scale.set(1 + pulse * 0.22, 1 - pulse * 0.08, 1 + pulse * 0.22)
      }
    }

    if (fighter.blocking) {
      skin.current.rotation.z = -0.1
      skin.current.position.x -= fighter.facing * 0.12
    }

    if (fighter.hitStun > 0) {
      skin.current.rotation.z = 0.22
      skin.current.position.x -= fighter.facing * 0.15
      skin.current.scale.set(0.88, 1.08, 0.88)
    }

    if (fighter.ko) {
      skin.current.rotation.z = -fighter.facing * Math.PI * 0.48
      skin.current.position.y = settings.verticalOffset - 0.15
      skin.current.scale.set(1.12, 0.86, 1.12)
    }

    if (fighter.victorious) {
      skin.current.position.y = settings.verticalOffset + 0.18 + Math.abs(idle) * 0.12
      skin.current.rotation.z = idle * 0.035
      skin.current.scale.setScalar(1.04)
    }
  })

  const modelUrl = useGameStore((state) => state.fighters[id].modelUrl)
  const modelSettings = useGameStore((state) => state.fighters[id].modelSettings)
  const accent = useGameStore((state) => state.fighters[id].accent)
  const specialActive = useGameStore((state) => state.fighters[id].attack?.type === 'special')
  const debugHitboxes = useGameStore((state) => state.debugHitboxes)
  const setModelDiagnostic = useGameStore((state) => state.setModelDiagnostic)
  const reportModelStatus = useCallback(
    (diagnostic: ModelDiagnostic) => setModelDiagnostic(id, diagnostic),
    [id, setModelDiagnostic],
  )

  return (
    <group ref={root}>
      <group ref={skin}>
        <GlbModel
          modelUrl={modelUrl}
          scale={modelSettings.scale}
          accent={accent}
          onStatus={reportModelStatus}
        />
      </group>
      {specialActive && (
        <group position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <pointLight color={accent} intensity={3.4} distance={4} />
          <mesh>
            <torusGeometry args={[0.88, 0.045, 8, 30]} />
            <meshBasicMaterial color={accent} transparent opacity={0.72} />
          </mesh>
          <mesh scale={1.35}>
            <torusGeometry args={[0.88, 0.025, 8, 30]} />
            <meshBasicMaterial color="#ffe47a" transparent opacity={0.48} />
          </mesh>
        </group>
      )}
      {debugHitboxes && <DebugBoxes id={id} />}
    </group>
  )
}
