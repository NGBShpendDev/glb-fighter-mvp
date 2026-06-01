import type { FighterState, SpriteFighterId } from './types'
import {
  SPRITE_ANIMATION_PRIORITY,
  type SpriteAnimationConfig,
  type SpriteAnimationName,
  type SpriteAttackPhases,
} from './spriteAnimator'

export type { SpriteAnimationConfig, SpriteAnimationName } from './spriteAnimator'
export { SpriteAnimator, hasSpriteFrameEvent } from './spriteAnimator'

export const REQUIRED_SPRITE_ANIMATIONS = [
  'idle',
  'walk',
  'jump',
  'block',
  'lightPunch',
  'kick',
  'hit',
  'ko',
  'victory',
] as const satisfies readonly SpriteAnimationName[]

export const OPTIONAL_SPRITE_ANIMATIONS = [
  'dash',
  'heavyPunch',
  'special',
  'knockdown',
] as const satisfies readonly SpriteAnimationName[]

export const SPRITE_ANIMATION_NAMES = [
  ...REQUIRED_SPRITE_ANIMATIONS,
  ...OPTIONAL_SPRITE_ANIMATIONS,
] as const satisfies readonly SpriteAnimationName[]

export type RequiredSpriteAnimationName = (typeof REQUIRED_SPRITE_ANIMATIONS)[number]
export type OptionalSpriteAnimationName = (typeof OPTIONAL_SPRITE_ANIMATIONS)[number]

export type SpriteAnimationCatalog =
  Record<RequiredSpriteAnimationName, SpriteAnimationConfig> &
  Partial<Record<OptionalSpriteAnimationName, SpriteAnimationConfig>>

export const SPRITE_OPTIONAL_FALLBACKS: Record<OptionalSpriteAnimationName, RequiredSpriteAnimationName> = {
  dash: 'walk',
  heavyPunch: 'lightPunch',
  special: 'kick',
  knockdown: 'ko',
}

export const SPRITE_PRODUCTION_SPEC = {
  frameWidth: 512,
  frameHeight: 512,
  transparentBackground: true,
  layout: 'single-horizontal-row',
  filenames: {
    anchor: 'anchor.png',
    portrait: 'portrait.png',
    idle: 'idle.png',
    walk: 'walk.png',
    dash: 'dash.png',
    jump: 'jump.png',
    block: 'block.png',
    lightPunch: 'light-punch.png',
    heavyPunch: 'heavy-punch.png',
    kick: 'kick.png',
    special: 'special.png',
    hit: 'hit.png',
    knockdown: 'knockdown.png',
    ko: 'ko.png',
    victory: 'victory.png',
  },
  recommendedFrameCounts: {
    idle: 8,
    walk: 8,
    dash: 5,
    jump: 6,
    block: 4,
    lightPunch: 6,
    heavyPunch: 7,
    kick: 7,
    special: 8,
    hit: 4,
    knockdown: 6,
    ko: 6,
    victory: 6,
  },
} as const

export type SpriteFighterConfig = {
  id: SpriteFighterId
  name: string
  sourceFacing: 1 | -1
  scale: number
  horizontalOffset: number
  verticalOffset: number
  anchorPath?: string
  portraitPath?: string
  frameWidth?: number
  frameHeight?: number
  originX: number
  originY: number
  animations: SpriteAnimationCatalog
}

const animation = (
  fighterFolder: string,
  name: SpriteAnimationName,
  frameCount: number,
  fps: number,
  loop: boolean,
  fileName: string = name,
  tuning: Partial<
    Pick<
      SpriteAnimationConfig,
      | 'scale'
      | 'offsetX'
      | 'offsetY'
      | 'originX'
      | 'originY'
      | 'hitFrames'
      | 'attackPhases'
      | 'soundEventFrame'
      | 'fallbackAnimation'
      | 'cancelWindows'
    >
  > = {},
): SpriteAnimationConfig => {
  const priority =
    name === 'ko'
      ? SPRITE_ANIMATION_PRIORITY.ko
      : name === 'victory'
        ? SPRITE_ANIMATION_PRIORITY.victory
        : name === 'hit'
          ? SPRITE_ANIMATION_PRIORITY.hit
          : name === 'knockdown'
            ? SPRITE_ANIMATION_PRIORITY.knockdown
          : ['lightPunch', 'heavyPunch', 'kick', 'special'].includes(name)
            ? SPRITE_ANIMATION_PRIORITY.attack
            : name === 'block'
              ? SPRITE_ANIMATION_PRIORITY.block
              : name === 'jump'
                ? SPRITE_ANIMATION_PRIORITY.jump
                : name === 'dash'
                  ? SPRITE_ANIMATION_PRIORITY.dash
                : name === 'walk'
                  ? SPRITE_ANIMATION_PRIORITY.walk
                  : SPRITE_ANIMATION_PRIORITY.idle
  const hitFrames = tuning.hitFrames ?? []
  const soundEventFrame = tuning.soundEventFrame
  return {
    file: `/assets/fighters/${fighterFolder}/${fileName}.png`,
    frameCount,
    fps,
    loop,
    holdLastFrame: !loop,
    restartOnEnter: true,
    priority,
    cancelWindows: tuning.cancelWindows ?? [],
    frameEvents: [
      ...hitFrames.map((frame) => ({ frame, type: 'hitbox-active' as const })),
      ...(soundEventFrame === undefined ? [] : [{ frame: soundEventFrame, type: 'attack-sound' as const }]),
    ],
    ...tuning,
  }
}

