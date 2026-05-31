import type { FighterInput, FighterState, P2ControlMode } from './types'

type AiDifficulty = {
  label: string
  reactionTime: [number, number]
  preferredRange: [number, number]
  attackChance: number
  kickChance: number
  blockChance: number
  jumpChance: number
  retreatChance: number
  mistakeChance: number
}

export const P2_CONTROL_OPTIONS: Array<{ mode: P2ControlMode; label: string; description: string }> = [
  { mode: 'ai-easy', label: 'AI EASY', description: 'Slow reactions and generous openings.' },
  { mode: 'ai-medium', label: 'AI MEDIUM', description: 'Better spacing with occasional defense.' },
  { mode: 'ai-hard', label: 'AI HARD', description: 'Faster pressure and more deliberate blocking.' },
  { mode: 'player', label: 'PLAYER CONTROLLED', description: 'Use the Player 2 keyboard controls.' },
]

export const AI_DIFFICULTIES: Record<Exclude<P2ControlMode, 'player'>, AiDifficulty> = {
  'ai-easy': {
    label: 'AI EASY',
    reactionTime: [0.62, 0.94],
    preferredRange: [1.1, 2.25],
    attackChance: 0.34,
    kickChance: 0.28,
    blockChance: 0.12,
    jumpChance: 0.06,
    retreatChance: 0.3,
    mistakeChance: 0.3,
  },
  'ai-medium': {
    label: 'AI MEDIUM',
    reactionTime: [0.34, 0.58],
    preferredRange: [1.2, 1.95],
    attackChance: 0.54,
    kickChance: 0.4,
    blockChance: 0.34,
    jumpChance: 0.12,
    retreatChance: 0.46,
    mistakeChance: 0.14,
  },
  'ai-hard': {
    label: 'AI HARD',
    reactionTime: [0.18, 0.34],
    preferredRange: [1.18, 1.72],
    attackChance: 0.7,
    kickChance: 0.52,
    blockChance: 0.58,
    jumpChance: 0.16,
    retreatChance: 0.62,
    mistakeChance: 0.05,
  },
}

const emptyInput = (): FighterInput => ({
  moveLeft: false,
  moveRight: false,
  jump: false,
  block: false,
  dash: false,
  lightPunch: false,
  heavyPunch: false,
  kick: false,
  special: false,
})

let reactionTimer = 0
let heldInput = emptyInput()
let releaseTaps = false

const between = ([min, max]: [number, number]) => min + Math.random() * (max - min)
const withoutTaps = (input: FighterInput): FighterInput => ({
  ...input,
  jump: false,
  dash: false,
  lightPunch: false,
  heavyPunch: false,
  kick: false,
  special: false,
})

export const resetP2Ai = () => {
  reactionTimer = 0
  heldInput = emptyInput()
  releaseTaps = false
}

export const getP2AiInput = (
  mode: Exclude<P2ControlMode, 'player'>,
  fighter: FighterState,
  opponent: FighterState,
  delta: number,
): FighterInput => {
  reactionTimer -= delta
  if (reactionTimer > 0) {
    if (releaseTaps) {
      heldInput = withoutTaps(heldInput)
      releaseTaps = false
    }
    return heldInput
  }

  const config = AI_DIFFICULTIES[mode]
  reactionTimer = between(config.reactionTime)
  const next = emptyInput()
  const distance = Math.abs(opponent.x - fighter.x)
  const opponentDirection = opponent.x >= fighter.x ? 1 : -1
  const opponentThreatening = Boolean(opponent.attack) && distance < 2.15

  if (opponentThreatening && Math.random() < config.blockChance) {
    next.block = true
    heldInput = next
    return heldInput
  }

  if (distance > config.preferredRange[1]) {
    next.moveRight = opponentDirection === 1
    next.moveLeft = opponentDirection === -1
  } else if (Math.random() < config.mistakeChance) {
    heldInput = next
    return heldInput
  } else if (distance < config.preferredRange[0] && Math.random() < config.retreatChance) {
    next.moveRight = opponentDirection === -1
    next.moveLeft = opponentDirection === 1
  } else if (distance < 1.7 && Math.random() < config.attackChance) {
    if (Math.random() < config.kickChance) next.kick = true
    else next.lightPunch = true
  }

  if (fighter.grounded && !next.block && Math.random() < config.jumpChance) next.jump = true

  heldInput = next
  releaseTaps = next.jump || next.lightPunch || next.kick
  return heldInput
}
