'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from 'recharts'
import type { ApiResponse, Game, GamesResponse } from '@/types'
import Image from 'next/image'

// Type guard function to check if data contains games
const isGamesResponse = (data: ApiResponse): data is { message: string; code: number; content: GamesResponse } => {
  return data.content && typeof data.content === 'object' && 'games' in data.content;
};

interface YearData {
  year: number
  count: number
  avgRating: number
}

interface MasteredGameData {
  name: string
  rating: number
  year: number
  color: string
  index: string
}

// Цветовая палитра для диаграмм
const COLORS = [
  '#FFD700', // Жёлтый
  '#FF69B4', // Розовый
  '#FF8C00', // Оранжевый
  '#20B2AA', // Бирюзовый
  '#4169E1', // Синий
  '#9370DB', // Фиолетовый
  '#FF6347', // Томатный
  '#32CD32', // Зелёный
  '#FF1493', // Ярко-розовый
  '#00CED1', // Тёмно-бирюзовый
  '#FF4500', // Красно-оранжевый
  '#8A2BE2', // Сине-фиолетовый
  '#DC143C', // Малиновый
  '#00FA9A', // Зелёный
  '#1E90FF', // Синий
  '#FFA500', // Оранжевый
  '#FFB6C1', // Светло-розовый
  '#98FB98', // Бледно-зелёный
  '#F0E68C', // Хаки
  '#DDA0DD', // Сливовый
]

interface YearWithGames {
  year: number
  avgRating: number
  games: Game[]
}

