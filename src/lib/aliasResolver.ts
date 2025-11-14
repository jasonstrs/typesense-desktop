import type { CollectionAlias } from '@/hooks/useAliases';

/**
 * Get the display name for a collection, preferring alias name if one exists
 * @param collectionName - The actual collection name
 * @param aliases - Array of all aliases
 * @returns The alias name if one points to this collection, otherwise the collection name
 */
export function getDisplayName(collectionName: string, aliases?: CollectionAlias[]): string {
  if (!aliases || aliases.length === 0) return collectionName;

  // Find first alias that points to this collection
  const alias = aliases.find((a) => a.collection_name === collectionName);
  return alias ? alias.name : collectionName;
}

/**
 * Check if a given name is an alias
 * @param name - The name to check
 * @param aliases - Array of all aliases
 * @returns True if the name is an alias
 */
export function isAlias(name: string, aliases?: CollectionAlias[]): boolean {
  if (!aliases || aliases.length === 0) return false;
  return aliases.some((a) => a.name === name);
}

/**
 * Resolve a name (alias or collection) to the actual collection name
 * @param name - The alias or collection name
 * @param aliases - Array of all aliases
 * @returns The actual collection name
 */
export function resolveToCollection(name: string, aliases?: CollectionAlias[]): string {
  if (!aliases || aliases.length === 0) return name;

  const alias = aliases.find((a) => a.name === name);
  return alias ? alias.collection_name : name;
}

/**
 * Get all aliases that point to a specific collection
 * @param collectionName - The collection name
 * @param aliases - Array of all aliases
 * @returns Array of aliases pointing to this collection
 */
export function getAliasesForCollection(collectionName: string, aliases?: CollectionAlias[]): CollectionAlias[] {
  if (!aliases || aliases.length === 0) return [];
  return aliases.filter((a) => a.collection_name === collectionName);
}
