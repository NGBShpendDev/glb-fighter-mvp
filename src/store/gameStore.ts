import { create } from 'zustand'
import { ARENA_LIMIT, ATTACKS, CONTROLS, GROUND_Y, ROUND_SECONDS } from '../game/constants'
import { boxesOverlap, getAttackHitbox, getHurtbox } from '../game/hitboxes'
import { DEFAULT_MODEL_SETTINGS } from '../game/models'
import { ACTIVE_STAGE_ID } from '../game/stages'
import { createVfxEvent, MAX_ACTIVE_VFX } from '../game/vfx'
import type {
  AttackType,
  FighterLoadout,
  FighterModelSettings,
  FighterState,
  FighterStats,
  HitSpark,
  MatchPhase,
  ModelDiagnostic,
  PlayerId,
  UploadedCharacter,
  VfxEvent,
  VfxKind,
} from '../game/types'

const UPLOADED_CHARACTERS_KEY = 'ape-fighter-uploaded-characters'
const BALANCED_STATS: FighterStats = { power: 70, speed: 70, defense: 70 }
const pendingModelDiagnostic = (modelUrl: string): ModelDiagnostic => ({
  modelUrl,
  status: 'idle',
  message: 'Waiting for model loader.',
})

const readUploadedCharacters = (): UploadedCharacter[] => {
  if (typeof window === 'undefined') return []

  try {
    const saved = window.localStorage.getItem(UPLOADED_CHARACTERS_KEY)
    return saved ? (JSON.parse(saved) as UploadedCharacter[]) : []
  } catch {
    return []
  }
}

const persistUploadedCharacters = (characters: UploadedCharacter[]) => {
  try {
    window.localStorage.setItem(UPLOADED_CHARACTERS_KEY, JSON.stringify(characters))
  } catch {
    // The game remains playable when local storage is unavailable.
  }
}

const uploadedCharacterLoadout = (character: UploadedCharacter): FighterLoadout => ({
  name: character.name,
  modelUrl: character.modelUrl,
  modelSettings: {
    scale: character.scale,
    rotationY: character.rotation,
    verticalOffset: character.verticalOffset,
    horizontalOffset: 0,
  },
  stats: character.stats ?? BALANCED_STATS,
  specialMove: character.specialMove ?? 'BLOB BREAKER',
})

const makeFighter = (
  id: PlayerId,
  name: string,
  modelUrl: string,
  accent: string,
  modelSettings: FighterModelSettings,
  stats: FighterStats,
  specialMove: string,
  x: number,
): FighterState => ({
  id,
  name,
  modelUrl,
  modelSettings,
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
  hitStun: 0,
  blockStun: 0,
  ko: false,
  victorious: false,
  meter: 40,
})

const defaultLoadout: Record<PlayerId, FighterLoadout> = {
  p1: {
    name: 'NEON STRIKER',
    modelUrl: '/models/fighter-1.glb',
    modelSettings: { ...DEFAULT_MODEL_SETTINGS },
    stats: { power: 76, speed: 82, defense: 62 },
    specialMove: 'NEON OVERDRIVE',
  },
  p2: {
    name: 'CRIMSON RIOT',
    modelUrl: '/models/fighter-2.glb',
    modelSettings: { ...DEFAULT_MODEL_SETTINGS },
    stats: { power: 88, speed: 58, defense: 78 },
    specialMove: 'RIOT BREAKER',
  },
}

const freshFighters = (loadout: Record<PlayerId, FighterLoadout>): Record<PlayerId, FighterState> => ({
  p1: makeFighter(
    'p1',
    loadout.p1.name,
    loadout.p1.modelUrl,
    '#54e8ff',
    { ...loadout.p1.modelSettings },
    loadout.p1.stats,
    loadout.p1.specialMove,
    -3,
  ),
  p2: makeFighter(
    'p2',
    loadout.p2.name,
    loadout.p2.modelUrl,
    '#ff5267',
    { ...loadout.p2.modelSettings },
    loadout.p2.stats,
    loadout.p2.specialMove,
    3,
  ),
})

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

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
  modelDiagnostics: Record<PlayerId, ModelDiagnostic>
  uploadedCharacters: UploadedCharacter[]
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
  nextSparkId: number
  nextVfxId: number
  startMatch: () => void
  rematch: () => void
  restartMatch: () => void
  returnToTitle: () => void
  togglePause: () => void
  clearInput: () => void
  setFighterLoadout: (id: PlayerId, loadout: Partial<FighterLoadout>) => void
  setFighterModelSetting: (id: PlayerId, setting: keyof FighterModelSettings, value: number) => void
  setModelDiagnostic: (id: PlayerId, diagnostic: ModelDiagnostic) => void
  addUploadedCharacter: (character: UploadedCharacter) => void
  useUploadedCharacter: (id: PlayerId, character: UploadedCharacter) => void
  setKey: (code: string, down: boolean) => void
  toggleHitboxes: () => void
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
    shake: blocked ? 0.16 : attacker.attack.type === 'special' ? 0.62 : attacker.attack.type === 'heavy' ? 0.42 : 0.28,
  }
}

