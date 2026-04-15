import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@lib/utils'
import { charts } from '@data/index'
import { ChartView } from '@components/common/ChartView'
import { DamageTableView } from '@components/common/DamageTableView'
import type { ChartCategory } from '@types-bs/enums'

// Human-readable labels for each category
const CATEGORY_LABELS: Record<ChartCategory, string> = {
  TURN_SEQUENCE:    'Turn & Phase',
  MOVEMENT:        'Movement',
  COMBAT_INFANTRY: 'Infantry Combat',
  COMBAT_VEHICLE:  'Vehicle Combat',
  MORALE:          'Morale / Suppression',
  CLOSE_COMBAT:    'Close Combat',
  COVER:           'Cover',
  WEAPONS:         'Weapons',
  DAMAGE:          'Damage',
  SHIELDS:         'Shields',
  ALIENS:          'Aliens',
  REFERENCE:       'Reference',
  FIRE_SUPPORT:    'Fire Support',
}

// Order categories should appear in the nav
const CATEGORY_ORDER: ChartCategory[] = [
  'TURN_SEQUENCE',
  'MOVEMENT',
  'COMBAT_INFANTRY',
  'COMBAT_VEHICLE',
  'MORALE',
  'CLOSE_COMBAT',
  'COVER',
  'FIRE_SUPPORT',
  'SHIELDS',
  'ALIENS',
  'REFERENCE',
]

export function ChartsPage() {
  const { chartId } = useParams<{ chartId?: string }>()
  const navigate = useNavigate()

  // Group charts by category, maintaining order
  const grouped = useMemo(() => {
    const map = new Map<ChartCategory, typeof charts>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const chart of charts) {
      const cat = chart.category as ChartCategory
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(chart)
    }
    // Remove empty categories
    for (const [cat, list] of map) {
      if (list.length === 0) map.delete(cat)
    }
    return map
  }, [])

  // Determine active chart
  const activeChart = useMemo(
    () => charts.find(c => c.id === chartId) ?? charts[0],
    [chartId]
  )

  // Track which categories are collapsed in the nav (mobile)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggleCollapse = (cat: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const selectChart = (id: string) => navigate(`/charts/${id}`)

  return (
    <div className="flex h-full">
      {/* Sidebar — chart navigation */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--border)] overflow-y-auto">
        <div className="p-3 border-b border-[var(--border)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Charts
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {CATEGORY_ORDER.map(cat => {
            const list = grouped.get(cat)
            if (!list || list.length === 0) return null
            const isCollapsed = collapsed.has(cat)
            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCollapse(cat)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="text-[10px]">{isCollapsed ? '▶' : '▼'}</span>
                </button>
                {!isCollapsed && list.map(chart => (
                  <button
                    key={chart.id}
                    onClick={() => selectChart(chart.id)}
                    className={cn(
                      'w-full text-left px-4 py-1.5 text-sm transition-colors',
                      activeChart?.id === chart.id
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-medium'
                        : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
                    )}
                  >
                    {chart.name}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: dropdown selector */}
        <div className="lg:hidden px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]">
          <select
            value={activeChart?.id ?? ''}
            onChange={e => selectChart(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {CATEGORY_ORDER.map(cat => {
              const list = grouped.get(cat)
              if (!list || list.length === 0) return null
              return (
                <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                  {list.map(chart => (
                    <option key={chart.id} value={chart.id}>
                      {chart.name}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>

        {/* Chart display */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeChart ? (
            <div className="max-w-4xl">
              <h1 className="text-xl font-bold mb-1">{activeChart.name}</h1>
              <p className="text-xs text-[var(--muted-foreground)] mb-4 uppercase tracking-wide">
                {CATEGORY_LABELS[activeChart.category as ChartCategory] ?? activeChart.category}
              </p>
              {activeChart.id === 'infantry-damage-table'
                ? <DamageTableView chart={activeChart} />
                : <ChartView chart={activeChart} />
              }
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
              Select a chart from the list.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
