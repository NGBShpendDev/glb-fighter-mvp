import type { VfxEvent, VfxKind } from './types'

export type VfxAsset = {
  imagePath: string
  columns: number
  rows: number
  frames: number[]
  size: [number, number]
  life: number
  additive?: boolean
}

export const MAX_ACTIVE_VFX = 28

export const VFX_ASSETS: Record<VfxKind, VfxAsset> = {
  hitSpark: {
    imagePath: '/assets/vfx/hit-sparks.png',
    columns: 4,
    rows: 2,
    frames: [0, 3, 4, 7],
    size: [1.65, 1.65],
    life: 0.24,
    additive: true,
  },
  blockSpark: {
    imagePath: '/assets/vfx/hit-sparks.png',
    columns: 4,
    rows: 2,
    frames: [2, 6, 2],
    size: [1.72, 1.72],
    life: 0.18,
    additive: true,
  },
  dustPuff: {
    imagePath: '/assets/vfx/dust-puff.png',
    columns: 7,
    rows: 1,
    frames: [0, 1, 2, 3, 4, 5, 6],
    size: [1.62, 0.92],
    life: 0.38,
  },
  energySlash: {
    imagePath: '/assets/vfx/energy-slash.png',
    columns: 7,
    rows: 1,
    frames: [0, 1, 2, 3, 4, 5, 6],
    size: [2.15, 3.05],
    life: 0.42,
    additive: true,
  },
}

export const createVfxEvent = (
  id: number,
  kind: VfxKind,
  x: number,
  y: number,
  direction: 1 | -1,
  scale = 1,
  z = 1.35,
): VfxEvent => ({
  id,
  kind,
  x,
  y,
  z,
  age: 0,
  life: VFX_ASSETS[kind].life,
  direction,
  scale,
})
