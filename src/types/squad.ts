import type { TrainingClass, ArmourType, RaceType, ShieldType, SkillType, VehicleArmourClass, VehicleHullType } from './enums'

export interface WeaponLoadout {
  weaponId: string
  count: number // how many figures in the squad carry this weapon
}

export interface EquipmentItem {
  id: string
  name: string
  pointsCost: number
  description: string
  isVehicleOnly?: boolean
}

// Represents one squad/unit entry on the army sheet
// Matches: Squad | Troops | Training | Armour | Weapons | Equip | Points
export interface SquadSelection {
  selectionId: string // UUID
  squadName: string // e.g. "Alpha Squad", "Tank 1"
  race: RaceType
  isVehicle: boolean

  // Infantry squads
  trainingClass?: TrainingClass
  armourType?: ArmourType
  shieldType?: ShieldType | null
  modelCount?: number
  skills?: SkillType[]
  basePointsPerModel?: number // from points table: armour cost + training cost

  // Vehicle squads
  vehicleHullType?: VehicleHullType
  vehicleArmourClass?: VehicleArmourClass
  vehicleName?: string // e.g. "Medium Battle Tank"
  vehicleBasePoints?: number // hull + movement + accessories

  // Both
  weapons: WeaponLoadout[]
  equipment: string[] // equipment item IDs
  pointsTotal: number // calculated
  moraleValue: number // calculated: 1/trooper or 3/hero/armoured vehicle
  notes: string
}
