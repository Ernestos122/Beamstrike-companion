import { useState } from 'react'
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Swords } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@lib/utils'
import { useWarbandStore } from '@store/warbandStore'
import { calcFigurePoints } from '@lib/warbandCalc'
import { allWeapons } from '@data/index'
import skirmishRaces from '@data/skirmish-races.json'
import type { SkirmishWarband, SkirmishFigure, SkirmishRaceId, SkirmishTraining, SkirmishArmour, SkirmishFigureType } from '@types-bs/skirmish'

// ── Constants ────────────────────────────────────────────────────────────────

const TRAINING_OPTIONS: { value: SkirmishTraining; label: string; cost: number }[] = [
  { value: 'CIV',   label: 'Civilian (CIV)',  cost: 0  },
  { value: 'REG',   label: 'Regular (REG)',   cost: 2  },
  { value: 'VET',   label: 'Veteran (VET)',   cost: 5  },
  { value: 'ELITE', label: 'Elite (ELITE)',   cost: 10 },
  { value: 'HERO',  label: 'Hero (HERO)',     cost: 20 },
]

const ARMOUR_OPTIONS: { value: SkirmishArmour; label: string; cost: number; save: string }[] = [
  { value: 'UA', label: 'Unarmoured (UA)', cost: 2,  save: 'No save' },
  { value: 'FI', label: 'Flak Infantry (FI)', cost: 5,  save: '6+'      },
  { value: 'LA', label: 'Light Armour (LA)', cost: 8,  save: '5+'      },
  { value: 'PA', label: 'Powered Armour (PA)', cost: 18, save: '4+'     },
  { value: 'AD', label: 'Advanced Defence (AD)', cost: 27, save: '3+'   },
]

const FIGURE_TYPE_OPTIONS: { value: SkirmishFigureType; label: string; trainingAllowed: SkirmishTraining[] }[] = [
  { value: 'LEADER',     label: 'Leader',     trainingAllowed: ['HERO', 'ELITE'] },
  { value: 'SPECIALIST', label: 'Specialist', trainingAllowed: ['VET', 'ELITE']  },
  { value: 'GRUNT',      label: 'Grunt',      trainingAllowed: ['CIV', 'REG']    },
]

const TRAINING_COLORS: Record<SkirmishTraining, string> = {
  CIV:   'bg-gray-500/20 text-gray-400',
  REG:   'bg-gray-500/20 text-gray-400',
  VET:   'bg-blue-500/20 text-blue-400',
  ELITE: 'bg-purple-500/20 text-purple-400',
  HERO:  'bg-amber-500/20 text-amber-400',
}

const TYPE_COLORS: Record<SkirmishFigureType, string> = {
  LEADER:     'bg-amber-500/20 text-amber-400',
  SPECIALIST: 'bg-purple-500/20 text-purple-400',
  GRUNT:      'bg-gray-500/20 text-gray-400',
}

// ── Figure Form Modal ────────────────────────────────────────────────────────

interface FigureFormProps {
  open: boolean
  onClose: () => void
  onSave: (draft: Omit<SkirmishFigure, 'id' | 'points'>) => void
  initial?: SkirmishFigure
  warband: SkirmishWarband
}

