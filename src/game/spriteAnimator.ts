export type SpriteAnimationName =
  | 'idle'
  | 'walk'
  | 'dash'
  | 'jump'
  | 'block'
  | 'lightPunch'
  | 'heavyPunch'
  | 'kick'
  | 'special'
  | 'hit'
  | 'knockdown'
  | 'ko'
  | 'victory'

export type SpriteFrameEventName = 'hitbox-active' | 'attack-sound'

export type SpriteFrameEvent = {
  frame: number
  type: SpriteFrameEventName
}

export type SpriteCancelWindow = {
  fromFrame: number
  toFrame: number
  into?: SpriteAnimationName[]
}

export type SpriteAttackPhases = {
  startupFrames: number[]
  activeFrames: number[]
  recoveryFrames: number[]
}

export type SpriteAnimationConfig = {
  file: string
  frameCount: number
  fps: number
  loop: boolean
  holdLastFrame: boolean
  restartOnEnter: boolean
  priority: number
  cancelWindows: SpriteCancelWindow[]
  frameEvents: SpriteFrameEvent[]
  attackPhases?: SpriteAttackPhases
  fallbackAnimation?: SpriteAnimationName
  scale?: number
  offsetX?: number
  offsetY?: number
  originX?: number
  originY?: number
  hitFrames?: number[]
  soundEventFrame?: number
}

export type SpriteAnimatorSnapshot = {
  animation: SpriteAnimationName
  frameIndex: number
  finished: boolean
  entered: boolean
}

export const SPRITE_ANIMATION_PRIORITY = {
  idle: 10,
  walk: 20,
  dash: 25,
  jump: 30,
  block: 40,
  attack: 50,
  knockdown: 55,
  hit: 60,
  ko: 70,
  victory: 65,
} as const

export const getSpriteFrameIndex = (animation: SpriteAnimationConfig, elapsed: number) => {
  const frame = Math.floor(elapsed * animation.fps)
  if (animation.loop) return frame % animation.frameCount
  return Math.min(animation.frameCount - 1, frame)
}

export const isSpriteAnimationFinished = (animation: SpriteAnimationConfig, elapsed: number) =>
  !animation.loop && elapsed >= animation.frameCount / animation.fps

export const hasSpriteFrameEvent = (
  animation: SpriteAnimationConfig,
  frameIndex: number,
  eventName: SpriteFrameEventName,
) => animation.frameEvents.some((event) => event.frame === frameIndex && event.type === eventName)

const isCancelWindowOpen = (
  animation: SpriteAnimationConfig,
  frameIndex: number,
  nextAnimation: SpriteAnimationName,
) =>
  animation.cancelWindows.some(
    (window) =>
      frameIndex >= window.fromFrame &&
      frameIndex <= window.toFrame &&
      (!window.into || window.into.includes(nextAnimation)),
  )

export const canEnterSpriteAnimation = (
  currentName: SpriteAnimationName,
  current: SpriteAnimationConfig,
  currentFrame: number,
  currentFinished: boolean,
  nextName: SpriteAnimationName,
  next: SpriteAnimationConfig,
) => {
  if (nextName === currentName) return false
  if (next.priority > current.priority) return true
  if (current.loop || currentFinished) return true
  return isCancelWindowOpen(current, currentFrame, nextName)
}

export class SpriteAnimator {
  animation: SpriteAnimationName
  elapsed = 0
  frameIndex = 0
  finished = false
  private lastStepRequest = 0

  constructor(initialAnimation: SpriteAnimationName) {
    this.animation = initialAnimation
  }

  private enter(animationName: SpriteAnimationName, animation: SpriteAnimationConfig) {
    if (animationName === this.animation) return false
    this.animation = animationName
    if (animation.restartOnEnter) {
      this.elapsed = 0
      this.frameIndex = 0
      this.finished = false
    }
    return true
  }

  update({
    animations,
    desiredAnimation,
    delta,
    frozen,
    paused,
    stepRequest,
    forcePreview = false,
  }: {
    animations: Record<SpriteAnimationName, SpriteAnimationConfig>
    desiredAnimation: SpriteAnimationName
    delta: number
    frozen: boolean
    paused: boolean
    stepRequest: number
    forcePreview?: boolean
  }): SpriteAnimatorSnapshot {
    let current = animations[this.animation]
    const desired = animations[desiredAnimation]
    let entered = false

    if (
      forcePreview ||
      canEnterSpriteAnimation(
        this.animation,
        current,
        this.frameIndex,
        this.finished,
        desiredAnimation,
        desired,
      )
    ) {
      entered = this.enter(desiredAnimation, desired)
      current = animations[this.animation]
    }

    const shouldStep = paused && stepRequest !== this.lastStepRequest
    this.lastStepRequest = stepRequest
    if ((!frozen && !paused) || shouldStep) {
      this.elapsed += shouldStep ? 1 / current.fps : delta
      this.finished = isSpriteAnimationFinished(current, this.elapsed)
      this.frameIndex = getSpriteFrameIndex(current, this.elapsed)
    }

    if (!current.loop && this.finished && !current.holdLastFrame) {
      this.frameIndex = 0
    }

    return {
      animation: this.animation,
      frameIndex: this.frameIndex,
      finished: this.finished,
      entered,
    }
  }
}
