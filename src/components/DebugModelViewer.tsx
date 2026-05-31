import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEBUG_MODELS, DEFAULT_MODEL_SETTINGS } from '../game/models'
import type { FighterModelSettings, ModelDiagnostic } from '../game/types'
import { GlbModel } from './models/GlbModel'

const settingValue = (value: number) => value.toFixed(2)

const ViewerSetting = ({
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
  <label className="viewer-setting">
    <span>{label}</span>
    <b>{settingValue(value)}</b>
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

export const DebugModelViewer = ({ onClose }: { onClose: () => void }) => {
  const [modelUrl, setModelUrl] = useState(DEBUG_MODELS[0].modelUrl)
  const [settings, setSettings] = useState<FighterModelSettings>({ ...DEFAULT_MODEL_SETTINGS })
  const [diagnostic, setDiagnostic] = useState<ModelDiagnostic>({
    modelUrl,
    status: 'idle',
    message: 'Waiting for viewer loader.',
  })
  const updateSetting = (setting: keyof FighterModelSettings, value: number) =>
    setSettings((current) => ({ ...current, [setting]: value }))
  const currentDiagnostic =
    diagnostic.modelUrl === modelUrl
      ? diagnostic
      : { modelUrl, status: 'idle' as const, message: 'Waiting for viewer loader.' }

  return (
    <div className="overlay debug-viewer-page">
      <section className="debug-viewer-card">
        <header className="debug-viewer-card__heading">
          <div>
            <span className="eyebrow">MODEL LAB // STANDALONE GLB VIEWER</span>
            <h2>Debug Model Viewer</h2>
            <p>Preview each submitted GLB outside the match and tune the visual skin safely.</p>
          </div>
          <button className="text-button" type="button" onClick={onClose}>
            BACK TO SELECT
          </button>
        </header>
        <div className="debug-viewer-grid">
          <div className="debug-viewer-canvas">
            <Canvas shadows camera={{ position: [0, 2.2, 6.4], fov: 42 }}>
              <color attach="background" args={['#0b1020']} />
              <ambientLight intensity={1.8} />
              <directionalLight castShadow position={[3, 6, 4]} intensity={3.2} />
              <gridHelper args={[10, 10, '#425273', '#202a43']} position={[0, 0, 0]} />
              <group
                position={[settings.horizontalOffset, settings.verticalOffset, 0]}
                rotation={[0, settings.rotationY, 0]}
              >
                <GlbModel
                  key={modelUrl}
                  modelUrl={modelUrl}
                  scale={settings.scale}
                  accent="#54e8ff"
                  onStatus={setDiagnostic}
                />
              </group>
              <OrbitControls makeDefault target={[0, 1.35, 0]} />
            </Canvas>
          </div>
          <aside className="debug-viewer-panel">
            <label className="model-choice">
              <span>SUBMITTED MODEL</span>
              <select
                value={modelUrl}
                onChange={(event) => {
                  const nextUrl = event.target.value
                  setModelUrl(nextUrl)
                  setDiagnostic({
                    modelUrl: nextUrl,
                    status: 'idle',
                    message: 'Waiting for viewer loader.',
                  })
                }}
              >
                {DEBUG_MODELS.map((model) => (
                  <option key={model.modelUrl} value={model.modelUrl}>
                    {model.name} // {model.modelUrl}
                  </option>
                ))}
              </select>
            </label>
            <div className={`viewer-diagnostic viewer-diagnostic--${currentDiagnostic.status}`}>
              <strong>{currentDiagnostic.status.toUpperCase()}</strong>
              <span>{currentDiagnostic.message}</span>
            </div>
            <dl className="viewer-details">
              <div><dt>VITE URL</dt><dd>{modelUrl}</dd></div>
              <div><dt>PUBLIC FILE</dt><dd>public{modelUrl}</dd></div>
              <div><dt>MESHES</dt><dd>{currentDiagnostic.meshes ?? '--'}</dd></div>
              <div><dt>NODES</dt><dd>{currentDiagnostic.nodes ?? '--'}</dd></div>
              <div><dt>AUTO SCALE</dt><dd>{currentDiagnostic.normalizedScale?.toFixed(4) ?? '--'}</dd></div>
              <div>
                <dt>SOURCE SIZE</dt>
                <dd>
                  {currentDiagnostic.sourceSize
                    ? `${currentDiagnostic.sourceSize.x.toFixed(2)} x ${currentDiagnostic.sourceSize.y.toFixed(2)} x ${currentDiagnostic.sourceSize.z.toFixed(2)}`
                    : '--'}
                </dd>
              </div>
            </dl>
            <ViewerSetting label="SCALE" value={settings.scale} min={0.1} max={3} step={0.05} onChange={(value) => updateSetting('scale', value)} />
            <ViewerSetting label="ROTATION Y" value={settings.rotationY} min={-3.14} max={3.14} step={0.05} onChange={(value) => updateSetting('rotationY', value)} />
            <ViewerSetting label="VERTICAL OFFSET" value={settings.verticalOffset} min={-2.5} max={2.5} step={0.05} onChange={(value) => updateSetting('verticalOffset', value)} />
            <ViewerSetting label="HORIZONTAL OFFSET" value={settings.horizontalOffset} min={-2.5} max={2.5} step={0.05} onChange={(value) => updateSetting('horizontalOffset', value)} />
            <div className="debug-viewer-actions">
              <button className="secondary-button" type="button" onClick={() => setSettings({ ...DEFAULT_MODEL_SETTINGS })}>
                RESET TUNING
              </button>
              <a className="secondary-button" href={modelUrl} target="_blank" rel="noreferrer">
                OPEN RAW GLB
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
