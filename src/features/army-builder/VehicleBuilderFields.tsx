import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { Minus, Plus, AlertTriangle, Search } from 'lucide-react'
import { cn } from '@lib/utils'
import {
  vehicleBuilder,
  races,
  equipment as equipmentData,
  weaponsInfantry,
  weaponsSupport,
  weaponsHeavy,
  weaponsVehicle,
  weaponsAlien,
} from '@data/index'
import { summariseVehicle, isMainGun, getHull } from '@lib/vehicleCalc'
import type { SquadSelection, WeaponLoadout, AccessoryLoadout } from '@types-bs/squad'
import type { SquadDraft } from '@store/armyStore'
import type { Weapon } from '@types-bs/weapon'
import type { RaceType, TrainingClass, VehicleArmourClass, VehicleHullType } from '@types-bs/enums'

const { hulls, movementTypes, accessories, crewRatings } = vehicleBuilder

const LABEL = 'text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]'
const INPUT = 'w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]'

const FAMILY_LABEL: Record<string, string> = { CAR: 'Carriers', TANK: 'Tanks', WALKER: 'Walkers', MECHA: 'Mecha' }
const FAMILY_ORDER = ['TANK', 'CAR', 'WALKER', 'MECHA']

// Accessories you might sensibly fit more than one of
const MULTI_ACCESSORIES = new Set(['TUR', 'PM', 'ROC'])

// Legacy CUSTOM-mode equipment picks (equipment.json ids)
const CUSTOM_EQUIP_IDS = ['shield-energy', 'shield-projectile', 'shield-multi', 'ecm-suite', 'ads', 'sensor-array', 'command-array', 'laser-painter']

const CUSTOM_CLASS_OPTIONS: { value: VehicleArmourClass; label: string }[] = [
  { value: 0, label: 'Class 0 — Soft Skin' },
  { value: 1, label: 'Class 1 — Very Light' },
  { value: 2, label: 'Class 2 — Light' },
  { value: 3, label: 'Class 3 — Light Tank' },
  { value: 4, label: 'Class 4 — Medium Tank' },
  { value: 5, label: 'Class 5 — Heavy Tank' },
  { value: 6, label: 'Class 6 — Super Heavy' },
]

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--primary-foreground)]">{n}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        className="h-7 w-7 rounded-md border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)]" aria-label="Fewer">
        <Minus size={12} />
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="h-7 w-7 rounded-md border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)]" aria-label="More">
        <Plus size={12} />
      </button>
    </div>
  )
}

function SpaceMeter({ label, used, total }: { label: string; used: number; total: number }) {
  const over = used > total
  return (
    <div className={cn('flex-1 rounded-lg border px-2.5 py-1.5', over ? 'border-red-500/50 bg-red-500/10' : 'border-[var(--border)] bg-[var(--secondary)]')}>
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums', over && 'text-red-400')}>{used} / {total}</p>
    </div>
  )
}

// Weapons a vehicle of this race may mount: vehicle guns + infantry/support/heavy + the race's alien weapons
function useVehicleWeaponPool(race: RaceType): Weapon[] {
  return useMemo(() => {
    const raceData = races.find(r => r.id === race) as { alienWeaponIds?: string[]; weaponPool?: string } | undefined
    const wp = raceData?.weaponPool ?? 'HUMAN_AND_ALIEN'
    const human = wp === 'ALIEN_ONLY' || wp === 'NONE' ? [] : [...weaponsInfantry, ...weaponsSupport, ...weaponsHeavy]
    const alienIds = new Set(raceData?.alienWeaponIds ?? [])
    const alien = wp === 'HUMAN_AND_ALL_ALIEN' ? weaponsAlien : weaponsAlien.filter(w => alienIds.has(w.id))
    return [...weaponsVehicle, ...human, ...alien]
  }, [race])
}

