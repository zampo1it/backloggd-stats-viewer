//Copyright 2023 Qewertyy, MIT License

import { Cheerio, CheerioAPI, load } from "cheerio";
import { recentlyReviewed, userBadges, game } from "../types";
import config from "../config";
import { getCompleteGameInfoFromIGDBAPI, getCompleteGameInfoByID } from "../lib/igdb";
import axios from "axios";
import { axiosWithRetry } from "./axios-with-retry";

function extractGame(element: Cheerio<any>) {
  const game = element.find("div.overflow-wrapper");
  const name = game.find("img").attr("alt");
  const image = game.find("img").attr("src");
  let url = element.find("a.cover-link").attr("href") || element.closest("a").attr("href");
  if (url && !url.startsWith("http")) {
    url = config.baseUrl + url;
  }
  const date = element.find("p.mb-0.played-date").text();
  let rating;
  const ratingDiv = element
    .find("div.star-ratings-static div.stars-top")
    .attr("style");
  if (ratingDiv) {
    rating = calculateRating(ratingDiv);
  }
  if (name && image) {
    return { name, image, ...(url && { url }), ...(date && { date }), ...(rating && { rating }) };
  }
  return null;
}

function extractRecentReviews($: CheerioAPI, element: Cheerio<any>) {
  const games: recentlyReviewed[] = [];
  const div = element.children();
  div.find(".review-card").each((_i, el) => {
    const selector = $(el);
    const reviewId = selector.find(".review-body").attr("review_id");
    let rating;
    const ratingDiv = selector
      .find("div.row.star-ratings-static div.stars-top")
      .attr("style");
    if (ratingDiv) rating = calculateRating(ratingDiv);
    const game = extractGame(selector);
    if (reviewId && game?.name && game?.image) {
      games.push({
        ...game,
        review: selector.find(`#collapseReview${reviewId}`).text().trim(),
        ...(rating && { rating }),
      });
    }
  });
  return games;
}

function calculateRating(style: string) {
  const widthMatch = style.match(/width:\s*(\d+(\.\d+)?)%/);
  if (widthMatch && widthMatch[1]) {
    const widthPercentage = parseFloat(widthMatch[1]);
    return (widthPercentage / 100) * 5;
  }
  return null;
}

function extractBadges($: CheerioAPI, element: Cheerio<any>) {
  const badges: userBadges[] = [];
  element.find(".badges .backlog-badge-cus-col").each((_i, el) => {
    const selector = $(el);
    const pTag = selector.find(".badge-tooltip");
    const id = pTag.attr("badge_id");
    const badgeDiv = selector.find(`#badge-${id}`);
    if (id && badgeDiv) {
      badges.push({
        id,
        image: pTag.find("img").attr("src"),
        name: badgeDiv.find(".badge-title").text().trim(),
        description: badgeDiv.find(".badge-desc").text().trim(),
      });
    }
  });
  return badges;
}

function extractGamesFromPage($: CheerioAPI, element: Cheerio<any>): game[] {
  const games: game[] = [];
  
  // Ищем все игры на странице - используем правильные селекторы из HTML
  element.find(".game-cover").each((_i, el) => {
    const gameElement = $(el);
    
    // Извлекаем ID игры
    const gameId = gameElement.attr("game_id");
    
    // Извлекаем рейтинг
    const ratingAttr = gameElement.attr("data-rating");
    const rating = ratingAttr ? parseInt(ratingAttr) : undefined;
    
    // Извлекаем название игры
    const name = gameElement.find(".game-text-centered").text().trim();
    
    // Извлекаем изображение
    const image = gameElement.find(".overflow-wrapper img").attr("src") || "";
    
    // Извлекаем URL игры
    let url = gameElement.find("a.cover-link").attr("href") || gameElement.closest("a").attr("href");
    if (url && !url.startsWith("http")) {
      url = config.baseUrl + url;
    }
    
    // Извлекаем информацию о времени игры
    const timeBadge = gameElement.find(".time-badge");
    const playtime = timeBadge.attr("title") || "";
    
    // Извлекаем статус игры (из класса)
    const statusClass = gameElement.attr("class") || "";
    let status = "played";
    if (statusClass.includes("fade-completed")) status = "completed";
    else if (statusClass.includes("fade-playing")) status = "playing";
    else if (statusClass.includes("fade-backlog")) status = "backlog";
    else if (statusClass.includes("fade-wishlist")) status = "wishlist";
    
    if (gameId && name) {
      games.push({
        id: gameId,
        name,
        image,
        ...(url && { url }),
        ...(rating && { rating }),
        ...(playtime && { playtime }),
        ...(status && { status })
      });
    }
  });
  
  return games;
}

