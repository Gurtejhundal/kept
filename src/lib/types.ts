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
export type ReelStatus = "available" | "deleted" | "unknown";
export type MetadataStatus = "complete" | "incomplete";
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
  reelUrl?: string;
  notes: string;
  tags: string[];
  collectionIds: string[];
  state: ItemState;
  reelStatus: ReelStatus;
  metadataStatus: MetadataStatus;
  spriteIndex: number;
  variant: CardVariant;
  thumbnailData?: string;
  lastOpenedAt?: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  itemIds: string[];
  shared: boolean;
  updatedAt: string;
}

export type ViewId =
  | "home"
  | "search"
  | "all"
  | "collections"
  | "shared"
  | "archive"
  | "trash"
  | "settings";

export type DateFilter = "all" | "today" | "week" | "month";
export type Density = "grid" | "list";
export type Theme = "light" | "dark";
