import type { SkirmishTraining, SkirmishArmour, SkirmishFigure } from '@types-bs/skirmish'
import { allWeapons } from '@data/index'

const TRAINING_COST: Record<SkirmishTraining, number> = {
  CIV: 0, REG: 2, VET: 5, ELITE: 10, HERO: 20,
}

const ARMOUR_COST: Record<SkirmishArmour, number> = {
  UA: 2, FI: 5, LA: 8, PA: 18, AD: 27,
}

export const TRAINING_TO_HIT: Record<SkirmishTraining, number> = {
  CIV: 0, REG: 1, VET: 2, ELITE: 3, HERO: 4,
}

export const TRAINING_MELEE: Record<SkirmishTraining, number> = {
  CIV: -1, REG: 0, VET: 1, ELITE: 2, HERO: 3,
}

export const TRAINING_NERVE: Record<SkirmishTraining, number> = {
  CIV: 2, REG: 3, VET: 4, ELITE: 5, HERO: 6,
}

export function calcFigurePoints(
  training: SkirmishTraining,
  armour: SkirmishArmour,
  weaponIds: string[],
): number {
  const base = TRAINING_COST[training] + ARMOUR_COST[armour]
  const weaponTotal = weaponIds.reduce((sum, id) => {
    const w = allWeapons.find(w => w.id === id)
    return sum + (w ? (w.pointsCost ?? 0) : 0)
  }, 0)
  return base + weaponTotal
}

export function calcWarbandPoints(figures: SkirmishFigure[]): number {
  return figures.reduce((sum, f) => sum + f.points, 0)
}
