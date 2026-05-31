import { upload } from '@vercel/blob/client'
import { useState, type FormEvent } from 'react'
import type { PlayerId, UploadedCharacter } from '../game/types'
import { useGameStore } from '../store/gameStore'

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

const safeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const ModelSetting = ({
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
  <label className="upload-setting">
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

export const UploadCharacterPage = ({ onClose }: { onClose: () => void }) => {
  const addUploadedCharacter = useGameStore((state) => state.addUploadedCharacter)
  const useUploadedCharacter = useGameStore((state) => state.useUploadedCharacter)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(Math.PI / 2)
  const [verticalOffset, setVerticalOffset] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [uploadedCharacter, setUploadedCharacter] = useState<UploadedCharacter | null>(null)
  const [uploading, setUploading] = useState(false)

  const selectFile = (nextFile?: File) => {
    setError('')
    setUploadedCharacter(null)

    if (!nextFile) {
      setFile(null)
      return
    }

    if (!nextFile.name.toLowerCase().endsWith('.glb')) {
      setFile(null)
      setError('Choose a .glb model file.')
      return
    }

    if (nextFile.size > MAX_UPLOAD_BYTES) {
      setFile(null)
      setError(`GLB files must be ${formatFileSize(MAX_UPLOAD_BYTES)} or smaller.`)
      return
    }

    setFile(nextFile)
    if (!name) setName(nextFile.name.replace(/\.glb$/i, ''))
  }

  const assignCharacter = (id: PlayerId) => {
    if (!uploadedCharacter) return
    useUploadedCharacter(id, uploadedCharacter)
    onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setError('Choose a .glb model file.')
      return
    }
    if (!name.trim()) {
      setError('Give this character a name.')
      return
    }

    setUploading(true)
    setUploadedCharacter(null)
    setProgress(0)
    setError('')

    try {
      const blob = await upload(`fighters/${safeFileName(file.name)}`, file, {
        access: 'public',
        contentType: file.type || 'model/gltf-binary',
        handleUploadUrl: '/api/upload',
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      })
      const character: UploadedCharacter = {
        id: crypto.randomUUID(),
        name: name.trim().toUpperCase(),
        modelUrl: blob.url,
        scale,
        rotation,
        verticalOffset,
        stats: { power: 70, speed: 70, defense: 70 },
        specialMove: 'BLOB BREAKER',
      }
      addUploadedCharacter(character)
      setUploadedCharacter(character)
      setProgress(100)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Upload failed. Confirm the Vercel Blob store is connected and try again.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="overlay upload-page">
      <section className="upload-card">
        <div className="upload-card__heading">
          <div>
            <span className="eyebrow">MODEL LAB // VERCEL BLOB</span>
            <h2>Upload Character</h2>
            <p>Store a public GLB skin, tune its defaults, then send it into the arena.</p>
          </div>
          <button className="text-button" type="button" onClick={onClose}>
            BACK TO SELECT
          </button>
        </div>
        <form className="upload-form" onSubmit={submit}>
          <label className="upload-field">
            <span>CHARACTER NAME</span>
            <input
              type="text"
              maxLength={32}
              placeholder="Night Market Challenger"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="upload-dropzone">
            <input
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <strong>{file ? file.name : 'CHOOSE GLB FILE'}</strong>
            <span>{file ? formatFileSize(file.size) : 'GLB only // maximum 50 MB'}</span>
          </label>
          <div className="upload-settings">
            <ModelSetting label="SCALE" value={scale} min={0.35} max={2} step={0.05} onChange={setScale} />
            <ModelSetting
              label="VERTICAL OFFSET"
              value={verticalOffset}
              min={-1.5}
              max={1.5}
              step={0.05}
              onChange={setVerticalOffset}
            />
            <ModelSetting
              label="ROTATION"
              value={rotation}
              min={-3.14}
              max={3.14}
              step={0.05}
              onChange={setRotation}
            />
          </div>
          <div className="upload-progress">
            <span>UPLOAD PROGRESS</span>
            <b>{Math.round(progress)}%</b>
            <progress value={progress} max={100} />
          </div>
          {error && <p className="upload-message upload-message--error">{error}</p>}
          {uploadedCharacter && (
            <p className="upload-message upload-message--success">
              Stored successfully. This model is now available in Character Select.
            </p>
          )}
          <div className="upload-actions">
            <button className="primary-button" type="submit" disabled={uploading}>
              {uploading ? 'UPLOADING...' : 'UPLOAD GLB'}
            </button>
            {uploadedCharacter && (
              <>
                <button className="secondary-button" type="button" onClick={() => assignCharacter('p1')}>
                  USE FOR FIGHTER 1
                </button>
                <button className="secondary-button" type="button" onClick={() => assignCharacter('p2')}>
                  USE FOR FIGHTER 2
                </button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
