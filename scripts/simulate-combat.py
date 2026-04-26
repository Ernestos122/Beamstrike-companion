#!/usr/bin/env python3
"""
Beamstrike Skirmish — combat simulation
2D6 to-hit (per-weapon per-band thresholds, same as main game)
D6 damage: Net = D6 + impact_bonus + armour_mod → 4+ OOA | 1-3 Suppressed | 0- No Effect
"""

import random
from collections import defaultdict

SIMULATIONS = 100_000

# ── Training ────────────────────────────────────────────────────────────────
TRAINING = {
    'CIV':   0,
    'REG':   1,
    'VET':   2,
    'ELITE': 3,
    'HERO':  4,
}

# ── Range band thresholds — per weapon (same bands as main Beamstrike game) ──
# Bands: b1=0-4", b2=5-20", b3=21-40", b4=41-80", b5=81"+
# Value: 2D6 threshold needed (before training bonus), None = out of range, 'CNF' = cannot fire

# ── Weapons from main Beamstrike weapon list ─────────────────────────────────
# Format: (impact_bonus, {b1, b2, b3, b4, b5})
# Impact mapping: LOW/STUN→+0, STANDARD→+1, HIGH/POWER→+2, TOTAL→+2
# 'CNF' bands treated as automatic miss in simulation

WEAPONS = {
    # Pistols
    'Auto-Pistol [L]':          (0,  {'b1': 6,     'b2': 8,    'b3': None, 'b4': None, 'b5': None}),
    'Laser Pistol [S]':         (1,  {'b1': 5,     'b2': 6,    'b3': None, 'b4': None, 'b5': None}),
    'Gyrobolt Pistol [H]':      (2,  {'b1': 5,     'b2': 7,    'b3': None, 'b4': None, 'b5': None}),
    'Blast Pistol [H]':         (2,  {'b1': 6,     'b2': 8,    'b3': None, 'b4': None, 'b5': None}),
    # Rifles / Carbines
    'Assault Rifle [S]':        (1,  {'b1': 5,     'b2': 8,    'b3': None, 'b4': None, 'b5': None}),
    'Blast Carbine [H]':        (2,  {'b1': 6,     'b2': 7,    'b3': None, 'b4': None, 'b5': None}),
    'Blast Rifle [H]':          (2,  {'b1': 5,     'b2': 6,    'b3': 7,    'b4': 9,    'b5': None}),
    'Laser Rifle [S]':          (1,  {'b1': 5,     'b2': 8,    'b3': 8,    'b4': None, 'b5': None}),
    'Sniper Rifle [S]':         (1,  {'b1': 8,     'b2': 7,    'b3': 8,    'b4': 10,   'b5': 12}),
    'Sniper Laser [S]':         (1,  {'b1': 8,     'b2': 6,    'b3': 7,    'b4': 9,    'b5': None}),
    'Gauss Rifle [H]':          (2,  {'b1': 9,     'b2': 7,    'b3': 9,    'b4': 11,   'b5': 12}),
    # Support
    'HSL Support Laser [S]':    (1,  {'b1': 5,     'b2': 6,    'b3': 8,    'b4': 11,   'b5': None}),
    # Grenades (thrown — B1 only)
    'Thrown Grenade [B]':       (2,  {'b1': 4,     'b2': None, 'b3': None, 'b4': None, 'b5': None}),
}

