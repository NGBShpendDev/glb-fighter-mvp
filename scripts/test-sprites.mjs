import { build } from 'esbuild'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { decodePng } from './lib/png-rgba.mjs'

const directory = await mkdtemp(join(tmpdir(), 'ape-fighter-sprites-'))
const output = join(directory, 'sprite-fighters.mjs')
const requiredAnimations = [
  'idle',
  'walk',
  'jump',
  'block',
  'lightPunch',
  'kick',
  'hit',
  'ko',
  'victory',
]
const optionalAnimations = ['dash', 'heavyPunch', 'special', 'knockdown']
const expectedAnimations = [...requiredAnimations, ...optionalAnimations]

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

  const {
    getSpriteAnimation,
    getSpriteAnimationConfig,
    hasSpriteFrameEvent,
    OPTIONAL_SPRITE_ANIMATIONS,
    REQUIRED_SPRITE_ANIMATIONS,
    resolveSpriteAnimations,
    SPRITE_FIGHTERS,
    SPRITE_OPTIONAL_FALLBACKS,
    SPRITE_PRODUCTION_SPEC,
    SpriteAnimator,
  } = await import(
    `${pathToFileURL(output).href}?test=${Date.now()}`
  )

  assert(
    REQUIRED_SPRITE_ANIMATIONS.join(',') === requiredAnimations.join(','),
    'engine exports the documented required sprite animation catalog',
  )
  assert(
    OPTIONAL_SPRITE_ANIMATIONS.join(',') === optionalAnimations.join(','),
    'engine exports the documented optional sprite animation catalog',
  )
  assert(
    SPRITE_PRODUCTION_SPEC.frameWidth === 512 &&
      SPRITE_PRODUCTION_SPEC.frameHeight === 512 &&
      SPRITE_PRODUCTION_SPEC.transparentBackground &&
      SPRITE_PRODUCTION_SPEC.layout === 'single-horizontal-row',
    'engine exposes the 512x512 transparent one-row production format',
  )
  assert(
    SPRITE_OPTIONAL_FALLBACKS.dash === 'walk' &&
      SPRITE_OPTIONAL_FALLBACKS.heavyPunch === 'lightPunch' &&
      SPRITE_OPTIONAL_FALLBACKS.special === 'kick' &&
      SPRITE_OPTIONAL_FALLBACKS.knockdown === 'ko',
    'optional animations expose the documented safe visual fallback map',
  )
  assert(
    Object.entries({
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
    }).every(([name, frameCount]) => SPRITE_PRODUCTION_SPEC.recommendedFrameCounts[name] === frameCount),
    'engine exposes the documented recommended production frame counts',
  )

  for (const [id, config] of Object.entries(SPRITE_FIGHTERS)) {
    const resolvedAnimations = resolveSpriteAnimations(config)
    await access(`public/assets/fighters/${id}`)
    assert(config.scale > 0, `${id} sprite scale is positive`)
    assert(Math.abs(config.sourceFacing) === 1, `${id} declares a left- or right-facing source sprite direction`)
    assert(config.originX >= 0 && config.originX <= 1 && config.originY >= 0 && config.originY <= 1, `${id} exposes a normalized sprite pivot`)
    assert(
      (config.frameWidth === undefined && config.frameHeight === undefined) ||
        (config.frameWidth > 0 && config.frameHeight > 0),
      `${id} uses inferred frame dimensions or positive overrides`,
    )
    assert(
      requiredAnimations.every((name) => config.animations[name]),
      `${id} config includes every required animation`,
    )
    assert(
      expectedAnimations.every((name) => resolvedAnimations[name].file.startsWith('/assets/fighters/')),
      `${id} resolved animation paths use Vite public asset URLs`,
    )
    assert(
      expectedAnimations.every((name) => {
        const animation = resolvedAnimations[name]
        return (
          typeof animation.loop === 'boolean' &&
          typeof animation.holdLastFrame === 'boolean' &&
          typeof animation.restartOnEnter === 'boolean' &&
          animation.priority > 0 &&
          Array.isArray(animation.cancelWindows) &&
          Array.isArray(animation.frameEvents)
        )
      }),
      `${id} resolved animations expose fighting-game playback controls`,
    )
  }

  const fighter1 = SPRITE_FIGHTERS['fighter-1']
  const expectedFighter1Frames = {
    idle: 4,
    walk: 6,
    dash: 5,
    jump: 4,
    block: 3,
    lightPunch: 6,
    heavyPunch: 7,
    kick: 7,
    special: 8,
    hit: 3,
    knockdown: 6,
    ko: 6,
    victory: 4,
  }
  assert(
    Object.entries(expectedFighter1Frames).every(
      ([name, frameCount]) => fighter1.animations[name].frameCount === frameCount,
    ),
    'fighter-1 uses the submitted animation frame counts',
  )
  assert(
    fighter1.animations.lightPunch.file.endsWith('/light-punch.png'),
    'fighter-1 maps lightPunch to the submitted hyphenated filename',
  )
  assert(
    fighter1.animations.kick.file.endsWith('/kick.png'),
    'fighter-1 maps kick to the submitted kick sheet',
  )
  assert(
    fighter1.animations.kick.fallbackAnimation === 'lightPunch',
    'fighter-1 kick has a graceful sheet fallback if its asset fails',
  )
  assert(
    fighter1.animations.dash.fallbackAnimation === 'walk' &&
      fighter1.animations.heavyPunch.fallbackAnimation === 'lightPunch' &&
      fighter1.animations.special.fallbackAnimation === 'kick' &&
      fighter1.animations.knockdown.fallbackAnimation === 'ko',
    'fighter-1 upgraded move sheets retain safe visual fallbacks',
  )
  assert(
    fighter1.animations.lightPunch.attackPhases.activeFrames.join(',') === '2,3' &&
      hasSpriteFrameEvent(fighter1.animations.lightPunch, 2, 'hitbox-active') &&
      !hasSpriteFrameEvent(fighter1.animations.lightPunch, 1, 'hitbox-active'),
    'fighter-1 light punch exposes frame-driven startup, hit, and recovery timing',
  )
  await access('public/assets/fighters/fighter-1/anchor.png')
  assert(Boolean(fighter1.anchorPath), 'fighter-1 exposes its anchor reference path')
  await access('public/assets/fighters/fighter-1/portrait.png')
  assert(Boolean(fighter1.portraitPath), 'fighter-1 exposes its character-select portrait path')
  for (const animationName of ['lightPunch', 'kick', 'ko', 'dash', 'heavyPunch', 'special', 'knockdown']) {
    const animation = fighter1.animations[animationName]
    const file = await readFile(`public${animation.file}`)
    const image = decodePng(file)
    assert(
      image.width % animation.frameCount === 0,
      `fighter-1 ${animationName} sheet slices into whole-pixel frames`,
    )
  }

  const fighter2 = SPRITE_FIGHTERS['fighter-2']
  const expectedFighter2Frames = {
    idle: 4,
    walk: 6,
    dash: 5,
    jump: 4,
    block: 3,
    lightPunch: 6,
    heavyPunch: 7,
    kick: 7,
    special: 8,
    hit: 3,
    knockdown: 6,
    ko: 6,
    victory: 4,
  }
  assert(
    Object.entries(expectedFighter2Frames).every(
      ([name, frameCount]) => fighter2.animations[name].frameCount === frameCount,
    ),
    'fighter-2 uses the submitted animation frame counts',
  )
  assert(
    fighter2.animations.lightPunch.file.endsWith('/light-punch.png'),
    'fighter-2 maps lightPunch to the submitted hyphenated filename',
  )
  assert(
    fighter2.animations.dash.fallbackAnimation === 'walk' &&
      fighter2.animations.heavyPunch.fallbackAnimation === 'lightPunch' &&
      fighter2.animations.kick.fallbackAnimation === 'lightPunch' &&
      fighter2.animations.special.fallbackAnimation === 'kick' &&
      fighter2.animations.knockdown.fallbackAnimation === 'ko',
    'fighter-2 upgraded move sheets retain safe visual fallbacks',
  )
  assert(
    fighter2.animations.lightPunch.attackPhases.activeFrames.join(',') === '2,3' &&
      hasSpriteFrameEvent(fighter2.animations.lightPunch, 2, 'hitbox-active') &&
      !hasSpriteFrameEvent(fighter2.animations.lightPunch, 1, 'hitbox-active'),
    'fighter-2 light punch exposes frame-driven startup, hit, and recovery timing',
  )
  await access('public/assets/fighters/fighter-2/anchor.png')
  assert(Boolean(fighter2.anchorPath), 'fighter-2 exposes its anchor reference path')
  await access('public/assets/fighters/fighter-2/portrait.png')
  assert(Boolean(fighter2.portraitPath), 'fighter-2 exposes its character-select portrait path')
  for (const animationName of ['lightPunch', 'kick', 'ko', 'dash', 'heavyPunch', 'special', 'knockdown']) {
    const animation = fighter2.animations[animationName]
    const file = await readFile(`public${animation.file}`)
    const image = decodePng(file)
    assert(
      image.width % animation.frameCount === 0,
      `fighter-2 ${animationName} sheet slices into whole-pixel frames`,
    )
  }

  const submittedSheets = {
    'fighter-1': ['idle', 'walk', 'dash', 'jump', 'block', 'light-punch', 'heavy-punch', 'kick', 'special', 'hit', 'knockdown', 'ko', 'victory', 'portrait'],
    'fighter-2': ['idle', 'walk', 'dash', 'jump', 'block', 'light-punch', 'heavy-punch', 'kick', 'special', 'hit', 'knockdown', 'ko', 'victory', 'portrait'],
  }
  for (const [fighterId, fileNames] of Object.entries(submittedSheets)) {
    for (const fileName of fileNames) {
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
    dashTime: 0,
    vx: 0,
  }

  assert(getSpriteAnimation(fighter) === 'idle', 'idle state selects idle animation')
  assert(getSpriteAnimation({ ...fighter, vx: 2 }) === 'walk', 'movement selects walk animation')
  assert(getSpriteAnimation({ ...fighter, dashTime: 0.1, vx: 2 }) === 'dash', 'dash movement selects optional dash animation')
  assert(getSpriteAnimation({ ...fighter, grounded: false }) === 'jump', 'airborne state selects jump animation')
  assert(
    getSpriteAnimation({ ...fighter, grounded: false, attack: { type: 'kick' } }) === 'kick',
    'airborne attacks keep their attack animation instead of being hidden by jump playback',
  )
  assert(getSpriteAnimation({ ...fighter, blocking: true }) === 'block', 'blocking selects block animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'light' } }) === 'lightPunch', 'punch selects lightPunch animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'heavy' } }) === 'heavyPunch', 'heavy punch selects heavyPunch animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'kick' } }) === 'kick', 'kick selects kick animation')
  assert(getSpriteAnimation({ ...fighter, attack: { type: 'special' } }) === 'special', 'special selects special animation')
  assert(getSpriteAnimation({ ...fighter, hitStun: 0.2 }) === 'hit', 'hit stun selects hit animation')
  assert(getSpriteAnimation({ ...fighter, ko: true }) === 'ko', 'knockout selects ko animation')
  assert(getSpriteAnimation({ ...fighter, victorious: true }) === 'victory', 'winner selects victory animation')

  const animator = new SpriteAnimator('idle')
  const resolvedFighter1Animations = resolveSpriteAnimations(fighter1)
  const enterPunch = animator.update({
    animations: resolvedFighter1Animations,
    desiredAnimation: 'lightPunch',
    delta: 0,
    frozen: false,
    paused: false,
    stepRequest: 0,
  })
  assert(enterPunch.entered && enterPunch.animation === 'lightPunch', 'higher-priority attack enters once from idle')
  animator.update({
    animations: resolvedFighter1Animations,
    desiredAnimation: 'lightPunch',
    delta: 1 / fighter1.animations.lightPunch.fps,
    frozen: false,
    paused: false,
    stepRequest: 0,
  })
  const punchContinues = animator.update({
    animations: resolvedFighter1Animations,
    desiredAnimation: 'lightPunch',
    delta: 0,
    frozen: false,
    paused: false,
    stepRequest: 0,
  })
  assert(!punchContinues.entered && punchContinues.frameIndex === 1, 'active animation does not restart every frame')

  const enterKo = animator.update({
    animations: resolvedFighter1Animations,
    desiredAnimation: 'ko',
    delta: 0,
    frozen: false,
    paused: false,
    stepRequest: 0,
  })
  assert(enterKo.entered && enterKo.animation === 'ko', 'KO priority interrupts lower-priority animation')
  const heldKo = animator.update({
    animations: resolvedFighter1Animations,
    desiredAnimation: 'ko',
    delta: 3,
    frozen: false,
    paused: false,
    stepRequest: 0,
  })
  assert(heldKo.finished && heldKo.frameIndex === fighter1.animations.ko.frameCount - 1, 'KO plays once and holds its final frame')
} finally {
  await rm(directory, { recursive: true, force: true })
}
