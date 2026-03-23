export type MultipleCastCredits = CastCredits[]

export interface CastCredits {
  self: boolean
  voice: boolean
  _links: Links
}

export interface Links {
  show: Show
  character: Character
}

export interface Show {
  href: string
  name: string
}

export interface Character {
  href: string
  name: string
}
