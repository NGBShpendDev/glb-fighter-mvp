import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const directory = await mkdtemp(join(tmpdir(), 'ape-fighter-'))
const output = join(directory, 'game-store.mjs')

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
  console.log(`PASS ${message}`)
}

try {
  await build({
    entryPoints: ['src/store/gameStore.ts'],
    outfile: output,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  })

  const { useGameStore } = await import(`${pathToFileURL(output).href}?test=${Date.now()}`)
  const get = () => useGameStore.getState()
  const tick = (count = 1, delta = 0.05) => {
    for (let index = 0; index < count; index += 1) get().update(delta)
  }
  const ready = () => {
    get().setP2ControlMode('player')
    get().startMatch()
    tick(44)
  }
  const tap = (code) => {
    get().setKey(code, true)
    tick()
    get().setKey(code, false)
  }
  const placeFightersInRange = () =>
    useGameStore.setState((state) => ({
      fighters: {
        ...state.fighters,
        p1: { ...state.fighters.p1, x: -0.42 },
        p2: { ...state.fighters.p2, x: 0.42 },
      },
    }))

  ready()
  get().setKey('KeyA', true)
  tick(120)
  get().setKey('KeyA', false)
  assert(get().fighters.p1.x >= -6.9, 'fighter movement is clamped at the left arena edge')

  ready()
  tap('KeyW')
  assert(!get().fighters.p1.grounded && get().fighters.p1.y > 0.25, 'jump leaves the ground')

  ready()
  get().setKey('KeyD', true)
  tap('KeyQ')
  get().setKey('KeyD', false)
  assert(get().fighters.p1.vx > 7, 'dash applies a burst of horizontal velocity')
  assert(get().vfx.some((effect) => effect.kind === 'dustPuff'), 'dash spawns a dust puff VFX event')

  ready()
  useGameStore.setState((state) => ({
    fighters: {
      p1: { ...state.fighters.p1, x: -0.18, vx: 10 },
      p2: { ...state.fighters.p2, x: 0.18, vx: -10 },
    },
  }))
  tick()
  assert(get().fighters.p1.x < get().fighters.p2.x, 'close-range movement keeps fighters from passing through each other')
  assert(get().fighters.p1.facing === 1 && get().fighters.p2.facing === -1, 'separated fighters face each other')

  ready()
  tap('KeyW')
  let landedWithDust = false
  for (let index = 0; index < 30; index += 1) {
    tick()
    if (get().fighters.p1.grounded) {
      landedWithDust = get().vfx.some((effect) => effect.kind === 'dustPuff')
      break
    }
  }
  assert(landedWithDust, 'landing spawns a dust puff VFX event')

  ready()
  placeFightersInRange()
  tap('KeyF')
  for (let index = 0; index < 8 && get().fighters.p2.health === 100; index += 1) tick()
  const healthAfterLight = get().fighters.p2.health
  assert(healthAfterLight < 100, 'light attack connects inside its active hitbox')
  assert(get().hitStop > 0, 'landed attack applies brief hit stop')
  assert(get().vfx.some((effect) => effect.kind === 'hitSpark'), 'landed attack spawns a hit spark VFX event')
  tick(12)
  assert(get().fighters.p2.health === healthAfterLight, 'one attack cannot damage repeatedly across active frames')

  ready()
  placeFightersInRange()
  get().setKey('ArrowDown', true)
  tick()
  tap('KeyF')
  for (let index = 0; index < 5 && get().fighters.p2.blockStun === 0; index += 1) tick()
  get().setKey('ArrowDown', false)
  assert(get().fighters.p2.health >= 98 && get().fighters.p2.blockStun > 0, 'blocking reduces damage and applies block stun')
  assert(get().vfx.some((effect) => effect.kind === 'blockSpark'), 'blocked attack spawns a block spark VFX event')

  ready()
  tap('KeyG')
  assert(get().vfx.some((effect) => effect.kind === 'energySlash'), 'heavy attack spawns a directional energy slash VFX event')

  ready()
  useGameStore.setState((state) => ({
    fighters: {
      ...state.fighters,
      p1: { ...state.fighters.p1, meter: 100 },
    },
  }))
  tap('KeyR')
  assert(get().vfx.some((effect) => effect.kind === 'energySlash'), 'special attack spawns a directional energy slash VFX event')

  ready()
  placeFightersInRange()
  useGameStore.setState((state) => ({
    fighters: {
      ...state.fighters,
      p2: { ...state.fighters.p2, health: 1 },
    },
  }))
  tap('KeyG')
  tick(10)
  assert(get().phase === 'ko' && get().winner === 'p1', 'damage can finish a round with the correct winner')
  assert(get().slowMotion > 0 && get().shake > 0.6, 'knockout adds brief slow motion and stronger screen shake')
  get().rematch()
  assert(get().phase === 'fight' && get().fighters.p1.health === 100 && get().fighters.p2.health === 100, 'rematch starts a fresh round')

  ready()
  const timerBeforePause = get().timer
  const xBeforePause = get().fighters.p1.x
  get().togglePause()
  get().setKey('KeyD', true)
  tick(20)
  assert(get().phase === 'paused' && get().timer === timerBeforePause && get().fighters.p1.x === xBeforePause, 'pause freezes timer and movement input')
  get().togglePause()
  tick()
  assert(get().phase === 'fight' && get().fighters.p1.x === xBeforePause, 'resume clears held movement input')

  ready()
  useGameStore.setState({ timer: 0.01 })
  tick()
  assert(get().phase === 'ko' && get().winner === null, 'equal-health timeout ends as a draw')
  get().returnToTitle()
  assert(get().phase === 'title', 'return to title resets the match flow')

  for (const mode of ['ai-easy', 'ai-medium', 'ai-hard']) {
    get().setP2ControlMode(mode)
    get().startMatch()
    tick(44)
    const startingX = get().fighters.p2.x
    tick(8)
    assert(get().p2ControlMode === mode, `${mode} can be selected for Player 2`)
    assert(get().fighters.p2.x < startingX, `${mode} approaches Player 1 through normal movement input`)
    assert(get().fighters.p1.health === 100, `${mode} does not bypass hitboxes or directly change health`)
  }

  ready()
  const p2StartingX = get().fighters.p2.x
  get().setKey('ArrowLeft', true)
  tick(4)
  get().setKey('ArrowLeft', false)
  assert(get().fighters.p2.x < p2StartingX, 'Player Controlled mode keeps Player 2 keyboard movement working')
} finally {
  await rm(directory, { recursive: true, force: true })
}
