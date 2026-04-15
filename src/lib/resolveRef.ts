import { rulesEntries, charts } from '@data/index'

export interface ResolvedRef {
  title: string
  url: string
  type: 'rule' | 'chart'
}

/**
 * Resolve a cross-reference ID to a navigable URL and display title.
 * Checks rule entries first, then charts.
 * Returns null if the ID is not found in either dataset.
 */
export function resolveRef(id: string): ResolvedRef | null {
  const entry = rulesEntries.find(e => e.id === id)
  if (entry) {
    return { title: entry.title, url: `/rules/${entry.sectionId}/${entry.id}`, type: 'rule' }
  }
  const chart = charts.find(c => c.id === id)
  if (chart) {
    return { title: chart.name, url: `/charts/${chart.id}`, type: 'chart' }
  }
  return null
}
