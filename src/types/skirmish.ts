export type SkirmishRaceId =
  | 'HUMAN' | 'GROWWLAN' | 'THUNTRA' | 'SPUG' | 'FERRAPUR'
  | 'HIBEVOR' | 'CENTALING' | 'REPLICAN' | 'K_KREE' | 'GREY'

export type SkirmishTraining = 'CIV' | 'REG' | 'VET' | 'ELITE' | 'HERO'
export type SkirmishArmour = 'UA' | 'FI' | 'LA' | 'PA' | 'AD'
export type SkirmishFigureType = 'LEADER' | 'SPECIALIST' | 'GRUNT'
export type SkirmishFigureStatus = 'ACTIVE' | 'RECOVERING' | 'DEAD'

export interface SkirmishInjury {
  id: string
  name: string
  effect: string
}

export interface SkirmishFigure {
  id: string
  name: string
  type: SkirmishFigureType
  training: SkirmishTraining
  armour: SkirmishArmour
  weapons: string[]
  equipment: string[]
  skillIds: string[]
  xp: number
  injuries: SkirmishInjury[]
  status: SkirmishFigureStatus
  points: number
}

export interface SkirmishWarband {
  id: string
  name: string
  player: string
  race: SkirmishRaceId
  figures: SkirmishFigure[]
  scrip: number
  gamesPlayed: number
  wins: number
  totalPoints: number
  createdAt: string
  updatedAt: string
  notes: string
}
