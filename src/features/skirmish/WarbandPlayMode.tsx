import { useState } from 'react'
import { Dice6 } from 'lucide-react'
import { cn } from '@lib/utils'
import { allWeapons, equipment as equipmentData } from '@data/index'
import skirmishSkills from '@data/skirmish-skills.json'
import { useHouseRulesStore } from '@store/houseRulesStore'
import { TRAINING_TO_HIT, TRAINING_MELEE, TRAINING_NERVE, ARMOUR_SAVE } from '@lib/warbandCalc'
import type { SkirmishWarband, SkirmishFigure, SkirmishTraining, SkirmishArmour } from '@types-bs/skirmish'

type SkillEntry = { id: string; name: string; xpCost: number; effect: string }
const SKILLS = skirmishSkills as SkillEntry[]

const TRAINING_COLORS: Record<SkirmishTraining, string> = {
  CIV:   'bg-gray-500/20 text-gray-400',
  REG:   'bg-gray-500/20 text-gray-400',
  VET:   'bg-blue-500/20 text-blue-400',
  ELITE: 'bg-purple-500/20 text-purple-400',
  HERO:  'bg-amber-500/20 text-amber-400',
}

const ARMOUR_COLORS: Record<SkirmishArmour, string> = {
  UA: 'text-gray-400',
  FI: 'text-green-400',
  LA: 'text-blue-400',
  PA: 'text-purple-400',
  AD: 'text-amber-400',
}

function WoundTracker({ maxWounds }: { maxWounds: number }) {
  const [wounds, setWounds] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxWounds }).map((_, i) => (
        <button
          key={i}
          onClick={() => setWounds(w => w === i + 1 ? i : i + 1)}
          className={cn(
            'w-5 h-5 rounded border text-[10px] font-bold transition-colors',
            i < wounds
              ? 'border-red-500 bg-red-500/30 text-red-400'
              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-400'
          )}
        >
          {i < wounds ? '✕' : '○'}
        </button>
      ))}
      {wounds >= maxWounds && maxWounds > 0 && (
        <span className="text-[10px] font-bold text-red-400 ml-1">DOWN</span>
      )}
    </div>
  )
}

function FigurePlayCard({ figure }: { figure: SkirmishFigure }) {
  const toHit  = TRAINING_TO_HIT[figure.training]
  const melee  = TRAINING_MELEE[figure.training]
  const nerve  = TRAINING_NERVE[figure.training]
  const hasConstitution = (figure.skillIds ?? []).includes('CONSTITUTION')
  const maxWounds = hasConstitution ? 3 : 2

  const rangedWeapons = figure.weapons
    .map(id => allWeapons.find(w => w.id === id))
    .filter((w): w is NonNullable<typeof w> => !!w && w.category !== 'MELEE')

  const meleeWeapons = figure.weapons
    .map(id => allWeapons.find(w => w.id === id))
    .filter((w): w is NonNullable<typeof w> => !!w && w.category === 'MELEE')

  const equips = (figure.equipment ?? [])
    .map(id => (equipmentData as { id: string; name: string }[]).find(e => e.id === id))
    .filter((e): e is NonNullable<typeof e> => !!e)

  const figureSkills = (figure.skillIds ?? [])
    .map(id => SKILLS.find(s => s.id === id))
    .filter((s): s is SkillEntry => !!s)

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--card)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm">{figure.name}</span>
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', TRAINING_COLORS[figure.training])}>
            {figure.training}
          </span>
          <span className={cn('text-[10px] font-bold', ARMOUR_COLORS[figure.armour])}>
            {figure.armour} · {ARMOUR_SAVE[figure.armour]}
          </span>
        </div>
        <WoundTracker maxWounds={maxWounds} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x text-center py-2 bg-[var(--background)]">
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">To-Hit</p>
          <p className="text-sm font-bold">{toHit >= 0 ? `+${toHit}` : toHit}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Melee</p>
          <p className="text-sm font-bold">{melee >= 0 ? `+${melee}` : melee}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Nerve</p>
          <p className="text-sm font-bold">{nerve}+</p>
        </div>
      </div>

      {/* Weapons */}
      {(rangedWeapons.length > 0 || meleeWeapons.length > 0) && (
        <div className="border-t divide-y">
          {rangedWeapons.map(w => {
            const toHitVals = w.toHit as Record<string, number | string>
            return (
              <div key={w.id} className="px-3 py-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{w.name}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] uppercase">{w.category}</span>
                </div>
                {toHitVals && (
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    {['b1','b2','b3','b4','b5'].map(band => {
                      const val = toHitVals[band]
                      if (val === undefined) return null
                      return (
                        <span key={band} className={cn('text-[10px]', val === 'CNF' ? 'text-red-400' : 'text-[var(--muted-foreground)]')}>
                          {band.toUpperCase()}: {val === 'CNF' ? '—' : val}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {meleeWeapons.map(w => (
            <div key={w.id} className="px-3 py-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{w.name}</span>
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase">MELEE</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                H2H bonus: {(w as { h2hBonus?: number }).h2hBonus !== undefined
                  ? `${(w as { h2hBonus: number }).h2hBonus >= 0 ? '+' : ''}${(w as { h2hBonus: number }).h2hBonus}`
                  : '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Equipment & Skills */}
      {(equips.length > 0 || figureSkills.length > 0) && (
        <div className="border-t px-3 py-2 space-y-1.5">
          {equips.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {equips.map(e => (
                <span key={e.id} className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">
                  {e.name}
                </span>
              ))}
            </div>
          )}
          {figureSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {figureSkills.map(s => (
                <span key={s.id} title={s.effect} className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400 cursor-help">
                  ★ {s.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function WarbandPlayMode({ warband }: { warband: SkirmishWarband }) {
  const d12Mode = useHouseRulesStore(s => s.d12Mode)
  const toggleD12 = useHouseRulesStore(s => s.toggleD12)

  return (
    <div className="p-3 space-y-3">
      {/* D12 house rule banner */}
      <div className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2 border',
        d12Mode
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-[var(--card)] border-[var(--border)]'
      )}>
        <div className="flex items-center gap-2">
          <Dice6 size={14} className={d12Mode ? 'text-amber-400' : 'text-[var(--muted-foreground)]'} />
          <span className={cn('text-xs font-semibold', d12Mode ? 'text-amber-400' : 'text-[var(--muted-foreground)]')}>
            1D12 Damage House Rule
          </span>
          {d12Mode && (
            <span className="text-[10px] text-amber-300">— Replace 1D6 damage rolls with 1D12</span>
          )}
        </div>
        <button
          onClick={toggleD12}
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition-colors',
            d12Mode
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
          )}
        >
          {d12Mode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Figure cards */}
      {warband.figures.length === 0 ? (
        <p className="text-center text-xs text-[var(--muted-foreground)] py-4 italic">No figures in this warband.</p>
      ) : (
        <div className="space-y-2">
          {warband.figures.map(f => (
            <FigurePlayCard key={f.id} figure={f} />
          ))}
        </div>
      )}
    </div>
  )
}