function getTotalPages($: CheerioAPI): number {
  // Ищем пагинацию для определения общего количества страниц
  const paginationLinks = $("a[href*='page=']");
  let maxPage = 1;
  
  paginationLinks.each((_i, el) => {
    const href = $(el).attr("href");
    if (href) {
      const pageMatch = href.match(/page=(\d+)/);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1]);
        if (pageNum > maxPage) {
          maxPage = pageNum;
        }
      }
    }
  });
  
  return maxPage;
}

async function getGameDetails(gameUrl: string, username?: string, gameName?: string, gameId?: string): Promise<{ developer?: string; releaseDate?: string; platforms?: string[]; genres?: string[]; logpage?: string; igdbpage?: string; developerbyigdb?: string; status?: string }> {
  try {
    console.log(`Fetching game details from: ${gameUrl}`);
    const response = await axiosWithRetry({
      method: 'get',
      url: gameUrl,
      headers: config.headers,
    });

    const $ = load(response.data);
    
    // Извлекаем разработчиков из подзаголовка игры
    const developers: string[] = [];
    
    // Ищем в подзаголовке (там обычно находится разработчик)
    $("div.col-auto.sub-title a[href*='/company/']").each((_i: any, el: any) => {
      const devName = $(el).text().trim();
      if (devName && !developers.includes(devName)) {
        developers.push(devName);
      }
    });
    
    // Если не нашли, ищем везде
    if (developers.length === 0) {
      $("a[href*='/company/']").each((_i: any, el: any) => {
        const devName = $(el).text().trim();
        if (devName && !developers.includes(devName)) {
          developers.push(devName);
        }
      });
    }
    
    // Извлекаем дату релиза из нового места (секция RELEASED)
    let releaseDate: string | undefined;
    
    // Ищем элемент с классом game-details-value в секции RELEASED
    const releasedSection = $("div.row.mt-2.d-md-none").find("div.col-auto.ml-auto.my-auto a.game-details-value");
    if (releasedSection.length > 0) {
      const dateText = releasedSection.text().trim();
      console.log(`Found new release date: ${dateText}`);
      
      if (dateText) {
        // Преобразуем формат из "Feb 25, 2022" в "25/02/2022"
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const year = date.getFullYear();
          releaseDate = `${day}/${month}/${year}`;
        }
      }
    }
    
    // Fallback: если не нашли в новом месте, пробуем старое
    if (!releaseDate) {
      $("span.filler-text").each((_i: any, el: any) => {
        const text = $(el).text().trim();
        if (text === "released on") {
          const releaseDateLink = $(el).next("a");
          const dateText = releaseDateLink.text().trim();
          
          console.log(`Found fallback date text: ${dateText}`);
          
          if (dateText) {
            // Преобразуем формат из "Oct 13, 2023" в "13/10/2023"
            const date = new Date(dateText);
            if (!isNaN(date.getTime())) {
              const day = date.getDate().toString().padStart(2, "0");
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const year = date.getFullYear();
              releaseDate = `${day}/${month}/${year}`;
            }
          }
        }
      });
    }
    
    // Извлекаем платформы
    const platforms: string[] = [];
    $("a.game-page-platform").each((_i: any, el: any) => {
      const platformName = $(el).text().trim();
      if (platformName && !platforms.includes(platformName)) {
        platforms.push(platformName);
      }
    });
    console.log(`Found ${platforms.length} platforms:`, platforms);
    
    // Извлекаем жанры
    const genres: string[] = [];
    $(".genre-tag a, p.genre-tag a").each((_i: any, el: any) => {
      const genreName = $(el).text().trim();
      if (genreName && !genres.includes(genreName)) {
        genres.push(genreName);
      }
    });
    console.log(`Found ${genres.length} genres:`, genres);
    
    // Извлекаем информацию о типе игры (remaster/remake/expansion)
    let isRemaster = "no";
    let isRemake = "no";
    let isExpansion = "no";
    
    // Ищем элемент с классом game-parent-category
    const parentCategoryElement = $(".game-parent-category");
    if (parentCategoryElement.length > 0) {
      const categoryText = parentCategoryElement.text().trim();
      console.log(`Found parent category text: "${categoryText}"`);
      
      if (categoryText.toLowerCase().includes("a remaster of")) {
        isRemaster = "yes";
        console.log("Game is identified as a REMASTER");
      } else if (categoryText.toLowerCase().includes("a remake of")) {
        isRemake = "yes";
        console.log("Game is identified as a REMAKE");
      } else if (categoryText.toLowerCase().includes("an expansion for")) {
        isExpansion = "yes";
        console.log("Game is identified as an EXPANSION");
      }
    } else {
      console.log("No parent category found - game is original");
    }
    
    // Получаем URL страницы логов и статус, если есть username
    let logpage: string | undefined = undefined;
    let status: string | null = null;
    let mastered: string = "no";
    if (username) {
      logpage = getGameLogPage(username, gameUrl);
      // Получаем статус с страницы логов
      const statusData = await getGameStatusFromLogPage(logpage);
      status = statusData.status;
      mastered = statusData.mastered;
    }
    
    // Получаем URL страницы IGDB и полную информацию об игре через API
    const igdbpage = getGameIGDBPage(gameUrl);
    
    // ПРИОРИТЕТ 1: Используем ID игры для прямого запроса (самый точный метод)
    let igdbgameinfo = null;
    if (gameId) {
      console.log(`Using IGDB ID: ${gameId} (from Backloggd)`);
      igdbgameinfo = await getCompleteGameInfoByID(gameId);
    }
    
    // ПРИОРИТЕТ 2: Если ID не дал результата, используем поиск по названию (fallback)
    if (!igdbgameinfo) {
      const gameNameForSearch = gameName || extractGameNameFromUrl(gameUrl);
      console.log(`Fallback: Searching IGDB by name: "${gameNameForSearch}"`);
      igdbgameinfo = gameNameForSearch ? await getCompleteGameInfoFromIGDBAPI(gameNameForSearch) : null;
    }
    
    const result = {
      ...(developers.length > 0 && { developer: developers.join(", ") }),
      ...(releaseDate && { releaseDate }),
      ...(platforms.length > 0 && { platforms }),
      ...(genres.length > 0 && { genres }),
      ...(logpage && { logpage }),
      ...(igdbpage && { igdbpage }),
      ...(igdbgameinfo && { igdbgameinfo: igdbgameinfo }),
      ...(status && { status }),
      ...(mastered && { mastered }),
      ...(isRemaster && { isRemaster }),
      ...(isRemake && { isRemake }),
      ...(isExpansion && { isExpansion }),
    };
    
    console.log(`Game details for ${gameUrl}:`, result);
    
    return result;
  } catch (error) {
    console.log(`Failed to fetch game details from ${gameUrl}:`, error);
    return {};
  }
}

