import { seedCollections, seedItems } from "./seed";
import {
  categories,
  sourcePlatforms,
  type ArchivePreferences,
  type ArchiveSnapshot,
  type Collection,
  type Density,
  type SavedItem,
  type SourcePlatform,
  type SourceStatus,
  type Theme,
} from "./types";
import { detectSourcePlatform, domainFromUrl, isSafeWebUrl } from "./urls";

const DB_NAME = "kept-archive";
const DB_VERSION = 1;
const LEGACY_STORAGE_KEY = "kept-v1";
const TRASH_RETENTION_MS = 30 * 86_400_000;

const DEFAULT_PREFERENCES: ArchivePreferences = {
  density: "grid",
  recentSearches: [],
  theme: "system",
};

interface AssetRecord {
  blob: Blob;
  id: string;
}

interface MetaRecord {
  key: "initialized" | "preferences";
  value: boolean | ArchivePreferences;
}

interface LegacyMigration {
  assets: AssetRecord[];
  collections: Collection[];
  items: SavedItem[];
  preferences: ArchivePreferences;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDensity(value: unknown): value is Density {
  return value === "grid" || value === "list";
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function asDateString(value: unknown, fallback?: string) {
  if (typeof value === "string" && Number.isFinite(new Date(value).getTime())) return value;
  return fallback;
}

function normalizeSourcePlatform(value: unknown, sourceUrl: string): SourcePlatform {
  return sourcePlatforms.includes(value as SourcePlatform)
    ? value as SourcePlatform
    : detectSourcePlatform(sourceUrl);
}

function normalizeSourceStatus(value: unknown): SourceStatus {
  if (value === "available") return "available";
  if (value === "unavailable" || value === "deleted") return "unavailable";
  return "unchecked";
}

export function normalizeSavedItem(value: unknown, index = 0): SavedItem | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const title = asString(value.title);
  const destinationUrl = asString(value.destinationUrl);
  if (!id || !title || !isSafeWebUrl(destinationUrl)) return null;

  const sourceUrl = asString(value.sourceUrl || value.reelUrl);
  const state = value.state === "archived" || value.state === "trashed" ? value.state : "active";
  const category = categories.includes(value.category as (typeof categories)[number])
    ? value.category as SavedItem["category"]
    : "Other";

  const savedAt = asDateString(value.savedAt, new Date().toISOString()) as string;

  return {
    id,
    title,
    creator: asString(value.creator, "Creator unknown"),
    handle: asString(value.handle, "@unknown"),
    savedAt,
    receivedAt: asDateString(value.receivedAt),
    category,
    domain: asString(value.domain, domainFromUrl(destinationUrl)),
    destinationUrl,
    sourceUrl: isSafeWebUrl(sourceUrl) ? sourceUrl : undefined,
    sourcePlatform: normalizeSourcePlatform(value.sourcePlatform, sourceUrl || destinationUrl),
    notes: asString(value.notes),
    tags: asStringArray(value.tags),
    collectionIds: asStringArray(value.collectionIds),
    state,
    sourceStatus: normalizeSourceStatus(value.sourceStatus || value.reelStatus),
    metadataStatus: value.metadataStatus === "incomplete" ? "incomplete" : "complete",
    spriteIndex: typeof value.spriteIndex === "number" ? value.spriteIndex : index % 12,
    variant: ["short", "standard", "portrait", "tall"].includes(asString(value.variant))
      ? value.variant as SavedItem["variant"]
      : "standard",
    thumbnailKey: asString(value.thumbnailKey) || (typeof value.thumbnailData === "string" ? id : undefined),
    lastOpenedAt: asDateString(value.lastOpenedAt),
    trashedAt: state === "trashed" ? asDateString(value.trashedAt, savedAt) : undefined,
  };
}

export function normalizeCollection(value: unknown): Collection | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const title = asString(value.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    description: asString(value.description),
    updatedAt: asDateString(value.updatedAt, new Date().toISOString()) as string,
  };
}

export function isExpiredTrashItem(item: SavedItem, now: number) {
  return item.state === "trashed"
    && Boolean(item.trashedAt)
    && now - new Date(item.trashedAt as string).getTime() >= TRASH_RETENTION_MS;
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(",", 2);
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(encoded ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

export function migrateLegacyState(raw: string): LegacyMigration {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error("The previous Kept archive is not valid JSON data.");
  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items = rawItems.map(normalizeSavedItem).filter((item): item is SavedItem => Boolean(item));
  const collections = (Array.isArray(parsed.collections) ? parsed.collections : [])
    .map(normalizeCollection)
    .filter((collection): collection is Collection => Boolean(collection));
  const assets = rawItems.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.thumbnailData !== "string") return [];
    try {
      return [{ id: entry.id, blob: dataUrlToBlob(entry.thumbnailData) }];
    } catch {
      return [];
    }
  });

  return {
    assets,
    collections,
    items,
    preferences: {
      density: isDensity(parsed.density) ? parsed.density : DEFAULT_PREFERENCES.density,
      recentSearches: [],
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
    },
  };
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
  });
}

let databasePromise: Promise<IDBDatabase> | null = null;

function openArchiveDb() {
  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("items")) database.createObjectStore("items", { keyPath: "id" });
        if (!database.objectStoreNames.contains("collections")) database.createObjectStore("collections", { keyPath: "id" });
        if (!database.objectStoreNames.contains("assets")) database.createObjectStore("assets", { keyPath: "id" });
        if (!database.objectStoreNames.contains("meta")) database.createObjectStore("meta", { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = null;
        reject(request.error ?? new Error("Kept could not open browser storage."));
      };
    });
  }
  return databasePromise;
}

