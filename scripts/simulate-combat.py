#!/usr/bin/env python3
"""
Beamstrike Skirmish — combat simulation
2D6 to-hit (per-weapon per-band thresholds, same as main game)
Damage: roll 1D6 → cross-reference Infantry Damage Table (impact × armour)
Results: NE | Stun | GH | Kill, mapped to skirmish wound/OOA outcomes.
"""

import random
from collections import defaultdict

SIMULATIONS = 100_000

# ── Training bonuses ─────────────────────────────────────────────────────────
TRAINING = {'CIV': 0, 'REG': 1, 'VET': 2, 'ELITE': 3, 'HERO': 4}

# ── Infantry Damage Table ────────────────────────────────────────────────────
# Rows index 0-5 = D6 rolls 1-6. Columns = [UA, FI, LA, PA, AD].
# Results: 'NE', 'Stun', 'GH', 'Kill'
ARMOUR_COL = {'UA': 0, 'FI': 1, 'LA': 2, 'PA': 3, 'AD': 4}

DAMAGE_TABLE = {
    'STUN': [
        ['GH',   'NE',   'NE',   'NE',   'NE'],
        ['Stun', 'GH',   'NE',   'NE',   'NE'],
        ['Stun', 'Stun', 'NE',   'NE',   'NE'],
        ['Stun', 'Stun', 'GH',   'NE',   'NE'],
        ['Stun', 'Stun', 'Stun', 'NE',   'NE'],
        ['Stun', 'Stun', 'Stun', 'GH',   'NE'],
    ],
    'LOW': [
        ['GH',   'NE',   'NE',   'NE',   'NE'],
        ['Kill', 'GH',   'NE',   'NE',   'NE'],
        ['Kill', 'Kill', 'NE',   'NE',   'NE'],
        ['Kill', 'Kill', 'GH',   'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
    ],
    'STANDARD': [
        ['Kill', 'GH',   'NE',   'NE',   'NE'],
        ['Kill', 'Kill', 'NE',   'NE',   'NE'],
        ['Kill', 'Kill', 'GH',   'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
    ],
    'HIGH': [
        ['Kill', 'Kill', 'NE',   'NE',   'NE'],
        ['Kill', 'Kill', 'GH',   'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ],
    'POWER': [
        ['Kill', 'Kill', 'GH',   'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'NE',   'NE'],
        ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ],
    'TOTAL_1': [
        ['Kill', 'Kill', 'Kill', 'GH',   'NE'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ],
    'TOTAL_2': [
        ['Kill', 'Kill', 'Kill', 'Kill', 'GH'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ],
    'TOTAL_3': [
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
        ['Kill', 'Kill', 'Kill', 'Kill', 'Kill'],
    ],
}


def lookup_damage(impact, roll, armour):
    """Return NE/Stun/GH/Kill from the Infantry Damage Table."""
    key = impact if impact in DAMAGE_TABLE else 'STANDARD'
    return DAMAGE_TABLE[key][roll - 1][ARMOUR_COL[armour]]


# ── Weapons from main Beamstrike weapon list ─────────────────────────────────
# Format: (impact, {b1: threshold, b2: ..., ...})
# CNF = cannot fire; None = out of range

WEAPONS = {
    'Auto-Pistol':          ('LOW',      {'b1': 6,     'b2': 8,    'b3': None, 'b4': None, 'b5': None}),
    'Laser Pistol':         ('STANDARD', {'b1': 5,     'b2': 6,    'b3': None, 'b4': None, 'b5': None}),
    'Gyrobolt Pistol':      ('HIGH',     {'b1': 5,     'b2': 7,    'b3': None, 'b4': None, 'b5': None}),
    'Blast Pistol':         ('HIGH',     {'b1': 6,     'b2': 8,    'b3': None, 'b4': None, 'b5': None}),
    'Assault Rifle':        ('STANDARD', {'b1': 5,     'b2': 8,    'b3': None, 'b4': None, 'b5': None}),
    'Blast Carbine':        ('HIGH',     {'b1': 6,     'b2': 7,    'b3': None, 'b4': None, 'b5': None}),
    'Blast Rifle':          ('HIGH',     {'b1': 5,     'b2': 6,    'b3': 7,    'b4': 9,    'b5': None}),
    'Laser Rifle':          ('STANDARD', {'b1': 5,     'b2': 8,    'b3': 8,    'b4': None, 'b5': None}),
    'Sniper Rifle':         ('STANDARD', {'b1': 8,     'b2': 7,    'b3': 8,    'b4': 10,   'b5': 12}),
    'Gauss Rifle':          ('HIGH',     {'b1': 9,     'b2': 7,    'b3': 9,    'b4': 11,   'b5': 12}),
    'HSL Support Laser':    ('STANDARD', {'b1': 5,     'b2': 6,    'b3': 8,    'b4': 11,   'b5': None}),
    'Thrown Grenade':       ('TOTAL_1',  {'b1': 4,     'b2': None, 'b3': None, 'b4': None, 'b5': None}),
}

# ── Figures: (training, armour, wounds) ──────────────────────────────────────
FIGURES = {
    'CIV UA Grunt':       ('CIV',   'UA', 1),
    'REG FI Grunt':       ('REG',   'FI', 1),
    'VET FI Specialist':  ('VET',   'FI', 2),
    'VET LA Specialist':  ('VET',   'LA', 2),
    'ELITE PA Spec':      ('ELITE', 'PA', 2),
    'HERO PA Leader':     ('HERO',  'PA', 2),
    'HERO AD Leader':     ('HERO',  'AD', 2),
}


def roll_2d6():
    return random.randint(1, 6) + random.randint(1, 6)


def roll_d6():
    return random.randint(1, 6)


def simulate_matchup(attacker_training, weapon_name, band, target_armour, target_wounds, n=SIMULATIONS):
    """
    Simulate n attack sequences using the Infantry Damage Table.
    Wound rules:
      - Grunts (1W): any non-NE result = OOA
      - Specs/Leaders (2W):
          Kill   → OOA immediately
          GH     → Wound counter (+1); Suppressed if not already
          Stun   → Suppressed; if already Suppressed → Wound counter (+1)
          2 wound counters → OOA
    """
    impact, bands = WEAPONS[weapon_name]
    threshold = bands.get(band)
    bonus = TRAINING[attacker_training]

    if threshold is None or threshold == 'CNF':
        return defaultdict(int), 50.0

    results = defaultdict(int)
    shots_to_ooa = []

    for _ in range(n):
        shots = 0
        wounds = 0
        suppressed = False
        done = False

        for _ in range(50):
            shots += 1
            if (roll_2d6() + bonus) < threshold:
                results['miss'] += 1
                continue

            dr = lookup_damage(impact, roll_d6(), target_armour)

            if dr == 'NE':
                results['no_effect'] += 1
                continue

            if target_wounds == 1:
                # Any non-NE = OOA for grunts
                results['ooa'] += 1
                shots_to_ooa.append(shots)
                done = True
                break

            # 2-wound figures
            if dr == 'Kill':
                results['ooa'] += 1
                shots_to_ooa.append(shots)
                done = True
                break
            elif dr == 'GH':
                wounds += 1
                if not suppressed:
                    suppressed = True
                results['gh'] += 1
            else:  # Stun
                if suppressed:
                    wounds += 1
                    results['stun_on_suppressed'] += 1
                else:
                    suppressed = True
                    results['suppressed'] += 1

            if wounds >= 2:
                results['ooa'] += 1
                shots_to_ooa.append(shots)
                done = True
                break

        if not done:
            shots_to_ooa.append(50)

    avg_shots = sum(shots_to_ooa) / len(shots_to_ooa)
    return results, avg_shots


def per_shot_breakdown(attacker_training, weapon_name, band, target_armour, n=SIMULATIONS):
    impact, bands = WEAPONS[weapon_name]
    threshold = bands.get(band)
    bonus = TRAINING[attacker_training]

    if threshold is None or threshold == 'CNF':
        return {'Miss': n, 'Kill': 0, 'GH': 0, 'Stun': 0, 'NE': 0}, n

    outcomes = defaultdict(int)
    for _ in range(n):
        if (roll_2d6() + bonus) < threshold:
            outcomes['Miss'] += 1
        else:
            dr = lookup_damage(impact, roll_d6(), target_armour)
            outcomes[dr] += 1

    return outcomes, n


def pct(x, n):
    return f"{x/n*100:.1f}%"


# ── Scenarios ─────────────────────────────────────────────────────────────────
SCENARIOS = [
    ("REG vs REG Grunt — Assault Rifle at B2",         'REG',   'Assault Rifle',      'b2', 'REG FI Grunt'),
    ("VET vs REG Grunt — Blast Carbine at B1",         'VET',   'Blast Carbine',      'b1', 'REG FI Grunt'),
    ("REG vs REG Grunt — Blast Carbine at B2",         'REG',   'Blast Carbine',      'b2', 'REG FI Grunt'),
    ("VET vs VET LA Spec — Blast Rifle at B2",         'VET',   'Blast Rifle',        'b2', 'VET LA Specialist'),
    ("VET vs VET LA Spec — Assault Rifle at B2",       'VET',   'Assault Rifle',      'b2', 'VET LA Specialist'),
    ("HERO vs HERO PA Leader — Assault Rifle at B2",   'HERO',  'Assault Rifle',      'b2', 'HERO PA Leader'),
    ("REG vs HERO PA Leader — Blast Carbine at B2",    'REG',   'Blast Carbine',      'b2', 'HERO PA Leader'),
    ("ELITE vs HERO PA Leader — Blast Rifle at B2",    'ELITE', 'Blast Rifle',        'b2', 'HERO PA Leader'),
    ("VET vs HERO PA Leader — HSL at B2",              'VET',   'HSL Support Laser',  'b2', 'HERO PA Leader'),
    ("REG Grenade vs REG Grunt — B1",                  'REG',   'Thrown Grenade',     'b1', 'REG FI Grunt'),
    ("REG Grenade vs HERO PA Leader — B1",             'REG',   'Thrown Grenade',     'b1', 'HERO PA Leader'),
    ("REG Grenade vs HERO AD Leader — B1",             'REG',   'Thrown Grenade',     'b1', 'HERO AD Leader'),
    ("HERO Sniper vs REG Grunt — B3",                  'HERO',  'Sniper Rifle',       'b3', 'REG FI Grunt'),
    ("REG Sniper vs REG Grunt — B3",                   'REG',   'Sniper Rifle',       'b3', 'REG FI Grunt'),
    ("HERO vs HERO AD — Laser Pistol at B1",           'HERO',  'Laser Pistol',       'b1', 'HERO AD Leader'),
    ("VET vs HERO AD — Gauss Rifle at B2",             'VET',   'Gauss Rifle',        'b2', 'HERO AD Leader'),
]

print("=" * 80)
print("BEAMSTRIKE SKIRMISH — COMBAT SIMULATION (Infantry Damage Table)")
print(f"Simulations per scenario: {SIMULATIONS:,}")
print("=" * 80)

for label, att_train, weapon, band, target_key in SCENARIOS:
    t_train, t_armour, t_wounds = FIGURES[target_key]
    impact, bands = WEAPONS[weapon]
    threshold = bands.get(band)
    outcomes, n = per_shot_breakdown(att_train, weapon, band, t_armour)
    _, avg_shots = simulate_matchup(att_train, weapon, band, t_armour, t_wounds)

    print(f"\n{label}")
    print(f"  Attacker: {att_train} (+{TRAINING[att_train]}) | {weapon} ({impact}) | Band {band.upper()} threshold: {threshold}")
    print(f"  Target:   {target_key} ({t_wounds}W, {t_armour})")
    hit = n - outcomes['Miss']
    print(f"  Per shot: Miss {pct(outcomes['Miss'],n)}  Kill {pct(outcomes['Kill'],n)}  GH {pct(outcomes['GH'],n)}  Stun {pct(outcomes['Stun'],n)}  NE {pct(outcomes['NE'],n)}")
    print(f"  Avg shots to OOA: {avg_shots:.1f}")
