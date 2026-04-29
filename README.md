# Beamstrike Companion

A full-featured offline-capable **Progressive Web App** companion for the **Beamstrike v1.22** miniatures wargame. Designed for use on phones at the gaming table — installable to the home screen, works without internet.

## Features

| Feature | Description |
|---|---|
| **Army Builder** | Build and save armies in Squad/Troops/Training/Armour/Weapons/Equipment/Points format. Race-aware weapon pools, alien restrictions, live points calculation. |
| **Skirmish Module** | Full **Beamstrike Skirmish** companion — warband builder with figure cards, play mode with wound trackers, rules reference, scenarios, campaign tracker, quick reference |
| **Charts Reference** | All 30+ game charts (damage tables, movement, hit modifiers, etc.) instantly accessible with deep linking |
| **Rules Reference** | Searchable, browsable game rules organized by chapter with inline cross-references |
| **Ordered Rulebook** | Complete digital rulebook with collapsible TOC and anchor navigation |
| **Aliens Guide** | Race lore, special rules, and troop definitions for all 13 alien races |
| **Era Guide** | The First Contact era setting and scenario context |
| **Helpers** | Dice roller (D6/D10/D20/2D6/2D10), Game Session Tracker, Status Counters, Weapon Lookup |
| **Global Search** | Fuse.js fuzzy search across rules, charts, and weapons with ⌘K shortcut |

## Tech Stack

- **React 19 + TypeScript + Vite 8** — framework
- **Tailwind CSS 4** — CSS-first styling via `@tailwindcss/vite`
- **Radix UI** — accessible UI primitives
- **Zustand 5** with `persist` — state management; armies and warbands persist to localStorage
- **Fuse.js 7** — client-side fuzzy search
- **React Router v7** (HashRouter) — navigation
- **vite-plugin-pwa** — Workbox service worker; all data precached for offline use

## Local Development

```bash
npm install
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build (runs tsc -b + vite build)
npm run preview  # Preview production build
```

## Deployment

Deployed to **Vercel**. Auto-deploys from the `main` branch.

- Build command: `npm run build`
- Output directory: `dist`
- No special configuration needed — HashRouter handles all client-side routing

## Game Content

All game content is sourced from official Beamstrike v1.22 documents and encoded as static JSON in `src/data/`. No external API calls — everything works offline after the first load.

Weapon data version: **14-4**

## House Rules

The **1D12 Damage House Rule** (replace 1D6 damage rolls with 1D12) can be toggled from the army builder play mode or the skirmish play mode. The setting persists across sessions.
