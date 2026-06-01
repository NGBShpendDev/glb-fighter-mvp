import { create } from 'zustand'
import { getP2AiInput, resetP2Ai } from '../game/ai'
import { ARENA_LIMIT, ATTACKS, CONTROLS, GROUND_Y, ROUND_SECONDS } from '../game/constants'
import { boxesOverlap, getAttackHitbox, getHurtbox } from '../game/hitboxes'
import { ACTIVE_STAGE_ID } from '../game/stages'
import { createVfxEvent, MAX_ACTIVE_VFX } from '../game/vfx'
import type { SpriteAnimationName } from '../game/spriteAnimator'
import type {
  AttackType,
  FighterInput,
  FighterLoadout,
  FighterState,
  FighterStats,
  HitSpark,
  MatchPhase,
  P2ControlMode,
  PlayerId,
  SpriteAssetDiagnostic,
  VfxEvent,
  VfxKind,
  SpriteFighterId,
} from '../game/types'

const pendingSpriteDiagnostic = (animation = 'idle'): SpriteAssetDiagnostic => ({
  animation,
  filePath: '',
  status: 'idle',
  message: 'Waiting for sprite loader.',
  frameIndex: 0,
  frameCount: 1,
  fps: 0,
  usingFallback: false,
})

const makeFighter = (
  id: PlayerId,
  name: string,
  spriteFighterId: SpriteFighterId,
  accent: string,
  stats: FighterStats,
  specialMove: string,
  x: number,
): FighterState => ({
  id,
  name,
  spriteFighterId,
  stats,
  specialMove,
  accent,
  health: 100,
  x,
  y: GROUND_Y,
  vx: 0,
  vy: 0,
  facing: id === 'p1' ? 1 : -1,
  grounded: true,
  blocking: false,
  attack: null,
  cooldown: 0,
  dashCooldown: 0,
  dashTime: 0,
  hitStun: 0,
  blockStun: 0,
  ko: false,
  victorious: false,
  meter: 40,
})

const SPRITE_LOADOUTS: Record<SpriteFighterId, FighterLoadout> = {
  'fighter-1': {
    name: 'CHEETAH CHIEF',
    spriteFighterId: 'fighter-1',
    stats: { power: 76, speed: 82, defense: 62 },
    specialMove: 'NEON OVERDRIVE',
  },
  'fighter-2': {
    name: 'PARTY BOT',
    spriteFighterId: 'fighter-2',
    stats: { power: 88, speed: 58, defense: 78 },
    specialMove: 'RIOT BREAKER',
  },
}

const loadoutFor = (spriteFighterId: SpriteFighterId): FighterLoadout => ({
  ...SPRITE_LOADOUTS[spriteFighterId],
  stats: { ...SPRITE_LOADOUTS[spriteFighterId].stats },
})

const defaultLoadout: Record<PlayerId, FighterLoadout> = {
  p1: loadoutFor('fighter-1'),
  p2: loadoutFor('fighter-2'),
}

const freshFighters = (loadout: Record<PlayerId, FighterLoadout>): Record<PlayerId, FighterState> => ({
  p1: makeFighter(
    'p1',
    loadout.p1.name,
    loadout.p1.spriteFighterId,
    '#54e8ff',
    loadout.p1.stats,
    loadout.p1.specialMove,
    -3,
  ),
  p2: makeFighter(
    'p2',
    loadout.p2.name,
    loadout.p2.spriteFighterId,
    '#ff5267',
    loadout.p2.stats,
    loadout.p2.specialMove,
    3,
  ),
})

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))
const MIN_FIGHTER_DISTANCE = 0.82
const GROUND_ACCELERATION = 28
const GROUND_DECELERATION = 38
const AIR_ACCELERATION = 12

const approach = (value: number, target: number, amount: number) =>
  value < target ? Math.min(value + amount, target) : Math.max(value - amount, target)

