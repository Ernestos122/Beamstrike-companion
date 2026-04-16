import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Copy, Trash2, Shield, Swords, ChevronDown, ChevronUp } from 'lucide-react'
import { useArmyStore } from '@store/armyStore'
import { armourTypes, troopTraining, allWeapons, races } from '@data/index'
import type { SquadSelection } from '@types-bs/squad'
import type { ArmyList } from '@types-bs/army'
import { SquadFormModal } from './SquadFormModal'
import type { SquadDraft } from './SquadFormModal'

// ── Points bar ─────────────────────────────────────────────────────────────────
function PointsBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  const over = used > limit
  const remaining = limit - used

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{used} pts used</span>
        <span className={over ? 'text-red-500 font-semibold' : 'text-[var(--muted-foreground)]'}>
          {over ? `${Math.abs(remaining)} pts over` : `${remaining} pts remaining`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-[var(--primary)]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-[var(--muted-foreground)]">Limit: {limit} pts</div>
    </div>
  )
}

// ── Morale summary ─────────────────────────────────────────────────────────────
function MoraleSummary({ army }: { army: ArmyList }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 grid grid-cols-3 gap-2 text-center text-sm">
      <div>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Total Morale</p>
        <p className="text-lg font-bold">{army.totalMoraleValue}</p>
      </div>
      <div>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">½ Threshold</p>
        <p className="text-lg font-bold">{army.halfMoraleThreshold}</p>
      </div>
      <div>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Objectives</p>
        <p className="text-lg font-bold">{army.nominatedObjectiveMorale}</p>
      </div>
    </div>
  )
}

