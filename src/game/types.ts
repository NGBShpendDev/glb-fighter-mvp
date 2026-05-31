export type PlayerId = 'p1' | 'p2'
export type MatchPhase = 'title' | 'fight' | 'ko'
export type AttackType = 'light' | 'heavy' | 'kick' | 'special'

export type AttackState = { type: AttackType; elapsed: number; connected: boolean }
export type FighterState = {
  id: PlayerId; name: string; modelUrl: string; accent: string; health: number; x: number; y: number; vx: number; vy: number
  facing: 1 | -1; grounded: boolean; blocking: boolean; attack: AttackState | null; cooldown: number; dashCooldown: number
  hitStun: number; blockStun: number; ko: boolean; victorious: boolean
}
export type HitSpark = { id: number; x: number; y: number; age: number; life: number; color: string; blocked: boolean }
