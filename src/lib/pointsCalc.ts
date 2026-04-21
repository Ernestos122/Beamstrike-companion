import { troopTraining, armourTypes, skills as skillsData, equipment as equipmentData, allWeapons } from '@data/index'
import type { SquadSelection, TrooperLine } from '@types-bs/squad'
import type { ArmourType } from '@types-bs/enums'

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

// Cost for a single TrooperLine (count × per-figure total).
// Per-figure = base + weapons + equip + skills.
// base = troopBaseCost when set (alien troop type with all-in supplement cost), else armour+training.
export function calcTrooperLinePoints(line: TrooperLine): number {
  const base = line.troopBaseCost !== undefined
    ? line.troopBaseCost
    : getTrainingCost(line.trainingClass) + getArmourCost(line.armourType)

  const weaponPts = line.weapons.reduce((sum, wId) => {
    const w = allWeapons.find(w => w.id === wId)
    return sum + (w?.pointsCost ?? 0)
  }, 0)

  const equipPts = line.equipment.reduce((sum, eId) => {
    const eq = equipmentData.find(e => e.id === eId)
    return sum + ((eq as { pointsCost: number } | undefined)?.pointsCost ?? 0)
  }, 0)

  const skillPts = line.skills.reduce((sum, sId) => {
    const s = skillsData.find(s => s.id === sId)
    return sum + ((s as { pointsCost: number } | undefined)?.pointsCost ?? 0)
  }, 0)

  return line.count * (base + weaponPts + equipPts + skillPts)
}

export function calcSquadPoints(squad: SquadSelection): number {
  if (squad.isVehicle) {
    const weaponPts = (squad.vehicleWeapons ?? []).reduce((sum, wl) => {
      const w = allWeapons.find(w => w.id === wl.weaponId)
      return sum + (w?.pointsCost ?? 0) * wl.count
    }, 0)
    const equipPts = (squad.vehicleEquipment ?? []).reduce((sum, eId) => {
      const eq = equipmentData.find(e => e.id === eId) as { pointsCost: number; vehicleCost?: number } | undefined
      return sum + (eq?.vehicleCost ?? eq?.pointsCost ?? 0)
    }, 0)
    return (squad.vehicleBasePoints ?? 0) + weaponPts + equipPts
  }

  return squad.troopers.reduce((sum, line) => sum + calcTrooperLinePoints(line), 0)
}

export function calcSquadMorale(squad: SquadSelection): number {
  if (squad.isVehicle) return 3
  return squad.troopers.reduce((sum, line) => {
    const mv = line.trainingClass === 'HERO' ? 3 : 1
    return sum + mv * line.count
  }, 0)
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
