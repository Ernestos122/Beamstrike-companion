export interface RulesSection {
  id: string // e.g. "movement", "ranged-combat"
  title: string // e.g. "Movement Phase"
  order: number // display order
  pageRef?: string // e.g. "p.8"
  subsections?: RulesSection[]
}

export interface RulesEntry {
  id: string // e.g. "movement-jetpacks", "combat-hit-modifiers"
  title: string
  sectionId: string // top-level chapter id
  subsectionId?: string
  content: string // markdown rule text
  tags: string[]
  seeAlso: string[] // IDs of related rule entries
  pageRef?: string // e.g. "p.12" from core rules 1.22
  order: number // display order within section
}