// ── Squad card ─────────────────────────────────────────────────────────────────
function SquadCard({
  squad,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  squad: SquadSelection
  onEdit: () => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const trainingName = squad.isVehicle
    ? 'Vehicle'
    : (troopTraining.find(t => t.id === squad.trainingClass) as { abbreviation: string } | undefined)?.abbreviation ?? squad.trainingClass ?? '—'

  const armourAbbr = squad.isVehicle
    ? null
    : (armourTypes.find(a => {
        const id = squad.armourType === 'DA' || squad.armourType === 'DA_SHIELDED' ? 'AD' : squad.armourType?.replace('_SHIELDED', '')
        return a.id === id
      }) as { abbreviation: string } | undefined)?.abbreviation ?? squad.armourType

  const raceName = (races.find(r => r.id === squad.race) as { name: string } | undefined)?.name ?? squad.race

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Main row */}
      <div className="flex items-start gap-3 p-3">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold truncate">{squad.squadName}</span>
            <div className="flex gap-1 flex-wrap">
              {squad.isVehicle ? (
                <span className="text-xs rounded bg-[var(--secondary)] px-1.5 py-0.5">Vehicle</span>
              ) : (
                <>
                  <span className="text-xs rounded bg-[var(--secondary)] px-1.5 py-0.5">{trainingName}</span>
                  <span className="text-xs rounded bg-[var(--secondary)] px-1.5 py-0.5">{armourAbbr}</span>
                  {(squad.modelCount ?? 0) > 0 && (
                    <span className="text-xs rounded bg-[var(--secondary)] px-1.5 py-0.5">×{squad.modelCount}</span>
                  )}
                  <span className="text-xs rounded bg-[var(--secondary)] px-1.5 py-0.5">{raceName}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">{squad.pointsTotal} pts</span>
            <span>{squad.moraleValue} morale</span>
            {squad.weapons.length > 0 && <span>{squad.weapons.length} weapon{squad.weapons.length !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="rounded-lg p-1.5 hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)]"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-1.5 hover:bg-[var(--accent)] transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-lg p-1.5 hover:bg-[var(--accent)] transition-colors"
            title="Duplicate"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
            title="Remove"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="border-t border-[var(--border)] bg-red-50 dark:bg-red-950/20 px-3 py-2 flex items-center gap-2">
          <span className="flex-1 text-xs">Remove this squad?</span>
          <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--accent)]">Cancel</button>
          <button onClick={onRemove} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">Remove</button>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-3 py-2.5 space-y-2 bg-[var(--secondary)]/40">
          {squad.weapons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Weapons</p>
              <div className="space-y-0.5">
                {squad.weapons.map(wl => {
                  const w = allWeapons.find(w => w.id === wl.weaponId)
                  if (!w) return null
                  return (
                    <div key={wl.weaponId} className="flex justify-between text-xs">
                      <span>{w.name} <span className="text-[var(--muted-foreground)]">×{wl.count}</span></span>
                      <span className="text-[var(--muted-foreground)]">{w.pointsCost * wl.count}pts</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {(squad.skills ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Skills</p>
              <p className="text-xs">{squad.skills!.join(', ')}</p>
            </div>
          )}
          {squad.equipment.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Equipment</p>
              <p className="text-xs">{squad.equipment.join(', ')}</p>
            </div>
          )}
          {squad.notes && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Notes</p>
              <p className="text-xs">{squad.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Army settings panel ────────────────────────────────────────────────────────
function ArmySettingsPanel({ army, onClose }: { army: ArmyList; onClose: () => void }) {
  const updateArmy = useArmyStore(s => s.updateArmy)
  const [name, setName] = useState(army.name)
  const [playerName, setPlayerName] = useState(army.playerName)
  const [pointsLimit, setPointsLimit] = useState(army.pointsLimit)
  const [nominatedObj, setNominatedObj] = useState(army.nominatedObjectiveMorale)
  const [notes, setNotes] = useState(army.notes)

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    updateArmy(army.id, {
      name: name.trim(),
      playerName: playerName.trim(),
      pointsLimit,
      nominatedObjectiveMorale: nominatedObj,
      notes,
    })
    onClose()
  }

  return (
    <form onSubmit={save} className="space-y-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Army Settings</h3>
        <button type="button" onClick={onClose} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Close</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Army Name</label>
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Player</label>
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />
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
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Objectives Morale (0–20)</label>
          <input
            type="number"
            min={0}
            max={20}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={nominatedObj}
            onChange={e => setNominatedObj(Math.min(20, Math.max(0, Number(e.target.value))))}
          />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Notes</label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Save Changes
      </button>
    </form>
  )
}

// ── Army Editor View ───────────────────────────────────────────────────────────
export function ArmyEditorView({ armyId }: { armyId: string }) {
  const navigate = useNavigate()
  const army = useArmyStore(s => s.armies.find(a => a.id === armyId))
  const addSquad = useArmyStore(s => s.addSquad)
  const updateSquad = useArmyStore(s => s.updateSquad)
  const removeSquad = useArmyStore(s => s.removeSquad)
  const duplicateSquad = useArmyStore(s => s.duplicateSquad)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSquad, setEditingSquad] = useState<SquadSelection | undefined>()
  const [showSettings, setShowSettings] = useState(false)

  if (!army) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-[var(--muted-foreground)]">Army not found.</p>
        <button onClick={() => navigate('/army')} className="text-sm underline">Back to army list</button>
      </div>
    )
  }

  function openAdd() {
    setEditingSquad(undefined)
    setModalOpen(true)
  }

  function openEdit(squad: SquadSelection) {
    setEditingSquad(squad)
    setModalOpen(true)
  }

  function handleSave(draft: SquadDraft) {
    if (editingSquad) {
      updateSquad(army!.id, editingSquad.selectionId, draft)
    } else {
      addSquad(army!.id, draft)
    }
  }

  const raceName = (races.find(r => r.id === army.primaryRace) as { name: string } | undefined)?.name ?? army.primaryRace

  return (
    <div className="max-w-xl mx-auto">
      {/* Top header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/army')}
            className="rounded-lg p-1.5 hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)]"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{army.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{raceName}{army.playerName ? ` · ${army.playerName}` : ''}</p>
          </div>
          <button
            onClick={() => setShowSettings(s => !s)}
            className="rounded-lg px-2.5 py-1.5 text-xs border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
          >
            Settings
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Settings panel */}
        {showSettings && <ArmySettingsPanel army={army} onClose={() => setShowSettings(false)} />}

        {/* Points bar */}
        <PointsBar used={army.totalPoints} limit={army.pointsLimit} />

        {/* Morale summary */}
        <MoraleSummary army={army} />

        {/* Squad list header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-1.5 text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
            <Swords size={15} />
            Squads ({army.squads.length})
          </h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Add Squad
          </button>
        </div>

        {/* Empty state */}
        {army.squads.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center space-y-2">
            <Shield size={28} className="mx-auto text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">No squads yet. Add your first squad.</p>
          </div>
        )}

        {/* Squad cards */}
        <div className="space-y-2">
          {army.squads.map(squad => (
            <SquadCard
              key={squad.selectionId}
              squad={squad}
              onEdit={() => openEdit(squad)}
              onDuplicate={() => duplicateSquad(army.id, squad.selectionId)}
              onRemove={() => removeSquad(army.id, squad.selectionId)}
            />
          ))}
        </div>

        {/* Total footer */}
        {army.squads.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{army.totalPoints} / {army.pointsLimit} pts</span>
          </div>
        )}
      </div>

      {/* Squad form modal */}
      <SquadFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editingSquad}
        armyRace={army.primaryRace}
        onSave={handleSave}
      />
    </div>
  )
}
