import { useState, useMemo, Fragment } from 'react'
import Fuse from 'fuse.js'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@lib/utils'
import { allWeapons, races, version } from '@data/index'
import type { Weapon, RangeBands, ToHitValue } from '@types-bs/weapon'
import type { WeaponCategory } from '@types-bs/enums'

type CategoryFilter = 'ALL' | WeaponCategory
type SortKey = 'name' | 'points'

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'ALL',             label: 'All' },
  { id: 'INFANTRY',        label: 'Infantry' },
  { id: 'SUPPORT',         label: 'Support' },
  { id: 'HEAVY',           label: 'Heavy' },
  { id: 'VEHICLE_MOUNTED', label: 'Vehicle' },
  { id: 'ALIEN',           label: 'Alien' },
  { id: 'MELEE',           label: 'Melee' },
  { id: 'GRENADE',         label: 'Grenades' },
]

const BANDS: [keyof RangeBands, string][] = [
  ['band0_4', '0–4"'], ['band5_20', '5–20"'], ['band21_40', '21–40"'], ['band41_80', '41–80"'], ['band81plus', '81"+'],
]

const IMPACT_COLORS: Record<string, string> = {
  STUN:     'bg-yellow-500/20 text-yellow-400',
  LOW:      'bg-gray-500/20 text-gray-400',
  STANDARD: 'bg-gray-500/20 text-gray-400',
  HIGH:     'bg-orange-500/20 text-orange-400',
  POWER:    'bg-red-500/20 text-red-400',
  TOTAL_1:  'bg-red-700/30 text-red-300',
  TOTAL_2:  'bg-red-700/30 text-red-300',
  TOTAL_3:  'bg-red-700/30 text-red-300',
  VARIES:   'bg-purple-500/20 text-purple-400',
  SPECIAL:  'bg-purple-500/20 text-purple-400',
}

const RACE_NAMES: Record<string, string> = Object.fromEntries(
  (races as unknown as { id: string; name: string }[]).map(r => [r.id, r.name])
)

function hitLabel(v: ToHitValue | undefined): string {
  if (v === null || v === undefined) return '—'
  return String(v)
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

function ImpactBadge({ impact }: { impact: string }) {
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap', IMPACT_COLORS[impact] ?? 'bg-gray-500/20 text-gray-400')}>
      {impact.replace('_', ' ')}
    </span>
  )
}

