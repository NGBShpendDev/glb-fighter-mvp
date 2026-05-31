export type PlayerId = 'p1' | 'p2'
export type MatchPhase = 'title' | 'fight' | 'paused' | 'ko'
export type AttackType = 'light' | 'heavy' | 'kick' | 'special'
export type FighterRenderMode = 'glb' | 'sprite'
export type SpriteFighterId = 'fighter-1' | 'fighter-2'

export type AttackState = {
  type: AttackType
  elapsed: number
  connected: boolean
}

export type FighterModelSettings = {
  scale: number
  rotationY: number
  verticalOffset: number
  horizontalOffset: number
}

export type ModelLoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

export type ModelDiagnostic = {
  modelUrl: string
  status: ModelLoadStatus
  message: string
  meshes?: number
  nodes?: number
  normalizedScale?: number
  sourceSize?: { x: number; y: number; z: number }
}

export type FighterStats = {
  power: number
  speed: number
  defense: number
}

export type FighterLoadout = {
  name: string
  modelUrl: string
  spriteFighterId: SpriteFighterId
  modelSettings: FighterModelSettings
  stats: FighterStats
  specialMove: string
}

export type UploadedCharacter = {
  id: string
  name: string
  modelUrl: string
  spriteFighterId?: SpriteFighterId
  scale: number
  rotation: number
  verticalOffset: number
  stats: FighterStats
  specialMove: string
}

export type FighterState = {
  id: PlayerId
  name: string
  modelUrl: string
  spriteFighterId: SpriteFighterId
  modelSettings: FighterModelSettings
  stats: FighterStats
  specialMove: string
  accent: string
  health: number
  x: number
  y: number
  vx: number
  vy: number
  facing: 1 | -1
  grounded: boolean
  blocking: boolean
  attack: AttackState | null
  cooldown: number
  dashCooldown: number
  hitStun: number
  blockStun: number
  ko: boolean
  victorious: boolean
  meter: number
}

export type HitSpark = {
  id: number
  x: number
  y: number
  age: number
  life: number
  color: string
  blocked: boolean
  kind: AttackType
  direction: 1 | -1
}

export type VfxKind = 'hitSpark' | 'blockSpark' | 'dustPuff' | 'energySlash'

export type VfxEvent = {
  id: number
  kind: VfxKind
  x: number
  y: number
  z: number
  age: number
  life: number
  direction: 1 | -1
  scale: number
}
