import type { SpriteAnimationConfig, SpriteFighterConfig } from '../../src/game/spriteFighters'

const animation = (
  file: string,
  frameCount: number,
  fps: number,
  loop: boolean,
  tuning: Partial<SpriteAnimationConfig> = {},
): SpriteAnimationConfig => ({
  file: `/assets/fighters/my-fighter/${file}`,
  frameCount,
  fps,
  loop,
  holdLastFrame: !loop,
  restartOnEnter: true,
  priority: tuning.priority ?? 10,
  cancelWindows: tuning.cancelWindows ?? [],
  frameEvents: tuning.frameEvents ?? [],
  ...tuning,
})

// Add "my-fighter" to SpriteFighterId before moving this example into the roster.
export const upgradedSpriteFighterExample = {
  id: 'my-fighter',
  name: 'MY FIGHTER',
  sourceFacing: 1,
  scale: 3.05,
  horizontalOffset: 0,
  verticalOffset: 0,
  originX: 0.5,
  originY: 0,
  anchorPath: '/assets/fighters/my-fighter/anchor.png',
  portraitPath: '/assets/fighters/my-fighter/portrait.png',
  frameWidth: 512,
  frameHeight: 512,
  animations: {
    idle: animation('idle.png', 8, 8, true),
    walk: animation('walk.png', 8, 12, true),
    dash: animation('dash.png', 5, 16, false, { priority: 25 }),
    jump: animation('jump.png', 6, 10, false, { priority: 30 }),
    block: animation('block.png', 4, 8, true, { priority: 40 }),
    lightPunch: animation('light-punch.png', 6, 15, false, {
      priority: 50,
      hitFrames: [2],
      attackPhases: { startupFrames: [0, 1], activeFrames: [2], recoveryFrames: [3, 4, 5] },
      frameEvents: [{ frame: 2, type: 'hitbox-active' }],
    }),
    heavyPunch: animation('heavy-punch.png', 7, 13, false, {
      priority: 50,
      hitFrames: [3],
      attackPhases: { startupFrames: [0, 1, 2], activeFrames: [3], recoveryFrames: [4, 5, 6] },
      frameEvents: [{ frame: 3, type: 'hitbox-active' }],
    }),
    kick: animation('kick.png', 7, 14, false, {
      priority: 50,
      hitFrames: [3, 4],
      attackPhases: { startupFrames: [0, 1, 2], activeFrames: [3, 4], recoveryFrames: [5, 6] },
      frameEvents: [{ frame: 3, type: 'hitbox-active' }, { frame: 4, type: 'hitbox-active' }],
    }),
    special: animation('special.png', 8, 12, false, {
      priority: 50,
      hitFrames: [3, 4],
      attackPhases: { startupFrames: [0, 1, 2], activeFrames: [3, 4], recoveryFrames: [5, 6, 7] },
      frameEvents: [{ frame: 3, type: 'hitbox-active' }, { frame: 4, type: 'hitbox-active' }],
    }),
    hit: animation('hit.png', 4, 11, false, { priority: 60 }),
    knockdown: animation('knockdown.png', 6, 9, false, { priority: 55 }),
    ko: animation('ko.png', 6, 7, false, { priority: 70 }),
    victory: animation('victory.png', 6, 8, true, { priority: 65 }),
  },
} satisfies Omit<SpriteFighterConfig, 'id'> & { id: string }
