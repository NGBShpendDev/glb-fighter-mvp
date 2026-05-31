import type { FighterModelSettings } from './types'

export const DEFAULT_MODEL_SETTINGS: FighterModelSettings = {
  scale: 1,
  rotationY: Math.PI / 2,
  verticalOffset: 0,
  horizontalOffset: 0,
}

export const BUNDLED_MODELS = [
  { name: 'NEON STRIKER', modelUrl: '/models/fighter-1.glb' },
  { name: 'CRIMSON RIOT', modelUrl: '/models/fighter-2.glb' },
  { name: 'NEON PROTOTYPE', modelUrl: '/models/fighter-neon.glb' },
  { name: 'CRIMSON PROTOTYPE', modelUrl: '/models/fighter-crimson.glb' },
  { name: 'APE TEST SKIN', modelUrl: '/models/my-ape.glb' },
]

export const DEBUG_MODELS = BUNDLED_MODELS.slice(0, 2)
