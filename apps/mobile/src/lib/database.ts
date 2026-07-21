import * as SQLite from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';

export interface MobileSavedItem {
  id: string;
  title: string;
  notes: string;
  destinationUrl: string;
  domain: string;
  category: string;
  imageUri?: string;
  savedAt: string;
  updatedAt: string;
  syncVersion: number;
}

interface CaptureInput { destinationUrl: string; imageUri?: string; notes: string; title: string }

export interface SyncQueueEntry {
  id: number;
  entityId: string;
  operation: 'upsert' | 'delete';
  payload: MobileSavedItem;
  attempts: number;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('kept.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS saved_items (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          destination_url TEXT NOT NULL DEFAULT '',
          domain TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL DEFAULT 'Other',
          image_uri TEXT,
          state TEXT NOT NULL DEFAULT 'active',
          saved_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          sync_version INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0
        );
      `);
      return db;
    });
  }
  return databasePromise;
}

export async function saveCapture(input: CaptureInput) {
  const db = await database();
  const now = new Date().toISOString();
  const item: MobileSavedItem = { id: randomUUID(), title: input.title, notes: input.notes, destinationUrl: input.destinationUrl, domain: input.destinationUrl ? new URL(input.destinationUrl).hostname.replace(/^www\./, '') : 'image capture', category: 'Other', imageUri: input.imageUri, savedAt: now, updatedAt: now, syncVersion: 0 };
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('INSERT INTO saved_items (id,title,notes,destination_url,domain,category,image_uri,saved_at,updated_at,sync_version) VALUES (?,?,?,?,?,?,?,?,?,?)', item.id, item.title, item.notes, item.destinationUrl, item.domain, item.category, item.imageUri ?? null, item.savedAt, item.updatedAt, item.syncVersion);
    await transaction.runAsync('INSERT INTO sync_queue (entity_type,entity_id,operation,payload,created_at) VALUES (?,?,?,?,?)', 'saved_item', item.id, 'upsert', JSON.stringify(item), now);
  });
  return item;
}

export async function listItems() {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, string | number | null>>('SELECT * FROM saved_items WHERE state = ? ORDER BY saved_at DESC', 'active');
  return rows.map((row): MobileSavedItem => ({ id: String(row.id), title: String(row.title), notes: String(row.notes), destinationUrl: String(row.destination_url), domain: String(row.domain), category: String(row.category), imageUri: typeof row.image_uri === 'string' ? row.image_uri : undefined, savedAt: String(row.saved_at), updatedAt: String(row.updated_at), syncVersion: Number(row.sync_version) }));
}

export async function listPendingSync(): Promise<SyncQueueEntry[]> {
  const db = await database();
  const rows = await db.getAllAsync<Record<string, string | number>>(
    'SELECT id, entity_id, operation, payload, attempts FROM sync_queue ORDER BY id ASC LIMIT 100',
  );
  return rows.map((row) => ({
    id: Number(row.id),
    entityId: String(row.entity_id),
    operation: String(row.operation) as SyncQueueEntry['operation'],
    payload: JSON.parse(String(row.payload)) as MobileSavedItem,
    attempts: Number(row.attempts),
  }));
}

export async function completePendingSync(id: number) {
  const db = await database();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
}

export async function recordPendingSyncFailure(id: number) {
  const db = await database();
  await db.runAsync('UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?', id);
}
