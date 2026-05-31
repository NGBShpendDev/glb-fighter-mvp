import type { AttackType, PlayerId } from './types'

export const ARENA_LIMIT = 6.9
export const GROUND_Y = 0.25
export const ROUND_SECONDS = 60

export const ATTACKS: Record<
  AttackType,
  {
    duration: number
    activeStart: number
    activeEnd: number
    range: number
    height: number
    offsetY: number
    damage: number
    knockback: number
    stun: number
    blockStun: number
    cooldown: number
    spark: string
    meterCost: number
  }
> = {
  light: {
    duration: 0.32,
    activeStart: 0.1,
    activeEnd: 0.2,
    range: 1.08,
    height: 0.75,
    offsetY: 1.45,
    damage: 6,
    knockback: 2.5,
    stun: 0.2,
    blockStun: 0.12,
    cooldown: 0.28,
    spark: '#ffe46b',
    meterCost: 0,
  },
  heavy: {
    duration: 0.54,
    activeStart: 0.22,
    activeEnd: 0.36,
    range: 1.28,
    height: 0.92,
    offsetY: 1.55,
    damage: 12,
    knockback: 4.4,
    stun: 0.36,
    blockStun: 0.2,
    cooldown: 0.58,
    spark: '#ff8a30',
    meterCost: 0,
  },
  kick: {
    duration: 0.62,
    activeStart: 0.22,
    activeEnd: 0.45,
    range: 1.45,
    height: 0.72,
    offsetY: 0.86,
    damage: 10,
    knockback: 3.8,
    stun: 0.28,
    blockStun: 0.18,
    cooldown: 0.48,
    spark: '#ffcf45',
    meterCost: 0,
  },
  special: {
    duration: 0.88,
    activeStart: 0.32,
    activeEnd: 0.62,
    range: 1.82,
    height: 1.18,
    offsetY: 1.35,
    damage: 20,
    knockback: 7.2,
    stun: 0.5,
    blockStun: 0.3,
    cooldown: 1.15,
    spark: '#35e6ff',
    meterCost: 60,
  },
}

export const CONTROLS: Record<
  PlayerId,
  {
    left: string
    right: string
    jump: string
    block: string
    dash: string
    light: string
    heavy: string
    kick: string
    special: string
  }
> = {
  p1: {
    left: 'KeyA',
    right: 'KeyD',
    jump: 'KeyW',
    block: 'KeyS',
    dash: 'KeyQ',
    light: 'KeyF',
    heavy: 'KeyG',
    kick: 'KeyH',
    special: 'KeyR',
  },
  p2: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    block: 'ArrowDown',
    dash: 'Slash',
    light: 'KeyJ',
    heavy: 'KeyK',
    kick: 'KeyL',
    special: 'KeyI',
  },
}
