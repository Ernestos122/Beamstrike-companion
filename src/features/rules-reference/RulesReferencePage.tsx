import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Fuse from 'fuse.js'
import { cn } from '@lib/utils'
import { rulesSections, rulesEntries } from '@data/index'
import { RuleContent } from '@components/common/RuleContent'
import { SeeAlsoLinks } from '@components/common/SeeAlsoLinks'
import type { RulesEntry } from '@types-bs/rules'

export function RulesReferencePage() {
  const { sectionId, entryId } = useParams<{ sectionId?: string; entryId?: string }>()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Fuse.js search instance — stable across renders
  const fuse = useMemo(
    () =>
      new Fuse(rulesEntries, {
        keys: ['title', 'tags', 'content'],
        threshold: 0.35,
        minMatchCharLength: 2,
      }),
    []
  )

  // When query is set, return flat search results; otherwise null = tree mode
  const searchResults = useMemo<RulesEntry[] | null>(() => {
    const q = query.trim()
    if (!q) return null
    return fuse.search(q).map(r => r.item)
  }, [fuse, query])

  // Determine which entry is active from URL params
  const activeEntry = useMemo<RulesEntry | undefined>(() => {
    if (entryId) return rulesEntries.find(e => e.id === entryId)
    if (sectionId) {
      return rulesEntries
        .filter(e => e.sectionId === sectionId)
        .sort((a, b) => a.order - b.order)[0]
    }
    return rulesEntries[0]
  }, [sectionId, entryId])

  const selectEntry = (entry: RulesEntry) => {
    navigate(`/rules/${entry.sectionId}/${entry.id}`)
    if (query) setQuery('')
  }

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Helper: sorted entries for a given section
  const entriesForSection = (secId: string) =>
    rulesEntries
      .filter(e => e.sectionId === secId)
      .sort((a, b) => a.order - b.order)

  const entryButton = (entry: RulesEntry) => (
    <button
      key={entry.id}
      onClick={() => selectEntry(entry)}
      className={cn(
        'w-full text-left px-4 py-1.5 text-sm transition-colors',
        activeEntry?.id === entry.id
          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-medium'
          : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
      )}
    >
      {entry.title}
    </button>
  )

  return (
    <div className="flex h-full">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[var(--border)] overflow-y-auto">
        {/* Search box */}
        <div className="p-3 border-b border-[var(--border)]">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rules…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <nav className="flex-1 overflow-y-auto py-1">
          {searchResults !== null ? (
            // ── Search mode: flat result list ──
            searchResults.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[var(--muted-foreground)]">No results</p>
            ) : (
              searchResults.map(entry => entryButton(entry))
            )
          ) : (
            // ── Tree mode: section → entry list ──
            rulesSections.map(section => {
              const list = entriesForSection(section.id)
              if (list.length === 0) return null
              const isCollapsed = collapsed.has(section.id)
              return (
                <div key={section.id}>
                  <button
                    onClick={() => toggleCollapse(section.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                  >
                    <span>{section.title}</span>
                    <span className="text-[10px]">{isCollapsed ? '▶' : '▼'}</span>
                  </button>
                  {!isCollapsed && list.map(entry => entryButton(entry))}
                </div>
              )
            })
          )}
        </nav>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: search + dropdown selector */}
        <div className="lg:hidden px-4 py-3 border-b border-[var(--border)] bg-[var(--background)] space-y-2">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rules…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          {searchResults !== null ? (
            // Search results in select
            searchResults.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">No results</p>
            ) : (
              <select
                onChange={e => {
                  const entry = rulesEntries.find(en => en.id === e.target.value)
                  if (entry) selectEntry(entry)
                }}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                {searchResults.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </select>
            )
          ) : (
            // Normal grouped dropdown
            <select
              value={activeEntry?.id ?? ''}
              onChange={e => {
                const entry = rulesEntries.find(en => en.id === e.target.value)
                if (entry) selectEntry(entry)
              }}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {rulesSections.map(section => {
                const list = entriesForSection(section.id)
                if (list.length === 0) return null
                return (
                  <optgroup key={section.id} label={section.title}>
                    {list.map(entry => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          )}
        </div>

        {/* Entry display */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeEntry ? (
            <div className="max-w-3xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold leading-tight">{activeEntry.title}</h1>
                {activeEntry.pageRef && (
                  <span className="shrink-0 text-xs font-mono bg-[var(--secondary)] text-[var(--secondary-foreground)] px-2 py-1 rounded">
                    {activeEntry.pageRef}
                  </span>
                )}
              </div>
              <RuleContent content={activeEntry.content} />
              {activeEntry.seeAlso.length > 0 && (
                <SeeAlsoLinks ids={activeEntry.seeAlso} />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
              Select a rule from the list.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
