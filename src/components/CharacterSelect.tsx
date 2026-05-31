import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { BUNDLED_MODELS, DEFAULT_MODEL_SETTINGS } from '../game/models'
import type { FighterLoadout, FighterModelSettings, ModelDiagnostic, PlayerId } from '../game/types'
import { useGameStore } from '../store/gameStore'
import { GlbModel } from './models/GlbModel'
import { UiAtlasSprite } from './UiAtlasSprite'

const RotatingSkin = ({
  modelUrl,
  settings,
  onStatus,
}: {
  modelUrl: string
  settings: FighterModelSettings
  onStatus: (diagnostic: ModelDiagnostic) => void
}) => {
  const group = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.72
  })

  return (
    <group ref={group}>
      <group position={[settings.horizontalOffset, settings.verticalOffset, 0]} rotation={[0, settings.rotationY, 0]}>
        <GlbModel modelUrl={modelUrl} scale={settings.scale} onStatus={onStatus} />
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
  const [diagnostic, setDiagnostic] = useState<ModelDiagnostic>({
    modelUrl: loadout.modelUrl,
    status: 'idle',
    message: 'Waiting for preview loader.',
  })
  const resetTuning = () =>
    setFighterLoadout(id, {
      modelSettings: { ...DEFAULT_MODEL_SETTINGS },
    })
  const label = id === 'p1' ? 'FIGHTER 1' : 'FIGHTER 2'
  const modelOptions: Array<Pick<FighterLoadout, 'name' | 'modelUrl'> & Partial<FighterLoadout>> = [
    ...BUNDLED_MODELS,
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
      <UiAtlasSprite region="portrait" />
      <div className="fighter-picker__topline">
        <span className="eyebrow">{label}</span>
        <strong>{loadout.name}</strong>
      </div>
      <div className="fighter-picker__preview">
        <Canvas camera={{ position: [0, 1.3, 5.6], fov: 38 }}>
          <ambientLight intensity={1.75} />
          <directionalLight position={[3, 5, 4]} intensity={3} />
          <RotatingSkin
            key={loadout.modelUrl}
            modelUrl={loadout.modelUrl}
            settings={loadout.modelSettings}
            onStatus={setDiagnostic}
          />
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
      </div>
      <div className={`model-load-status model-load-status--${diagnostic.modelUrl === loadout.modelUrl ? diagnostic.status : 'idle'}`}>
        {diagnostic.modelUrl === loadout.modelUrl ? diagnostic.message : 'Waiting for preview loader.'}
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
        label="HORIZONTAL OFFSET"
        value={loadout.modelSettings.horizontalOffset}
        min={-1.5}
        max={1.5}
        step={0.05}
        onChange={(value) => setFighterModelSetting(id, 'horizontalOffset', value)}
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
      <div className="model-tuning-note">
        <span>{loadout.modelUrl}</span>
        <button className="mini-button" type="button" onClick={resetTuning}>
          RESET TUNING
        </button>
      </div>
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
