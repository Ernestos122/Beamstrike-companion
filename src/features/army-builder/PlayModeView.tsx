import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus, Plus, RotateCcw, Skull, Zap, Dice6 } from 'lucide-react'
import { armourTypes, troopTraining, allWeapons, skills as allSkills, equipment as equipmentData, aliensTroops, races, charts, vehicleBuilder } from '@data/index'
import type { ArmyList } from '@types-bs/army'
import type { SquadSelection, TrooperLine } from '@types-bs/squad'
import { cn } from '@lib/utils'
import { calcTrooperLinePoints } from '@lib/pointsCalc'
import { summariseVehicle, getAccessory } from '@lib/vehicleCalc'
import { useHouseRulesStore } from '@store/houseRulesStore'

// ── Static lookups ─────────────────────────────────────────────────────────────

const MOVEMENT: Record<string, [string, string, string, string, string]> = {
  UA:    ['5"', '4"', '3"', '2"', '1"'],
  FI_LA: ['5"', '4"', '3"', '3"', '2"'],
  PA:    ['4"', '3"', '2"', '2"', '1"'],
  AD:    ['3"', '2"', '2"', '1"', '1"'],
}
const MOVE_LABELS = ['Road', 'Open', 'Light', 'Difficult', 'V.Diff']

const IMPACT_COLOUR: Record<string, string> = {
  STUN:    'bg-gray-500/20 text-gray-400',
  LOW:     'bg-sky-500/20 text-sky-400',
  STANDARD:'bg-yellow-500/20 text-yellow-400',
  HIGH:    'bg-orange-500/20 text-orange-400',
  POWER:   'bg-red-500/20 text-red-400',
  TOTAL_1: 'bg-purple-500/20 text-purple-400',
  TOTAL_2: 'bg-purple-500/20 text-purple-400',
  TOTAL_3: 'bg-purple-500/20 text-purple-400',
  SPECIAL: 'bg-pink-500/20 text-pink-400',
  VARIES:  'bg-teal-500/20 text-teal-400',
}

const TRAINING_COLOUR: Record<string, string> = {
  CIVILIAN: 'bg-gray-500/20 text-gray-400',
  REGULAR:  'bg-gray-500/20 text-gray-400',
  VETERAN:  'bg-blue-500/20 text-blue-400',
  ELITE:    'bg-purple-500/20 text-purple-400',
  HERO:     'bg-amber-500/20 text-amber-400',
}

function hitVal(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return String(v)
}

// ── Morale tracker ─────────────────────────────────────────────────────────────
function MoraleBar({ army, moraleSpent, onAdjust, onReset }: {
  army: ArmyList; moraleSpent: number; onAdjust: (d: number) => void; onReset: () => void
}) {
  const total = army.totalMoraleValue
  const threshold = army.halfMoraleThreshold
  const broken = moraleSpent >= threshold
  const pct = total > 0 ? Math.min(100, (moraleSpent / total) * 100) : 0

  return (
    <div className={cn('rounded-xl border p-4 space-y-3',
      broken ? 'border-red-500/50 bg-red-950/20' : 'border-[var(--border)] bg-[var(--card)]')}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Morale Tracker</p>
          {broken && <p className="text-xs font-bold text-red-400 flex items-center gap-1"><Skull size={11} /> ARMY BROKEN — morale tests required</p>}
        </div>
        <button onClick={onReset} className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="h-3 rounded-full bg-[var(--secondary)] overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-300',
          broken ? 'bg-red-500' : moraleSpent >= threshold * 0.75 ? 'bg-amber-500' : 'bg-[var(--primary)]')}
          style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div><p className="text-xs text-[var(--muted-foreground)]">Lost</p><p className={cn('text-xl font-bold', broken ? 'text-red-400' : '')}>{moraleSpent}</p></div>
        <div><p className="text-xs text-[var(--muted-foreground)]">Break at</p><p className="text-xl font-bold">{threshold}</p></div>
        <div><p className="text-xs text-[var(--muted-foreground)]">Total MV</p><p className="text-xl font-bold">{total}</p></div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => onAdjust(-3)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--accent)] transition-colors">−3 Hero</button>
        <button onClick={() => onAdjust(-1)} className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)] transition-colors"><Minus size={16} /></button>
        <button onClick={() => onAdjust(+1)} className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center hover:opacity-90 transition-opacity"><Plus size={16} /></button>
        <button onClick={() => onAdjust(+3)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--accent)] transition-colors">+3 Hero</button>
      </div>

      {army.nominatedObjectiveMorale > 0 && (
        <p className="text-xs text-[var(--muted-foreground)] text-center">+{army.nominatedObjectiveMorale} objectives included in total</p>
      )}
    </div>
  )
}

