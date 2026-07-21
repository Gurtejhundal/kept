import type { User } from "@supabase/supabase-js";
import { getAssetBlob, loadArchive, persistCollection, persistItem } from "./archive-db";
import type { Collection, SavedItem } from "./types";
import { normalizeUrl } from "./urls";
import { getSupabaseBrowserClient } from "./supabase";

function itemRow(item: SavedItem, user: User, thumbnailPath?: string) {
  return {
    id: item.id,
    user_id: user.id,
    title: item.title,
    notes: item.notes,
    destination_url: item.destinationUrl || null,
    normalized_destination_url: item.destinationUrl ? normalizeUrl(item.destinationUrl) : null,
    destination_domain: item.domain,
    source_url: item.sourceUrl ?? null,
    source_platform: item.sourcePlatform,
    source_status: item.sourceStatus,
    creator_name: item.creator,
    creator_handle: item.handle,
    category: item.category,
    received_at: item.receivedAt ?? null,
    saved_at: item.savedAt,
    last_opened_at: item.lastOpenedAt ?? null,
    metadata_status: item.metadataStatus,
    thumbnail_path: thumbnailPath ?? null,
    state: item.state,
    trashed_at: item.trashedAt ?? null,
    updated_at: item.updatedAt,
    sync_version: item.syncVersion,
    deleted_at: null,
  };
}

function collectionRow(collection: Collection, user: User) {
  return {
    id: collection.id,
    user_id: user.id,
    title: collection.title,
    description: collection.description,
    cover_item_id: collection.coverItemId ?? null,
    sort_order: collection.sortOrder,
    archived_at: collection.archivedAt ?? null,
    updated_at: collection.updatedAt,
    deleted_at: null,
  };
}

function remoteItem(row: Record<string, unknown>, collectionIds: string[]): SavedItem {
  const savedAt = String(row.saved_at);
  return {
    id: String(row.id),
    title: String(row.title),
    creator: String(row.creator_name || "Creator unknown"),
    handle: String(row.creator_handle || "@unknown"),
    savedAt,
    receivedAt: typeof row.received_at === "string" ? row.received_at : undefined,
    category: String(row.category || "Other") as SavedItem["category"],
    domain: String(row.destination_domain || "image capture"),
    destinationUrl: String(row.destination_url || ""),
    sourceUrl: typeof row.source_url === "string" ? row.source_url : undefined,
    sourcePlatform: String(row.source_platform || "Other") as SavedItem["sourcePlatform"],
    notes: String(row.notes || ""),
    tags: [],
    collectionIds,
    state: String(row.state || "active") as SavedItem["state"],
    sourceStatus: String(row.source_status || "unchecked") as SavedItem["sourceStatus"],
    metadataStatus: String(row.metadata_status || "pending") as SavedItem["metadataStatus"],
    spriteIndex: -1,
    variant: "standard",
    thumbnailKey: typeof row.thumbnail_path === "string" ? String(row.id) : undefined,
    lastOpenedAt: typeof row.last_opened_at === "string" ? row.last_opened_at : undefined,
    trashedAt: typeof row.trashed_at === "string" ? row.trashed_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : savedAt,
    syncVersion: Number(row.sync_version || 0),
  };
}

function remoteCollection(row: Record<string, unknown>): Collection {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description || ""),
    updatedAt: String(row.updated_at),
    archivedAt: typeof row.archived_at === "string" ? row.archived_at : undefined,
    sortOrder: Number(row.sort_order || 0),
    coverItemId: typeof row.cover_item_id === "string" ? row.cover_item_id : undefined,
  };
}

export async function syncArchive(user: User) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured.");
  const local = await loadArchive();
  const [itemsResult, collectionsResult, relationshipsResult] = await Promise.all([
    client.from("saved_items").select("*").is("deleted_at", null),
    client.from("collections").select("*").is("deleted_at", null),
    client.from("collection_items").select("collection_id,saved_item_id,sort_order"),
  ]);
  const firstError = itemsResult.error ?? collectionsResult.error ?? relationshipsResult.error;
  if (firstError) throw firstError;

  const relationships = (relationshipsResult.data ?? []) as Array<{ collection_id: string; saved_item_id: string; sort_order: number }>;
  const remoteItems = ((itemsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => remoteItem(row, relationships.filter((link) => link.saved_item_id === row.id).sort((a, b) => a.sort_order - b.sort_order).map((link) => link.collection_id)));
  const remoteCollections = ((collectionsResult.data ?? []) as Array<Record<string, unknown>>).map(remoteCollection);
  const remoteItemMap = new Map(remoteItems.map((item) => [item.id, item]));
  const remoteCollectionMap = new Map(remoteCollections.map((collection) => [collection.id, collection]));

  for (const item of local.items) {
    const remote = remoteItemMap.get(item.id);
    if (!remote || item.updatedAt > remote.updatedAt) {
      const asset = await getAssetBlob(item.id);
      let thumbnailPath: string | undefined;
      if (asset) {
        thumbnailPath = `${user.id}/${item.id}.webp`;
        const upload = await client.storage.from("kept-images").upload(thumbnailPath, asset, { contentType: asset.type, upsert: true });
        if (upload.error) throw upload.error;
      }
      const result = await client.from("saved_items").upsert(itemRow(item, user, thumbnailPath));
      if (result.error) throw result.error;
      remoteItemMap.set(item.id, item);
    } else if (remote.updatedAt > item.updatedAt) {
      const row = (itemsResult.data as Array<Record<string, unknown>>).find((value) => value.id === remote.id);
      let asset: Blob | undefined;
      if (typeof row?.thumbnail_path === "string") {
        const download = await client.storage.from("kept-images").download(row.thumbnail_path);
        if (!download.error) asset = download.data;
      }
      await persistItem(remote, asset);
    }
  }
  for (const remote of remoteItems) if (!local.items.some((item) => item.id === remote.id)) {
    const row = (itemsResult.data as Array<Record<string, unknown>>).find((value) => value.id === remote.id);
    let asset: Blob | undefined;
    if (typeof row?.thumbnail_path === "string") {
      const download = await client.storage.from("kept-images").download(row.thumbnail_path);
      if (!download.error) asset = download.data;
    }
    await persistItem(remote, asset);
  }

  for (const collection of local.collections) {
    const remote = remoteCollectionMap.get(collection.id);
    if (!remote || collection.updatedAt > remote.updatedAt) {
      const result = await client.from("collections").upsert(collectionRow(collection, user));
      if (result.error) throw result.error;
    } else if (remote.updatedAt > collection.updatedAt) {
      await persistCollection(remote);
    }
  }
  for (const remote of remoteCollections) if (!local.collections.some((collection) => collection.id === remote.id)) await persistCollection(remote);

  const collectionIds = local.collections.map((collection) => collection.id);
  if (collectionIds.length) {
    const removed = await client.from("collection_items").delete().in("collection_id", collectionIds);
    if (removed.error) throw removed.error;
  }
  const relationshipRows = local.items.flatMap((item) => item.collectionIds.map((collectionId, sortOrder) => ({ collection_id: collectionId, saved_item_id: item.id, sort_order: sortOrder })));
  if (relationshipRows.length) {
    const inserted = await client.from("collection_items").upsert(relationshipRows);
    if (inserted.error) throw inserted.error;
  }
  return { collections: new Set([...local.collections.map((collection) => collection.id), ...remoteCollections.map((collection) => collection.id)]).size, items: new Set([...local.items.map((item) => item.id), ...remoteItems.map((item) => item.id)]).size };
}
