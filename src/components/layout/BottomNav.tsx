import { NavLink } from 'react-router-dom'
import { Shield, BookOpen, Table2, Dices, Zap, Swords } from 'lucide-react'
import { cn } from '@lib/utils'

const tabs = [
  { to: '/army',     icon: Shield,   label: 'Army'     },
  { to: '/rules',    icon: BookOpen, label: 'Rules'    },
  { to: '/charts',   icon: Table2,   label: 'Charts'   },
  { to: '/helpers',  icon: Dices,    label: 'Helpers'  },
  { to: '/aliens',   icon: Zap,      label: 'Aliens'   },
  { to: '/skirmish', icon: Swords,   label: 'Skirmish' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-[var(--background)] lg:hidden">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)]'
            )
          }
          aria-label={label}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