function FigureFormModal({ open, onClose, onSave, initial, warband }: FigureFormProps) {
  const [name,     setName]     = useState(initial?.name     ?? '')
  const [type,     setType]     = useState<SkirmishFigureType>(initial?.type     ?? 'GRUNT')
  const [training, setTraining] = useState<SkirmishTraining>(initial?.training ?? 'REG')
  const [armour,   setArmour]   = useState<SkirmishArmour>(initial?.armour   ?? 'FI')
  const [weapons,  setWeapons]  = useState<string[]>(initial?.weapons  ?? [])
  const [weaponSearch, setWeaponSearch] = useState('')

  const typeOpts = FIGURE_TYPE_OPTIONS.find(o => o.value === type)
  const validTrainings = typeOpts?.trainingAllowed ?? []

  function handleTypeChange(t: SkirmishFigureType) {
    setType(t)
    const opts = FIGURE_TYPE_OPTIONS.find(o => o.value === t)
    if (opts && !opts.trainingAllowed.includes(training)) {
      setTraining(opts.trainingAllowed[0])
    }
  }

  const pts = calcFigurePoints(training, armour, weapons)

  const filteredWeapons = allWeapons.filter(w =>
    (!w.racesAllowed || w.racesAllowed.length === 0 || (w.racesAllowed as string[]).includes(warband.race)) &&
    (weaponSearch === '' || w.name.toLowerCase().includes(weaponSearch.toLowerCase()))
  ).slice(0, 20)

  function toggleWeapon(id: string) {
    setWeapons(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id].slice(0, 2)
    )
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(), type, training, armour, weapons,
      skillIds: initial?.skillIds ?? [],
      xp: initial?.xp ?? 0,
      injuries: initial?.injuries ?? [],
      status: initial?.status ?? 'ACTIVE',
    })
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed inset-x-4 top-4 bottom-4 z-50 flex flex-col bg-[var(--background)] rounded-lg overflow-hidden max-w-lg mx-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-[var(--card)]">
            <Dialog.Title className="font-semibold text-sm">
              {initial ? 'Edit Figure' : 'Add Figure'}
            </Dialog.Title>
            <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Name</label>
              <input
                className="w-full rounded border bg-[var(--card)] px-3 py-2 text-sm"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Figure name"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Type</label>
              <div className="flex gap-2">
                {FIGURE_TYPE_OPTIONS.map(o => {
                  const isLeaderTaken = o.value === 'LEADER' && !initial && warband.figures.some(f => f.type === 'LEADER')
                  const specialistCount = warband.figures.filter(f => f.type === 'SPECIALIST' && f.id !== initial?.id).length
                  const isSpecialistFull = o.value === 'SPECIALIST' && specialistCount >= 3 && initial?.type !== 'SPECIALIST'
                  const disabled = isLeaderTaken || isSpecialistFull
                  return (
                    <button
                      key={o.value}
                      disabled={disabled}
                      onClick={() => !disabled && handleTypeChange(o.value)}
                      className={cn(
                        'flex-1 rounded border py-1.5 text-xs font-medium transition-colors',
                        type === o.value
                          ? 'border-[var(--foreground)] bg-[var(--accent)] text-[var(--foreground)]'
                          : 'border-[var(--border)] text-[var(--muted-foreground)]',
                        disabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Training */}
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Training</label>
              <div className="flex flex-wrap gap-2">
                {TRAINING_OPTIONS.filter(o => validTrainings.includes(o.value)).map(o => (
                  <button
                    key={o.value}
                    onClick={() => setTraining(o.value)}
                    className={cn(
                      'rounded border px-3 py-1 text-xs font-medium transition-colors',
                      training === o.value
                        ? 'border-[var(--foreground)] bg-[var(--accent)] text-[var(--foreground)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)]'
                    )}
                  >
                    {o.value} <span className="text-[var(--muted-foreground)]">{o.cost}pts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Armour */}
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Armour</label>
              <div className="flex flex-wrap gap-2">
                {ARMOUR_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setArmour(o.value)}
                    className={cn(
                      'rounded border px-3 py-1 text-xs font-medium transition-colors',
                      armour === o.value
                        ? 'border-[var(--foreground)] bg-[var(--accent)] text-[var(--foreground)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)]'
                    )}
                  >
                    {o.value} <span className="text-[var(--muted-foreground)]">{o.save}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weapons */}
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Weapons (max 2)</label>
              {weapons.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {weapons.map(id => {
                    const w = allWeapons.find(w => w.id === id)
                    return w ? (
                      <span key={id} className="flex items-center gap-1 rounded bg-[var(--accent)] px-2 py-0.5 text-xs">
                        {w.name}
                        <button onClick={() => toggleWeapon(id)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">×</button>
                      </span>
                    ) : null
                  })}
                </div>
              )}
              <input
                className="w-full rounded border bg-[var(--card)] px-3 py-1.5 text-xs mb-1"
                placeholder="Search weapons…"
                value={weaponSearch}
                onChange={e => setWeaponSearch(e.target.value)}
              />
              <div className="max-h-32 overflow-y-auto rounded border divide-y">
                {filteredWeapons.map(w => (
                  <button
                    key={w.id}
                    onClick={() => toggleWeapon(w.id)}
                    disabled={weapons.length >= 2 && !weapons.includes(w.id)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors',
                      weapons.includes(w.id)
                        ? 'bg-[var(--accent)] text-[var(--foreground)]'
                        : 'hover:bg-[var(--accent)] text-[var(--foreground)]',
                      weapons.length >= 2 && !weapons.includes(w.id) && 'opacity-40'
                    )}
                  >
                    <span>{w.name}</span>
                    <span className="text-[var(--muted-foreground)]">{w.pointsCost ?? 0}pts</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-[var(--card)] px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold">{pts} pts</span>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded border px-4 py-1.5 text-sm">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="rounded bg-[var(--foreground)] text-[var(--background)] px-4 py-1.5 text-sm font-medium disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Warband Card ─────────────────────────────────────────────────────────────

function FigureRow({ figure, onEdit, onDelete }: { figure: SkirmishFigure; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b last:border-0 text-xs">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium truncate">{figure.name}</span>
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', TYPE_COLORS[figure.type])}>{figure.type}</span>
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', TRAINING_COLORS[figure.training])}>{figure.training}</span>
          <span className="text-[var(--muted-foreground)]">{figure.armour}</span>
        </div>
        {figure.weapons.length > 0 && (
          <p className="text-[var(--muted-foreground)] mt-0.5 truncate">
            {figure.weapons.map(id => allWeapons.find(w => w.id === id)?.name ?? id).join(', ')}
          </p>
        )}
      </div>
      <span className="font-bold shrink-0">{figure.points}pts</span>
      <button onClick={onEdit} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"><Edit2 size={12} /></button>
      <button onClick={onDelete} className="text-[var(--muted-foreground)] hover:text-red-400 p-1"><Trash2 size={12} /></button>
    </div>
  )
}

function WarbandCard({ warband }: { warband: SkirmishWarband }) {
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editFigure, setEditFigure] = useState<SkirmishFigure | null>(null)
  const { addFigure, updateFigure, removeFigure, deleteWarband } = useWarbandStore()

  const over = warband.totalPoints > 200
  const race = skirmishRaces.find(r => r.id === warband.race)

  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      <div className="flex items-center justify-between px-3 py-2.5 bg-[var(--card)]">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <div>
            <p className="font-semibold text-sm">{warband.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{warband.player} · {race?.name ?? warband.race} · {warband.figures.length}/15 figs</p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-sm font-bold', over ? 'text-red-400' : 'text-[var(--foreground)]')}>
            {warband.totalPoints}/200
            {over && ' OVER'}
          </span>
          <button onClick={() => deleteWarband(warband.id)} className="text-[var(--muted-foreground)] hover:text-red-400 p-1"><Trash2 size={14} /></button>
        </div>
      </div>

      {open && (
        <div className="bg-[var(--background)]">
          {warband.figures.length === 0 ? (
            <p className="px-4 py-3 text-xs text-[var(--muted-foreground)] italic">No figures yet.</p>
          ) : (
            warband.figures.map(f => (
              <FigureRow
                key={f.id}
                figure={f}
                onEdit={() => setEditFigure(f)}
                onDelete={() => removeFigure(warband.id, f.id)}
              />
            ))
          )}
          {warband.figures.length < 15 && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              <Plus size={12} /> Add figure
            </button>
          )}
        </div>
      )}

      <FigureFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={draft => addFigure(warband.id, draft)}
        warband={warband}
      />
      {editFigure && (
        <FigureFormModal
          open={!!editFigure}
          onClose={() => setEditFigure(null)}
          onSave={draft => updateFigure(warband.id, editFigure.id, draft)}
          initial={editFigure}
          warband={warband}
        />
      )}
    </div>
  )
}

// ── Create Warband Form ───────────────────────────────────────────────────────

function CreateWarbandForm({ onClose }: { onClose: () => void }) {
  const [name,   setName]   = useState('')
  const [player, setPlayer] = useState('')
  const [race,   setRace]   = useState<SkirmishRaceId>('HUMAN')
  const { createWarband } = useWarbandStore()

  function handleCreate() {
    if (!name.trim()) return
    createWarband(name.trim(), player.trim(), race)
    onClose()
  }

  return (
    <div className="border rounded-lg p-4 mb-4 bg-[var(--card)] space-y-3">
      <p className="text-sm font-semibold">New Warband</p>
      <input
        className="w-full rounded border bg-[var(--background)] px-3 py-2 text-sm"
        placeholder="Warband name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        className="w-full rounded border bg-[var(--background)] px-3 py-2 text-sm"
        placeholder="Player name (optional)"
        value={player}
        onChange={e => setPlayer(e.target.value)}
      />
      <select
        className="w-full rounded border bg-[var(--background)] px-3 py-2 text-sm"
        value={race}
        onChange={e => setRace(e.target.value as SkirmishRaceId)}
      >
        {skirmishRaces.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="rounded border px-4 py-1.5 text-sm">Cancel</button>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="rounded bg-[var(--foreground)] text-[var(--background)] px-4 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Create
        </button>
      </div>
    </div>
  )
}

// ── Main Tab ─────────────────────────────────────────────────────────────────

export function WarbandBuilderTab() {
  const [creating, setCreating] = useState(false)
  const { warbands } = useWarbandStore()

  return (
    <div className="p-4">
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 w-full justify-center rounded border border-dashed py-3 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors mb-4"
        >
          <Plus size={16} /> New Warband
        </button>
      )}
      {creating && <CreateWarbandForm onClose={() => setCreating(false)} />}

      {warbands.length === 0 && !creating ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          <Swords size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No warbands yet.</p>
          <p className="text-xs mt-1">Create your first warband above.</p>
        </div>
      ) : (
        warbands.map(w => <WarbandCard key={w.id} warband={w} />)
      )}
    </div>
  )
}
