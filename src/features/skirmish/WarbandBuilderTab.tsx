import { useState } from 'react'
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Swords, Play, Square } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@lib/utils'
import { useWarbandStore } from '@store/warbandStore'
import { calcFigurePoints, SKILL_LIMIT } from '@lib/warbandCalc'
import { allWeapons, equipment as equipmentData } from '@data/index'
import skirmishRaces from '@data/skirmish-races.json'
import skirmishSkills from '@data/skirmish-skills.json'
import type { SkirmishWarband, SkirmishFigure, SkirmishRaceId, SkirmishTraining, SkirmishArmour, SkirmishFigureType } from '@types-bs/skirmish'
import { WarbandPlayMode } from './WarbandPlayMode'

// ── Constants ────────────────────────────────────────────────────────────────

const TRAINING_OPTIONS: { value: SkirmishTraining; label: string; cost: number }[] = [
  { value: 'CIV',   label: 'Civilian (CIV)',  cost: 0  },
  { value: 'REG',   label: 'Regular (REG)',   cost: 2  },
  { value: 'VET',   label: 'Veteran (VET)',   cost: 5  },
  { value: 'ELITE', label: 'Elite (ELITE)',   cost: 10 },
  { value: 'HERO',  label: 'Hero (HERO)',     cost: 20 },
]

