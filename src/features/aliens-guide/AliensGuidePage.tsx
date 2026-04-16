import { useState } from 'react'
import { Globe, Users, Crosshair, BarChart3, ChevronDown, ChevronRight, Shield } from 'lucide-react'
import { allWeapons, aliensTroops, aliensContent } from '@data/index'
import { cn } from '@lib/utils'
import type { Weapon } from '@types-bs/weapon'

// ── Types ────────────────────────────────────────────────────────────────────
type RaceContent = typeof aliensContent.races[number]
type AlienTroop = typeof aliensTroops[number]

// ── Helpers ──────────────────────────────────────────────────────────────────
const ARMOUR_COLORS: Record<string, string> = {
  UA:    'bg-gray-500/20 text-gray-400',
  FI:    'bg-green-500/20 text-green-400',
  LA:    'bg-blue-500/20 text-blue-400',
  PA:    'bg-purple-500/20 text-purple-400',
  AD:    'bg-orange-500/20 text-orange-400',
  MECHA: 'bg-red-500/20 text-red-400',
  HULL2: 'bg-cyan-500/20 text-cyan-400',
  HULL3: 'bg-cyan-500/20 text-cyan-400',
}

const IMPACT_COLORS: Record<string, string> = {
  STANDARD: 'bg-gray-500/20 text-gray-400',
  HIGH:     'bg-orange-500/20 text-orange-400',
  POWER:    'bg-red-500/20 text-red-400',
  TOTAL_1:  'bg-red-700/30 text-red-300',
  TOTAL_2:  'bg-red-700/30 text-red-300',
  VARIES:   'bg-purple-500/20 text-purple-400',
  SPECIAL:  'bg-purple-500/20 text-purple-400',
  STUN:     'bg-yellow-500/20 text-yellow-400',
  LOW:      'bg-gray-500/20 text-gray-400',
}

const RACE_ORDER = ['HIBEVOR', 'GROWWLAN', 'THUNTRA', 'CENTALING', 'FERRAPUR', 'REPLICAN', 'SPUG', 'GREY', 'BUG', 'K_KREE']

function ArmourBadge({ armour }: { armour: string }) {
  return (
    <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide', ARMOUR_COLORS[armour] ?? 'bg-gray-500/20 text-gray-400')}>
      {armour}
    </span>
  )
}

function bandLabel(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return String(v)
}

// ── Tab IDs ──────────────────────────────────────────────────────────────────
type Tab = 'races' | 'troops' | 'weapons' | 'charts'