export default function StatsViewer({ data }: { data: ApiResponse }) {
  const [activeTab, setActiveTab] = useState<'games' | 'ratings'>('games')
  const [developerTab, setDeveloperTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [genresTab, setGenresTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [gameModesTab, setGameModesTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [gameEnginesTab, setGameEnginesTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [themesTab, setThemesTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [seriesTab, setSeriesTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [franchisesTab, setFranchisesTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [platformsTab, setPlatformsTab] = useState<'played' | 'rated' | 'lowest'>('played')
  const [keywordsTab, setKeywordsTab] = useState<'common' | 'rated' | 'lowest'>('common')
  const [minDeveloperGames, setMinDeveloperGames] = useState(2) // Минимальный порог игр для разработчиков
  const [remakesTab, setRemakesTab] = useState<'all' | 'highest' | 'lowest'>('all')
  const [remastersTab, setRemastersTab] = useState<'all' | 'highest' | 'lowest'>('all')
  const [extensionsTab, setExtensionsTab] = useState<'all' | 'highest' | 'lowest'>('all')

  // Функция для форматирования рейтинга
  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(2) : 'Not Rated'
  }

  // Извлекаем username из URL первой игры или используем значение по умолчанию
  const username = useMemo(() => {
    if (isGamesResponse(data) && data.content.games.length > 0) {
      const firstGameUrl = data.content.games[0].url
      if (firstGameUrl) {
        // URL формата: https://backloggd.com/u/USERNAME/games/...
        const match = firstGameUrl.match(/backloggd\.com\/u\/([^\/]+)/)
        if (match) {
          return match[1]
        }
      }
    }
    return 'zampo1it' // значение по умолчанию
  }, [data])

  const yearData = useMemo(() => {
    if (!isGamesResponse(data)) {
      return []
    }

    // Группируем игры по годам
    const yearMap = new Map<number, { count: number; ratings: number[] }>()

    data.content.games.forEach((game: Game) => {
      if (game.releaseDate) {
        // Парсим дату в формате DD/MM/YYYY
        const dateParts = game.releaseDate.split('/')
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[2])
          
          if (!yearMap.has(year)) {
            yearMap.set(year, { count: 0, ratings: [] })
          }
          
          const yearData = yearMap.get(year)!
          yearData.count++
          
          // Добавляем рейтинг, если он есть
          if (game.rating && game.rating > 0) {
            yearData.ratings.push(game.rating)
          }
        }
      }
    })

    // Преобразуем в массив и сортируем по году
    const result: YearData[] = Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0
      }))
      .sort((a, b) => a.year - b.year)

    return result
  }, [data])

  const yearsWithGames = useMemo(() => {
    if (!isGamesResponse(data)) return []

    // Группируем игры по годам
    const yearMap = new Map<number, { games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.releaseDate) {
        // Парсим дату в формате DD/MM/YYYY
        const dateParts = game.releaseDate.split('/')
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[2])
          
          if (!yearMap.has(year)) {
            yearMap.set(year, { games: [], ratings: [] })
          }
          
          const yearData = yearMap.get(year)!
          yearData.games.push(game)
          
          // Добавляем рейтинг, если он есть
          if (game.rating && game.rating > 0) {
            yearData.ratings.push(game.rating)
          }
        }
      }
    })
    }

    // Преобразуем в массив, фильтруем по минимум 5 играм и сортируем по рейтингу
    const result: YearWithGames[] = Array.from(yearMap.entries())
      .filter(([year, data]) => data.games.length >= 5) // Минимум 5 игр
      .map(([year, data]) => ({
        year,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0,
        games: data.games.filter(game => game.rating && game.rating > 0).sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Показываем только игры с рейтингом и сортируем по рейтингу
      }))
      .sort((a, b) => b.avgRating - a.avgRating) // Сортируем годы по среднему рейтингу
      .slice(0, 3) // Берем топ 3 года

    return result
  }, [data])

  const lowestYearsWithGames = useMemo(() => {
    if (!isGamesResponse(data)) return []

    // Группируем игры по годам
    const yearMap = new Map<number, { games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.releaseDate) {
        // Парсим дату в формате DD/MM/YYYY
        const dateParts = game.releaseDate.split('/')
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[2])
          
          if (!yearMap.has(year)) {
            yearMap.set(year, { games: [], ratings: [] })
          }
          
          const yearData = yearMap.get(year)!
          yearData.games.push(game)
          
          // Добавляем рейтинг, если он есть
          if (game.rating && game.rating > 0) {
            yearData.ratings.push(game.rating)
          }
        }
      }
    })
    }

    // Преобразуем в массив, фильтруем по минимум 5 играм и сортируем по рейтингу (по возрастанию)
    const result: YearWithGames[] = Array.from(yearMap.entries())
      .filter(([year, data]) => data.games.length >= 5) // Минимум 5 игр
      .map(([year, data]) => ({
        year,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0,
        games: data.games.filter(game => game.rating && game.rating > 0).sort((a, b) => (a.rating || 0) - (b.rating || 0)) // Показываем только игры с рейтингом и сортируем по рейтингу (от меньшего к большему)
      }))
      .filter(yearData => yearData.avgRating > 0) // Только годы с рейтингом
      .sort((a, b) => a.avgRating - b.avgRating) // Сортируем годы по среднему рейтингу (от меньшего к большему)
      .slice(0, 3) // Берем топ 3 года с самым низким рейтингом

    return result
  }, [data])

  const statusStats = useMemo(() => {
    if (!isGamesResponse(data)) return []

    const statusMap = new Map<string, { count: number; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.status) {
        const status = game.status.toLowerCase()
        
        if (!statusMap.has(status)) {
          statusMap.set(status, { count: 0, ratings: [] })
        }
        
        const statusData = statusMap.get(status)!
        statusData.count++
        
        if (game.rating && game.rating > 0) {
          statusData.ratings.push(game.rating)
        }
      }
    })
    }

    // Фильтруем только нужные статусы и только те, где есть игры
    const validStatuses = ['completed', 'abandoned', 'played', 'retired', 'shelved']
    
    const result = validStatuses
      .filter(status => statusMap.has(status) && statusMap.get(status)!.count > 0)
      .map(status => {
        const statusData = statusMap.get(status)!
        return {
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count: statusData.count,
          avgRating: statusData.ratings.length > 0 
            ? statusData.ratings.reduce((sum, rating) => sum + rating, 0) / statusData.ratings.length 
            : 0
        }
      })
      .sort((a, b) => b.avgRating - a.avgRating) // Сортируем по убыванию рейтинга

    return result
  }, [data])

  const developerStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    const developerMap = new Map<string, { count: number; ratings: number[]; games: Game[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      // Получаем разработчиков только из IGDB данных
      const developers: string[] = []
      
      // Из IGDB данных
      if (game.igdbgameinfo?.developers_readable) {
        developers.push(...game.igdbgameinfo.developers_readable)
      }
      
      // Добавляем игру к каждому разработчику
      developers.forEach(dev => {
        if (dev && dev.trim()) {
          const cleanDev = dev.trim()
          
          if (!developerMap.has(cleanDev)) {
            developerMap.set(cleanDev, { count: 0, ratings: [], games: [] })
          }
          
          const devData = developerMap.get(cleanDev)!
          devData.count++
          devData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            devData.ratings.push(game.rating)
          }
        }
      })
    })
    }

    // MOST PLAYED DEVELOPERS - сортируем по количеству игр (минимум N игр)
    const playedDevelopers = Array.from(developerMap.entries())
      .filter(([dev, data]) => data.count >= minDeveloperGames)
      .map(([developer, data]) => ({
        developer,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0,
        games: data.games
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Топ 10 разработчиков

    // HIGHEST RATED DEVELOPERS - сортируем по среднему рейтингу (минимум N игр с рейтингом)
    const ratedDevelopers = Array.from(developerMap.entries())
      .filter(([dev, data]) => data.ratings.length >= minDeveloperGames) // Минимум N игр с рейтингом
      .map(([developer, data]) => ({
        developer,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length,
        games: data.games.filter(game => game.rating && game.rating > 0) // Показываем только игры с рейтингом
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10) // Топ 10 разработчиков

    // LOWEST RATED DEVELOPERS - сортируем по среднему рейтингу в обратном порядке (минимум N игр с рейтингом)
    const lowestDevelopers = Array.from(developerMap.entries())
      .filter(([dev, data]) => data.ratings.length >= minDeveloperGames) // Минимум N игр с рейтингом
      .map(([developer, data]) => ({
        developer,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length,
        games: data.games.filter(game => game.rating && game.rating > 0) // Показываем только игры с рейтингом
      }))
      .sort((a, b) => a.avgRating - b.avgRating)
      .slice(0, 10) // Топ 10 разработчиков

    return { played: playedDevelopers, rated: ratedDevelopers, lowest: lowestDevelopers }
  }, [data, minDeveloperGames])

  const keywordsStats = useMemo(() => {
    if (!isGamesResponse(data)) return { common: [], rated: [], lowest: [] }

    // Собираем все ключевые слова с информацией об играх
    const keywordMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.igdbgameinfo?.keywords_readable) {
        game.igdbgameinfo.keywords_readable.forEach((keyword: string) => {
          if (!keywordMap.has(keyword)) {
            keywordMap.set(keyword, { count: 0, games: [], ratings: [] })
          }
          
          const keywordData = keywordMap.get(keyword)!
          keywordData.count++
          keywordData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            keywordData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST COMMON KEYWORDS - сортируем по количеству игр
    const commonKeywords = Array.from(keywordMap.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30) // Топ 30 самых частых

    // MOST RATED KEYWORDS - сортируем по среднему рейтингу (минимум 3 игры)
    const ratedKeywords = Array.from(keywordMap.entries())
      .filter(([keyword, data]) => data.count >= 3) // Минимум 3 игры с этим ключевым словом
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0
      }))
      .filter(item => item.avgRating > 0) // Только те, у которых есть рейтинг
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 30) // Топ 30 с самым высоким рейтингом

    // LEAST FAVORITE KEYWORDS - сортируем по среднему рейтингу в обратном порядке (минимум 3 игры)
    const lowestKeywords = Array.from(keywordMap.entries())
      .filter(([keyword, data]) => data.count >= 3) // Минимум 3 игры с этим ключевым словом
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0
      }))
      .filter(item => item.avgRating > 0) // Только те, у которых есть рейтинг
      .sort((a, b) => a.avgRating - b.avgRating)
      .slice(0, 30) // Топ 30 с самым низким рейтингом

    return { common: commonKeywords, rated: ratedKeywords, lowest: lowestKeywords }
  }, [data])

  const genresStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    // Собираем все жанры с информацией об играх
    const genreMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.igdbgameinfo?.genres_readable) {
        game.igdbgameinfo.genres_readable.forEach((genre: string) => {
          if (!genreMap.has(genre)) {
            genreMap.set(genre, { count: 0, games: [], ratings: [] })
          }
          
          const genreData = genreMap.get(genre)!
          genreData.count++
          genreData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            genreData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST PLAYED GENRES - сортируем по количеству игр
    const playedGenres = Array.from(genreMap.entries())
      .map(([genre, data]) => ({
        genre,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0
      }))
      .sort((a, b) => b.count - a.count)

    // HIGHEST RATED GENRES - сортируем по среднему рейтингу (минимум 3 игры с рейтингом)
    const ratedGenres = Array.from(genreMap.entries())
      .filter(([genre, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([genre, data]) => ({
        genre,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating)

    // LOWEST RATED GENRES - сортируем по среднему рейтингу в обратном порядке (минимум 3 игры с рейтингом)
    const lowestGenres = Array.from(genreMap.entries())
      .filter(([genre, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([genre, data]) => ({
        genre,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => a.avgRating - b.avgRating)

    return { played: playedGenres, rated: ratedGenres, lowest: lowestGenres }
  }, [data])

  const gameModesStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    // Собираем все игровые режимы с информацией об играх
    const gameModeMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.igdbgameinfo?.game_modes_readable) {
        game.igdbgameinfo.game_modes_readable.forEach((gameMode: string) => {
          if (!gameModeMap.has(gameMode)) {
            gameModeMap.set(gameMode, { count: 0, games: [], ratings: [] })
          }
          
          const gameModeData = gameModeMap.get(gameMode)!
          gameModeData.count++
          gameModeData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            gameModeData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST PLAYED GAME MODES - сортируем по количеству игр
    const playedGameModes = Array.from(gameModeMap.entries())
      .map(([gameMode, data]) => ({
        gameMode,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
          : 0
      }))
      .sort((a, b) => b.count - a.count)

    // HIGHEST RATED GAME MODES - сортируем по среднему рейтингу (минимум 3 игры с рейтингом)
    const ratedGameModes = Array.from(gameModeMap.entries())
      .filter(([gameMode, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([gameMode, data]) => ({
        gameMode,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating)

    // LOWEST RATED GAME MODES - сортируем по среднему рейтингу в обратном порядке (минимум 3 игры с рейтингом)
    const lowestGameModes = Array.from(gameModeMap.entries())
      .filter(([gameMode, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([gameMode, data]) => ({
        gameMode,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => a.avgRating - b.avgRating)

    return { played: playedGameModes, rated: ratedGameModes, lowest: lowestGameModes }
  }, [data])

  const gameEnginesStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    // Собираем все игровые движки с информацией об играх
    const gameEngineMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.igdbgameinfo?.game_engines_readable) {
        game.igdbgameinfo.game_engines_readable.forEach((gameEngine: string) => {
          if (!gameEngineMap.has(gameEngine)) {
            gameEngineMap.set(gameEngine, { count: 0, games: [], ratings: [] })
          }
          
          const gameEngineData = gameEngineMap.get(gameEngine)!
          gameEngineData.count++
          gameEngineData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            gameEngineData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST PLAYED GAME ENGINES - сортируем по количеству игр
    const playedGameEngines = Array.from(gameEngineMap.entries())
      .map(([gameEngine, data]) => ({
        gameEngine,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
          : 0
      }))
      .filter(engine => engine.count >= 3) // Минимум 3 игры
      .sort((a, b) => b.count - a.count) // Сортировка по убыванию количества

    // HIGHEST RATED GAME ENGINES - сортируем по среднему рейтингу
    const ratedGameEngines = Array.from(gameEngineMap.entries())
      .filter(([gameEngine, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([gameEngine, data]) => ({
        gameEngine,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating) // Сортировка по убыванию рейтинга

    // LOWEST RATED GAME ENGINES - сортируем по среднему рейтингу в обратном порядке
    const lowestGameEngines = Array.from(gameEngineMap.entries())
      .filter(([gameEngine, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([gameEngine, data]) => ({
        gameEngine,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => a.avgRating - b.avgRating) // Сортировка по возрастанию рейтинга

    return { played: playedGameEngines, rated: ratedGameEngines, lowest: lowestGameEngines }
  }, [data])

  const themesStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    // Собираем все темы с информацией об играх
    const themeMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.igdbgameinfo?.themes_readable) {
        game.igdbgameinfo.themes_readable.forEach((theme: string) => {
          if (!themeMap.has(theme)) {
            themeMap.set(theme, { count: 0, games: [], ratings: [] })
          }
          
          const themeData = themeMap.get(theme)!
          themeData.count++
          themeData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            themeData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST PLAYED THEMES - сортируем по количеству игр
    const playedThemes = Array.from(themeMap.entries())
      .map(([theme, data]) => ({
        theme,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
          : 0
      }))
      .filter(theme => theme.count >= 3) // Минимум 3 игры
      .sort((a, b) => b.count - a.count) // Сортировка по убыванию количества

    // HIGHEST RATED THEMES - сортируем по среднему рейтингу
    const ratedThemes = Array.from(themeMap.entries())
      .filter(([theme, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([theme, data]) => ({
        theme,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating) // Сортировка по убыванию рейтинга

    // LOWEST RATED THEMES - сортируем по среднему рейтингу в обратном порядке
    const lowestThemes = Array.from(themeMap.entries())
      .filter(([theme, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([theme, data]) => ({
        theme,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => a.avgRating - b.avgRating) // Сортировка по возрастанию рейтинга

    return { played: playedThemes, rated: ratedThemes, lowest: lowestThemes }
  }, [data])

  const seriesStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    // Собираем все серии с информацией об играх
    const seriesMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.igdbgameinfo?.series_readable) {
        game.igdbgameinfo.series_readable.forEach((series: string) => {
          if (!seriesMap.has(series)) {
            seriesMap.set(series, { count: 0, games: [], ratings: [] })
          }
          
          const seriesData = seriesMap.get(series)!
          seriesData.count++
          seriesData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            seriesData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST PLAYED SERIES - сортируем по количеству игр
    const playedSeries = Array.from(seriesMap.entries())
      .map(([series, data]) => ({
        series,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
          : 0
      }))
      .filter(series => series.count >= 3) // Минимум 3 игры
      .sort((a, b) => b.count - a.count) // Сортировка по убыванию количества

    // HIGHEST RATED SERIES - сортируем по среднему рейтингу
    const ratedSeries = Array.from(seriesMap.entries())
      .filter(([series, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([series, data]) => ({
        series,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating) // Сортировка по убыванию рейтинга

    // LOWEST RATED SERIES - сортируем по среднему рейтингу в обратном порядке
    const lowestSeries = Array.from(seriesMap.entries())
      .filter(([series, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([series, data]) => ({
        series,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => a.avgRating - b.avgRating) // Сортировка по возрастанию рейтинга

    return { played: playedSeries, rated: ratedSeries, lowest: lowestSeries }
  }, [data])

  const franchisesStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    // Собираем все франшизы с информацией об играх
    const franchiseMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.igdbgameinfo?.franchises_readable) {
        game.igdbgameinfo.franchises_readable.forEach((franchise: string) => {
          if (!franchiseMap.has(franchise)) {
            franchiseMap.set(franchise, { count: 0, games: [], ratings: [] })
          }
          
          const franchiseData = franchiseMap.get(franchise)!
          franchiseData.count++
          franchiseData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            franchiseData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST PLAYED FRANCHISES - сортируем по количеству игр
    const playedFranchises = Array.from(franchiseMap.entries())
      .map(([franchise, data]) => ({
        franchise,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
          : 0
      }))
      .filter(franchise => franchise.count >= 3) // Минимум 3 игры
      .sort((a, b) => b.count - a.count) // Сортировка по убыванию количества

    // HIGHEST RATED FRANCHISES - сортируем по среднему рейтингу
    const ratedFranchises = Array.from(franchiseMap.entries())
      .filter(([franchise, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([franchise, data]) => ({
        franchise,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating) // Сортировка по убыванию рейтинга

    // LOWEST RATED FRANCHISES - сортируем по среднему рейтингу в обратном порядке
    const lowestFranchises = Array.from(franchiseMap.entries())
      .filter(([franchise, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([franchise, data]) => ({
        franchise,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => a.avgRating - b.avgRating) // Сортировка по возрастанию рейтинга

    return { played: playedFranchises, rated: ratedFranchises, lowest: lowestFranchises }
  }, [data])

  const platformsStats = useMemo(() => {
    if (!isGamesResponse(data)) return { played: [], rated: [], lowest: [] }

    // Собираем все платформы с информацией об играх
    const platformMap = new Map<string, { count: number; games: Game[]; ratings: number[] }>()

    if (isGamesResponse(data)) {
      data.content.games.forEach((game: Game) => {
      if (game.platforms && Array.isArray(game.platforms)) {
        game.platforms.forEach((platform: string) => {
          if (!platformMap.has(platform)) {
            platformMap.set(platform, { count: 0, games: [], ratings: [] })
          }
          
          const platformData = platformMap.get(platform)!
          platformData.count++
          platformData.games.push(game)
          
          if (game.rating && game.rating > 0) {
            platformData.ratings.push(game.rating)
          }
        })
      }
    })
    }

    // MOST PLAYED PLATFORMS - сортируем по количеству игр
    const playedPlatforms = Array.from(platformMap.entries())
      .map(([platform, data]) => ({
        platform,
        count: data.count,
        avgRating: data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
          : 0
      }))
      .filter(platform => platform.count >= 3) // Минимум 3 игры
      .sort((a, b) => b.count - a.count) // Сортировка по убыванию количества

    // HIGHEST RATED PLATFORMS - сортируем по среднему рейтингу
    const ratedPlatforms = Array.from(platformMap.entries())
      .filter(([platform, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([platform, data]) => ({
        platform,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => b.avgRating - a.avgRating) // Сортировка по убыванию рейтинга

    // LOWEST RATED PLATFORMS - сортируем по среднему рейтингу в обратном порядке
    const lowestPlatforms = Array.from(platformMap.entries())
      .filter(([platform, data]) => data.ratings.length >= 3) // Минимум 3 игры с рейтингом
      .map(([platform, data]) => ({
        platform,
        count: data.ratings.length, // Считаем только игры с рейтингом
        avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
      }))
      .sort((a, b) => a.avgRating - b.avgRating) // Сортировка по возрастанию рейтинга

    return { played: playedPlatforms, rated: ratedPlatforms, lowest: lowestPlatforms }
  }, [data])

  // Данные для графика mastered игр
  const masteredGamesData = useMemo(() => {
    if (!isGamesResponse(data)) return []

    // Фильтруем только mastered игры
    const masteredGames = data.content.games.filter(game => 
      game.mastered === 'yes' && game.rating && game.rating > 0
    )

    if (masteredGames.length === 0) return []

    // Сортируем по рейтингу для лучшего отображения
    const sortedGames = masteredGames.sort((a, b) => (a.rating || 0) - (b.rating || 0))

    // Создаем данные для графика - каждая игра как отдельный элемент
    const chartData: MasteredGameData[] = sortedGames.map((game, index) => {
      let color = '#10B981' // зеленый по умолчанию
      
      // Определяем цвет в зависимости от рейтинга
      if (game.rating! >= 7) {
        color = '#10B981' // зеленый для рейтингов 7-10
      } else if (game.rating! >= 5) {
        color = '#F59E0B' // желтый для рейтингов 5-6
      } else {
        color = '#EF4444' // красный для рейтингов 1-4
      }

      return {
        name: game.name,
        rating: game.rating!,
        year: game.releaseDate ? parseInt(game.releaseDate.split('/')[2]) : new Date().getFullYear(),
        color: color,
        index: `Game ${index + 1}`
      }
    })

    return chartData
  }, [data])

  // Данные для ремейков
  const remakesData = useMemo(() => {
    if (!isGamesResponse(data)) return { all: [], highest: [], lowest: [] }

    const remakes = isGamesResponse(data) ? data.content.games.filter(game => game.isRemake === 'yes') : []
    
    const allRemakes = remakes.map(game => ({
      ...game,
      displayRating: game.rating && game.rating > 0 ? game.rating : 0
    }))

    const ratedRemakes = remakes.filter(game => game.rating && game.rating > 0)
    
    const highestRated = [...ratedRemakes].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    const lowestRated = [...ratedRemakes].sort((a, b) => (a.rating || 0) - (b.rating || 0))

    return {
      all: allRemakes,
      highest: highestRated,
      lowest: lowestRated
    }
  }, [data])

  // Данные для ремастеров
  const remastersData = useMemo(() => {
    if (!isGamesResponse(data)) return { all: [], highest: [], lowest: [] }

    const remasters = isGamesResponse(data) ? data.content.games.filter(game => game.isRemaster === 'yes') : []
    
    const allRemasters = remasters.map(game => ({
      ...game,
      displayRating: game.rating && game.rating > 0 ? game.rating : 0
    }))

    const ratedRemasters = remasters.filter(game => game.rating && game.rating > 0)
    
    const highestRated = [...ratedRemasters].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    const lowestRated = [...ratedRemasters].sort((a, b) => (a.rating || 0) - (b.rating || 0))

    return {
      all: allRemasters,
      highest: highestRated,
      lowest: lowestRated
    }
  }, [data])

  // Данные для расширений
  const extensionsData = useMemo(() => {
    if (!isGamesResponse(data)) return { all: [], highest: [], lowest: [] }

    const extensions = isGamesResponse(data) ? data.content.games.filter(game => game.isExpansion === 'yes') : []
    
    const allExtensions = extensions.map(game => ({
      ...game,
      displayRating: game.rating && game.rating > 0 ? game.rating : 0
    }))

    const ratedExtensions = extensions.filter(game => game.rating && game.rating > 0)
    
    const highestRated = [...ratedExtensions].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    const lowestRated = [...ratedExtensions].sort((a, b) => (a.rating || 0) - (b.rating || 0))

    return {
      all: allExtensions,
      highest: highestRated,
      lowest: lowestRated
    }
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">Year: {label}</p>
          {activeTab === 'games' ? (
            <p className="text-primary">
              Games: {data.count}
            </p>
          ) : (
            <>
              <p className="text-secondary">
                Avg Rating: {formatRating(data.avgRating)}
              </p>
              <p className="text-primary">
                Games: {data.count}
              </p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* BY YEAR Chart Section */}
      <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">BY YEAR</h2>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('games')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'games'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              GAMES
            </button>
            <button
              onClick={() => setActiveTab('ratings')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'ratings'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              RATINGS
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={yearData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="year" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={activeTab === 'games' ? [0, 'dataMax'] : [0, 5]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={activeTab === 'games' ? 'count' : 'avgRating'}
                  fill={activeTab === 'games' ? '#6366f1' : '#8b5cf6'}
                  radius={[4, 4, 0, 0]}
                  onClick={(data: any) => {
                    if (data && data.year) {
                      const url = `https://backloggd.com/u/${username}/games/last_played/type:played;release_year:${data.year}/`
                      window.open(url, '_blank')
                    }
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Total Games</h3>
              <p className="text-2xl font-bold text-white">
                {isGamesResponse(data) ? data.content.games.length : 0}
              </p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Year Range</h3>
              <p className="text-2xl font-bold text-white">
                {yearData.length > 0 
                  ? `${Math.min(...yearData.map(d => d.year))} - ${Math.max(...yearData.map(d => d.year))}`
                  : 'N/A'
                }
              </p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                {activeTab === 'games' ? 'Peak Year' : 'Best Year'}
              </h3>
              <p className="text-2xl font-bold text-white">
                {yearData.length > 0 
                  ? (() => {
                      const peak = yearData.reduce((max, current) => 
                        activeTab === 'games' 
                          ? (current.count > max.count ? current : max)
                          : (current.avgRating > max.avgRating ? current : max)
                      )
                      return peak.year
                    })()
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HIGHEST RATED YEARS Section */}
      {yearsWithGames.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">HIGHEST RATED YEARS</h2>
            <p className="text-gray-400 text-sm mt-1">(at least 5 games played)</p>
          </div>
          
          <div className="p-6 space-y-8">
            {yearsWithGames.map((yearData) => (
              <div key={yearData.year} className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Year Header */}
                <div className="flex-shrink-0 w-full lg:w-48 text-center lg:text-left">
                  <h3 className="text-3xl font-bold text-white">{yearData.year}s</h3>
                  <p className="text-lg text-gray-300">
                    ★ Average {formatRating(yearData.avgRating)}
                  </p>
                </div>
                
                {/* Games Horizontal Scroll */}
                <div className="flex-grow overflow-x-auto whitespace-nowrap py-2 -my-2">
                  <div className="inline-flex gap-2">
                            {yearData.games.map((game, index) => (
                              <a
                                key={`${yearData.year}-${game.id || index}`}
                                href={game.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group cursor-pointer flex-shrink-0 w-20 h-28 block"
                                title={game.name}
                              >
                                <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                          {game.image ? (
                            <Image
                              src={game.image}
                              alt={game.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex items-center justify-center h-full">
                                      <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                                    </div>
                                  `
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-gray-500 text-xs text-center px-1">
                                {game.name}
                              </span>
                            </div>
                          )}
                          
                          {/* Rating overlay */}
                          {game.rating && game.rating > 0 && (
                            <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                              {game.rating}
                            </div>
                          )}
                        </div>
                              </a>
                            ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOWEST RATED YEARS Section */}
      {lowestYearsWithGames.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">LOWEST RATED YEARS</h2>
            <p className="text-gray-400 text-sm mt-1">(at least 5 games played)</p>
          </div>
          
          <div className="p-6 space-y-8">
            {lowestYearsWithGames.map((yearData) => (
              <div key={yearData.year} className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Year Header */}
                <div className="flex-shrink-0 w-full lg:w-48 text-center lg:text-left">
                  <h3 className="text-3xl font-bold text-white">{yearData.year}s</h3>
                  <p className="text-lg text-gray-300">
                    ★ Average {formatRating(yearData.avgRating)}
                  </p>
                </div>
                
                {/* Games Horizontal Scroll */}
                <div className="flex-grow overflow-x-auto whitespace-nowrap py-2 -my-2">
                  <div className="inline-flex gap-2">
                            {yearData.games.map((game, index) => (
                              <a
                                key={`${yearData.year}-${game.id || index}`}
                                href={game.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group cursor-pointer flex-shrink-0 w-20 h-28 block"
                                title={game.name}
                              >
                                <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                          {game.image ? (
                            <Image
                              src={game.image}
                              alt={game.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex items-center justify-center h-full">
                                      <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                                    </div>
                                  `
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-gray-500 text-xs text-center px-1">
                                {game.name}
                              </span>
                            </div>
                          )}
                          
                          {/* Rating overlay */}
                          {game.rating && game.rating > 0 && (
                            <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                              {game.rating}
                            </div>
                          )}
                        </div>
                              </a>
                            ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAVORITE GAME MODES Section */}
      {(gameModesStats.played.length > 0 || gameModesStats.rated.length > 0 || gameModesStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">GAME MODES ANALYSIS</h2>
            <p className="text-gray-400 text-sm mt-1">Game modes from IGDB</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setGameModesTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  gameModesTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED GAME MODES
              </button>
              <button
                onClick={() => setGameModesTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  gameModesTab === 'rated'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED GAME MODES
              </button>
              <button
                onClick={() => setGameModesTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  gameModesTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED GAME MODES
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {gameModesTab === 'played' && gameModesStats.played.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = gameModesStats.played.slice(0, 10)
                              const othersCount = gameModesStats.played.slice(10).reduce((sum, g) => sum + g.count, 0)
                              const total = gameModesStats.played.reduce((sum, g) => sum + g.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.gameMode,
                                value: item.count,
                                percentage: ((item.count / total) * 100).toFixed(1)
                              }))
                              
                              if (othersCount > 0) {
                                data.push({
                                  name: 'Others',
                                  value: othersCount,
                                  percentage: ((othersCount / total) * 100).toFixed(1)
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = gameModesStats.played.slice(0, 10)
                              const othersCount = gameModesStats.played.slice(10).reduce((sum, g) => sum + g.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} games (${props.payload.percentage}%)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Top Game Modes</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = gameModesStats.played.slice(0, 10)
                        const othersCount = gameModesStats.played.slice(10).reduce((sum, g) => sum + g.count, 0)
                        const total = gameModesStats.played.reduce((sum, g) => sum + g.count, 0)
                        
                        const legendItems = top10.map((item, index) => {
                          const percentage = ((item.count / total) * 100).toFixed(1)
                          return (
                            <div key={item.gameMode} className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">{item.gameMode}</p>
                                <p className="text-gray-400 text-xs">{percentage}%</p>
                              </div>
                              <div className="text-white font-bold text-xs">{item.count}</div>
                            </div>
                          )
                        })
                        
                        if (othersCount > 0) {
                          const othersPercentage = ((othersCount / total) * 100).toFixed(1)
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersPercentage}%</p>
                              </div>
                              <div className="text-white font-bold text-xs">{othersCount}</div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {gameModesTab === 'rated' && gameModesStats.rated.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = gameModesStats.rated.slice(0, 10)
                              const othersAvgRating = gameModesStats.rated.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(gameModesStats.rated.slice(10).length, 1)
                              const othersCount = gameModesStats.rated.slice(10).reduce((sum, g) => sum + g.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.gameMode,
                                value: item.avgRating,
                                count: item.count
                              }))
                              
                              if (othersCount > 0) {
                                data.push({
                                  name: 'Others',
                                  value: othersAvgRating,
                                  count: othersCount
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = gameModesStats.rated.slice(0, 10)
                              const othersCount = gameModesStats.rated.slice(10).reduce((sum, g) => sum + g.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `★ ${formatRating(Number(value))} (${props.payload.count} games)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Highest Rated Game Modes</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = gameModesStats.rated.slice(0, 10)
                        const othersAvgRating = gameModesStats.rated.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(gameModesStats.rated.slice(10).length, 1)
                        const othersCount = gameModesStats.rated.slice(10).reduce((sum, g) => sum + g.count, 0)
                        
                        const legendItems = top10.map((item, index) => (
                          <div key={item.gameMode} className="flex items-center gap-1.5">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">{item.gameMode}</p>
                              <p className="text-gray-400 text-xs">{item.count} games</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-white font-bold text-xs">{formatRating(item.avgRating)}</span>
                            </div>
                          </div>
                        ))
                        
                        if (othersCount > 0) {
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersCount} games</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400 text-xs">★</span>
                                <span className="text-white font-bold text-xs">{formatRating(othersAvgRating)}</span>
                              </div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {gameModesTab === 'lowest' && gameModesStats.lowest.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = gameModesStats.lowest.slice(0, 10)
                              const othersAvgRating = gameModesStats.lowest.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(gameModesStats.lowest.slice(10).length, 1)
                              const othersCount = gameModesStats.lowest.slice(10).reduce((sum, g) => sum + g.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.gameMode,
                                value: item.avgRating,
                                count: item.count
                              }))
                              
                              if (othersCount > 0) {
                                data.push({
                                  name: 'Others',
                                  value: othersAvgRating,
                                  count: othersCount
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = gameModesStats.lowest.slice(0, 10)
                              const othersCount = gameModesStats.lowest.slice(10).reduce((sum, g) => sum + g.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `★ ${formatRating(Number(value))} (${props.payload.count} games)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Lowest Rated Game Modes</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = gameModesStats.lowest.slice(0, 10)
                        const othersAvgRating = gameModesStats.lowest.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(gameModesStats.lowest.slice(10).length, 1)
                        const othersCount = gameModesStats.lowest.slice(10).reduce((sum, g) => sum + g.count, 0)
                        
                        const legendItems = top10.map((item, index) => (
                          <div key={item.gameMode} className="flex items-center gap-1.5">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">{item.gameMode}</p>
                              <p className="text-gray-400 text-xs">{item.count} games</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-white font-bold text-xs">{formatRating(item.avgRating)}</span>
                            </div>
                          </div>
                        ))
                        
                        if (othersCount > 0) {
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersCount} games</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400 text-xs">★</span>
                                <span className="text-white font-bold text-xs">{formatRating(othersAvgRating)}</span>
                              </div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {gameModesTab === 'played' && gameModesStats.played.length === 0 && (
              <p className="text-gray-400 text-center py-8">No game modes found</p>
            )}
            
            {gameModesTab === 'rated' && gameModesStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated game modes found (need at least 3 games per mode)</p>
            )}
            
            {gameModesTab === 'lowest' && gameModesStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated game modes found (need at least 3 games per mode)</p>
            )}
          </div>
        </div>
      )}

      {/* FAVORITE GAME ENGINES Section */}
      {(gameEnginesStats.played.length > 0 || gameEnginesStats.rated.length > 0 || gameEnginesStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">FAVORITE GAME ENGINES</h2>
            <p className="text-gray-400 text-sm mt-1">Game engines from IGDB</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setGameEnginesTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  gameEnginesTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED GAME ENGINES
              </button>
              <button
                onClick={() => setGameEnginesTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  gameEnginesTab === 'rated'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED GAME ENGINES
              </button>
              <button
                onClick={() => setGameEnginesTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  gameEnginesTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED GAME ENGINES
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {gameEnginesTab === 'played' && gameEnginesStats.played.length > 0 && (
              <div className="space-y-4">
                {gameEnginesStats.played.slice(0, 10).map((engine, index) => {
                  const totalGames = gameEnginesStats.played.reduce((sum, e) => sum + e.count, 0)
                  const percentage = ((engine.count / totalGames) * 100).toFixed(1)
                  
                  return (
                    <div key={engine.gameEngine} className="flex items-center space-x-4">
                      {/* Percentage Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-teal-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {percentage}%
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-teal-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Engine Name and Count */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{engine.gameEngine}</div>
                        <div className="text-gray-400 text-xs">{engine.count} games</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {gameEnginesTab === 'played' && gameEnginesStats.played.length === 0 && (
              <p className="text-gray-400 text-center py-8">No game engines found</p>
            )}
            
            {gameEnginesTab === 'rated' && gameEnginesStats.rated.length > 0 && (
              <div className="space-y-4">
                {gameEnginesStats.rated.slice(0, 10).map((engine, index) => {
                  const maxRating = Math.max(...gameEnginesStats.rated.map(e => e.avgRating))
                  const percentage = ((engine.avgRating / maxRating) * 100).toFixed(1)
                  
                  return (
                    <div key={engine.gameEngine} className="flex items-center space-x-4">
                      {/* Rating Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-purple-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {engine.avgRating.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-purple-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Engine Name and Rating */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{engine.gameEngine}</div>
                        <div className="text-gray-400 text-xs">
                          {engine.count} games
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {gameEnginesTab === 'lowest' && gameEnginesStats.lowest.length > 0 && (
              <div className="space-y-4">
                {gameEnginesStats.lowest.slice(0, 10).map((engine, index) => {
                  const maxRating = Math.max(...gameEnginesStats.lowest.map(e => e.avgRating))
                  const percentage = ((engine.avgRating / maxRating) * 100).toFixed(1)
                  
                  return (
                    <div key={engine.gameEngine} className="flex items-center space-x-4">
                      {/* Rating Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-red-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {engine.avgRating.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-red-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Engine Name and Rating */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{engine.gameEngine}</div>
                        <div className="text-gray-400 text-xs">
                          {engine.count} games
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {gameEnginesTab === 'rated' && gameEnginesStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated game engines found (need at least 3 games per engine)</p>
            )}
            
            {gameEnginesTab === 'lowest' && gameEnginesStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated game engines found (need at least 3 games per engine)</p>
            )}
          </div>
        </div>
      )}


      {/* DEVELOPERS ANALYSIS Section */}
      {(developerStats.played.length > 0 || developerStats.rated.length > 0 || developerStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">DEVELOPERS ANALYSIS</h2>
            <p className="text-gray-400 text-sm mt-1">Top developers from your collection (min. {minDeveloperGames} games)</p>
            
            {/* Минимальный порог игр */}
            <div className="mt-4 flex items-center gap-3">
              <label htmlFor="minDeveloperGames" className="text-gray-300 text-sm font-medium">
              Minimum game threshold:              </label>
              <input
                type="number"
                id="minDeveloperGames"
                value={minDeveloperGames}
                onChange={(e) => setMinDeveloperGames(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="50"
                className="w-20 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-primary"
              />
              <span className="text-gray-400 text-sm">games</span>
            </div>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setDeveloperTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  developerTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED
              </button>
              <button
                onClick={() => setDeveloperTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  developerTab === 'rated'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED
              </button>
              <button
                onClick={() => setDeveloperTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  developerTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {developerTab === 'played' && developerStats.played.length > 0 && (
              <div className="space-y-6">
                {developerStats.played.map((devData, index) => (
                <div key={devData.developer} className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  {/* Developer Info */}
                  <div className="flex-shrink-0 w-full lg:w-64">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{devData.developer}</h3>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>{devData.count} {devData.count === 1 ? 'game' : 'games'}</span>
                          {devData.avgRating > 0 && (
                            <span>★ {formatRating(devData.avgRating)} avg</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Games Horizontal Scroll */}
                  <div className="flex-grow overflow-x-auto whitespace-nowrap py-2 -my-2">
                    <div className="inline-flex gap-2">
                      {devData.games
                        .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Сортируем игры по рейтингу
                        .slice(0, 12) // Показываем максимум 12 игр
                        .map((game, gameIndex) => (
                        <a
                          key={`${devData.developer}-${game.id || gameIndex}`}
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group cursor-pointer flex-shrink-0 w-16 h-24 block"
                          title={game.name}
                        >
                          <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                            {game.image ? (
                              <Image
                                src={game.image}
                                alt={game.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex items-center justify-center h-full">
                                        <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                                      </div>
                                    `
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-gray-500 text-xs text-center px-1">
                                  {game.name}
                                </span>
                              </div>
                            )}
                            
                            {/* Rating overlay */}
                            {game.rating && game.rating > 0 && (
                              <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                                {game.rating}
                              </div>
                            )}
                          </div>
                        </a>
                      ))}
                      {devData.games.length > 12 && (
                        <div className="flex-shrink-0 w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center">
                            +{devData.games.length - 12} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
            
            {developerTab === 'rated' && developerStats.rated.length > 0 && (
              <div className="space-y-6">
                {developerStats.rated.map((devData, index) => (
                <div key={devData.developer} className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  {/* Developer Info */}
                  <div className="flex-shrink-0 w-full lg:w-64">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{devData.developer}</h3>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>{devData.count} {devData.count === 1 ? 'game' : 'games'}</span>
                          {devData.avgRating > 0 && (
                            <span>★ {formatRating(devData.avgRating)} avg</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Games Horizontal Scroll */}
                  <div className="flex-grow overflow-x-auto whitespace-nowrap py-2 -my-2">
                    <div className="inline-flex gap-2">
                      {devData.games
                        .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Сортируем игры по рейтингу
                        .slice(0, 12) // Показываем максимум 12 игр
                        .map((game, gameIndex) => (
                        <a
                          key={`${devData.developer}-${game.id || gameIndex}`}
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group cursor-pointer flex-shrink-0 w-16 h-24 block"
                          title={game.name}
                        >
                          <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                            {game.image ? (
                              <Image
                                src={game.image}
                                alt={game.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex items-center justify-center h-full">
                                        <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                                      </div>
                                    `
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-gray-500 text-xs text-center px-1">
                                  {game.name}
                                </span>
                              </div>
                            )}
                            
                            {/* Rating overlay */}
                            {game.rating && game.rating > 0 && (
                              <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                                {game.rating}
                              </div>
                            )}
                          </div>
                        </a>
                      ))}
                      {devData.games.length > 12 && (
                        <div className="flex-shrink-0 w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center">
                            +{devData.games.length - 12} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
            
            {developerTab === 'lowest' && developerStats.lowest.length > 0 && (
              <div className="space-y-6">
                {developerStats.lowest.map((devData, index) => (
                <div key={devData.developer} className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  {/* Developer Info */}
                  <div className="flex-shrink-0 w-full lg:w-64">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{devData.developer}</h3>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>{devData.count} {devData.count === 1 ? 'game' : 'games'}</span>
                          {devData.avgRating > 0 && (
                            <span>★ {formatRating(devData.avgRating)} avg</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Games Horizontal Scroll */}
                  <div className="flex-grow overflow-x-auto whitespace-nowrap py-2 -my-2">
                    <div className="inline-flex gap-2">
                      {devData.games
                        .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Сортируем игры по рейтингу
                        .slice(0, 12) // Показываем максимум 12 игр
                        .map((game, gameIndex) => (
                        <a
                          key={`${devData.developer}-${game.id || gameIndex}`}
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group cursor-pointer flex-shrink-0 w-16 h-24 block"
                          title={game.name}
                        >
                          <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                            {game.image ? (
                              <Image
                                src={game.image}
                                alt={game.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex items-center justify-center h-full">
                                        <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                                      </div>
                                    `
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-gray-500 text-xs text-center px-1">
                                  {game.name}
                                </span>
                              </div>
                            )}
                            
                            {/* Rating overlay */}
                            {game.rating && game.rating > 0 && (
                              <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                                {game.rating}
                              </div>
                            )}
                          </div>
                        </a>
                      ))}
                      {devData.games.length > 12 && (
                        <div className="flex-shrink-0 w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center">
                            +{devData.games.length - 12} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      {/* GENRES ANALYSIS Section */}
      {(genresStats.played.length > 0 || genresStats.rated.length > 0 || genresStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">GENRES ANALYSIS</h2>
            <p className="text-gray-400 text-sm mt-1">Game genres from IGDB</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setGenresTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  genresTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED GENRES
              </button>
              <button
                onClick={() => setGenresTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  genresTab === 'rated'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED GENRES
              </button>
              <button
                onClick={() => setGenresTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  genresTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED GENRES
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {genresTab === 'played' && genresStats.played.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={(() => {
                            const top10 = genresStats.played.slice(0, 10)
                            const othersCount = genresStats.played.slice(10).reduce((sum, g) => sum + g.count, 0)
                            const total = genresStats.played.reduce((sum, g) => sum + g.count, 0)
                            
                            const data = top10.map((item, index) => ({
                              name: item.genre,
                              value: item.count,
                              percentage: ((item.count / total) * 100).toFixed(1)
                            }))
                            
                            if (othersCount > 0) {
                              data.push({
                                name: 'Others',
                                value: othersCount,
                                percentage: ((othersCount / total) * 100).toFixed(1)
                              })
                            }
                            
                            return data
                          })()}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {(() => {
                            const top10 = genresStats.played.slice(0, 10)
                            const othersCount = genresStats.played.slice(10).reduce((sum, g) => sum + g.count, 0)
                            const colors = top10.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                            
                            if (othersCount > 0) {
                              colors.push(
                                <Cell key="cell-others" fill="#6B7280" />
                              )
                            }
                            
                            return colors
                          })()}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} games (${props.payload.percentage}%)`,
                            name
                          ]}
                          contentStyle={{
                            backgroundColor: '#374151',
                            border: '1px solid #4B5563',
                            borderRadius: '8px',
                            color: 'white !important',
                            transform: 'scaleX(-1)'
                          }}
                          labelStyle={{
                            color: 'white !important'
                          }}
                          itemStyle={{
                            color: 'white !important'
                          }}
                          wrapperStyle={{
                            color: 'white !important'
                          }}
                        />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Top Genres</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = genresStats.played.slice(0, 10)
                        const othersCount = genresStats.played.slice(10).reduce((sum, g) => sum + g.count, 0)
                        const total = genresStats.played.reduce((sum, g) => sum + g.count, 0)
                        
                        const legendItems = top10.map((item, index) => {
                          const percentage = ((item.count / total) * 100).toFixed(1)
                          return (
                            <div key={item.genre} className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">{item.genre}</p>
                                <p className="text-gray-400 text-xs">{percentage}%</p>
                              </div>
                              <div className="text-white font-bold text-xs">{item.count}</div>
                            </div>
                          )
                        })
                        
                        if (othersCount > 0) {
                          const othersPercentage = ((othersCount / total) * 100).toFixed(1)
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersPercentage}%</p>
                              </div>
                              <div className="text-white font-bold text-xs">{othersCount}</div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {genresTab === 'rated' && genresStats.rated.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={(() => {
                            const top10 = genresStats.rated.slice(0, 10)
                            const othersAvgRating = genresStats.rated.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(genresStats.rated.slice(10).length, 1)
                            const othersCount = genresStats.rated.slice(10).reduce((sum, g) => sum + g.count, 0)
                            
                            const data = top10.map((item, index) => ({
                              name: item.genre,
                              value: item.avgRating,
                              count: item.count
                            }))
                            
                            if (othersCount > 0) {
                              data.push({
                                name: 'Others',
                                value: othersAvgRating,
                                count: othersCount
                              })
                            }
                            
                            return data
                          })()}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {(() => {
                            const top10 = genresStats.rated.slice(0, 10)
                            const othersCount = genresStats.rated.slice(10).reduce((sum, g) => sum + g.count, 0)
                            const colors = top10.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                            
                            if (othersCount > 0) {
                              colors.push(
                                <Cell key="cell-others" fill="#6B7280" />
                              )
                            }
                            
                            return colors
                          })()}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `★ ${Number(value).toFixed(2)} (${props.payload.count} games)`,
                            name
                          ]}
                          contentStyle={{
                            backgroundColor: '#374151',
                            border: '1px solid #4B5563',
                            borderRadius: '8px',
                            color: 'white !important',
                            transform: 'scaleX(-1)'
                          }}
                          labelStyle={{
                            color: 'white !important'
                          }}
                          itemStyle={{
                            color: 'white !important'
                          }}
                          wrapperStyle={{
                            color: 'white !important'
                          }}
                        />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Highest Rated Genres</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = genresStats.rated.slice(0, 10)
                        const othersAvgRating = genresStats.rated.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(genresStats.rated.slice(10).length, 1)
                        const othersCount = genresStats.rated.slice(10).reduce((sum, g) => sum + g.count, 0)
                        
                        const legendItems = top10.map((item, index) => (
                          <div key={item.genre} className="flex items-center gap-1.5">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">{item.genre}</p>
                              <p className="text-gray-400 text-xs">{item.count} games</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-white font-bold text-xs">{formatRating(item.avgRating)}</span>
                            </div>
                          </div>
                        ))
                        
                        if (othersCount > 0) {
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersCount} games</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400 text-xs">★</span>
                                <span className="text-white font-bold text-xs">{formatRating(othersAvgRating)}</span>
                              </div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {genresTab === 'lowest' && genresStats.lowest.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={(() => {
                            const top10 = genresStats.lowest.slice(0, 10)
                            const othersAvgRating = genresStats.lowest.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(genresStats.lowest.slice(10).length, 1)
                            const othersCount = genresStats.lowest.slice(10).reduce((sum, g) => sum + g.count, 0)
                            
                            const data = top10.map((item, index) => ({
                              name: item.genre,
                              value: item.avgRating,
                              count: item.count
                            }))
                            
                            if (othersCount > 0) {
                              data.push({
                                name: 'Others',
                                value: othersAvgRating,
                                count: othersCount
                              })
                            }
                            
                            return data
                          })()}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {(() => {
                            const top10 = genresStats.lowest.slice(0, 10)
                            const othersCount = genresStats.lowest.slice(10).reduce((sum, g) => sum + g.count, 0)
                            const colors = top10.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                            
                            if (othersCount > 0) {
                              colors.push(
                                <Cell key="cell-others" fill="#6B7280" />
                              )
                            }
                            
                            return colors
                          })()}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `★ ${Number(value).toFixed(2)} (${props.payload.count} games)`,
                            name
                          ]}
                          contentStyle={{
                            backgroundColor: '#374151',
                            border: '1px solid #4B5563',
                            borderRadius: '8px',
                            color: 'white !important',
                            transform: 'scaleX(-1)'
                          }}
                          labelStyle={{
                            color: 'white !important'
                          }}
                          itemStyle={{
                            color: 'white !important'
                          }}
                          wrapperStyle={{
                            color: 'white !important'
                          }}
                        />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Lowest Rated Genres</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = genresStats.lowest.slice(0, 10)
                        const othersAvgRating = genresStats.lowest.slice(10).reduce((sum, g) => sum + g.avgRating, 0) / Math.max(genresStats.lowest.slice(10).length, 1)
                        const othersCount = genresStats.lowest.slice(10).reduce((sum, g) => sum + g.count, 0)
                        
                        const legendItems = top10.map((item, index) => (
                          <div key={item.genre} className="flex items-center gap-1.5">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">{item.genre}</p>
                              <p className="text-gray-400 text-xs">{item.count} games</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-white font-bold text-xs">{formatRating(item.avgRating)}</span>
                            </div>
                          </div>
                        ))
                        
                        if (othersCount > 0) {
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersCount} games</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400 text-xs">★</span>
                                <span className="text-white font-bold text-xs">{formatRating(othersAvgRating)}</span>
                              </div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {genresTab === 'played' && genresStats.played.length === 0 && (
              <p className="text-gray-400 text-center py-8">No genres found</p>
            )}
            
            {genresTab === 'rated' && genresStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated genres found (need at least 3 games per genre)</p>
            )}
            
            {genresTab === 'lowest' && genresStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated genres found (need at least 3 games per genre)</p>
            )}
          </div>
        </div>
      )}


      {/* STATUS RATINGS Section */}
      {statusStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">STATUS RATINGS</h2>
            <p className="text-gray-400 text-sm mt-1">Average ratings by game status</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statusStats.map((statusData) => (
                <div key={statusData.status} className="bg-gray-700 rounded-lg p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {statusData.status}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-primary">
                      {formatRating(statusData.avgRating)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      ★ Average Rating
                    </p>
                    <p className="text-gray-300 text-lg">
                      {statusData.count} {statusData.count === 1 ? 'game' : 'games'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KEYWORDS ANALYSIS Section */}
      {(keywordsStats.common.length > 0 || keywordsStats.rated.length > 0 || keywordsStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">KEYWORDS ANALYSIS</h2>
            <p className="text-gray-400 text-sm mt-1">Game themes and characteristics from IGDB</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setKeywordsTab('common')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  keywordsTab === 'common'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST COMMON KEYWORDS
              </button>
              <button
                onClick={() => setKeywordsTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  keywordsTab === 'rated'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST RATED KEYWORDS
              </button>
              <button
                onClick={() => setKeywordsTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  keywordsTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LEAST FAVORITE
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {keywordsTab === 'common' && keywordsStats.common.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {keywordsStats.common.map((item, index) => (
                  <div
                    key={item.keyword}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                      <span className="text-xs text-gray-400">{item.count} games</span>
                    </div>
                    <p className="text-white font-medium text-sm capitalize">
                      {item.keyword}
                    </p>
                    {item.avgRating > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        ★ {item.avgRating.toFixed(1)} avg
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {keywordsTab === 'rated' && keywordsStats.rated.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {keywordsStats.rated.map((item, index) => (
                  <div
                    key={item.keyword}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-secondary">#{index + 1}</span>
                      <span className="text-xs text-primary font-bold">★ {formatRating(item.avgRating)}</span>
                    </div>
                    <p className="text-white font-medium text-sm capitalize">
                      {item.keyword}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.count} {item.count === 1 ? 'game' : 'games'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {keywordsTab === 'lowest' && keywordsStats.lowest.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {keywordsStats.lowest.map((item, index) => (
                  <div
                    key={item.keyword}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-secondary">#{index + 1}</span>
                      <span className="text-xs text-red-400 font-bold">★ {formatRating(item.avgRating)}</span>
                    </div>
                    <p className="text-white font-medium text-sm capitalize">
                      {item.keyword}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.count} {item.count === 1 ? 'game' : 'games'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {keywordsTab === 'common' && keywordsStats.common.length === 0 && (
              <p className="text-gray-400 text-center py-8">No common keywords found</p>
            )}
            
            {keywordsTab === 'rated' && keywordsStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated keywords found (need at least 3 games per keyword)</p>
            )}
            
            {keywordsTab === 'lowest' && keywordsStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated keywords found (need at least 3 games per keyword)</p>
            )}
          </div>
        </div>
      )}

      {/* FAVORITE THEMES Section */}
      {(themesStats.played.length > 0 || themesStats.rated.length > 0 || themesStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">FAVORITE THEMES</h2>
            <p className="text-gray-400 text-sm mt-1">Game themes from IGDB</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setThemesTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  themesTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED THEMES
              </button>
              <button
                onClick={() => setThemesTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  themesTab === 'rated'
                    ? 'bg-secondary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED THEMES
              </button>
              <button
                onClick={() => setThemesTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  themesTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED THEMES
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {themesTab === 'played' && themesStats.played.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = themesStats.played.slice(0, 10)
                              const othersCount = themesStats.played.slice(10).reduce((sum, t) => sum + t.count, 0)
                              const total = themesStats.played.reduce((sum, t) => sum + t.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.theme,
                                value: item.count,
                                percentage: ((item.count / total) * 100).toFixed(1)
                              }))
                              
                              if (othersCount > 0) {
                                data.push({
                                  name: 'Others',
                                  value: othersCount,
                                  percentage: ((othersCount / total) * 100).toFixed(1)
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = themesStats.played.slice(0, 10)
                              const othersCount = themesStats.played.slice(10).reduce((sum, t) => sum + t.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} games (${props.payload.percentage}%)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="lg:w-80">
                  <h3 className="text-white font-semibold mb-4 text-sm">Top Themes</h3>
                  <div className="space-y-2">
                    {(() => {
                      const top10 = themesStats.played.slice(0, 10)
                      const othersCount = themesStats.played.slice(10).reduce((sum, t) => sum + t.count, 0)
                      const total = themesStats.played.reduce((sum, t) => sum + t.count, 0)
                      
                      const legendItems = top10.map((item, index) => ({
                        name: item.theme,
                        value: item.count,
                        percentage: ((item.count / total) * 100).toFixed(1),
                        color: COLORS[index % COLORS.length]
                      }))
                      
                      if (othersCount > 0) {
                        legendItems.push({
                          name: 'Others',
                          value: othersCount,
                          percentage: ((othersCount / total) * 100).toFixed(1),
                          color: '#6B7280'
                        })
                      }
                      
                      return legendItems.map((item, index) => (
                        <div key={item.name} className="flex items-center space-x-3 py-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">
                              {item.name}
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {item.value} ({item.percentage}%)
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {themesTab === 'played' && themesStats.played.length === 0 && (
              <p className="text-gray-400 text-center py-8">No themes found</p>
            )}
            
            {themesTab === 'rated' && themesStats.rated.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = themesStats.rated.slice(0, 10)
                              const othersAvgRating = themesStats.rated.slice(10).reduce((sum, t) => sum + (t.avgRating * t.count), 0) / themesStats.rated.slice(10).reduce((sum, t) => sum + t.count, 0)
                              const othersCount = themesStats.rated.slice(10).reduce((sum, t) => sum + t.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.theme,
                                value: item.avgRating,
                                count: item.count
                              }))
                              
                              if (othersCount > 0 && !isNaN(othersAvgRating)) {
                                data.push({
                                  name: 'Others',
                                  value: othersAvgRating,
                                  count: othersCount
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = themesStats.rated.slice(0, 10)
                              const othersCount = themesStats.rated.slice(10).reduce((sum, t) => sum + t.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `★ ${formatRating(Number(value))} (${props.payload.count} games)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="lg:w-80">
                  <h3 className="text-white font-semibold mb-4 text-sm">Top Rated Themes</h3>
                  <div className="space-y-2">
                    {(() => {
                      const top10 = themesStats.rated.slice(0, 10)
                      const othersCount = themesStats.rated.slice(10).reduce((sum, t) => sum + t.count, 0)
                      
                      const legendItems = top10.map((item, index) => ({
                        name: item.theme,
                        rating: item.avgRating,
                        count: item.count,
                        color: COLORS[index % COLORS.length]
                      }))
                      
                      if (othersCount > 0) {
                        const othersAvgRating = themesStats.rated.slice(10).reduce((sum, t) => sum + (t.avgRating * t.count), 0) / othersCount
                        if (!isNaN(othersAvgRating)) {
                          legendItems.push({
                            name: 'Others',
                            rating: othersAvgRating,
                            count: othersCount,
                            color: '#6B7280'
                          })
                        }
                      }
                      
                      return legendItems.map((item, index) => (
                        <div key={item.name} className="flex items-center space-x-3 py-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">
                              {item.name}
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs">
                            ★ {formatRating(item.rating)} ({item.count} games)
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {themesTab === 'lowest' && themesStats.lowest.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = themesStats.lowest.slice(0, 10)
                              const othersAvgRating = themesStats.lowest.slice(10).reduce((sum, t) => sum + (t.avgRating * t.count), 0) / themesStats.lowest.slice(10).reduce((sum, t) => sum + t.count, 0)
                              const othersCount = themesStats.lowest.slice(10).reduce((sum, t) => sum + t.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.theme,
                                value: item.avgRating,
                                count: item.count
                              }))
                              
                              if (othersCount > 0 && !isNaN(othersAvgRating)) {
                                data.push({
                                  name: 'Others',
                                  value: othersAvgRating,
                                  count: othersCount
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = themesStats.lowest.slice(0, 10)
                              const othersCount = themesStats.lowest.slice(10).reduce((sum, t) => sum + t.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `★ ${formatRating(Number(value))} (${props.payload.count} games)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Lowest Rated Themes</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = themesStats.lowest.slice(0, 10)
                        const othersAvgRating = themesStats.lowest.slice(10).reduce((sum, t) => sum + (t.avgRating * t.count), 0) / themesStats.lowest.slice(10).reduce((sum, t) => sum + t.count, 0)
                        const othersCount = themesStats.lowest.slice(10).reduce((sum, t) => sum + t.count, 0)
                        
                        const legendItems = top10.map((item, index) => (
                          <div key={item.theme} className="flex items-center gap-1.5">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">{item.theme}</p>
                              <p className="text-gray-400 text-xs">{item.count} games</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-white font-bold text-xs">{formatRating(item.avgRating)}</span>
                            </div>
                          </div>
                        ))
                        
                        if (othersCount > 0 && !isNaN(othersAvgRating)) {
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersCount} games</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400 text-xs">★</span>
                                <span className="text-white font-bold text-xs">{formatRating(othersAvgRating)}</span>
                              </div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {themesTab === 'rated' && themesStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated themes found (need at least 3 games per theme)</p>
            )}
            
            {themesTab === 'lowest' && themesStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated themes found (need at least 3 games per theme)</p>
            )}
          </div>
        </div>
      )}


      {/* FAVORITE SERIES Section */}
      {(seriesStats.played.length > 0 || seriesStats.rated.length > 0 || seriesStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">FAVORITE SERIES</h2>
            <p className="text-gray-400 text-sm mt-1">Game series from IGDB</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setSeriesTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  seriesTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED SERIES
              </button>
              <button
                onClick={() => setSeriesTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  seriesTab === 'rated'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED SERIES
              </button>
              <button
                onClick={() => setSeriesTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  seriesTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED SERIES
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {seriesTab === 'played' && seriesStats.played.length > 0 && (
              <div className="space-y-4">
                {seriesStats.played.slice(0, 10).map((series, index) => {
                  const totalGames = seriesStats.played.reduce((sum, s) => sum + s.count, 0)
                  const percentage = ((series.count / totalGames) * 100).toFixed(1)
                  
                  return (
                    <div key={series.series} className="flex items-center space-x-4">
                      {/* Percentage Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-teal-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {percentage}%
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-teal-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Series Name and Count */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{series.series}</div>
                        <div className="text-gray-400 text-xs">{series.count} games</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {seriesTab === 'played' && seriesStats.played.length === 0 && (
              <p className="text-gray-400 text-center py-8">No series found</p>
            )}
            
            {seriesTab === 'rated' && seriesStats.rated.length > 0 && (
              <div className="space-y-4">
                {seriesStats.rated.slice(0, 10).map((series, index) => {
                  const maxRating = Math.max(...seriesStats.rated.map(s => s.avgRating))
                  const percentage = ((series.avgRating / maxRating) * 100).toFixed(1)
                  
                  return (
                    <div key={series.series} className="flex items-center space-x-4">
                      {/* Rating Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-purple-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {series.avgRating.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-purple-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Series Name and Rating */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{series.series}</div>
                        <div className="text-gray-400 text-xs">
                          {series.count} games
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {seriesTab === 'lowest' && seriesStats.lowest.length > 0 && (
              <div className="space-y-4">
                {seriesStats.lowest.slice(0, 10).map((series, index) => {
                  const maxRating = Math.max(...seriesStats.lowest.map(s => s.avgRating))
                  const percentage = ((series.avgRating / maxRating) * 100).toFixed(1)
                  
                  return (
                    <div key={series.series} className="flex items-center space-x-4">
                      {/* Rating Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-red-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {series.avgRating.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-red-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Series Name and Rating */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{series.series}</div>
                        <div className="text-gray-400 text-xs">
                          {series.count} games
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {seriesTab === 'rated' && seriesStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated series found (need at least 3 games per series)</p>
            )}
            
            {seriesTab === 'lowest' && seriesStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated series found (need at least 3 games per series)</p>
            )}
          </div>
        </div>
      )}

      {/* FAVORITE FRANCHISES Section */}
      {(franchisesStats.played.length > 0 || franchisesStats.rated.length > 0 || franchisesStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">FAVORITE FRANCHISES</h2>
            <p className="text-gray-400 text-sm mt-1">Game franchises from IGDB</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setFranchisesTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  franchisesTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED FRANCHISES
              </button>
              <button
                onClick={() => setFranchisesTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  franchisesTab === 'rated'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED FRANCHISES
              </button>
              <button
                onClick={() => setFranchisesTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  franchisesTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED FRANCHISES
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {franchisesTab === 'played' && franchisesStats.played.length > 0 && (
              <div className="space-y-4">
                {franchisesStats.played.slice(0, 10).map((franchise, index) => {
                  const totalGames = franchisesStats.played.reduce((sum, f) => sum + f.count, 0)
                  const percentage = ((franchise.count / totalGames) * 100).toFixed(1)
                  
                  return (
                    <div key={franchise.franchise} className="flex items-center space-x-4">
                      {/* Percentage Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-teal-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {percentage}%
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-teal-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Franchise Name and Count */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{franchise.franchise}</div>
                        <div className="text-gray-400 text-xs">{franchise.count} games</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {franchisesTab === 'played' && franchisesStats.played.length === 0 && (
              <p className="text-gray-400 text-center py-8">No franchises found</p>
            )}
            
            {franchisesTab === 'rated' && franchisesStats.rated.length > 0 && (
              <div className="space-y-4">
                {franchisesStats.rated.slice(0, 10).map((franchise, index) => {
                  const maxRating = Math.max(...franchisesStats.rated.map(f => f.avgRating))
                  const percentage = ((franchise.avgRating / maxRating) * 100).toFixed(1)
                  
                  return (
                    <div key={franchise.franchise} className="flex items-center space-x-4">
                      {/* Rating Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-purple-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {franchise.avgRating.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-purple-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Franchise Name and Rating */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{franchise.franchise}</div>
                        <div className="text-gray-400 text-xs">
                          {franchise.count} games
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {franchisesTab === 'lowest' && franchisesStats.lowest.length > 0 && (
              <div className="space-y-4">
                {franchisesStats.lowest.slice(0, 10).map((franchise, index) => {
                  const maxRating = Math.max(...franchisesStats.lowest.map(f => f.avgRating))
                  const percentage = ((franchise.avgRating / maxRating) * 100).toFixed(1)
                  
                  return (
                    <div key={franchise.franchise} className="flex items-center space-x-4">
                      {/* Rating Label */}
                      <div className="w-16 flex-shrink-0">
                        <div className="bg-red-600 text-white text-center py-2 px-3 rounded font-bold text-sm">
                          {franchise.avgRating.toFixed(1)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          {/* Filled portion */}
                          <div 
                            className="bg-red-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          {/* Unfilled portion */}
                          <div 
                            className="absolute top-0 right-0 bg-amber-500 h-full"
                            style={{ width: `${100 - parseFloat(percentage)}%` }}
                          />
                          {/* Base shadow */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Franchise Name and Rating */}
                      <div className="w-48 flex-shrink-0 text-right">
                        <div className="text-white font-semibold text-sm">{franchise.franchise}</div>
                        <div className="text-gray-400 text-xs">
                          {franchise.count} games
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {franchisesTab === 'rated' && franchisesStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated franchises found (need at least 3 games per franchise)</p>
            )}
            
            {franchisesTab === 'lowest' && franchisesStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated franchises found (need at least 3 games per franchise)</p>
            )}
          </div>
        </div>
      )}

      {/* FAVORITE PLATFORMS Section */}
      {(platformsStats.played.length > 0 || platformsStats.rated.length > 0 || platformsStats.lowest.length > 0) && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">FAVORITE PLATFORMS</h2>
            <p className="text-gray-400 text-sm mt-1">Game platforms from your collection</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setPlatformsTab('played')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  platformsTab === 'played'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                MOST PLAYED PLATFORMS
              </button>
              <button
                onClick={() => setPlatformsTab('rated')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  platformsTab === 'rated'
                    ? 'bg-secondary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATED PLATFORMS
              </button>
              <button
                onClick={() => setPlatformsTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  platformsTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATED PLATFORMS
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {platformsTab === 'played' && platformsStats.played.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = platformsStats.played.slice(0, 10)
                              const othersCount = platformsStats.played.slice(10).reduce((sum, p) => sum + p.count, 0)
                              const total = platformsStats.played.reduce((sum, p) => sum + p.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.platform,
                                value: item.count,
                                percentage: ((item.count / total) * 100).toFixed(1)
                              }))
                              
                              if (othersCount > 0) {
                                data.push({
                                  name: 'Others',
                                  value: othersCount,
                                  percentage: ((othersCount / total) * 100).toFixed(1)
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = platformsStats.played.slice(0, 10)
                              const othersCount = platformsStats.played.slice(10).reduce((sum, p) => sum + p.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} games (${props.payload.percentage}%)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="lg:w-80">
                  <h3 className="text-white font-semibold mb-4 text-sm">Top Platforms</h3>
                  <div className="space-y-2">
                    {(() => {
                      const top10 = platformsStats.played.slice(0, 10)
                      const othersCount = platformsStats.played.slice(10).reduce((sum, p) => sum + p.count, 0)
                      const total = platformsStats.played.reduce((sum, p) => sum + p.count, 0)
                      
                      const legendItems = top10.map((item, index) => ({
                        name: item.platform,
                        value: item.count,
                        percentage: ((item.count / total) * 100).toFixed(1),
                        color: COLORS[index % COLORS.length]
                      }))
                      
                      if (othersCount > 0) {
                        legendItems.push({
                          name: 'Others',
                          value: othersCount,
                          percentage: ((othersCount / total) * 100).toFixed(1),
                          color: '#6B7280'
                        })
                      }
                      
                      return legendItems.map((item, index) => (
                        <div key={item.name} className="flex items-center space-x-3 py-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">
                              {item.name}
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {item.value} ({item.percentage}%)
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {platformsTab === 'played' && platformsStats.played.length === 0 && (
              <p className="text-gray-400 text-center py-8">No platforms found</p>
            )}
            
            {platformsTab === 'rated' && platformsStats.rated.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = platformsStats.rated.slice(0, 10)
                              const othersAvgRating = platformsStats.rated.slice(10).reduce((sum, p) => sum + (p.avgRating * p.count), 0) / platformsStats.rated.slice(10).reduce((sum, p) => sum + p.count, 0)
                              const othersCount = platformsStats.rated.slice(10).reduce((sum, p) => sum + p.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.platform,
                                value: item.avgRating,
                                count: item.count
                              }))
                              
                              if (othersCount > 0 && !isNaN(othersAvgRating)) {
                                data.push({
                                  name: 'Others',
                                  value: othersAvgRating,
                                  count: othersCount
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = platformsStats.rated.slice(0, 10)
                              const othersCount = platformsStats.rated.slice(10).reduce((sum, p) => sum + p.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `★ ${formatRating(Number(value))} (${props.payload.count} games)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="lg:w-80">
                  <h3 className="text-white font-semibold mb-4 text-sm">Top Rated Platforms</h3>
                  <div className="space-y-2">
                    {(() => {
                      const top10 = platformsStats.rated.slice(0, 10)
                      const othersCount = platformsStats.rated.slice(10).reduce((sum, p) => sum + p.count, 0)
                      
                      const legendItems = top10.map((item, index) => ({
                        name: item.platform,
                        rating: item.avgRating,
                        count: item.count,
                        color: COLORS[index % COLORS.length]
                      }))
                      
                      if (othersCount > 0) {
                        const othersAvgRating = platformsStats.rated.slice(10).reduce((sum, p) => sum + (p.avgRating * p.count), 0) / othersCount
                        if (!isNaN(othersAvgRating)) {
                          legendItems.push({
                            name: 'Others',
                            rating: othersAvgRating,
                            count: othersCount,
                            color: '#6B7280'
                          })
                        }
                      }
                      
                      return legendItems.map((item, index) => (
                        <div key={item.name} className="flex items-center space-x-3 py-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">
                              {item.name}
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs">
                            ★ {formatRating(item.rating)} ({item.count} games)
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {platformsTab === 'lowest' && platformsStats.lowest.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Chart */}
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-6">
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const top10 = platformsStats.lowest.slice(0, 10)
                              const othersAvgRating = platformsStats.lowest.slice(10).reduce((sum, p) => sum + (p.avgRating * p.count), 0) / platformsStats.lowest.slice(10).reduce((sum, p) => sum + p.count, 0)
                              const othersCount = platformsStats.lowest.slice(10).reduce((sum, p) => sum + p.count, 0)
                              
                              const data = top10.map((item, index) => ({
                                name: item.platform,
                                value: item.avgRating,
                                count: item.count
                              }))
                              
                              if (othersCount > 0 && !isNaN(othersAvgRating)) {
                                data.push({
                                  name: 'Others',
                                  value: othersAvgRating,
                                  count: othersCount
                                })
                              }
                              
                              return data
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {(() => {
                              const top10 = platformsStats.lowest.slice(0, 10)
                              const othersCount = platformsStats.lowest.slice(10).reduce((sum, p) => sum + p.count, 0)
                              const colors = top10.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                              
                              if (othersCount > 0) {
                                colors.push(
                                  <Cell key="cell-others" fill="#6B7280" />
                                )
                              }
                              
                              return colors
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `★ ${formatRating(Number(value))} (${props.payload.count} games)`,
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: '#374151',
                              border: '1px solid #4B5563',
                              borderRadius: '8px',
                              color: 'white !important',
                              transform: 'scaleX(-1)'
                            }}
                            labelStyle={{
                              color: 'white !important'
                            }}
                            itemStyle={{
                              color: 'white !important'
                            }}
                            wrapperStyle={{
                              color: 'white !important'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="lg:w-80">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h3 className="text-white font-bold text-sm mb-2">Lowest Rated Platforms</h3>
                    <div className="space-y-1.5">
                      {(() => {
                        const top10 = platformsStats.lowest.slice(0, 10)
                        const othersAvgRating = platformsStats.lowest.slice(10).reduce((sum, p) => sum + (p.avgRating * p.count), 0) / platformsStats.lowest.slice(10).reduce((sum, p) => sum + p.count, 0)
                        const othersCount = platformsStats.lowest.slice(10).reduce((sum, p) => sum + p.count, 0)
                        
                        const legendItems = top10.map((item, index) => (
                          <div key={item.platform} className="flex items-center gap-1.5">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-xs truncate">{item.platform}</p>
                              <p className="text-gray-400 text-xs">{item.count} games</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400 text-xs">★</span>
                              <span className="text-white font-bold text-xs">{formatRating(item.avgRating)}</span>
                            </div>
                          </div>
                        ))
                        
                        if (othersCount > 0 && !isNaN(othersAvgRating)) {
                          legendItems.push(
                            <div key="others" className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: '#6B7280' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs truncate">Others</p>
                                <p className="text-gray-400 text-xs">{othersCount} games</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400 text-xs">★</span>
                                <span className="text-white font-bold text-xs">{formatRating(othersAvgRating)}</span>
                              </div>
                            </div>
                          )
                        }
                        
                        return legendItems
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {platformsTab === 'rated' && platformsStats.rated.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated platforms found (need at least 3 games per platform)</p>
            )}
            
            {platformsTab === 'lowest' && platformsStats.lowest.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rated platforms found (need at least 3 games per platform)</p>
            )}
          </div>
        </div>
      )}

      {/* MASTERED GAMES Chart Section */}
      {masteredGamesData.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">MASTERED GAMES</h2>
            <p className="text-gray-400 text-sm">Games you have mastered - rating distribution</p>
          </div>

          {/* Chart */}
          <div className="p-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={masteredGamesData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="index" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    type="category"
                    scale="point"
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    domain={[1, 10]}
                    tickCount={10}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                            <p className="text-white font-semibold">{data.name}</p>
                            <p className="text-primary">
                              Rating: {data.rating}/10
                            </p>
                            <p className="text-gray-400 text-sm">
                              Year: {data.year}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Bar 
                    dataKey="rating" 
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    maxBarSize={50}
                  >
                    {masteredGamesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Total Mastered</h3>
                <p className="text-2xl font-bold text-white">
                  {masteredGamesData.length}
                </p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Average Rating</h3>
                <p className="text-2xl font-bold text-white">
                  {formatRating(masteredGamesData.reduce((sum, game) => sum + game.rating, 0) / masteredGamesData.length)}
                </p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Highest Rated</h3>
                <p className="text-2xl font-bold text-white">
                  {Math.max(...masteredGamesData.map(g => g.rating))}/10
                </p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Perfect Scores</h3>
                <p className="text-2xl font-bold text-white">
                  {masteredGamesData.filter(g => g.rating === 10).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REMAKES Section */}
      {remakesData.all.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">REMAKES</h2>
            <p className="text-gray-400 text-sm mt-1">Remake games from your collection</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setRemakesTab('all')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  remakesTab === 'all'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                ALL REMAKES
              </button>
              <button
                onClick={() => setRemakesTab('highest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  remakesTab === 'highest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATING
              </button>
              <button
                onClick={() => setRemakesTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  remakesTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATING
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {(remakesTab === 'all' ? remakesData.all : 
                remakesTab === 'highest' ? remakesData.highest : 
                remakesData.lowest).map((game, index) => (
                <a
                  key={`${game.id || index}`}
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group cursor-pointer flex-shrink-0 w-full aspect-[3/4] block"
                  title={game.name}
                >
                  <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                    {game.image ? (
                      <Image
                        src={game.image}
                        alt={game.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center h-full">
                                <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                              </div>
                            `
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-500 text-xs text-center px-1">
                          {game.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Rating overlay */}
                    {game.rating && game.rating > 0 && (
                      <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                        {game.rating}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REMASTERS Section */}
      {remastersData.all.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">REMASTERS</h2>
            <p className="text-gray-400 text-sm mt-1">Remaster games from your collection</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setRemastersTab('all')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  remastersTab === 'all'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                ALL REMASTERS
              </button>
              <button
                onClick={() => setRemastersTab('highest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  remastersTab === 'highest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATING
              </button>
              <button
                onClick={() => setRemastersTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  remastersTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATING
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {(remastersTab === 'all' ? remastersData.all : 
                remastersTab === 'highest' ? remastersData.highest : 
                remastersData.lowest).map((game, index) => (
                <a
                  key={`${game.id || index}`}
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group cursor-pointer flex-shrink-0 w-full aspect-[3/4] block"
                  title={game.name}
                >
                  <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                    {game.image ? (
                      <Image
                        src={game.image}
                        alt={game.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center h-full">
                                <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                              </div>
                            `
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-500 text-xs text-center px-1">
                          {game.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Rating overlay */}
                    {game.rating && game.rating > 0 && (
                      <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                        {game.rating}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXTENSIONS Section */}
      {extensionsData.all.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">EXTENSIONS</h2>
            <p className="text-gray-400 text-sm mt-1">Expansion games from your collection</p>
            
            {/* Tabs */}
            <div className="flex mt-4 space-x-1 bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setExtensionsTab('all')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  extensionsTab === 'all'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                ALL EXTENSIONS
              </button>
              <button
                onClick={() => setExtensionsTab('highest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  extensionsTab === 'highest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                HIGHEST RATING
              </button>
              <button
                onClick={() => setExtensionsTab('lowest')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  extensionsTab === 'lowest'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                LOWEST RATING
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {(extensionsTab === 'all' ? extensionsData.all : 
                extensionsTab === 'highest' ? extensionsData.highest : 
                extensionsData.lowest).map((game, index) => (
                <a
                  key={`${game.id || index}`}
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group cursor-pointer flex-shrink-0 w-full aspect-[3/4] block"
                  title={game.name}
                >
                  <div className="w-full h-full bg-gray-700 rounded overflow-hidden relative">
                    {game.image ? (
                      <Image
                        src={game.image}
                        alt={game.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center h-full">
                                <span class="text-gray-500 text-xs text-center px-1">${game.name}</span>
                              </div>
                            `
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-500 text-xs text-center px-1">
                          {game.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Rating overlay */}
                    {game.rating && game.rating > 0 && (
                      <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                        {game.rating}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}