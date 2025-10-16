//Copyright 2023 Qewertyy, MIT License

export type userInfo = {
  profile: string;
  username: string;
  bio: string;
  gamescount?: number;
  badges?: userBadges[];
  favoriteGames?: favoriteGames[];
  recentlyPlayed?: recentlyPlayed[];
  recentlyReviewed?: recentlyReviewed[];
} & userStats;

export type favoriteGames = {
  name: string;
  image: string;
  url?: string;
  developer?: string;
  releaseDate?: string;
  platforms?: string[];
  genres?: string[];
  logpage?: string;
  igdbpage?: string;
  developerbyigdb?: string;
  status?: string;
  mastered?: string;
  isRemaster?: string;
  isRemake?: string;
  isExpansion?: string;
  mostFavorite?: boolean;
};

export type recentlyPlayed = {
  name: string;
  image: string;
  url?: string;
  developer?: string;
  releaseDate?: string;
  platforms?: string[];
  genres?: string[];
  logpage?: string;
  igdbpage?: string;
  developerbyigdb?: string;
  status?: string;
  mastered?: string;
  isRemaster?: string;
  isRemake?: string;
  isExpansion?: string;
  date?: string;
  rating?: number;
};

export type recentlyReviewed = {
  name: string;
  image: string;
  url?: string;
  developer?: string;
  releaseDate?: string;
  platforms?: string[];
  genres?: string[];
  logpage?: string;
  igdbpage?: string;
  developerbyigdb?: string;
  status?: string;
  mastered?: string;
  isRemaster?: string;
  isRemake?: string;
  isExpansion?: string;
  rating?: number;
  review?: string;
};

export type userStats = {
  [key: string]: number;
};

export type userBadges = {
  id: string | number;
  name: string;
  image?: string;
  description: string;
};

export type game = {
  id: string;
  name: string;
  image: string;
  url?: string;
  developer?: string;
  releaseDate?: string;
  platforms?: string[];
  genres?: string[];
  logpage?: string;
  igdbpage?: string;
  igdbgameinfo?: any;
  rating?: number;
  playtime?: string;
  lastPlayed?: string;
  status?: string;
  mastered?: string;
  isRemaster?: string;
  isRemake?: string;
  isExpansion?: string;
};

export type gamesResponse = {
  games: game[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalGames: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};