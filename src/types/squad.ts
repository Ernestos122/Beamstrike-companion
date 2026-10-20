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
  casteId?: string       // aliens-troops.json entry id — drives natural attacks and correct movement in views
}

export type VehicleMode = 'BUILD' | 'PRESET' | 'CUSTOM'

export interface AccessoryLoadout {
  id: string
  count: number
}

// Weapon + how many are mounted. Used for vehicle weapons (and by the v2→v3 migration).
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
  // BUILD:  rulebook tank builder — points from hull + movement + crew + weapons + accessories
  // PRESET: rulebook example vehicle at its printed price + crew + extra weapons in spare fitments
  // CUSTOM: hand-entered base points + weapons + equipment (all vehicles saved before BUILD existed)
  vehicleMode?: VehicleMode          // undefined = CUSTOM
  vehicleHullType?: VehicleHullType  // BUILD: id of a vehicle-builder.json hull
  vehicleArmourClass?: VehicleArmourClass // CUSTOM only; BUILD takes it from the hull
  vehicleName?: string
  vehiclePresetId?: string           // PRESET: vehicle-presets.json id
  vehicleMovementId?: string         // BUILD: vehicle-builder.json movement type id
  vehicleCrew?: TrainingClass        // crew rating; undefined = REGULAR
  vehicleAccessories?: AccessoryLoadout[] // BUILD: vehicle-builder.json accessories
  vehicleBasePoints?: number      // CUSTOM: hull + movement base cost
  vehicleWeapons?: WeaponLoadout[] // weapons mounted on the vehicle
  vehicleEquipment?: string[]      // CUSTOM: equipment.json IDs on the vehicle

  // Both
  pointsTotal: number   // calculated
  moraleValue: number   // calculated
  notes: string
}
