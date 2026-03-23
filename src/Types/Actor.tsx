export interface Actor {
  id: number
  url: string
  name: string
  country: Country
  birthday: string
  deathday: string
  gender: string
  image: Image
  updated: number
  _links: Links
  _embedded: Embedded
}

export interface Country {
  name: string
  code: string
  timezone: string
}

export interface Image {
  medium: string
  original: string
}

export interface Links {
  self: Self
}

export interface Self {
  href: string
}

export interface Embedded {
  castcredits: Castcredit[]
}

export interface Castcredit {
  self: boolean
  voice: boolean
  _links: Links2
}

export interface Links2 {
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
