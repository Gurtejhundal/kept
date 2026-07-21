export const categories = [
  "Fashion",
  "Beauty",
  "Study",
  "Courses",
  "Career",
  "Technology",
  "Food",
  "Travel",
  "Fitness",
  "Home",
  "Entertainment",
  "Other",
] as const;

export type Category = (typeof categories)[number];
export type ItemState = "active" | "archived" | "trashed";
export const sourcePlatforms = [
  "Instagram",
  "TikTok",
  "YouTube",
  "WhatsApp",
  "Telegram",
  "Web",
  "Other",
] as const;
export type SourcePlatform = (typeof sourcePlatforms)[number];
export type SourceStatus = "available" | "unavailable" | "unchecked";
export type MetadataStatus = "pending" | "complete" | "partial" | "failed" | "manual";
export type CardVariant = "short" | "standard" | "portrait" | "tall";

export interface SavedItem {
  id: string;
  title: string;
  creator: string;
  handle: string;
  savedAt: string;
  receivedAt?: string;
  category: Category;
  domain: string;
  destinationUrl: string;
  sourceUrl?: string;
  sourcePlatform: SourcePlatform;
  notes: string;
  tags: string[];
  collectionIds: string[];
  state: ItemState;
  sourceStatus: SourceStatus;
  metadataStatus: MetadataStatus;
  spriteIndex: number;
  variant: CardVariant;
  thumbnailKey?: string;
  lastOpenedAt?: string;
  trashedAt?: string;
  updatedAt: string;
  syncVersion: number;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  archivedAt?: string;
  sortOrder: number;
  coverItemId?: string;
}

export type ViewId =
  | "home"
  | "search"
  | "all"
  | "collections"
  | "archive"
  | "trash"
  | "settings";

export type DateFilter = "all" | "today" | "week" | "month" | "custom";
export type DateBasis = "memory" | "received" | "saved";
export type Density = "grid" | "list";
export type Theme = "light" | "dark" | "system";
export type SortOrder = "newest" | "oldest" | "title";

export interface ArchivePreferences {
  density: Density;
  recentSearches: string[];
  theme: Theme;
}

export interface ArchiveSnapshot {
  collections: Collection[];
  items: SavedItem[];
  preferences: ArchivePreferences;
  thumbnailUrls: Record<string, string>;
}
