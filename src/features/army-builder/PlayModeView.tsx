import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus, Plus, RotateCcw, Skull, Zap } from 'lucide-react'
import { armourTypes, troopTraining, allWeapons, skills as allSkills, equipment as equipmentData } from '@data/index'
import type { ArmyList } from '@types-bs/army'
import type { SquadSelection, TrooperLine } from '@types-bs/squad'
import { cn } from '@lib/utils'
import { calcTrooperLinePoints } from '@lib/pointsCalc'

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

  const movRates = MOVEMENT[armour?.movementClass ?? 'FI_LA'] ?? MOVEMENT['FI_LA']
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
                    <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band0_4)}</td>
                    <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band5_20)}</td>
                    <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band21_40)}</td>
                    <td className="px-2 py-1 text-center font-mono text-[var(--muted-foreground)]">{hitVal(w.toHit.band41_80)}</td>
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

// ── Squad play card ────────────────────────────────────────────────────────────
function SquadPlayCard({ squad, casualties, onCasualtiesChange }: {
  squad: SquadSelection
  casualties: Record<string, number>
  onCasualtiesChange: (lineId: string, n: number) => void
}) {
  const [open, setOpen] = useState(true)
  const totalFigs = squad.troopers.reduce((s, t) => s + t.count, 0)
  const totalCasualties = squad.troopers.reduce((s, t) => s + (casualties[t.id] ?? 0), 0)

  return (
    <div className={cn('rounded-xl border overflow-hidden',
      totalCasualties >= totalFigs && !squad.isVehicle ? 'border-red-500/40 opacity-60' : 'border-[var(--border)] bg-[var(--card)]')}>
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
          {squad.troopers.map(line => (
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
  // casualties keyed by TrooperLine.id
  const [casualties, setCasualties] = useState<Record<string, number>>({})

  function adjustMorale(delta: number) {
    setMoraleSpent(v => Math.max(0, v + delta))
  }

  function setCasualtyForLine(lineId: string, n: number) {
    setCasualties(prev => ({ ...prev, [lineId]: n }))
  }

  function reset() {
    setMoraleSpent(0)
    setCasualties({})
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <MoraleBar army={army} moraleSpent={moraleSpent} onAdjust={adjustMorale} onReset={reset} />
      {army.squads.length === 0 && (
        <p className="text-sm text-center text-[var(--muted-foreground)] py-8">No squads in this army yet.</p>
      )}
      {army.squads.map(squad => (
        <SquadPlayCard
          key={squad.selectionId}
          squad={squad}
          casualties={casualties}
          onCasualtiesChange={setCasualtyForLine}
        />
      ))}
    </div>
  )
}
