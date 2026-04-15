import { Link } from 'react-router-dom'
import { resolveRef } from '@lib/resolveRef'
import { cn } from '@lib/utils'
import type { ResolvedRef } from '@lib/resolveRef'

interface Props {
  ids: string[]
}

export function SeeAlsoLinks({ ids }: Props) {
  const refs = ids
    .map(id => resolveRef(id))
    .filter((r): r is ResolvedRef => r !== null)

  if (refs.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
        See also
      </p>
      <div className="flex flex-wrap gap-2">
        {refs.map(ref => (
          <Link
            key={ref.url}
            to={ref.url}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
              ref.type === 'rule'
                ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)]'
                : 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20'
            )}
          >
            <span className="opacity-70">{ref.type === 'rule' ? '§' : '▤'}</span>
            {ref.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
