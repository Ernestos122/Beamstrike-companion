import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Swords, Trash2, ChevronRight } from 'lucide-react'
import { useArmyStore } from '@store/armyStore'
import { races } from '@data/index'
import type { RaceType } from '@types-bs/enums'
import type { ArmyList } from '@types-bs/army'

// ── New Army Form ──────────────────────────────────────────────────────────────
function NewArmyForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [race, setRace] = useState<RaceType>('HUMAN')
  const [pointsLimit, setPointsLimit] = useState(1000)
  const createArmy = useArmyStore(s => s.createArmy)
  const navigate = useNavigate()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const id = createArmy(name.trim(), playerName.trim(), race, pointsLimit)
    onDone()
    navigate(`/army/${id}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
      <h2 className="font-semibold text-base">New Army</h2>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Army Name *</label>
        <input
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          placeholder="e.g. Iron Guard"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Player Name</label>
        <input
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          placeholder="Your name"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Primary Race</label>
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={race}
            onChange={e => setRace(e.target.value as RaceType)}
          >
            {races.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Points Limit</label>
          <input
            type="number"
            min={100}
            max={10000}
            step={50}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={pointsLimit}
            onChange={e => setPointsLimit(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm font-medium hover:bg-[var(--accent)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] py-2 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Create Army
        </button>
      </div>
    </form>
  )
}

// ── Army Card ─────────────────────────────────────────────────────────────────
function ArmyCard({ army, onDelete }: { army: ArmyList; onDelete: () => void }) {
  const navigate = useNavigate()
  const raceName = races.find(r => r.id === army.primaryRace)?.name ?? army.primaryRace
  const pct = army.pointsLimit > 0 ? Math.min(100, Math.round((army.totalPoints / army.pointsLimit) * 100)) : 0
  const over = army.totalPoints > army.pointsLimit

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-[var(--accent)] transition-colors"
        onClick={() => navigate(`/army/${army.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{army.name}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {raceName}{army.playerName ? ` · ${army.playerName}` : ''}
            </p>
          </div>
          <ChevronRight className="shrink-0 text-[var(--muted-foreground)] mt-0.5" size={18} />
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--muted-foreground)]">{army.squads.length} squad{army.squads.length !== 1 ? 's' : ''}</span>
            <span className={over ? 'text-red-500 font-semibold' : ''}>
              {army.totalPoints} / {army.pointsLimit} pts
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-[var(--primary)]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>

      <div className="border-t border-[var(--border)] px-4 py-2 flex justify-end">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors py-1"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Army List View ─────────────────────────────────────────────────────────────
export function ArmyListView() {
  const armies = useArmyStore(s => s.armies)
  const deleteArmy = useArmyStore(s => s.deleteArmy)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Swords size={20} /> Army Builder
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> New Army
          </button>
        )}
      </div>

      {showForm && <NewArmyForm onDone={() => setShowForm(false)} />}

      {armies.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          No armies yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {armies.map(army => (
            <div key={army.id}>
              {confirmDelete === army.id ? (
                <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
                  <p className="text-sm font-medium">Delete "<span className="font-semibold">{army.name}</span>"?</p>
                  <p className="text-xs text-[var(--muted-foreground)]">This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 rounded-lg border border-[var(--border)] py-1.5 text-sm hover:bg-[var(--accent)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { deleteArmy(army.id); setConfirmDelete(null) }}
                      className="flex-1 rounded-lg bg-red-500 text-white py-1.5 text-sm font-semibold hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <ArmyCard army={army} onDelete={() => setConfirmDelete(army.id)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
