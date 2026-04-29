# Beamstrike Companion — Progress Tracker

_Last updated: 2026-04-29 (All phases complete + post-launch features)_

---

## Phase Status Overview

| Phase | Description | Status |
|---|---|---|
| 1 | Foundation (Vite + Tailwind + PWA + AppShell) | **COMPLETE** |
| 2 | Data Foundation (types, JSON files, barrel, validate) | **COMPLETE** |
| 3 | Charts Reference | **COMPLETE** |
| 4 | Rules Reference | **COMPLETE** |
| 5 | Army Builder | **COMPLETE** |
| 6 | Ordered Rulebook | **COMPLETE** |
| 7 | Helpers | **COMPLETE** |
| 8 | Global Search, PWA polish, deploy | **COMPLETE** |
| 9 | Post-Launch: Race system, Alien/Era guides, Skirmish module | **COMPLETE** |

---

## Phase 1 — Foundation ✅ COMPLETE

- Vite 8 + React 19 + TypeScript + Tailwind CSS 4 (CSS-first via `@tailwindcss/vite`)
- `vite-plugin-pwa` with Workbox service worker — build produces `dist/sw.js`
- `HashRouter` with routes defined in `main.tsx`; `base: '/'` in vite config (Vercel)
- `AppShell` layout: `TopBar`, `SideNav` (desktop), `BottomNav` (mobile, fixed)
- Dark mode toggle in TopBar with `useTheme` hook + localStorage persistence

---

## Phase 2 — Data Foundation ✅ COMPLETE

### TypeScript Types (`src/types/`)

All type files complete: `enums.ts`, `weapon.ts`, `squad.ts`, `army.ts`, `rules.ts`, `charts.ts`, `session.ts`, `search.ts`, `skirmish.ts`, `index.ts`

### JSON Data Files (`src/data/`)

| File | Contents | Status |
|---|---|---|
| `weapons-infantry.json` | Table 1: pistols, rifles (~90 weapons, 5 range bands) | ✅ Done |
| `weapons-support.json` | Table 2: squad support weapons | ✅ Done |
| `weapons-heavy.json` | Table 3: non-vehicle heavy weapons | ✅ Done |
| `weapons-vehicle.json` | Vehicle-mounted weapons (HE + AV columns) | ✅ Done |
| `weapons-alien.json` | 22 race-specific alien weapons with `racesAllowed[]` | ✅ Done |
| `weapons-melee.json` | Melee weapons with `h2hBonus` and `racesAllowed[]` | ✅ Done |
| `armour-types.json` | Armour class definitions + movement rates | ✅ Done |
| `equipment.json` | Targeter, ADS, ECM Suite, Digimedic, Shields, etc. | ✅ Done |
| `races.json` | 13 race definitions with weapon pool + restriction fields | ✅ Done |
| `skills.json` | Army builder troop skills with `pointsCost` | ✅ Done |
| `troop-training.json` | 5 training classes with stats | ✅ Done |
| `grenades.json` | 13 grenade and missile types | ✅ Done |
| `charts.json` | 30+ charts (all categories) | ✅ Done |
| `rules-sections.json` | 9 top-level sections with subsections | ✅ Done |
| `rules-entries.json` | ~55 key rule entries (markdown content) | ✅ Done |
| `era1-content.json` | Era Guide: The First Contact era content | ✅ Done |
| `aliens-content.json` | Aliens Guide: race lore and descriptions | ✅ Done |
| `aliens-troops.json` | Alien troop definitions for army builder | ✅ Done |
| `skirmish-rules.json` | Beamstrike Skirmish rules as collapsible sections | ✅ Done |
| `skirmish-skills.json` | 24 skirmish skills with `xpCost` and `effect` text | ✅ Done |
| `skirmish-races.json` | Skirmish race options | ✅ Done |
| `skirmish-scenarios.json` | Scenario cards for the Skirmish game | ✅ Done |
| `version.json` | `{ version: "1.22", weaponChartVersion: "14-4" }` | ✅ Done |
| `src/data/index.ts` | Typed barrel export + `allWeapons` combined array | ✅ Done |

---

## Phase 3 — Charts Reference ✅ COMPLETE

- `ChartView.tsx` — generic chart renderer (headers, rows, section headers, footnotes)
- `DamageTableView.tsx` — Infantry Damage Table with colour-coded impact sections
- `ChartsPage.tsx` — collapsible category sidebar (desktop), select dropdown (mobile), deep-linkable via `/charts/:chartId`

---

## Phase 4 — Rules Reference ✅ COMPLETE

- `RulesReferencePage.tsx` — collapsible section sidebar, Fuse.js search, deep-linkable via `/rules/:sectionId/:entryId`
- `RuleContent.tsx` — react-markdown with remark-gfm; intercepts `#id` links → React Router `<Link>` via `resolveRef`
- `SeeAlsoLinks.tsx` — pill links (§ for rules, ▤ for charts)
- ~9 inline cross-reference links added to `rules-entries.json`

---

## Phase 5 — Army Builder ✅ COMPLETE

### Files

| File | Description |
|---|---|
| `src/lib/pointsCalc.ts` | `calcSquadPoints`, `calcSquadMorale`, `recalcArmyTotals` |
| `src/store/armyStore.ts` | Zustand store with persist (key `beamstrike-armies`) |
| `src/features/army-builder/ArmyListView.tsx` | Army list with inline create form |
| `src/features/army-builder/ArmyEditorView.tsx` | Sticky header, points bar, morale summary, squad list |
| `src/features/army-builder/SquadFormModal.tsx` | Full squad editor with race-aware weapon pool |
| `src/features/army-builder/PlayModeView.tsx` | Play mode with wound trackers and D12 house rule banner |

