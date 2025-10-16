import axios, { Axios, AxiosError } from "axios";
import { load } from "cheerio";
import config from "../config";
import { favoriteGames, recentlyPlayed, userInfo, gamesResponse } from "../types";
import {
  extractBadges,
  extractGame,
  extractRecentReviews,
  extractGamesFromPage,
  getTotalPages,
  getGameDetails,
} from "../utils/game";
import { axiosWithRetry } from "../utils/axios-with-retry";

async function getUserInfo(
  username: string
): Promise<userInfo | { error: string; status: number }> {
  const referer = `${config.baseUrl}/search/users/${username}`;
  const response = await axiosWithRetry({
    method: 'get',
    url: `${config.baseUrl}/u/${username}`,
    headers: {
      ...config.headers,
      "Turbolinks-Referrer": referer,
      Referer: referer,
    },
  }).catch((err) => err);

  if (response instanceof AxiosError) {
    console.log(response.response?.status);
    let error, status;
    if (response.response?.status === 404) {
      error = "User not found";
      status = 404;
    } else {
      error = response.message;
      status = response.response?.status || 500;
    }
    return {
      error: error,
      status: status,
    };
  }
  const $ = load(response.data);
  let userinfo = {} as userInfo;
  userinfo.username = username;
  userinfo.profile =
    $("meta[property='og:image']").attr("content") ||
    "https://backloggd.b-cdn.net/no_avatar.jpg";
  const hasBio = $("#bio-body").has("p").length === 0;
  userinfo.bio = hasBio ? $("#bio-body").text().trim() : "Nothing here!";
  
  // Извлекаем количество игр из элемента <p class="mb-0 subtitle-text">1228 Games</p>
  const gamesCountElement = $("p.mb-0.subtitle-text");
  if (gamesCountElement.length > 0) {
    const gamesText = gamesCountElement.text().trim();
    const match = gamesText.match(/^(\d+)\s+Games?/);
    if (match) {
      userinfo.gamescount = parseInt(match[1]);
      console.log(`Found games count: ${userinfo.gamescount}`);
    }
  }
  const favoriteGames: favoriteGames[] = [];
  const recentlyPlayed: recentlyPlayed[] = [];
  const favoritesDiv = $("#profile-favorites").children();
  const recentlyPlayedDiv = $("#profile-journal").children();
  const userStatsDiv = $("#profile-stats").children();
  const userBadgesDiv = $("#profile-sidebar").children();
  const userStats: { [key: string]: number } = {};
  userStatsDiv.each((i, el) => {
    const value = $(el).children("h1").text();
    const key = $(el).children("h4").text();
    userStats[key] = parseInt(value);
  });
  favoritesDiv.each((_i, el) => {
    const game = extractGame($(el));
    if (game) {
      const mostFavorite = el.attribs.class.includes("ultimate_fav");
      favoriteGames.push({
        ...game,
        ...(mostFavorite && { mostFavorite }),
      });
    }
  });
  recentlyPlayedDiv.each((i, el) => {
    const game = extractGame($(el));
    if (game) {
      recentlyPlayed.push({ ...game });
    }
  });
  userinfo.badges = extractBadges($, userBadgesDiv);
  userinfo.favoriteGames = favoriteGames;
  userinfo.recentlyPlayed = recentlyPlayed;
  userinfo.recentlyReviewed = extractRecentReviews($, $("div.row.mb-3"));
  return { ...userinfo, ...userStats };
}

async function getUserGames(
  username: string,
  page: number = 1,
  getAllPages: boolean = false
): Promise<gamesResponse | { error: string; status: number }> {
  try {
    console.log(`===== getUserGames called for ${username}, page ${page} =====`);
    
    const referer = `${config.baseUrl}/search/users/${username}`;
    const url = `${config.baseUrl}/u/${username}/games?page=${page}`;
    
    const response = await axiosWithRetry({
      method: 'get',
      url: url,
      headers: {
        ...config.headers,
        "Turbolinks-Referrer": referer,
        Referer: referer,
      },
    });

    const $ = load(response.data);
    
    // Извлекаем игры с текущей страницы
    let games = extractGamesFromPage($, $("body"));
    
    console.log(`Extracted ${games.length} games from page`);
    console.log(`Now fetching details for ${games.length} games...`);
    
    // Получаем дополнительные данные для каждой игры
    games = await Promise.all(
      games.map(async (game) => {
        if (game.url) {
          const details = await getGameDetails(game.url, username, game.name, game.id);
          return { ...game, ...details };
        }
        return game;
      })
    );
    
    console.log(`Finished fetching game details`);
    
    if (getAllPages) {
      // Получаем общее количество страниц
      const totalPages = getTotalPages($);
      
      // Собираем игры со всех страниц
      const allGames = [...games];
      
      for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
        try {
          const nextUrl = `${config.baseUrl}/u/${username}/games?page=${currentPage}`;
          const nextResponse = await axiosWithRetry({
            method: 'get',
            url: nextUrl,
            headers: {
              ...config.headers,
              "Turbolinks-Referrer": referer,
              Referer: referer,
            },
          });
          
          const next$ = load(nextResponse.data);
          let nextPageGames = extractGamesFromPage(next$, next$("body"));
          
          // Получаем дополнительные данные для каждой игры
          nextPageGames = await Promise.all(
            nextPageGames.map(async (game) => {
              if (game.url) {
                const details = await getGameDetails(game.url, username, game.name, game.id);
                return { ...game, ...details };
              }
              return game;
            })
          );
          
          allGames.push(...nextPageGames);
          
          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.log(`Failed to fetch page ${currentPage}:`, err);
          break;
        }
      }
      
      return {
        games: allGames,
        pagination: {
          currentPage: 1,
          totalPages,
          totalGames: allGames.length,
          hasNext: false,
          hasPrev: false,
        },
      };
    } else {
      // Возвращаем только текущую страницу
      const totalPages = getTotalPages($);
      
      return {
        games,
        pagination: {
          currentPage: page,
          totalPages,
          totalGames: games.length,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      let errorMessage, status;
      if (error.response?.status === 404) {
        errorMessage = "User not found";
        status = 404;
      } else {
        errorMessage = error.message;
        status = error.response?.status || 500;
      }
      return { error: errorMessage, status };
    }
    return { error: "Unknown error occurred", status: 500 };
  }
}

export { getUserInfo, getUserGames };
