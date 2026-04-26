import { cn } from '@lib/utils'

function Table({ headers, rows, className }: { headers: string[]; rows: (string | number)[][]; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            {headers.map(h => (
              <th key={h} className="py-1.5 px-2 text-left font-semibold text-[var(--muted-foreground)] uppercase tracking-wide text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 even:bg-[var(--accent)]/30">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 px-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      <div className="bg-[var(--card)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</div>
      <div className="bg-[var(--background)] px-3 py-2">{children}</div>
    </div>
  )
}

export function QuickRefTab() {
  return (
    <div className="p-4">

      <Card title="Actions">
        <Table
          headers={['Action', 'Cost', 'Notes']}
          rows={[
            ['Move',          '1',  'Up to Move value in inches'],
            ['Shoot',         '1',  '[Reload] weapons must be reloaded first'],
            ['Reload',        '1',  'Ready a [Reload] weapon'],
            ['Charge',        '2',  'Move +2", ends in base contact'],
            ['Overwatch',     '1',  'Stationary; last action of activation'],
            ['Stand Up',      '1',  'Remove Suppressed status'],
            ['Use Equipment', '1',  'Grenade, med-kit, loot pickup…'],
            ['Rally',         '1',  '1D6 + To-Hit Bonus, 6+ → friendly within 3" recovers'],
          ]}
        />
      </Card>

      <Card title="Training">
        <Table
          headers={['Training', 'Pts', 'To-Hit', 'Melee', 'Nerve']}
          rows={[
            ['CIV',   0,  '+0', '−1', 2],
            ['REG',   2,  '+1', '+0', 3],
            ['VET',   5,  '+2', '+1', 4],
            ['ELITE', 10, '+3', '+2', 5],
            ['HERO',  20, '+4', '+3', 6],
          ]}
        />
      </Card>

      <Card title="To-Hit: Roll 2D6 + Training Bonus vs Weapon's Band Threshold">
        <p className="text-xs mb-2 text-[var(--muted-foreground)]">Each weapon has its own 2D6 threshold per range band (from the main Beamstrike weapon charts). CNF = cannot fire.</p>
        <Table
          headers={['Band', 'Range']}
          rows={[
            ['B1 — Point Blank', '0–4"'],
            ['B2 — Short',       '5–20"'],
            ['B3 — Effective',   '21–40"'],
            ['B4 — Long',        '41–80"'],
            ['B5 — Extreme',     '81"+'],
          ]}
        />
        <p className="text-xs font-semibold mt-3 mb-1 text-[var(--muted-foreground)] uppercase tracking-wide">Modifiers to Roll</p>
        <Table
          headers={['Situation', 'Mod']}
          rows={[
            ['Target in Light Cover',       '−1'],
            ['Target in Heavy Cover',       '−2'],
            ['Firer moved this activation', '−1'],
            ['Target is Suppressed',        '+2'],
            ['Support weapon at B1',        '−2 (or CNF per profile)'],
            ['Aimed shot (both actions)',   '+2'],
          ]}
        />
      </Card>

      <Card title="Damage: Roll 1D6 — Infantry Damage Table">
        <p className="text-xs mb-2 text-[var(--muted-foreground)]">Same table as main Beamstrike. Cross-reference weapon's Impact with target's Armour column.</p>
        <Table
          headers={['Result', 'Skirmish Effect']}
          rows={[
            ['NE',   'No effect'],
            ['Stun', 'Suppressed (if already Suppressed → Wound counter)'],
            ['GH',   'Wound counter + Suppressed if not already'],
            ['Kill', 'Out of Action immediately'],
          ]}
        />
        <p className="text-xs font-semibold mt-3 mb-1 text-[var(--muted-foreground)] uppercase tracking-wide">Wounds</p>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">Grunts (1W): any non-NE = OOA. Specialists/Leaders (2W): 2 Wound counters = OOA; Kill = immediate OOA.</p>
        <p className="text-xs font-semibold mb-1 text-[var(--muted-foreground)] uppercase tracking-wide">STANDARD impact</p>
        <Table
          headers={['D6', 'UA', 'FI', 'LA', 'PA', 'AD']}
          rows={[
            [1, 'Kill', 'GH',   'NE',   'NE',   'NE'],
            [2, 'Kill', 'Kill', 'NE',   'NE',   'NE'],
            [3, 'Kill', 'Kill', 'GH',   'NE',   'NE'],
            [4, 'Kill', 'Kill', 'Kill', 'NE',   'NE'],
            [5, 'Kill', 'Kill', 'Kill', 'GH',   'NE'],
            [6, 'Kill', 'Kill', 'Kill', 'Kill', 'GH'],
          ]}
        />
        <p className="text-xs font-semibold mt-3 mb-1 text-[var(--muted-foreground)] uppercase tracking-wide">HIGH impact</p>
        <Table
          headers={['D6', 'UA', 'FI', 'LA', 'PA', 'AD']}
          rows={[
            [1, 'Kill', 'Kill', 'NE',   'NE',   'NE'],
            [2, 'Kill', 'Kill', 'GH',   'NE',   'NE'],
            [3, 'Kill', 'Kill', 'Kill', 'NE',   'NE'],
            [4, 'Kill', 'Kill', 'Kill', 'GH',   'NE'],
            [5, 'Kill', 'Kill', 'Kill', 'Kill', 'GH'],
            [6, 'Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
          ]}
        />
        <p className="text-xs mt-2 text-[var(--muted-foreground)] italic">Full table (all 8 sections) in Rules tab → Shooting → Damage Table.</p>
      </Card>

      <Card title="Bottle Test">
        <p className="text-xs mb-2"><strong>Triggers:</strong> Leader OOA, or active figures ≤ 50% of start (each is a separate test).</p>
        <p className="text-xs mb-2"><strong>Roll:</strong> 1D6 + highest active figure's Nerve. <strong>8+ = hold.</strong></p>
        <p className="text-xs text-[var(--muted-foreground)]">If you bottle out, remaining figures are safe for injury purposes.</p>
      </Card>

      <Card title="Injury Table">
        <Table
          headers={['D6', 'Result']}
          rows={[
            ['1–2', 'Full Recovery'],
            ['3',   'Miss Next Game'],
            ['4–5', 'Permanent Injury (roll sub-table)'],
            ['6',   'Death'],
          ]}
        />
        <p className="text-xs font-semibold mt-3 mb-1 text-[var(--muted-foreground)] uppercase tracking-wide">Permanent Injury Sub-table</p>
        <Table
          headers={['D6', 'Injury', 'Effect']}
          rows={[
            ['1', 'Old Wound',     '−1" Move (min 2")'],
            ['2', 'Arm Injury',    '−1 to all shooting To-Hit'],
            ['3', 'Leg Wound',     '−2" Move; no Charge'],
            ['4', 'Eye Damage',    'Cannot use Band 5'],
            ['5', 'Shaken Nerve',  '−1 Nerve'],
            ['6', 'Battle-Scarred','1 free Skill Slot'],
          ]}
        />
      </Card>

      <Card title="Campaign — Scrip Income">
        <Table
          headers={['Source', 'Scrip']}
          rows={[
            ['Base income',              '1D6'],
            ['Per objective achieved',   '+1'],
            ['Win the game',             '+1'],
            ['Leader not OOA at end',    '+1'],
          ]}
        />
      </Card>

      <Card title="Campaign — XP">
        <Table
          headers={['Action', 'XP']}
          rows={[
            ['Take an enemy OOA',                     '1 XP'],
            ['Participate in completing an objective', '1 XP'],
            ['Last standing when enemy bottles',       '1 XP (Leader only)'],
          ]}
        />
        <p className="text-xs mt-2 text-[var(--muted-foreground)]">Skills cost 4 XP each. Max 3 skills per figure.</p>
      </Card>

    </div>
  )
}
