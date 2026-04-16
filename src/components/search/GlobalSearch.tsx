import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, BookOpen, Table2, Crosshair, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { rulesEntries, charts, allWeapons } from '@data/index'
import type { RulesEntry } from '@types-bs/rules'
import type { Chart } from '@types-bs/charts'
import type { Weapon } from '@types-bs/weapon'

// ── Result types ───────────────────────────────────────────────────────────────
type ResultKind = 'rule' | 'chart' | 'weapon'

interface SearchResult {
  id: string
  kind: ResultKind
  title: string
  subtitle?: string
  url: string
}

const KIND_ICON = {
  rule: BookOpen,
  chart: Table2,
  weapon: Crosshair,
} as const

const KIND_LABEL = {
  rule: 'Rule',
  chart: 'Chart',
  weapon: 'Weapon',
} as const

const KIND_COLOR = {
  rule: 'text-blue-500',
  chart: 'text-emerald-500',
  weapon: 'text-purple-500',
} as const

// ── Index building ─────────────────────────────────────────────────────────────
function buildIndex(): SearchResult[] {
  const results: SearchResult[] = []

  for (const entry of rulesEntries as RulesEntry[]) {
    results.push({
      id: `rule-${entry.id}`,
      kind: 'rule',
      title: entry.title,
      subtitle: entry.content.replace(/[#*[\]()_]/g, '').slice(0, 80).trim(),
      url: `/rules/${entry.sectionId}/${entry.id}`,
    })
  }

  for (const chart of charts as Chart[]) {
    results.push({
      id: `chart-${chart.id}`,
      kind: 'chart',
      title: chart.name,
      subtitle: chart.category.replace(/_/g, ' ').toLowerCase(),
      url: `/charts/${chart.id}`,
    })
  }

  for (const weapon of allWeapons as Weapon[]) {
    results.push({
      id: `weapon-${weapon.id}`,
      kind: 'weapon',
      title: weapon.name,
      subtitle: `[${weapon.code}] · ${weapon.impact} · ${weapon.pointsCost}pts`,
      url: `/helpers`,
    })
  }

  return results
}

// ── GlobalSearch component ─────────────────────────────────────────────────────
interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const index = useMemo(() => buildIndex(), [])

  const fuse = useMemo(() => new Fuse(index, {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'subtitle', weight: 1 },
    ],
    threshold: 0.35,
    minMatchCharLength: 2,
    includeScore: true,
  }), [index])

  const results: SearchResult[] = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return fuse.search(q, { limit: 20 }).map(r => r.item)
  }, [query, fuse])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Clamp active index
  useEffect(() => {
    setActive(a => Math.min(a, Math.max(0, results.length - 1)))
  }, [results.length])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const go = useCallback((result: SearchResult) => {
    // For weapon results, navigate to helpers and open weapon lookup with the query
    navigate(result.url)
    onOpenChange(false)
  }, [navigate, onOpenChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(a => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      go(results[active])
    }
  }

  // Group results by kind
  const grouped = useMemo(() => {
    const g: Record<ResultKind, SearchResult[]> = { rule: [], chart: [], weapon: [] }
    for (const r of results) g[r.kind].push(r)
    return g
  }, [results])

  // Flat ordered list for keyboard nav (rules → charts → weapons)
  const flat = useMemo(() => [
    ...grouped.rule,
    ...grouped.chart,
    ...grouped.weapon,
  ], [grouped])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-[8vh] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title className="sr-only">Global Search</Dialog.Title>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
            <Search size={18} className="shrink-0 text-[var(--muted-foreground)]" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-[var(--muted-foreground)]"
              placeholder="Search rules, charts, weapons…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(0) }}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded p-1 hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <Dialog.Close className="rounded-lg border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors hidden sm:block">
              ESC
            </Dialog.Close>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
            {query.trim().length > 0 && results.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No results for "<span className="font-medium">{query}</span>"
              </p>
            )}

            {query.trim().length === 0 && (
              <div className="py-6 px-4 space-y-2 text-sm text-[var(--muted-foreground)]">
                <p className="font-medium text-[var(--foreground)]">Search across:</p>
                <ul className="space-y-1.5 ml-1">
                  <li className="flex items-center gap-2"><BookOpen size={14} className="text-blue-500" /> Rules reference ({(rulesEntries as RulesEntry[]).length} entries)</li>
                  <li className="flex items-center gap-2"><Table2 size={14} className="text-emerald-500" /> Charts ({(charts as Chart[]).length} charts)</li>
                  <li className="flex items-center gap-2"><Crosshair size={14} className="text-purple-500" /> Weapons ({(allWeapons as Weapon[]).length} weapons)</li>
                </ul>
                <p className="text-xs pt-1">Tip: Use <kbd className="rounded border px-1 text-[10px]">↑↓</kbd> to navigate, <kbd className="rounded border px-1 text-[10px]">↵</kbd> to open</p>
              </div>
            )}

            {/* Grouped results */}
            {((['rule', 'chart', 'weapon'] as ResultKind[]).filter(k => grouped[k].length > 0)).map(kind => (
              <div key={kind}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] bg-[var(--secondary)]/60 border-b border-[var(--border)]">
                  {KIND_LABEL[kind]}s
                </div>
                {grouped[kind].map(result => {
                  const flatIdx = flat.findIndex(r => r.id === result.id)
                  const isActive = flatIdx === active
                  const Icon = KIND_ICON[kind]
                  return (
                    <button
                      key={result.id}
                      data-index={flatIdx}
                      onClick={() => go(result)}
                      onMouseEnter={() => setActive(flatIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-[var(--accent)]' : 'hover:bg-[var(--accent)]/50'
                      }`}
                    >
                      <Icon size={15} className={`shrink-0 ${KIND_COLOR[kind]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-[var(--muted-foreground)] truncate">{result.subtitle}</p>
                        )}
                      </div>
                      {isActive && <ArrowRight size={14} className="shrink-0 text-[var(--muted-foreground)]" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--border)] flex gap-4 text-[10px] text-[var(--muted-foreground)]">
              <span><kbd className="rounded border px-1">↑↓</kbd> navigate</span>
              <span><kbd className="rounded border px-1">↵</kbd> open</span>
              <span><kbd className="rounded border px-1">ESC</kbd> close</span>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
