import { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, Minus, Trash2, Search } from 'lucide-react'
import Fuse from 'fuse.js'
import {
  troopTraining,
  armourTypes,
  skills as skillsData,
  equipment as equipmentData,
  races,
  weaponsInfantry,
  weaponsSupport,
  weaponsHeavy,
  weaponsAlien,
  weaponsVehicle,
} from '@data/index'
import type { SquadSelection, WeaponLoadout } from '@types-bs/squad'
import type { TrainingClass, ArmourType, RaceType, SkillType } from '@types-bs/enums'
import type { Weapon } from '@types-bs/weapon'
import { calcSquadPoints, calcSquadMorale } from '@lib/pointsCalc'

// ── Types ──────────────────────────────────────────────────────────────────────
export type SquadDraft = Omit<SquadSelection, 'selectionId' | 'pointsTotal' | 'moraleValue'>

const WEAPON_CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'INFANTRY', label: 'Infantry' },
  { id: 'SUPPORT', label: 'Support' },
  { id: 'HEAVY', label: 'Heavy' },
  { id: 'ALIEN', label: 'Alien' },
  { id: 'VEHICLE', label: 'Vehicle' },
] as const

type WeaponCatFilter = (typeof WEAPON_CATEGORIES)[number]['id']

// ── Default draft ──────────────────────────────────────────────────────────────
function defaultDraft(race: RaceType): SquadDraft {
  return {
    squadName: '',
    race,
    isVehicle: false,
    trainingClass: 'REGULAR',
    armourType: 'LA',
    shieldType: null,
    modelCount: 5,
    skills: [],
    basePointsPerModel: undefined,
    vehicleHullType: undefined,
    vehicleArmourClass: undefined,
    vehicleName: undefined,
    vehicleBasePoints: 0,
    weapons: [],
    equipment: [],
    notes: '',
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getArmourCostFromId(id: string): number {
  const a = armourTypes.find(a => a.id === id) as { pointsCost: number } | undefined
  return a?.pointsCost ?? 0
}
function armourIdToEnum(id: string): ArmourType {
  return (id === 'AD' ? 'DA' : id) as ArmourType
}
function armourEnumToId(a: ArmourType | undefined): string {
  if (!a) return 'LA'
  return a === 'DA' || a === 'DA_SHIELDED' ? 'AD' : a.replace('_SHIELDED', '')
}

// ── Weapon Picker ──────────────────────────────────────────────────────────────
function WeaponPicker({
  loadouts,
  armyRace,
  modelCount,
  onChange,
}: {
  loadouts: WeaponLoadout[]
  armyRace: RaceType
  modelCount: number
  onChange: (l: WeaponLoadout[]) => void
}) {
  const [catFilter, setCatFilter] = useState<WeaponCatFilter>('ALL')
  const [query, setQuery] = useState('')

  const allWeaponPool = useMemo(() => {
    const raceData = races.find(r => r.id === armyRace) as { alienWeaponIds: string[] } | undefined
    const alienIds = new Set(raceData?.alienWeaponIds ?? [])
    // Bug fix: only include alien weapons the race actually has access to
    const alien = (weaponsAlien as Weapon[]).filter(w => alienIds.has(w.id))
    return [
      ...(weaponsInfantry as Weapon[]),
      ...(weaponsSupport as Weapon[]),
      ...(weaponsHeavy as Weapon[]),
      ...alien,
      ...(weaponsVehicle as Weapon[]),
    ]
  }, [armyRace])

  const fuse = useMemo(() => new Fuse(allWeaponPool, {
    keys: ['name', 'code'],
    threshold: 0.35,
    minMatchCharLength: 1,
  }), [allWeaponPool])

  const filtered = useMemo(() => {
    let pool: Weapon[]
    if (query.trim()) {
      pool = fuse.search(query.trim()).map(r => r.item)
    } else {
      pool = allWeaponPool
    }
    if (catFilter !== 'ALL') {
      const cat = catFilter === 'VEHICLE' ? 'VEHICLE_MOUNTED' : catFilter
      pool = pool.filter(w => w.category === cat)
    }
    return pool.slice(0, 40)
  }, [query, catFilter, allWeaponPool, fuse])

  const loadedIds = new Set(loadouts.map(l => l.weaponId))

  function add(weapon: Weapon) {
    if (loadedIds.has(weapon.id)) return
    // Default count = model count so cost is already per-troop
    onChange([...loadouts, { weaponId: weapon.id, count: modelCount }])
  }

  function remove(id: string) {
    onChange(loadouts.filter(l => l.weaponId !== id))
  }

  function setCount(id: string, count: number) {
    if (count < 1) { remove(id); return }
    onChange(loadouts.map(l => l.weaponId === id ? { ...l, count } : l))
  }

  return (
    <div className="space-y-3">
      {/* Selected weapons */}
      {loadouts.length > 0 && (
        <div className="space-y-1.5">
          {loadouts.map(l => {
            const w = allWeaponPool.find(w => w.id === l.weaponId)
            if (!w) return null
            return (
              <div key={l.weaponId} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {w.pointsCost}pts × {l.count} troops = <strong>{w.pointsCost * l.count}pts</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCount(l.weaponId, l.count - 1)}
                    className="rounded p-1 hover:bg-[var(--accent)] transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">{l.count}</span>
                  <button
                    type="button"
                    onClick={() => setCount(l.weaponId, l.count + 1)}
                    className="rounded p-1 hover:bg-[var(--accent)] transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(l.weaponId)}
                    className="ml-1 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex gap-1 flex-wrap">
        {WEAPON_CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCatFilter(c.id)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              catFilter === c.id
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search weapons…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Weapon list */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border)]">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--muted-foreground)]">No weapons found</p>
        ) : (
          filtered.map(w => (
            <button
              key={w.id}
              type="button"
              disabled={loadedIds.has(w.id)}
              onClick={() => add(w)}
              className="w-full flex justify-between items-center px-3 py-2 text-left text-sm border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium">{w.name}</span>
                <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">[{w.code}]</span>
              </span>
              <span className="shrink-0 ml-3 text-xs text-[var(--muted-foreground)]">
                {w.pointsCost}pts × {modelCount} = {w.pointsCost * modelCount}pts
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ── Squad Form ─────────────────────────────────────────────────────────────────
// NOTE: No useEffect — form is remounted fresh via `key` in SquadFormModal.
function SquadForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: SquadDraft
  onSave: (draft: SquadDraft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<SquadDraft>(initial)

  function set<K extends keyof SquadDraft>(key: K, val: SquadDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: val }))
  }

  const training = troopTraining.find(t => t.id === draft.trainingClass) as
    { id: string; name: string; abbreviation: string; pointsCost: number; skillsAllowed: number } | undefined
  const maxSkills = training?.skillsAllowed ?? 0
  const isHero = draft.trainingClass === 'HERO'
  const modelCount = draft.modelCount ?? 1

  const livePoints = calcSquadPoints({ ...draft, selectionId: '', pointsTotal: 0, moraleValue: 0 })
  const liveMorale = calcSquadMorale({ ...draft, selectionId: '', pointsTotal: 0, moraleValue: 0 })

  function toggleSkill(id: SkillType) {
    const current = draft.skills ?? []
    if (current.includes(id)) {
      set('skills', current.filter(s => s !== id))
    } else if (current.length < maxSkills) {
      set('skills', [...current, id])
    }
  }

  function toggleEquipment(id: string) {
    const current = draft.equipment
    set('equipment', current.includes(id) ? current.filter(e => e !== id) : [...current, id])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.squadName.trim()) return
    onSave({ ...draft, squadName: draft.squadName.trim() })
  }

  const armourId = armourEnumToId(draft.armourType)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Squad name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Squad Name *</label>
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="e.g. Alpha Squad"
            value={draft.squadName}
            onChange={e => set('squadName', e.target.value)}
            required
          />
        </div>

        {/* Race + Type toggle */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Race</label>
            <select
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={draft.race}
              onChange={e => set('race', e.target.value as RaceType)}
            >
              {races.map(r => <option key={r.id} value={r.id}>{(r as { name: string }).name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Type</label>
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm font-medium">
              <button type="button" onClick={() => set('isVehicle', false)}
                className={`flex-1 py-2 transition-colors ${!draft.isVehicle ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]'}`}
              >Infantry</button>
              <button type="button" onClick={() => set('isVehicle', true)}
                className={`flex-1 py-2 transition-colors ${draft.isVehicle ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]'}`}
              >Vehicle</button>
            </div>
          </div>
        </div>

        {/* Infantry fields */}
        {!draft.isVehicle && (
          <>
            {/* Training + Armour */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Training</label>
                <select
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={draft.trainingClass ?? 'REGULAR'}
                  onChange={e => {
                    const tc = e.target.value as TrainingClass
                    set('trainingClass', tc)
                    if (tc === 'HERO') set('modelCount', 1)
                    const newMax = (troopTraining.find(t => t.id === tc) as { skillsAllowed: number } | undefined)?.skillsAllowed ?? 0
                    const cur = draft.skills ?? []
                    if (cur.length > newMax) set('skills', cur.slice(0, newMax))
                  }}
                >
                  {troopTraining.map(t => {
                    const tt = t as { id: string; name: string; pointsCost: number }
                    return <option key={tt.id} value={tt.id}>{tt.name} ({tt.pointsCost}pts)</option>
                  })}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Armour</label>
                <select
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={armourId}
                  onChange={e => set('armourType', armourIdToEnum(e.target.value))}
                >
                  {armourTypes.map(a => {
                    const at = a as { id: string; abbreviation: string; pointsCost: number }
                    return <option key={at.id} value={at.id}>{at.abbreviation} ({at.pointsCost}pts)</option>
                  })}
                </select>
              </div>
            </div>

            {/* Model count */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Model Count{isHero && <span className="ml-1 normal-case font-normal text-[var(--muted-foreground)]">(Hero = 1)</span>}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={1} max={50}
                  disabled={isHero}
                  className="w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
                  value={modelCount}
                  onChange={e => set('modelCount', Math.max(1, Number(e.target.value)))}
                />
                <span className="text-xs text-[var(--muted-foreground)]">
                  {(training?.pointsCost ?? 0) + getArmourCostFromId(armourId)}pts/model
                  {' = '}<strong>{((training?.pointsCost ?? 0) + getArmourCostFromId(armourId)) * modelCount}pts</strong> base
                </span>
              </div>
            </div>

            {/* Skills — per model */}
            {maxSkills > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Skills ({(draft.skills ?? []).length}/{maxSkills}) — cost per model
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {skillsData.map(s => {
                    const sk = s as { id: string; name: string; pointsCost: number }
                    const checked = (draft.skills ?? []).includes(sk.id as SkillType)
                    const disabled = !checked && (draft.skills ?? []).length >= maxSkills
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleSkill(sk.id as SkillType)}
                        className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-left transition-colors ${
                          checked
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                            : 'border-[var(--border)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                      >
                        <span className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[10px] ${checked ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)]'}`}>
                          {checked ? '✓' : ''}
                        </span>
                        <span>
                          {sk.name}
                          <span className="block text-[var(--muted-foreground)]">
                            {sk.pointsCost}pts × {modelCount} = {sk.pointsCost * modelCount}pts
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Vehicle fields */}
        {draft.isVehicle && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Vehicle Name</label>
              <input
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                placeholder="e.g. Medium Battle Tank"
                value={draft.vehicleName ?? ''}
                onChange={e => set('vehicleName', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Base Points (hull + movement)</label>
              <input
                type="number" min={0}
                className="w-32 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={draft.vehicleBasePoints ?? 0}
                onChange={e => set('vehicleBasePoints', Math.max(0, Number(e.target.value)))}
              />
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Vehicles count as 3 morale points each.</p>
          </div>
        )}

        {/* Weapons — per troop */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Weapons — count = troops carrying it
          </label>
          <WeaponPicker
            loadouts={draft.weapons}
            armyRace={draft.race}
            modelCount={draft.isVehicle ? 1 : modelCount}
            onChange={wl => set('weapons', wl)}
          />
        </div>

        {/* Equipment */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Equipment</label>
          <div className="grid grid-cols-1 gap-1.5">
            {(equipmentData as { id: string; name: string; pointsCost: number; isVehicleOnly: boolean }[])
              .filter(e => draft.isVehicle ? true : !e.isVehicleOnly)
              .map(e => {
                const checked = draft.equipment.includes(e.id)
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleEquipment(e.id)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-left transition-colors ${
                      checked
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[10px] ${checked ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)]'}`}>
                      {checked ? '✓' : ''}
                    </span>
                    <span className="flex-1">{e.name}</span>
                    <span className="text-[var(--muted-foreground)]">{e.pointsCost}pts</span>
                  </button>
                )
              })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Notes</label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            placeholder="Optional squad notes"
            value={draft.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </div>

      {/* Sticky footer — live total */}
      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 bg-[var(--card)] space-y-3">
        <div className="flex justify-between text-sm font-semibold">
          <span>Squad total</span>
          <span>{livePoints} pts · {liveMorale} morale</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium hover:bg-[var(--accent)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!draft.squadName.trim()}
            className="flex-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Save Squad
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Squad Form Modal ───────────────────────────────────────────────────────────
interface SquadFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: SquadSelection
  armyRace: RaceType
  onSave: (draft: SquadDraft) => void
}

export function SquadFormModal({ open, onOpenChange, editing, armyRace, onSave }: SquadFormModalProps) {
  // Stable initial value — only recompute when the dialog opens or the editing squad changes.
  // Using a key prop on SquadForm (below) to remount fresh instead of useEffect.
  const initial = useMemo<SquadDraft>(
    () => editing
      ? (({ selectionId: _id, pointsTotal: _pt, moraleValue: _mv, ...rest }) => rest)(editing)
      : defaultDraft(armyRace),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, editing?.selectionId],
  )

  function handleSave(draft: SquadDraft) {
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        {/*
          Fixed height (not max-height) on desktop so that the form's flex-1 body
          can correctly expand and the weapon list is scrollable and clickable.
        */}
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-[var(--card)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:h-[min(90vh,700px)] sm:rounded-2xl sm:shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <Dialog.Title className="font-semibold text-base">
              {editing ? 'Edit Squad' : 'Add Squad'}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 hover:bg-[var(--accent)] transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/*
            key forces a fresh mount (and fresh useState) whenever the dialog
            opens or switches between add-new and edit-existing.
            This replaces the fragile useEffect(() => setDraft(initial), [initial]).
          */}
          <SquadForm
            key={`${open ? 'open' : 'closed'}-${editing?.selectionId ?? 'new'}`}
            initial={initial}
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