async function writeInitialArchive(database: IDBDatabase, migration?: LegacyMigration) {
  const source = migration ?? {
    assets: [],
    collections: seedCollections,
    items: seedItems,
    preferences: DEFAULT_PREFERENCES,
  };
  const transaction = database.transaction(["items", "collections", "assets", "meta"], "readwrite");
  source.items.forEach((item) => transaction.objectStore("items").put(item));
  source.collections.forEach((collection) => transaction.objectStore("collections").put(collection));
  source.assets.forEach((asset) => transaction.objectStore("assets").put(asset));
  transaction.objectStore("meta").put({ key: "preferences", value: source.preferences } satisfies MetaRecord);
  transaction.objectStore("meta").put({ key: "initialized", value: true } satisfies MetaRecord);
  await transactionDone(transaction);
}

export async function loadArchive(): Promise<ArchiveSnapshot> {
  const database = await openArchiveDb();
  const initTransaction = database.transaction("meta", "readonly");
  const initialized = await requestResult(initTransaction.objectStore("meta").get("initialized") as IDBRequest<MetaRecord | undefined>);
  await transactionDone(initTransaction);

  if (!initialized?.value) {
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    await writeInitialArchive(database, legacyRaw ? migrateLegacyState(legacyRaw) : undefined);
    if (legacyRaw) window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  const transaction = database.transaction(["items", "collections", "assets", "meta"], "readonly");
  const [rawItems, rawCollections, assets, preferenceRecord] = await Promise.all([
    requestResult(transaction.objectStore("items").getAll()),
    requestResult(transaction.objectStore("collections").getAll()),
    requestResult(transaction.objectStore("assets").getAll() as IDBRequest<AssetRecord[]>),
    requestResult(transaction.objectStore("meta").get("preferences") as IDBRequest<MetaRecord | undefined>),
  ]);
  await transactionDone(transaction);

  const now = Date.now();
  const normalizedItems = rawItems.map(normalizeSavedItem).filter((item): item is SavedItem => Boolean(item));
  const expired = normalizedItems.filter((item) => isExpiredTrashItem(item, now));
  if (expired.length) {
    const cleanup = database.transaction(["items", "assets"], "readwrite");
    expired.forEach((item) => {
      cleanup.objectStore("items").delete(item.id);
      cleanup.objectStore("assets").delete(item.id);
    });
    await transactionDone(cleanup);
  }

  const preferencesValue = preferenceRecord?.value;
  const preferences = isRecord(preferencesValue) ? {
    density: isDensity(preferencesValue.density) ? preferencesValue.density : DEFAULT_PREFERENCES.density,
    recentSearches: asStringArray(preferencesValue.recentSearches).slice(0, 8),
    theme: isTheme(preferencesValue.theme) ? preferencesValue.theme : DEFAULT_PREFERENCES.theme,
  } : DEFAULT_PREFERENCES;
  const activeItemIds = new Set(normalizedItems.filter((item) => !expired.some((expiredItem) => expiredItem.id === item.id)).map((item) => item.id));

  return {
    collections: rawCollections.map(normalizeCollection).filter((collection): collection is Collection => Boolean(collection)),
    items: normalizedItems.filter((item) => !expired.some((expiredItem) => expiredItem.id === item.id)),
    preferences,
    thumbnailUrls: Object.fromEntries(assets.filter((asset) => activeItemIds.has(asset.id)).map((asset) => [asset.id, URL.createObjectURL(asset.blob)])),
  };
}

export async function persistItem(item: SavedItem, thumbnail?: Blob) {
  const database = await openArchiveDb();
  const stores = thumbnail ? ["items", "assets"] : ["items"];
  const transaction = database.transaction(stores, "readwrite");
  transaction.objectStore("items").put(item);
  if (thumbnail) transaction.objectStore("assets").put({ id: item.id, blob: thumbnail } satisfies AssetRecord);
  await transactionDone(transaction);
}

export async function persistItems(items: SavedItem[]) {
  const database = await openArchiveDb();
  const transaction = database.transaction("items", "readwrite");
  items.forEach((item) => transaction.objectStore("items").put(item));
  await transactionDone(transaction);
}

export async function persistCollection(collection: Collection) {
  const database = await openArchiveDb();
  const transaction = database.transaction("collections", "readwrite");
  transaction.objectStore("collections").put(collection);
  await transactionDone(transaction);
}

export async function persistPreferences(preferences: ArchivePreferences) {
  const database = await openArchiveDb();
  const transaction = database.transaction("meta", "readwrite");
  transaction.objectStore("meta").put({ key: "preferences", value: preferences } satisfies MetaRecord);
  await transactionDone(transaction);
}

export async function clearLocalArchive() {
  const database = await openArchiveDb();
  const transaction = database.transaction(["items", "collections", "assets", "meta"], "readwrite");
  transaction.objectStore("items").clear();
  transaction.objectStore("collections").clear();
  transaction.objectStore("assets").clear();
  transaction.objectStore("meta").put({ key: "preferences", value: DEFAULT_PREFERENCES } satisfies MetaRecord);
  transaction.objectStore("meta").put({ key: "initialized", value: true } satisfies MetaRecord);
  await transactionDone(transaction);
}

export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return { persisted: false, quota: 0, usage: 0 };
  const [estimate, persisted] = await Promise.all([
    navigator.storage.estimate(),
    navigator.storage.persisted?.() ?? Promise.resolve(false),
  ]);
  return {
    persisted,
    quota: estimate.quota ?? 0,
    usage: estimate.usage ?? 0,
  };
}

export async function requestPersistentStorage() {
  return navigator.storage?.persist?.() ?? false;
}
