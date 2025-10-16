export interface Game {
  id: string
  name: string
  image: string
  url?: string
  rating?: number
  playtime?: string
  status?: string
  developer?: string
  releaseDate?: string
  platforms?: string[]
  genres?: string[]
  logpage?: string
  igdbpage?: string
  igdbgameinfo?: any
  mastered?: string
  isRemaster?: string
  isRemake?: string
  isExpansion?: string
}

export interface GamesResponse {
  games: Game[]
  pagination: {
    currentPage: number
    totalPages: number
    totalGames: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface UserInfo {
  username: string
  profile: string
  bio: string
  gamescount?: number
}

export interface ApiResponse {
  message: string
  code: number
  content: GamesResponse | UserInfo
}

