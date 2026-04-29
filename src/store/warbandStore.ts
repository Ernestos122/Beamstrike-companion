import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SkirmishWarband, SkirmishFigure, SkirmishRaceId } from '@types-bs/skirmish'
import { generateId } from '@lib/utils'
import { calcFigurePoints, calcWarbandPoints } from '@lib/warbandCalc'
import skirmishSkills from '@data/skirmish-skills.json'

type FigureDraft = Omit<SkirmishFigure, 'id' | 'points'>

function materializeFigure(id: string, draft: FigureDraft): SkirmishFigure {
  return {
    ...draft,
    id,
    points: calcFigurePoints(draft.training, draft.armour, draft.weapons, draft.equipment ?? []),
  }
}

function syncTotals(w: SkirmishWarband): SkirmishWarband {
  return {
    ...w,
    totalPoints: calcWarbandPoints(w.figures),
    updatedAt: new Date().toISOString(),
  }
}

interface WarbandStore {
  warbands: SkirmishWarband[]
  createWarband: (name: string, player: string, race: SkirmishRaceId) => string
  updateWarband: (id: string, updates: Partial<Pick<SkirmishWarband, 'name' | 'player' | 'race' | 'notes' | 'scrip' | 'gamesPlayed' | 'wins'>>) => void
  deleteWarband: (id: string) => void
  addFigure: (warbandId: string, draft: FigureDraft) => void
  updateFigure: (warbandId: string, figureId: string, draft: FigureDraft) => void
  removeFigure: (warbandId: string, figureId: string) => void
  addScrip: (warbandId: string, amount: number) => void
  recordGame: (warbandId: string, won: boolean) => void
  addXp: (warbandId: string, figureId: string, amount: number) => void
  addSkill: (warbandId: string, figureId: string, skillId: string) => void
  addInjury: (warbandId: string, figureId: string, injury: SkirmishFigure['injuries'][number]) => void
  setFigureStatus: (warbandId: string, figureId: string, status: SkirmishFigure['status']) => void
}

export const useWarbandStore = create<WarbandStore>()(
  persist(
    (set) => ({
      warbands: [],

      createWarband: (name, player, race) => {
        const id = generateId()
        const now = new Date().toISOString()
        const warband: SkirmishWarband = {
          id, name, player, race,
          figures: [], scrip: 0, gamesPlayed: 0, wins: 0,
          totalPoints: 0, notes: '', createdAt: now, updatedAt: now,
        }
        set(s => ({ warbands: [...s.warbands, warband] }))
        return id
      },

      updateWarband: (id, updates) => set(s => ({
        warbands: s.warbands.map(w =>
          w.id === id ? syncTotals({ ...w, ...updates }) : w
        ),
      })),

      deleteWarband: (id) => set(s => ({
        warbands: s.warbands.filter(w => w.id !== id),
      })),

      addFigure: (warbandId, draft) => set(s => ({
        warbands: s.warbands.map(w => {
          if (w.id !== warbandId) return w
          const figure = materializeFigure(generateId(), draft)
          return syncTotals({ ...w, figures: [...w.figures, figure] })
        }),
      })),

      updateFigure: (warbandId, figureId, draft) => set(s => ({
        warbands: s.warbands.map(w => {
          if (w.id !== warbandId) return w
          const figures = w.figures.map(f =>
            f.id === figureId ? materializeFigure(figureId, draft) : f
          )
          return syncTotals({ ...w, figures })
        }),
      })),

      removeFigure: (warbandId, figureId) => set(s => ({
        warbands: s.warbands.map(w => {
          if (w.id !== warbandId) return w
          return syncTotals({ ...w, figures: w.figures.filter(f => f.id !== figureId) })
        }),
      })),

      recordGame: (warbandId, won) => set(s => ({
        warbands: s.warbands.map(w =>
          w.id === warbandId
            ? { ...w, gamesPlayed: w.gamesPlayed + 1, wins: won ? w.wins + 1 : w.wins, updatedAt: new Date().toISOString() }
            : w
        ),
      })),

      addScrip: (warbandId, amount) => set(s => ({
        warbands: s.warbands.map(w =>
          w.id === warbandId ? { ...w, scrip: Math.max(0, w.scrip + amount), updatedAt: new Date().toISOString() } : w
        ),
      })),

      addXp: (warbandId, figureId, amount) => set(s => ({
        warbands: s.warbands.map(w => {
          if (w.id !== warbandId) return w
          return {
            ...w,
            figures: w.figures.map(f =>
              f.id === figureId ? { ...f, xp: f.xp + amount } : f
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      })),

      addSkill: (warbandId, figureId, skillId) => set(s => ({
        warbands: s.warbands.map(w => {
          if (w.id !== warbandId) return w
          return {
            ...w,
            figures: w.figures.map(f => {
              if (f.id !== figureId) return f
              const skill = (skirmishSkills as { id: string; xpCost: number }[]).find(sk => sk.id === skillId)
              const cost = skill?.xpCost ?? 4
              if (f.skillIds.includes(skillId) || f.skillIds.length >= 3 || f.xp < cost) return f
              return { ...f, skillIds: [...f.skillIds, skillId], xp: f.xp - cost }
            }),
            updatedAt: new Date().toISOString(),
          }
        }),
      })),

      addInjury: (warbandId, figureId, injury) => set(s => ({
        warbands: s.warbands.map(w => {
          if (w.id !== warbandId) return w
          return {
            ...w,
            figures: w.figures.map(f =>
              f.id === figureId ? { ...f, injuries: [...f.injuries, injury] } : f
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      })),

      setFigureStatus: (warbandId, figureId, status) => set(s => ({
        warbands: s.warbands.map(w => {
          if (w.id !== warbandId) return w
          return {
            ...w,
            figures: w.figures.map(f =>
              f.id === figureId ? { ...f, status } : f
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      })),
    }),
    { name: 'beamstrike-warbands' },
  ),
)
