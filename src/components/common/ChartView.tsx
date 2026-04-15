import { cn } from '@lib/utils'
import type { Chart } from '@types-bs/charts'

interface Props {
  chart: Chart
}

export function ChartView({ chart }: Props) {
  return (
    <div className="space-y-3">
      {chart.description && (
        <p className="text-sm text-[var(--muted-foreground)]">{chart.description}</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--secondary)] text-[var(--secondary-foreground)]">
              {chart.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b border-[var(--border)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, ri) => {
              if (row.sectionHeader) {
                return (
                  <tr key={ri}>
                    <td
                      colSpan={chart.headers.length}
                      className="px-3 py-1.5 font-bold text-xs uppercase tracking-wide bg-[var(--accent)] text-[var(--accent-foreground)] border-t border-[var(--border)]"
                    >
                      {row.sectionHeader}
                    </td>
                  </tr>
                )
              }
              return (
                <tr
                  key={ri}
                  className={cn(
                    'border-t border-[var(--border)] transition-colors hover:bg-[var(--accent)]/40',
                    row.highlight && 'bg-[var(--secondary)]'
                  )}
                >
                  {row.cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-3 py-2 align-top',
                        ci === 0 && 'font-medium whitespace-nowrap'
                      )}
                    >
                      {cell ?? '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {chart.footnotes && chart.footnotes.length > 0 && (
        <ul className="space-y-1 text-xs text-[var(--muted-foreground)] list-none">
          {chart.footnotes.map((fn, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="shrink-0 select-none">•</span>
              <span>{fn}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