# ── Armour modifiers ─────────────────────────────────────────────────────────
ARMOUR_MOD = {
    'UA': 0,
    'FI': -1,
    'LA': -2,
    'PA': -3,
    'AD': -4,
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


def get_threshold(weapon_name, band):
    """Return 2D6 threshold for this weapon at this band. None/CNF = cannot fire."""
    _, bands = WEAPONS[weapon_name]
    return bands.get(band)


def damage_result(damage_bonus, armour_key):
    """Returns 'OOA', 'SUPP', or 'NONE' for one damage roll."""
    net = roll_d6() + damage_bonus + ARMOUR_MOD[armour_key]
    if net >= 4:
        return 'OOA'
    elif net >= 1:
        return 'SUPP'
    else:
        return 'NONE'


def simulate_matchup(attacker_training, weapon_name, band, target_armour, target_wounds, n=SIMULATIONS):
    """
    Simulate n full attack sequences (to-hit + damage) with wound stacking.
    SUPP on already-Suppressed 2W figure = wound counter; 2 wound counters = OOA.
    """
    damage_bonus, _ = WEAPONS[weapon_name]
    threshold = get_threshold(weapon_name, band)
    bonus = TRAINING[attacker_training]

    if threshold is None or threshold == 'CNF':
        return defaultdict(int), 50.0  # weapon can't fire at this band

    results = defaultdict(int)
    shots_to_ooa = []

    for _ in range(n):
        shots = 0
        wounds = 0
        suppressed = False
        done = False

        for _ in range(50):
            shots += 1
            hit = (roll_2d6() + bonus) >= threshold
            if not hit:
                results['miss'] += 1
                continue

            dr = damage_result(damage_bonus, target_armour)

            if dr == 'NONE':
                results['no_effect'] += 1
                continue

            if target_wounds == 1:
                results['ooa'] += 1
                shots_to_ooa.append(shots)
                done = True
                break
            else:
                if dr == 'OOA':
                    results['ooa'] += 1
                    shots_to_ooa.append(shots)
                    done = True
                    break
                else:  # SUPP
                    if suppressed:
                        wounds += 1
                        if wounds >= 2:
                            results['ooa'] += 1
                            shots_to_ooa.append(shots)
                            done = True
                            break
                    else:
                        suppressed = True
                        results['suppressed_only'] += 1

        if not done:
            shots_to_ooa.append(50)

    avg_shots = sum(shots_to_ooa) / len(shots_to_ooa)
    return results, avg_shots


def per_shot_breakdown(attacker_training, weapon_name, band, target_armour, n=SIMULATIONS):
    damage_bonus, _ = WEAPONS[weapon_name]
    threshold = get_threshold(weapon_name, band)
    bonus = TRAINING[attacker_training]

    if threshold is None or threshold == 'CNF':
        return {'Miss': n, 'Hit → OOA': 0, 'Hit → Suppressed': 0, 'Hit → No effect': 0}, n

    outcomes = defaultdict(int)
    for _ in range(n):
        hit = (roll_2d6() + bonus) >= threshold
        if not hit:
            outcomes['Miss'] += 1
        else:
            dr = damage_result(damage_bonus, target_armour)
            if dr == 'OOA':
                outcomes['Hit → OOA'] += 1
            elif dr == 'SUPP':
                outcomes['Hit → Suppressed'] += 1
            else:
                outcomes['Hit → No effect'] += 1

    return outcomes, n


def pct(x, n):
    return f"{x/n*100:.1f}%"


# ── Run scenarios ─────────────────────────────────────────────────────────────
# (label, attacker_training, weapon, band, target_figure_key)
SCENARIOS = [
    ("REG vs REG Grunt — Assault Rifle at B2",         'REG',   'Assault Rifle [S]',      'b2', 'REG FI Grunt'),
    ("VET vs REG Grunt — Blast Carbine at B1",         'VET',   'Blast Carbine [H]',      'b1', 'REG FI Grunt'),
    ("REG vs REG Grunt — Blast Carbine at B2",         'REG',   'Blast Carbine [H]',      'b2', 'REG FI Grunt'),
    ("VET vs VET LA Spec — Blast Rifle at B2",         'VET',   'Blast Rifle [H]',        'b2', 'VET LA Specialist'),
    ("VET vs VET LA Spec — Assault Rifle at B2",       'VET',   'Assault Rifle [S]',      'b2', 'VET LA Specialist'),
    ("HERO vs HERO PA Leader — Assault Rifle at B2",   'HERO',  'Assault Rifle [S]',      'b2', 'HERO PA Leader'),
    ("REG vs HERO PA Leader — Blast Carbine at B2",    'REG',   'Blast Carbine [H]',      'b2', 'HERO PA Leader'),
    ("ELITE vs HERO PA Leader — Blast Rifle at B2",    'ELITE', 'Blast Rifle [H]',        'b2', 'HERO PA Leader'),
    ("VET vs HERO PA Leader — HSL at B2",              'VET',   'HSL Support Laser [S]',  'b2', 'HERO PA Leader'),
    ("REG Grenade vs REG Grunt — B1",                  'REG',   'Thrown Grenade [B]',     'b1', 'REG FI Grunt'),
    ("REG Grenade vs HERO PA Leader — B1",             'REG',   'Thrown Grenade [B]',     'b1', 'HERO PA Leader'),
    ("REG Grenade vs HERO AD Leader — B1",             'REG',   'Thrown Grenade [B]',     'b1', 'HERO AD Leader'),
    ("HERO Sniper vs REG Grunt — B3",                  'HERO',  'Sniper Rifle [S]',       'b3', 'REG FI Grunt'),
    ("REG Sniper vs REG Grunt — B3",                   'REG',   'Sniper Rifle [S]',       'b3', 'REG FI Grunt'),
    ("HERO vs HERO AD — Laser Pistol at B1",           'HERO',  'Laser Pistol [S]',       'b1', 'HERO AD Leader'),
    ("VET vs HERO AD — Gauss Rifle at B2",             'VET',   'Gauss Rifle [H]',        'b2', 'HERO AD Leader'),
]

print("=" * 80)
print("BEAMSTRIKE SKIRMISH — COMBAT SIMULATION (main game weapon profiles)")
print(f"Simulations per scenario: {SIMULATIONS:,}")
print("=" * 80)

for label, att_train, weapon, band, target_key in SCENARIOS:
    t_train, t_armour, t_wounds = FIGURES[target_key]
    threshold = get_threshold(weapon, band)
    outcomes, n = per_shot_breakdown(att_train, weapon, band, t_armour)
    _, avg_shots = simulate_matchup(att_train, weapon, band, t_armour, t_wounds)

    miss_pct      = pct(outcomes['Miss'], n)
    ooa_pct       = pct(outcomes['Hit → OOA'], n)
    supp_pct      = pct(outcomes['Hit → Suppressed'], n)
    noeff_pct     = pct(outcomes['Hit → No effect'], n)

    print(f"\n{label}")
    print(f"  Attacker: {att_train} (+{TRAINING[att_train]}) | Weapon: {weapon} | Band {band.upper()} threshold: {threshold}")
    print(f"  Target:   {target_key} ({t_wounds}W, armour mod {ARMOUR_MOD[t_armour]:+d})")
    print(f"  Per shot: Miss {miss_pct}  OOA {ooa_pct}  Suppressed {supp_pct}  No effect {noeff_pct}")
    print(f"  Avg shots to OOA: {avg_shots:.1f}")
