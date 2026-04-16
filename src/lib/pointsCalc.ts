import { troopTraining, armourTypes, skills as skillsData, equipment as equipmentData, allWeapons } from '@data/index'
import type { SquadSelection } from '@types-bs/squad'
import type { ArmourType } from '@types-bs/enums'

// ArmourType enum uses 'DA'/'DA_SHIELDED' for what armour-types.json calls 'AD'
function getArmourCost(armourType: ArmourType | undefined): number {
  if (!armourType) return 0
  const id = armourType === 'DA' || armourType === 'DA_SHIELDED' ? 'AD' : armourType.replace('_SHIELDED', '')
  const a = armourTypes.find(a => a.id === id)
  return (a as { pointsCost: number } | undefined)?.pointsCost ?? 0
}

function getTrainingCost(trainingClass: string | undefined): number {
  if (!trainingClass) return 0
  const t = troopTraining.find(t => t.id === trainingClass)
  return (t as { pointsCost: number } | undefined)?.pointsCost ?? 0
}

export function calcSquadPoints(squad: SquadSelection): number {
  const weaponPts = squad.weapons.reduce((sum, wl) => {
    const w = allWeapons.find(w => w.id === wl.weaponId)
    return sum + (w?.pointsCost ?? 0) * wl.count
  }, 0)

  const equipPts = squad.equipment.reduce((sum, eqId) => {
    const eq = equipmentData.find(e => e.id === eqId)
    return sum + ((eq as { pointsCost: number } | undefined)?.pointsCost ?? 0)
  }, 0)

  if (squad.isVehicle) {
    return (squad.vehicleBasePoints ?? 0) + weaponPts + equipPts
  }

  const count = squad.modelCount ?? 0
  const basePts = (getTrainingCost(squad.trainingClass) + getArmourCost(squad.armourType)) * count

  const skillPts = (squad.skills ?? []).reduce((sum, skillId) => {
    const s = skillsData.find(s => s.id === skillId)
    return sum + ((s as { pointsCost: number } | undefined)?.pointsCost ?? 0) * count
  }, 0)

  return basePts + weaponPts + skillPts + equipPts
}

export function calcSquadMorale(squad: SquadSelection): number {
  if (squad.isVehicle) return 3
  if (squad.trainingClass === 'HERO') return 3
  return squad.modelCount ?? 0
}

export function recalcArmyTotals(
  squads: SquadSelection[],
  nominatedObjectiveMorale: number,
) {
  const totalPoints = squads.reduce((sum, s) => sum + s.pointsTotal, 0)
  const troopMorale = squads.reduce((sum, s) => sum + s.moraleValue, 0)
  const totalMoraleValue = troopMorale + nominatedObjectiveMorale
  const halfMoraleThreshold = Math.ceil(totalMoraleValue / 2)
  return { totalPoints, totalMoraleValue, halfMoraleThreshold }
}
