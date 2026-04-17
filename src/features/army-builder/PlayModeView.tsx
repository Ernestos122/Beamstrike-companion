import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus, Plus, RotateCcw, Skull, Zap } from 'lucide-react'
import { armourTypes, troopTraining, allWeapons, skills as allSkills } from '@data/index'
import type { ArmyList } from '@types-bs/army'
import type { SquadSelection } from '@types-bs/squad'
import { cn } from '@lib/utils'

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
  if (v === 'CNF') return 'CNF'
  return String(v)
}

// ── Morale bar ─────────────────────────────────────────────────────────────────
function MoraleBar({
  army,
  moraleSpent,
  onAdjust,
  onReset,
}: {
  army: ArmyList
  moraleSpent: number
  onAdjust: (delta: number) => void
  onReset: () => void
}) {
  const total = army.totalMoraleValue
  const threshold = army.halfMoraleThreshold
  const broken = moraleSpent >= threshold
  const pct = total > 0 ? Math.min(100, (moraleSpent / total) * 100) : 0

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3',
      broken ? 'border-red-500/50 bg-red-950/20' : 'border-[var(--border)] bg-[var(--card)]',
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Morale Tracker</p>
          {broken && (
            <p className="text-xs font-bold text-red-400 flex items-center gap-1">
              <Skull size={11} /> ARMY BROKEN — morale tests required
            </p>
          )}
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Bar */}
      <div className="h-3 rounded-full bg-[var(--secondary)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            broken ? 'bg-red-500' : moraleSpent >= threshold * 0.75 ? 'bg-amber-500' : 'bg-[var(--primary)]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-xs text-[var(--muted-foreground)]">Lost</p>
          <p className={cn('text-xl font-bold', broken ? 'text-red-400' : '')}>{moraleSpent}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted-foreground)]">Break at</p>
          <p className="text-xl font-bold">{threshold}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted-foreground)]">Total MV</p>
          <p className="text-xl font-bold">{total}</p>
        </div>
      </div>

      {/* +/- controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onAdjust(-3)}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--accent)] transition-colors"
        >
          −3 Hero
        </button>
        <button
          onClick={() => onAdjust(-1)}
          className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)] transition-colors"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => onAdjust(+1)}
          className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => onAdjust(+3)}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--accent)] transition-colors"
        >
          +3 Hero
        </button>
      </div>

      {army.nominatedObjectiveMorale > 0 && (
        <p className="text-xs text-[var(--muted-foreground)] text-center">
          +{army.nominatedObjectiveMorale} objectives morale included in total
        </p>
      )}
    </div>
  )
}

// ── Casualty pips ──────────────────────────────────────────────────────────────
function CasualtyPips({
  count,
  casualties,
  onChange,
}: {
  count: number
  casualties: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(casualties === i + 1 ? i : i + 1)}
          className={cn(
            'w-6 h-6 rounded-full border-2 transition-all',
            i < casualties
              ? 'bg-red-500 border-red-500'
              : 'border-[var(--border)] hover:border-red-400',
          )}
          title={i < casualties ? 'Click to undo' : 'Mark casualty'}
        />
      ))}
    </div>
  )
}

// ── Squad play card ────────────────────────────────────────────────────────────
function SquadPlayCard({
  squad,
  casualties,
  onCasualtiesChange,
}: {
  squad: SquadSelection
  casualties: number
  onCasualtiesChange: (n: number) => void
}) {
  const [open, setOpen] = useState(true)

  const training = troopTraining.find(t => t.id === squad.trainingClass) as {
    name: string; hitModifier: number; troopRoll: number; h2hModifier: number;
    eligibleTargets: string;
  } | undefined

  const armourId = squad.armourType === 'DA' || squad.armourType === 'DA_SHIELDED'
    ? 'AD'
    : squad.armourType?.replace('_SHIELDED', '')
  const armour = armourTypes.find((a: { id: string }) => a.id === armourId) as {
    name: string; movementClass: string; special: string;
  } | undefined

  const movRates = MOVEMENT[armour?.movementClass ?? 'FI_LA'] ?? MOVEMENT['FI_LA']
  const modelCount = squad.modelCount ?? 1
  const alive = modelCount - casualties

  const skills = (squad.skills ?? []).map(sl => {
    const sk = (allSkills as { id: string; name: string; description: string }[])
      .find(s => s.id === sl.skillId)
    return sk ? { ...sk, count: sl.count } : null
  }).filter(Boolean) as { id: string; name: string; description: string; count: number }[]

  const weapons = squad.weapons.map(wl => {
    const w = allWeapons.find(w => w.id === wl.weaponId)
    return w ? { ...w, count: wl.count } : null
  }).filter(Boolean) as (typeof allWeapons[number] & { count: number })[]

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-colors',
      casualties >= modelCount
        ? 'border-red-500/40 opacity-60'
        : 'border-[var(--border)] bg-[var(--card)]',
    )}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--accent)] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {/* Training badge */}
        <span className={cn(
          'shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg',
          TRAINING_COLOUR[squad.trainingClass ?? 'REGULAR'],
        )}>
          {training?.name.slice(0, 3).toUpperCase() ?? squad.trainingClass}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{squad.squadName}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {armour?.name ?? squad.armourType}
            {squad.isVehicle ? ' · Vehicle' : ` · ${alive}/${modelCount} alive`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {casualties > 0 && !squad.isVehicle && (
            <span className="text-xs font-bold text-red-400 flex items-center gap-0.5">
              <Skull size={11} /> {casualties}
            </span>
          )}
          {open ? <ChevronUp size={15} className="text-[var(--muted-foreground)]" /> : <ChevronDown size={15} className="text-[var(--muted-foreground)]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] space-y-4 p-3">

          {/* Training stats */}
          {training && !squad.isVehicle && (
            <div className="rounded-lg bg-[var(--secondary)] p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Training</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Hit Modifier</p>
                  <p className="text-lg font-bold">
                    {training.hitModifier >= 0 ? '+' : ''}{training.hitModifier}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Troop Roll</p>
                  <p className="text-lg font-bold">{training.troopRoll}+</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">H2H</p>
                  <p className="text-lg font-bold">
                    {training.h2hModifier >= 0 ? '+' : ''}{training.h2hModifier}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] leading-snug">
                <span className="font-medium text-[var(--foreground)]">Targets: </span>
                {training.eligibleTargets}
              </p>
            </div>
          )}

          {/* Movement */}
          {!squad.isVehicle && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                Movement (inches per phase)
              </p>
              <div className="grid grid-cols-5 gap-1 text-center">
                {MOVE_LABELS.map((label, i) => (
                  <div key={label} className="rounded-lg bg-[var(--secondary)] py-1.5 px-1">
                    <p className="text-[9px] text-[var(--muted-foreground)] leading-tight">{label}</p>
                    <p className="text-sm font-bold mt-0.5">{movRates[i]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Armour specials */}
          {armour?.special && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
              <Zap size={12} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300">{armour.special}</p>
            </div>
          )}

          {/* Weapons */}
          {weapons.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                Weapons — 2d6 + hit mod, need ≥ score to hit
              </p>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--secondary)]">
                    <tr className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wide">
                      <th className="px-2 py-1.5 text-left font-medium">Weapon</th>
                      <th className="px-2 py-1.5 text-center font-medium">0–4"</th>
                      <th className="px-2 py-1.5 text-center font-medium">5–20"</th>
                      <th className="px-2 py-1.5 text-center font-medium">21–40"</th>
                      <th className="px-2 py-1.5 text-center font-medium">41–80"</th>
                      <th className="px-2 py-1.5 text-center font-medium">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weapons.map(w => (
                      <tr key={w.id} className="border-t border-[var(--border)]">
                        <td className="px-2 py-1.5 font-medium">
                          <span>{w.name}</span>
                          {w.count > 1 && <span className="ml-1 text-[var(--muted-foreground)]">×{w.count}</span>}
                          {w.shotsPerPhase && w.shotsPerPhase > 1 && (
                            <span className="ml-1 text-[10px] text-sky-400">{w.shotsPerPhase} shots</span>
                          )}
                          {w.causesSupp && (
                            <span className="ml-1 text-[10px] text-amber-400">SUPP</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center font-mono text-[var(--muted-foreground)]">
                          {hitVal(w.toHit.band0_4)}
                        </td>
                        <td className="px-2 py-1.5 text-center font-mono text-[var(--muted-foreground)]">
                          {hitVal(w.toHit.band5_20)}
                        </td>
                        <td className="px-2 py-1.5 text-center font-mono text-[var(--muted-foreground)]">
                          {hitVal(w.toHit.band21_40)}
                        </td>
                        <td className="px-2 py-1.5 text-center font-mono text-[var(--muted-foreground)]">
                          {hitVal(w.toHit.band41_80)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            IMPACT_COLOUR[String(w.impact)] ?? 'bg-gray-500/20 text-gray-400',
                          )}>
                            {String(w.impact).replace('TOTAL_', 'TOT')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {weapons.some(w => w.remarks) && (
                <div className="mt-1.5 space-y-0.5">
                  {weapons.filter(w => w.remarks).map(w => (
                    <p key={w.id} className="text-[10px] text-[var(--muted-foreground)]">
                      <span className="font-medium text-[var(--foreground)]">{w.code}: </span>
                      {w.remarks}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Skills</p>
              <div className="space-y-1.5">
                {skills.map(sk => (
                  <div key={sk.id} className="rounded-lg bg-[var(--secondary)] px-3 py-2">
                    <p className="text-xs font-semibold">
                      {sk.name}
                      {sk.count > 1 && (
                        <span className="ml-1 text-[10px] text-[var(--muted-foreground)] font-normal">×{sk.count}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 leading-snug">{sk.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Casualty tracker */}
          {!squad.isVehicle && modelCount > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Casualties — {alive}/{modelCount} remaining
                </p>
                {casualties > 0 && (
                  <button
                    onClick={() => onCasualtiesChange(0)}
                    className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> Clear
                  </button>
                )}
              </div>
              <CasualtyPips
                count={modelCount}
                casualties={casualties}
                onChange={onCasualtiesChange}
              />
              {casualties >= modelCount && (
                <p className="mt-1.5 text-xs font-bold text-red-400 flex items-center gap-1">
                  <Skull size={11} /> Squad eliminated
                </p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ── Play Mode View ─────────────────────────────────────────────────────────────
export function PlayModeView({ army }: { army: ArmyList }) {
  const [moraleSpent, setMoraleSpent] = useState(0)
  const [casualties, setCasualties] = useState<Record<string, number>>({})

  function adjustMorale(delta: number) {
    setMoraleSpent(v => Math.max(0, v + delta))
  }

  function setCasualtyForSquad(squadId: string, n: number) {
    setCasualties(prev => ({ ...prev, [squadId]: n }))
  }

  function reset() {
    setMoraleSpent(0)
    setCasualties({})
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {/* Morale tracker */}
      <MoraleBar
        army={army}
        moraleSpent={moraleSpent}
        onAdjust={adjustMorale}
        onReset={reset}
      />

      {/* Squad cards */}
      {army.squads.length === 0 && (
        <p className="text-sm text-center text-[var(--muted-foreground)] py-8">
          No squads in this army yet.
        </p>
      )}
      {army.squads.map(squad => (
        <SquadPlayCard
          key={squad.selectionId}
          squad={squad}
          casualties={casualties[squad.selectionId] ?? 0}
          onCasualtiesChange={n => setCasualtyForSquad(squad.selectionId, n)}
        />
      ))}
    </div>
  )
}
