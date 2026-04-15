import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import { cn } from '@lib/utils'
import { allWeapons } from '@data/index'
import type { Weapon } from '@types-bs/weapon'

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'dice' | 'session' | 'counters' | 'weapons'
const TABS: { id: Tab; label: string }[] = [
  { id: 'dice',     label: 'Dice' },
  { id: 'session',  label: 'Session' },
  { id: 'counters', label: 'Counters' },
  { id: 'weapons',  label: 'Weapon Lookup' },
]

// ─────────────────────────────────────────────────────────────────────────────
// DICE ROLLER
// ─────────────────────────────────────────────────────────────────────────────
type DiceResult = { label: string; value: number }

function DiceRoller() {
  const [history, setHistory] = useState<DiceResult[]>([])

  const push = (label: string, value: number) =>
    setHistory(prev => [{ label, value }, ...prev].slice(0, 14))

  const rollD = (sides: number) => push(`D${sides}`, Math.floor(Math.random() * sides) + 1)

  const rollND = (n: number, sides: number) => {
    let total = 0
    for (let i = 0; i < n; i++) total += Math.floor(Math.random() * sides) + 1
    push(`${n}D${sides}`, total)
  }

  const latest = history[0]

  return (
    <div className="space-y-5 max-w-xs">
      {/* Result display */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-[var(--border)] bg-[var(--secondary)] h-28 gap-1">
        {latest ? (
          <>
            <span className="text-5xl font-black tabular-nums leading-none">{latest.value}</span>
            <span className="text-xs text-[var(--muted-foreground)]">{latest.label}</span>
          </>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">Roll a die</span>
        )}
      </div>

      {/* Single dice */}
      <div className="grid grid-cols-3 gap-2">
        {[6, 10, 20].map(s => (
          <button
            key={s}
            onClick={() => rollD(s)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] py-3 text-sm font-semibold hover:bg-[var(--accent)] active:scale-95 transition-all"
          >
            D{s}
          </button>
        ))}
      </div>

      {/* Multi-dice */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => rollND(2, 6)}  className="rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 text-sm font-semibold hover:bg-[var(--accent)] active:scale-95 transition-all">2D6</button>
        <button onClick={() => rollND(2, 10)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 text-sm font-semibold hover:bg-[var(--accent)] active:scale-95 transition-all">2D10</button>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">History</p>
          <div className="flex flex-wrap gap-1.5">
            {history.slice(1).map((r, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                {r.label}: <strong>{r.value}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION TRACKER
// ─────────────────────────────────────────────────────────────────────────────
type ArmyStatus = 'active' | 'shaken' | 'broken'

interface ArmyData {
  name: string
  startMorale: number
  currentMorale: number
}

const PHASES = [
  'P1 — Move 1', 'P1 — Fire', 'P1 — Move 2', 'P1 — Close Combat', 'P1 — Morale',
  'P2 — Move 1', 'P2 — Fire', 'P2 — Move 2', 'P2 — Close Combat', 'P2 — Morale',
]

function armyStatus(army: ArmyData): ArmyStatus {
  if (army.currentMorale <= 0) return 'broken'
  if (army.currentMorale < Math.ceil(army.startMorale / 2)) return 'shaken'
  return 'active'
}

const STATUS_PILL: Record<ArmyStatus, string> = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400',
  shaken: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  broken: 'bg-red-500/15 text-red-700 dark:text-red-400',
}
const STATUS_BAR: Record<ArmyStatus, string> = {
  active: 'bg-green-500',
  shaken: 'bg-yellow-500',
  broken: 'bg-red-500',
}

function SessionTracker() {
  const [turn, setTurn] = useState(1)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [setup, setSetup] = useState(true)
  const [armies, setArmies] = useState<ArmyData[]>([
    { name: 'Army 1', startMorale: 20, currentMorale: 20 },
    { name: 'Army 2', startMorale: 20, currentMorale: 20 },
  ])

  const nextPhase = () => {
    if (phaseIdx < PHASES.length - 1) setPhaseIdx(p => p + 1)
    else { setPhaseIdx(0); setTurn(t => t + 1) }
  }

  const adjust = (idx: number, delta: number) =>
    setArmies(prev => prev.map((a, i) =>
      i !== idx ? a : { ...a, currentMorale: Math.max(0, a.currentMorale + delta) }
    ))

  const reset = () => {
    setTurn(1); setPhaseIdx(0)
    setArmies(prev => prev.map(a => ({ ...a, currentMorale: a.startMorale })))
  }

  if (setup) {
    return (
      <div className="space-y-4 max-w-sm">
        <p className="text-sm text-[var(--muted-foreground)]">Enter starting morale values before the battle.</p>
        {armies.map((army, i) => (
          <div key={i} className="space-y-2 p-3 rounded-lg border border-[var(--border)]">
            <input
              value={army.name}
              onChange={e => setArmies(prev => prev.map((a, idx) =>
                idx !== i ? a : { ...a, name: e.target.value }
              ))}
              className="w-full text-sm font-semibold bg-transparent border-b border-[var(--border)] pb-1 focus:outline-none"
              placeholder={`Army ${i + 1} name`}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--muted-foreground)] shrink-0">Starting Morale</label>
              <input
                type="number" min={1} max={999}
                value={army.startMorale}
                onChange={e => {
                  const v = Math.max(1, parseInt(e.target.value) || 1)
                  setArmies(prev => prev.map((a, idx) =>
                    idx !== i ? a : { ...a, startMorale: v, currentMorale: v }
                  ))
                }}
                className="w-20 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => setSetup(false)}
          className="w-full rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Start Battle
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-sm">
      {/* Turn + phase */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--secondary)]">
        <div>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Turn {turn}</p>
          <p className="text-base font-bold">{PHASES[phaseIdx]}</p>
        </div>
        <button
          onClick={nextPhase}
          className="rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          Next →
        </button>
      </div>

      {/* Phase progress bar */}
      <div className="flex gap-1">
        {PHASES.map((_, i) => (
          <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors',
            i < phaseIdx ? 'bg-[var(--primary)]' : i === phaseIdx ? 'bg-[var(--primary)]/50' : 'bg-[var(--border)]'
          )} />
        ))}
      </div>

      {/* Army panels */}
      {armies.map((army, i) => {
        const status = armyStatus(army)
        const pct = Math.max(0, (army.currentMorale / army.startMorale) * 100)
        return (
          <div key={i} className="p-3 rounded-lg border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{army.name}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_PILL[status])}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', STATUS_BAR[status])} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span>{army.currentMorale} / {army.startMorale}</span>
              <span>½ = {Math.ceil(army.startMorale / 2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => adjust(i, -1)} className="rounded border border-[var(--border)] py-1.5 text-xs font-medium hover:bg-[var(--accent)] transition-colors">−1 Trooper</button>
              <button onClick={() => adjust(i, -3)} className="rounded border border-[var(--border)] py-1.5 text-xs font-medium hover:bg-[var(--accent)] transition-colors">−3 Veh/Hero</button>
              <button onClick={() => adjust(i, +1)} className="rounded border border-[var(--border)] py-1.5 text-xs font-medium hover:bg-[var(--accent)] transition-colors">+1</button>
            </div>
          </div>
        )
      })}

      <div className="flex gap-2">
        <button onClick={() => setSetup(true)} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-medium hover:bg-[var(--accent)] transition-colors">Setup</button>
        <button onClick={reset} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-medium hover:bg-[var(--accent)] transition-colors">Reset Battle</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS COUNTERS
// ─────────────────────────────────────────────────────────────────────────────
type CounterStatus = 'ok' | 'suppressed' | 'stunned' | 'gh'

interface Counter {
  id: string
  name: string
  status: CounterStatus
}

const COUNTER_STATUSES: CounterStatus[] = ['ok', 'suppressed', 'stunned', 'gh']
const COUNTER_LABELS: Record<CounterStatus, string> = { ok: 'OK', suppressed: 'Suppressed', stunned: 'Stunned', gh: 'GH' }
const COUNTER_STYLE: Record<CounterStatus, string> = {
  ok:          'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  suppressed:  'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
  stunned:     'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  gh:          'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
}

function StatusCounters() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [newName, setNewName] = useState('')

  const add = () => {
    const name = newName.trim() || `Squad ${counters.length + 1}`
    setCounters(prev => [...prev, { id: crypto.randomUUID(), name, status: 'ok' }])
    setNewName('')
  }

  const cycle = (id: string) =>
    setCounters(prev => prev.map(c => {
      if (c.id !== id) return c
      const next = COUNTER_STATUSES[(COUNTER_STATUSES.indexOf(c.status) + 1) % COUNTER_STATUSES.length]
      return { ...c, status: next }
    }))

  const remove = (id: string) => setCounters(prev => prev.filter(c => c.id !== id))
  const resetAll = () => setCounters(prev => prev.map(c => ({ ...c, status: 'ok' as CounterStatus })))

  return (
    <div className="space-y-4 max-w-sm">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Squad / figure name"
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <button
          onClick={add}
          className="rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>

      {counters.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Add squads or figures above. Tap the status badge to cycle through states.</p>
      ) : (
        <>
          <div className="space-y-2">
            {counters.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
                <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                <button
                  onClick={() => cycle(c.id)}
                  className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors shrink-0', COUNTER_STYLE[c.status])}
                >
                  {COUNTER_LABELS[c.status]}
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xl leading-none px-1 transition-colors shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button onClick={resetAll} className="w-full rounded-lg border border-[var(--border)] py-2 text-xs font-medium hover:bg-[var(--accent)] transition-colors">
            Reset all to OK
          </button>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WEAPON LOOKUP
// ─────────────────────────────────────────────────────────────────────────────
function toHitDisplay(v: Weapon['toHit'][keyof Weapon['toHit']]): string {
  if (v === null) return '—'
  if (v === 'CNF') return 'CNF'
  return String(v)
}

function WeaponLookup() {
  const [query, setQuery] = useState('')

  const fuse = useMemo(
    () => new Fuse(allWeapons, { keys: ['name', 'code'], threshold: 0.3, minMatchCharLength: 2 }),
    []
  )

  const results = useMemo<Weapon[]>(() => {
    if (!query.trim()) return []
    return fuse.search(query.trim()).slice(0, 20).map(r => r.item)
  }, [fuse, query])

  return (
    <div className="space-y-3 max-w-full">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by weapon name or code…"
        className="w-full max-w-md rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />

      {query.trim() && results.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">No weapons found.</p>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Weapon</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Code</th>
                <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">Pts</th>
                <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">0–4"</th>
                <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">5–20"</th>
                <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">21–40"</th>
                <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">41–80"</th>
                <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">81+"</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">Impact</th>
              </tr>
            </thead>
            <tbody>
              {results.map((w, i) => (
                <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--accent)]/40 transition-colors">
                  <td className="px-3 py-1.5 font-medium whitespace-nowrap">{w.name}</td>
                  <td className="px-2 py-1.5 text-[var(--muted-foreground)] whitespace-nowrap">{w.code}</td>
                  <td className="px-2 py-1.5 text-center">{w.pointsCost}</td>
                  <td className="px-2 py-1.5 text-center">{toHitDisplay(w.toHit.band0_4)}</td>
                  <td className="px-2 py-1.5 text-center">{toHitDisplay(w.toHit.band5_20)}</td>
                  <td className="px-2 py-1.5 text-center">{toHitDisplay(w.toHit.band21_40)}</td>
                  <td className="px-2 py-1.5 text-center">{toHitDisplay(w.toHit.band41_80)}</td>
                  <td className="px-2 py-1.5 text-center">{toHitDisplay(w.toHit.band81plus)}</td>
                  <td className="px-2 py-1.5 text-[var(--muted-foreground)] whitespace-nowrap">{w.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!query.trim() && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Search across all weapon tables — infantry, support, heavy, vehicle, and alien weapons.
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function HelpersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dice')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] px-2 shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'border-[var(--primary)] text-[var(--foreground)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'dice'     && <DiceRoller />}
        {activeTab === 'session'  && <SessionTracker />}
        {activeTab === 'counters' && <StatusCounters />}
        {activeTab === 'weapons'  && <WeaponLookup />}
      </div>
    </div>
  )
}
