import { build } from 'esbuild'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const directory = await mkdtemp(join(tmpdir(), 'ape-fighter-sprites-'))
const output = join(directory, 'sprite-fighters.mjs')
const expectedAnimations = [
  'idle',
  'walk',
  'jump',
  'block',
  'lightPunch',
  'heavyPunch',
  'kick',
  'special',
  'hit',
  'ko',
  'victory',
]

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
  console.log(`PASS ${message}`)
}

try {
  await build({
    entryPoints: ['src/game/spriteFighters.ts'],
    outfile: output,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  })

  const { getSpriteAnimation, SPRITE_FIGHTERS } = await import(
    `${pathToFileURL(output).href}?test=${Date.now()}`
  )

  for (const [id, config] of Object.entries(SPRITE_FIGHTERS)) {
    await access(`public/assets/fighters/${id}`)
    assert(config.scale > 0, `${id} sprite scale is positive`)
    assert(
      (config.frameWidth === undefined && config.frameHeight === undefined) ||
        (config.frameWidth > 0 && config.frameHeight > 0),
      `${id} uses inferred frame dimensions or positive overrides`,
    )
    assert(
      expectedAnimations.every((name) => config.animations[name]),
      `${id} config includes every required animation`,
    )
    assert(
      expectedAnimations.every((name) => config.animations[name].filePath.startsWith('/assets/fighters/')),
      `${id} animation paths use Vite public asset URLs`,
    )
  }

  const fighter1 = SPRITE_FIGHTERS['fighter-1']
  const expectedFighter1Frames = {
    idle: 4,
    walk: 6,
    jump: 4,
    block: 3,
    lightPunch: 5,
    kick: 5,
    hit: 3,
    ko: 5,
    victory: 4,
  }
  assert(
    Object.entries(expectedFighter1Frames).every(
      ([name, frameCount]) => fighter1.animations[name].frameCount === frameCount,
    ),
    'fighter-1 uses the submitted animation frame counts',
  )
  assert(
    fighter1.animations.lightPunch.filePath.endsWith('/light-punch.png'),
    'fighter-1 maps lightPunch to the submitted hyphenated filename',
  )
  assert(
    fighter1.animations.kick.filePath.endsWith('/kick.png'),
    'fighter-1 maps kick to the submitted kick sheet',
  )
  assert(
    fighter1.animations.kick.fallbackAnimation === 'lightPunch',
    'fighter-1 kick has a graceful sheet fallback if its asset fails',
  )
  await access('public/assets/fighters/fighter-1/anchor.png')
  assert(Boolean(fighter1.anchorPath), 'fighter-1 exposes its anchor reference path')

  const fighter2 = SPRITE_FIGHTERS['fighter-2']
  const expectedFighter2Frames = {
    idle: 4,
    walk: 6,
    jump: 4,
    block: 3,
    lightPunch: 5,
    kick: 5,
    hit: 3,
    ko: 5,
    victory: 4,
  }
  assert(
    Object.entries(expectedFighter2Frames).every(
      ([name, frameCount]) => fighter2.animations[name].frameCount === frameCount,
    ),
    'fighter-2 uses the submitted animation frame counts',
  )
  assert(
    fighter2.animations.lightPunch.filePath.endsWith('/light-punch.png'),
    'fighter-2 maps lightPunch to the submitted hyphenated filename',
  )
  assert(
    fighter2.animations.heavyPunch.fallbackAnimation === 'lightPunch' &&
      fighter2.animations.special.fallbackAnimation === 'kick',
    'fighter-2 missing move sheets gracefully reuse the closest submitted animations',
  )
  await access('public/assets/fighters/fighter-2/anchor.png')
  assert(Boolean(fighter2.anchorPath), 'fighter-2 exposes its anchor reference path')

  const submittedSheets = ['idle', 'walk', 'jump', 'block', 'light-punch', 'kick', 'hit', 'ko', 'victory']
  for (const fighterId of ['fighter-1', 'fighter-2']) {
    for (const fileName of submittedSheets) {
      const file = await readFile(`public/assets/fighters/${fighterId}/${fileName}.png`)
      assert(
        file.subarray(1, 4).toString() === 'PNG',
        `${fighterId} ${fileName}.png is a readable PNG sprite sheet`,
      )
    }
  }

  const fighter = {
    ko: false,
    victorious: false,
    hitStun: 0,
    blockStun: 0,
    blocking: false,
    grounded: true,
    attack: null,
    vx: 0,
  }

  assert(getSpriteAnimation(fighter) === 'idle', 'idle state selects idle animation')
  assert(getSpriteAnimation({ ...fighter, vx: 2 }) === 'walk', 'movement selects walk animation')
  assert(getSpriteAnimation({ ...fighter, grounded: false }) === 'jump', 'airborne state selects jump animation')
  assert(getSpriteAnimation({ ...fighter, blocking: true }) === 'block', 'blocking selects block animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'light' } }) === 'lightPunch', 'punch selects lightPunch animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'heavy' } }) === 'heavyPunch', 'heavy punch selects heavyPunch animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'kick' } }) === 'kick', 'kick selects kick animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'special' } }) === 'special', 'special selects special animation')
  assert(getSpriteAnimation({ ...fighter, hitStun: 0.2 }) === 'hit', 'hit stun selects hit animation')
  assert(getSpriteAnimation({ ...fighter, ko: true }) === 'ko', 'knockout selects ko animation')
  assert(getSpriteAnimation({ ...fighter, victorious: true }) === 'victory', 'winner selects victory animation')
} finally {
  await rm(directory, { recursive: true, force: true })
}
