import { allWeapons, equipment as equipmentData, vehicleBuilder } from '@data/index'
import type { SquadSelection } from '@types-bs/squad'
import type { Weapon } from '@types-bs/weapon'
import type { VehicleArmourClass } from '@types-bs/enums'
import type { VehicleHull, VehicleMovementType, VehicleCrewRating, VehicleFamily } from '@types-bs/vehicle'

const { hulls, movementTypes, accessories, crewRatings, gunLinkageCost } = vehicleBuilder

export interface VehicleMount {
  weapon: Weapon
  count: number
  isMainGun: boolean
}

export interface VehicleSummary {
  mode: 'BUILD' | 'CUSTOM'
  hull?: VehicleHull
  movement?: VehicleMovementType
  crew: VehicleCrewRating
  hullClass?: VehicleArmourClass
  family?: VehicleFamily
  mounts: VehicleMount[]
  breakdown: { label: string; pts: number }[]
  total: number
  mainGunUsed: number
  mainGunSpace: number
  auxUsed: number
  auxSpaces: number
  linked: boolean
  problems: string[]
}

export function getHull(id: string | undefined) {
  return hulls.find(h => h.id === id)
}
export function getMovementType(id: string | undefined) {
  return movementTypes.find(m => m.id === id)
}
export function getAccessory(id: string) {
  return accessories.find(a => a.id === id)
}
export function getCrewRating(id: string | undefined): VehicleCrewRating {
  return crewRatings.find(c => c.id === (id ?? 'REGULAR')) ?? crewRatings.find(c => c.id === 'REGULAR')!
}

// Custom vehicles only record a hull type label; bikes and aircraft aren't on the builder chart
export function customFamily(hullType: string | undefined): VehicleFamily | undefined {
  if (hullType === 'BIKE_TRIKE') return 'BIKE'
  if (hullType === 'AIRCRAFT') return 'AIRCRAFT'
  return getHull(hullType)?.family
}

// Guns from the vehicle main gun table with a numeric size go in the turret / arms.
// Everything else (size 'A', no size, infantry/support/heavy weapons) uses an auxiliary space.
export function isMainGun(w: Weapon): boolean {
  return w.category === 'VEHICLE_MOUNTED' && typeof w.mainGunSize === 'number'
}

function resolveMounts(squad: SquadSelection): VehicleMount[] {
  return (squad.vehicleWeapons ?? []).flatMap(wl => {
    const weapon = allWeapons.find(w => w.id === wl.weaponId)
    return weapon ? [{ weapon, count: wl.count, isMainGun: isMainGun(weapon) }] : []
  })
}

export function summariseVehicle(squad: SquadSelection): VehicleSummary {
  const mounts = resolveMounts(squad)
  const crew = getCrewRating(squad.vehicleCrew)
  const weaponLines = mounts.map(m => ({
    label: `${m.count > 1 ? `${m.count}× ` : ''}${m.weapon.name}`,
    pts: m.weapon.pointsCost * m.count,
  }))
  const crewLine = crew.cost !== 0 ? [{ label: `${crew.name} crew`, pts: crew.cost }] : []

  if (squad.vehicleMode !== 'BUILD') {
    const equipLines = (squad.vehicleEquipment ?? []).map(eId => {
      const eq = equipmentData.find(e => e.id === eId) as { name: string; pointsCost: number; vehicleCost?: number } | undefined
      return { label: eq?.name ?? eId, pts: eq?.vehicleCost ?? eq?.pointsCost ?? 0 }
    })
    const breakdown = [
      { label: 'Base (hull + movement)', pts: squad.vehicleBasePoints ?? 0 },
      ...crewLine, ...weaponLines, ...equipLines,
    ]
    return {
      mode: 'CUSTOM', crew, mounts, breakdown,
      hullClass: squad.vehicleArmourClass,
      family: customFamily(squad.vehicleHullType),
      total: breakdown.reduce((s, l) => s + l.pts, 0),
      mainGunUsed: 0, mainGunSpace: 0, auxUsed: 0, auxSpaces: 0, linked: false, problems: [],
    }
  }

  const hull = getHull(squad.vehicleHullType)
  const movement = getMovementType(squad.vehicleMovementId)
  const accLoad = (squad.vehicleAccessories ?? []).flatMap(al => {
    const acc = getAccessory(al.id)
    return acc && al.count > 0 ? [{ acc, count: al.count }] : []
  })

  const mainGunUsed = mounts.filter(m => m.isMainGun).reduce((s, m) => s + (m.weapon.mainGunSize as number) * m.count, 0)
  const mainGunCount = mounts.filter(m => m.isMainGun).reduce((s, m) => s + m.count, 0)
  const linked = mainGunCount > 1 // several main guns share the turret and must be linked

  const auxWeapons = mounts.filter(m => !m.isMainGun).reduce((s, m) => s + m.count, 0)
  const roboTurrets = accLoad.find(a => a.acc.id === 'ROC')?.count ?? 0
  const shieldCount = accLoad.filter(a => a.acc.shield).reduce((s, a) => s + a.count, 0)
  const auxUsed =
    Math.max(0, auxWeapons - 3 * roboTurrets) // each robo-turret houses up to 3 aux guns in its own space
    + accLoad.reduce((s, a) => s + a.acc.aux * a.count, 0)
    - (shieldCount > 0 ? 1 : 0)              // first shield needs no mount point

  const breakdown = [
    { label: hull ? `${hull.name} hull` : 'Hull', pts: hull?.cost ?? 0 },
    { label: movement ? `${movement.name} movement` : 'Movement', pts: movement?.cost ?? 0 },
    ...crewLine,
    ...weaponLines,
    ...(linked ? [{ label: 'Gun linkage', pts: gunLinkageCost }] : []),
    ...accLoad.map(({ acc, count }) => ({ label: `${count > 1 ? `${count}× ` : ''}${acc.name}`, pts: acc.cost * count })),
  ]

  const problems: string[] = []
  const mainGunSpace = hull?.mainGunSpace ?? 0
  const auxSpaces = hull?.auxSpaces ?? 0
  if (!hull) problems.push('Choose a hull type.')
  if (!movement) problems.push('Choose a movement type.')
  if (hull && movement && !hull.movement.includes(movement.id)) problems.push(`${hull.name} cannot use ${movement.name} movement.`)
  if (hull && mainGunUsed > mainGunSpace) {
    problems.push(mainGunSpace === 0
      ? `${hull.name} cannot mount main guns.`
      : `Main guns use ${mainGunUsed} of ${mainGunSpace} main gun space.`)
  }
  if (hull && auxUsed > auxSpaces) problems.push(`Uses ${auxUsed} of ${auxSpaces} auxiliary spaces.`)
  for (const { acc } of accLoad) {
    if (hull && acc.families && !acc.families.includes(hull.family)) problems.push(`${acc.name} is for mecha only.`)
    if (hull && acc.minHullClass !== undefined && hull.hullClass < acc.minHullClass) problems.push(`${acc.name} needs hull class ${acc.minHullClass}+.`)
    if (acc.requires && !accLoad.some(a => a.acc.id === acc.requires)) problems.push(`${acc.name} requires ${getAccessory(acc.requires)?.name ?? acc.requires}.`)
  }

  return {
    mode: 'BUILD', hull, movement, crew, mounts, breakdown,
    hullClass: hull?.hullClass,
    family: hull?.family,
    total: breakdown.reduce((s, l) => s + l.pts, 0),
    mainGunUsed, mainGunSpace, auxUsed, auxSpaces, linked, problems,
  }
}
