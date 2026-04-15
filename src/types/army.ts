import type { RaceType } from './enums'
import type { SquadSelection } from './squad'

export interface ArmyList {
  id: string
  name: string
  playerName: string
  primaryRace: RaceType
  pointsLimit: number
  squads: SquadSelection[]
  totalPoints: number // sum of all squad pointsTotal
  totalMoraleValue: number // sum of all squad moraleValue + nominated objectives
  halfMoraleThreshold: number // Math.ceil(totalMoraleValue / 2)
  nominatedObjectiveMorale: number // agreed pre-battle objectives value (5–20)
  createdAt: string // ISO date string
  updatedAt: string
  notes: string
}
