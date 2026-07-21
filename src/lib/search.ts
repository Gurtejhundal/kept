import type { Collection, DateBasis, SavedItem } from "./types";

export function memoryDate(item: SavedItem, basis: DateBasis = "memory") {
  if (basis === "received") return item.receivedAt ?? item.savedAt;
  if (basis === "saved") return item.savedAt;
  return item.receivedAt ?? item.savedAt;
}

function exactOrContains(value: string, query: string, exact: number, contains: number) {
  const normalized = value.toLowerCase();
  return normalized === query ? exact : normalized.includes(query) ? contains : 0;
}

export function searchScore(item: SavedItem, collections: Collection[], rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 0;
  const collectionNames = collections
    .filter((collection) => item.collectionIds.includes(collection.id))
    .map((collection) => collection.title);
  return Math.max(
    exactOrContains(item.title, query, 1_000, 800),
    exactOrContains(item.creator, query, 700, 620),
    exactOrContains(item.handle, query, 680, 600),
    ...item.tags.map((tag) => exactOrContains(tag, query, 580, 520)),
    exactOrContains(item.category, query, 500, 440),
    exactOrContains(item.notes, query, 400, 360),
    exactOrContains(item.domain, query, 320, 280),
    exactOrContains(item.sourcePlatform, query, 300, 260),
    ...collectionNames.map((name) => exactOrContains(name, query, 460, 420)),
    memoryDate(item).slice(0, 10).includes(query) ? 240 : 0,
  );
}
