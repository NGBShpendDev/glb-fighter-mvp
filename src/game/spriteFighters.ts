import type { FighterState, SpriteFighterId } from './types'

export type SpriteAnimationName =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'block'
  | 'lightPunch'
  | 'kick'
  | 'hit'
  | 'ko'
  | 'victory'

export type SpriteAnimationConfig = {
  filePath: string
  frameCount: number
  fps: number
  loop: boolean
}

export type SpriteFighterConfig = {
  id: SpriteFighterId
  name: string
  scale: number
  horizontalOffset: number
  verticalOffset: number
  anchorPath?: string
  frameWidth?: number
  frameHeight?: number
  animations: Record<SpriteAnimationName, SpriteAnimationConfig>
}

const animation = (
  fighterFolder: string,
  name: SpriteAnimationName,
  frameCount: number,
  fps: number,
  loop: boolean,
  fileName: string = name,
): SpriteAnimationConfig => ({
  filePath: `/assets/fighters/${fighterFolder}/${fileName}.png`,
  frameCount,
  fps,
  loop,
})

const fighter1: SpriteFighterConfig = {
  id: 'fighter-1',
  name: 'SAFARI STRIKER',
  scale: 3.05,
  horizontalOffset: 0,
  verticalOffset: 0,
  anchorPath: '/assets/fighters/fighter-1/anchor.png',
  animations: {
    idle: animation('fighter-1', 'idle', 4, 7, true),
    walk: animation('fighter-1', 'walk', 6, 10, true),
    jump: animation('fighter-1', 'jump', 4, 9, false),
    block: animation('fighter-1', 'block', 3, 7, true),
    lightPunch: animation('fighter-1', 'lightPunch', 5, 14, false, 'light-punch'),
    kick: animation('fighter-1', 'kick', 5, 13, false),
    hit: animation('fighter-1', 'hit', 3, 11, false),
    ko: animation('fighter-1', 'ko', 5, 7, false),
    victory: animation('fighter-1', 'victory', 4, 7, true),
  },
}

const makePlaceholderFighter = (
  id: SpriteFighterId,
  name: string,
  fighterFolder: string,
): SpriteFighterConfig => ({
  id,
  name,
  scale: 2.8,
  horizontalOffset: 0,
  verticalOffset: 0,
  frameWidth: 512,
  frameHeight: 512,
  animations: {
    idle: animation(fighterFolder, 'idle', 6, 8, true),
    walk: animation(fighterFolder, 'walk', 8, 11, true),
    jump: animation(fighterFolder, 'jump', 4, 9, false),
    block: animation(fighterFolder, 'block', 2, 6, true),
    lightPunch: animation(fighterFolder, 'lightPunch', 5, 14, false),
    kick: animation(fighterFolder, 'kick', 6, 14, false),
    hit: animation(fighterFolder, 'hit', 3, 12, false),
    ko: animation(fighterFolder, 'ko', 6, 8, false),
    victory: animation(fighterFolder, 'victory', 6, 8, true),
  },
})

export const SPRITE_FIGHTERS: Record<SpriteFighterId, SpriteFighterConfig> = {
  'fighter-1': fighter1,
  'fighter-2': makePlaceholderFighter('fighter-2', 'CRIMSON RIOT PLACEHOLDER', 'fighter-2'),
}

export const SPRITE_FIGHTER_OPTIONS = Object.values(SPRITE_FIGHTERS)

export const getFighterVisualState = (fighter: FighterState) => {
  if (fighter.ko) return 'knocked out'
  if (fighter.victorious) return 'victory'
  if (fighter.hitStun > 0) return 'hit stun'
  if (fighter.blockStun > 0) return 'block stun'
  if (fighter.blocking) return 'blocking'
  if (!fighter.grounded) return 'jumping'
  if (fighter.attack) return `attacking: ${fighter.attack.type}`
  if (Math.abs(fighter.vx) > 0.35) return 'walking'
  return 'idle'
}

export const getSpriteAnimation = (fighter: FighterState): SpriteAnimationName => {
  if (fighter.ko) return 'ko'
  if (fighter.victorious) return 'victory'
  if (fighter.hitStun > 0) return 'hit'
  if (fighter.blocking || fighter.blockStun > 0) return 'block'
  if (!fighter.grounded) return 'jump'
  if (fighter.attack?.type === 'kick' || fighter.attack?.type === 'special') return 'kick'
  if (fighter.attack) return 'lightPunch'
  if (Math.abs(fighter.vx) > 0.35) return 'walk'
  return 'idle'
}
