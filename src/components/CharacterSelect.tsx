import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Component, Suspense, useMemo, useRef, type ErrorInfo, type ReactNode } from 'react'
import * as THREE from 'three'
import type { FighterLoadout, FighterModelSettings, PlayerId } from '../game/types'
import { useGameStore } from '../store/gameStore'

const MODEL_OPTIONS = [
  { name: 'NEON STRIKER', modelUrl: '/models/fighter-1.glb' },
  { name: 'CRIMSON RIOT', modelUrl: '/models/fighter-2.glb' },
  { name: 'NEON PROTOTYPE', modelUrl: '/models/fighter-neon.glb' },
  { name: 'CRIMSON PROTOTYPE', modelUrl: '/models/fighter-crimson.glb' },
  { name: 'APE TEST SKIN', modelUrl: '/models/my-ape.glb' },
]

class PreviewErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn('Character preview failed to load.', error)
  }

  componentDidUpdate(previous: Readonly<{ resetKey: string }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    return this.state.failed ? <PreviewFallback /> : this.props.children
  }
}

const PreviewFallback = () => (
  <group>
    <mesh position={[0, 1.15, 0]}>
      <boxGeometry args={[0.8, 1.6, 0.55]} />
      <meshStandardMaterial color="#ff5267" />
    </mesh>
    <mesh position={[0, 2.25, 0]}>
      <boxGeometry args={[0.58, 0.58, 0.58]} />
      <meshStandardMaterial color="#ffe05c" />
    </mesh>
  </group>
)

const RotatingSkin = ({
  modelUrl,
  settings,
}: {
  modelUrl: string
  settings: FighterModelSettings
}) => {
  const { scene } = useGLTF(modelUrl)
  const group = useRef<THREE.Group>(null)
  const normalized = useMemo(() => {
    const skin = scene.clone(true)
    skin.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(skin)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())

    return {
      skin,
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
      scale: (size.y > 0 ? 2.8 / size.y : 1) * settings.scale,
    }
  }, [scene, settings.scale])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.72
  })

  return (
    <group ref={group}>
      <group position={[0, settings.verticalOffset, 0]} rotation={[0, settings.rotationY, 0]}>
        <group scale={normalized.scale}>
          <group position={normalized.offset}>
            <primitive object={normalized.skin} />
          </group>
        </group>
      </group>
    </group>
  )
}

const SettingSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) => (
  <label className="model-setting">
    <span>
      {label}
      <b>{value.toFixed(2)}</b>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </label>
)

const FighterPicker = ({ id }: { id: PlayerId }) => {
  const loadout = useGameStore((state) => state.loadout[id])
  const uploadedCharacters = useGameStore((state) => state.uploadedCharacters)
  const setFighterLoadout = useGameStore((state) => state.setFighterLoadout)
  const setFighterModelSetting = useGameStore((state) => state.setFighterModelSetting)
  const label = id === 'p1' ? 'FIGHTER 1' : 'FIGHTER 2'
  const modelOptions: Array<Pick<FighterLoadout, 'name' | 'modelUrl'> & Partial<FighterLoadout>> = [
    ...MODEL_OPTIONS,
    ...uploadedCharacters.map((character) => ({
      name: character.name,
      modelUrl: character.modelUrl,
      modelSettings: {
        scale: character.scale,
        rotationY: character.rotation,
        verticalOffset: character.verticalOffset,
        horizontalOffset: 0,
      },
      stats: character.stats,
      specialMove: character.specialMove,
    })),
  ]

  return (
    <article className={`fighter-picker fighter-picker--${id}`}>
      <div className="fighter-picker__topline">
        <span className="eyebrow">{label}</span>
        <strong>{loadout.name}</strong>
      </div>
      <div className="fighter-picker__preview">
        <Canvas camera={{ position: [0, 1.3, 5.6], fov: 38 }}>
          <ambientLight intensity={1.75} />
          <directionalLight position={[3, 5, 4]} intensity={3} />
          <Suspense fallback={<PreviewFallback />}>
            <PreviewErrorBoundary resetKey={loadout.modelUrl}>
              <RotatingSkin
                key={loadout.modelUrl}
                modelUrl={loadout.modelUrl}
                settings={loadout.modelSettings}
              />
            </PreviewErrorBoundary>
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
      </div>
      <label className="model-choice">
        <span>MODEL PATH</span>
        <select
          value={loadout.modelUrl}
          onChange={(event) => {
            const option = modelOptions.find((model) => model.modelUrl === event.target.value)
            if (option) setFighterLoadout(id, option)
          }}
        >
          {modelOptions.map((option) => (
            <option key={option.modelUrl} value={option.modelUrl}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <SettingSlider
        label="SCALE"
        value={loadout.modelSettings.scale}
        min={0.35}
        max={2}
        step={0.05}
        onChange={(value) => setFighterModelSetting(id, 'scale', value)}
      />
      <SettingSlider
        label="VERTICAL OFFSET"
        value={loadout.modelSettings.verticalOffset}
        min={-1.5}
        max={1.5}
        step={0.05}
        onChange={(value) => setFighterModelSetting(id, 'verticalOffset', value)}
      />
      <SettingSlider
        label="ROTATION"
        value={loadout.modelSettings.rotationY}
        min={-3.14}
        max={3.14}
        step={0.05}
        onChange={(value) => setFighterModelSetting(id, 'rotationY', value)}
      />
      <div className="fighter-stats">
        <span>POW <b>{loadout.stats.power}</b></span>
        <span>SPD <b>{loadout.stats.speed}</b></span>
        <span>DEF <b>{loadout.stats.defense}</b></span>
      </div>
      <div className="fighter-special">{loadout.specialMove}</div>
    </article>
  )
}

export const CharacterSelect = () => (
  <section className="character-select">
    <div className="character-select__heading">
      <span className="eyebrow">CHARACTER SELECT // LOCAL MODEL LAB</span>
      <h3>Choose your fighters</h3>
      <p>Rotate the previews and tune each GLB before the round starts.</p>
    </div>
    <div className="fighter-picker-grid">
      <FighterPicker id="p1" />
      <FighterPicker id="p2" />
    </div>
  </section>
)
