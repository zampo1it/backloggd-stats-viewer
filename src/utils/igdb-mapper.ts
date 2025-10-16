import mappings from '../data/igdb-mappings.json';

// Type assertion to fix TypeScript errors
const typedMappings = mappings as any;

// Convert ID arrays to readable names using local mappings
export function convertIdsToNames(ids: number[], type: 'genres' | 'game_modes' | 'themes' | 'companies' | 'collections' | 'franchises' | 'game_engines' | 'keywords'): string[] {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const mapping = typedMappings[type];
  if (!mapping) {
    return [];
  }

  return ids
    .map(id => mapping[id.toString()] || `Unknown ${type.slice(0, -1)} ID: ${id}`)
    .filter(name => name !== undefined);
}

// Convert single ID to name
export function convertIdToName(id: number, type: 'genres' | 'game_modes' | 'themes' | 'companies' | 'collections' | 'franchises' | 'game_engines' | 'keywords'): string | null {
  const mapping = typedMappings[type];
  if (!mapping) {
    return null;
  }

  return mapping[id.toString()] || `Unknown ${type.slice(0, -1)} ID: ${id}`;
}

// Convert involved companies (more complex, needs company names)
export function convertCompanyIds(companyIds: number[]): string[] {
  return convertIdsToNames(companyIds, 'companies');
}

// Convert franchises
export function convertFranchiseIds(franchiseIds: number[]): string[] {
  return convertIdsToNames(franchiseIds, 'franchises');
}

// Convert game engines
export function convertGameEngineIds(engineIds: number[]): string[] {
  return convertIdsToNames(engineIds, 'game_engines');
}

// Convert keywords
export function convertKeywordIds(keywordIds: number[]): string[] {
  return convertIdsToNames(keywordIds, 'keywords');
}

// Convert collections (series)
export function convertCollectionIds(collectionIds: number[]): string[] {
  return convertIdsToNames(collectionIds, 'collections');
}
