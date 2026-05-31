import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Component, Suspense, useMemo, useRef, type ErrorInfo, type ReactNode } from 'react'
import * as THREE from 'three'
import { ATTACKS } from '../game/constants'
import { getAttackHitbox, getHurtbox } from '../game/hitboxes'
import type { FighterModelSettings, PlayerId } from '../game/types'
import { useGameStore } from '../store/gameStore'

const TARGET_SKIN_HEIGHT = 2.75

class SkinErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn('Fighter skin failed to load. Using fallback mesh.', error)
  }

  componentDidUpdate(previous: Readonly<{ resetKey: string }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const Skin = ({
  modelUrl,
  settings,
}: {
  modelUrl: string
  settings: FighterModelSettings
}) => {
  const { scene } = useGLTF(modelUrl)
  const normalized = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    clone.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const scale = (size.y > 0 ? TARGET_SKIN_HEIGHT / size.y : 1) * settings.scale

    return {
      clone,
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
      scale,
    }
  }, [scene, settings.scale])

  return (
    <group scale={normalized.scale}>
      <group position={normalized.offset}>
        <primitive object={normalized.clone} />
      </group>
    </group>
  )
}

const FallbackSkin = ({ accent }: { accent: string }) => (
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
    root.current.rotation.set(0, settings.rotationY + (fighter.facing === 1 ? 0 : Math.PI), 0)
    skin.current.position.set(settings.horizontalOffset, settings.verticalOffset + idle * 0.035, 0)
    skin.current.rotation.set(0, 0, 0)
    skin.current.scale.setScalar(1)

    if (!fighter.grounded) {
      const jumpStretch = Math.min(0.14, Math.abs(fighter.vy) * 0.015)
      skin.current.scale.set(1 - jumpStretch * 0.45, 1 + jumpStretch, 1 - jumpStretch * 0.45)
    }

    if (fighter.attack) {
      const spec = ATTACKS[fighter.attack.type]
      const progress = fighter.attack.elapsed / spec.duration
      const pulse = Math.sin(progress * Math.PI)
      skin.current.position.x = settings.horizontalOffset + pulse * (fighter.attack.type === 'special' ? 0.64 : 0.36)

      if (fighter.attack.type === 'kick') {
        skin.current.rotation.z = -pulse * 0.72
        skin.current.rotation.y = pulse * Math.PI * 1.65
      }

      if (fighter.attack.type === 'special') {
        skin.current.rotation.z = -pulse * 0.18
        skin.current.scale.set(1 + pulse * 0.22, 1 - pulse * 0.08, 1 + pulse * 0.22)
      }
    }

    if (fighter.blocking) {
      skin.current.rotation.z = -0.1
      skin.current.position.x -= 0.12
    }

    if (fighter.hitStun > 0) {
      skin.current.rotation.z = 0.22
      skin.current.position.x -= 0.15
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

  const fighter = useGameStore((state) => state.fighters[id])

  return (
    <group ref={root}>
      <group ref={skin}>
        <SkinErrorBoundary
          fallback={<FallbackSkin accent={fighter.accent} />}
          resetKey={fighter.modelUrl}
        >
          <Suspense fallback={<FallbackSkin accent={fighter.accent} />}>
            <Skin modelUrl={fighter.modelUrl} settings={fighter.modelSettings} />
          </Suspense>
        </SkinErrorBoundary>
      </group>
      {fighter.attack?.type === 'special' && (
        <group position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <pointLight color={fighter.accent} intensity={3.4} distance={4} />
          <mesh>
            <torusGeometry args={[0.88, 0.045, 8, 30]} />
            <meshBasicMaterial color={fighter.accent} transparent opacity={0.72} />
          </mesh>
          <mesh scale={1.35}>
            <torusGeometry args={[0.88, 0.025, 8, 30]} />
            <meshBasicMaterial color="#ffe47a" transparent opacity={0.48} />
          </mesh>
        </group>
      )}
      <DebugBoxes id={id} />
    </group>
  )
}

useGLTF.preload('/models/fighter-1.glb')
useGLTF.preload('/models/fighter-2.glb')