const getImpactFeel = (kind: AttackType, blocked: boolean) => {
  if (blocked) return { hitStop: 0.03, shake: 0.07 }
  if (kind === 'special') return { hitStop: 0.105, shake: 0.42 }
  if (kind === 'heavy') return { hitStop: 0.075, shake: 0.3 }
  if (kind === 'kick') return { hitStop: 0.06, shake: 0.22 }
  return { hitStop: 0.045, shake: 0.14 }
}

const keepFightersSeparated = (
  p1: FighterState,
  p2: FighterState,
  previousP1: FighterState,
  previousP2: FighterState,
) => {
  const p1WasLeft = previousP1.x <= previousP2.x
  const crossed = p1WasLeft ? p1.x > p2.x : p1.x < p2.x
  const distance = Math.abs(p1.x - p2.x)
  if (!crossed && distance >= MIN_FIGHTER_DISTANCE) return { p1, p2 }

  const midpoint = (p1.x + p2.x) / 2
  const halfGap = MIN_FIGHTER_DISTANCE / 2
  return {
    p1: { ...p1, x: clamp(midpoint + (p1WasLeft ? -halfGap : halfGap), -ARENA_LIMIT, ARENA_LIMIT) },
    p2: { ...p2, x: clamp(midpoint + (p1WasLeft ? halfGap : -halfGap), -ARENA_LIMIT, ARENA_LIMIT) },
  }
}

const faceOpponent = (fighter: FighterState, opponent: FighterState) =>
  fighter.attack ? fighter : { ...fighter, facing: opponent.x >= fighter.x ? 1 as const : -1 as const }

const pressed = new Set<string>()
const tapped = new Set<string>()

const clearInputState = () => {
  pressed.clear()
  tapped.clear()
}

type GameStore = {
  phase: MatchPhase
  fighters: Record<PlayerId, FighterState>
  loadout: Record<PlayerId, FighterLoadout>
  spriteDiagnostics: Record<PlayerId, SpriteAssetDiagnostic>
  p2ControlMode: P2ControlMode
  selectedStageId: string
  timer: number
  winner: PlayerId | null
  sparks: HitSpark[]
  vfx: VfxEvent[]
  shake: number
  hitStop: number
  slowMotion: number
  roundIntro: number
  perfect: boolean
  soundEnabled: boolean
  debugHitboxes: boolean
  debugSprites: boolean
  debugSpriteBounds: boolean
  debugSpriteOrigin: boolean
  spriteAnimationPaused: boolean
  spriteAnimationStepRequest: number
  spriteAnimationPreview: SpriteAnimationName | null
  nextSparkId: number
  nextVfxId: number
  startMatch: () => void
  rematch: () => void
  restartMatch: () => void
  returnToTitle: () => void
  togglePause: () => void
  clearInput: () => void
  setFighterSprite: (id: PlayerId, spriteFighterId: SpriteFighterId) => void
  setSpriteDiagnostic: (id: PlayerId, diagnostic: SpriteAssetDiagnostic) => void
  setP2ControlMode: (mode: P2ControlMode) => void
  setKey: (code: string, down: boolean) => void
  toggleHitboxes: () => void
  toggleSpriteDebug: () => void
  toggleSpriteBounds: () => void
  toggleSpriteOrigin: () => void
  toggleSpriteAnimationPause: () => void
  stepSpriteAnimation: () => void
  setSpriteAnimationPreview: (animation: SpriteAnimationName | null) => void
  toggleSound: () => void
  setSelectedStageId: (stageId: string) => void
  update: (delta: number) => void
}

