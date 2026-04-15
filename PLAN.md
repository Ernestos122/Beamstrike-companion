# Beamstrike Companion — Project Plan

## What This Is

A full-featured **offline-capable Progressive Web App** (PWA) for the **Beamstrike v1.22** miniatures wargame. Usable on phones at the gaming table, installable to the home screen, works without internet.

## Features

| Feature | Description |
|---|---|
| **Army Builder** | Build/save armies in Squad\|Troops\|Training\|Armour\|Weapons\|Equip\|Points format matching the official Beamstrike Army Sheet |
| **Rules Reference** | Searchable, browsable game rules organized by chapter |
| **Charts Reference** | All 33 game charts (damage tables, movement, hit modifiers, etc.) instantly accessible |
| **Ordered Rulebook** | Complete digital rulebook with collapsible TOC and anchor navigation |
| **Helpers** | Dice roller (D6/D10/D20), Game Session Tracker (digital turn monitor), Status Counter tracker, Weapon Lookup |

## Source Documents (in repo root)

| File | Contents |
|---|---|
| `01____Beamstrike___Rules___1.22.pdf` | Main rulebook — full rules text, per-model points costs |
| `02____Beamstrike___QR_Sheet.pdf` | QR sheet — all core charts and tables |
| `07____Beamstrike___Counters_And_Templates.pdf` | Counter types and template sizes |
| `08____Beamstrike___Turn_Monitor_Sheet.pdf` | Turn sequence monitor sheet |
| `09____Beamstrike___Army_Record_Sheet.pdf` | Official army record sheet format |
| `Beamstrike Weapon Chart Pack - Version 14-4.pdf` | Complete weapon charts pack |

## Tech Stack

- **React 19 + TypeScript + Vite 8** — framework
- **Tailwind CSS 4** — styling (CSS-first, `@tailwindcss/vite` plugin)
- **Radix UI primitives** — accessible UI components
- **Zustand 5** with `persist` middleware — state management; army lists and game sessions persist to `localStorage`
- **Fuse.js 7** — client-side fuzzy search across rules, weapons, charts
- **React Router v7** (HashRouter) — navigation; hash routing for GitHub Pages compatibility
- **vite-plugin-pwa** — Workbox service worker; all JSON data files precached for offline use

## Key Design Decisions

### Squad-Based Army Building
Beamstrike is **squad-based**, not unit-role-based. The army sheet tracks:
`Squad | Troops | Training | Armour | Weapons | Equip | Points`

Each squad has: race, training class (Civilian/Regular/Veteran/Elite/Hero), armour type (UA/FI/LA/PA/DA), model count, weapons, and optional equipment. Points = (base per-model cost × count) + weapon costs + equipment costs.

