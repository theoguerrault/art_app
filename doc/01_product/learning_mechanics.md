# Content Selection & Recommendation Mechanics - AI Art Coach

## 1. Daily Content Selection Model
To maintain engagement and ensure high pedagogical quality across daily micro-learning sessions, **AI Art Coach** implements a daily selection algorithm for the "Today" tab (`/`).

Every artwork presented on the main screen must satisfy strict verification and freshness criteria before being presented as the daily featured piece.

---

## 2. Selection Criteria & Verification Gate
The selection engine executes the following logic when determining the featured artwork for a user session:

```text
+-----------------------------------------------------------------------------------+
|                        OPEN TODAY TAB (`/`) ROUTE INIT                            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  Audit Verification Status (`verification_status`)     |
            |  Only evaluate items where status === 'VERIFIED'        |
            +---------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  PRIORITY 1: Unvisited Verified Artworks                |
            |  Select undiscovered verified artwork where             |
            |  `last_presented_daily_at IS NULL`                      |
            +---------------------------------------------------------+
                                 │                 │
                         YES     │                 │ NONE
                                 ▼                 ▼
            +-------------------------+   +-----------------------------------------+
            | Present selected        |   | PRIORITY 2: Multi-Day Cooldown Loop     |
            | unvisited artwork       |   | Select item where                       |
            +-------------------------+   | `last_presented_daily_at` is oldest     |
                                          | and > 7 days prior                      |
                                          +-----------------------------------------+
```

### 2.1 Verification Gate (`verification_status = 'VERIFIED'`)
To ensure zero factual errors or incomplete texts appear on the main discovery view:
- Only artworks that have undergone automated Wikipedia fact-checking and administrative verification (`verification_status = 'VERIFIED'`) are eligible for daily recommendation.
- Artworks marked `PENDING`, `UNVERIFIED`, or `FALSE` are strictly hidden from the daily discovery page and catalog default views until approved.

---

## 3. Multi-Day Presentation Cooldown (`last_presented_daily_at`)
To prevent displaying the exact same featured artwork on consecutive days:
- When an artwork is presented as the featured card on `/`, the application logs `last_presented_daily_at = NOW()` and increments `times_presented_daily`.
- Artworks presented within the last 7 days are excluded from the daily recommendation pipeline unless all verified artworks in the catalog have been viewed within that window.

---

## 4. User Favorites & Personal Curation
Users can bookmark artworks to build a personal collection:
- Toggling the favorite button updates local IndexedDB storage (`user_favorites_cache`) for instant offline response.
- When connected to the network, favorite state synchronizes asynchronously with the backend database.