// ── Casualty pips ──────────────────────────────────────────────────────────────
function CasualtyPips({ count, casualties, onChange }: { count: number; casualties: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <button key={i} onClick={() => onChange(casualties === i + 1 ? i : i + 1)}
          className={cn('w-6 h-6 rounded-full border-2 transition-all',
            i < casualties ? 'bg-red-500 border-red-500' : 'border-[var(--border)] hover:border-red-400')}
          title={i < casualties ? 'Click to undo' : 'Mark casualty'} />
      ))}
    </div>
  )
}

// ── Trooper line section inside play card ──────────────────────────────────────
function TrooperLineSection({ line, casualties, onCasualtiesChange }: {
  line: TrooperLine
  casualties: number
  onCasualtiesChange: (n: number) => void
}) {
  const armourId = line.armourType === 'DA' || line.armourType === 'DA_SHIELDED' ? 'AD' : line.armourType?.replace('_SHIELDED', '')
  const armour = armourTypes.find((a: { id: string }) => a.id === armourId) as { name: string; movementClass: string; special: string } | undefined
  const training = troopTraining.find(t => t.id === line.trainingClass) as {
    name: string; hitModifier: number; troopRoll: number; h2hModifier: number; eligibleTargets: string
  } | undefined

  type AlienTroop = typeof aliensTroops[number]
  const caste = line.casteId
    ? (aliensTroops as AlienTroop[]).find(t => t.id === line.casteId)
    : undefined
  const naturalAttacks = (caste as { naturalAttacks?: { name: string; description: string }[] } | undefined)?.naturalAttacks ?? []

  const movRates: [string, string, string, string, string] = caste
    ? [`${caste.movement.road}"`, `${caste.movement.openGround}"`, `${caste.movement.lightWoods}"`, `${caste.movement.difficultGround}"`, `${caste.movement.veryDifficult}"`]
    : MOVEMENT[armour?.movementClass ?? 'FI_LA'] ?? MOVEMENT['FI_LA']
  const alive = line.count - casualties

  const weapons = line.weapons.map(wId => allWeapons.find(w => w.id === wId)).filter(Boolean) as typeof allWeapons
  const skills = line.skills.map(sId =>
    (allSkills as { id: string; name: string; description: string }[]).find(s => s.id === sId)
  ).filter(Boolean) as { id: string; name: string; description: string }[]
  const equip = line.equipment.map(eId =>
    (equipmentData as { id: string; name: string }[]).find(e => e.id === eId)
  ).filter(Boolean) as { id: string; name: string }[]

  const linePts = calcTrooperLinePoints(line)
  const label = line.label || training?.name || line.trainingClass

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Line header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--secondary)]/60">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', TRAINING_COLOUR[line.trainingClass] ?? 'bg-gray-500/20 text-gray-400')}>
          {line.trainingClass.slice(0, 3)}
        </span>
        <span className="text-sm font-semibold flex-1">
          {line.count}× {label}
        </span>
        {casualties > 0 && (
          <span className="text-xs font-bold text-red-400 flex items-center gap-0.5"><Skull size={11} />{casualties}</span>
        )}
        <span className="text-xs text-[var(--muted-foreground)]">{alive}/{line.count} alive · {linePts}pts</span>
      </div>

      <div className="px-3 pb-3 pt-2 space-y-3">
        {/* Training stats */}
        {training && (
          <div className="rounded-lg bg-[var(--secondary)] p-2.5 space-y-1.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-[var(--muted-foreground)]">Hit Mod</p>
                <p className="text-base font-bold">{training.hitModifier >= 0 ? '+' : ''}{training.hitModifier}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted-foreground)]">Troop Roll</p>
                <p className="text-base font-bold">{training.troopRoll}+</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted-foreground)]">H2H</p>
                <p className="text-base font-bold">{training.h2hModifier >= 0 ? '+' : ''}{training.h2hModifier}</p>
              </div>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] leading-snug">
              <span className="font-medium text-[var(--foreground)]">Targets: </span>{training.eligibleTargets}
            </p>
          </div>
        )}

        {/* Movement */}
        <div className="grid grid-cols-5 gap-1 text-center">
          {MOVE_LABELS.map((label, i) => (
            <div key={label} className="rounded-lg bg-[var(--secondary)] py-1 px-0.5">
              <p className="text-[9px] text-[var(--muted-foreground)]">{label}</p>
              <p className="text-xs font-bold">{movRates[i]}</p>
            </div>
          ))}
        </div>

        {/* Armour special */}
        {armour?.special && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 flex items-start gap-1.5">
            <Zap size={11} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-300">{armour.special}</p>
          </div>
        )}

        {/* Equipment */}
        {equip.length > 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">Equipment: </span>
            {equip.map(e => e.name).join(', ')}
          </p>
        )}

        {/* Weapons table */}
        {weapons.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--secondary)]">
                <tr className="text-[var(--muted-foreground)] text-[10px] uppercase">
                  <th className="px-2 py-1 text-left font-medium">Weapon</th>
                  <th className="px-2 py-1 text-center font-medium">0–4"</th>
                  <th className="px-2 py-1 text-center font-medium">5–20"</th>
                  <th className="px-2 py-1 text-center font-medium">21–40"</th>
                  <th className="px-2 py-1 text-center font-medium">41–80"</th>
                  <th className="px-2 py-1 text-center font-medium">Impact</th>
                </tr>
              </thead>
              <tbody>
                {weapons.map(w => (
                  <tr key={w.id} className="border-t border-[var(--border)]">
                    <td className="px-2 py-1 font-medium">
                      {w.name}
                      {w.shotsPerPhase && w.shotsPerPhase > 1 && <span className="ml-1 text-[10px] text-sky-400">{w.shotsPerPhase}×</span>}
                      {w.causesSupp && <span className="ml-1 text-[10px] text-amber-400">S</span>}
                    </td>
                    {w.category === 'MELEE' ? (
                      <>
                        <td colSpan={4} className="px-2 py-1 text-center text-[10px] text-[var(--muted-foreground)]">
                          H2H bonus: <span className="font-mono font-bold text-[var(--foreground)]">{(w as unknown as { meleeBonus: number }).meleeBonus >= 0 ? '+' : ''}{(w as unknown as { meleeBonus: number }).meleeBonus}</span>
                        </td>
                      </>
                    ) : w.category === 'GRENADE' ? (
                      <>
                        <td colSpan={4} className="px-2 py-1 text-center text-[10px] text-[var(--muted-foreground)]">
                          Blast template <span className="font-mono font-bold text-[var(--foreground)]">{(w as unknown as { blastTemplate?: number }).blastTemplate ?? '—'}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit?.band0_4)}</td>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit?.band5_20)}</td>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit?.band21_40)}</td>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit?.band41_80)}</td>
                      </>
                    )}
                    <td className="px-2 py-1 text-center">
                      <span className={cn('px-1 py-0.5 rounded text-[10px] font-bold', IMPACT_COLOUR[String(w.impact)] ?? 'bg-gray-500/20 text-gray-400')}>
                        {String(w.impact).replace('TOTAL_', 'TOT')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="space-y-1">
            {skills.map(sk => (
              <div key={sk.id} className="rounded-lg bg-[var(--secondary)] px-2.5 py-1.5">
                <p className="text-xs font-semibold">{sk.name}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 leading-snug">{sk.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Natural attacks */}
        {naturalAttacks.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Natural Attacks</p>
            {naturalAttacks.map((a, i) => (
              <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
                <p className="text-xs font-semibold text-amber-300">{a.name}</p>
                <p className="text-[10px] text-amber-300/70 mt-0.5 leading-snug">{a.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Casualty pips */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Casualties — {alive}/{line.count}</p>
            {casualties > 0 && (
              <button onClick={() => onCasualtiesChange(0)}
                className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1">
                <RotateCcw size={10} /> Clear
              </button>
            )}
          </div>
          <CasualtyPips count={line.count} casualties={casualties} onChange={onCasualtiesChange} />
          {casualties >= line.count && (
            <p className="mt-1 text-xs font-bold text-red-400 flex items-center gap-1"><Skull size={11} /> Wiped out</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vehicle section inside play card ───────────────────────────────────────────
const VEHICLE_STATUSES = [
  { id: 'stun',   label: 'Stunned',     hint: 'No move or fire until a 5–6 in a move phase' },
  { id: 'imob',   label: 'Immobilised', hint: 'Cannot move; may still fire' },
  { id: 'weapon', label: 'Weapons out', hint: 'No vehicle weapons may fire' },
  { id: 'shield', label: 'Shield down', hint: 'Shield overloaded for the rest of the game' },
  { id: 'ko',     label: 'Knocked out', hint: 'KO1 / KO2 / Destroyed' },
] as const
type VehicleStatusId = (typeof VEHICLE_STATUSES)[number]['id']

// Armour penetration chart column for a hull class (classes 0 and 1 share the soft-skin column)
const PENETRATION = (charts.find(c => c.id === 'armour-penetration')?.rows ?? []).map(r => r.cells.map(c => String(c ?? '—')))
const HIT_EFFECTS = (charts.find(c => c.id === 'effect-of-penetration')?.rows ?? []).map(r => r.cells.map(c => String(c ?? '—')))

function VehicleSection({ squad, statuses, onToggle }: {
  squad: SquadSelection
  statuses: VehicleStatusId[]
  onToggle: (id: VehicleStatusId) => void
}) {
  const v = summariseVehicle(squad)
  const ko = statuses.includes('ko')
  const moveRates = v.movement?.rates
  const penCol = v.hullClass === undefined ? null : Math.max(1, v.hullClass)
  const effectCol = v.family ? vehicleBuilder.effectColumns[v.family] : null

  const SHIELD_NAMES = { ES: 'Energy Shield', PS: 'Projectile Shield' } as const
  const troops = v.hull?.troopCapacity ?? v.preset?.troops ?? 0
  const fittings: { name: string; notes?: string }[] = v.mode === 'PRESET'
    ? (v.preset?.shield ? [{ name: SHIELD_NAMES[v.preset.shield] }] : [])
    : v.mode === 'BUILD'
    ? (squad.vehicleAccessories ?? []).flatMap(al => {
        const acc = getAccessory(al.id)
        return acc ? [{ name: `${al.count > 1 ? `${al.count}× ` : ''}${acc.name}`, notes: acc.notes }] : []
      })
    : (squad.vehicleEquipment ?? []).flatMap(eId => {
        const eq = (equipmentData as { id: string; name: string }[]).find(e => e.id === eId)
        return eq ? [{ name: eq.name }] : []
      })

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--secondary)]/60">
        <span className="text-sm font-semibold flex-1">{squad.vehicleName || v.preset?.name || v.hull?.name || 'Vehicle'}</span>
        {v.hullClass !== undefined && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/20 text-slate-300">Class {v.hullClass}</span>
        )}
        <span className="text-xs text-[var(--muted-foreground)]">{squad.pointsTotal}pts</span>
      </div>

      <div className="px-3 pb-3 pt-2 space-y-3">
        {/* Core stats */}
        <div className="rounded-lg bg-[var(--secondary)] p-2.5 grid grid-cols-3 gap-2 text-center">
          {v.ridersSeparate ? (
            <div className="col-span-2 flex items-center justify-center">
              <p className="text-[11px] text-[var(--muted-foreground)]">Rider fires with their own training</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[10px] text-[var(--muted-foreground)]">Crew hit</p>
                <p className="text-base font-bold">{v.crew.hitBonus >= 0 ? '+' : ''}{v.crew.hitBonus}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--muted-foreground)]">Troop roll</p>
                <p className="text-base font-bold">{v.crew.troopRoll}+</p>
              </div>
            </>
          )}
          <div>
            <p className="text-[10px] text-[var(--muted-foreground)]">{v.hull ? 'Armour F/S/R' : 'Crew'}</p>
            <p className="text-base font-bold">{v.hull ? v.hull.armourFSR.map(a => a + (v.hullClass! - v.hull!.hullClass)).join('/') : v.crew.name}</p>
          </div>
        </div>
        {(v.hull || v.preset) && (
          <p className="text-[10px] text-[var(--muted-foreground)] -mt-1.5">
            {v.preset?.movement ?? v.movement?.name ?? 'No'} movement
            {troops > 0 && <> · carries {troops} FI troops (LA ×0.8, PA ×0.5, AD ×0.3)</>}
            {(v.family === 'TANK' || v.family === 'WALKER') && <> · −1 armour when hit from behind</>}
          </p>
        )}
        {v.hull?.notes && (
          <p className="text-[10px] text-[var(--muted-foreground)] -mt-1 leading-snug">{v.hull.notes}</p>
        )}
        {v.preset?.armament && (
          <p className="text-[11px] -mt-1"><span className="text-[var(--muted-foreground)]">Rulebook armament: </span>{v.preset.armament}</p>
        )}

        {/* Movement */}
        {moveRates && (
          <div className="grid grid-cols-5 gap-1 text-center">
            {MOVE_LABELS.map((label, i) => (
              <div key={label} className="rounded-lg bg-[var(--secondary)] py-1 px-0.5">
                <p className="text-[9px] text-[var(--muted-foreground)]">{label}</p>
                <p className="text-xs font-bold">{moveRates[i] === null ? '✕' : `${moveRates[i]}"`}</p>
              </div>
            ))}
          </div>
        )}

        {/* Fittings */}
        {fittings.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {fittings.map((f, i) => (
              <span key={i} title={f.notes} className={cn('rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400', f.notes && 'cursor-help')}>
                {f.name}
              </span>
            ))}
          </div>
        )}

        {/* Weapons */}
        {v.mounts.length > 0 ? (
          <div className={cn('overflow-x-auto rounded-lg border border-[var(--border)]', statuses.includes('weapon') && 'opacity-40')}>
            <table className="w-full text-xs">
              <thead className="bg-[var(--secondary)]">
                <tr className="text-[var(--muted-foreground)] text-[10px] uppercase">
                  <th className="px-2 py-1 text-left font-medium">Weapon</th>
                  <th className="px-2 py-1 text-center font-medium">0–4"</th>
                  <th className="px-2 py-1 text-center font-medium">5–20"</th>
                  <th className="px-2 py-1 text-center font-medium">21–40"</th>
                  <th className="px-2 py-1 text-center font-medium">41–80"</th>
                  <th className="px-2 py-1 text-center font-medium">81"+</th>
                  <th className="px-2 py-1 text-center font-medium">HE / AV</th>
                </tr>
              </thead>
              <tbody>
                {v.mounts.map(({ weapon: w, count, isMainGun, included }, i) => (
                  <tr key={`${w.id}-${i}`} className="border-t border-[var(--border)]">
                    <td className="px-2 py-1 font-medium">
                      {count > 1 && <span className="text-[var(--muted-foreground)]">{count}× </span>}
                      {w.name}
                      {isMainGun && <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">main</span>}
                      {included && <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">incl.</span>}
                      {w.shotsPerPhase && w.shotsPerPhase > 1 && <span className="ml-1 text-[10px] text-sky-400">{w.shotsPerPhase}×</span>}
                      {w.maxRange ? <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">{w.maxRange}"</span> : null}
                    </td>
                    {w.toHit ? (
                      <>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band0_4)}</td>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band5_20)}</td>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band21_40)}</td>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band41_80)}</td>
                        <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band81plus)}</td>
                      </>
                    ) : (
                      <td colSpan={5} className="px-2 py-1 text-center text-[10px] text-[var(--muted-foreground)]">
                        Blast template <span className="font-mono font-bold text-[var(--foreground)]">{w.blastTemplate ?? '—'}</span>
                      </td>
                    )}
                    <td className="px-2 py-1 text-center whitespace-nowrap">
                      {[w.heImpact ?? (w.avImpact ? undefined : w.impact), w.avImpact].map((imp, i) => imp ? (
                        <span key={i} className={cn('px-1 py-0.5 rounded text-[10px] font-bold', i > 0 && 'ml-0.5', IMPACT_COLOUR[String(imp)] ?? 'bg-gray-500/20 text-gray-400')}>
                          {String(imp).replace('TOTAL_', 'TOT')}
                        </span>
                      ) : i === 0 && w.avImpact ? <span key={i} className="text-[10px] text-[var(--muted-foreground)] mr-0.5">—</span> : null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-2 py-1 text-[10px] text-[var(--muted-foreground)] border-t border-[var(--border)]">
              {v.ridersSeparate ? 'Rider uses their own training hit modifier.' : 'Vehicle gun to-hit already includes on-board targeting. Add crew hit bonus.'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)] italic">No weapons mounted.</p>
        )}

        {/* When this vehicle is shot at */}
        {(penCol !== null || effectCol !== null) && (
          <details className="rounded-lg border border-[var(--border)] group">
            <summary className="cursor-pointer select-none px-2.5 py-1.5 text-[11px] font-semibold flex items-center justify-between">
              When this vehicle is hit
              <ChevronDown size={13} className="text-[var(--muted-foreground)] group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-2.5 pb-2.5 space-y-2.5">
              {penCol !== null && (
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mb-1">Penetration — D10 needed vs class {v.hullClass}</p>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {PENETRATION.map(row => (
                      <div key={row[0]} className="rounded bg-[var(--secondary)] py-1">
                        <p className="text-[9px] text-[var(--muted-foreground)] leading-tight">{row[0].replace('Total ', 'T')}</p>
                        <p className={cn('text-xs font-bold', row[penCol] === 'NE' && 'text-[var(--muted-foreground)]', row[penCol] === 'Auto' && 'text-red-400')}>
                          {row[penCol] === 'Auto' ? 'Auto' : row[penCol] === 'NE' ? '—' : `${row[penCol]}+`}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">+2 on a natural 12 to hit · −1 lasers/beams · −1 active shield (not vs flamers/sun guns)</p>
                </div>
              )}
              {effectCol !== null && (
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mb-1">Effect of penetration — D10 (+Total number)</p>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {HIT_EFFECTS.map(row => (
                      <div key={row[0]} className="rounded bg-[var(--secondary)] py-1">
                        <p className="text-[9px] text-[var(--muted-foreground)]">{row[0]}</p>
                        <p className={cn('text-[10px] font-bold', /KO|DESTROY/.test(row[effectCol]) && 'text-red-400', row[effectCol] === '—' && 'text-[var(--muted-foreground)]')}>
                          {row[effectCol].replace('DESTROY', 'Dest')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Damage status */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Damage</p>
          <div className="flex flex-wrap gap-1.5">
            {VEHICLE_STATUSES.map(st => {
              const on = statuses.includes(st.id)
              return (
                <button key={st.id} title={st.hint} onClick={() => onToggle(st.id)}
                  className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    on ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-400')}>
                  {st.label}
                </button>
              )
            })}
          </div>
          {ko && <p className="mt-1 text-xs font-bold text-red-400 flex items-center gap-1"><Skull size={11} /> Knocked out — count 3 morale lost</p>}
        </div>
      </div>
    </div>
  )
}

// ── Squad play card ────────────────────────────────────────────────────────────
function SquadPlayCard({ squad, casualties, onCasualtiesChange, vehicleStatuses, onToggleVehicleStatus }: {
  squad: SquadSelection
  casualties: Record<string, number>
  onCasualtiesChange: (lineId: string, n: number) => void
  vehicleStatuses: VehicleStatusId[]
  onToggleVehicleStatus: (id: VehicleStatusId) => void
}) {
  const [open, setOpen] = useState(true)
  const totalFigs = squad.troopers.reduce((s, t) => s + t.count, 0)
  const totalCasualties = squad.troopers.reduce((s, t) => s + (casualties[t.id] ?? 0), 0)

  return (
    <div className={cn('rounded-xl border overflow-hidden',
      (squad.isVehicle ? vehicleStatuses.includes('ko') : totalCasualties >= totalFigs)
        ? 'border-red-500/40 opacity-60' : 'border-[var(--border)] bg-[var(--card)]')}>
      <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--accent)] transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{squad.squadName}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {squad.isVehicle ? 'Vehicle' : `${totalFigs - totalCasualties}/${totalFigs} alive · ${squad.moraleValue} morale`}
          </p>
        </div>
        {totalCasualties > 0 && !squad.isVehicle && (
          <span className="text-xs font-bold text-red-400 flex items-center gap-0.5"><Skull size={11} />{totalCasualties}</span>
        )}
        {open ? <ChevronUp size={15} className="text-[var(--muted-foreground)]" /> : <ChevronDown size={15} className="text-[var(--muted-foreground)]" />}
      </button>

      {open && (
        <div className="border-t border-[var(--border)] p-3 space-y-3">
          {(() => {
            const raceInfo = races.find(r => r.id === squad.race) as { special?: string[] } | undefined
            const specials = raceInfo?.special ?? []
            if (specials.length === 0) return null
            return (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-2.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Race Special Rules</p>
                {specials.map((rule, i) => (
                  <p key={i} className="text-[10px] text-blue-300/80 leading-relaxed pl-2 border-l border-blue-500/20">{rule}</p>
                ))}
              </div>
            )
          })()}
          {squad.isVehicle ? (
            <VehicleSection squad={squad} statuses={vehicleStatuses} onToggle={onToggleVehicleStatus} />
          ) : squad.troopers.map(line => (
            <TrooperLineSection
              key={line.id}
              line={line}
              casualties={casualties[line.id] ?? 0}
              onCasualtiesChange={n => onCasualtiesChange(line.id, n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Play Mode View ─────────────────────────────────────────────────────────────
export function PlayModeView({ army }: { army: ArmyList }) {
  const [moraleSpent, setMoraleSpent] = useState(0)
  const [casualties, setCasualties] = useState<Record<string, number>>({})
  const [vehicleStatus, setVehicleStatus] = useState<Record<string, VehicleStatusId[]>>({})
  const d12Mode = useHouseRulesStore(s => s.d12Mode)

  function adjustMorale(delta: number) {
    setMoraleSpent(v => Math.max(0, v + delta))
  }

  function setCasualtyForLine(lineId: string, n: number) {
    setCasualties(prev => ({ ...prev, [lineId]: n }))
  }

  function toggleVehicleStatus(squadId: string, id: VehicleStatusId) {
    setVehicleStatus(prev => {
      const cur = prev[squadId] ?? []
      return { ...prev, [squadId]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] }
    })
  }

  function reset() {
    setMoraleSpent(0)
    setCasualties({})
    setVehicleStatus({})
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <MoraleBar army={army} moraleSpent={moraleSpent} onAdjust={adjustMorale} onReset={reset} />
      {d12Mode && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
          <Dice6 size={15} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">House Rule: 1d12 Mode active</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-200 leading-snug mt-0.5">Roll 1d12 instead of 2d6. All target numbers and modifiers are unchanged. A roll of 1 always misses.</p>
          </div>
        </div>
      )}
      {army.squads.length === 0 && (
        <p className="text-sm text-center text-[var(--muted-foreground)] py-8">No squads in this army yet.</p>
      )}
      {army.squads.map(squad => (
        <SquadPlayCard
          key={squad.selectionId}
          squad={squad}
          casualties={casualties}
          onCasualtiesChange={setCasualtyForLine}
          vehicleStatuses={vehicleStatus[squad.selectionId] ?? []}
          onToggleVehicleStatus={id => toggleVehicleStatus(squad.selectionId, id)}
        />
      ))}
    </div>
  )
}
