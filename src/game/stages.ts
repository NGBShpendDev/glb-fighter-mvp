export type StageParallaxLayer = {
  id: string
  imagePath: string
  width: number
  height: number
  x?: number
  y?: number
  z: number
  opacity?: number
  followFactor: number
}

export type StagePointLight = {
  color: string
  intensity: number
  distance: number
  position: [number, number, number]
}

export type StageLighting = {
  backgroundColor: string
  fogColor: string
  fogNear: number
  fogFar: number
  ambientColor: string
  ambientIntensity: number
  directionalColor: string
  directionalIntensity: number
  directionalPosition: [number, number, number]
  pointLights: StagePointLight[]
}

export type StageAmbientParticles = {
  enabled: boolean
  count: number
  color: string
  opacity: number
  speed: number
}

export type StageConfig = {
  id: string
  name: string
  artEnabled: boolean
  backgroundImage?: string
  backgroundFollowFactor?: number
  parallaxLayers: StageParallaxLayer[]
  foregroundOverlay?: string
  foregroundOpacity?: number
  foregroundFollowFactor?: number
  floorTexture?: string
  floorTextureRepeat?: [number, number]
  floorOpacity?: number
  lighting: StageLighting
  ambientParticles: StageAmbientParticles
  musicPath?: string
  previewThumbnail?: string
}

const streetAlleyAsset = (fileName: string) => `/assets/stages/street-alley/${fileName}`

const nightMarketLighting: StageLighting = {
  backgroundColor: '#080a15',
  fogColor: '#080a15',
  fogNear: 12,
  fogFar: 28,
  ambientColor: '#6570a2',
  ambientIntensity: 0.85,
  directionalColor: '#ffe6c6',
  directionalIntensity: 2.4,
  directionalPosition: [4, 10, 8],
  pointLights: [
    { position: [-6, 4, 3], color: '#ff2d68', intensity: 7, distance: 11 },
    { position: [6, 3, 3], color: '#13bfff', intensity: 6, distance: 11 },
    { position: [0, 2.8, -1], color: '#fbd850', intensity: 3.4, distance: 8 },
  ],
}

export const FALLBACK_STAGE_ID = 'procedural-night-market'
export const ACTIVE_STAGE_ID = 'street-alley'

export const STAGES: Record<string, StageConfig> = {
  [FALLBACK_STAGE_ID]: {
    id: FALLBACK_STAGE_ID,
    name: 'Procedural Night Market',
    artEnabled: false,
    parallaxLayers: [],
    lighting: nightMarketLighting,
    ambientParticles: {
      enabled: false,
      count: 0,
      color: '#ffffff',
      opacity: 0,
      speed: 0,
    },
  },
  'street-alley': {
    id: 'street-alley',
    name: 'Neon Street Alley',
    artEnabled: true,
    backgroundImage: streetAlleyAsset('bg-far.png'),
    backgroundFollowFactor: 0.06,
    parallaxLayers: [
      {
        id: 'alley-mid',
        imagePath: streetAlleyAsset('bg-mid.png'),
        width: 24,
        height: 13.5,
        y: 4.9,
        z: -5.6,
        opacity: 0.9,
        followFactor: 0.16,
      },
    ],
    foregroundOverlay: streetAlleyAsset('fg-overlay.png'),
    // The submitted overlay is opaque, so keep it subtle over the fighters.
    foregroundOpacity: 0.12,
    foregroundFollowFactor: 0.26,
    floorTexture: streetAlleyAsset('floor.png'),
    floorTextureRepeat: [1, 1],
    floorOpacity: 0.72,
    lighting: nightMarketLighting,
    ambientParticles: {
      enabled: false,
      count: 42,
      color: '#fbd850',
      opacity: 0.42,
      speed: 0.22,
    },
    previewThumbnail: streetAlleyAsset('thumbnail.png'),
  },
}

export const STAGE_OPTIONS = Object.values(STAGES)

export const getStage = (stageId = ACTIVE_STAGE_ID) =>
  STAGES[stageId] ?? STAGES[FALLBACK_STAGE_ID]

export const getActiveStageMusic = (stageId = ACTIVE_STAGE_ID) => {
  const stage = getStage(stageId)
  return stage.artEnabled ? stage.musicPath : undefined
}