function WeaponDetails({ w }: { w: Weapon }) {
  const facts: [string, string][] = []
  if (w.maxRange !== null && w.maxRange !== undefined && w.category !== 'MELEE') facts.push(['Max range', `${w.maxRange}"`])
  if (w.shotsPerPhase && w.shotsPerPhase > 1) facts.push(['Shots / phase', String(w.shotsPerPhase)])
  if (w.fireTemplate) facts.push(['Fire template', `${w.fireTemplate}${w.optionOrMust ? ` (${w.optionOrMust.toLowerCase()})` : ''}`])
  if (w.blastTemplate) facts.push(['Blast template', String(w.blastTemplate)])
  if (w.heImpact) facts.push(['HE impact', w.heImpact.replace('_', ' ')])
  if (w.avImpact) facts.push(['AV impact', w.avImpact.replace('_', ' ')])
  if (w.mainGunSize) facts.push(['Main gun size', String(w.mainGunSize)])
  if (w.causesSupp) facts.push(['Suppression', 'Yes'])
  if (w.requiresDeployment) facts.push(['Deployment', 'Must deploy before firing'])
  if (w.requiresSkill) facts.push(['Requires skill', w.requiresSkill.replace('_', ' ')])
  if (w.racesAllowed?.length) facts.push(['Races', w.racesAllowed.map(r => RACE_NAMES[r] ?? r).join(', ')])

  return (
    <div className="space-y-2 text-xs">
      {facts.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {facts.map(([k, v]) => (
            <Fragment key={k}>
              <dt className="text-[var(--muted-foreground)]">{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
        </dl>
      )}
      {w.remarks && <p className="text-[var(--muted-foreground)]">{w.remarks}</p>}
    </div>
  )
}

export function WeaponsPage() {
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [expanded, setExpanded] = useState<string | null>(null)

  const fuse = useMemo(
    () => new Fuse(allWeapons, { keys: ['name', 'code'], threshold: 0.3, ignoreLocation: true }),
    []
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: allWeapons.length }
    for (const w of allWeapons) c[w.category] = (c[w.category] ?? 0) + 1
    return c
  }, [])

  const weapons = useMemo(() => {
    const q = query.trim()
    let list = q ? fuse.search(q).map(r => r.item) : [...allWeapons]
    if (category !== 'ALL') list = list.filter(w => w.category === category)
    // Keep Fuse relevance order while searching; otherwise apply the chosen sort
    if (!q) {
      list.sort(sort === 'points'
        ? (a, b) => a.pointsCost - b.pointsCost || a.name.localeCompare(b.name)
        : (a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [fuse, query, category, sort])

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Weapons</h1>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
            Chart pack v{version.weaponChartVersion}
          </span>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Every weapon in the game. Range columns show the 2D6 score needed to hit. Tap a weapon for full details.
        </p>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === id
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            {label} <span className="opacity-70">{counts[id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          disabled={!!query.trim()}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm disabled:opacity-50"
          aria-label="Sort weapons"
        >
          <option value="name">Name</option>
          <option value="points">Points</option>
        </select>
      </div>

      {/* Table */}
      {weapons.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] py-6 text-center">No weapons found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead className="bg-[var(--secondary)]">
              <tr className="text-[var(--muted-foreground)] uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-medium">Weapon</th>
                <th className="px-2 py-2 text-center font-medium">Pts</th>
                {BANDS.map(([key, label], i) => (
                  <th key={key} className={cn('px-2 py-2 text-center font-medium whitespace-nowrap', i >= 3 && 'hidden sm:table-cell')}>
                    {label}
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-medium">Impact</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map(w => {
                const open = expanded === w.id
                return (
                  <Fragment key={w.id}>
                    <tr
                      onClick={() => setExpanded(open ? null : w.id)}
                      className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {open
                            ? <ChevronDown size={12} className="shrink-0 text-[var(--muted-foreground)]" />
                            : <ChevronRight size={12} className="shrink-0 text-[var(--muted-foreground)]" />}
                          <span className="font-medium">{w.name}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">({w.code})</span>
                          {w.shotsPerPhase && w.shotsPerPhase > 1 && <span className="text-[10px] text-sky-400">{w.shotsPerPhase}×</span>}
                          {w.causesSupp && <span className="text-[10px] text-amber-400" title="Causes suppression">S</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center font-mono">{w.pointsCost}</td>
                      {w.toHit && w.category !== 'MELEE' ? (
                        BANDS.map(([key], i) => {
                          const v = w.toHit![key]
                          return (
                            <td key={key} className={cn('px-2 py-2 text-center font-mono', v === 'CNF' && 'text-red-400', i >= 3 && 'hidden sm:table-cell')}>
                              {hitLabel(v)}
                            </td>
                          )
                        })
                      ) : (
                        <>
                          <td colSpan={3} className="px-2 py-2 text-center text-[var(--muted-foreground)] sm:hidden">
                            {w.category === 'MELEE'
                              ? <>H2H <span className="font-mono font-bold text-[var(--foreground)]">{w.meleeBonus !== undefined ? signed(w.meleeBonus) : '—'}</span></>
                              : <>Blast <span className="font-mono font-bold text-[var(--foreground)]">{w.blastTemplate ?? '—'}</span></>}
                          </td>
                          <td colSpan={5} className="px-2 py-2 text-center text-[var(--muted-foreground)] hidden sm:table-cell">
                            {w.category === 'MELEE'
                              ? <>H2H bonus <span className="font-mono font-bold text-[var(--foreground)]">{w.meleeBonus !== undefined ? signed(w.meleeBonus) : '—'}</span></>
                              : <>Blast template <span className="font-mono font-bold text-[var(--foreground)]">{w.blastTemplate ?? '—'}</span></>}
                          </td>
                        </>
                      )}
                      <td className="px-2 py-2 text-center"><ImpactBadge impact={String(w.impact)} /></td>
                    </tr>
                    {open && (
                      <tr className="bg-[var(--accent)]/10">
                        <td colSpan={8} className="px-4 py-3">
                          <WeaponDetails w={w} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <p className="text-[11px] text-[var(--muted-foreground)]">
        — out of range · <span className="text-red-400">CNF</span> cannot fire at that range ·
        <span className="text-sky-400"> 2×</span> shots per phase · <span className="text-amber-400">S</span> causes suppression
      </p>
    </div>
  )
}
