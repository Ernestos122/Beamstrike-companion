import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rulesData from '@data/skirmish-rules.json'

type Section = typeof rulesData[number]
type Entry = Section['entries'][number]

function EntryView({ entry }: { entry: Entry }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-[var(--accent)] transition-colors"
      >
        {open ? <ChevronDown size={14} className="shrink-0 text-[var(--muted-foreground)]" /> : <ChevronRight size={14} className="shrink-0 text-[var(--muted-foreground)]" />}
        {entry.title}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 prose prose-sm prose-invert max-w-none text-[var(--foreground)] [&_table]:text-xs [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--card)] [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-[var(--border)] [&_td]:px-2.5 [&_td]:py-1.5 [&_tr:nth-child(even)_td]:bg-[var(--accent)]/30">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

function SectionView({ section }: { section: Section }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 bg-[var(--card)] text-left font-semibold text-sm hover:bg-[var(--accent)] transition-colors"
      >
        <span>{section.title}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="bg-[var(--background)] divide-y">
          {section.entries.map(e => <EntryView key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  )
}

export function RulesTab() {
  return (
    <div className="p-4">
      {rulesData.map(s => <SectionView key={s.id} section={s} />)}
    </div>
  )
}
