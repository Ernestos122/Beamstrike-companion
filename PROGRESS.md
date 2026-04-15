# Beamstrike Companion — Progress Tracker

_Last updated: 2026-04-15 (Phases 4, 6, 7 complete)_

---

## Phase Status Overview

| Phase | Description | Status |
|---|---|---|
| 1 | Foundation (Vite + Tailwind + PWA + AppShell) | **COMPLETE** |
| 2 | Data Foundation (types, JSON files, barrel, validate) | **COMPLETE** |
| 3 | Charts Reference | **COMPLETE** |
| 4 | Rules Reference | **COMPLETE** |
| 5 | Army Builder | Not started |
| 6 | Ordered Rulebook | **COMPLETE** |
| 7 | Helpers | **COMPLETE** |
| 8 | Global Search, PWA polish, deploy | Not started |

---

## Phase 1 — Foundation ✅ COMPLETE

- Vite 8 + React 19 + TypeScript + Tailwind CSS 4 (CSS-first via `@tailwindcss/vite`)
- `vite-plugin-pwa` with Workbox service worker — build produces `dist/sw.js`
- `HashRouter` with 8 routes defined in `main.tsx`; `base: '/Beamstrike-companion/'` in vite config
- `AppShell` layout: `TopBar`, `SideNav` (desktop), `BottomNav` (mobile, fixed)
- All 5 feature pages stubbed; `npm run build` succeeds cleanly

---

## Phase 2 — Data Foundation ✅ COMPLETE

### TypeScript Types — COMPLETE (`src/types/`)

All 9 type files complete: `enums.ts`, `weapon.ts`, `squad.ts`, `army.ts`, `rules.ts`, `charts.ts`, `session.ts`, `search.ts`, `index.ts`

### JSON Data Files — COMPLETE (`src/data/`)

| File | Contents | Status |
|---|---|---|
| `weapons-infantry.json` | Table 1: pistols, rifles (~90 weapons) | ✅ Done |
| `weapons-support.json` | Table 2: squad support weapons | ✅ Done |
| `weapons-heavy.json` | Table 3: non-vehicle heavy weapons | ✅ Done |
| `weapons-vehicle.json` | Vehicle-mounted weapons (HE + AV columns) | ✅ Done |
| `weapons-alien.json` | 22 race-specific alien weapons with `racesAllowed[]` | ✅ Done |
| `armour-types.json` | Armour class definitions + movement rates | ✅ Done |
| `equipment.json` | Targeter, ADS, ECM Suite, Digimedic, Shields | ✅ Done |
| `races.json` | 13 race definitions with `alienWeaponIds[]` | ✅ Done |
| `skills.json` | 9 troop skills with costs | ✅ Done |
| `troop-training.json` | 5 training classes with stats | ✅ Done |
| `grenades.json` | 13 grenade and missile types | ✅ Done |
| `charts.json` | 30 charts (all categories) | ✅ Done |
| `rules-sections.json` | 9 top-level sections with subsections | ✅ Done |
| `rules-entries.json` | 25 key rule entries (markdown content) | ✅ Done |
| `version.json` | `{ version: "1.22", weaponChartVersion: "14-4" }` | ✅ Done |
| `src/data/index.ts` | Typed barrel export + `allWeapons` combined array | ✅ Done |

### Phase 2 Review Gate
- [ ] Cross-check all weapon data cell-by-cell against source PDFs before proceeding to Phase 5 (Army Builder)

---

## Phase 3 — Charts Reference ✅ COMPLETE

### Components

| File | Description | Status |
|---|---|---|
| `src/components/common/ChartView.tsx` | Generic chart renderer — headers, rows, section headers, footnotes | ✅ Done |
| `src/components/common/DamageTableView.tsx` | Infantry Damage Table renderer — colour-coded impact sections (STUN=slate, LOW=yellow, STANDARD=orange, HIGH=red, POWER=purple, TOTAL=dark red) | ✅ Done |
| `src/features/charts/ChartsPage.tsx` | Full implementation — collapsible category sidebar (desktop), select dropdown (mobile), deep-linkable via `/charts/:chartId` | ✅ Done |

