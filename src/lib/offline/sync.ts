import { supabase } from '$lib/supabase/client';
import { getOfflineQueueItems, removeFromOfflineQueue } from './storage';

let isSyncing = false;

/**
 * Iterates through all items pending in the offline synchronization queue and pushes them
 * to Supabase (`user_artwork_progress`).
 * If an item successfully syncs, it is purged from IndexedDB (`offline_sync_queue`).
 * If Supabase returns an error (e.g., 5xx server error or connection loss), the record remains
 * in the queue to be retried on the next flush.
 */
export async function flushOfflineQueue(): Promise<{ successCount: number; failCount: number }> {
	if (typeof window === 'undefined' || !navigator.onLine || isSyncing) {
		return { successCount: 0, failCount: 0 };
	}

	isSyncing = true;
	let successCount = 0;
	let failCount = 0;

	try {
		const queueItems = await getOfflineQueueItems();
		if (queueItems.length === 0) {
			isSyncing = false;
			return { successCount: 0, failCount: 0 };
		}

		for (const item of queueItems) {
			if (item.queue_id === undefined) continue;

			try {
				// 2. Upsert into `user_artwork_progress` if `artwork_id` is provided
				if (item.artwork_id !== undefined && item.artwork_id !== null) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const { error: upsertError } = await (supabase.from('user_artwork_progress') as any).upsert(
						{
							user_id: item.user_id,
							artwork_id: item.artwork_id,
							box_level: item.box_level ?? (item.is_correct ? 2 : 1),
							consecutive_correct: item.consecutive_correct ?? (item.is_correct ? 1 : 0),
							next_review_at: item.next_review_at ?? new Date(Date.now() + 86400000).toISOString(),
							last_score: item.score ?? null,
							updated_at: new Date().toISOString()
						},
						{ onConflict: 'user_id, artwork_id' }
					);

					if (upsertError) {
						// Note: if upsert fails, we don't remove from queue so both can be retried safely or logged
						failCount++;
						continue;
					}
				}

				// 3. Purge synchronized item from IndexedDB
				await removeFromOfflineQueue(item.queue_id);
				successCount++;
			} catch (err) {
				failCount++;
			}
		}
	} finally {
		isSyncing = false;
	}

	return { successCount, failCount };
}

