import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Star, Crosshair, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { skills as allSkills, allWeapons } from '@data/index'
import eraContent from '@data/era1-content.json'
import { cn } from '@lib/utils'

// ── Types inferred from JSON ────────────────────────────────────────────────
type Faction = typeof eraContent.factions[number]
type Troop = Faction['troops'][number] & { note?: string }
type ArmyExample = typeof eraContent.armyExamples[number]

// ── Helpers ─────────────────────────────────────────────────────────────────
const TRAINING_LABELS: Record<string, string> = {
  CIVILIAN: 'CIV', REG: 'REG', VETERAN: 'VET', VET: 'VET', ELITE: 'ELITE', HERO: 'HERO',
}

const TRAINING_COLORS: Record<string, string> = {
  REG: 'bg-gray-500/20 text-gray-400',
  VET: 'bg-blue-500/20 text-blue-400',
  ELITE: 'bg-purple-500/20 text-purple-400',
  HERO: 'bg-amber-500/20 text-amber-400',
  'HERO+5': 'bg-amber-500/20 text-amber-400',
}

function TrainingBadge({ t }: { t: string }) {
  const label = TRAINING_LABELS[t] ?? t
  const cls = TRAINING_COLORS[t] ?? 'bg-gray-500/20 text-gray-400'
  return (
    <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide', cls)}>
      {label}
    </span>
  )
}

// ── Tab IDs ──────────────────────────────────────────────────────────────────
type Tab = 'factions' | 'examples' | 'skills' | 'weapons'