const getAttackTap = (id: PlayerId): AttackType | null => {
  const controls = CONTROLS[id]
  if (tapped.has(controls.special)) return 'special'
  if (tapped.has(controls.heavy)) return 'heavy'
  if (tapped.has(controls.kick)) return 'kick'
  if (tapped.has(controls.light)) return 'light'
  return null
}

const stepFighter = (fighter: FighterState, opponent: FighterState, delta: number) => {
  const controls = CONTROLS[fighter.id]
  const stunned = fighter.hitStun > 0 || fighter.blockStun > 0
  const attackTap = getAttackTap(fighter.id)
  let next = {
    ...fighter,
    hitStun: Math.max(0, fighter.hitStun - delta),
    blockStun: Math.max(0, fighter.blockStun - delta),
    cooldown: Math.max(0, fighter.cooldown - delta),
    dashCooldown: Math.max(0, fighter.dashCooldown - delta),
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
  const move = (pressed.has(controls.right) ? 1 : 0) - (pressed.has(controls.left) ? 1 : 0)

  if (mayAct && attackTap && next.cooldown <= 0 && next.meter >= ATTACKS[attackTap].meterCost) {
    const spec = ATTACKS[attackTap]
    next.attack = { type: attackTap, elapsed: 0, connected: false }
    next.cooldown = spec.cooldown
    next.blocking = false
    next.meter -= spec.meterCost
  }

  if (mayAct && !next.attack) {
    next.blocking = pressed.has(controls.block) && next.grounded
    if (!next.blocking) {
      next.vx = move * 3.9 * (0.78 + next.stats.speed / 320)
      if (tapped.has(controls.dash) && next.dashCooldown <= 0) {
        const dashDirection = move || next.facing
        next.vx = dashDirection * 10
        next.dashCooldown = 0.7
      }
      if (tapped.has(controls.jump) && next.grounded) {
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

  if (!next.attack && !stunned) {
    next.facing = opponent.x >= next.x ? 1 : -1
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
  modelDiagnostics: {
    p1: pendingModelDiagnostic(defaultLoadout.p1.modelUrl),
    p2: pendingModelDiagnostic(defaultLoadout.p2.modelUrl),
  },
  uploadedCharacters: readUploadedCharacters(),
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
  nextSparkId: 1,
  nextVfxId: 1,

  startMatch: () => {
    clearInputState()
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
    set({ phase: phase === 'fight' ? 'paused' : 'fight' })
  },

  clearInput: clearInputState,

  setFighterLoadout: (id, nextLoadout) =>
    set((state) => {
      const loadout = {
        ...state.loadout,
        [id]: {
          ...state.loadout[id],
          ...nextLoadout,
          modelSettings: nextLoadout.modelSettings
            ? { ...state.loadout[id].modelSettings, ...nextLoadout.modelSettings }
            : state.loadout[id].modelSettings,
        },
      }
      const modelUrl = loadout[id].modelUrl
      return {
        loadout,
        modelDiagnostics:
          modelUrl === state.modelDiagnostics[id].modelUrl
            ? state.modelDiagnostics
            : { ...state.modelDiagnostics, [id]: pendingModelDiagnostic(modelUrl) },
      }
    }),

  setFighterModelSetting: (id, setting, value) =>
    set((state) => ({
      loadout: {
        ...state.loadout,
        [id]: {
          ...state.loadout[id],
          modelSettings: { ...state.loadout[id].modelSettings, [setting]: value },
        },
      },
    })),

  setModelDiagnostic: (id, diagnostic) =>
    set((state) => {
      const previous = state.modelDiagnostics[id]
      if (
        previous.modelUrl === diagnostic.modelUrl &&
        previous.status === diagnostic.status &&
        previous.message === diagnostic.message &&
        previous.normalizedScale === diagnostic.normalizedScale
      ) {
        return state
      }
      return {
        modelDiagnostics: { ...state.modelDiagnostics, [id]: diagnostic },
      }
    }),

  addUploadedCharacter: (character) =>
    set((state) => {
      const uploadedCharacters = [
        ...state.uploadedCharacters.filter((saved) => saved.id !== character.id),
        character,
      ]
      persistUploadedCharacters(uploadedCharacters)
      return { uploadedCharacters }
    }),

  useUploadedCharacter: (id, character) =>
    set((state) => {
      const loadout = {
        ...state.loadout,
        [id]: uploadedCharacterLoadout(character),
      }
      return {
        loadout,
        modelDiagnostics: {
          ...state.modelDiagnostics,
          [id]: pendingModelDiagnostic(loadout[id].modelUrl),
        },
      }
    }),

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

    let p1 = stepFighter(state.fighters.p1, state.fighters.p2, delta)
    let p2 = stepFighter(state.fighters.p2, p1, delta)
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
      if (previous.dashCooldown <= 0 && next.dashCooldown > 0) {
        spawnVfx('dustPuff', next.x - next.facing * 0.32, GROUND_Y + 0.12, next.facing, 0.88, 1)
      }
      if (!previous.grounded && next.grounded) {
        spawnVfx('dustPuff', next.x, GROUND_Y + 0.12, next.facing, 1.05, 1)
      }
      if (next.attack?.type === 'special' && previous.attack?.type !== 'special') {
        spawnVfx('energySlash', next.x + next.facing * 0.88, next.y + 1.32, next.facing, 1, 1.45)
      }
    }

    emitMotionVfx(state.fighters.p1, p1)
    emitMotionVfx(state.fighters.p2, p2)

    const distance = Math.abs(p1.x - p2.x)
    if (distance < 0.82 && Math.abs(p1.y - p2.y) < 1.25) {
      const push = (0.82 - distance) / 2
      const direction = p1.x <= p2.x ? -1 : 1
      p1 = { ...p1, x: clamp(p1.x + direction * push, -ARENA_LIMIT, ARENA_LIMIT) }
      p2 = { ...p2, x: clamp(p2.x - direction * push, -ARENA_LIMIT, ARENA_LIMIT) }
    }

    let nextSparkId = state.nextSparkId
    let shake = Math.max(0, state.shake - delta * 2.2)
    const firstHit = resolveHit(p1, p2, nextSparkId)
    if (firstHit) {
      p1 = firstHit.attacker
      p2 = firstHit.defender
      sparks.push(firstHit.spark)
      spawnVfx(firstHit.spark.blocked ? 'blockSpark' : 'hitSpark', firstHit.spark.x, firstHit.spark.y, firstHit.spark.direction, firstHit.spark.kind === 'heavy' ? 1.22 : 1)
      shake = Math.max(shake, firstHit.shake)
      set({ hitStop: firstHit.spark.blocked ? 0.035 : firstHit.spark.kind === 'special' ? 0.13 : firstHit.spark.kind === 'heavy' ? 0.09 : 0.055 })
      nextSparkId += 1
    }

    const secondHit = resolveHit(p2, p1, nextSparkId)
    if (secondHit) {
      p2 = secondHit.attacker
      p1 = secondHit.defender
      sparks.push(secondHit.spark)
      spawnVfx(secondHit.spark.blocked ? 'blockSpark' : 'hitSpark', secondHit.spark.x, secondHit.spark.y, secondHit.spark.direction, secondHit.spark.kind === 'heavy' ? 1.22 : 1)
      shake = Math.max(shake, secondHit.shake)
      set({ hitStop: secondHit.spark.blocked ? 0.035 : secondHit.spark.kind === 'special' ? 0.13 : secondHit.spark.kind === 'heavy' ? 0.09 : 0.055 })
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
        shake = Math.max(shake, 0.92)
        slowMotion = Math.max(slowMotion, 0.48)
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
      slowMotion,
      perfect,
      nextSparkId,
      nextVfxId,
    })
    tapped.clear()
  },
}))
