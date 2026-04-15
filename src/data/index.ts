import type { Weapon } from '@types-bs/weapon'
import type { Chart } from '@types-bs/charts'
import type { RulesSection, RulesEntry } from '@types-bs/rules'

import _version from './version.json'
import _races from './races.json'
import _troopTraining from './troop-training.json'
import _armourTypes from './armour-types.json'
import _skills from './skills.json'
import _equipment from './equipment.json'
import _weaponsInfantry from './weapons-infantry.json'
import _weaponsSupport from './weapons-support.json'
import _weaponsHeavy from './weapons-heavy.json'
import _weaponsVehicle from './weapons-vehicle.json'
import _weaponsAlien from './weapons-alien.json'
import _grenades from './grenades.json'
import _charts from './charts.json'
import _rulesSections from './rules-sections.json'
import _rulesEntries from './rules-entries.json'

export const version = _version
export const races = _races
export const troopTraining = _troopTraining
export const armourTypes = _armourTypes
export const skills = _skills
export const equipment = _equipment
export const weaponsInfantry = _weaponsInfantry as unknown as Weapon[]
export const weaponsSupport = _weaponsSupport as unknown as Weapon[]
export const weaponsHeavy = _weaponsHeavy as unknown as Weapon[]
export const weaponsVehicle = _weaponsVehicle as unknown as Weapon[]
export const weaponsAlien = _weaponsAlien as unknown as Weapon[]
export const grenades = _grenades
export const charts = _charts as unknown as Chart[]
export const rulesSections = _rulesSections as unknown as RulesSection[]
export const rulesEntries = _rulesEntries as unknown as RulesEntry[]

/** All infantry + support + heavy + alien weapons in a single flat array */
export const allWeapons: Weapon[] = [
  ...(weaponsInfantry),
  ...(weaponsSupport),
  ...(weaponsHeavy),
  ...(weaponsVehicle),
  ...(weaponsAlien),
]
