import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import scenarios from '@data/skirmish-scenarios.json'

type Scenario = typeof scenarios[number]

function ScenarioCard({ s }: { s: Scenario }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start justify-between px-4 py-3 bg-[var(--card)] text-left hover:bg-[var(--accent)] transition-colors"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--muted-foreground)]">#{s.number}</span>
            <span className="font-semibold text-sm">{s.name}</span>
            {s.gameLength && (
              <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Clock size={11} />
                {s.gameLength}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 italic">{s.tagline}</p>
        </div>
        {open ? <ChevronDown size={16} className="shrink-0 mt-0.5" /> : <ChevronRight size={16} className="shrink-0 mt-0.5" />}
      </button>

      {open && (
        <div className="bg-[var(--background)] px-4 py-3 space-y-4 text-sm divide-y">
          <Section label="Setup" content={s.setup} />
          <Section label="Objectives" content={s.objectives} />
          <Section label="Victory Conditions" content={s.victoryConditions} />
          {s.specialRules && <Section label="Special Rules" content={s.specialRules} />}
          {s.notes && (
            <div className="pt-3">
              <p className="text-xs text-[var(--muted-foreground)] italic">{s.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div className="pt-3 first:pt-0">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">{label}</p>
      <div className="prose prose-sm prose-invert max-w-none text-[var(--foreground)] [&_table]:text-xs [&_th]:py-1 [&_td]:py-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

export function ScenariosTab() {
  return (
    <div className="p-4">
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        Before each game, roll off — winner picks attacker or defender (where applicable) or chooses table edge.
      </p>
      {scenarios.map(s => <ScenarioCard key={s.id} s={s} />)}
    </div>
  )
}