const attackPhases = (
  startupFrames: number[],
  activeFrames: number[],
  recoveryFrames: number[],
): SpriteAttackPhases => ({ startupFrames, activeFrames, recoveryFrames })

const fighter1: SpriteFighterConfig = {
  id: 'fighter-1',
  name: 'CHEETAH CHIEF',
  sourceFacing: 1,
  scale: 3.05,
  horizontalOffset: 0,
  verticalOffset: 0,
  originX: 0.5,
  originY: 0,
  anchorPath: '/assets/fighters/fighter-1/anchor.png',
  portraitPath: '/assets/fighters/fighter-1/portrait.png',
  animations: {
    idle: animation('fighter-1', 'idle', 4, 7, true),
    walk: animation('fighter-1', 'walk', 6, 10, true),
    dash: animation('fighter-1', 'dash', 5, 16, false, 'dash', {
      fallbackAnimation: 'walk',
    }),
    jump: animation('fighter-1', 'jump', 4, 9, false, 'jump', { offsetY: -0.03 }),
    block: animation('fighter-1', 'block', 3, 7, true, 'block', { scale: 0.98 }),
    lightPunch: animation('fighter-1', 'lightPunch', 6, 15, false, 'light-punch', {
      scale: 0.98,
      offsetX: 0.05,
      hitFrames: [2, 3],
      attackPhases: attackPhases([0, 1], [2, 3], [4, 5]),
      soundEventFrame: 2,
      cancelWindows: [{ fromFrame: 4, toFrame: 5, into: ['heavyPunch', 'kick', 'special'] }],
    }),
    heavyPunch: {
      ...animation('fighter-1', 'heavyPunch', 7, 12, false, 'heavy-punch', {
        hitFrames: [3, 4],
        attackPhases: attackPhases([0, 1, 2], [3, 4], [5, 6]),
        soundEventFrame: 3,
        fallbackAnimation: 'lightPunch',
        cancelWindows: [{ fromFrame: 6, toFrame: 6, into: ['special'] }],
      }),
    },
    kick: {
      ...animation('fighter-1', 'kick', 7, 13, false, 'kick', {
        hitFrames: [3, 4],
        attackPhases: attackPhases([0, 1, 2], [3, 4], [5, 6]),
        soundEventFrame: 3,
        fallbackAnimation: 'lightPunch',
        cancelWindows: [{ fromFrame: 6, toFrame: 6, into: ['special'] }],
      }),
    },
    special: {
      ...animation('fighter-1', 'special', 8, 11, false, 'special', {
        hitFrames: [4, 5],
        attackPhases: attackPhases([0, 1, 2, 3], [4, 5], [6, 7]),
        soundEventFrame: 4,
        fallbackAnimation: 'kick',
      }),
    },
    hit: animation('fighter-1', 'hit', 3, 11, false, 'hit', { offsetY: -0.02 }),
    knockdown: animation('fighter-1', 'knockdown', 6, 9, false, 'knockdown', {
      fallbackAnimation: 'ko',
    }),
    ko: animation('fighter-1', 'ko', 6, 7, false, 'ko', { scale: 1.04, offsetY: -0.04 }),
    victory: animation('fighter-1', 'victory', 4, 7, true, 'victory', { scale: 1.02 }),
  },
}