const resolveHit = (
  attacker: FighterState,
  defender: FighterState,
  sparkId: number,
): { defender: FighterState; attacker: FighterState; spark: HitSpark; shake: number } | null => {
  if (!attacker.attack || attacker.attack.connected) return null
  const attackBox = getAttackHitbox(attacker)
  if (!attackBox || !boxesOverlap(attackBox, getHurtbox(defender))) return null

  const spec = ATTACKS[attacker.attack.type]
  const isFacingHit = defender.facing === -attacker.facing
  const blocked = defender.blocking && isFacingHit && defender.grounded
  const powerScale = 0.84 + attacker.stats.power / 440
  const defenseScale = 1.1 - defender.stats.defense / 620
  const rawDamage = Math.round(spec.damage * powerScale * defenseScale)
  const damage = blocked ? Math.max(1, Math.round(rawDamage * 0.18)) : rawDamage

  return {
    attacker: {
      ...attacker,
      attack: { ...attacker.attack, connected: true },
      meter: clamp(attacker.meter + (attacker.attack.type === 'special' ? 4 : 16), 0, 100),
    },
    defender: {
      ...defender,
      health: clamp(defender.health - damage, 0, 100),
      vx: attacker.facing * spec.knockback * (blocked ? 0.28 : 1),
      vy: blocked ? defender.vy : Math.max(defender.vy, spec.knockback * 0.24),
      hitStun: blocked ? 0 : spec.stun,
      blockStun: blocked ? spec.blockStun : 0,
      blocking: blocked,
      meter: clamp(defender.meter + (blocked ? 8 : 12), 0, 100),
    },
    spark: {
      id: sparkId,
      x: attackBox.x + attacker.facing * 0.2,
      y: attackBox.y,
      age: 0,
      life: blocked ? 0.2 : 0.32,
      color: blocked ? '#95d7ff' : attacker.attack.type === 'special' ? attacker.accent : spec.spark,
      blocked,
      kind: attacker.attack.type,
      direction: attacker.facing,
    },
    shake: getImpactFeel(attacker.attack.type, blocked).shake,
  }
}

const getKeyboardInput = (id: PlayerId): FighterInput => {
  const controls = CONTROLS[id]
  return {
    moveLeft: pressed.has(controls.left),
    moveRight: pressed.has(controls.right),
    jump: tapped.has(controls.jump),
    block: pressed.has(controls.block),
    dash: tapped.has(controls.dash),
    lightPunch: tapped.has(controls.light),
    heavyPunch: tapped.has(controls.heavy),
    kick: tapped.has(controls.kick),
    special: tapped.has(controls.special),
  }
}

const getAttackTap = (input: FighterInput): AttackType | null => {
  if (input.special) return 'special'
  if (input.heavyPunch) return 'heavy'
  if (input.kick) return 'kick'
  if (input.lightPunch) return 'light'
  return null
}