### Charts Coverage (30 charts in `charts.json`)

| Category | Charts |
|---|---|
| Turn & Phase | Turn Sequence, Jetpack Table |
| Movement | Movement Table (16 types × 5 terrain), Actions Table |
| Infantry Combat | Hit Modifiers, Troop QR, Infantry Damage Table, Damage Modifiers, Grenades & Indirect Fire, Grenade Types |
| Fire Support | Off-Table Fire Support |
| Close Combat | CC Actions Table, H2H Throw Modifiers |
| Cover | Cover & Concealment |
| Morale / Suppression | Morale & Leadership Points, Shaken/Broken Rules, Squad Suppression |
| Vehicles | Vehicle Hit Sequence, Vehicle To-Hit Modifiers, Armour Penetration, Effect of Penetration, Hit Effect Explanations, Non-Penetrating Damage, Non-Penetrating Result Explanations |
| Shields | Shield Rules |
| Aliens | Alien Ranged Weapons, Alien Figure Movement |
| Reference | Trooper Hit Sequence, Template Sizes, Counter Types |

### Verification
- [x] `npm run build` passes cleanly (TS + Vite, 360 kB bundle)
- [ ] Navigate to `/charts` — category sidebar shows all charts
- [ ] Click "Infantry Damage Table" — `DamageTableView` renders with colour-coded impact sections
- [ ] Deep-link to `/charts/infantry-damage-table` works
- [ ] Mobile dropdown shows all charts grouped by category

---

## Phase 4 — Rules Reference ✅ COMPLETE

### Components

| File | Description | Status |
|---|---|---|
| `src/lib/resolveRef.ts` | `resolveRef(id)` — looks up any ID in rulesEntries then charts, returns `{ title, url, type }` | ✅ Done |
| `src/components/common/RuleContent.tsx` | react-markdown renderer with remark-gfm; intercepts `href="#id"` links and converts to React Router `<Link>` via `resolveRef` | ✅ Done |
| `src/components/common/SeeAlsoLinks.tsx` | "See also" footer — pill links, `§` prefix for rules, `▤` for charts | ✅ Done |
| `src/features/rules-reference/RulesReferencePage.tsx` | Full implementation — collapsible section sidebar (desktop), select dropdown (mobile), Fuse.js search, deep-linkable via `/rules/:sectionId/:entryId` | ✅ Done |

### Data Updates

| File | Change | Status |
|---|---|---|
| `src/data/rules-entries.json` | ~9 plain-text "See X" references converted to `[text](#id)` inline markdown links | ✅ Done |

### Inline Cross-Reference Links Added

| Entry | Link added |
|---|---|
| Training Levels | `See Heroes section` → `[Heroes section](#deployment-heroes)` |
| Sequence of Play | `See the Turn Sequence chart` → `[Turn Sequence chart](#turn-sequence)` |
| Movement Rates | `See Movement Table chart` → `[Movement Table chart](#movement-table)` |
| Jet Packs | `See the Jetpack Table` → `[Jetpack Table](#jetpack-table)` |
| Hit Modifiers | `see Hit Modifiers chart` → `[Hit Modifiers chart](#hit-modifiers)` |
| Squad Suppression | `see Troop QR table` → `[Troop QR table](#troop-qr)` |
| Squad Suppression | `see Squad Suppression chart` → `[Squad Suppression chart](#squad-suppression)` |
| Close Combat Overview | `See the CC Actions Table` → `[CC Actions Table](#cc-actions-table)` |
| H2H Combat | `See the H2H Throw Modifiers chart` → `[H2H Throw Modifiers chart](#h2h-throw-modifiers)` |
| Cover & Concealment | `See the Cover and Concealment Chart` → `[Cover and Concealment Chart](#cover-concealment)` |