// Получить URL страницы логов для игры
function getGameLogPage(username: string, gameUrl: string): string {
  // Извлекаем имя игры из URL
  // Например: https://backloggd.com/games/silent-hill-f-2025/ -> silent-hill-f-2025
  const urlParts = gameUrl.split('/');
  const gameSlug = urlParts[urlParts.length - 2]; // Берем предпоследний элемент (перед последним /)
  
  return `${config.baseUrl}/u/${username}/logs/${gameSlug}/`;
}

// Получить URL страницы IGDB для игры
function getGameIGDBPage(gameUrl: string): string {
  // Извлекаем имя игры из URL
  // Например: https://backloggd.com/games/silent-hill-f-2025/ -> silent-hill-f-2025
  const urlParts = gameUrl.split('/');
  const gameSlug = urlParts[urlParts.length - 2]; // Берем предпоследний элемент (перед последним /)

  return `https://www.igdb.com/games/${gameSlug}`;
}

// Извлечь имя игры из URL для поиска в IGDB API
function extractGameNameFromUrl(gameUrl: string): string | null {
  try {
    // Извлекаем slug из URL
    // Например: https://backloggd.com/games/silent-hill-f-2025/ -> silent-hill-f-2025
    const urlParts = gameUrl.split('/');
    const gameSlug = urlParts[urlParts.length - 2];
    
    if (!gameSlug) {
      return null;
    }
    
    // Преобразуем slug в читаемое название
    // silent-hill-f-2025 -> Silent Hill F 2025
    const gameName = gameSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return gameName;
  } catch (error) {
    console.log(`Failed to extract game name from URL: ${gameUrl}`, error);
    return null;
  }
}

// Получить статус игры с страницы логов
async function getGameStatusFromLogPage(logPageUrl: string): Promise<{status: string | null, mastered: string}> {
  try {
    console.log(`Fetching game status from log page: ${logPageUrl}`);
    
    const response = await axiosWithRetry({
      method: 'get',
      url: logPageUrl,
      headers: config.headers,
    });
    const $ = load(response.data);
    
    // Ищем статус в div#log-status p
    const statusElement = $("#log-status p");
    let status: string | null = null;
    if (statusElement.length > 0) {
      status = statusElement.text().trim();
      // Убираем "PlayingBacklogWishlist" из статуса
      status = status.replace(/PlayingBacklogWishlist/g, '').trim();
      console.log(`Found status: ${status}`);
    } else {
      console.log("Status not found in log-status section");
    }
    
    // Ищем статус "Mastered" на странице
    let mastered = "no";
    const pageText = $.text();
    if (pageText.includes("Mastered")) {
      mastered = "yes";
      console.log("Found Mastered status");
    }
    
    return { status, mastered };
  } catch (error) {
    console.log(`Failed to fetch game status from log page:`, error);
    return { status: null, mastered: "no" };
  }
}


export { extractGame, extractRecentReviews, extractBadges, extractGamesFromPage, getTotalPages, getGameDetails, getGameLogPage, getGameIGDBPage, getGameStatusFromLogPage, extractGameNameFromUrl };
