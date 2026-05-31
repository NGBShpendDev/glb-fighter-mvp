export type PlayerId = 'p1' | 'p2'
export type MatchPhase = 'title' | 'fight' | 'paused' | 'ko'
export type AttackType = 'light' | 'heavy' | 'kick' | 'special'
export type SpriteFighterId = 'fighter-1' | 'fighter-2'
export type P2ControlMode = 'ai-easy' | 'ai-medium' | 'ai-hard' | 'player'

export type AttackState = {
  type: AttackType
  elapsed: number
  connected: boolean
}

export type AssetLoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

export type SpriteAssetDiagnostic = {
  animation: string
  filePath: string
  status: AssetLoadStatus
  message: string
}

export type FighterStats = {
  power: number
  speed: number
  defense: number
}

export type FighterLoadout = {
  name: string
  spriteFighterId: SpriteFighterId
  stats: FighterStats
  specialMove: string
}

export type FighterState = {
  id: PlayerId
  name: string
  spriteFighterId: SpriteFighterId
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

export type FighterInput = {
  moveLeft: boolean
  moveRight: boolean
  jump: boolean
  block: boolean
  dash: boolean
  lightPunch: boolean
  heavyPunch: boolean
  kick: boolean
  special: boolean
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
