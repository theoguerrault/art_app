# AI Editorial Generation & Wikipedia Fact-Checking Engine - AI Art Coach

## 1. Editorial Content Generation Pipeline
**AI Art Coach** integrates an AI generation and fact-checking engine to synthesize verified art history descriptions and anecdotes directly from museum metadata and Wikipedia articles.

The service (`src/lib/server/ingestion/services/description.ts`) uses the `@google/genai` SDK and structured Zod output validation to process raw metadata into editorial content blocks (`anecdote_accroche`, `anecdote_technique`, `anecdote_secrete`, `extended_analysis`, `historical_context`).

---

## 2. Generation Architecture & Fallback Chain

```text
                  [ Verified Artwork Metadata & Wikipedia Source ]
                                        │
                                        ▼
  +-------------------------------------------------------------------------+
  |                     EDITORIAL CONTENT GENERATION                        |
  |         (Synthesize introductory hook, technical analysis, secrets)     |
  +-------------------------------------------------------------------------+
                                        │
                                        ▼
  +-------------------------------------------------------------------------+
  |                   GEMINI FALLBACK MODEL EXECUTION                       |
  |          (Chain: gemini-2.5-pro -> gemini-2.5-flash -> flash-lite)      |
  +-------------------------------------------------------------------------+
                                        │
                                        ▼
  +-------------------------------------------------------------------------+
  |              AUTOMATED WIKIPEDIA FACT-CHECKING ENGINE                   |
  | (Compare portions against source text -> assign VERIFIED/FALSE/UNVERIFIED)|
  +-------------------------------------------------------------------------+
                                        │
                                        ▼
              [ Content saved to Database (`contenus_oeuvres`) ]
```

---

## 3. Gemini Fallback Model Chain
The generation and fact-checking services execute API requests through an ordered model chain to handle rate limits (HTTP 429) and model availability:
1. `gemini-2.5-pro` (Primary model for deep reasoning and fact-checking)
2. `gemini-2.5-flash`
3. `gemini-2.0-flash`
4. `gemini-flash-lite-latest`

---

## 4. Automated Wikipedia Fact-Checking Engine
To eliminate hallucinations and verify factual accuracy before content appears in the user-facing application:

1. **Source Text Retrieval:** The admin endpoint fetches the corresponding Wikipedia source text (truncated at 150,000 characters).
2. **Portion-by-Portion Evaluation (`factCheckArtworkContent`):** Gemini evaluates each generated paragraph against the source text.
3. **Status Classification:** Each portion is tagged with a strict status:
   - `VERIFIED`: Factual claims confirmed by the Wikipedia source text.
   - `FALSE`: Factual claims contradicted by the Wikipedia source text.
   - `UNVERIFIED`: Information not explicitly present in the provided source text.
4. **Global Verification Score:** Calculates an overall reliability score and provides direct quotes from Wikipedia as proof.
5. **Global Status Update:** When all portions of an artwork reach `VERIFIED`, `verification_status` updates to `'VERIFIED'`, publishing the artwork to the user-facing discovery feeds.

---

## 5. Auto-Correction Service (`correctArtworkContentPortion`)
If a portion is flagged as `FALSE` during fact-checking:
- The administrator can invoke single-click auto-correction.
- The AI auto-correction prompt receives the specific false paragraph and the Wikipedia source text, rewriting only that paragraph to eliminate false claims while preserving editorial flow.
