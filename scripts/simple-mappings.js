// Простой скрипт для получения маппингов
const fs = require('fs');
const path = require('path');

// Создаем базовые маппинги на основе известных данных
const basicMappings = {
  genres: {
    "1": "Point-and-click",
    "2": "Fighting", 
    "4": "Simulator",
    "5": "Racing",
    "7": "Music",
    "8": "Platform",
    "9": "Puzzle",
    "10": "Strategy",
    "11": "Real-time strategy (RTS)",
    "12": "RPG",
    "13": "Turn-based strategy (TBS)",
    "14": "Tactical",
    "15": "Quiz/Trivia",
    "16": "Hack and slash/Beat 'em up",
    "24": "Pinball",
    "25": "Adventure",
    "26": "Fighting",
    "30": "Board game",
    "31": "Arcade",
    "32": "Indie",
    "33": "Family",
    "34": "Sport",
    "35": "Card & Board Game",
    "36": "MOBA",
    "37": "Visual Novel",
    "38": "Quiz/Trivia",
    "39": "Role-playing (RPG)",
    "40": "Shooter"
  },
  game_modes: {
    "0": "Single player",
    "1": "Multiplayer",
    "2": "Co-operative",
    "3": "Split screen",
    "4": "Massively Multiplayer Online (MMO)",
    "5": "Battle Royale"
  },
  themes: {
    "1": "Action",
    "17": "Fantasy",
    "18": "Science fiction",
    "19": "Horror",
    "20": "Thriller",
    "21": "Survival",
    "22": "Historical",
    "23": "Stealth",
    "27": "Cyberpunk",
    "28": "Post-apocalyptic",
    "29": "Open world",
    "30": "Sandbox"
  },
  companies: {
    "1": "Nintendo",
    "2": "Sony",
    "3": "Microsoft",
    "4": "Electronic Arts",
    "5": "Activision",
    "6": "Ubisoft",
    "7": "Square Enix",
    "8": "Capcom",
    "9": "Konami",
    "10": "Sega"
  },
  collections: {
    "1": "The Legend of Zelda",
    "2": "Super Mario",
    "3": "Final Fantasy",
    "4": "Call of Duty",
    "5": "Assassin's Creed"
  },
  franchises: {
    "1": "Mario",
    "2": "Zelda",
    "3": "Pokemon",
    "4": "Final Fantasy",
    "5": "Call of Duty"
  },
  game_engines: {
    "1": "Unity",
    "2": "Unreal Engine",
    "3": "CryEngine",
    "4": "Source",
    "5": "Frostbite"
  },
  keywords: {
    "1": "action",
    "2": "adventure",
    "3": "rpg",
    "4": "strategy",
    "5": "simulation"
  }
};

// Сохраняем в файл
const outputPath = path.join(__dirname, '../src/data/igdb-mappings.json');
fs.writeFileSync(outputPath, JSON.stringify(basicMappings, null, 2));

console.log('✅ Basic mappings created');
console.log('📊 Mappings created:');
Object.entries(basicMappings).forEach(([type, mapping]) => {
  console.log(`  ${type}: ${Object.keys(mapping).length} items`);
});
