import { useState } from 'react'
import { Dices, Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@lib/utils'
import { useWarbandStore } from '@store/warbandStore'
import skirmishSkills from '@data/skirmish-skills.json'
import type { SkirmishFigure } from '@types-bs/skirmish'

// ── Injury roller ────────────────────────────────────────────────────────────

const INJURY_TABLE = [
  null,
  { name: 'Full Recovery',   effect: 'Returns next game with no penalty.' },
  { name: 'Full Recovery',   effect: 'Returns next game with no penalty.' },
  { name: 'Miss Next Game',  effect: 'Unavailable for the next game only.' },
  { name: 'Permanent Injury', effect: null }, // roll sub-table
  { name: 'Permanent Injury', effect: null },
  { name: 'Death',           effect: 'Figure is permanently removed from the roster.' },
]

const PERM_INJURY_TABLE = [
  null,
  { name: 'Old Wound',     effect: '−1" Move (minimum 2")' },
  { name: 'Arm Injury',    effect: '−1 to all shooting To-Hit rolls' },
  { name: 'Leg Wound',     effect: '−2" Move; cannot Charge' },
  { name: 'Eye Damage',    effect: 'Cannot use Band 5 (max range reduced one band)' },
  { name: 'Shaken Nerve',  effect: '−1 Nerve' },
  { name: 'Battle-Scarred',effect: 'Survives intact; gains 1 free Skill Slot' },
]

function InjuryRoller({ warbandId, figure }: { warbandId: string; figure: SkirmishFigure }) {
  const [roll, setRoll] = useState<number | null>(null)
  const [subRoll, setSubRoll] = useState<number | null>(null)
  const { addInjury, setFigureStatus } = useWarbandStore()

  const result = roll ? INJURY_TABLE[roll] : null
  const permResult = (roll === 4 || roll === 5) && subRoll ? PERM_INJURY_TABLE[subRoll] : null

  function rollD6() {
    const r = Math.floor(Math.random() * 6) + 1
    setRoll(r)
    setSubRoll(null)
    if (r === 6) setFigureStatus(warbandId, figure.id, 'DEAD')
    if (r === 3) setFigureStatus(warbandId, figure.id, 'RECOVERING')
    if (r === 1 || r === 2) setFigureStatus(warbandId, figure.id, 'ACTIVE')
  }

  function rollSubTable() {
    const r = Math.floor(Math.random() * 6) + 1
    setSubRoll(r)
    const inj = PERM_INJURY_TABLE[r]
    if (inj) {
      addInjury(warbandId, figure.id, { id: `inj-${Date.now()}`, name: inj.name, effect: inj.effect })
      setFigureStatus(warbandId, figure.id, r === 6 ? 'ACTIVE' : 'ACTIVE')
    }
  }

  return (
    <div className="px-3 py-2 bg-[var(--background)] border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium flex-1">{figure.name}</span>
        <button
          onClick={rollD6}
          className="flex items-center gap-1 rounded bg-[var(--accent)] px-2 py-1 text-xs hover:bg-[var(--accent)]/80"
        >
          <Dices size={12} /> Roll
        </button>
      </div>
      {result && (
        <div className="mt-1.5 text-xs">
          <span className="font-semibold">D6={roll}: {result.name}</span>
          {result.effect && <span className="text-[var(--muted-foreground)]"> — {result.effect}</span>}
          {(roll === 4 || roll === 5) && !subRoll && (
            <button
              onClick={rollSubTable}
              className="ml-2 flex items-center gap-1 rounded bg-orange-500/20 text-orange-400 px-2 py-0.5 text-xs"
            >
              <Dices size={10} /> Roll injury
            </button>
          )}
          {permResult && (
            <div className="mt-0.5">
              <span className="font-semibold">D6={subRoll}: {permResult.name}</span>
              <span className="text-[var(--muted-foreground)]"> — {permResult.effect}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── XP & Skills ──────────────────────────────────────────────────────────────

function FigureXpPanel({ warbandId, figure }: { warbandId: string; figure: SkirmishFigure }) {
  const { addXp, addSkill } = useWarbandStore()
  const canBuySkill = figure.xp >= 4 && figure.skillIds.length < 3
  const ownedSkills = skirmishSkills.filter(s => figure.skillIds.includes(s.id))
  const availableSkills = skirmishSkills.filter(s => !figure.skillIds.includes(s.id))

  return (
    <div className="px-3 py-2 bg-[var(--background)] border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium flex-1">{figure.name}</span>
        <span className="text-xs text-[var(--muted-foreground)]">{figure.xp} XP</span>
        <button onClick={() => addXp(warbandId, figure.id, 1)} className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs">+1 XP</button>
      </div>
      {ownedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {ownedSkills.map(s => (
            <span key={s.id} className="rounded bg-amber-500/20 text-amber-400 px-1.5 py-0.5 text-[10px]">{s.name}</span>
          ))}
        </div>
      )}
      {canBuySkill && (
        <div className="mt-1.5">
          <p className="text-[10px] text-[var(--muted-foreground)] mb-1">Buy skill (4 XP):</p>
          <div className="flex flex-wrap gap-1">
            {availableSkills.map(s => (
              <button
                key={s.id}
                onClick={() => addSkill(warbandId, figure.id, s.id)}
                className="rounded border px-2 py-0.5 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Warband Campaign Panel ───────────────────────────────────────────────────

function WarbandCampaignPanel({ warbandId }: { warbandId: string }) {
  const { warbands, addScrip, recordGame } = useWarbandStore()
  const warband = warbands.find(w => w.id === warbandId)
  const [section, setSection] = useState<'injuries' | 'xp' | 'scrip'>('injuries')
  const [open, setOpen] = useState(true)

  if (!warband) return null

  const activeFigs = warband.figures.filter(f => f.status === 'ACTIVE')

  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 w-full px-3 py-2.5 bg-[var(--card)] text-left">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <div className="flex-1">
          <p className="font-semibold text-sm">{warband.name}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {activeFigs.length} active · {warband.scrip} scrip · {warband.wins}W / {warband.gamesPlayed}G
          </p>
        </div>
      </button>

      {open && (
        <div className="bg-[var(--background)]">
          {/* Section tabs */}
          <div className="flex border-b text-xs">
            {(['injuries', 'xp', 'scrip'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={cn(
                  'flex-1 py-2 font-medium capitalize transition-colors',
                  section === s ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                )}
              >
                {s === 'xp' ? 'XP & Skills' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {section === 'injuries' && (
            <div>
              <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">Roll injuries for each OOA figure:</p>
              {warband.figures.map(f => (
                <InjuryRoller key={f.id} warbandId={warband.id} figure={f} />
              ))}
            </div>
          )}

          {section === 'xp' && (
            <div>
              <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">Award XP and spend on skills (4 XP each, max 3 per figure):</p>
              {warband.figures.filter(f => f.status !== 'DEAD').map(f => (
                <FigureXpPanel key={f.id} warbandId={warband.id} figure={f} />
              ))}
            </div>
          )}

          {section === 'scrip' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold flex-1">Scrip: {warband.scrip}</span>
                <button onClick={() => addScrip(warband.id, -1)} className="rounded border w-7 h-7 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><Minus size={12} /></button>
                <button onClick={() => addScrip(warband.id, 1)}  className="rounded border w-7 h-7 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><Plus size={12} /></button>
              </div>
              <div className="rounded border">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)] border-b">Post-game income</p>
                {[
                  { label: 'Base income', action: () => { const r = Math.floor(Math.random() * 6) + 1; addScrip(warband.id, r) }, btn: 'Roll D6' },
                  { label: '+1 per objective', action: () => addScrip(warband.id, 1), btn: '+1' },
                  { label: '+1 for win', action: () => addScrip(warband.id, 1), btn: '+1' },
                  { label: '+1 leader survived', action: () => addScrip(warband.id, 1), btn: '+1' },
                ].map(({ label, action, btn }) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2 text-xs border-b last:border-0">
                    <span className="text-[var(--muted-foreground)]">{label}</span>
                    <button onClick={action} className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs hover:bg-[var(--accent)]/80">{btn}</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => recordGame(warband.id, true)}
                  className="flex-1 rounded border border-green-500/40 py-2 text-xs text-green-400 hover:bg-green-500/10 transition-colors"
                >
                  Record Win ({warband.wins + 1}W)
                </button>
                <button
                  onClick={() => recordGame(warband.id, false)}
                  className="flex-1 rounded border py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Record Loss
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Tab ─────────────────────────────────────────────────────────────────

export function CampaignTab() {
  const { warbands } = useWarbandStore()

  if (warbands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-[var(--muted-foreground)]">
        <p className="text-sm">No warbands yet.</p>
        <p className="text-xs mt-1">Create a warband in the Warband tab first.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        Post-game sequence: roll injuries → award XP → buy skills → earn scrip.
      </p>
      {warbands.map(w => <WarbandCampaignPanel key={w.id} warbandId={w.id} />)}
    </div>
  )
}
