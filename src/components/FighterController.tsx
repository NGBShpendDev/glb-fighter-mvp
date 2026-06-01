import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { ATTACKS } from '../game/constants'
import { getAttackHitbox, getHurtbox } from '../game/hitboxes'
import type { PlayerId } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { FighterRenderer } from './fighters/FighterRenderer'

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
  const targetPosition = useRef(new THREE.Vector3())
  const targetScale = useRef(new THREE.Vector3(1, 1, 1))

  useFrame(({ clock }, delta) => {
    if (!root.current || !skin.current) return
    const fighter = useGameStore.getState().fighters[id]
    const idle = Math.sin(clock.elapsedTime * 4.2 + (id === 'p1' ? 0 : 1.4))
    const visualBlend = 1 - Math.exp(-delta * 22)
    const idleWeight = !fighter.attack && fighter.grounded && !fighter.blocking && fighter.hitStun <= 0 ? 1 : 0

    root.current.position.set(fighter.x, fighter.y, 0)
    root.current.rotation.set(0, 0, 0)
    targetPosition.current.set(0, idle * 0.025 * idleWeight, 0)
    targetScale.current.set(1, 1, 1)
    let targetRotation = 0

    if (!fighter.grounded) {
      const jumpStretch = Math.min(0.14, Math.abs(fighter.vy) * 0.015)
      targetScale.current.set(1 - jumpStretch * 0.32, 1 + jumpStretch * 0.72, 1 - jumpStretch * 0.32)
    }

    if (fighter.attack) {
      const spec = ATTACKS[fighter.attack.type]
      const progress = fighter.attack.elapsed / spec.duration
      const pulse = Math.sin(progress * Math.PI)
      targetPosition.current.x =
        fighter.facing * pulse * (fighter.attack.type === 'special' ? 0.38 : 0.2)

      if (fighter.attack.type === 'kick') {
        targetRotation = -fighter.facing * pulse * 0.08
      }

      if (fighter.attack.type === 'special') {
        targetRotation = -fighter.facing * pulse * 0.08
        targetScale.current.set(1 + pulse * 0.12, 1 - pulse * 0.045, 1 + pulse * 0.12)
      }
    }

    if (fighter.blocking) {
      targetRotation = -fighter.facing * 0.04
      targetPosition.current.x -= fighter.facing * 0.08
    }

    if (fighter.hitStun > 0) {
      targetRotation = fighter.facing * 0.08
      targetPosition.current.x -= fighter.facing * 0.12
      targetScale.current.set(0.93, 1.045, 0.93)
    }

    if (fighter.ko) {
      targetPosition.current.y = -0.08
      targetScale.current.set(1.06, 0.94, 1.06)
    }

    if (fighter.victorious) {
      targetPosition.current.y = 0.08 + Math.abs(idle) * 0.06
      targetRotation = idle * 0.02
      targetScale.current.setScalar(1.025)
    }

    skin.current.position.lerp(targetPosition.current, visualBlend)
    skin.current.rotation.z = THREE.MathUtils.lerp(skin.current.rotation.z, targetRotation, visualBlend)
    skin.current.scale.lerp(targetScale.current, visualBlend)
  })

  const accent = useGameStore((state) => state.fighters[id].accent)
  const specialActive = useGameStore((state) => state.fighters[id].attack?.type === 'special')
  const debugHitboxes = useGameStore((state) => state.debugHitboxes)
  return (
    <group ref={root}>
      <group ref={skin}>
        <FighterRenderer id={id} />
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
