import type { FighterState, SpriteFighterId } from './types'

export type SpriteAnimationName =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'block'
  | 'lightPunch'
  | 'heavyPunch'
  | 'kick'
  | 'special'
  | 'hit'
  | 'ko'
  | 'victory'

export type SpriteAnimationConfig = {
  filePath: string
  frameCount: number
  fps: number
  loop: boolean
  fallbackAnimation?: SpriteAnimationName
  scale?: number
  horizontalOffset?: number
  verticalOffset?: number
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
  tuning: Pick<SpriteAnimationConfig, 'scale' | 'horizontalOffset' | 'verticalOffset'> = {},
): SpriteAnimationConfig => ({
  filePath: `/assets/fighters/${fighterFolder}/${fileName}.png`,
  frameCount,
  fps,
  loop,
  ...tuning,
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
    jump: animation('fighter-1', 'jump', 4, 9, false, 'jump', { verticalOffset: -0.03 }),
    block: animation('fighter-1', 'block', 3, 7, true, 'block', { scale: 0.98 }),
    lightPunch: animation('fighter-1', 'lightPunch', 5, 14, false, 'light-punch', {
      scale: 0.98,
      horizontalOffset: 0.05,
    }),
    heavyPunch: {
      ...animation('fighter-1', 'heavyPunch', 5, 12, false, 'heavy-punch'),
      fallbackAnimation: 'lightPunch',
    },
    kick: {
      ...animation('fighter-1', 'kick', 5, 13, false),
      fallbackAnimation: 'lightPunch',
    },
    special: {
      ...animation('fighter-1', 'special', 5, 10, false),
      fallbackAnimation: 'kick',
    },
    hit: animation('fighter-1', 'hit', 3, 11, false, 'hit', { verticalOffset: -0.02 }),
    ko: animation('fighter-1', 'ko', 5, 7, false, 'ko', { scale: 1.04, verticalOffset: -0.04 }),
    victory: animation('fighter-1', 'victory', 4, 7, true, 'victory', { scale: 1.02 }),
  },
}

const fighter2: SpriteFighterConfig = {
  id: 'fighter-2',
  name: 'CRIMSON RIOT',
  scale: 3.05,
  horizontalOffset: 0,
  verticalOffset: 0,
  anchorPath: '/assets/fighters/fighter-2/anchor.png',
  animations: {
    idle: animation('fighter-2', 'idle', 4, 7, true),
    walk: animation('fighter-2', 'walk', 6, 10, true),
    jump: animation('fighter-2', 'jump', 4, 9, false, 'jump', { verticalOffset: -0.03 }),
    block: animation('fighter-2', 'block', 3, 7, true, 'block', { scale: 0.98 }),
    lightPunch: animation('fighter-2', 'lightPunch', 5, 14, false, 'light-punch', {
      scale: 0.98,
      horizontalOffset: 0.05,
    }),
    heavyPunch: {
      ...animation('fighter-2', 'heavyPunch', 5, 12, false, 'heavy-punch'),
      fallbackAnimation: 'lightPunch',
    },
    kick: animation('fighter-2', 'kick', 5, 13, false),
    special: {
      ...animation('fighter-2', 'special', 5, 10, false),
      fallbackAnimation: 'kick',
    },
    hit: animation('fighter-2', 'hit', 3, 11, false, 'hit', { verticalOffset: -0.02 }),
    ko: animation('fighter-2', 'ko', 5, 7, false, 'ko', { scale: 1.04, verticalOffset: -0.04 }),
    victory: animation('fighter-2', 'victory', 4, 7, true, 'victory', { scale: 1.02 }),
  },
}

export const SPRITE_FIGHTERS: Record<SpriteFighterId, SpriteFighterConfig> = {
  'fighter-1': fighter1,
  'fighter-2': fighter2,
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
  if (fighter.attack?.type === 'special') return 'special'
  if (fighter.attack?.type === 'kick') return 'kick'
  if (fighter.attack?.type === 'heavy') return 'heavyPunch'
  if (fighter.attack) return 'lightPunch'
  if (Math.abs(fighter.vx) > 0.35) return 'walk'
  return 'idle'
}
