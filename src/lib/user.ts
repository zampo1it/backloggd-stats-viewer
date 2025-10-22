import cfg from "../config";
import axios from "axios";
import { load } from "cheerio";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// 1) Прокси (опционально). Добавь SCRAPER_API_KEY в ENV на Vercel — и включится.
const withProxy = (url: string) => {
  const key = process.env.SCRAPER_API_KEY;
  return key
    ? `https://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(url)}`
    : url;
};

async function fetchPage(url: string) {
  const r = await axios.get(withProxy(url), {
    headers: cfg.headers,           // важны «браузерные» заголовки
    validateStatus: () => true,
    maxRedirects: 5,
  });

  const html = typeof r.data === "string" ? r.data : "";
  const title = (html.match(/<title>(.*?)<\/title>/i)?.[1] || "").trim();

  // Bunny Shield / антибот
  if (
    r.status === 403 || r.status === 429 ||
    title.includes("Establishing a secure connection") ||
    html.includes(".bunny-shield/assets/challenge")
  ) {
    return { blocked: true, status: r.status, title, html };
  }

  return { blocked: false, status: r.status, html };
}

function parseGamesFromHtml(html: string) {
  const $ = load(html);
  // TODO: подставь свои селекторы (ниже — «пустышка»):
  const games: any[] = [];
  // $('.game-card-selector').each((_i, el) => { ... games.push({...}) });
  // рассчитaй pagination при необходимости
  return { games, pagination: { currentPage: 1, totalPages: 1, totalGames: games.length, hasNext: false, hasPrev: false } };
}

export async function getUserGames(username: string, page = 1, getAll = false) {
  const firstUrl = `${cfg.baseUrl}/u/${username}/games?page=${page}`;
  const first = await fetchPage(firstUrl);
  if (first.blocked) {
    return { error: "Blocked by anti-bot (Bunny Shield)", status: 429 };
  }

  // Разбираем первую страницу
  const firstParsed = parseGamesFromHtml(first.html);
  let allGames = [...firstParsed.games];
  let currentPage = page;
  let totalPages = firstParsed.pagination.totalPages ?? page;

  // Если нужно собрать все страницы — идём дальше с паузами
  if (getAll && totalPages > currentPage) {
    for (let p = currentPage + 1; p <= totalPages; p++) {
      await sleep(400 + Math.random() * 600); // вежливая задержка
      const url = `${cfg.baseUrl}/u/${username}/games?page=${p}`;
      const res = await fetchPage(url);
      if (res.blocked) {
        // при блоке не кэшируем пустоту — возвращаем ошибку
        return { error: "Blocked by anti-bot (Bunny Shield)", status: 429 };
      }
      const parsed = parseGamesFromHtml(res.html);
      allGames.push(...parsed.games);
    }
  }

  // Возвращаем единый объект (подстрой под свой тип gamesResponse)
  return {
    games: allGames,
    pagination: {
      currentPage,
      totalPages,
      totalGames: allGames.length,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  };
}