const fighter2: SpriteFighterConfig = {
  id: 'fighter-2',
  name: 'PARTY BOT',
  sourceFacing: 1,
  scale: 3.05,
  horizontalOffset: 0,
  verticalOffset: 0,
  originX: 0.5,
  originY: 0,
  anchorPath: '/assets/fighters/fighter-2/anchor.png',
  portraitPath: '/assets/fighters/fighter-2/portrait.png',
  animations: {
    idle: animation('fighter-2', 'idle', 4, 7, true),
    walk: animation('fighter-2', 'walk', 6, 10, true),
    dash: animation('fighter-2', 'dash', 5, 16, false, 'dash', {
      fallbackAnimation: 'walk',
    }),
    jump: animation('fighter-2', 'jump', 4, 9, false, 'jump', { offsetY: -0.03 }),
    block: animation('fighter-2', 'block', 3, 7, true, 'block', { scale: 0.98 }),
    lightPunch: animation('fighter-2', 'lightPunch', 6, 15, false, 'light-punch', {
      scale: 0.98,
      offsetX: 0.05,
      hitFrames: [2, 3],
      attackPhases: attackPhases([0, 1], [2, 3], [4, 5]),
      soundEventFrame: 2,
      cancelWindows: [{ fromFrame: 4, toFrame: 5, into: ['heavyPunch', 'kick', 'special'] }],
    }),
    heavyPunch: {
      ...animation('fighter-2', 'heavyPunch', 7, 12, false, 'heavy-punch', {
        hitFrames: [3, 4],
        attackPhases: attackPhases([0, 1, 2], [3, 4], [5, 6]),
        soundEventFrame: 3,
        fallbackAnimation: 'lightPunch',
        cancelWindows: [{ fromFrame: 6, toFrame: 6, into: ['special'] }],
      }),
    },
    kick: animation('fighter-2', 'kick', 7, 13, false, 'kick', {
      hitFrames: [3, 4],
      attackPhases: attackPhases([0, 1, 2], [3, 4], [5, 6]),
      soundEventFrame: 3,
      fallbackAnimation: 'lightPunch',
      cancelWindows: [{ fromFrame: 6, toFrame: 6, into: ['special'] }],
    }),
    special: {
      ...animation('fighter-2', 'special', 8, 11, false, 'special', {
        hitFrames: [4, 5],
        attackPhases: attackPhases([0, 1, 2, 3], [4, 5], [6, 7]),
        soundEventFrame: 4,
        fallbackAnimation: 'kick',
      }),
    },
    hit: animation('fighter-2', 'hit', 3, 11, false, 'hit', { offsetY: -0.02 }),
    knockdown: animation('fighter-2', 'knockdown', 6, 9, false, 'knockdown', {
      fallbackAnimation: 'ko',
    }),
    ko: animation('fighter-2', 'ko', 6, 7, false, 'ko', { scale: 1.04, offsetY: -0.04 }),
    victory: animation('fighter-2', 'victory', 4, 7, true, 'victory', { scale: 1.02 }),
  },
}

export const SPRITE_FIGHTERS: Record<SpriteFighterId, SpriteFighterConfig> = {
  'fighter-1': fighter1,
  'fighter-2': fighter2,
}

export const SPRITE_FIGHTER_OPTIONS = Object.values(SPRITE_FIGHTERS)

export const getSpriteAnimationConfig = (
  config: SpriteFighterConfig,
  animationName: SpriteAnimationName,
): SpriteAnimationConfig => {
  const configured = config.animations[animationName]
  if (configured) return configured

  const fallback = SPRITE_OPTIONAL_FALLBACKS[animationName as OptionalSpriteAnimationName]
  if (!fallback) throw new Error(`Missing required sprite animation: ${animationName}`)
  return config.animations[fallback]
}

export const resolveSpriteAnimations = (
  config: SpriteFighterConfig,
): Record<SpriteAnimationName, SpriteAnimationConfig> =>
  Object.fromEntries(
    SPRITE_ANIMATION_NAMES.map((animationName) => [
      animationName,
      getSpriteAnimationConfig(config, animationName),
    ]),
  ) as Record<SpriteAnimationName, SpriteAnimationConfig>

export const countSpriteAnimationFallbacks = (config: SpriteFighterConfig) =>
  OPTIONAL_SPRITE_ANIMATIONS.filter(
    (animationName) => !config.animations[animationName] || config.animations[animationName]?.fallbackAnimation,
  ).length

export const getFighterVisualState = (fighter: FighterState) => {
  if (fighter.ko) return 'knocked out'
  if (fighter.victorious) return 'victory'
  if (fighter.hitStun > 0) return 'hit stun'
  if (fighter.blockStun > 0) return 'block stun'
  if (fighter.blocking) return 'blocking'
  if (fighter.attack) return `attacking: ${fighter.attack.type}`
  if (!fighter.grounded) return 'jumping'
  if (Math.abs(fighter.vx) > 0.35) return 'walking'
  return 'idle'
}

export const getSpriteAnimation = (fighter: FighterState): SpriteAnimationName => {
  if (fighter.ko) return 'ko'
  if (fighter.victorious) return 'victory'
  if (fighter.hitStun > 0) return 'hit'
  if (fighter.blocking || fighter.blockStun > 0) return 'block'
  if (fighter.attack?.type === 'special') return 'special'
  if (fighter.attack?.type === 'kick') return 'kick'
  if (fighter.attack?.type === 'heavy') return 'heavyPunch'
  if (fighter.attack) return 'lightPunch'
  if (!fighter.grounded) return 'jump'
  if (fighter.dashTime > 0) return 'dash'
  if (Math.abs(fighter.vx) > 0.35) return 'walk'
  return 'idle'
}
