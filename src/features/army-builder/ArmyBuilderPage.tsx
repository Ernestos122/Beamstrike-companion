import { useParams } from 'react-router-dom'
import { ArmyListView } from './ArmyListView'
import { ArmyEditorView } from './ArmyEditorView'

export function ArmyBuilderPage() {
  const { armyId } = useParams<{ armyId?: string }>()

  if (armyId) {
    return <ArmyEditorView armyId={armyId} />
  }

  return <ArmyListView />
}
