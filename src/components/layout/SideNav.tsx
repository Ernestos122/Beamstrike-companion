import { NavLink } from 'react-router-dom'
import { Shield, BookOpen, Table2, BookMarked, Dices, Compass, Zap } from 'lucide-react'
import { cn } from '@lib/utils'

const navItems = [
  { to: '/army', icon: Shield, label: 'Army Builder' },
  { to: '/rules', icon: BookOpen, label: 'Rules Reference' },
  { to: '/charts', icon: Table2, label: 'Charts' },
  { to: '/rulebook', icon: BookMarked, label: 'Rulebook' },
  { to: '/helpers', icon: Dices, label: 'Helpers' },
  { to: '/era1', icon: Compass, label: 'ERA 1: Imperialist' },
  { to: '/aliens', icon: Zap, label: 'Alien Races' },
]

export function SideNav() {
  return (
    <aside className="hidden w-56 flex-col border-r bg-[var(--card)] lg:flex">
      <nav className="flex flex-col gap-1 p-2 pt-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
