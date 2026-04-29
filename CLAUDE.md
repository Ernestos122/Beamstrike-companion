# Beamstrike Companion — Claude Code Config

## Project Overview

A **Progressive Web App** (PWA) digital companion for the **Beamstrike v1.22** miniatures wargame. Built to be used on phones at the gaming table — installable, offline-capable, fast. Deployed to Vercel.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS 4 (CSS-first, `@tailwindcss/vite` plugin — no tailwind.config.js) |
| UI primitives | Radix UI (Dialog, Tabs, Select, Tooltip, ScrollArea, Separator) |
| State | Zustand 5 with `persist` middleware → `localStorage` |
| Routing | React Router v7 with `HashRouter` (hash routing for static hosting) |
| Search | Fuse.js 7 (client-side fuzzy search) |
| Markdown | react-markdown + remark-gfm |
| PWA | vite-plugin-pwa + Workbox |

## Build Commands

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build  ← Vercel uses this
npm run preview  # Preview built app
npm run lint     # ESLint
```

**Important**: `npm run build` runs `tsc -b` (strict project build), which is stricter than `tsc --noEmit`. Type casts that pass `--noEmit` may fail `-b`. Always check with `npm run build`, not just the dev server.

Unsafe type casts require the `as unknown as T` pattern:
```ts
const val = someVar as unknown as TargetType  // required when types don't overlap
```

## Path Aliases (vite.config.ts)

```ts
'@data'    → src/data/
'@lib'     → src/lib/
'@store'   → src/store/
'@types-bs' → src/types/
'@components' → src/components/
'@features'   → src/features/
```

## Data Architecture

All game content lives in `src/data/` as JSON, imported at build time. No async loading, no network requests for data. The barrel at `src/data/index.ts` exports typed arrays and a combined `allWeapons` array.

### Data Files

```
src/data/
  weapons-infantry.json    — Table 1: pistols, rifles (~90 weapons, 5 range bands)
  weapons-support.json     — Table 2: squad support weapons
  weapons-heavy.json       — Table 3: non-vehicle heavy weapons
  weapons-vehicle.json     — Vehicle-mounted weapons (HE + AV columns)
  weapons-alien.json       — Race-specific alien weapons with racesAllowed[]
  weapons-melee.json       — Melee weapons with h2hBonus and racesAllowed[]
  equipment.json           — Targeter, ADS, ECM Suite, Digimedic, Shields, etc.
  skills.json              — Army builder troop skills with pointsCost
  races.json               — 13 race definitions (see Race System below)
  troop-training.json      — 5 training classes with stats
  armour-types.json        — Armour class definitions + movement rates
  grenades.json            — Grenade and missile types
  charts.json              — All game charts (30+)
  rules-sections.json      — Chapter/section structure
  rules-entries.json       — Rule text (markdown) + cross-references (~55 entries)
  era1-content.json        — Era Guide: The First Contact era content
  aliens-content.json      — Aliens Guide: lore and race descriptions
  aliens-troops.json       — Alien troop definitions for army builder
  skirmish-rules.json      — Skirmish game rules as collapsible sections
  skirmish-skills.json     — 24 skirmish skills with xpCost and effect text
  skirmish-races.json      — Skirmish race options
  skirmish-scenarios.json  — Scenario cards for the Skirmish game
  version.json             — { version: "1.22", weaponChartVersion: "14-4" }
