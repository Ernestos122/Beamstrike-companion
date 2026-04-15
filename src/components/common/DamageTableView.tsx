import { cn } from '@lib/utils'
import type { Chart } from '@types-bs/charts'

// Impact section metadata — controls row background colour
const IMPACT_STYLES: Record<string, string> = {
  STUN:    'bg-slate-100 dark:bg-slate-800/60',
  LOW:     'bg-yellow-50 dark:bg-yellow-900/30',
  STANDARD:'bg-orange-50 dark:bg-orange-900/30',
  HIGH:    'bg-red-50 dark:bg-red-900/30',
  POWER:   'bg-purple-50 dark:bg-purple-900/30',
  'TOTAL 1':'bg-red-800/10 dark:bg-red-900/50',
  'TOTAL 2':'bg-red-900/15 dark:bg-red-950/50',
  'TOTAL 3':'bg-red-950/20 dark:bg-red-950/70',
}

const IMPACT_HEADER_STYLES: Record<string, string> = {
  STUN:    'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100',
  LOW:     'bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100',
  STANDARD:'bg-orange-400 dark:bg-orange-700 text-orange-900 dark:text-white',
  HIGH:    'bg-red-400 dark:bg-red-700 text-white',
  POWER:   'bg-purple-500 dark:bg-purple-700 text-white',
  'TOTAL 1':'bg-red-700 dark:bg-red-900 text-white',
  'TOTAL 2':'bg-red-800 dark:bg-red-950 text-white',
  'TOTAL 3':'bg-red-950 text-white',
}

// Cell colour by result
function cellClass(value: string | number | null): string {
  if (value === 'Kill') return 'text-red-700 dark:text-red-400 font-bold'
  if (value === 'GH')   return 'text-orange-600 dark:text-orange-400 font-semibold'
  if (value === 'Stun') return 'text-blue-600 dark:text-blue-400 font-semibold'
  return 'text-[var(--muted-foreground)]'
}

interface Props {
  chart: Chart
}

export function DamageTableView({ chart }: Props) {
  let currentSection = ''

  return (
    <div className="space-y-3">
      {chart.description && (
        <p className="text-sm text-[var(--muted-foreground)]">{chart.description}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--secondary)]">
              {chart.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-2 py-2 text-center font-bold whitespace-nowrap border-b border-[var(--border)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, ri) => {
              if (row.sectionHeader) {
                currentSection = row.sectionHeader
                return (
                  <tr key={ri}>
                    <td
                      colSpan={chart.headers.length}
                      className={cn(
                        'px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-center border-t-2 border-[var(--border)]',
                        IMPACT_HEADER_STYLES[currentSection] ?? 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      )}
                    >
                      {row.sectionHeader}
                    </td>
                  </tr>
                )
              }

              const sectionStyle = IMPACT_STYLES[currentSection] ?? ''

              return (
                <tr
                  key={ri}
                  className={cn(
                    'border-t border-[var(--border)]/50',
                    sectionStyle
                  )}
                >
                  {row.cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-2 py-1.5 text-center',
                        ci === 0 ? 'font-semibold text-[var(--foreground)] w-10' : cellClass(cell)
                      )}
                    >
                      {cell === '' ? '' : (cell ?? 'NE')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {chart.footnotes && chart.footnotes.length > 0 && (
        <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
          {chart.footnotes.map((fn, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="shrink-0">•</span>
              <span>{fn}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
