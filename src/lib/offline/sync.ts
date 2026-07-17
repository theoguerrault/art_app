import { supabase } from '$lib/supabase/client';
import { getOfflineQueueItems, removeFromOfflineQueue, type OfflineSyncQueueItem } from './storage';

let isSyncing = false;

/**
 * Iterates through all items pending in the offline synchronization queue and pushes them
 * to Supabase (`historique_reponses` and `user_artwork_progress`).
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
				// 1. Insert into `historique_reponses`
				const { error: insertError } = await (supabase.from('historique_reponses') as any).insert({
					user_id: item.user_id,
					id_oeuvre: item.id_oeuvre ?? null,
					id_courant: item.id_courant ?? null,
					is_correct: item.is_correct,
					reponse_choisie: item.reponse_choisie,
					score: item.score ?? null,
					encounter_type: item.encounter_type,
					answered_at: item.answered_at
				});

				if (insertError) {
					console.error('[OfflineSync] Supabase error inserting historique_reponses:', insertError);
					failCount++;
					continue; // Retain in queue for next retry
				}

				// 2. Upsert into `user_artwork_progress` if `id_oeuvre` is provided
				if (item.id_oeuvre !== undefined && item.id_oeuvre !== null) {
					const { error: upsertError } = await (supabase.from('user_artwork_progress') as any).upsert(
						{
							user_id: item.user_id,
							id_oeuvre: item.id_oeuvre,
							box_level: item.box_level ?? (item.is_correct ? 2 : 1),
							consecutive_correct: item.consecutive_correct ?? (item.is_correct ? 1 : 0),
							next_review_at: item.next_review_at ?? new Date(Date.now() + 86400000).toISOString(),
							last_score: item.score ?? null,
							updated_at: new Date().toISOString()
						},
						{ onConflict: 'user_id, id_oeuvre' }
					);

					if (upsertError) {
						console.error('[OfflineSync] Supabase error upserting user_artwork_progress:', upsertError);
						// Note: if upsert fails, we don't remove from queue so both can be retried safely or logged
						failCount++;
						continue;
					}
				}

				// 3. Purge synchronized item from IndexedDB
				await removeFromOfflineQueue(item.queue_id);
				successCount++;
			} catch (err) {
				console.error('[OfflineSync] Exception during sync processing item:', err);
				failCount++;
			}
		}
	} finally {
		isSyncing = false;
	}

	return { successCount, failCount };
}

/**
 * Initializes global network listeners (`online` / `offline`) to automatically trigger
 * `flushOfflineQueue()` whenever network connectivity returns.
 */
export function initSyncListeners(): void {
	if (typeof window === 'undefined') return;

	window.addEventListener('online', () => {
		console.info('[OfflineSync] Network connectivity restored. Flushing offline queue...');
		flushOfflineQueue();
	});

	// Attempt initial flush on startup if online
	if (navigator.onLine) {
		flushOfflineQueue();
	}
}
