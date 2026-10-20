import { allWeapons, equipment as equipmentData, vehicleBuilder, vehiclePresets } from '@data/index'
import type { SquadSelection, WeaponLoadout } from '@types-bs/squad'
import type { Weapon } from '@types-bs/weapon'
import type { VehicleArmourClass } from '@types-bs/enums'
import type { VehicleHull, VehicleMovementType, VehicleCrewRating, VehicleFamily, VehiclePreset } from '@types-bs/vehicle'

const { hulls, movementTypes, accessories, crewRatings, gunLinkageCost } = vehicleBuilder

const FAMILY_NAMES: Record<VehicleFamily, string> = {
  BIKE: 'bikes & skimmers', CAR: 'carriers', AIRCRAFT: 'aircraft', TANK: 'tanks', WALKER: 'walkers', MECHA: 'mecha',
}

export interface VehicleMount {
  weapon: Weapon
  count: number
  isMainGun: boolean
  included?: boolean // part of a preset's printed price
}

export interface VehicleSummary {
  mode: 'BUILD' | 'PRESET' | 'CUSTOM'
  hull?: VehicleHull
  preset?: VehiclePreset
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
  ridersSeparate?: boolean // bikes/skimmers: crew rating doesn't apply, riders are infantry
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
export function getPreset(id: string | undefined) {
  return vehiclePresets.find(p => p.id === id)
}
export function getCrewRating(id: string | undefined): VehicleCrewRating {
  return crewRatings.find(c => c.id === (id ?? 'REGULAR')) ?? crewRatings.find(c => c.id === 'REGULAR')!
}

// Custom and preset vehicles only record a hull type label
export function customFamily(hullType: string | undefined): VehicleFamily | undefined {
  return getHull(hullType)?.family
}

// Guns from the vehicle main gun table with a numeric size go in the turret / arms.
// Everything else (size 'A', no size, infantry/support/heavy weapons) uses an auxiliary space.
export function isMainGun(w: Weapon): boolean {
  return w.category === 'VEHICLE_MOUNTED' && typeof w.mainGunSize === 'number'
}

function resolveMounts(loadout: WeaponLoadout[], included = false): VehicleMount[] {
  return loadout.flatMap(wl => {
    const weapon = allWeapons.find(w => w.id === wl.weaponId)
    return weapon ? [{ weapon, count: wl.count, isMainGun: isMainGun(weapon), ...(included ? { included } : {}) }] : []
  })
}

export function summariseVehicle(squad: SquadSelection): VehicleSummary {
  const mounts = resolveMounts(squad.vehicleWeapons ?? [])
  const crew = getCrewRating(squad.vehicleCrew)
  const weaponLines = mounts.map(m => ({
    label: `${m.count > 1 ? `${m.count}× ` : ''}${m.weapon.name}`,
    pts: m.weapon.pointsCost * m.count,
  }))
  const crewLine = crew.cost !== 0 ? [{ label: `${crew.name} crew`, pts: crew.cost }] : []

  if (squad.vehicleMode === 'PRESET') {
    const preset = getPreset(squad.vehiclePresetId)
    const extraAux = mounts.reduce((s, m) => s + m.count, 0)
    const fitments = preset?.fitments ?? 0
    const breakdown = [
      { label: preset ? `${preset.name} (rulebook price)` : 'Ready-made vehicle', pts: preset?.points ?? 0 },
      ...crewLine,
      ...weaponLines,
    ]
    const problems: string[] = []
    if (!preset) problems.push('Choose a ready-made vehicle.')
    else if (extraAux > fitments) {
      problems.push(fitments === 0
        ? `${preset.name} has no spare weapon fitments.`
        : `${preset.name} has ${fitments} spare weapon fitment${fitments > 1 ? 's' : ''}; ${extraAux} added.`)
    }
    return {
      mode: 'PRESET', preset, crew, breakdown, problems,
      mounts: [...resolveMounts(preset?.weapons ?? [], true), ...mounts],
      movement: getMovementType(preset?.movementId ?? undefined),
      hullClass: preset?.hullClass,
      family: customFamily(preset?.vehicleType),
      total: breakdown.reduce((s, l) => s + l.pts, 0),
      mainGunUsed: 0, mainGunSpace: 0, auxUsed: extraAux, auxSpaces: fitments, linked: false,
    }
  }

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
  const movementCost = movement ? (hull?.movementCosts?.[movement.id] ?? movement.cost) : 0
  const ridersSeparate = hull?.crewIncluded === false
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
    { label: movement ? `${movement.name} movement` : 'Movement', pts: movementCost },
    ...(ridersSeparate ? [] : crewLine),
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
  if (hull?.auxWeaponCategories && roboTurrets === 0) {
    const bad = mounts.filter(m => !hull.auxWeaponCategories!.includes(m.weapon.category))
    if (bad.length) problems.push(`${hull.name} can only mount ${hull.auxWeaponCategories.map(c => c.toLowerCase()).join(' or ')} weapons (${bad.map(m => m.weapon.name).join(', ')}).`)
  }
  if (hull?.linkedWeapons && roboTurrets === 0 && new Set(mounts.map(m => m.weapon.id)).size > 1) {
    problems.push(`${hull.name} weapons must be the same type (they fire linked).`)
  }
  for (const { acc } of accLoad) {
    if (hull && acc.families && !acc.families.includes(hull.family)) problems.push(`${acc.name} is for ${acc.families.map(f => FAMILY_NAMES[f]).join(' / ')} only.`)
    if (hull && acc.minHullClass !== undefined && hull.hullClass < acc.minHullClass) problems.push(`${acc.name} needs hull class ${acc.minHullClass}+.`)
    if (acc.requires && !accLoad.some(a => a.acc.id === acc.requires)) problems.push(`${acc.name} requires ${getAccessory(acc.requires)?.name ?? acc.requires}.`)
  }

  return {
    mode: 'BUILD', hull, movement, mounts, breakdown,
    crew: ridersSeparate ? getCrewRating('REGULAR') : crew,
    ridersSeparate,
    hullClass: hull ? (Math.min(6, hull.hullClass + (accLoad.some(a => a.acc.id === 'ARM') ? 1 : 0)) as VehicleArmourClass) : undefined,
    family: hull?.family,
    total: breakdown.reduce((s, l) => s + l.pts, 0),
    mainGunUsed, mainGunSpace, auxUsed, auxSpaces, linked, problems,
  }
}
