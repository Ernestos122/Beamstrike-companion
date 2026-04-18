import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ArmyList } from '@types-bs/army'
import type { SquadSelection, TrooperLine } from '@types-bs/squad'
import type { RaceType } from '@types-bs/enums'
import { generateId } from '@lib/utils'
import { calcSquadPoints, calcSquadMorale, recalcArmyTotals } from '@lib/pointsCalc'

type ArmyUpdates = Partial<Pick<ArmyList, 'name' | 'playerName' | 'pointsLimit' | 'nominatedObjectiveMorale' | 'notes'>>
export type SquadDraft = Omit<SquadSelection, 'selectionId' | 'pointsTotal' | 'moraleValue'>

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
          // Deep-clone troopers so IDs are unique
          const clonedDraft = {
            ...draft,
            squadName: `${orig.squadName} (copy)`,
            troopers: orig.troopers.map(t => ({ ...t, id: generateId() })),
          }
          const copy = materialize(generateId(), clonedDraft)
          return syncTotals({ ...a, squads: [...a.squads, copy] })
        }),
      })),
    }),
    {
      name: 'beamstrike-armies',
      version: 3,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const state = persistedState as { armies: Record<string, unknown>[] }

        // v1 → v2: skills string[] → SkillLoadout[]
        if (fromVersion < 2) {
          state.armies = (state.armies ?? []).map(army => ({
            ...army,
            squads: ((army.squads ?? []) as Record<string, unknown>[]).map(squad => ({
              ...squad,
              skills: ((squad.skills ?? []) as unknown[]).map(s =>
                typeof s === 'string' ? { skillId: s, count: 1 } : s
              ),
            })),
          }))
        }

        // v2 → v3: flat infantry model → TrooperLine[]
        if (fromVersion < 3) {
          state.armies = (state.armies ?? []).map(army => ({
            ...army,
            squads: ((army.squads ?? []) as Record<string, unknown>[]).map(squad => {
              if (squad.isVehicle) {
                return {
                  selectionId: squad.selectionId,
                  squadName: squad.squadName,
                  race: squad.race,
                  isVehicle: true,
                  troopers: [],
                  vehicleHullType: squad.vehicleHullType,
                  vehicleArmourClass: squad.vehicleArmourClass,
                  vehicleName: squad.vehicleName,
                  vehicleBasePoints: squad.vehicleBasePoints,
                  vehicleWeapons: (squad.weapons ?? []) as unknown[],
                  vehicleEquipment: (squad.equipment ?? []) as unknown[],
                  notes: squad.notes ?? '',
                  pointsTotal: squad.pointsTotal ?? 0,
                  moraleValue: squad.moraleValue ?? 0,
                }
              }

              // Infantry: fold existing flat fields into a single TrooperLine
              const oldSkills = ((squad.skills ?? []) as { skillId: string }[])
                .map(sl => sl.skillId) as TrooperLine['skills']
              const oldWeapons = ((squad.weapons ?? []) as { weaponId: string }[])
                .map(wl => wl.weaponId)

              const line: TrooperLine = {
                id: generateId(),
                label: '',
                count: (squad.modelCount as number) ?? 1,
                trainingClass: squad.trainingClass as TrooperLine['trainingClass'],
                armourType: squad.armourType as TrooperLine['armourType'],
                weapons: oldWeapons,
                equipment: (squad.equipment ?? []) as string[],
                skills: oldSkills,
              }

              return {
                selectionId: squad.selectionId,
                squadName: squad.squadName,
                race: squad.race,
                isVehicle: false,
                troopers: [line],
                notes: squad.notes ?? '',
                pointsTotal: squad.pointsTotal ?? 0,
                moraleValue: squad.moraleValue ?? 0,
              }
            }),
          }))
        }

        return state as unknown as ArmyStore
      },
    },
  ),
)
