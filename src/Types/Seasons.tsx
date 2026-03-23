export type Seasons = Season[]

export interface Season {
  id: number
  url: string
  number: number
  name: string
  episodeOrder: number
  premiereDate: string
  endDate: string
  network?: Network
  webChannel?: WebChannel
  image: Image
  summary: string
  _links: Links
}

export interface Network {
  id: number
  name: string
  country: Country
  officialSite: string
}

export interface Country {
  name: string
  code: string
  timezone: string
}

export interface WebChannel {
  id: number
  name: string
  country: Country2
  officialSite: string
}

export interface Country2 {
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
