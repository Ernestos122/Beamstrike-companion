import { Crosshair, Search, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@lib/utils'

interface TopBarProps {
  onSearchOpen?: () => void
}

export function TopBar({ onSearchOpen }: TopBarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-[var(--card)] px-4">
      <div className="flex items-center gap-2">
        <Crosshair size={20} className="text-[var(--primary)]" />
        <span className="font-bold tracking-tight">Beamstrike</span>
        <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">v1.22</span>
      </div>

      <div className="flex-1" />

      {!isOnline && (
        <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <WifiOff size={12} />
          <span>Offline</span>
        </div>
      )}
      {isOnline && (
        <div className={cn('hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs')} aria-hidden>
          <Wifi size={12} />
        </div>
      )}

      <button
        onClick={onSearchOpen}
        className="flex items-center gap-2 rounded-md border bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
        aria-label="Open global search"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search rules, weapons…</span>
        <kbd className="hidden rounded border px-1 text-[10px] sm:inline">⌘K</kbd>
      </button>
    </header>
  )
}