const stepFighter = (fighter: FighterState, input: FighterInput, delta: number) => {
  const stunned = fighter.hitStun > 0 || fighter.blockStun > 0
  const attackTap = getAttackTap(input)
  let next = {
    ...fighter,
    hitStun: Math.max(0, fighter.hitStun - delta),
    blockStun: Math.max(0, fighter.blockStun - delta),
    cooldown: Math.max(0, fighter.cooldown - delta),
    dashCooldown: Math.max(0, fighter.dashCooldown - delta),
    dashTime: Math.max(0, fighter.dashTime - delta),
    meter: clamp(fighter.meter + delta * 3.5, 0, 100),
  }

  if (next.ko) {
    next.vy -= 17 * delta
    next.y = Math.max(GROUND_Y, next.y + next.vy * delta)
    next.x = clamp(next.x + next.vx * delta, -ARENA_LIMIT, ARENA_LIMIT)
    next.vx *= Math.pow(0.04, delta)
    return next
  }

  if (next.attack) {
    const elapsed = next.attack.elapsed + delta
    next.attack =
      elapsed >= ATTACKS[next.attack.type].duration
        ? null
        : { ...next.attack, elapsed }
  }

  const mayAct = !stunned && !next.attack
  const move = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0)

  if (mayAct && attackTap && next.cooldown <= 0 && next.meter >= ATTACKS[attackTap].meterCost) {
    const spec = ATTACKS[attackTap]
    next.attack = { type: attackTap, elapsed: 0, connected: false }
    next.cooldown = spec.cooldown
    next.blocking = false
    next.meter -= spec.meterCost
  }

  if (mayAct && !next.attack) {
    next.blocking = input.block && next.grounded
    if (!next.blocking) {
      if (input.dash && next.dashCooldown <= 0) {
        const dashDirection = move || next.facing
        next.vx = dashDirection * 10
        next.dashCooldown = 0.7
        next.dashTime = 0.12
      } else if (next.dashTime <= 0) {
        const desiredSpeed = move * 3.9 * (0.78 + next.stats.speed / 320)
        const acceleration = next.grounded
          ? move === 0
            ? GROUND_DECELERATION
            : GROUND_ACCELERATION
          : AIR_ACCELERATION
        next.vx = approach(next.vx, desiredSpeed, acceleration * delta)
      }
      if (input.jump && next.grounded) {
        next.vy = 7.6
        next.grounded = false
      }
    } else {
      next.vx *= Math.pow(0.04, delta)
    }
  }

  next.vy -= 17 * delta
  next.x = clamp(next.x + next.vx * delta, -ARENA_LIMIT, ARENA_LIMIT)
  next.y += next.vy * delta

  if (next.y <= GROUND_Y) {
    next.y = GROUND_Y
    next.vy = 0
    next.grounded = true
  }

  if (next.attack || stunned) {
    next.vx *= Math.pow(0.12, delta)
  }

  return next
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'title',
  fighters: freshFighters(defaultLoadout),
  loadout: defaultLoadout,
  spriteDiagnostics: {
    p1: pendingSpriteDiagnostic(),
    p2: pendingSpriteDiagnostic(),
  },
  p2ControlMode: 'ai-easy',
  selectedStageId: ACTIVE_STAGE_ID,
  timer: ROUND_SECONDS,
  winner: null,
  sparks: [],
  vfx: [],
  shake: 0,
  hitStop: 0,
  slowMotion: 0,
  roundIntro: 0,
  perfect: false,
  soundEnabled: true,
  debugHitboxes: false,
  debugSprites: false,
  debugSpriteBounds: false,
  debugSpriteOrigin: false,
  spriteAnimationPaused: false,
  spriteAnimationStepRequest: 0,
  spriteAnimationPreview: null,
  nextSparkId: 1,
  nextVfxId: 1,

  startMatch: () => {
    clearInputState()
    resetP2Ai()
    set({
      phase: 'fight',
      fighters: freshFighters(get().loadout),
      timer: ROUND_SECONDS,
      winner: null,
      sparks: [],
      vfx: [],
      shake: 0,
      hitStop: 0,
      slowMotion: 0,
      roundIntro: 2.15,
      perfect: false,
    })
  },

  rematch: () => get().startMatch(),
  restartMatch: () => get().startMatch(),

  returnToTitle: () => {
    clearInputState()
    resetP2Ai()
    set({
      phase: 'title',
      fighters: freshFighters(get().loadout),
      timer: ROUND_SECONDS,
      winner: null,
      sparks: [],
      vfx: [],
      shake: 0,
      hitStop: 0,
      slowMotion: 0,
      roundIntro: 0,
      perfect: false,
    })
  },

  togglePause: () => {
    const { phase } = get()
    if (phase !== 'fight' && phase !== 'paused') return
    clearInputState()
    resetP2Ai()
    set({ phase: phase === 'fight' ? 'paused' : 'fight' })
  },

  clearInput: () => {
    clearInputState()
    resetP2Ai()
  },

  setFighterSprite: (id, spriteFighterId) =>
    set((state) => ({
      loadout: { ...state.loadout, [id]: loadoutFor(spriteFighterId) },
    })),

  setSpriteDiagnostic: (id, diagnostic) =>
    set((state) => {
      const previous = state.spriteDiagnostics[id]
      if (
        previous.animation === diagnostic.animation &&
        previous.filePath === diagnostic.filePath &&
        previous.status === diagnostic.status &&
        previous.message === diagnostic.message &&
        previous.frameIndex === diagnostic.frameIndex &&
        previous.frameCount === diagnostic.frameCount &&
        previous.fps === diagnostic.fps &&
        previous.usingFallback === diagnostic.usingFallback
      ) {
        return state
      }
      return {
        spriteDiagnostics: { ...state.spriteDiagnostics, [id]: diagnostic },
      }
    }),

  setP2ControlMode: (p2ControlMode) => {
    clearInputState()
    resetP2Ai()
    set({ p2ControlMode })
  },

  setKey: (code, down) => {
    if (!down) {
      pressed.delete(code)
      return
    }
    if (get().phase === 'paused') return
    if (down && !pressed.has(code)) tapped.add(code)
    pressed.add(code)
  },

  toggleHitboxes: () => set((state) => ({ debugHitboxes: !state.debugHitboxes })),
  toggleSpriteDebug: () => set((state) => ({ debugSprites: !state.debugSprites })),
  toggleSpriteBounds: () => set((state) => ({ debugSpriteBounds: !state.debugSpriteBounds })),
  toggleSpriteOrigin: () => set((state) => ({ debugSpriteOrigin: !state.debugSpriteOrigin })),
  toggleSpriteAnimationPause: () =>
    set((state) => ({ spriteAnimationPaused: !state.spriteAnimationPaused })),
  stepSpriteAnimation: () =>
    set((state) => ({ spriteAnimationPaused: true, spriteAnimationStepRequest: state.spriteAnimationStepRequest + 1 })),
  setSpriteAnimationPreview: (spriteAnimationPreview) => set({ spriteAnimationPreview }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setSelectedStageId: (selectedStageId) => set({ selectedStageId }),

  update: (rawDelta) => {
    const state = get()
    const frameDelta = Math.min(rawDelta, 0.05)
    const delta = frameDelta * (state.slowMotion > 0 ? 0.34 : 1)
    let slowMotion = Math.max(0, state.slowMotion - frameDelta)
    const sparks = state.sparks
      .map((spark) => ({ ...spark, age: spark.age + delta }))
      .filter((spark) => spark.age < spark.life)
    let vfx = state.vfx
      .map((effect) => ({ ...effect, age: effect.age + delta }))
      .filter((effect) => effect.age < effect.life)

    if (state.hitStop > 0) {
      set({ sparks, vfx, slowMotion, hitStop: Math.max(0, state.hitStop - frameDelta) })
      tapped.clear()
      return
    }

    if (state.phase !== 'fight') {
      set({ sparks, vfx, slowMotion, shake: Math.max(0, state.shake - delta * 2.2) })
      tapped.clear()
      return
    }

    if (state.roundIntro > 0) {
      set({ sparks, vfx, slowMotion, roundIntro: Math.max(0, state.roundIntro - delta) })
      tapped.clear()
      return
    }

    const p1Input = getKeyboardInput('p1')
    const p2Input =
      state.p2ControlMode === 'player'
        ? getKeyboardInput('p2')
        : getP2AiInput(state.p2ControlMode, state.fighters.p2, state.fighters.p1, delta)
    let p1 = stepFighter(state.fighters.p1, p1Input, delta)
    let p2 = stepFighter(state.fighters.p2, p2Input, delta)
    let nextVfxId = state.nextVfxId
    const spawnVfx = (
      kind: VfxKind,
      x: number,
      y: number,
      direction: 1 | -1,
      scale = 1,
      z?: number,
    ) => {
      vfx.push(createVfxEvent(nextVfxId, kind, x, y, direction, scale, z))
      nextVfxId += 1
      if (vfx.length > MAX_ACTIVE_VFX) vfx = vfx.slice(-MAX_ACTIVE_VFX)
    }
    const emitMotionVfx = (previous: FighterState, next: FighterState) => {
      const dashed = previous.dashCooldown <= 0 && next.dashCooldown > 0
      const suddenGroundMovement =
        !dashed && next.grounded && Math.abs(next.vx) >= 5.5 && Math.abs(next.vx - previous.vx) >= 3
      if (dashed || suddenGroundMovement) {
        spawnVfx('dustPuff', next.x - next.facing * 0.32, GROUND_Y + 0.12, next.facing, 0.88, 1)
      }
      if (!previous.grounded && next.grounded) {
        spawnVfx('dustPuff', next.x, GROUND_Y + 0.12, next.facing, 1.05, 1)
      }
      if (
        (next.attack?.type === 'heavy' || next.attack?.type === 'special') &&
        previous.attack?.type !== next.attack.type
      ) {
        const scale = next.attack.type === 'heavy' ? 0.76 : 1
        spawnVfx('energySlash', next.x + next.facing * 0.88, next.y + 1.32, next.facing, scale, 1.45)
      }
    }

    emitMotionVfx(state.fighters.p1, p1)
    emitMotionVfx(state.fighters.p2, p2)

    if (Math.abs(p1.y - p2.y) < 1.25) {
      const separated = keepFightersSeparated(p1, p2, state.fighters.p1, state.fighters.p2)
      p1 = separated.p1
      p2 = separated.p2
    }
    p1 = faceOpponent(p1, p2)
    p2 = faceOpponent(p2, p1)

    let nextSparkId = state.nextSparkId
    let shake = Math.max(0, state.shake - delta * 2.2)
    let hitStop = 0
    const firstHit = resolveHit(p1, p2, nextSparkId)
    if (firstHit) {
      p1 = firstHit.attacker
      p2 = firstHit.defender
      sparks.push(firstHit.spark)
      spawnVfx(firstHit.spark.blocked ? 'blockSpark' : 'hitSpark', firstHit.spark.x, firstHit.spark.y, firstHit.spark.direction, firstHit.spark.kind === 'heavy' ? 1.22 : 1)
      shake = Math.max(shake, firstHit.shake)
      hitStop = Math.max(hitStop, getImpactFeel(firstHit.spark.kind, firstHit.spark.blocked).hitStop)
      nextSparkId += 1
    }

    const secondHit = resolveHit(p2, p1, nextSparkId)
    if (secondHit) {
      p2 = secondHit.attacker
      p1 = secondHit.defender
      sparks.push(secondHit.spark)
      spawnVfx(secondHit.spark.blocked ? 'blockSpark' : 'hitSpark', secondHit.spark.x, secondHit.spark.y, secondHit.spark.direction, secondHit.spark.kind === 'heavy' ? 1.22 : 1)
      shake = Math.max(shake, secondHit.shake)
      hitStop = Math.max(hitStop, getImpactFeel(secondHit.spark.kind, secondHit.spark.blocked).hitStop)
      nextSparkId += 1
    }

    const timer = Math.max(0, state.timer - delta)
    let phase: MatchPhase = state.phase
    let winner: PlayerId | null = null
    let perfect = false

    if (p1.health <= 0 || p2.health <= 0 || timer <= 0) {
      const knockout = p1.health <= 0 || p2.health <= 0
      winner = p1.health === p2.health ? null : p1.health > p2.health ? 'p1' : 'p2'
      phase = 'ko'
      perfect = winner !== null && (winner === 'p1' ? p1.health : p2.health) === 100
      p1 = { ...p1, ko: winner !== 'p1', victorious: winner === 'p1', blocking: false }
      p2 = { ...p2, ko: winner !== 'p2', victorious: winner === 'p2', blocking: false }
      if (knockout) {
        const defeated = p1.health <= 0 ? p1 : p2
        const victor = p1.health <= 0 ? p2 : p1
        spawnVfx('hitSpark', defeated.x, defeated.y + 1.2, victor.facing, 1.8, 1.7)
        shake = Math.max(shake, 0.72)
        hitStop = Math.max(hitStop, 0.12)
        slowMotion = Math.max(slowMotion, 0.42)
      }
    }

    set({
      fighters: { p1, p2 },
      timer,
      phase,
      winner,
      sparks,
      vfx,
      shake,
      hitStop,
      slowMotion,
      perfect,
      nextSparkId,
      nextVfxId,
    })
    tapped.clear()
  },
}))
