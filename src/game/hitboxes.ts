import { ATTACKS } from './constants'
import type { FighterState } from './types'

export type Box = {
  x: number
  y: number
  width: number
  height: number
}

export const getHurtbox = (fighter: FighterState): Box => ({
  x: fighter.x,
  y: fighter.y + 1.18,
  width: 0.88,
  height: 2.25,
})

export const getAttackHitbox = (fighter: FighterState): Box | null => {
  if (!fighter.attack) return null

  const attack = ATTACKS[fighter.attack.type]
  if (
    fighter.attack.elapsed < attack.activeStart ||
    fighter.attack.elapsed > attack.activeEnd
  ) {
    return null
  }

  return {
    x: fighter.x + fighter.facing * (0.56 + attack.range / 2),
    y: fighter.y + attack.offsetY,
    width: attack.range,
    height: attack.height,
  }
}

export const boxesOverlap = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) * 2 < a.width + b.width &&
  Math.abs(a.y - b.y) * 2 < a.height + b.height
