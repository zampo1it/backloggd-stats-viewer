const axios = require('axios');
const fs = require('fs');
const path = require('path');

// IGDB API configuration
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
const IGDB_BASE_URL = "https://api.igdb.com/v4";
const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";

async function getIGDBAccessToken() {
  try {
    const response = await axios.post(
      TWITCH_AUTH_URL,
      null,
      {
        params: {
          client_id: IGDB_CLIENT_ID,
          client_secret: IGDB_CLIENT_SECRET,
          grant_type: "client_credentials",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Failed to get IGDB access token:", error);
    return null;
  }
}

async function fetchMappings(type, endpoint) {
  try {
    const accessToken = await getIGDBAccessToken();
    if (!accessToken) {
      console.error("No access token available");
      return {};
    }

    console.log(`Fetching ${type} mappings...`);
    
    const response = await axios.post(
      `${IGDB_BASE_URL}/${endpoint}`,
      `fields id,name; limit 500;`,
      {
        headers: {
          "Client-ID": IGDB_CLIENT_ID,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain"
        }
      }
    );

    const mapping = {};
    response.data.forEach(item => {
      mapping[item.id.toString()] = item.name;
    });

    console.log(`Found ${Object.keys(mapping).length} ${type} mappings`);
    return mapping;
  } catch (error) {
    console.error(`Failed to fetch ${type} mappings:`, error);
    return {};
  }
}

async function generateMappings() {
  console.log("🚀 Fetching IGDB mappings...");
  
  const mappings = {
    genres: await fetchMappings('genres', 'genres'),
    game_modes: await fetchMappings('game_modes', 'game_modes'),
    themes: await fetchMappings('themes', 'themes'),
    companies: await fetchMappings('companies', 'companies'),
    collections: await fetchMappings('collections', 'collections'),
    franchises: await fetchMappings('franchises', 'franchises'),
    game_engines: await fetchMappings('game_engines', 'game_engines'),
    keywords: await fetchMappings('keywords', 'keywords'),
    platforms: await fetchMappings('platforms', 'platforms')
  };

  // Save to file
  const outputPath = path.join(__dirname, '../src/data/igdb-mappings.json');
  fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 2));
  
  console.log(`✅ Mappings saved to ${outputPath}`);
  console.log(`📊 Total mappings:`);
  Object.entries(mappings).forEach(([type, mapping]) => {
    console.log(`  ${type}: ${Object.keys(mapping).length} items`);
  });
}

// Run the script
generateMappings().catch(console.error);