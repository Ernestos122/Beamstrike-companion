// Core enums for Beamstrike v1.22

export type TrainingClass = 'CIVILIAN' | 'REGULAR' | 'VETERAN' | 'ELITE' | 'HERO'

// Armour columns in the Infantry Damage Table
export type ArmourType = 'UA' | 'FI' | 'LA' | 'PA' | 'PA_SHIELDED' | 'DA' | 'DA_SHIELDED'

export type RaceType =
  | 'HUMAN'
  | 'SPUG'
  | 'GREY'
  | 'BUG'
  | 'FERRAPUR'
  | 'CENTALING'
  | 'HIBEVOR'
  | 'GROWWLAN'
  | 'REPLICAN'
  | 'KRAVAK'
  | 'ORCOID'
  | 'THUNTRA'
  | 'K_KREE'

// Impact type determines the row section in the Infantry Damage Table
export type ImpactType =
  | 'STUN'
  | 'LOW'
  | 'STANDARD'
  | 'HIGH'
  | 'POWER'
  | 'TOTAL_1'
  | 'TOTAL_2'
  | 'TOTAL_3'

// Results from Infantry Damage Table
export type DamageResult = 'NE' | 'STUN' | 'GH' | 'KILL'

export type ShieldType = 'ES' | 'PS' | 'MULTI'

export type WeaponCategory = 'INFANTRY' | 'SUPPORT' | 'HEAVY' | 'VEHICLE_MOUNTED' | 'ALIEN' | 'MELEE' | 'GRENADE'

export type VehicleArmourClass = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type VehicleHullType =
  | 'APC'
  | 'SCOUT_CAR'
  | 'LIGHT_MECHA'
  | 'LIGHT_TANK'
  | 'MEDIUM_MECHA'
  | 'LIGHT_WALKER'
  | 'MEDIUM_TANK'
  | 'HEAVY_WALKER'
  | 'HEAVY_MECHA'
  | 'HEAVY_TANK'
  | 'GMC'
  | 'TRANSPORT'
  | 'TRANSPORT_WALKER'
  | 'SUPER_HEAVY_TANK'
  | 'BIKE_TRIKE'
  | 'AIRCRAFT'
  | 'OTHER'

export type MovementType =
  | 'UA'
  | 'FI_LA'
  | 'PA'
  | 'AD'
  | 'FAST_WHEELED'
  | 'WHEELED'
  | 'FAST_TRACKED'
  | 'TRACKED'
  | 'HEAVY_TRACKED'
  | 'ANTI_GRAV'
  | 'HOVER'
  | 'FAST_GRAV'
  | 'LEGGED'
  | 'HEAVY_LEGGED'
  | 'LIMBS'
  | 'HEAVY_LIMBS'

export type SkillType =
  | 'LEADERSHIP'
  | 'SNIPER'
  | 'SAPPER'
  | 'GRENADIER'
  | 'MEDIC'
  | 'FANATIC'
  | 'GUNNER'
  | 'SCOUT'
  | 'SWORDSMAN'
  | 'DODGE'
  | 'NERVES_OF_STEEL'
  | 'AMBIDEXTROUS'
  | 'CONSTITUTION'
  | 'FORTUNE'
  | 'QUICK_FIRE'
  | 'GUN_SKILL'
  | 'AGGRESSIVE'
  | 'INITIATIVE'
  | 'ARTILLERIST'
  | 'MARKSMAN'
  | 'SHARPSHOOTER'
  | 'AGILE'
  | 'MARTIAL_ARTS'
  | 'INTUITIVE'

export type ChartCategory =
  | 'TURN_SEQUENCE'
  | 'MOVEMENT'
  | 'COMBAT_INFANTRY'
  | 'COMBAT_VEHICLE'
  | 'MORALE'
  | 'CLOSE_COMBAT'
  | 'COVER'
  | 'WEAPONS'
  | 'DAMAGE'
  | 'SHIELDS'
  | 'ALIENS'
  | 'REFERENCE'
  | 'FIRE_SUPPORT'
