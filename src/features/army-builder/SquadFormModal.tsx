import { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, Minus, Trash2, Search, ChevronDown, ChevronUp, UserPlus } from 'lucide-react'
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
  weaponsMelee,
  grenades,
  allWeapons,
} from '@data/index'
import type { SquadSelection, TrooperLine, WeaponLoadout } from '@types-bs/squad'
import type { TrainingClass, ArmourType, RaceType, SkillType, VehicleHullType, VehicleArmourClass } from '@types-bs/enums'
import type { Weapon } from '@types-bs/weapon'
import { calcSquadPoints, calcSquadMorale } from '@lib/pointsCalc'
import { generateId } from '@lib/utils'
import { cn } from '@lib/utils'

// ── Public types ───────────────────────────────────────────────────────────────
export type SquadDraft = Omit<SquadSelection, 'selectionId' | 'pointsTotal' | 'moraleValue'>

// ── Data helpers ───────────────────────────────────────────────────────────────
const WEAPON_CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'INFANTRY', label: 'Infantry' },
  { id: 'SUPPORT', label: 'Support' },
  { id: 'HEAVY', label: 'Heavy' },
  { id: 'MELEE', label: 'Melee' },
  { id: 'GRENADE', label: 'Grenades' },
  { id: 'ALIEN', label: 'Alien' },
  { id: 'VEHICLE', label: 'Vehicle' },
] as const
type WeaponCatFilter = (typeof WEAPON_CATEGORIES)[number]['id']

const HULL_TYPE_OPTIONS: { value: VehicleHullType; label: string }[] = [
  { value: 'BIKE_TRIKE',        label: 'Bike / Trike' },
  { value: 'SCOUT_CAR',         label: 'Scout Car' },
  { value: 'APC',               label: 'APC' },
  { value: 'GMC',               label: 'GMC (Grav Military Carrier)' },
  { value: 'TRANSPORT',         label: 'Transport' },
  { value: 'LIGHT_MECHA',       label: 'Light Mecha' },
  { value: 'LIGHT_WALKER',      label: 'Light Walker' },
  { value: 'LIGHT_TANK',        label: 'Light Tank' },
  { value: 'MEDIUM_MECHA',      label: 'Medium Mecha' },
  { value: 'MEDIUM_TANK',       label: 'Medium Tank' },
  { value: 'HEAVY_MECHA',       label: 'Heavy Mecha' },
  { value: 'HEAVY_WALKER',      label: 'Heavy Walker' },
  { value: 'TRANSPORT_WALKER',  label: 'Transport Walker' },
  { value: 'HEAVY_TANK',        label: 'Heavy Tank' },
  { value: 'SUPER_HEAVY_TANK',  label: 'Super Heavy Tank' },
  { value: 'AIRCRAFT',          label: 'Aircraft' },
  { value: 'OTHER',             label: 'Other' },
]

const ARMOUR_CLASS_OPTIONS: { value: VehicleArmourClass; label: string }[] = [
  { value: 0, label: 'Class 0 — Soft Skin (SS)' },
  { value: 1, label: 'Class 1 — Very Light (SS)' },
  { value: 2, label: 'Class 2 — Light (VL-VA)' },
  { value: 3, label: 'Class 3 — Light Tank (L-VA)' },
  { value: 4, label: 'Class 4 — Medium Tank (M-VA)' },
  { value: 5, label: 'Class 5 — Heavy Tank (H-VA)' },
  { value: 6, label: 'Class 6 — Super Heavy (VH-VA)' },
]

// Equipment items relevant for vehicles (excludes jet packs and digimedic)
const VEHICLE_EQUIP_IDS = ['targeter', 'support-targeter', 'shield-energy', 'shield-projectile',
  'shield-multi', 'shield-null', 'ecm-suite', 'ads', 'sensor-array', 'command-array', 'stealth-cloak', 'laser-painter']