### Race System (added post-launch)

- `races.json` extended with `weaponPool`, `forbidMeleeWeapons`, `forbidEquipmentIds` for all 13 races
- `SquadFormModal.tsx` `WeaponPicker` enforces pool (`HUMAN_AND_ALIEN` / `ALIEN_ONLY` / `NONE` / `HUMAN_AND_ALL_ALIEN`)
- Equipment filtered by `forbidEquipmentIds` (supports `"*"` wildcard for BUG race)
- Race info panel shown in squad form for non-human races listing special rules

---

## Phase 6 — Ordered Rulebook ✅ COMPLETE

- `RulebookPage.tsx` — continuous book-style view of all rules by section, collapsible TOC sidebar (desktop), section jump dropdown (mobile)

---

## Phase 7 — Helpers ✅ COMPLETE

- `HelpersPage.tsx` — 4 tabs:
  - **Dice Roller**: D6/D10/D20/2D6/2D10 with 14-item history
  - **Session Tracker**: army names + morale, 10-phase turn sequence, SHAKEN/BROKEN detection
  - **Status Counters**: named squads/figures cycling OK→Suppressed→Stunned→GH
  - **Weapon Lookup**: Fuse.js search across all weapon tables

---

## Phase 8 — Global Search + PWA Polish + Deploy ✅ COMPLETE

- `GlobalSearch.tsx` — Fuse.js modal across rules, charts, weapons. Groups by type. ⌘K/Ctrl+K shortcut. Keyboard nav ↑↓ + ↵
- `vite.config.ts` — `base: '/'` for Vercel; PWA icons generated
- Deployed to Vercel with auto-deploy from `main`

---

## Phase 9 — Post-Launch Features ✅ COMPLETE

### Aliens Guide

- `AliensGuidePage.tsx` — collapsible race sections with lore, special rules, and troop stats
- `aliens-content.json` + `aliens-troops.json` — source data
- Race-aware army builder: caste selector, natural attacks, alien troop costs

### Era Guide

- `EraGuidePage.tsx` — The First Contact era content with scenario context
- `era1-content.json` — source data

### Skirmish Module (`src/features/skirmish/`)

**5-tab `SkirmishPage.tsx`:**

| Tab | Component | Status |
|---|---|---|
| Warband | `WarbandBuilderTab.tsx` + `WarbandPlayMode.tsx` | ✅ Done |
| Rules | `RulesTab.tsx` | ✅ Done |
| Scenarios | `ScenariosTab.tsx` | ✅ Done |
| Campaign | `CampaignTab.tsx` | ✅ Done |
| Quick Ref | `QuickRefTab.tsx` | ✅ Done |

**Warband Builder (`WarbandBuilderTab.tsx`):**
- Figure form with separate ranged (max 2) + melee (max 1) weapon pickers
- Equipment picker (max 3, vehicle-only items excluded)
- Skills picker (max = `SKILL_LIMIT[training]`: CIV/REG=0, VET=1, ELITE=2, HERO=3)
- Live points calculation including equipment costs
- "Weapons" / "Equip & Skills" tab layout in figure form

**Play Mode (`WarbandPlayMode.tsx`):**
- Per-figure card with training badge, armour save, To-Hit/Melee/Nerve stats
- Ranged weapon band thresholds (B1–B5)
- Melee weapon H2H bonus
- Equipment chips (blue) and skill chips (amber, hover tooltip shows effect)
- Wound tracker (2 wounds; 3 if CONSTITUTION skill present); shows "DOWN" when all filled
- D12 house rule banner (shared `useHouseRulesStore`)

**Skirmish Skills (`skirmish-skills.json`):**
24 skills including: DEAD_EYE, FAST_MOVER, TOUGH, CONSTITUTION, IRON_WILL, CRACK_SHOT, BRAWLER, NERVES_OF_STEEL, AMBUSHER, MEDIC_FIELD, SNIPER, SAPPER, GRENADIER, MEDIC, FANATIC, GUNNER, SCOUT, SWORDSMAN, LEADERSHIP, INTUITIVE (each with `xpCost` and `effect` text)

**Types (`src/types/skirmish.ts`):**
- `SkirmishFigure` includes `equipment: string[]` field
- Fully typed: `SkirmishWarband`, `SkirmishFigure`, `SkirmishTraining`, `SkirmishArmour`, etc.

**Store (`src/store/warbandStore.ts`):**
- `addSkill` reads per-skill `xpCost` from `skirmish-skills.json` (variable costs)
- `materializeFigure` includes equipment IDs in points calculation

**Calc (`src/lib/warbandCalc.ts`):**
- Full Infantry Damage Table (STUN/LOW/STANDARD/HIGH/POWER/TOTAL_1/2/3)
- `SKILL_LIMIT`, `ARMOUR_SAVE`, `TRAINING_TO_HIT`, `TRAINING_MELEE`, `TRAINING_NERVE` exported constants
- `calcFigurePoints(training, armour, weaponIds, equipmentIds?)` includes equipment cost

### Build Fixes

- `tsc -b` (production build) is stricter than `tsc --noEmit` — unsafe type casts require `as unknown as T` intermediate
- Fixed `WarbandPlayMode.tsx` TS2352 errors (weapon `toHit` and `h2hBonus` casts)
- Fixed GFM table styling in `RulesTab.tsx` (added `border-collapse`, border/padding on th/td)

---

## Remaining Optional Work

1. **Phase 2 review gate** — cross-check weapon data cell-by-cell vs source PDFs (recommended before competitive play)
2. **Skirmish campaign tracking** — persistent campaign log, injury table, advancement between games
3. **Race restrictions in skirmish warband builder** — currently uses full weapon/equipment pool regardless of race
