import type { TrainingClass, VehicleArmourClass, VehicleHullType } from './enums'

// Which column of the Vehicle Effect of Penetration chart a vehicle uses
export type VehicleFamily = 'BIKE' | 'CAR' | 'AIRCRAFT' | 'TANK' | 'WALKER' | 'MECHA'

// One row of the Armoured Vehicle Builder Chart (rulebook p.32)
export interface VehicleHull {
  id: VehicleHullType
  name: string
  abbr: string
  hullClass: VehicleArmourClass
  armourFSR: [number, number, number] // optional advanced rule: front / side / rear
  cost: number                        // hull incl. one turret (tanks/walkers) and minimal crew
  movement: string[]                  // allowed VehicleMovementType ids
  mainGunSpace: number                // total main gun size that fits in turret / arms
  auxSpaces: number
  troopCapacity: number               // in FI troops
  family: VehicleFamily
  armourPoints: number | null         // fielding cost (1 point earned per 5+ man squad)
}

export interface VehicleMovementType {
  id: string
  name: string
  cost: number
  rates: (number | null)[] | null // road, open, light, difficult, very difficult; null = not allowed
}

export interface VehicleAccessory {
  id: string
  name: string
  cost: number
  aux: number              // auxiliary spaces used
  shield?: boolean         // first shield on a vehicle uses no space
  minHullClass?: number
  families?: VehicleFamily[]
  requires?: string        // another accessory id
  notes: string
}

export interface VehicleCrewRating {
  id: TrainingClass
  name: string
  cost: number
  hitBonus: number
  troopRoll: number
}

export interface VehicleBuilderData {
  hulls: VehicleHull[]
  movementTypes: VehicleMovementType[]
  accessories: VehicleAccessory[]
  gunLinkageCost: number
  crewRatings: VehicleCrewRating[]
  effectColumns: Record<VehicleFamily, number>
}