function armourIdToEnum(id: string): ArmourType {
  return (id === 'AD' ? 'DA' : id) as ArmourType
}
function armourEnumToId(a: ArmourType | undefined): string {
  if (!a) return 'LA'
  return a === 'DA' || a === 'DA_SHIELDED' ? 'AD' : a.replace('_SHIELDED', '')
}
function getArmourCost(id: string): number {
  return (armourTypes.find(a => a.id === id) as { pointsCost: number } | undefined)?.pointsCost ?? 0
}
function getTrainingCost(id: string): number {
  return (troopTraining.find(t => t.id === id) as { pointsCost: number } | undefined)?.pointsCost ?? 0
}
function getWeaponCost(wId: string): number {
  return allWeapons.find(w => w.id === wId)?.pointsCost ?? 0
}
function getEquipCost(eId: string): number {
  return (equipmentData.find(e => e.id === eId) as { pointsCost: number } | undefined)?.pointsCost ?? 0
}
function getSkillCost(sId: string): number {
  return (skillsData.find(s => s.id === sId) as { pointsCost: number } | undefined)?.pointsCost ?? 0
}

function defaultLine(): TrooperLine {
  return {
    id: generateId(),
    label: '',
    count: 1,
    trainingClass: 'REGULAR',
    armourType: 'LA',
    weapons: [],
    equipment: [],
    skills: [],
  }
}

function defaultDraft(race: RaceType): SquadDraft {
  return {
    squadName: '',
    race,
    isVehicle: false,
    troopers: [defaultLine()],
    vehicleHullType: undefined,
    vehicleArmourClass: undefined,
    vehicleName: undefined,
    vehicleBasePoints: 0,
    vehicleWeapons: [],
    vehicleEquipment: [],
    notes: '',
  }
}

