//Copyright 2023 Qewertyy, MIT License

import axios from "axios";

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

    const response = await axios.post(
      `${IGDB_BASE_URL}/games`,
      `fields id,name; search "${gameName}"; limit 1;`,
      {
        headers: {
          "Client-ID": IGDB_CLIENT_ID!,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        }
      }
    );

    if (response.data && response.data.length > 0) {
      return response.data[0].id;
    }

    return null;
  } catch (error) {
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

    // First, get the game with developers
    const gameResponse = await axios.post(
      `${IGDB_BASE_URL}/games`,
      `fields developers; where id = ${gameId};`,
      {
        headers: {
          "Client-ID": IGDB_CLIENT_ID!,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        }
      }
    );

    if (!gameResponse.data || !gameResponse.data[0] || !gameResponse.data[0].developers) {
      return null;
    }

    const developerIds = gameResponse.data[0].developers;

    // Then, get the developer names
    const developersResponse = await axios.post(
      `${IGDB_BASE_URL}/companies`,
      `fields name; where id = (${developerIds.join(",")});`,
      {
        headers: {
          "Client-ID": IGDB_CLIENT_ID!,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        }
      }
    );

    if (developersResponse.data && developersResponse.data.length > 0) {
      return developersResponse.data.map((dev: any) => dev.name);
    }

    return null;
  } catch (error) {
    console.log(`Failed to get developers for game ID ${gameId}:`, error);
    return null;
  }
}

// Main function to get developers by game name
export async function getDevelopersFromIGDBAPI(gameName: string): Promise<string | null> {
  try {
    console.log(`Searching for game "${gameName}" on IGDB API`);
    
    // Search for the game
    const gameId = await searchGameByName(gameName);
    if (!gameId) {
      console.log(`Game "${gameName}" not found on IGDB`);
      return null;
    }

    console.log(`Found game "${gameName}" with ID: ${gameId}`);

    // Get developers
    const developers = await getGameDevelopers(gameId);
    if (!developers || developers.length === 0) {
      console.log(`No developers found for game "${gameName}"`);
      return null;
    }

    const result = developers.join(", ");
    console.log(`Found IGDB developers for "${gameName}": ${result}`);
    return result;
  } catch (error) {
    console.log(`Failed to get developers from IGDB API for "${gameName}":`, error);
    return null;
  }
}
