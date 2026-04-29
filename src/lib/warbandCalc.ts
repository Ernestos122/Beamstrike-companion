import type { SkirmishTraining, SkirmishArmour, SkirmishFigure } from '@types-bs/skirmish'
import { allWeapons, equipment as equipmentData } from '@data/index'

// ── Damage Table ──────────────────────────────────────────────────────────────
// Rows = D6 rolls 1-6. Columns = [UA, FI, LA, PA, AD].
// Matches the main Beamstrike Infantry Damage Table exactly.
export type SkirmishDamageResult = 'NE' | 'Stun' | 'GH' | 'Kill'

const ARMOUR_COL: Record<SkirmishArmour, number> = { UA: 0, FI: 1, LA: 2, PA: 3, AD: 4 }

// Each entry: 6 rows (roll 1..6), each row: [UA, FI, LA, PA, AD]
const DAMAGE_TABLE: Record<string, SkirmishDamageResult[][]> = {
  'STUN':    [
    ['GH',   'NE',   'NE',   'NE',   'NE'],
    ['Stun', 'GH',   'NE',   'NE',   'NE'],
    ['Stun', 'Stun', 'NE',   'NE',   'NE'],
    ['Stun', 'Stun', 'GH',   'NE',   'NE'],
    ['Stun', 'Stun', 'Stun', 'NE',   'NE'],
    ['Stun', 'Stun', 'Stun', 'GH',   'NE'],
  ],
  'LOW':     [
    ['GH',   'NE',   'NE',   'NE',   'NE'],
    ['Kill', 'GH',   'NE',   'NE',   'NE'],
    ['Kill', 'Kill', 'NE',   'NE',   'NE'],
    ['Kill', 'Kill', 'GH',   'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
  ],
  'STANDARD': [
    ['Kill', 'GH',   'NE',   'NE',   'NE'],
    ['Kill', 'Kill', 'NE',   'NE',   'NE'],
    ['Kill', 'Kill', 'GH',   'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
  ],
  'HIGH':    [
    ['Kill', 'Kill', 'NE',   'NE',   'NE'],
    ['Kill', 'Kill', 'GH',   'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
  ],
  'POWER':   [
    ['Kill', 'Kill', 'GH',   'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
    ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
  ],
  'TOTAL_1': [
    ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
  ],
  'TOTAL_2': [
    ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
  ],
  'TOTAL_3': [
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
  ],
}

/** Map a weapon's impact string to the damage table key. SPECIAL/VARIES → STANDARD. */
export function impactToTableKey(impact: string): string {
  if (impact === 'SPECIAL' || impact === 'VARIES') return 'STANDARD'
  return impact.replace(' ', '_')
}

/** Roll 1D6, look up result in the Infantry Damage Table. */
export function lookupDamage(impact: string, roll: number, armour: SkirmishArmour): SkirmishDamageResult {
  const key = impactToTableKey(impact)
  const rows = DAMAGE_TABLE[key]
  if (!rows) return 'NE'
  return rows[roll - 1][ARMOUR_COL[armour]]
}

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

/** Max skills a figure may have allocated during warband building (by training). */
export const SKILL_LIMIT: Record<SkirmishTraining, number> = {
  CIV: 0, REG: 0, VET: 1, ELITE: 2, HERO: 3,
}

/** Armour save labels for display. */
export const ARMOUR_SAVE: Record<SkirmishArmour, string> = {
  UA: 'No save', FI: '6+', LA: '5+', PA: '4+', AD: '3+',
}

export function calcFigurePoints(
  training: SkirmishTraining,
  armour: SkirmishArmour,
  weaponIds: string[],
  equipmentIds: string[] = [],
): number {
  const base = TRAINING_COST[training] + ARMOUR_COST[armour]
  const weaponTotal = weaponIds.reduce((sum, id) => {
    const w = allWeapons.find(w => w.id === id)
    return sum + (w ? (w.pointsCost ?? 0) : 0)
  }, 0)
  const equipTotal = equipmentIds.reduce((sum, id) => {
    const e = (equipmentData as { id: string; pointsCost: number }[]).find(e => e.id === id)
    return sum + (e?.pointsCost ?? 0)
  }, 0)
  return base + weaponTotal + equipTotal
}

export function calcWarbandPoints(figures: SkirmishFigure[]): number {
  return figures.reduce((sum, f) => sum + f.points, 0)
}