// ── Weapon search picker (for each TrooperLine) ────────────────────────────────
function WeaponPicker({
  selectedIds,
  armyRace,
  onChange,
  defaultCatFilter = 'ALL',
}: {
  selectedIds: string[]
  armyRace: RaceType
  onChange: (ids: string[]) => void
  defaultCatFilter?: WeaponCatFilter
}) {
  const [catFilter, setCatFilter] = useState<WeaponCatFilter>(defaultCatFilter)
  const [query, setQuery] = useState('')

  const pool = useMemo(() => {
    const raceData = races.find(r => r.id === armyRace) as { alienWeaponIds: string[] } | undefined
    const alienIds = new Set(raceData?.alienWeaponIds ?? [])
    return [
      ...(weaponsInfantry as Weapon[]),
      ...(weaponsSupport as Weapon[]),
      ...(weaponsHeavy as Weapon[]),
      ...(weaponsMelee as Weapon[]),
      ...(grenades as unknown as Weapon[]),
      ...(weaponsAlien as Weapon[]).filter(w => alienIds.has(w.id)),
    ]
  }, [armyRace])

  const fuse = useMemo(() => new Fuse(pool, { keys: ['name', 'code'], threshold: 0.35 }), [pool])

  const filtered = useMemo(() => {
    let items = query.trim() ? fuse.search(query.trim()).map(r => r.item) : pool
    if (catFilter !== 'ALL') {
      items = items.filter(w => w.category === (catFilter === 'VEHICLE' ? 'VEHICLE_MOUNTED' : catFilter))
    }
    return items.slice(0, 40)
  }, [query, catFilter, pool, fuse])

  const selected = new Set(selectedIds)

  return (
    <div className="space-y-2">
      {/* Selected weapons */}
      {selectedIds.length > 0 && (
        <div className="space-y-1">
          {selectedIds.map(wId => {
            const w = pool.find(w => w.id === wId) ?? allWeapons.find(w => w.id === wId)
            if (!w) return null
            return (
              <div key={wId} className="flex items-center gap-2 rounded-lg bg-[var(--secondary)] px-3 py-1.5">
                <span className="flex-1 text-xs font-medium">{w.name}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{w.pointsCost}pts</span>
                <button type="button" onClick={() => onChange(selectedIds.filter(id => id !== wId))}
                  className="text-red-500 hover:text-red-400 transition-colors">
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-1 flex-wrap">
        {WEAPON_CATEGORIES.map(c => (
          <button key={c.id} type="button" onClick={() => setCatFilter(c.id)}
            className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
              catFilter === c.id
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--secondary)] hover:bg-[var(--accent)]'
            )}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input type="text" placeholder="Search weapons…" value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      {/* List */}
      <div className="max-h-36 overflow-y-auto rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {filtered.length === 0 ? (
          <p className="py-3 text-center text-xs text-[var(--muted-foreground)]">No weapons found</p>
        ) : filtered.map(w => (
          <button key={w.id} type="button" disabled={selected.has(w.id)}
            onClick={() => onChange([...selectedIds, w.id])}
            className="w-full flex justify-between items-center px-3 py-1.5 text-xs text-left hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <span className="font-medium">{w.name} <span className="text-[var(--muted-foreground)] font-normal">[{w.code}]</span></span>
            <span className="shrink-0 ml-2 text-[var(--muted-foreground)]">{w.pointsCost}pts</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Per-figure cost breakdown ──────────────────────────────────────────────────
function perFigureCost(line: TrooperLine): number {
  const armId = armourEnumToId(line.armourType)
  return getTrainingCost(line.trainingClass)
    + getArmourCost(armId)
    + line.weapons.reduce((s, id) => s + getWeaponCost(id), 0)
    + line.equipment.reduce((s, id) => s + getEquipCost(id), 0)
    + line.skills.reduce((s, id) => s + getSkillCost(id), 0)
}

// ── Trooper Line Card ──────────────────────────────────────────────────────────
function TrooperLineCard({
  line,
  armyRace,
  onChange,
  onDelete,
  canDelete,
}: {
  line: TrooperLine
  armyRace: RaceType
  onChange: (updated: TrooperLine) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'weapons' | 'equip-skills'>('weapons')

  const armId = armourEnumToId(line.armourType)
  const training = troopTraining.find(t => t.id === line.trainingClass) as
    { name: string; pointsCost: number; skillsAllowed: number } | undefined
  const isHero = line.trainingClass === 'HERO'
  const maxSkills = training?.skillsAllowed ?? 0
  const pfCost = perFigureCost(line)
  const linePts = pfCost * line.count
  const lineMorale = (isHero ? 3 : 1) * line.count

  function update<K extends keyof TrooperLine>(key: K, val: TrooperLine[K]) {
    onChange({ ...line, [key]: val })
  }

  function toggleSkill(id: SkillType) {
    if (line.skills.includes(id)) {
      update('skills', line.skills.filter(s => s !== id))
    } else if (line.skills.length < maxSkills) {
      update('skills', [...line.skills, id])
    }
  }

  function toggleEquip(id: string) {
    update('equipment', line.equipment.includes(id)
      ? line.equipment.filter(e => e !== id)
      : [...line.equipment, id]
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)]">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--secondary)]/60">
        {/* Label input */}
        <input
          type="text"
          placeholder="Figure type (e.g. Scout, Leader)"
          value={line.label}
          onChange={e => update('label', e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm font-medium placeholder:text-[var(--muted-foreground)] focus:outline-none"
        />

        {/* Count stepper */}
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => update('count', Math.max(1, line.count - 1))}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
            disabled={line.count <= 1}>
            <Minus size={12} />
          </button>
          <span className="w-6 text-center text-sm font-bold tabular-nums">{line.count}</span>
          <button type="button" onClick={() => update('count', isHero ? 1 : line.count + 1)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
            disabled={isHero}>
            <Plus size={12} />
          </button>
        </div>

        {/* Points */}
        <span className="text-xs font-semibold text-[var(--primary)] shrink-0 w-16 text-right">
          {linePts}pts
        </span>

        {/* Expand/delete */}
        <button type="button" onClick={() => setOpen(o => !o)}
          className="p-1 rounded hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)]">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {canDelete && (
          <button type="button" onClick={onDelete}
            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="px-3 pb-3 pt-2 space-y-3">
          {/* Training + Armour row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Training</label>
              <select
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={line.trainingClass}
                onChange={e => {
                  const tc = e.target.value as TrainingClass
                  const newMax = (troopTraining.find(t => t.id === tc) as { skillsAllowed: number } | undefined)?.skillsAllowed ?? 0
                  onChange({
                    ...line,
                    trainingClass: tc,
                    count: tc === 'HERO' ? 1 : line.count,
                    skills: line.skills.slice(0, newMax),
                  })
                }}
              >
                {troopTraining.map(t => {
                  const tt = t as { id: string; name: string; pointsCost: number }
                  return <option key={tt.id} value={tt.id}>{tt.name} (+{tt.pointsCost}pts)</option>
                })}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Armour</label>
              <select
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={armId}
                onChange={e => update('armourType', armourIdToEnum(e.target.value))}
              >
                {armourTypes.map(a => {
                  const at = a as { id: string; abbreviation: string; pointsCost: number }
                  return <option key={at.id} value={at.id}>{at.abbreviation} (+{at.pointsCost}pts)</option>
                })}
              </select>
            </div>
          </div>

          {/* Per-figure cost summary */}
          <p className="text-[10px] text-[var(--muted-foreground)]">
            {pfCost}pts/figure × {line.count} = <strong className="text-[var(--foreground)]">{linePts}pts</strong>
            <span className="ml-2">{lineMorale} morale</span>
          </p>

          {/* Sub-tabs */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium">
            <button type="button" onClick={() => setTab('weapons')}
              className={cn('flex-1 py-1.5 transition-colors',
                tab === 'weapons' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]'
              )}>
              Weapons {line.weapons.length > 0 && `(${line.weapons.length})`}
            </button>
            <button type="button" onClick={() => setTab('equip-skills')}
              className={cn('flex-1 py-1.5 transition-colors',
                tab === 'equip-skills' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]'
              )}>
              Equip & Skills {(line.equipment.length + line.skills.length) > 0 && `(${line.equipment.length + line.skills.length})`}
            </button>
          </div>

          {/* Weapons tab */}
          {tab === 'weapons' && (
            <WeaponPicker
              selectedIds={line.weapons}
              armyRace={armyRace}
              onChange={ids => update('weapons', ids)}
            />
          )}

          {/* Equipment & Skills tab */}
          {tab === 'equip-skills' && (
            <div className="space-y-4">
              {/* Equipment */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Equipment (per figure)</p>
                <div className="space-y-1">
                  {(equipmentData as { id: string; name: string; pointsCost: number; isVehicleOnly: boolean }[])
                    .filter(e => !e.isVehicleOnly)
                    .map(e => {
                      const on = line.equipment.includes(e.id)
                      return (
                        <button key={e.id} type="button" onClick={() => toggleEquip(e.id)}
                          className={cn('w-full flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-left transition-colors',
                            on ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:bg-[var(--accent)]'
                          )}>
                          <span className={cn('w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[10px]',
                            on ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)]'
                          )}>{on ? '✓' : ''}</span>
                          <span className="flex-1">{e.name}</span>
                          <span className="text-[var(--muted-foreground)]">+{e.pointsCost}pts</span>
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Skills */}
              {maxSkills > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Skills — {line.skills.length}/{maxSkills} selected (per figure)
                  </p>
                  <div className="space-y-1">
                    {(skillsData as { id: string; name: string; pointsCost: number; heroOnly: boolean; description: string }[])
                      .filter(s => !s.heroOnly || isHero)
                      .map(s => {
                        const on = line.skills.includes(s.id as SkillType)
                        const canAdd = !on && line.skills.length < maxSkills
                        return (
                          <button key={s.id} type="button"
                            onClick={() => toggleSkill(s.id as SkillType)}
                            disabled={!on && !canAdd}
                            className={cn('w-full flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-left transition-colors',
                              on ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                : canAdd ? 'border-[var(--border)] hover:bg-[var(--accent)]'
                                : 'border-[var(--border)] opacity-40 cursor-not-allowed'
                            )}>
                            <span className={cn('w-3.5 h-3.5 mt-0.5 rounded border shrink-0 flex items-center justify-center text-[10px]',
                              on ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)]'
                            )}>{on ? '✓' : ''}</span>
                            <span className="flex-1 min-w-0">
                              <span className="font-medium">{s.name}</span>
                              <span className="ml-1 text-[var(--muted-foreground)]">+{s.pointsCost}pts</span>
                              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 leading-snug line-clamp-2">{s.description}</p>
                            </span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
              {maxSkills === 0 && (
                <p className="text-xs text-[var(--muted-foreground)] italic">Civilians cannot purchase skills.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Squad Form ─────────────────────────────────────────────────────────────────
function SquadForm({ initial, onSave, onCancel }: {
  initial: SquadDraft
  onSave: (draft: SquadDraft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<SquadDraft>(initial)

  function set<K extends keyof SquadDraft>(key: K, val: SquadDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: val }))
  }

  function addLine() {
    set('troopers', [...draft.troopers, defaultLine()])
  }

  function updateLine(idx: number, updated: TrooperLine) {
    const troopers = [...draft.troopers]
    troopers[idx] = updated
    set('troopers', troopers)
  }

  function removeLine(idx: number) {
    set('troopers', draft.troopers.filter((_, i) => i !== idx))
  }

  const fullSquad: SquadSelection = {
    ...draft, selectionId: '', pointsTotal: 0, moraleValue: 0,
  }
  const livePoints = calcSquadPoints(fullSquad)
  const liveMorale = calcSquadMorale(fullSquad)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!draft.squadName.trim()) return
    onSave({ ...draft, squadName: draft.squadName.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Squad name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Squad Name *</label>
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="e.g. Spec Ops Unit"
            value={draft.squadName}
            onChange={e => set('squadName', e.target.value)}
            required
          />
        </div>

        {/* Race + Type */}
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
                className={cn('flex-1 py-2 transition-colors', !draft.isVehicle ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]')}>
                Infantry
              </button>
              <button type="button" onClick={() => set('isVehicle', true)}
                className={cn('flex-1 py-2 transition-colors', draft.isVehicle ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]')}>
                Vehicle
              </button>
            </div>
          </div>
        </div>

        {/* Infantry — TrooperLine cards */}
        {!draft.isVehicle && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Figure Types ({draft.troopers.length})
              </label>
              <button type="button" onClick={addLine}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:opacity-80 transition-opacity">
                <UserPlus size={13} /> Add Figure Type
              </button>
            </div>
            {draft.troopers.map((line, idx) => (
              <TrooperLineCard
                key={line.id}
                line={line}
                armyRace={draft.race}
                onChange={updated => updateLine(idx, updated)}
                onDelete={() => removeLine(idx)}
                canDelete={draft.troopers.length > 1}
              />
            ))}
          </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Hull Type</label>
                <select
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={draft.vehicleHullType ?? ''}
                  onChange={e => set('vehicleHullType', e.target.value as VehicleHullType)}
                >
                  <option value="">— select —</option>
                  {HULL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Armour Class</label>
                <select
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  value={draft.vehicleArmourClass ?? ''}
                  onChange={e => set('vehicleArmourClass', Number(e.target.value) as VehicleArmourClass)}
                >
                  <option value="">— select —</option>
                  {ARMOUR_CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Base Points <span className="normal-case font-normal text-[var(--muted-foreground)]">(hull + movement, from vehicle chart)</span></label>
              <input type="number" min={0}
                className="w-32 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={draft.vehicleBasePoints ?? 0}
                onChange={e => set('vehicleBasePoints', Math.max(0, Number(e.target.value)))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Equipment</label>
              <div className="space-y-1">
                {VEHICLE_EQUIP_IDS.map(eId => {
                  const eq = equipmentData.find(e => e.id === eId) as { id: string; name: string; pointsCost: number; vehicleCost?: number } | undefined
                  if (!eq) return null
                  const cost = eq.vehicleCost ?? eq.pointsCost
                  const checked = (draft.vehicleEquipment ?? []).includes(eId)
                  return (
                    <label key={eId} className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-[var(--accent)] cursor-pointer">
                      <input type="checkbox" className="accent-[var(--primary)]" checked={checked}
                        onChange={() => {
                          const cur = draft.vehicleEquipment ?? []
                          set('vehicleEquipment', checked ? cur.filter(x => x !== eId) : [...cur, eId])
                        }} />
                      <span className="flex-1 text-sm">{eq.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{cost}pts</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Weapons</label>
              <WeaponPicker
                selectedIds={(draft.vehicleWeapons ?? []).map(w => w.weaponId)}
                armyRace={draft.race}
                defaultCatFilter="VEHICLE"
                onChange={ids => set('vehicleWeapons', ids.map(id => ({
                  weaponId: id,
                  count: 1,
                } satisfies WeaponLoadout)))}
              />
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Vehicles count as 3 morale points.</p>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Notes</label>
          <textarea rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            placeholder="Optional squad notes"
            value={draft.notes}
            onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 bg-[var(--card)] space-y-3">
        <div className="flex justify-between text-sm font-semibold">
          <span>Squad total</span>
          <span>{livePoints} pts · {liveMorale} morale</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium hover:bg-[var(--accent)] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!draft.squadName.trim()}
            className="flex-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
            Save Squad
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Modal shell ────────────────────────────────────────────────────────────────
interface SquadFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: SquadSelection
  armyRace: RaceType
  onSave: (draft: SquadDraft) => void
}

export function SquadFormModal({ open, onOpenChange, editing, armyRace, onSave }: SquadFormModalProps) {
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
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-[var(--card)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:h-[min(92vh,760px)] sm:rounded-2xl sm:shadow-2xl overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <Dialog.Title className="font-semibold text-base">
              {editing ? 'Edit Squad' : 'Add Squad'}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 hover:bg-[var(--accent)] transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>
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
