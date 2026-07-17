# Spaced Repetition Model & Learning Mechanics - AI Art Coach

## 1. Leitner Spaced Repetition Mechanics
To maximize long-term memory retention of art history concepts across micro-learning sessions, **AI Art Coach** implements a **5-Box Leitner Spaced Repetition System**.

Every artwork concept encountered by the user is tracked individually within the user progression database (and mirrored in local client storage during offline sessions as defined in [`03_core_engine/offline_synchronization.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine/offline_synchronization.md)).

### 1.1 Exact Review Intervals
When a concept is assigned to a Leitner box level (`box_level` 1 to 5), the system schedules the next required review timestamp (`next_review_at`) by adding a fixed interval to the current time:
- **Box 1 (Initial / Needs Reinforcement):** `+1 day`
- **Box 2 (Familiar):** `+3 days`
- **Box 3 (Consolidated):** `+7 days`
- **Box 4 (Retained):** `+14 days`
- **Box 5 (Mastered):** `+30 days`

### 1.2 Promotion & Demotion Rules
Upon submitting a multiple-choice question answer inside the Quick MCQ:
- **If Correct (`is_correct = true`):**
  - The concept is promoted to the next Leitner box: `box_level = LEAST(box_level + 1, 5)`.
  - The consecutive success counter increments: `consecutive_correct = consecutive_correct + 1`.
  - `next_review_at` is updated according to the new box level interval.
- **If Incorrect (`is_correct = false`):**
  - The concept is demoted immediately back to Box 1: `box_level = 1`.
  - The consecutive success counter is reset: `consecutive_correct = 0`.
  - `next_review_at` is scheduled for `NOW() + INTERVAL '1 day'`, requiring prompt reinforcement.

---

## 2. Daily Artwork Selection Algorithm ("Snack Learning" Logic)
When the user opens the "Today" tab (`/`), the mobile application executes an intelligent selection algorithm to choose the single most relevant artwork for the 5-minute daily routine:

```text
+-----------------------------------------------------------------------------------+
|                        OPEN TODAY TAB (`/`) ROUTE INIT                            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  Audit Progression State (`user_artwork_progress`)      |
            |  (Check online database or offline local storage cache) |
            +---------------------------------------------------------+
                                         │
                                         ▼
            +---------------------------------------------------------+
            |  PRIORITY 1: Leitner Spaced Repetition Review           |
            |  Are there items with `next_review_at <= NOW()`         |
            |  AND `last_presented_daily_at < NOW() - 7 days`?        |
            +---------------------------------------------------------+
                                 │                 │
                         YES     │                 │ NO
                                 ▼                 ▼
            +-------------------------+   +-----------------------------------------+
            | Select oldest review-   |   | PRIORITY 2: New Discovery               |
            | due concept from Box 1-4|   | Select undiscovered artwork where       |
            +-------------------------+   | `last_presented_daily_at IS NULL`       |
                                          +-----------------------------------------+
                                                               │
                                                       NONE    │ AVAILABLE
                                                               ▼
                                          +-----------------------------------------+
                                          | PRIORITY 3: Fallback Cooldown Loop      |
                                          | Select item with lowest `box_level` and |
                                          | oldest `last_presented_daily_at`        |
                                          +-----------------------------------------+
```

### 2.1 Multi-Day Daily Cooldown (`last_presented_daily_at`)
To prevent the daily featured card from repeatedly displaying the exact same artwork across consecutive days (even if the user fails an MCQ or has a small catalog), the system enforces a **7-day daily presentation cooldown**:
- When an artwork is selected for the daily routine (`/`), `last_presented_daily_at` is updated to `NOW()` and `times_presented_daily` increments by 1.
- During Priority 1 (Review selection), an item whose `next_review_at` has elapsed is **skipped for the daily card** if `last_presented_daily_at >= NOW() - INTERVAL '7 days'`. (Note: The user can still review these concepts freely inside the "Catalog" tab `/catalogue`).