### Morale Value Is Separate From Points
- Each trooper = 1 morale point
- Each armoured vehicle or hero = 3 morale points
- Nominated objectives = 5–20 points (agreed pre-battle)
- At ½ morale: army is SHAKEN (can't advance, must test each turn)
- SHAKEN test: 2d6 ≥ 7 → BROKEN (must retreat)

### Armour Types → Damage Table Columns
The Infantry Damage Table has 7 armour columns: **UA, FI, LA, PA, PA Shielded, DA, DA Shielded**. Impact types (Stun/Low/Standard/High/Power/Total 1/2/3) determine the row section. Roll 1d6, cross-reference with armour column for result (NE/Stun/GH/Kill).

### Shields
- **ES (Energy Shield)**: protects vs lasers/beams. -3 vs infantry weapons, -1 vs vehicle guns.
- **PS (Projectile Shield)**: protects vs bolters/automatics/missiles. -3 vs infantry, -1 vs vehicle guns.
- **MULTI**: as either ES or PS. Vehicles only.
- Shield goes DOWN on a 6 (NE hit) or 3–6 (GH hit).

### To-Hit: 2d6 With Range Bands
Weapons have 5 range bands (0–4", 5–20", 21–40", 41–80", 81"+) with different to-hit numbers per band. Roll 2d6 and meet or beat the threshold. Natural 12 = critical hit (+2 to damage roll).

### Vehicle Combat
Separate mechanics: armour penetration chart (weapon power vs vehicle class 0–6), then effect chart (D10 vs vehicle type). Non-penetrating hits use a D20 table with directional modifiers.

### Races / Factions
Human, SPUG, GREY, BUG (Runner/Hunter/Terror/Flyer/Cerebral/Queen/Colossus), Ferrapur, Centaling, Hibevor, Growwlan, Replican, Kra'vak, Orcoid, Thuntra, Warbird. Some alien weapons are race-restricted.

## Data Architecture

All game content is in `src/data/` as TypeScript-validated JSON, imported at build time (no async loading, no network requests for data).

```
src/data/
  weapons-infantry.json    — Table 1: pistols, rifles (with all 5 range bands + to-hit)
  weapons-support.json     — Table 2: squad support weapons
  weapons-heavy.json       — Table 3: non-vehicle heavy weapons
  weapons-vehicle.json     — Vehicle mounted weapons (HE + AV columns)
  weapons-alien.json       — Race-specific alien weapons
  equipment.json           — Targeter, ADS, ECM Suite, Digimedic, Shields
  skills.json              — Sniper, Grenadier, Scout, Swordsman, Constitution, Doper, Fanatic
  races.json               — Race definitions + movement classes
  troop-training.json      — Training class stats (hit mod, troop roll, eligible targets, H2H mod)
  armour-types.json        — Armour class definitions + movement rates
  charts.json              — All 33 charts as structured JSON
  rules-sections.json      — Chapter/section structure
  rules-entries.json       — Rule text (markdown) + cross-references
  grenades.json            — All grenade types + missiles
  version.json             — { version: "1.22", weaponChartVersion: "14-4" }
```

## Implementation Phases

Each phase ends with a **source-material review** before proceeding.

| Phase | Work | Review |
|---|---|---|
| 1 | Foundation (Vite + Tailwind + PWA + AppShell) | None — no content yet |
| 2 | Data Foundation: types, JSON files, barrel, validate script | Cross-check all weapon data cell-by-cell against source docs |
| 3 | Charts Reference: all 33 charts, DamageTableView | Open QR Sheet side-by-side, verify every cell |
| 4 | Rules Reference: ChapterNav, RuleEntry, Fuse search | Verify turn sequence order, suppression rules, morale rules |
| 5 | Army Builder: store, calculator, validator, full UI | Build test army on paper, verify app totals match |
| 6 | Ordered Rulebook: TOC, chapter render, anchors | Verify chapter order against rulebook page refs |
| 7 | Helpers: Dice, Session Tracker, Status Counters, Weapon Lookup | Verify turn monitor columns match Turn Monitor Sheet |
| 8 | Global Search, PWA polish, deploy | Lighthouse PWA 90+, offline test |

## Charts Reference (33 charts)

**Turn & Phase**: Turn Sequence, Jetpack Table
**Movement**: Movement Table (16 types × 5 terrain)
**Infantry Combat**: Hit Modifiers, Troop QR, Infantry Weapons (Table 1), Support Weapons (Table 2), Heavy Weapons (Table 3), Infantry Damage Table, Damage Modifiers, Grenades & Indirect Fire, Grenade Types
**Fire Support**: Off-Table Fire Support
**Close Combat**: CC Actions Table, H2H Throw Modifiers
**Cover**: Cover & Concealment Chart
**Morale/Suppression**: Morale & Leadership Points, Shaken/Broken Rules, Squad Suppression
**Vehicles**: Vehicle Hit Sequence (flowchart), Vehicle Weapons, Vehicle To-Hit Modifiers, Armour Penetration, Effect of Penetration, Hit Effect Explanations, Non-Penetrating Damage, Non-Penetrating Result Explanations
**Shields**: Shield Rules
**Aliens**: Alien Ranged Weapons, Alien Figure Movement
**Reference**: Trooper Hit Sequence (flowchart), Template Sizes, Counter Types

## Deployment

GitHub Pages via GitHub Actions. Uses `HashRouter` and `base: '/Beamstrike-companion/'` in vite.config.ts.

Service worker precaches all `*.{js,css,html,ico,png,svg,json}` — the app works fully offline after first load, including all charts, army builder, dice roller, and rules lookup.

## Verification Checklist

- `npm run dev` — starts without errors
- `npm run build` — TypeScript + Vite build succeeds, `dist/sw.js` exists
- Build Infantry Damage Table army in UI, verify points match manual calculation
- Morale: 10 regulars + 1 hero + 1 Class 3 tank = 10 + 3 + 3 = 16, half = 8
- Session Tracker: enter morale 50/40, tick off turn phases, drop to 24 → SHAKEN alert
- DevTools → Network → Offline → all features still work
- Lighthouse PWA audit → 90+
