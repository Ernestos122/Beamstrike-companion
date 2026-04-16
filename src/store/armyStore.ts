import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ArmyList } from '@types-bs/army'
import type { SquadSelection } from '@types-bs/squad'
import type { RaceType } from '@types-bs/enums'
import { generateId } from '@lib/utils'
import { calcSquadPoints, calcSquadMorale, recalcArmyTotals } from '@lib/pointsCalc'

type ArmyUpdates = Partial<Pick<ArmyList, 'name' | 'playerName' | 'pointsLimit' | 'nominatedObjectiveMorale' | 'notes'>>
type SquadDraft = Omit<SquadSelection, 'selectionId' | 'pointsTotal' | 'moraleValue'>

interface ArmyStore {
  armies: ArmyList[]
  createArmy: (name: string, playerName: string, race: RaceType, pointsLimit: number) => string
  updateArmy: (id: string, updates: ArmyUpdates) => void
  deleteArmy: (id: string) => void
  addSquad: (armyId: string, draft: SquadDraft) => void
  updateSquad: (armyId: string, squadId: string, draft: SquadDraft) => void
  removeSquad: (armyId: string, squadId: string) => void
  duplicateSquad: (armyId: string, squadId: string) => void
}

function materialize(selectionId: string, draft: SquadDraft): SquadSelection {
  const s = { selectionId, ...draft } as SquadSelection
  s.pointsTotal = calcSquadPoints(s)
  s.moraleValue = calcSquadMorale(s)
  return s
}

function syncTotals(army: ArmyList): ArmyList {
  const { totalPoints, totalMoraleValue, halfMoraleThreshold } = recalcArmyTotals(
    army.squads,
    army.nominatedObjectiveMorale,
  )
  return { ...army, totalPoints, totalMoraleValue, halfMoraleThreshold, updatedAt: new Date().toISOString() }
}

export const useArmyStore = create<ArmyStore>()(
  persist(
    (set) => ({
      armies: [],

      createArmy: (name, playerName, race, pointsLimit) => {
        const id = generateId()
        const now = new Date().toISOString()
        const army: ArmyList = {
          id, name, playerName, primaryRace: race, pointsLimit,
          squads: [], totalPoints: 0, totalMoraleValue: 0, halfMoraleThreshold: 0,
          nominatedObjectiveMorale: 0, createdAt: now, updatedAt: now, notes: '',
        }
        set(state => ({ armies: [...state.armies, army] }))
        return id
      },

      updateArmy: (id, updates) => set(state => ({
        armies: state.armies.map(a => a.id === id ? syncTotals({ ...a, ...updates }) : a),
      })),

      deleteArmy: (id) => set(state => ({
        armies: state.armies.filter(a => a.id !== id),
      })),

      addSquad: (armyId, draft) => set(state => ({
        armies: state.armies.map(a => {
          if (a.id !== armyId) return a
          const squad = materialize(generateId(), draft)
          return syncTotals({ ...a, squads: [...a.squads, squad] })
        }),
      })),

      updateSquad: (armyId, squadId, draft) => set(state => ({
        armies: state.armies.map(a => {
          if (a.id !== armyId) return a
          const squads = a.squads.map(s =>
            s.selectionId === squadId ? materialize(squadId, draft) : s
          )
          return syncTotals({ ...a, squads })
        }),
      })),

      removeSquad: (armyId, squadId) => set(state => ({
        armies: state.armies.map(a => {
          if (a.id !== armyId) return a
          return syncTotals({ ...a, squads: a.squads.filter(s => s.selectionId !== squadId) })
        }),
      })),

      duplicateSquad: (armyId, squadId) => set(state => ({
        armies: state.armies.map(a => {
          if (a.id !== armyId) return a
          const orig = a.squads.find(s => s.selectionId === squadId)
          if (!orig) return a
          const { selectionId: _id, pointsTotal: _pt, moraleValue: _mv, ...draft } = orig
          const copy = materialize(generateId(), { ...draft, squadName: `${orig.squadName} (copy)` })
          return syncTotals({ ...a, squads: [...a.squads, copy] })
        }),
      })),
    }),
    { name: 'beamstrike-armies' },
  ),
)
