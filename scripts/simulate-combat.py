#!/usr/bin/env python3
"""
Beamstrike Skirmish — combat simulation
2D6 to-hit, D6 damage with type+armour modifier
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

# ── Range band thresholds (2D6) ──────────────────────────────────────────────
BANDS = {
    'B1': 5,
    'B2': 7,
    'B3': 8,
    'B4': 10,
    'B5': 12,
}

# ── Damage types ─────────────────────────────────────────────────────────────
DAMAGE_BONUS = {
    'L': 0,   # Light
    'S': 1,   # Standard
    'H': 2,   # Heavy
    'B': 2,   # Blast
}

# ── Armour modifiers ─────────────────────────────────────────────────────────
ARMOUR_MOD = {
    'UA': 0,
    'FI': -1,
    'LA': -2,
    'PA': -3,
    'AD': -4,
}

# ── Cover modifier to threshold ───────────────────────────────────────────────
COVER_MOD = {
    'open':  0,
    'light': 1,   # adds 1 to threshold (harder to hit)
    'heavy': 2,
}

# ── Figures: (training, armour, wounds) ──────────────────────────────────────
# wounds: 1 = grunt, 2 = specialist/leader
FIGURES = {
    'CIV UA Grunt':      ('CIV',   'UA', 1),
    'REG FI Grunt':      ('REG',   'FI', 1),
    'VET FI Specialist': ('VET',   'FI', 2),
    'VET LA Specialist': ('VET',   'LA', 2),
    'ELITE PA Spec':     ('ELITE', 'PA', 2),
    'HERO PA Leader':    ('HERO',  'PA', 2),
    'HERO AD Leader':    ('HERO',  'AD', 2),
}

# ── Weapons: (damage_type, band) ─────────────────────────────────────────────
WEAPONS = {
    'Pistol [L]':           ('L', 'B2'),
    'Blast carbine [S]':    ('S', 'B3'),
    'Assault rifle [S]':    ('S', 'B4'),
    'Sniper rifle [S]':     ('S', 'B4'),
    'Support weapon [H]':   ('H', 'B3'),
    'Grenade [B]':          ('B', 'B1'),
}


def roll_2d6():
    return random.randint(1, 6) + random.randint(1, 6)


def roll_d6():
    return random.randint(1, 6)


def to_hit_prob(training_key, band_key, cover_key='open'):
    bonus = TRAINING[training_key]
    threshold = BANDS[band_key] + COVER_MOD[cover_key]
    hits = sum(1 for _ in range(SIMULATIONS) if roll_2d6() + bonus >= threshold)
    return hits / SIMULATIONS


def damage_result(damage_type, armour_key):
    """Returns 'OOA', 'SUPP', or 'NONE' for one damage roll."""
    net = roll_d6() + DAMAGE_BONUS[damage_type] + ARMOUR_MOD[armour_key]
    if net >= 4:
        return 'OOA'
    elif net >= 1:
        return 'SUPP'
    else:
        return 'NONE'


def simulate_matchup(attacker_training, weapon_name, band_key, target_armour, target_wounds, cover='open', n=SIMULATIONS):
    """
    Simulate n full attack sequences (to-hit + damage).
    Returns dict of per-shot outcomes and expected shots-to-OOA.
    """
    dtype, _ = WEAPONS[weapon_name]
    threshold = BANDS[band_key] + COVER_MOD[cover]
    bonus = TRAINING[attacker_training]

    results = defaultdict(int)
    shots_to_ooa = []

    for _ in range(n):
        shots = 0
        wounds = 0
        suppressed = False
        done = False

        for _ in range(50):  # max 50 shots before giving up
            shots += 1
            hit = (roll_2d6() + bonus) >= threshold
            if not hit:
                results['miss'] += 1
                continue

            dr = damage_result(dtype, target_armour)

            if dr == 'NONE':
                results['no_effect'] += 1
                continue

            if target_wounds == 1:
                # Grunts: any result = OOA (suppressed also counts)
                results['ooa'] += 1
                shots_to_ooa.append(shots)
                done = True
                break
            else:
                # 2-wound figures with wound stacking:
                # OOA result = immediate OOA
                # SUPP on already-Suppressed = wound counter; 2 wounds = OOA
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
            shots_to_ooa.append(50)  # didn't kill in 50 shots

    avg_shots = sum(shots_to_ooa) / len(shots_to_ooa)
    return results, avg_shots


def pct(x, n):
    return f"{x/n*100:.1f}%"


# ── Per-shot breakdown ───────────────────────────────────────────────────────
def per_shot_breakdown(attacker_training, weapon_name, band_key, target_armour, cover='open'):
    dtype, _ = WEAPONS[weapon_name]
    threshold = BANDS[band_key] + COVER_MOD[cover]
    bonus = TRAINING[attacker_training]

    outcomes = defaultdict(int)
    n = SIMULATIONS

    for _ in range(n):
        hit = (roll_2d6() + bonus) >= threshold
        if not hit:
            outcomes['Miss'] += 1
        else:
            dr = damage_result(dtype, target_armour)
            if dr == 'OOA':
                outcomes['Hit → OOA'] += 1
            elif dr == 'SUPP':
                outcomes['Hit → Suppressed'] += 1
            else:
                outcomes['Hit → No effect'] += 1

    return outcomes, n


# ── Run scenarios ─────────────────────────────────────────────────────────────
SCENARIOS = [
    # (label, attacker_training, weapon, band, target_figure_key, cover)
    ("REG Grunt vs REG Grunt (open, B3)",          'REG',   'Blast carbine [S]',   'B3', 'REG FI Grunt',      'open'),
    ("REG Grunt vs REG Grunt (light cover, B3)",   'REG',   'Blast carbine [S]',   'B3', 'REG FI Grunt',      'light'),
    ("VET Spec vs REG Grunt (open, B3)",           'VET',   'Assault rifle [S]',   'B3', 'REG FI Grunt',      'open'),
    ("VET Spec vs VET LA Spec (open, B3)",         'VET',   'Assault rifle [S]',   'B3', 'VET LA Specialist', 'open'),
    ("HERO Leader vs VET LA Spec (open, B3)",      'HERO',  'Assault rifle [S]',   'B3', 'VET LA Specialist', 'open'),
    ("REG Grunt vs HERO PA Leader (open, B3)",     'REG',   'Blast carbine [S]',   'B3', 'HERO PA Leader',    'open'),
    ("REG Grunt vs HERO PA Leader (heavy, B3)",    'REG',   'Blast carbine [S]',   'B3', 'HERO PA Leader',    'heavy'),
    ("ELITE vs HERO PA Leader (open, B3)",         'ELITE', 'Assault rifle [S]',   'B3', 'HERO PA Leader',    'open'),
    ("VET Support weapon vs REG Grunt (B3)",       'VET',   'Support weapon [H]',  'B3', 'REG FI Grunt',      'open'),
    ("VET Support weapon vs HERO PA Leader (B3)",  'VET',   'Support weapon [H]',  'B3', 'HERO PA Leader',    'open'),
    ("REG Grenade vs REG Grunt (B1)",              'REG',   'Grenade [B]',         'B1', 'REG FI Grunt',      'open'),
    ("REG Grenade vs HERO PA Leader (B1)",         'REG',   'Grenade [B]',         'B1', 'HERO PA Leader',    'open'),
    ("CIV pistol vs REG Grunt (B2)",               'CIV',   'Pistol [L]',          'B2', 'REG FI Grunt',      'open'),
    ("HERO pistol vs HERO AD Leader (B2)",         'HERO',  'Pistol [L]',          'B2', 'HERO AD Leader',    'open'),
    ("VET Support weapon vs HERO AD Leader (B3)",  'VET',   'Support weapon [H]',  'B3', 'HERO AD Leader',    'open'),
    ("Grenade vs HERO AD Leader (B1)",             'REG',   'Grenade [B]',         'B1', 'HERO AD Leader',    'open'),
    ("HERO Sniper vs REG Grunt (extreme B4)",      'HERO',  'Sniper rifle [S]',    'B4', 'REG FI Grunt',      'open'),
    ("REG Sniper vs REG Grunt (extreme B4)",       'REG',   'Sniper rifle [S]',    'B4', 'REG FI Grunt',      'open'),
]

print("=" * 80)
print("BEAMSTRIKE SKIRMISH — COMBAT SIMULATION")
print(f"Simulations per scenario: {SIMULATIONS:,}")
print("=" * 80)

for label, att_train, weapon, band, target_key, cover in SCENARIOS:
    att_train_val = att_train
    t_train, t_armour, t_wounds = FIGURES[target_key]
    outcomes, n = per_shot_breakdown(att_train_val, weapon, band, t_armour, cover)
    _, avg_shots = simulate_matchup(att_train_val, weapon, band, t_armour, t_wounds, cover)

    miss_pct         = pct(outcomes['Miss'], n)
    ooa_pct          = pct(outcomes['Hit → OOA'], n)
    supp_pct         = pct(outcomes['Hit → Suppressed'], n)
    no_effect_pct    = pct(outcomes['Hit → No effect'], n)

    print(f"\n{label}")
    print(f"  Attacker: {att_train_val} | Weapon: {weapon} | Cover: {cover}")
    print(f"  Target:   {target_key} ({t_wounds}W)")
    print(f"  Per shot: Miss {miss_pct}  OOA {ooa_pct}  Suppressed {supp_pct}  No effect {no_effect_pct}")
    print(f"  Avg shots to OOA target: {avg_shots:.1f}")
