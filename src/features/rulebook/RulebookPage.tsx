import { useRef } from 'react'
import { rulesSections, rulesEntries } from '@data/index'
import { RuleContent } from '@components/common/RuleContent'
import { SeeAlsoLinks } from '@components/common/SeeAlsoLinks'

export function RulebookPage() {
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  const scrollTo = (sectionId: string) => {
    sectionRefs.current.get(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const entriesFor = (sectionId: string) =>
    rulesEntries
      .filter(e => e.sectionId === sectionId)
      .sort((a, b) => a.order - b.order)

  return (
    <div className="flex h-full">
      {/* ── Desktop TOC sidebar ── */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-[var(--border)] overflow-y-auto">
        <div className="p-3 border-b border-[var(--border)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Contents
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {rulesSections.map((section, i) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className="w-full text-left px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
            >
              <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-4 text-right">
                {i + 1}.
              </span>
              <span className="truncate">{section.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main rulebook scroll area ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile: section jump dropdown */}
        <div className="lg:hidden px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]">
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) scrollTo(e.target.value) }}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="">Jump to section…</option>
            {rulesSections.map((section, i) => (
              <option key={section.id} value={section.id}>
                {i + 1}. {section.title}
              </option>
            ))}
          </select>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-12">
          {rulesSections.map((section, i) => {
            const entries = entriesFor(section.id)
            return (
              <section
                key={section.id}
                ref={el => { if (el) sectionRefs.current.set(section.id, el) }}
              >
                {/* Section heading */}
                <div className="flex items-baseline gap-3 mb-5 pb-2 border-b-2 border-[var(--border)]">
                  <span className="text-2xl font-black text-[var(--muted-foreground)]">{i + 1}</span>
                  <h2 className="text-xl font-bold flex-1">{section.title}</h2>
                  {section.pageRef && (
                    <span className="text-xs font-mono text-[var(--muted-foreground)]">
                      {section.pageRef}
                    </span>
                  )}
                </div>

                {entries.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)] italic">
                    No detailed entries for this section yet.
                  </p>
                ) : (
                  <div className="space-y-8">
                    {entries.map(entry => (
                      <article key={entry.id}>
                        <div className="flex items-baseline justify-between gap-3 mb-2">
                          <h3 className="text-base font-bold">{entry.title}</h3>
                          {entry.pageRef && (
                            <span className="shrink-0 text-xs font-mono bg-[var(--secondary)] text-[var(--secondary-foreground)] px-2 py-0.5 rounded">
                              {entry.pageRef}
                            </span>
                          )}
                        </div>
                        <RuleContent content={entry.content} />
                        {entry.seeAlso.length > 0 && <SeeAlsoLinks ids={entry.seeAlso} />}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
