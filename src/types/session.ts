export type PhaseStatus = 'PENDING' | 'COMPLETE'

// Matches the Beamstrike Turn Monitor Sheet exactly
export interface TurnRecord {
  turnNumber: number
  // Player A's turn
  a1stMove: PhaseStatus
  // Fire phase (both players)
  firePhase: PhaseStatus
  moraleCheck: PhaseStatus
  a2ndMove: PhaseStatus
  aCloseCombat: PhaseStatus
  // Player B's turn
  b1stMove: PhaseStatus
  firePhaseB: PhaseStatus
  moraleCheckB: PhaseStatus
  b2ndMove: PhaseStatus
  bCloseCombat: PhaseStatus
  // Morale tracking after each fire phase
  playerAMoraleAfterFire?: number
  playerBMoraleAfterFire?: number
  notes?: string
}

export interface GameSession {
  id: string
  battleDate: string // ISO date
  location: string
  playerA: string
  playerB: string
  playerASide: string // e.g. "Imperial", "Crimson Rebels"
  playerBSide: string
  playerAStartMorale: number
  playerAHalfMorale: number // auto-calculated
  playerBStartMorale: number
  playerBHalfMorale: number // auto-calculated
  turns: TurnRecord[]
  notes: string
  isComplete: boolean
  createdAt: string
  updatedAt: string
}
