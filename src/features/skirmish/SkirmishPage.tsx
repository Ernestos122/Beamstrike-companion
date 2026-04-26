import { useState } from 'react'
import { BookOpen, Target, Zap, Users, Trophy } from 'lucide-react'
import { cn } from '@lib/utils'
import { RulesTab } from './RulesTab'
import { ScenariosTab } from './ScenariosTab'
import { QuickRefTab } from './QuickRefTab'
import { WarbandBuilderTab } from './WarbandBuilderTab'
import { CampaignTab } from './CampaignTab'

const TABS = [
  { id: 'rules',    label: 'Rules',    icon: BookOpen },
  { id: 'scenarios',label: 'Scenarios',icon: Target   },
  { id: 'quickref', label: 'Quick Ref',icon: Zap      },
  { id: 'warband',  label: 'Warband',  icon: Users    },
  { id: 'campaign', label: 'Campaign', icon: Trophy   },
] as const

type TabId = typeof TABS[number]['id']

export function SkirmishPage() {
  const [tab, setTab] = useState<TabId>('rules')

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-[var(--card)] px-4 py-3">
        <h1 className="text-lg font-bold">Beamstrike Skirmish</h1>
        <p className="text-xs text-[var(--muted-foreground)]">Standalone 15mm skirmish — up to 15 figures, 200 pts</p>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b bg-[var(--card)] scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
              tab === id
                ? 'border-[var(--foreground)] text-[var(--foreground)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'rules'     && <RulesTab />}
        {tab === 'scenarios' && <ScenariosTab />}
        {tab === 'quickref'  && <QuickRefTab />}
        {tab === 'warband'   && <WarbandBuilderTab />}
        {tab === 'campaign'  && <CampaignTab />}
      </div>
    </div>
  )
}