// ── Race Overview Card ────────────────────────────────────────────────────────
function RaceCard({ race }: { race: RaceContent }) {
  const [open, setOpen] = useState(false)
  const troops = aliensTroops.filter((t: AlienTroop) => t.race === race.id)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--accent)] transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold">{race.displayName}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {troops.length} troop type{troops.length !== 1 ? 's' : ''}
              {' · '}
              {race.availability.tenThousandYearWar === 'Y' ? 'All eras' : 'Limited eras'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[var(--muted-foreground)] hidden sm:block">d100: {race.d100Roll}</span>
          {open
            ? <ChevronDown size={16} className="text-[var(--muted-foreground)]" />
            : <ChevronRight size={16} className="text-[var(--muted-foreground)]" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] space-y-4 p-4">
          {/* Lore */}
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{race.lore}</p>

          {/* Tactics tip */}
          <div className="rounded-lg bg-[var(--secondary)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1 flex items-center gap-1.5">
              <Shield size={11} /> Tactics
            </p>
            <p className="text-xs text-[var(--foreground)]">{race.tacticsNote}</p>
          </div>

          {/* Special rules */}
          {(() => {
            const raceData = (aliensContent.races as RaceContent[]).find(r => r.id === race.id)
            const specialRules = raceData ? (raceData as RaceContent & { specialRules?: string[] }).specialRules : undefined
            if (!specialRules?.length) return null
            return (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">Special Rules</p>
                <ul className="space-y-1">
                  {specialRules.map((rule: string, i: number) => (
                    <li key={i} className="text-xs text-[var(--muted-foreground)] flex gap-2">
                      <span className="shrink-0 text-[var(--primary)] font-bold">›</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}

          {/* Era availability */}
          <div className="flex flex-wrap gap-2 text-[10px]">
            {[
              { label: 'Segregation', key: 'segregationEra' },
              { label: 'Imperial', key: 'imperialEra' },
              { label: '10K Year War', key: 'tenThousandYearWar' },
              { label: 'Borrowed Time', key: 'borrowedTimeEra' },
            ].map(({ label, key }) => {
              const val = race.availability[key as keyof typeof race.availability]
              return (
                <span
                  key={key}
                  className={cn(
                    'px-2 py-0.5 rounded-full font-medium',
                    val === 'Y' ? 'bg-green-500/20 text-green-400' :
                    val === 'R' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/10 text-gray-600'
                  )}
                >
                  {label}: {val === 'Y' ? 'Yes' : val === 'R' ? 'Restricted' : 'No'}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Troop Costs Tab ───────────────────────────────────────────────────────────
function TroopCostsPanel() {
  const [filter, setFilter] = useState<string>('ALL')
  const races = RACE_ORDER.map(id => ({
    id,
    label: aliensContent.races.find(r => r.id === id)?.displayName ?? id,
  }))
  const displayed = filter === 'ALL'
    ? aliensTroops as AlienTroop[]
    : (aliensTroops as AlienTroop[]).filter(t => t.race === filter)

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        Point costs are per figure with weapons and equipment as described in the troop profile.
        Entries marked * include weapons and equipment in the cost.
      </p>

      {/* Race filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter('ALL')}
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
            filter === 'ALL' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          All
        </button>
        {races.map(r => (
          <button
            key={r.id}
            onClick={() => setFilter(r.id)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              filter === r.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            {r.label.replace('The ', '')}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-xs">
          <thead className="bg-[var(--secondary)]">
            <tr className="text-[var(--muted-foreground)] uppercase tracking-wide">
              <th className="px-3 py-2 text-left font-medium">Race</th>
              <th className="px-3 py-2 text-left font-medium">Troop Type</th>
              <th className="px-3 py-2 text-center font-medium">Arm</th>
              <th className="px-3 py-2 text-right font-medium">Pts</th>
              <th className="px-3 py-2 text-center font-medium hidden sm:table-cell">Road</th>
              <th className="px-3 py-2 text-center font-medium hidden sm:table-cell">Open</th>
              <th className="px-3 py-2 text-center font-medium hidden md:table-cell">Woods</th>
              <th className="px-3 py-2 text-center font-medium hidden md:table-cell">Diff</th>
              <th className="px-3 py-2 text-center font-medium hidden lg:table-cell">V.Diff</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((t: AlienTroop) => (
              <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors">
                <td className="px-3 py-2 text-[var(--muted-foreground)]">
                  {aliensContent.races.find(r => r.id === t.race)?.displayName.replace('The ', '') ?? t.race}
                </td>
                <td className="px-3 py-2 font-medium">
                  {t.name}
                  {t.isVehicle && (
                    <span className="ml-1 text-[10px] text-cyan-400 font-normal">vehicle</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <ArmourBadge armour={t.armour} />
                </td>
                <td className="px-3 py-2 text-right font-semibold text-[var(--primary)]">{t.pointsCost}</td>
                <td className="px-3 py-2 text-center text-[var(--muted-foreground)] hidden sm:table-cell">
                  {t.movement.road === 0 && t.race !== 'BUG' ? '—' : t.movement.road}"
                </td>
                <td className="px-3 py-2 text-center text-[var(--muted-foreground)] hidden sm:table-cell">
                  {t.movement.openGround}"
                </td>
                <td className="px-3 py-2 text-center text-[var(--muted-foreground)] hidden md:table-cell">
                  {t.movement.lightWoods}"
                </td>
                <td className="px-3 py-2 text-center text-[var(--muted-foreground)] hidden md:table-cell">
                  {t.movement.difficultGround}"
                </td>
                <td className="px-3 py-2 text-center text-[var(--muted-foreground)] hidden lg:table-cell">
                  {t.movement.veryDifficult}"
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Alien Weapons Tab ─────────────────────────────────────────────────────────
function AlienWeaponsPanel() {
  const [raceFilter, setRaceFilter] = useState<string>('ALL')

  const alienRangedWeapons = (allWeapons as Weapon[]).filter(w => w.category === 'ALIEN')
  const alienMeleeWeapons = (allWeapons as Weapon[]).filter(
    w => w.category === 'MELEE' && (w as Weapon & { racesAllowed?: string[] }).racesAllowed?.length
  )

  const filtered = raceFilter === 'ALL'
    ? alienRangedWeapons
    : alienRangedWeapons.filter(w => {
        const ra = (w as Weapon & { racesAllowed?: string[] }).racesAllowed
        return ra?.includes(raceFilter)
      })

  const filteredMelee = raceFilter === 'ALL'
    ? alienMeleeWeapons
    : alienMeleeWeapons.filter(w => {
        const ra = (w as Weapon & { racesAllowed?: string[] }).racesAllowed
        return ra?.includes(raceFilter)
      })

  const races = RACE_ORDER.map(id => ({
    id,
    label: aliensContent.races.find(r => r.id === id)?.displayName.replace('The ', '') ?? id,
  }))

  const WeaponRow = ({ w }: { w: Weapon }) => (
    <tr className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors">
      <td className="px-3 py-2 font-medium">
        {w.name}
        <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">({w.code})</span>
      </td>
      <td className="px-2 py-2 text-center">{bandLabel(w.toHit.band0_4)}</td>
      <td className="px-2 py-2 text-center">{bandLabel(w.toHit.band5_20)}</td>
      <td className="px-2 py-2 text-center hidden sm:table-cell">{bandLabel(w.toHit.band21_40)}</td>
      <td className="px-2 py-2 text-center hidden md:table-cell">{bandLabel(w.toHit.band41_80)}</td>
      <td className="px-2 py-2 text-center hidden lg:table-cell">{bandLabel(w.toHit.band81plus)}</td>
      <td className="px-2 py-2 text-center">{w.maxRange ? `${w.maxRange}"` : '—'}</td>
      <td className="px-2 py-2 text-center">
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', IMPACT_COLORS[w.impact] ?? 'bg-gray-500/20 text-gray-400')}>
          {w.impact}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-semibold text-[var(--primary)]">{w.pointsCost}</td>
    </tr>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Human forces may NOT use any weapons listed here. All alien races (except Bugs) may use laser painters and targetters unless specifically barred.
      </p>

      {/* Race filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setRaceFilter('ALL')}
          className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
            raceFilter === 'ALL' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >All</button>
        {races.map(r => (
          <button key={r.id} onClick={() => setRaceFilter(r.id)}
            className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              raceFilter === r.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >{r.label}</button>
        ))}
      </div>

      {/* Ranged weapons table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead className="bg-[var(--secondary)]">
              <tr className="text-[var(--muted-foreground)] uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-medium">Weapon</th>
                <th className="px-2 py-2 text-center font-medium">0–4"</th>
                <th className="px-2 py-2 text-center font-medium">4–20"</th>
                <th className="px-2 py-2 text-center font-medium hidden sm:table-cell">20–40"</th>
                <th className="px-2 py-2 text-center font-medium hidden md:table-cell">40–80"</th>
                <th className="px-2 py-2 text-center font-medium hidden lg:table-cell">80+"</th>
                <th className="px-2 py-2 text-center font-medium">Max</th>
                <th className="px-2 py-2 text-center font-medium">Impact</th>
                <th className="px-3 py-2 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => <WeaponRow key={w.id} w={w} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Melee weapons */}
      {filteredMelee.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] pt-2">Alien Melee Weapons</p>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--secondary)]">
                <tr className="text-[var(--muted-foreground)] uppercase tracking-wide">
                  <th className="px-3 py-2 text-left font-medium">Weapon</th>
                  <th className="px-3 py-2 text-center font-medium">H2H Bonus</th>
                  <th className="px-3 py-2 text-center font-medium">Impact</th>
                  <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Races</th>
                  <th className="px-3 py-2 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {filteredMelee.map(w => {
                  const mb = (w as Weapon & { meleeBonus?: number }).meleeBonus
                  const ra = (w as Weapon & { racesAllowed?: string[] }).racesAllowed
                  return (
                    <tr key={w.id} className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors">
                      <td className="px-3 py-2 font-medium">{w.name}</td>
                      <td className="px-3 py-2 text-center font-bold text-[var(--primary)]">
                        {mb !== undefined ? (mb >= 0 ? `+${mb}` : `${mb}`) : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', IMPACT_COLORS[w.impact] ?? 'bg-gray-500/20 text-gray-400')}>
                          {w.impact}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--muted-foreground)] hidden sm:table-cell text-xs">
                        {ra?.join(', ') ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--primary)]">{w.pointsCost}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Remarks */}
      <div className="space-y-2">
        {filtered.filter(w => w.remarks).map(w => (
          <p key={w.id} className="text-xs text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">{w.name}:</span> {w.remarks}
          </p>
        ))}
      </div>
    </div>
  )
}

// ── Tactical Charts Tab ───────────────────────────────────────────────────────
function TacticalChartsPanel() {
  const { firingModifiers, damageModifiers, h2hModifiers } = aliensContent.alienCharts

  const ModTable = ({ title, rows }: { title: string; rows: { factor: string; modifier: string }[] }) => (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="bg-[var(--secondary)] px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</p>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors">
              <td className="px-4 py-2 text-[var(--muted-foreground)]">{row.factor}</td>
              <td className="px-4 py-2 text-right font-bold text-[var(--primary)] w-16">{row.modifier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Alien-specific modifiers from supplement p.15. These apply on top of standard Beamstrike modifiers.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <ModTable title="Firing Modifiers (add to hit)" rows={firingModifiers} />
        <ModTable title="Damage Modifiers" rows={damageModifiers} />
        <ModTable title="Hand-to-Hand (1d10)" rows={h2hModifiers} />
      </div>

      {/* Bug scenarios */}
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3">Bug Scenario Table</p>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead className="bg-[var(--secondary)]">
              <tr className="text-[var(--muted-foreground)] uppercase tracking-wide">
                <th className="px-3 py-2 text-center font-medium">1d10</th>
                <th className="px-3 py-2 text-left font-medium">Scenario</th>
                <th className="px-3 py-2 text-center font-medium">Humans</th>
                <th className="px-3 py-2 text-center font-medium">Bugs</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Victory</th>
              </tr>
            </thead>
            <tbody>
              {aliensContent.bugScenarios.map((s, i) => (
                <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors">
                  <td className="px-3 py-2 text-center font-bold text-[var(--primary)]">{s.roll}</td>
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">{s.humanPoints}</td>
                  <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">{s.bugPoints}</td>
                  <td className="px-3 py-2 text-[var(--muted-foreground)] hidden md:table-cell">{s.victoryConditions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function AliensGuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>('races')

  const tabs: { id: Tab; label: string; icon: typeof Globe }[] = [
    { id: 'races',   label: 'Race Overview',   icon: Globe },
    { id: 'troops',  label: 'Troop Costs',     icon: Users },
    { id: 'weapons', label: 'Alien Weapons',   icon: Crosshair },
    { id: 'charts',  label: 'Tactical Charts', icon: BarChart3 },
  ]

  const orderedRaces = RACE_ORDER
    .map(id => aliensContent.races.find(r => r.id === id))
    .filter(Boolean) as RaceContent[]

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Alien Races</h1>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
            Supplement v1.2
          </span>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          {aliensContent.usageNote}
        </p>
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
      {activeTab === 'races' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            10 alien races from the official supplement. Tap any race to see lore, special rules, tactics, and era availability.
            Y = unrestricted use. R = restricted (small mercenary forces, max 30% of total army points).
          </p>
          {orderedRaces.map(r => <RaceCard key={r.id} race={r} />)}
        </div>
      )}

      {activeTab === 'troops' && <TroopCostsPanel />}
      {activeTab === 'weapons' && <AlienWeaponsPanel />}
      {activeTab === 'charts' && <TacticalChartsPanel />}
    </div>
  )
}
