//Copyright 2023 Qewertyy, MIT License

import axios from "axios";
import type { Game, Company, Genre, GameMode, Theme, Franchise, GameEngine, Keyword, Collection } from "igdb-api-types";
import { convertIdsToNames, convertCompanyIds, convertFranchiseIds, convertGameEngineIds, convertKeywordIds, convertCollectionIds } from "../utils/igdb-mapper";

// IGDB API configuration
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN;

// IGDB API endpoints
const IGDB_BASE_URL = "https://api.igdb.com/v4";

// Get access token for IGDB API
async function getIGDBAccessToken(): Promise<string | null> {
  try {
    if (IGDB_ACCESS_TOKEN) {
      return IGDB_ACCESS_TOKEN;
    }

    if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
      console.log("IGDB credentials not configured");
      return null;
    }

    const response = await axios.post("https://id.twitch.tv/oauth2/token", {
      client_id: IGDB_CLIENT_ID,
      client_secret: IGDB_CLIENT_SECRET,
      grant_type: "client_credentials"
    });

    return response.data.access_token;
  } catch (error) {
    console.log("Failed to get IGDB access token:", error);
    return null;
  }
}

// Search for a game by name and return its ID
async function searchGameByName(gameName: string): Promise<number | null> {
  try {
    const accessToken = await getIGDBAccessToken();
    if (!accessToken) {
      return null;
    }

    // Use apicalypse for consistent POST requests
    const apicalypse = (await import("apicalypse")).default;
    const response = await apicalypse({
      queryMethod: 'body',
      method: 'post',
      baseURL: IGDB_BASE_URL,
      headers: {
        "Client-ID": IGDB_CLIENT_ID!,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "text/plain"
      }
    })
    .search(gameName)
    .fields('id,name')
    .limit(1)
    .request('/games');

    if (response.data && response.data.length > 0) {
      return response.data[0].id;
    }

    return null;
  } catch (error: any) {
    // Handle rate limiting (429) with retry
    if (error.response?.status === 429) {
      console.log(`Rate limited for "${gameName}", waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return searchGameByName(gameName); // Retry once
    }
    console.log(`Failed to search game "${gameName}" on IGDB:`, error);
    return null;
  }
}

// Get developers for a game by game ID
async function getGameDevelopers(gameId: number): Promise<string[] | null> {
  try {
    const accessToken = await getIGDBAccessToken();
    if (!accessToken) {
      return null;
    }

    // First, get the game with involved companies
    const gameResponse = await axios.post(
      `${IGDB_BASE_URL}/games`,
      `fields name, involved_companies.company.name; where id = ${gameId};`,
      {
        headers: {
          "Client-ID": IGDB_CLIENT_ID!,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        }
      }
    );

    if (!gameResponse.data || !gameResponse.data[0] || !gameResponse.data[0].involved_companies) {
      return null;
    }

    // Extract developer names directly from involved_companies
    const involvedCompanies = gameResponse.data[0].involved_companies;
    if (!involvedCompanies || involvedCompanies.length === 0) {
      return null;
    }

    // Filter for developer companies and extract names
    const developers = involvedCompanies
      .filter((company: any) => company.company && company.company.name)
      .map((company: any) => company.company.name);

    if (developers.length === 0) {
      return null;
    }

    return developers;
  } catch (error: any) {
    // Handle rate limiting (429) with retry
    if (error.response?.status === 429) {
      console.log(`Rate limited for game ID ${gameId}, waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return getGameDevelopers(gameId); // Retry once
    }
    console.log(`Failed to get developers for game ID ${gameId}:`, error);
    return null;
  }
}

// Get complete game information from IGDB API
async function getCompleteGameInfo(gameId: number): Promise<any | null> {
  try {
    const accessToken = await getIGDBAccessToken();
    if (!accessToken) {
      return null;
    }

    const response = await axios.post(
      `${IGDB_BASE_URL}/games`,
      `fields *; where id = ${gameId};`,
      {
        headers: {
          "Client-ID": IGDB_CLIENT_ID!,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        }
      }
    );

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  } catch (error: any) {
    // Handle rate limiting (429) with retry
    if (error.response?.status === 429) {
      console.log(`Rate limited for game ID ${gameId}, waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return getCompleteGameInfo(gameId); // Retry once
    }
    console.log(`Failed to get complete game info for game ID ${gameId}:`, error);
    return null;
  }
}

// Get readable names for IDs
async function getReadableNames(ids: number[], type: string): Promise<string[]> {
  try {
    const accessToken = await getIGDBAccessToken();
    if (!accessToken || !ids || ids.length === 0) {
      return [];
    }

    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 300));

    const response = await axios.post(
      `${IGDB_BASE_URL}/${type}`,
      `fields name; where id = (${ids.join(",")});`,
      {
        headers: {
          "Client-ID": IGDB_CLIENT_ID!,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        }
      }
    );

    if (response.data && response.data.length > 0) {
      return response.data.map((item: any) => item.name);
    }

    return [];
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log(`Rate limited for ${type}, waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return getReadableNames(ids, type); // Retry once
    }
    console.log(`Failed to get readable names for ${type}:`, error);
    return [];
  }
}

// Get game information directly by IGDB ID (most accurate method)
export async function getCompleteGameInfoByID(gameId: string): Promise<any | null> {
  try {
    console.log(`Getting complete game info for IGDB ID: ${gameId}`);

    // Add delay to respect IGDB rate limits
    await new Promise(resolve => setTimeout(resolve, 500));

    const numericGameId = parseInt(gameId);
    if (isNaN(numericGameId)) {
      console.log(`Invalid game ID: ${gameId}`);
      return null;
    }

    // Get ALL information in ONE request using the ID directly
    const completeInfo = await getAllGameInfo(numericGameId);
    if (!completeInfo) {
      console.log(`No complete info found for game ID ${gameId}`);
      return null;
    }

    console.log(`Found complete IGDB info for game ID ${gameId} with readable names`);
    
    return completeInfo;
  } catch (error) {
    console.log(`Failed to get complete game info from IGDB API for game ID ${gameId}:`, error);
    return null;
  }
}

// Get all game information in ONE request (as per IGDB documentation)
export async function getCompleteGameInfoFromIGDBAPI(gameName: string): Promise<any | null> {
  try {
    console.log(`Searching for complete game info "${gameName}" on IGDB API`);

    // Add delay to respect IGDB rate limits
    await new Promise(resolve => setTimeout(resolve, 500));

    // Search for the game
    const gameId = await searchGameByName(gameName);
    if (!gameId) {
      console.log(`Game "${gameName}" not found on IGDB`);
      return null;
    }

    console.log(`Found game "${gameName}" with ID: ${gameId}`);

    // Add delay before getting complete info
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get ALL information in ONE request (as per documentation: fields *; where id = GAME_ID;)
    const completeInfo = await getAllGameInfo(gameId);
    if (!completeInfo) {
      console.log(`No complete info found for game "${gameName}"`);
      return null;
    }

    console.log(`Found complete IGDB info for "${gameName}" with readable names`);
    
    // ChatGPT approach: readable names are already included in the response
    return completeInfo;
  } catch (error) {
    console.log(`Failed to get complete game info from IGDB API for "${gameName}":`, error);
    return null;
  }
}

// Get ALL game information with readable names in ONE request (ChatGPT approach)
async function getAllGameInfo(gameId: number): Promise<any | null> {
  try {
    const accessToken = await getIGDBAccessToken();
    if (!accessToken) {
      return null;
    }

    // ChatGPT approach: Get readable names directly in one query
    const apicalypse = (await import("apicalypse")).default;
    const response = await apicalypse({
      queryMethod: 'body',
      method: 'post', // ВАЖНО: IGDB требует POST запросы
      baseURL: IGDB_BASE_URL,
      headers: {
        "Client-ID": IGDB_CLIENT_ID!,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "text/plain"
      }
    })
    .fields(`
      name,
      genres.name,
      game_modes.name,
      themes.name,
      involved_companies.developer,
      involved_companies.company.name,
      collections.name,
      franchises.name,
      game_engines.name,
      keywords.name
    `)
    .where(`id = ${gameId}`)
    .request('/games');

    if (response.data && response.data.length > 0) {
      const game = response.data[0];
      
      // Process the response to get readable names (only keep what we need)
      const processedGame = {
        name: game.name,
        // Extract readable names
        genres_readable: game.genres?.map((g: any) => g.name) || [],
        game_modes_readable: game.game_modes?.map((gm: any) => gm.name) || [],
        themes_readable: game.themes?.map((t: any) => t.name) || [],
        developers_readable: game.involved_companies
          ?.filter((ic: any) => ic.developer)
          ?.map((ic: any) => ic.company?.name)
          ?.filter(Boolean) || [],
        series_readable: game.collections?.map((c: any) => c.name) || [],
        franchises_readable: game.franchises?.map((f: any) => f.name) || [],
        game_engines_readable: game.game_engines?.map((ge: any) => ge.name) || [],
        keywords_readable: game.keywords?.map((k: any) => k.name) || []
      };

      return processedGame;
    }

    return null;
  } catch (error: any) {
    // Handle rate limiting (429) with retry
    if (error.response?.status === 429) {
      console.log(`Rate limited for game ID ${gameId}, waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return getAllGameInfo(gameId); // Retry once
    }
    console.log(`Failed to get all game info for game ID ${gameId}:`, error);
    return null;
  }
}
