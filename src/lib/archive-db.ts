import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
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
const DB_VERSION = 2;
const LEGACY_STORAGE_KEY = "kept-v1";
const LEGACY_RECOVERY_KEY = "kept-v1-recovery";
const TRASH_RETENTION_MS = 30 * 86_400_000;
const BACKUP_SCHEMA_VERSION = 1;

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

export interface PendingShare {
  id: string;
  media?: Blob;
  text?: string;
  title?: string;
  url?: string;
  createdAt: string;
}

export interface BackupPreview {
  collections: number;
  duplicateItems: number;
  images: number;
  invalidCollections: number;
  invalidItems: number;
  items: number;
}

interface ParsedBackup {
  assets: AssetRecord[];
  collections: Collection[];
  invalidCollections: number;
  invalidItems: number;
  items: SavedItem[];
  preferences: ArchivePreferences;
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
  const thumbnailKey = asString(value.thumbnailKey) || (typeof value.thumbnailData === "string" ? id : undefined);
  if (!id || !title || (destinationUrl !== "" && !isSafeWebUrl(destinationUrl)) || (!destinationUrl && !thumbnailKey)) return null;

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
    domain: asString(value.domain, destinationUrl ? domainFromUrl(destinationUrl) : "image capture"),
    destinationUrl,
    sourceUrl: isSafeWebUrl(sourceUrl) ? sourceUrl : undefined,
    sourcePlatform: normalizeSourcePlatform(value.sourcePlatform, sourceUrl || destinationUrl),
    notes: asString(value.notes),
    tags: asStringArray(value.tags),
    collectionIds: asStringArray(value.collectionIds),
    state,
    sourceStatus: normalizeSourceStatus(value.sourceStatus || value.reelStatus),
    metadataStatus: ["pending", "complete", "partial", "failed", "manual"].includes(asString(value.metadataStatus))
      ? value.metadataStatus as SavedItem["metadataStatus"]
      : value.metadataStatus === "incomplete" ? "partial" : "complete",
    spriteIndex: typeof value.spriteIndex === "number" ? value.spriteIndex : index % 12,
    variant: ["short", "standard", "portrait", "tall"].includes(asString(value.variant))
      ? value.variant as SavedItem["variant"]
      : "standard",
    thumbnailKey,
    lastOpenedAt: asDateString(value.lastOpenedAt),
    trashedAt: state === "trashed" ? asDateString(value.trashedAt, savedAt) : undefined,
    updatedAt: asDateString(value.updatedAt, savedAt) as string,
    syncVersion: typeof value.syncVersion === "number" && value.syncVersion >= 0 ? value.syncVersion : 0,
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
    archivedAt: asDateString(value.archivedAt),
    sortOrder: typeof value.sortOrder === "number" ? value.sortOrder : 0,
    coverItemId: asString(value.coverItemId) || undefined,
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
        if (!database.objectStoreNames.contains("sharePayloads")) database.createObjectStore("sharePayloads", { keyPath: "id" });
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
    collections: [],
    items: [],
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
    let migration: LegacyMigration | undefined;
    if (legacyRaw) {
      try {
        migration = migrateLegacyState(legacyRaw);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        window.localStorage.setItem(LEGACY_RECOVERY_KEY, legacyRaw);
      }
    }
    await writeInitialArchive(database, migration);
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

export async function replaceItemThumbnail(item: SavedItem, thumbnail: Blob) {
  const database = await openArchiveDb();
  const transaction = database.transaction(["items", "assets"], "readwrite");
  transaction.objectStore("items").put({ ...item, thumbnailKey: item.id });
  transaction.objectStore("assets").put({ id: item.id, blob: thumbnail } satisfies AssetRecord);
  await transactionDone(transaction);
}

export async function getAssetBlob(id: string) {
  const database = await openArchiveDb();
  const transaction = database.transaction("assets", "readonly");
  const record = await requestResult(transaction.objectStore("assets").get(id) as IDBRequest<AssetRecord | undefined>);
  await transactionDone(transaction);
  return record?.blob;
}

export async function deleteItemPermanently(id: string) {
  const database = await openArchiveDb();
  const transaction = database.transaction(["items", "assets"], "readwrite");
  transaction.objectStore("items").delete(id);
  transaction.objectStore("assets").delete(id);
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

export async function deleteCollectionPermanently(id: string) {
  const database = await openArchiveDb();
  const read = database.transaction("items", "readonly");
  const rawItems = await requestResult(read.objectStore("items").getAll());
  await transactionDone(read);
  const items = rawItems.map(normalizeSavedItem).filter((item): item is SavedItem => Boolean(item));
  const transaction = database.transaction(["items", "collections"], "readwrite");
  transaction.objectStore("collections").delete(id);
  items.filter((item) => item.collectionIds.includes(id)).forEach((item) => {
    transaction.objectStore("items").put({
      ...item,
      collectionIds: item.collectionIds.filter((collectionId) => collectionId !== id),
      updatedAt: new Date().toISOString(),
      syncVersion: item.syncVersion + 1,
    });
  });
  await transactionDone(transaction);
}

export async function consumePendingShare(): Promise<PendingShare | null> {
  const database = await openArchiveDb();
  const read = database.transaction("sharePayloads", "readonly");
  const records = await requestResult(read.objectStore("sharePayloads").getAll() as IDBRequest<PendingShare[]>);
  await transactionDone(read);
  const pending = records.sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
  if (!pending) return null;
  const remove = database.transaction("sharePayloads", "readwrite");
  remove.objectStore("sharePayloads").delete(pending.id);
  await transactionDone(remove);
  return pending;
}

function parseBackupJson<T>(files: Record<string, Uint8Array>, name: string): T {
  const file = files[name];
  if (!file) throw new Error(`Backup is missing ${name}.`);
  try {
    return JSON.parse(strFromU8(file)) as T;
  } catch {
    throw new Error(`${name} is not valid JSON.`);
  }
}

async function parseBackup(file: File): Promise<ParsedBackup> {
  if (file.size > 250 * 1024 * 1024) throw new Error("Backup files must be smaller than 250 MB.");
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("Choose a valid Kept ZIP backup.");
  }
  const manifest = parseBackupJson<Record<string, unknown>>(files, "manifest.json");
  if (manifest.product !== "Kept" || manifest.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error("This backup uses an unsupported Kept schema.");
  }
  const rawItems = parseBackupJson<unknown[]>(files, "items.json");
  const rawCollections = parseBackupJson<unknown[]>(files, "collections.json");
  const rawPreferences = parseBackupJson<Record<string, unknown>>(files, "preferences.json");
  if (!Array.isArray(rawItems) || !Array.isArray(rawCollections)) throw new Error("Backup item lists are invalid.");
  const items = rawItems.map(normalizeSavedItem).filter((item): item is SavedItem => Boolean(item));
  const collections = rawCollections.map(normalizeCollection).filter((collection): collection is Collection => Boolean(collection));
  const itemIds = new Set(items.map((item) => item.id));
  const assets = Object.entries(files).flatMap(([name, bytes]) => {
    const match = /^images\/([^/]+)\.(?:webp|png|jpe?g)$/i.exec(name);
    if (!match || !itemIds.has(match[1])) return [];
    const mime = name.endsWith(".png") ? "image/png" : /\.jpe?g$/i.test(name) ? "image/jpeg" : "image/webp";
    return [{ id: match[1], blob: new Blob([new Uint8Array(bytes)], { type: mime }) }];
  });
  return {
    assets,
    collections,
    invalidCollections: rawCollections.length - collections.length,
    invalidItems: rawItems.length - items.length,
    items,
    preferences: {
      density: isDensity(rawPreferences.density) ? rawPreferences.density : DEFAULT_PREFERENCES.density,
      recentSearches: asStringArray(rawPreferences.recentSearches).slice(0, 8),
      theme: isTheme(rawPreferences.theme) ? rawPreferences.theme : DEFAULT_PREFERENCES.theme,
    },
  };
}

export async function createArchiveBackup() {
  const database = await openArchiveDb();
  const transaction = database.transaction(["items", "collections", "assets", "meta"], "readonly");
  const [items, collections, assets, preferencesRecord] = await Promise.all([
    requestResult(transaction.objectStore("items").getAll()),
    requestResult(transaction.objectStore("collections").getAll()),
    requestResult(transaction.objectStore("assets").getAll() as IDBRequest<AssetRecord[]>),
    requestResult(transaction.objectStore("meta").get("preferences") as IDBRequest<MetaRecord | undefined>),
  ]);
  await transactionDone(transaction);
  const normalizedItems = items.map(normalizeSavedItem).filter((item): item is SavedItem => Boolean(item));
  const normalizedCollections = collections.map(normalizeCollection).filter((collection): collection is Collection => Boolean(collection));
  const tagList = Array.from(new Set(normalizedItems.flatMap((item) => item.tags))).sort();
  const files: Record<string, Uint8Array> = {
    "manifest.json": strToU8(JSON.stringify({ product: "Kept", schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString() }, null, 2)),
    "items.json": strToU8(JSON.stringify(normalizedItems, null, 2)),
    "collections.json": strToU8(JSON.stringify(normalizedCollections, null, 2)),
    "categories.json": strToU8(JSON.stringify(categories, null, 2)),
    "tags.json": strToU8(JSON.stringify(tagList, null, 2)),
    "preferences.json": strToU8(JSON.stringify(preferencesRecord?.value ?? DEFAULT_PREFERENCES, null, 2)),
  };
  await Promise.all(assets.map(async ({ id, blob }) => {
    const extension = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp";
    files[`images/${id}.${extension}`] = new Uint8Array(await blob.arrayBuffer());
  }));
  return new Blob([new Uint8Array(zipSync(files, { level: 6 }))], { type: "application/zip" });
}

export async function previewArchiveBackup(file: File): Promise<BackupPreview> {
  const parsed = await parseBackup(file);
  const current = await loadArchive();
  const destinationUrls = new Set(current.items.map((item) => item.destinationUrl).filter(Boolean));
  return {
    collections: parsed.collections.length,
    duplicateItems: parsed.items.filter((item) => item.destinationUrl && destinationUrls.has(item.destinationUrl)).length,
    images: parsed.assets.length,
    invalidCollections: parsed.invalidCollections,
    invalidItems: parsed.invalidItems,
    items: parsed.items.length,
  };
}

export async function importArchiveBackup(file: File, mode: "merge" | "replace") {
  const parsed = await parseBackup(file);
  const database = await openArchiveDb();
  let items = parsed.items;
  let collections = parsed.collections;
  let assets = parsed.assets;
  if (mode === "merge") {
    const current = await loadArchive();
    const currentUrls = new Set(current.items.map((item) => item.destinationUrl).filter(Boolean));
    const currentIds = new Set(current.items.map((item) => item.id));
    const incomingItems = parsed.items.filter((item) => !currentIds.has(item.id) && (!item.destinationUrl || !currentUrls.has(item.destinationUrl)));
    const incomingIds = new Set(incomingItems.map((item) => item.id));
    items = incomingItems;
    collections = parsed.collections.filter((collection) => !current.collections.some((currentCollection) => currentCollection.id === collection.id));
    assets = parsed.assets.filter((asset) => incomingIds.has(asset.id));
  }
  const transaction = database.transaction(["items", "collections", "assets", "meta"], "readwrite");
  if (mode === "replace") {
    transaction.objectStore("items").clear();
    transaction.objectStore("collections").clear();
    transaction.objectStore("assets").clear();
  }
  items.forEach((item) => transaction.objectStore("items").put(item));
  collections.forEach((collection) => transaction.objectStore("collections").put(collection));
  assets.forEach((asset) => transaction.objectStore("assets").put(asset));
  if (mode === "replace") transaction.objectStore("meta").put({ key: "preferences", value: parsed.preferences } satisfies MetaRecord);
  transaction.objectStore("meta").put({ key: "initialized", value: true } satisfies MetaRecord);
  await transactionDone(transaction);
  return { importedCollections: collections.length, importedItems: items.length };
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
