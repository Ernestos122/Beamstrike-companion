export type SearchResultType = 'rule' | 'weapon' | 'chart'

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  subtitle?: string
  excerpt?: string
  score?: number
  url: string // hash route to navigate to
}