### Verification
- [x] `npm run build` passes cleanly (TS + Vite, 579 kB bundle — react-markdown/remark-gfm add ~218 kB)
- [ ] Navigate to `/rules` → first rule entry loads; sidebar shows all sections
- [ ] Click a section in the sidebar → entries expand; clicking an entry loads it and updates URL
- [ ] View "Movement Rates" entry → "[Movement Table chart](#movement-table)" renders as a blue link
- [ ] Click that link → navigates to `/charts/movement-table`
- [ ] Click a rule-type inline link → navigates to `/rules/sectionId/entryId`
- [ ] "See also" footer shows pills; `§` for rule links, `▤` for chart links
- [ ] Type in search box → Fuse.js filters live; clicking a result loads it and clears search
- [ ] Mobile dropdown shows all sections grouped; selecting navigates correctly
- [ ] Direct URL `/rules/movement/movement-jetpacks` loads the Jet Packs entry on fresh load

---

## Phase 5 — Army Builder ❌ NOT STARTED

Target: Zustand store with `persist`, points calculator, validator, full CRUD UI.
Data ready: all weapon/equipment/race/training/skills JSON.
**Prerequisite:** Phase 2 review gate (cross-check weapon data).

---

## Phase 6 — Ordered Rulebook ✅ COMPLETE

| File | Description | Status |
|---|---|---|
| `src/features/rulebook/RulebookPage.tsx` | Continuous book-style view of all rule entries by section. Desktop: collapsible TOC sidebar. Mobile: section jump dropdown. Renders via `RuleContent` + `SeeAlsoLinks`. | ✅ Done |

### Verification
- [x] `npm run build` passes
- [ ] Navigate to `/rulebook` → all sections render in order with numbered headings
- [ ] TOC sidebar (desktop) → clicking a section scrolls to it
- [ ] Mobile dropdown "Jump to section…" → selecting a section scrolls there
- [ ] Inline cross-ref links in content navigate to rules/charts

---

## Phase 7 — Helpers ✅ COMPLETE

| File | Description | Status |
|---|---|---|
| `src/features/helpers/HelpersPage.tsx` | Tabbed helpers page with 4 tools | ✅ Done |

### Tools Implemented

| Tab | Description |
|---|---|
| **Dice Roller** | Single-tap D6/D10/D20/2D6/2D10 with large result display and 14-item history |
| **Session Tracker** | Enter army names + starting morale. Next Phase button advances through 10 phases (P1 Move/Fire/Move/CC/Morale → P2 Move/Fire/Move/CC/Morale) and increments turn. Per-army morale bar, ACTIVE/SHAKEN/BROKEN status pill, −1/−3/+1 morale buttons |
| **Status Counters** | Add named squads/figures. Tap status badge to cycle: OK → Suppressed → Stunned → GH. Reset all to OK. |
| **Weapon Lookup** | Fuse.js search across all weapon tables (infantry/support/heavy/vehicle/alien). Shows name, code, points, all 5 range bands, impact type. |

### Verification
- [x] `npm run build` passes (594 kB bundle)
- [ ] Dice tab: D6/D10/D20/2D6/2D10 buttons work; history updates
- [ ] Session tab: Setup → Start Battle; Next Phase cycles through 10 phases then increments turn; morale buttons update the bar and SHAKEN/BROKEN state
- [ ] Counters tab: Add squad; tap status cycles OK→Suppressed→Stunned→GH; × removes; Reset all works
- [ ] Weapons tab: Search "laser" → results table shows all laser weapons with range band to-hits

---

## Phase 8 — Global Search + PWA Polish + Deploy ❌ NOT STARTED

Target: Fuse.js global search across rules/weapons/charts, Lighthouse PWA ≥ 90, GitHub Pages deploy.

---

## Next Steps

1. **Phase 2 review gate** — open source PDFs side-by-side and cross-check weapon tables cell-by-cell
2. **Phase 5: Army Builder** — Zustand store with `persist`, points calculator, squad CRUD UI (requires Phase 2 review gate first)
3. **Phase 8: Global Search + PWA Polish + Deploy** — Fuse.js global search across rules/weapons/charts, Lighthouse PWA ≥ 90, GitHub Pages deploy
