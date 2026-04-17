import { Link } from 'react-router-dom'
import {
  Shield, BookOpen, Table2, Dices, Compass, Zap,
  Target, Users, Crosshair, Heart,
} from 'lucide-react'
import { cn } from '@lib/utils'

// ── How it works steps ────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Build Your Army',
    body: 'Choose a faction and spend your points budget on squads of troopers. Each figure has a training class — Regular, Veteran, Elite, or Hero — that determines their base hit chance and how many skills they can carry.',
  },
  {
    step: '2',
    title: 'Take Turns',
    body: 'Each turn alternates between sides in a structured sequence: Initiative → Move → Fire → Close Combat → Morale. Both players act within the same turn, so attention never fully leaves the table.',
  },
  {
    step: '3',
    title: 'Roll to Hit',
    body: 'Firing uses 2d6 plus the firer\'s training bonus. Each weapon has hit numbers for three range bands (point-blank, medium, long). Beat the target number and you score a hit — miss and the shot goes wide.',
  },
  {
    step: '4',
    title: 'Check Damage',
    body: 'A hit is resolved on the Infantry Damage Table using the weapon\'s impact type against the target\'s armour. Results range from No Effect through Stun and Glancing Hit up to Kill — armour really matters here.',
  },
  {
    step: '5',
    title: 'Test Morale',
    body: 'Every army has a Morale Value. When casualties reach half that value the army is Broken and must take morale tests. Leaders rally troops within 8″, so protecting your commanders is as important as killing theirs.',
  },
  {
    step: '6',
    title: 'Claim Victory',
    body: 'Each scenario sets its own win conditions — hold objectives, eliminate the enemy commander, escort a VIP off the table. The rules are simple enough to learn in an evening but deep enough to keep you coming back for years.',
  },
]

// ── Quick-nav cards ───────────────────────────────────────────────────────────
const QUICK_NAV = [
  {
    to: '/army',
    icon: Shield,
    label: 'Army Builder',
    desc: 'Build and save army lists',
    colour: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    to: '/rules',
    icon: BookOpen,
    label: 'Rules Reference',
    desc: 'Look up any rule fast',
    colour: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    to: '/charts',
    icon: Table2,
    label: 'Charts',
    desc: 'Hit tables, damage, morale',
    colour: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    to: '/helpers',
    icon: Dices,
    label: 'Helpers',
    desc: 'Dice roller & calculators',
    colour: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    to: '/era1',
    icon: Compass,
    label: 'ERA 1: Imperialist',
    desc: 'Factions, heroes & army lists',
    colour: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    to: '/aliens',
    icon: Zap,
    label: 'Alien Races',
    desc: 'All 10 alien species',
    colour: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-12 pb-24">

      {/* Hero */}
      <section className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--primary)] blur-2xl opacity-20 scale-150" />
            <Crosshair size={52} className="relative text-[var(--primary)]" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, Commander.
          </h1>
          <p className="text-[var(--muted-foreground)] text-base leading-relaxed max-w-md mx-auto">
            Beamstrike has been waiting patiently on the shelf — the miniatures
            already primed, the dice still warm from a game you never quite
            finished. Pull up a chair. The galaxy won't save itself.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Heart size={12} className="text-rose-400 fill-rose-400" />
          <span>A companion for Beamstrike v1.22</span>
          <Heart size={12} className="text-rose-400 fill-rose-400" />
        </div>
      </section>

      {/* Quick-nav */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Everything you need
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_NAV.map(({ to, icon: Icon, label, desc, colour, bg }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:bg-[var(--accent)]"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
                <Icon size={18} className={colour} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{label}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Lore blurb */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            The Setting
          </h2>
        </div>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          It is the far future. Humanity has spread across the stars, fractured
          into Empires, Corporations, Rebel factions, and independent
          Mercenary coalitions. Alien races — Spugs, Greys, Ferrapurs,
          Kravaks and more — trade, scheme, or wage war alongside whoever
          offers the best terms.
        </p>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          In ERA 1 — the Imperialist Age — blast weapons have replaced the
          old kinetic rifles, power-armoured elites storm fortified positions,
          and Crimson Rebel fanatics charge headlong into Imperial defensive lines.
          Every game tells a different story. This companion helps you tell yours.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            How the game works
          </h2>
        </div>

        <div className="space-y-3">
          {HOW_IT_WORKS.map(({ step, title, body }) => (
            <div
              key={step}
              className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--primary)]">{step}</span>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          The rules fit on a single reference sheet, but the tactics take a
          lifetime to master. Start with a small patrol — 300 points, two
          squads each — and let the dice tell the story.
        </p>
        <Link
          to="/army"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Shield size={16} />
          Start building your army
        </Link>
      </section>

    </div>
  )
}