const ARMOUR_OPTIONS: { value: SkirmishArmour; label: string; cost: number; save: string }[] = [
  { value: 'UA', label: 'Unarmoured (UA)',       cost: 2,  save: 'No save' },
  { value: 'FI', label: 'Flak Infantry (FI)',    cost: 5,  save: '6+'      },
  { value: 'LA', label: 'Light Armour (LA)',     cost: 8,  save: '5+'      },
  { value: 'PA', label: 'Powered Armour (PA)',   cost: 18, save: '4+'      },
  { value: 'AD', label: 'Advanced Defence (AD)', cost: 27, save: '3+'      },
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

// Infantry-usable equipment only
const SKIRMISH_EQUIP = (equipmentData as { id: string; name: string; pointsCost: number; isVehicleOnly: boolean }[])
  .filter(e => !e.isVehicleOnly)

type SkillEntry = { id: string; name: string; xpCost: number; effect: string }
const SKILLS = skirmishSkills as SkillEntry[]

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
  const [tab,      setTab]      = useState<'weapons' | 'equip-skills'>('weapons')

  // Split existing weapons into ranged and melee on init
  const [rangedWeapons, setRangedWeapons] = useState<string[]>(() =>
    (initial?.weapons ?? []).filter(id => {
      const w = allWeapons.find(w => w.id === id)
      return w?.category !== 'MELEE'
    })
  )
  const [meleeWeapon, setMeleeWeapon] = useState<string | null>(() => {
    const found = (initial?.weapons ?? []).find(id => {
      const w = allWeapons.find(w => w.id === id)
      return w?.category === 'MELEE'
    })
    return found ?? null
  })
  const [equipment,    setEquipment]    = useState<string[]>(initial?.equipment ?? [])
  const [skills,       setSkills]       = useState<string[]>(initial?.skillIds ?? [])
  const [weaponSearch, setWeaponSearch] = useState('')

  const typeOpts = FIGURE_TYPE_OPTIONS.find(o => o.value === type)
  const validTrainings = typeOpts?.trainingAllowed ?? []
  const maxSkills = SKILL_LIMIT[training]

  function handleTypeChange(t: SkirmishFigureType) {
    setType(t)
    const opts = FIGURE_TYPE_OPTIONS.find(o => o.value === t)
    if (opts && !opts.trainingAllowed.includes(training)) {
      setTraining(opts.trainingAllowed[0])
    }
  }

  function handleTrainingChange(t: SkirmishTraining) {
    setTraining(t)
    const newMax = SKILL_LIMIT[t]
    if (skills.length > newMax) setSkills(skills.slice(0, newMax))
  }

  const allWeaponsInFigure = [...rangedWeapons, ...(meleeWeapon ? [meleeWeapon] : [])]
  const pts = calcFigurePoints(training, armour, allWeaponsInFigure, equipment)

  // Weapon pools: separate ranged and melee
  const rangedPool = allWeapons.filter(w => {
    if (w.category === 'VEHICLE_MOUNTED' || w.category === 'HEAVY') return false
    if (w.category === 'MELEE') return false
    if (w.category === 'SUPPORT' && type === 'GRUNT') return false
    if (w.racesAllowed && w.racesAllowed.length > 0 && !(w.racesAllowed as string[]).includes(warband.race)) return false
    if (weaponSearch && !w.name.toLowerCase().includes(weaponSearch.toLowerCase())) return false
    return true
  })
  const meleePool = allWeapons.filter(w => {
    if (w.category !== 'MELEE') return false
    if (w.racesAllowed && w.racesAllowed.length > 0 && !(w.racesAllowed as string[]).includes(warband.race)) return false
    if (weaponSearch && !w.name.toLowerCase().includes(weaponSearch.toLowerCase())) return false
    return true
  })

  function toggleRanged(id: string) {
    setRangedWeapons(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  function toggleEquip(id: string) {
    setEquipment(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  function toggleSkill(id: string) {
    setSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < maxSkills ? [...prev, id] : prev
    )
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      type,
      training,
      armour,
      weapons: allWeaponsInFigure,
      equipment,
      skillIds: skills,
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
                    onClick={() => handleTrainingChange(o.value)}
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

            {/* Tabs: Weapons / Equip & Skills */}
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium">
              <button type="button" onClick={() => setTab('weapons')}
                className={cn('flex-1 py-1.5 transition-colors',
                  tab === 'weapons' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]'
                )}>
                Weapons {allWeaponsInFigure.length > 0 && `(${allWeaponsInFigure.length})`}
              </button>
              <button type="button" onClick={() => setTab('equip-skills')}
                className={cn('flex-1 py-1.5 transition-colors',
                  tab === 'equip-skills' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]'
                )}>
                Equip & Skills {(equipment.length + skills.length) > 0 && `(${equipment.length + skills.length})`}
              </button>
            </div>

            {/* Weapons tab */}
            {tab === 'weapons' && (
              <div className="space-y-3">
                <input
                  className="w-full rounded border bg-[var(--card)] px-3 py-1.5 text-xs"
                  placeholder="Search weapons…"
                  value={weaponSearch}
                  onChange={e => setWeaponSearch(e.target.value)}
                />

                {/* Ranged weapons (max 2) */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                    Ranged — {rangedWeapons.length}/2
                  </p>
                  {rangedWeapons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {rangedWeapons.map(id => {
                        const w = allWeapons.find(w => w.id === id)
                        return w ? (
                          <span key={id} className="flex items-center gap-1 rounded bg-[var(--accent)] px-2 py-0.5 text-xs">
                            {w.name}
                            <button onClick={() => toggleRanged(id)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">×</button>
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                  <div className="max-h-32 overflow-y-auto rounded border divide-y">
                    {rangedPool.map(w => (
                      <button
                        key={w.id}
                        onClick={() => toggleRanged(w.id)}
                        disabled={rangedWeapons.length >= 2 && !rangedWeapons.includes(w.id)}
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors',
                          rangedWeapons.includes(w.id)
                            ? 'bg-[var(--accent)] text-[var(--foreground)]'
                            : 'hover:bg-[var(--accent)] text-[var(--foreground)]',
                          rangedWeapons.length >= 2 && !rangedWeapons.includes(w.id) && 'opacity-40'
                        )}
                      >
                        <span>{w.name}</span>
                        <span className="text-[var(--muted-foreground)]">{w.pointsCost ?? 0}pts</span>
                      </button>
                    ))}
                    {rangedPool.length === 0 && (
                      <p className="px-3 py-2 text-xs text-[var(--muted-foreground)] italic">No ranged weapons match.</p>
                    )}
                  </div>
                </div>

                {/* Melee weapon (max 1) */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                    Melee — {meleeWeapon ? '1' : '0'}/1
                  </p>
                  {meleeWeapon && (() => {
                    const w = allWeapons.find(w => w.id === meleeWeapon)
                    return w ? (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        <span className="flex items-center gap-1 rounded bg-[var(--accent)] px-2 py-0.5 text-xs">
                          {w.name}
                          <button onClick={() => setMeleeWeapon(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">×</button>
                        </span>
                      </div>
                    ) : null
                  })()}
                  <div className="max-h-28 overflow-y-auto rounded border divide-y">
                    {meleePool.map(w => (
                      <button
                        key={w.id}
                        onClick={() => setMeleeWeapon(meleeWeapon === w.id ? null : w.id)}
                        disabled={meleeWeapon !== null && meleeWeapon !== w.id}
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors',
                          meleeWeapon === w.id
                            ? 'bg-[var(--accent)] text-[var(--foreground)]'
                            : 'hover:bg-[var(--accent)] text-[var(--foreground)]',
                          meleeWeapon !== null && meleeWeapon !== w.id && 'opacity-40'
                        )}
                      >
                        <span>{w.name}</span>
                        <span className="text-[var(--muted-foreground)]">{w.pointsCost ?? 0}pts</span>
                      </button>
                    ))}
                    {meleePool.length === 0 && (
                      <p className="px-3 py-2 text-xs text-[var(--muted-foreground)] italic">No melee weapons match.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Equip & Skills tab */}
            {tab === 'equip-skills' && (
              <div className="space-y-4">
                {/* Equipment (max 3) */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                    Equipment — {equipment.length}/3
                  </p>
                  <div className="space-y-1">
                    {SKIRMISH_EQUIP.map(e => {
                      const on = equipment.includes(e.id)
                      const disabled = !on && equipment.length >= 3
                      return (
                        <button key={e.id} type="button" onClick={() => !disabled && toggleEquip(e.id)}
                          className={cn(
                            'w-full flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs text-left transition-colors',
                            on ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:bg-[var(--accent)]',
                            disabled && 'opacity-40 cursor-not-allowed'
                          )}>
                          <span className={cn('w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[10px]',
                            on ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)]'
                          )}>
                            {on && '✓'}
                          </span>
                          <span className="flex-1">{e.name}</span>
                          <span className="text-[var(--muted-foreground)]">{e.pointsCost}pts</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1">
                    Skills — {skills.length}/{maxSkills}
                    {maxSkills === 0 && <span className="ml-1 text-[var(--muted-foreground)] normal-case font-normal">(VET+ only)</span>}
                  </p>
                  {maxSkills === 0 ? (
                    <p className="text-xs text-[var(--muted-foreground)] italic">Increase training to Veteran or above to allocate skills.</p>
                  ) : (
                    <div className="space-y-1">
                      {SKILLS.map(sk => {
                        const on = skills.includes(sk.id)
                        const disabled = !on && skills.length >= maxSkills
                        return (
                          <button key={sk.id} type="button" onClick={() => !disabled && toggleSkill(sk.id)}
                            className={cn(
                              'w-full rounded border px-2.5 py-2 text-xs text-left transition-colors',
                              on ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:bg-[var(--accent)]',
                              disabled && 'opacity-40 cursor-not-allowed'
                            )}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{sk.name}</span>
                              <span className="text-[var(--muted-foreground)]">{sk.xpCost} XP</span>
                            </div>
                            <p className="text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{sk.effect}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
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

// ── Figure Row ────────────────────────────────────────────────────────────────

function FigureRow({ figure, onEdit, onDelete }: { figure: SkirmishFigure; onEdit: () => void; onDelete: () => void }) {
  const equipNames = (figure.equipment ?? []).map(id => {
    const e = (equipmentData as { id: string; name: string }[]).find(e => e.id === id)
    return e?.name ?? id
  })
  const skillNames = (figure.skillIds ?? []).map(id => {
    const sk = SKILLS.find(s => s.id === id)
    return sk?.name ?? id
  })
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b last:border-0 text-xs">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium truncate">{figure.name}</span>
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', TYPE_COLORS[figure.type])}>{figure.type}</span>
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', TRAINING_COLORS[figure.training])}>{figure.training}</span>
          <span className="text-[var(--muted-foreground)]">{figure.armour}</span>
          {figure.status !== 'ACTIVE' && (
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold',
              figure.status === 'DEAD' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
            )}>
              {figure.status}
            </span>
          )}
        </div>
        {figure.weapons.length > 0 && (
          <p className="text-[var(--muted-foreground)] mt-0.5 truncate">
            ⚔ {figure.weapons.map(id => allWeapons.find(w => w.id === id)?.name ?? id).join(', ')}
          </p>
        )}
        {(equipNames.length > 0 || skillNames.length > 0) && (
          <p className="text-[var(--muted-foreground)] truncate">
            {equipNames.length > 0 && `📦 ${equipNames.join(', ')}`}
            {equipNames.length > 0 && skillNames.length > 0 && '  '}
            {skillNames.length > 0 && `★ ${skillNames.join(', ')}`}
          </p>
        )}
      </div>
      <span className="font-bold shrink-0">{figure.points}pts</span>
      <button onClick={onEdit} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"><Edit2 size={12} /></button>
      <button onClick={onDelete} className="text-[var(--muted-foreground)] hover:text-red-400 p-1"><Trash2 size={12} /></button>
    </div>
  )
}

// ── Warband Card ─────────────────────────────────────────────────────────────

function WarbandCard({ warband }: { warband: SkirmishWarband }) {
  const [open,        setOpen]        = useState(false)
  const [playMode,    setPlayMode]    = useState(false)
  const [addOpen,     setAddOpen]     = useState(false)
  const [editFigure,  setEditFigure]  = useState<SkirmishFigure | null>(null)
  const { addFigure, updateFigure, removeFigure, deleteWarband } = useWarbandStore()

  const over = warband.totalPoints > 200
  const underMin = warband.figures.length < 5
  const race = skirmishRaces.find(r => r.id === warband.race)

  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      <div className="flex items-center justify-between px-3 py-2.5 bg-[var(--card)]">
        <button onClick={() => { setOpen(o => !o); setPlayMode(false) }} className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <div>
            <p className="font-semibold text-sm">{warband.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{warband.player} · {race?.name ?? warband.race} · {warband.figures.length}/15 figs</p>
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('text-sm font-bold', over ? 'text-red-400' : 'text-[var(--foreground)]')}>
            {warband.totalPoints}/200{over && ' OVER'}
          </span>
          {open && (
            <button
              onClick={() => setPlayMode(p => !p)}
              title={playMode ? 'Exit play mode' : 'Play mode'}
              className={cn('p-1.5 rounded transition-colors', playMode ? 'text-green-400 hover:text-green-300' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}
            >
              {playMode ? <Square size={14} /> : <Play size={14} />}
            </button>
          )}
          <button onClick={() => deleteWarband(warband.id)} className="text-[var(--muted-foreground)] hover:text-red-400 p-1"><Trash2 size={14} /></button>
        </div>
      </div>

      {open && (
        <div className="bg-[var(--background)]">
          {playMode ? (
            <WarbandPlayMode warband={warband} />
          ) : (
            <>
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
              {underMin && (
                <p className="px-4 py-2 text-xs text-amber-400">
                  Need at least 5 figures to deploy ({5 - warband.figures.length} more required).
                </p>
              )}
              {warband.figures.length < 15 && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  <Plus size={12} /> Add figure
                </button>
              )}
            </>
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
