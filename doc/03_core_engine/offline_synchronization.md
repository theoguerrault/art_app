# Local State & Offline Caching Architecture - AI Art Coach

## 1. Local Caching Strategy
To achieve zero-latency interactions (< 16ms INP) and full offline availability across mobile PWA sessions:

1. **Client-Side Storage (`IndexedDB`):** The application caches active catalog artworks, movement overviews, and user favorites locally in IndexedDB using `$lib/offline/storage.ts`.
2. **Service Worker Asset Precaching (`@vite-pwa/sveltekit`):** The Workbox Service Worker caches static JS/CSS assets, WebP artwork thumbnails, and layout shells.

---

## 2. Offline Failover & Synchronization

```text
+-----------------------------------------------------------------------------------+
|                  OFFLINE USER INTERACTION (`navigator.onLine === false`)          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  1. Serve artwork content and catalog from IndexedDB    |
            |  2. Log local favorite toggles in IndexedDB cache       |
            +---------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  Service Worker monitors connectivity restoration       |
            |  (`window.addEventListener('online', syncOfflineData)`) |
            +---------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  Synchronize user favorites and local progress state    |
            |  with Supabase backend upon network restoration         |
            +---------------------------------------------------------+
```

### 2.1 Caching Guarantees
- **Offline Catalog Browsing:** Users can browse previously loaded movements, read artwork analyses, and toggle favorites without an active internet connection.
- **Background Synchronization:** When network connectivity is restored, pending user favorite updates synchronize automatically with Supabase PostgreSQL.
