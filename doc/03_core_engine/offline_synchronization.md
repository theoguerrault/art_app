# Local State & Offline Synchronization (`offline_sync_queue`) - AI Art Coach

## 1. Local State Tracking vs Authoritative Database
To achieve zero-latency interactions (< 16ms INP) without waiting for round-trip network confirmation during daily learning sessions:
1. **Instant Client-Side State Mutation:** The Svelte 5 component evaluates the answer locally using `$state()` Runes and instantly plays visual celebrations and Leitner badge updates governed by [`learning_mechanics.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/learning_mechanics.md).
2. **Asynchronous Authoritative Persistence (`Supabase SQL`):** If online (`navigator.onLine === true`), the client fires non-blocking asynchronous requests updating `supabase.from('user_artwork_progress').upsert()` and appending the record to `supabase.from('historique_reponses').insert()`.

---

## 2. Offline Synchronization & Failover Queue (`offline_sync_queue`)
When the user accesses the PWA during network disconnections (subway, airplane, or low-signal areas), data execution transitions transparently to the offline failover engine (`src/lib/offline/sync.ts` & `storage.ts`):

```text
+-----------------------------------------------------------------------------------+
|               OFFLINE MCQ ATTEMPT (`navigator.onLine === false`)                  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  Save answer logs & updated Leitner state to local      |
            |  IndexedDB Object Store (`offline_sync_queue`)          |
            +---------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  Service Worker monitors connectivity restoration       |
            |  (`window.addEventListener('online', flushOfflineQueue)`|
            +---------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  Execute `flushOfflineQueue()`:                         |
            |  1. Iterate pending items in `offline_sync_queue`       |
            |  2. Batch-execute `Supabase.upsert()` & `.insert()`     |
            |  3. Purge synchronized records from IndexedDB upon 200  |
            +---------------------------------------------------------+
```

### 2.1 Failover Guarantees
- **No Data Loss:** Every offline quiz attempt (`score`, `reponse_choisie`, `is_correct`, timestamp) is preserved indefinitely in `IndexedDB` until a verified HTTP 2xx confirmation is returned by Supabase.
- **Conflict Resolution:** If multiple offline attempts exist for the exact same `id_oeuvre`, the synchronization queue processes records chronologically (`answered_at ASC`), ensuring `box_level` and `consecutive_correct` reflect the true sequential learning trajectory.
