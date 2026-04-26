import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AppShell } from '@components/layout/AppShell'
import { HomePage } from '@features/home/HomePage'
import { ArmyBuilderPage } from '@features/army-builder/ArmyBuilderPage'
import { RulesReferencePage } from '@features/rules-reference/RulesReferencePage'
import { ChartsPage } from '@features/charts/ChartsPage'
import { RulebookPage } from '@features/rulebook/RulebookPage'
import { HelpersPage } from '@features/helpers/HelpersPage'
import { EraGuidePage } from '@features/era-guide/EraGuidePage'
import { AliensGuidePage } from '@features/aliens-guide/AliensGuidePage'
import { SkirmishPage } from '@features/skirmish/SkirmishPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/army" element={<ArmyBuilderPage />} />
          <Route path="/army/:armyId" element={<ArmyBuilderPage />} />
          <Route path="/rules" element={<RulesReferencePage />} />
          <Route path="/rules/:sectionId" element={<RulesReferencePage />} />
          <Route path="/rules/:sectionId/:entryId" element={<RulesReferencePage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/charts/:chartId" element={<ChartsPage />} />
          <Route path="/rulebook" element={<RulebookPage />} />
          <Route path="/helpers" element={<HelpersPage />} />
          <Route path="/era1" element={<EraGuidePage />} />
          <Route path="/aliens" element={<AliensGuidePage />} />
          <Route path="/skirmish" element={<SkirmishPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>
)
