export type ShowImages = ShowImage[]

export interface ShowImage {
  id: number
  type: string
  main: boolean
  resolutions: Resolutions
}

export interface Resolutions {
  original: Original
  medium?: Medium
}

export interface Original {
  url: string
  width: number
  height: number
}

export interface Medium {
  url: string
  width: number
  height: number
}
