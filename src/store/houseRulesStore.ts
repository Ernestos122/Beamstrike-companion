import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HouseRulesStore {
  d12Mode: boolean
  toggleD12: () => void
}

export const useHouseRulesStore = create<HouseRulesStore>()(
  persist(
    (set) => ({
      d12Mode: false,
      toggleD12: () => set(s => ({ d12Mode: !s.d12Mode })),
    }),
    { name: 'beamstrike-house-rules' },
  ),
)
