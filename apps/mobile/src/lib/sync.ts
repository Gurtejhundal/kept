import { completePendingSync, listPendingSync, recordPendingSyncFailure, type MobileSavedItem } from './database';
import { getSupabaseClient } from './supabase';

function savedItemRow(item: MobileSavedItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    notes: item.notes,
    destination_url: item.destinationUrl || null,
    normalized_destination_url: item.destinationUrl || null,
    destination_domain: item.domain,
    source_platform: 'Other',
    source_status: 'unchecked',
    creator_name: '',
    creator_handle: '',
    category: item.category,
    saved_at: item.savedAt,
    updated_at: item.updatedAt,
    sync_version: item.syncVersion,
    metadata_status: 'manual',
    state: 'active',
    deleted_at: null,
  };
}

export async function syncPendingCaptures() {
  const client = getSupabaseClient();
  if (!client) return { configured: false, synced: 0 };
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) return { configured: true, signedIn: false, synced: 0 };

  let synced = 0;
  for (const entry of await listPendingSync()) {
    try {
      const result = entry.operation === 'delete'
        ? await client.from('saved_items').update({ deleted_at: new Date().toISOString() }).eq('id', entry.entityId)
        : await client.from('saved_items').upsert(savedItemRow(entry.payload, data.user.id));
      if (result.error) throw result.error;
      await completePendingSync(entry.id);
      synced += 1;
    } catch (syncError) {
      await recordPendingSyncFailure(entry.id);
      throw syncError;
    }
  }
  return { configured: true, signedIn: true, synced };
}