// ── Faction Troops Card ──────────────────────────────────────────────────────
function FactionPanel({ faction }: { faction: Faction }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--accent)] transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: faction.colour }}
          />
          <div>
            <p className="font-semibold">{faction.name}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{faction.troops.length} troop types</p>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-[var(--muted-foreground)]" /> : <ChevronRight size={16} className="text-[var(--muted-foreground)]" />}
      </button>

      {open && (
        <div className="border-t border-[var(--border)]">
          {/* Description */}
          <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{faction.description}</p>

          {/* Paint note */}
          <div className="mx-4 mb-3 rounded-lg bg-[var(--secondary)] p-3 text-xs text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">Paint guide: </span>{faction.paintNote}
          </div>

          {/* Troop table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-[var(--border)] text-[var(--muted-foreground)] uppercase tracking-wide">
                  <th className="px-4 py-2 text-left font-medium">Figure</th>
                  <th className="px-3 py-2 text-center font-medium">Trng</th>
                  <th className="px-3 py-2 text-center font-medium">Arm</th>
                  <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Main Weapon</th>
                  <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Skills</th>
                  <th className="px-3 py-2 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {faction.troops.map((troop: Troop, i: number) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors"
                  >
                    <td className="px-4 py-2 font-medium">
                      {troop.name}
                      {troop.note && (
                        <p className="text-[10px] text-[var(--muted-foreground)] font-normal">{troop.note}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <TrainingBadge t={troop.training} />
                    </td>
                    <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">{troop.armour}</td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)] hidden sm:table-cell">{troop.mainWeapon}</td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)] hidden md:table-cell">{troop.skills ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[var(--primary)]">{troop.ptsPerFigure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Army Example Card ────────────────────────────────────────────────────────
function ArmyExampleCard({ army }: { army: ArmyExample }) {
  const [open, setOpen] = useState(false)
  const faction = eraContent.factions.find(f => f.id === army.faction)
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        className="w-full flex items-start justify-between p-4 hover:bg-[var(--accent)] transition-colors text-left gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {faction && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: faction.colour + '30', color: faction.colour }}
              >
                {faction.name}
              </span>
            )}
            <span className="text-xs text-[var(--muted-foreground)]">{army.totalFigures} figures</span>
          </div>
          <p className="font-semibold mt-1">{army.name}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 italic">&ldquo;{army.flavour}&rdquo;</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-bold text-[var(--primary)]">{army.totalPoints}</span>
          <span className="text-xs text-[var(--muted-foreground)]">pts</span>
          {open ? <ChevronDown size={16} className="text-[var(--muted-foreground)]" /> : <ChevronRight size={16} className="text-[var(--muted-foreground)]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-4 pb-4 space-y-4">
          {/* Squad breakdown */}
          <div className="space-y-2 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Squad Breakdown</p>
            {army.squads.map((sq, i) => (
              <div key={i} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{sq.name}</span>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{sq.composition}</p>
                </div>
                <span className="shrink-0 font-semibold text-[var(--primary)]">{sq.points} pts</span>
              </div>
            ))}
          </div>

          {/* Builder tips */}
          <div className="rounded-lg bg-[var(--secondary)] p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] flex items-center gap-1.5">
              <Shield size={11} /> Army Builder Tips
            </p>
            <ul className="space-y-1.5">
              {army.builderTips.map((tip, i) => (
                <li key={i} className="text-xs text-[var(--muted-foreground)] flex gap-2">
                  <span className="shrink-0 text-[var(--primary)] font-bold mt-0.5">›</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/army"
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Shield size={14} /> Build a similar army
          </Link>
        </div>
      )}
    </div>
  )
}

// ── ERA Skills Panel ─────────────────────────────────────────────────────────
function EraSkillsPanel() {
  const eraSkills = eraContent.eraSkillIds
    .map(id => allSkills.find((s: { id: string }) => s.id === id))
    .filter(Boolean) as typeof allSkills

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        These skills are introduced in ERA 1: Imperialist and appear on Hero-class figures and elite troops.
        They are fully supported in the Army Builder.
      </p>
      {eraSkills.map((skill: typeof allSkills[number]) => (
        <div key={skill.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{skill.name}</p>
              {skill.special && (
                <p className="text-[10px] text-[var(--primary)] mt-0.5">{skill.special}</p>
              )}
            </div>
            <span className="shrink-0 text-sm font-bold text-[var(--primary)]">{skill.pointsCost} pts</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">{skill.description}</p>
        </div>
      ))}
    </div>
  )
}

// ── ERA Weapons Panel ────────────────────────────────────────────────────────
function EraWeaponsPanel() {
  const eraWeapons = eraContent.eraWeaponIds
    .map(id => allWeapons.find(w => w.id === id))
    .filter(Boolean) as typeof allWeapons

  function bandLabel(v: number | null | undefined | string): string {
    if (v === null || v === undefined) return '—'
    return String(v)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        These weapons are characteristic of the Imperialist ERA — blast weapons replaced primitive
        kinetic arms, and the AM Beamer became the heavy infantry anti-armour weapon of choice.
      </p>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead className="bg-[var(--secondary)]">
            <tr className="text-[var(--muted-foreground)] uppercase tracking-wide">
              <th className="px-4 py-2 text-left font-medium">Weapon</th>
              <th className="px-3 py-2 text-center font-medium">0–4"</th>
              <th className="px-3 py-2 text-center font-medium">5–20"</th>
              <th className="px-3 py-2 text-center font-medium">21–40"</th>
              <th className="px-3 py-2 text-center font-medium">Max</th>
              <th className="px-3 py-2 text-center font-medium">Impact</th>
              <th className="px-3 py-2 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {eraWeapons.map(w => (
              <tr key={w.id} className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30">
                <td className="px-4 py-2 font-medium">
                  {w.name}
                  <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">({w.code})</span>
                </td>
                <td className="px-3 py-2 text-center">{bandLabel(w.toHit.band0_4)}</td>
                <td className="px-3 py-2 text-center">{bandLabel(w.toHit.band5_20)}</td>
                <td className="px-3 py-2 text-center">{bandLabel(w.toHit.band21_40)}</td>
                <td className="px-3 py-2 text-center">{w.maxRange}"</td>
                <td className="px-3 py-2 text-center">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold',
                    w.impact === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    w.impact === 'SPECIAL' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  )}>
                    {w.impact}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-[var(--primary)]">{w.pointsCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {eraWeapons.map(w => w.remarks && (
        <p key={w.id} className="text-xs text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">{w.name}:</span> {w.remarks}
        </p>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function EraGuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>('examples')

  const tabs: { id: Tab; label: string; icon: typeof Star }[] = [
    { id: 'examples', label: 'Army Examples', icon: Star },
    { id: 'factions', label: 'Faction Troops', icon: Shield },
    { id: 'skills', label: 'ERA Skills', icon: BookOpen },
    { id: 'weapons', label: 'ERA Weapons', icon: Crosshair },
  ]

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">ERA 1: Imperialist Era</h1>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
            c. 3500–4500 AD
          </span>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">{eraContent.meta.lore}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--secondary)] rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors',
              activeTab === id
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            <Icon size={13} className="hidden sm:block" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'factions' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Per-figure point costs for each faction. Use these as reference when building armies in the
            Army Builder. Tap a faction to expand its troop list.
          </p>
          {eraContent.factions.map(f => (
            <FactionPanel key={f.id} faction={f} />
          ))}
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Pre-built army lists from the ERA 1 supplement. Each example shows a balanced army with
            squad breakdowns and tips on how to use the{' '}
            <Link to="/army" className="text-[var(--primary)] underline">Army Builder</Link>{' '}
            to recreate it. Tap any army to expand.
          </p>
          {eraContent.armyExamples.map(a => (
            <ArmyExampleCard key={a.id} army={a} />
          ))}
        </div>
      )}

      {activeTab === 'skills' && <EraSkillsPanel />}
      {activeTab === 'weapons' && <EraWeaponsPanel />}
    </div>
  )
}
