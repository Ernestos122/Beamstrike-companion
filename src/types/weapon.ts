import type { ImpactType, WeaponCategory, RaceType, SkillType } from './enums'

// Range bands — to-hit score needed on 2d6, null = out of range, 'CNF' = cannot fire from that band
export type ToHitValue = number | 'CNF' | null

export interface RangeBands {
  band0_4: ToHitValue
  band5_20: ToHitValue
  band21_40: ToHitValue
  band41_80: ToHitValue
  band81plus: ToHitValue
}

export interface Weapon {
  id: string
  code: string // e.g. "AR", "SMG", "HSL"
  name: string
  category: WeaponCategory
  toHit: RangeBands
  maxRange: number | null // in inches; null = unlimited (e.g. demolition pack 1")
  impact: ImpactType | 'SPECIAL' | 'VARIES'
  avImpact?: ImpactType // vehicle-mounted weapons: AV round impact
  heImpact?: ImpactType // vehicle-mounted weapons: HE round impact
  fireTemplate?: 1 | 2 | 3 | 4 | 5 // triangular cone template (1=short, 2=rifle, 3=support, 4-5=heavy burst)
  meleeBonus?: number // H2H combat modifier (melee weapons only)
  blastTemplate?: 1 | 2 | 3 | 4 // circular blast template
  optionOrMust: 'OPTION' | 'MUST' | null // whether template use is optional or mandatory
  shotsPerPhase?: number // e.g. 2 for HMG, 3 for MIN
  mainGunSize?: 1 | 2 | 3 | 4 | 'A' // vehicle main gun size class
  pointsCost: number
  causesSupp: boolean // weapon causes suppression (marked * in max range)
  requiresDeployment: boolean // must be deployed before firing
  requiresSkill?: SkillType // e.g. SNIPER for SL, SNR, HSR
  racesAllowed?: RaceType[] // null/undefined = any race
  remarks: string
}
