# Dynamic AI MCQ Engine - AI Art Coach

## 1. On-Demand Generation Engine
**AI Art Coach** integrates an AI MCQ generation engine to generate multiple-choice questions from factual metadata. 

The engine (`src/lib/server/ingestion/quiz-generator.ts`) uses the `@google/genai` SDK and **Zod Schema constraints (Structured Outputs)** to process verified metadata (ingested from Wikidata and museum APIs via [`data_ingestion.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine/data_ingestion.md)) into structured multiple-choice questions (`QcmSchema`).

---

## 2. Pipeline Flow & Generation Architecture

```text
                  [ Verified Artwork Metadata (`ArtworkData`) ]
                                        │
                                        ▼
  +-------------------------------------------------------------------------+
  |                   SELECT UNEXHAUSTED THEMATIC ANGLE                     |
  |      (Subject, Artist/Creation, Style, Patronage, Conservation)         |
  +-------------------------------------------------------------------------+
                                        │
                                        ▼
  +-------------------------------------------------------------------------+
  |                   APPLY ANTI-DUPLICATION EXCLUSIONS                     |
  |     (Filter out previously tested quotes, fields, and question text)    |
  +-------------------------------------------------------------------------+
                                        │
                                        ▼
  +-------------------------------------------------------------------------+
  |                 GEMINI STRUCTURAL GENERATION REQUEST                    |
  |       (Fallback chain: flash-lite -> flash -> pro models)               |
  +-------------------------------------------------------------------------+
                                        │
                                        ▼
  +-------------------------------------------------------------------------+
  |               ZOD VALIDATION & PROGRAMMATIC SHUFFLING                   |
  |  (Parse raw JSON, verify literal quote proof, shuffle options array)    |
  +-------------------------------------------------------------------------+
                                        │
                                        ▼
              [ Validated MCQ ready for Database Ingestion (`contenus_oeuvres`) ]
```

---

## 3. Gemini Fallback Model Chain
The generation engine executes API requests through an ordered fallback model chain to handle rate limits (HTTP 429) and model availability:
1. `gemini-flash-lite-latest` (Primary model)
2. `gemini-2.5-flash-lite`
3. `gemini-2.0-flash-lite`
4. `gemini-flash-latest`
5. `gemini-3.5-flash`
6. `gemini-2.0-flash`
7. `gemini-pro-latest` (Fallback model for complex queries)

If an API call returns a rate limit or network error, the system catches the exception and routes the request to the next model in the chain.

---

## 4. Zod Schemas & Positional Bias Prevention
Large Language Models (LLMs) can exhibit positional bias when generating multiple-choice options in a fixed array (frequently defaulting the correct answer to index 0 or 2). 

To prevent positional bias, the generator executes a two-stage schema validation workflow:
1. **Raw Generation Schema (`RawGeminiQcmSchema`):** Requests the correct answer (`correctAnswer`) and exactly 3 incorrect distractors (`distractors`) as separate string fields.
2. **Programmatic Shuffling & Final Schema (`QcmSchema`):** TypeScript logic merges `correctAnswer` and `distractors` into a single array, shuffles the array elements uniformly, computes the resulting `correctIndex` (0 to 3), and validates the output against `QcmSchema`.

### 4.1 Exact TypeScript Zod Definitions
```typescript
import { z } from 'zod';

// Stage 1: Schema requested from Gemini via Structured Outputs
const RawGeminiQcmSchema = z.object({
  sourceField: z.string().describe("Exact JSON key from the provided metadata used as the factual proof"),
  sourceQuote: z.string().min(2).max(400).describe("Literal quote from sourceField that justifies and proves the correct answer"),
  question: z.string().min(15).max(250).describe("Question text regarding the artwork, its artist, or movement"),
  correctAnswer: z.string().min(2).max(120).describe("The correct answer option (< 80-120 characters)"),
  distractors: z.array(z.string().min(2).max(120)).length(3).describe("Exactly 3 factually incorrect options of similar length and syntax to correctAnswer"),
  explanation: z.string().min(15).max(450).describe("Pedagogical explanation (~60-70 words) detailing the correct answer and historical context")
});

// Stage 2: Final structured MCQ Schema ingested into Supabase (contenus_oeuvres.qcm)
export const QcmSchema = z.object({
  sourceQuote: z.string().min(5).max(400).describe("Literal quote from the raw metadata proving the correct answer"),
  sourceField: z.string().optional().describe("Exact JSON key used for the quote"),
  conceptTag: z.string().describe("Normalized concept identifier for Leitner tracking"),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("Question difficulty level"),
  question: z.string().min(15).max(250).describe("Question text"),
  options: z.array(z.string().min(2).max(120)).length(4).describe("Exactly 4 options, programmatically shuffled"),
  correctIndex: z.number().int().min(0).max(3).describe("0-3 index of the correct answer"),
  explanation: z.string().min(15).max(450).describe("Pedagogical explanation")
});
```

---

## 5. Thematic Generation Angles
To vary question topics across multiple user encounters with an artwork, the engine selects from 5 thematic angles:
- `subject`: Targets visual elements, iconography, symbols, depicted subjects, and narrative context.
- `artist_or_creation`: Targets biographical details, creation year, geographical origin, and discovery location.
- `style_or_technique`: Targets the artistic movement (`courants`), brushwork, medium, and stylistic techniques (e.g., *chiaroscuro*, *sfumato*).
- `patronage_or_history`: Targets historical commissions, ownership history, exhibitions, and provenance.
- `conservation_or_museum`: Targets the hosting institution, curatorial department, physical dimensions, and restoration records.

---

## 6. Anti-Duplication Exclusions (`antiDuplicationContext`)
When generating multiple questions for a single artwork or movement, the generator injects prior context exclusions into the prompt:
- **Excluding Previous Questions (`getPreviousQuestions`):** Prevents generating questions that repeat prior text strings or facts.
- **Excluding Source Quotes (`getPreviousSourceQuotes`):** Prevents the model from referencing metadata sentences already used as proof in existing questions.
- **Excluding Source Fields (`getPreviousSourceFields`):** Filters out previously tested metadata keys to force selection from alternative fields.


