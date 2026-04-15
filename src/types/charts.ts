import type { ChartCategory } from './enums'

export interface ChartRow {
  label?: string
  cells: (string | number | null)[]
  highlight?: boolean // special styling (e.g. header rows within sections)
  sectionHeader?: string // for multi-section tables like Infantry Damage Table
}

export interface Chart {
  id: string
  name: string
  category: ChartCategory
  description: string
  headers: string[]
  rows: ChartRow[]
  footnotes?: string[]
  rulesRefs: string[] // rule entry IDs
}

// Special type for the Infantry Damage Table which has nested structure
export interface DamageTableSection {
  impact: string // e.g. "STUN", "LOW", etc.
  rows: { roll: number; results: string[] }[] // 6 rows per section
}

export interface DamageTableData {
  armourColumns: string[]
  sections: DamageTableSection[]
}