```

## Key State Stores

| Store | File | Key | Description |
|---|---|---|---|
| `useArmyStore` | `src/store/armyStore.ts` | `beamstrike-armies` | Army builder: armies, squads, points |
| `useWarbandStore` | `src/store/warbandStore.ts` | `beamstrike-warbands` | Skirmish: warbands, figures, XP, injuries |
| `useHouseRulesStore` | `src/store/houseRulesStore.ts` | `beamstrike-house-rules` | Shared house rules (d12Mode toggle) |

`useHouseRulesStore` is shared between the army builder play mode and the skirmish play mode — toggling d12Mode in either place affects both.

## Race System (races.json)

Each race has:
```ts
{
  id: string              // e.g. "HUMAN", "BUG", "FERRAPUR"
  weaponPool: "HUMAN_AND_ALIEN" | "ALIEN_ONLY" | "NONE" | "HUMAN_AND_ALL_ALIEN"
  forbidMeleeWeapons: boolean
  forbidEquipmentIds: string[]  // ["*"] = all equipment forbidden (BUG race)
  alienWeaponIds: string[]      // race-specific alien weapon IDs
}
```

`weaponPool` controls which weapons appear in the army builder squad form:
- `HUMAN_AND_ALIEN` — human weapons + this race's alien weapons (default)
- `ALIEN_ONLY` — only this race's alien weapons (no human weapons, no default melee)
- `NONE` — no weapons at all (Bug runner)
- `HUMAN_AND_ALL_ALIEN` — human weapons + full alien weapons list

`forbidEquipmentIds: ["*"]` (wildcard) hides all equipment items.

## Skirmish Module

Located in `src/features/skirmish/`. Independent from the main army builder.

### Key Types (`src/types/skirmish.ts`)

```ts
SkirmishTraining: 'CIV' | 'REG' | 'VET' | 'ELITE' | 'HERO'
SkirmishArmour:   'UA'  | 'FI'  | 'LA'  | 'PA'    | 'AD'
SkirmishFigure: {
  id, name, type, training, armour,
  weapons: string[],      // weapon IDs (up to 2 ranged + 1 melee)
  equipment: string[],    // equipment IDs (up to 3)
  skillIds: string[],     // up to SKILL_LIMIT[training] skills at build time
  xp, injuries, status, points
}
```

### Key Constants (`src/lib/warbandCalc.ts`)

```ts
SKILL_LIMIT: { CIV:0, REG:0, VET:1, ELITE:2, HERO:3 }
ARMOUR_SAVE: { UA:'No save', FI:'6+', LA:'5+', PA:'4+', AD:'3+' }
TRAINING_TO_HIT: { CIV:0, REG:1, VET:2, ELITE:3, HERO:4 }
TRAINING_MELEE:  { CIV:-1, REG:0, VET:1, ELITE:2, HERO:3 }
TRAINING_NERVE:  { CIV:2, REG:3, VET:4, ELITE:5, HERO:6 }
```

### Wound Tracking
- Standard figure: 2 wounds
- Figure with CONSTITUTION skill: 3 wounds
- Wound tracker is local component state (not persisted — resets each session)

### Skirmish Tabs
`SkirmishPage.tsx` has 5 tabs:
1. **Warband** — `WarbandBuilderTab` + `WarbandPlayMode` (toggled per warband)
2. **Rules** — `RulesTab` (collapsible sections from `skirmish-rules.json`)
3. **Scenarios** — `ScenariosTab`
4. **Campaign** — `CampaignTab`
5. **Quick Ref** — `QuickRefTab`

## Styling Conventions

- CSS variables for theming: `var(--background)`, `var(--foreground)`, `var(--card)`, `var(--border)`, `var(--accent)`, `var(--muted-foreground)`
- No tailwind.config.js — Tailwind 4 reads CSS directly
- Tailwind arbitrary variants for prose/markdown styling:
  `[&_table]:border-collapse [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)]`
- `cn()` from `@lib/utils` for conditional class merging (clsx + tailwind-merge)

## Important Gotchas

1. **`tsc -b` is stricter than `tsc --noEmit`** — always run `npm run build` to catch type errors that Vercel will catch.
2. **JSON imports need `as unknown as T`** — data files don't have matching TypeScript types; cast through `unknown`.
3. **Tailwind CSS 4 has no config file** — `@theme` variables are in `src/index.css`. Don't create a tailwind.config.js.
4. **HashRouter** — all routes start with `#/`. No server-side routing needed. Don't add vercel.json rewrites.
5. **`allWeapons`** in `src/data/index.ts` combines infantry + support + heavy + alien + melee arrays. Use this for cross-table weapon lookup.
6. **Equipment `isVehicleOnly` flag** — skirmish equipment picker filters out vehicle-only items.
7. **Skill XP costs vary** — see `skirmish-skills.json` for per-skill `xpCost`. Default fallback is 4 XP in `warbandStore.ts`.
8. **d12Mode** is a global house rule stored in `houseRulesStore` — don't add it to warband/army data.

## Deployment

- **Vercel** — auto-deploys from `main` branch; build command `npm run build`, output `dist`
- `base: '/'` in `vite.config.ts` (not `/Beamstrike-companion/` — that was the old GitHub Pages config)
- PWA service worker (`dist/sw.js`) precaches all static assets for offline use
