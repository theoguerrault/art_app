import type { Artwork, UserProgress } from '$lib/types/database';

const DB_NAME = 'ai_art_coach_db';
const DB_VERSION = 1;

export type CacheStoreName = 'cached_artworks' | 'cached_mcqs' | 'user_progress_cache' | 'offline_sync_queue';

export interface OfflineSyncQueueItem {
	queue_id?: number;
	user_id: string;
	id_oeuvre?: number | null;
	id_courant?: number | null;
	is_correct: boolean;
	reponse_choisie: number;
	score: number | null;
	encounter_type: 'DAILY' | 'CATALOG' | 'REVIEW';
	answered_at: string;
	next_review_at?: string;
	box_level?: number;
	consecutive_correct?: number;
}

/**
 * Initializes and returns the IndexedDB database connection.
 * Handles database creation and upgrade events cleanly without errors.
 */
export function getDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined' || !('indexedDB' in window)) {
			return reject(new Error('IndexedDB is not available in this environment.'));
		}

		const request = window.indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			reject(request.error || new Error('Failed to open IndexedDB.'));
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Store 1: cached_artworks (keyed by artwork id)
			if (!db.objectStoreNames.contains('cached_artworks')) {
				db.createObjectStore('cached_artworks', { keyPath: 'id' });
			}

			// Store 2: cached_mcqs (keyed by artwork id)
			if (!db.objectStoreNames.contains('cached_mcqs')) {
				db.createObjectStore('cached_mcqs', { keyPath: 'id_oeuvre' });
			}

			// Store 3: user_progress_cache (keyed by id_oeuvre)
			if (!db.objectStoreNames.contains('user_progress_cache')) {
				db.createObjectStore('user_progress_cache', { keyPath: 'id_oeuvre' });
			}

			// Store 4: offline_sync_queue (autoIncrement queue_id)
			if (!db.objectStoreNames.contains('offline_sync_queue')) {
				const queueStore = db.createObjectStore('offline_sync_queue', {
					keyPath: 'queue_id',
					autoIncrement: true
				});
				queueStore.createIndex('answered_at', 'answered_at', { unique: false });
			}
		};
	});
}

/**
 * Saves one or more items to the specified IndexedDB cache store.
 */
export async function saveToLocalCache(
	storeName: CacheStoreName,
	items: any | any[]
): Promise<void> {
	if (typeof window === 'undefined') return;
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);

		const dataArray = Array.isArray(items) ? items : [items];
		for (const item of dataArray) {
			if (item) {
				store.put(item);
			}
		}

		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error || new Error(`Failed to save to ${storeName}`));
	});
}

/**
 * Reads all records or a specific record from the local IndexedDB cache store.
 */
export async function readFromLocalCache(
	storeName: CacheStoreName,
	key?: IDBValidKey
): Promise<any> {
	if (typeof window === 'undefined') return Array.isArray(key) || key === undefined ? [] : null;
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, 'readonly');
		const store = tx.objectStore(storeName);

		if (key !== undefined) {
			const request = store.get(key);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		} else {
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		}
	});
}

/**
 * Queues an offline answer into the offline_sync_queue object store.
 */
export async function queueOfflineAnswer(
	answerPayload: Omit<OfflineSyncQueueItem, 'queue_id'>
): Promise<number> {
	if (typeof window === 'undefined') return -1;
	const db = await getDB();
	const payloadWithTimestamp: OfflineSyncQueueItem = {
		...answerPayload,
		answered_at: answerPayload.answered_at || new Date().toISOString()
	};

	return new Promise((resolve, reject) => {
		const tx = db.transaction('offline_sync_queue', 'readwrite');
		const store = tx.objectStore('offline_sync_queue');
		const request = store.add(payloadWithTimestamp);

		request.onsuccess = () => {
			const generatedId = typeof request.result === 'number' ? request.result : Number(request.result);
			resolve(generatedId);
		};
		request.onerror = () => reject(request.error || new Error('Failed to queue offline answer.'));
	});
}

/**
 * Retrieves all items currently waiting in the offline_sync_queue, ordered by answered_at ASC.
 */
export async function getOfflineQueueItems(): Promise<OfflineSyncQueueItem[]> {
	if (typeof window === 'undefined') return [];
	const items: OfflineSyncQueueItem[] = await readFromLocalCache('offline_sync_queue');
	return items.sort((a, b) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime());
}

/**
 * Removes an item from the offline_sync_queue after successful Supabase synchronization.
 */
export async function removeFromOfflineQueue(queueId: number): Promise<void> {
	if (typeof window === 'undefined') return;
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('offline_sync_queue', 'readwrite');
		const store = tx.objectStore('offline_sync_queue');
		const request = store.delete(queueId);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error || new Error(`Failed to remove queue_id ${queueId}`));
	});
}