function VehicleWeaponPicker({ race, mounts, onChange, mainGunFree, canMountMain }: {
  race: RaceType
  mounts: WeaponLoadout[]
  onChange: (m: WeaponLoadout[]) => void
  mainGunFree: number
  canMountMain: boolean
}) {
  const pool = useVehicleWeaponPool(race)
  const [tab, setTab] = useState<'MAIN' | 'AUX'>(canMountMain ? 'MAIN' : 'AUX')
  const [query, setQuery] = useState('')
  const fuse = useMemo(() => new Fuse(pool, { keys: ['name', 'code'], threshold: 0.35, ignoreLocation: true }), [pool])

  const list = useMemo(() => {
    const items = query.trim() ? fuse.search(query.trim()).map(r => r.item) : pool
    return items.filter(w => (tab === 'MAIN') === isMainGun(w))
  }, [fuse, pool, query, tab])

  function setCount(weaponId: string, count: number) {
    const rest = mounts.filter(m => m.weaponId !== weaponId)
    onChange(count > 0 ? [...rest, { weaponId, count }] : rest)
  }
  const countOf = (id: string) => mounts.find(m => m.weaponId === id)?.count ?? 0

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium">
        {(['MAIN', 'AUX'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn('flex-1 py-1.5 transition-colors', tab === t ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]')}>
            {t === 'MAIN' ? 'Main guns (turret)' : 'Auxiliary weapons'}
          </button>
        ))}
      </div>
      {tab === 'MAIN' && !canMountMain && (
        <p className="text-xs text-amber-500">This hull has no main gun space — use auxiliary weapons instead.</p>
      )}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search weapons…" className={cn(INPUT, 'pl-8 py-1.5')} />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {list.length === 0 && <p className="px-3 py-3 text-xs text-[var(--muted-foreground)]">No weapons match.</p>}
        {list.map(w => {
          const count = countOf(w.id)
          const size = typeof w.mainGunSize === 'number' ? w.mainGunSize : 0
          const tooBig = tab === 'MAIN' && count === 0 && size > mainGunFree
          return (
            <div key={w.id} className={cn('flex items-center gap-2 px-3 py-1.5', count > 0 && 'bg-[var(--accent)]/40')}>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium truncate', tooBig && 'text-[var(--muted-foreground)]')}>{w.name}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {tab === 'MAIN' && <>Size {size} · </>}
                  {w.heImpact && <>HE {w.heImpact.replace('_', ' ')} · </>}
                  {(w.avImpact ?? w.impact).replace('_', ' ')}{w.avImpact ? ' AV' : ''}
                  {w.maxRange ? <> · {w.maxRange}"</> : null}
                  {tooBig && <span className="text-amber-500"> · too big ({mainGunFree} space left)</span>}
                </p>
              </div>
              <span className="text-xs text-[var(--muted-foreground)] tabular-nums w-10 text-right">{w.pointsCost}pts</span>
              <Stepper value={count} onChange={n => setCount(w.id, n)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function VehicleBuilderFields({ draft, onChange }: {
  draft: SquadDraft
  onChange: (patch: Partial<SquadDraft>) => void
}) {
  const mode = draft.vehicleMode ?? 'CUSTOM'
  const summary = summariseVehicle({ ...draft, selectionId: '', pointsTotal: 0, moraleValue: 0 } as SquadSelection)
  const hull = getHull(draft.vehicleHullType)

  function pickHull(id: VehicleHullType) {
    const h = getHull(id)!
    const keepMove = draft.vehicleMovementId && h.movement.includes(draft.vehicleMovementId)
    onChange({
      vehicleHullType: id,
      vehicleMovementId: keepMove ? draft.vehicleMovementId : h.movement[0],
      ...(!draft.squadName.trim() ? { squadName: h.name } : {}),
    })
  }

  function setAccessory(id: string, count: number) {
    const rest = (draft.vehicleAccessories ?? []).filter(a => a.id !== id)
    onChange({ vehicleAccessories: count > 0 ? [...rest, { id, count } satisfies AccessoryLoadout] : rest })
  }
  const accCount = (id: string) => draft.vehicleAccessories?.find(a => a.id === id)?.count ?? 0

  return (
    <div className="space-y-5">
      {/* Mode */}
      <div className="space-y-1">
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm font-medium">
          <button type="button" onClick={() => onChange({ vehicleMode: 'BUILD' })}
            className={cn('flex-1 py-2 transition-colors', mode === 'BUILD' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]')}>
            Tank builder
          </button>
          <button type="button" onClick={() => onChange({ vehicleMode: 'CUSTOM' })}
            className={cn('flex-1 py-2 transition-colors', mode === 'CUSTOM' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--accent)]')}>
            Custom points
          </button>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {mode === 'BUILD'
            ? 'Build an armoured vehicle step by step using the rulebook chart (p.32). Points are worked out for you.'
            : 'For bikes, aircraft or anything not on the builder chart: enter the base points yourself.'}
        </p>
      </div>

      <div className="space-y-1">
        <label className={LABEL}>Vehicle model <span className="normal-case font-normal">(optional)</span></label>
        <input className={INPUT} placeholder="e.g. Sword light grav tank" value={draft.vehicleName ?? ''}
          onChange={e => onChange({ vehicleName: e.target.value })} />
      </div>

      {mode === 'BUILD' ? (
        <>
          <Step n={1} title="Hull" hint="sets armour class and space">
            <div className="space-y-3">
              {FAMILY_ORDER.map(fam => (
                <div key={fam} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{FAMILY_LABEL[fam]}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {hulls.filter(h => h.family === fam).map(h => (
                      <button key={h.id} type="button" onClick={() => pickHull(h.id)}
                        className={cn('rounded-lg border px-2.5 py-2 text-left transition-colors',
                          draft.vehicleHullType === h.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:bg-[var(--accent)]')}>
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-xs font-semibold">{h.name}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">{h.cost}pts</span>
                        </div>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          Class {h.hullClass} · Gun {h.mainGunSpace} · Aux {h.auxSpaces}{h.troopCapacity > 0 ? ` · ${h.troopCapacity} troops` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Step>

          {hull && (
            <>
              <Step n={2} title="Movement" hint="road / open ground speed">
                <div className="flex flex-wrap gap-1.5">
                  {hull.movement.map(id => {
                    const m = movementTypes.find(m => m.id === id)!
                    const on = draft.vehicleMovementId === id
                    return (
                      <button key={id} type="button" onClick={() => onChange({ vehicleMovementId: id })}
                        className={cn('rounded-lg border px-2.5 py-1.5 text-left transition-colors',
                          on ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:bg-[var(--accent)]')}>
                        <span className="block text-xs font-semibold">{m.name} <span className="font-normal text-[var(--muted-foreground)]">{m.cost}pts</span></span>
                        {m.rates && <span className="block text-[10px] text-[var(--muted-foreground)]">{m.rates[0]}" / {m.rates[1]}"</span>}
                      </button>
                    )
                  })}
                </div>
              </Step>

              <Step n={3} title="Crew" hint="hit bonus · troop roll">
                <div className="grid grid-cols-5 gap-1">
                  {crewRatings.map(c => {
                    const on = (draft.vehicleCrew ?? 'REGULAR') === c.id
                    return (
                      <button key={c.id} type="button" onClick={() => onChange({ vehicleCrew: c.id as TrainingClass })}
                        className={cn('rounded-lg border px-1 py-1.5 text-center transition-colors',
                          on ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:bg-[var(--accent)]')}>
                        <span className="block text-[11px] font-semibold">{c.name}</span>
                        <span className="block text-[10px] text-[var(--muted-foreground)]">{c.hitBonus >= 0 ? '+' : ''}{c.hitBonus} · {c.troopRoll}+</span>
                        <span className="block text-[10px] text-[var(--muted-foreground)]">{c.cost > 0 ? '+' : ''}{c.cost}pts</span>
                      </button>
                    )
                  })}
                </div>
              </Step>

              <Step n={4} title="Weapons">
                <div className="flex gap-2">
                  <SpaceMeter label="Main gun space" used={summary.mainGunUsed} total={summary.mainGunSpace} />
                  <SpaceMeter label="Aux spaces" used={summary.auxUsed} total={summary.auxSpaces} />
                </div>
                {summary.linked && <p className="text-xs text-[var(--muted-foreground)]">More than one main gun: they are linked in the turret (+{vehicleBuilder.gunLinkageCost}pts).</p>}
                <VehicleWeaponPicker
                  race={draft.race}
                  mounts={draft.vehicleWeapons ?? []}
                  onChange={m => onChange({ vehicleWeapons: m })}
                  mainGunFree={summary.mainGunSpace - summary.mainGunUsed}
                  canMountMain={hull.mainGunSpace > 0}
                />
              </Step>

              <Step n={5} title="Shields & accessories" hint="first shield uses no space">
                <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
                  {accessories
                    .filter(a => !a.families || a.families.includes(hull.family))
                    .filter(a => a.minHullClass === undefined || hull.hullClass >= a.minHullClass)
                    .map(a => {
                      const count = accCount(a.id)
                      return (
                        <div key={a.id} className={cn('flex items-center gap-2 px-3 py-1.5', count > 0 && 'bg-[var(--accent)]/40')}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{a.name} <span className="font-normal text-[var(--muted-foreground)]">· {a.aux} aux</span></p>
                            <p className="text-[10px] text-[var(--muted-foreground)] leading-snug">{a.notes}</p>
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)] tabular-nums w-10 text-right">{a.cost}pts</span>
                          {MULTI_ACCESSORIES.has(a.id) ? (
                            <Stepper value={count} onChange={n => setAccessory(a.id, n)} />
                          ) : (
                            <input type="checkbox" className="h-4 w-4 accent-[var(--primary)] mx-[18px]" checked={count > 0}
                              onChange={() => setAccessory(a.id, count > 0 ? 0 : 1)} aria-label={a.name} />
                          )}
                        </div>
                      )
                    })}
                </div>
              </Step>
            </>
          )}

          {/* Breakdown */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 p-3 space-y-2">
            <p className={LABEL}>Points breakdown</p>
            <div className="space-y-0.5">
              {summary.breakdown.filter(l => l.pts !== 0 || l.label.endsWith('hull')).map((l, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">{l.label}</span>
                  <span className="tabular-nums">{l.pts}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold border-t border-[var(--border)] pt-1 mt-1">
                <span>Total</span><span className="tabular-nums">{summary.total} pts</span>
              </div>
            </div>
            {summary.problems.length > 0 && (
              <div className="space-y-0.5">
                {summary.problems.map((p, i) => (
                  <p key={i} className="flex items-start gap-1.5 text-xs text-amber-500">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={LABEL}>Armour class</label>
              <select className={INPUT} value={draft.vehicleArmourClass ?? ''}
                onChange={e => onChange({ vehicleArmourClass: Number(e.target.value) as VehicleArmourClass })}>
                <option value="">— select —</option>
                {CUSTOM_CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={LABEL}>Base points</label>
              <input type="number" min={0} className={INPUT} value={draft.vehicleBasePoints ?? 0}
                onChange={e => onChange({ vehicleBasePoints: Math.max(0, Number(e.target.value)) })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={LABEL}>Equipment</label>
            <div className="space-y-1">
              {CUSTOM_EQUIP_IDS.map(eId => {
                const eq = equipmentData.find(e => e.id === eId) as { id: string; name: string; pointsCost: number; vehicleCost?: number } | undefined
                if (!eq) return null
                const checked = (draft.vehicleEquipment ?? []).includes(eId)
                return (
                  <label key={eId} className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-[var(--accent)] cursor-pointer">
                    <input type="checkbox" className="accent-[var(--primary)]" checked={checked}
                      onChange={() => {
                        const cur = draft.vehicleEquipment ?? []
                        onChange({ vehicleEquipment: checked ? cur.filter(x => x !== eId) : [...cur, eId] })
                      }} />
                    <span className="flex-1 text-sm">{eq.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{eq.vehicleCost ?? eq.pointsCost}pts</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label className={LABEL}>Weapons</label>
            <VehicleWeaponPicker race={draft.race} mounts={draft.vehicleWeapons ?? []}
              onChange={m => onChange({ vehicleWeapons: m })} mainGunFree={99} canMountMain />
          </div>
        </>
      )}

      <p className="text-xs text-[var(--muted-foreground)]">Vehicles count as 3 morale points.</p>
    </div>
  )
}
