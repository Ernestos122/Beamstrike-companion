# Last Claude Session — Rolling Summary

_Newest first. Each entry summarizes what changed and where things stand._

---

## 2026-04-29 — Documentation update + CLAUDE.md creation

**What was done:**
- Created `CLAUDE.md` — project-level config file for Claude Code; covers tech stack, build commands, path aliases, data architecture, race system, skirmish module details, styling conventions, and important gotchas
- Rewrote `README.md` — replaced the default Vite template README with proper project README
- Updated `PLAN.md` — added Skirmish module, race restriction system, melee weapons, all new data files (era1, aliens, skirmish-*), updated deployment info (Vercel, not GitHub Pages)
- Rewrote `PROGRESS.md` — added Phase 9 (post-launch features) covering race system, aliens guide, era guide, full skirmish module; updated data file list and race count (9→13); updated rules entries count (25→~55)
- Replaced `LastClaudeSession.md` with this clean rolling summary

**State of codebase:** All features complete and deployed. `npm run build` passes.

---

## 2026-04-28/29 — Skirmish warband builder overhaul + GFM tables fix + Vercel build fix

**What was done:**
- **Weapon limits split**: Warband builder now tracks ranged weapons (max 2) and melee weapon (max 1) separately; combined on save to `figure.weapons[]`
- **Equipment limit**: Max 3 equipment per figure; vehicle-only items excluded from skirmish picker
- **Skills system**: 24 skills in `skirmish-skills.json` with variable `xpCost` (2–5 XP). Skill limit per training: CIV/REG=0, VET=1, ELITE=2, HERO=3. `warbandStore` reads per-skill cost.
- **Play mode added**: `WarbandPlayMode.tsx` — per-figure cards with wound tracker, training stats, weapon band tables, equipment/skill chips; D12 house rule banner
- **WarbandBuilderTab**: Toggle button (Play/Square icon) per warband switches between builder and play mode
- **Vercel build fix**: Fixed TS2352 type cast errors in `WarbandPlayMode.tsx` — `as unknown as T` pattern required for `tsc -b`
- **GFM tables**: Fixed `RulesTab.tsx` table styling — added `border-collapse`, `border` on th/td, `px-2.5 py-1.5` padding

**Key files changed:** `WarbandBuilderTab.tsx`, `WarbandPlayMode.tsx` (new), `skirmish-skills.json`, `warbandStore.ts`, `warbandCalc.ts`, `skirmish.ts` (added `equipment` field), `RulesTab.tsx`

---

## 2026-04-26/27 — Race restriction system for army builder

**What was done:**
- Extended `races.json` (all 13 races) with `weaponPool`, `forbidMeleeWeapons`, `forbidEquipmentIds`
- `SquadFormModal.tsx` `WeaponPicker` enforces weapon pool per race
- Equipment filtered by `forbidEquipmentIds` with `"*"` wildcard support (BUG race)
- Race info panel shown in squad form for non-human races

**Key files changed:** `races.json`, `SquadFormModal.tsx`

---

## 2026-04-16 — Phase 8 complete, all original phases done

**What was done:**
- Global search (Fuse.js modal, ⌘K/Ctrl+K), PWA icons, Vercel deployment
- Migrated from GitHub Pages (`base: '/Beamstrike-companion/'`) to Vercel (`base: '/'`)
- All 8 original phases complete: Foundation, Data, Charts, Rules, Army Builder, Rulebook, Helpers, Search+PWA+Deploy

**State:** Deployed and working on Vercel. LocalStorage persistence for armies and game sessions.
