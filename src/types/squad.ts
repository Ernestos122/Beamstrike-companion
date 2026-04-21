import type { TrainingClass, ArmourType, RaceType, SkillType, VehicleArmourClass, VehicleHullType } from './enums'

// One figure type within a squad.
// All figures in this line share identical loadouts — same training, armour,
// weapons, equipment, and skills. Cost = count × per-figure total.
export interface TrooperLine {
  id: string            // UUID — stable key for React list rendering
  label: string         // figure description, e.g. "Scout Leader", "Sniper"
  count: number         // how many figures of this type
  trainingClass: TrainingClass
  armourType: ArmourType
  weapons: string[]     // weapon IDs — every figure in the line carries all of these
  equipment: string[]   // equipment IDs — every figure has all of these
  skills: SkillType[]   // skill IDs — every figure has all of these
  troopBaseCost?: number // when set (alien troop type selected), replaces armour+training in cost calc
}

// Legacy shape used only by the v2→v3 migration.
// Do NOT use this for new code.
export interface WeaponLoadout {
  weaponId: string
  count: number
}

export interface EquipmentItem {
  id: string
  name: string
  pointsCost: number
  description: string
  isVehicleOnly?: boolean
}

// One squad / unit entry on the army list.
export interface SquadSelection {
  selectionId: string
  squadName: string
  race: RaceType
  isVehicle: boolean

  // Infantry — list of distinct figure types
  troopers: TrooperLine[]

  // Vehicle — kept as a flat model (vehicles don't "level up" like troopers do)
  vehicleHullType?: VehicleHullType
  vehicleArmourClass?: VehicleArmourClass
  vehicleName?: string
  vehicleBasePoints?: number      // hull + movement base cost
  vehicleWeapons?: WeaponLoadout[] // weapons mounted on the vehicle
  vehicleEquipment?: string[]      // equipment IDs on the vehicle

  // Both
  pointsTotal: number   // calculated
  moraleValue: number   // calculated
  notes: string
}
