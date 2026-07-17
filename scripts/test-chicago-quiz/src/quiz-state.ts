import fs from 'fs';
import path from 'path';

const STATE_FILE = path.resolve(process.cwd(), 'quiz-state.json');

export interface QuizHistoryEntry {
  artworkId: string;
  conceptTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  sourceQuote?: string;
  sourceField?: string;
  answeredCorrectly: boolean;
  answeredAt: string;
}

export interface LeitnerItem {
  artworkId: string;
  conceptTag: string;
  box: number; // 1 to 5 (1 = daily, 5 = mastered)
  consecutiveFailures: number;
  nextReviewDueAt: string;
  lastQuestionText?: string;
}

export interface QuizState {
  history: QuizHistoryEntry[];
  leitnerBoxes: Record<string, LeitnerItem>;
}

/**
 * Loads the local quiz state from `quiz-state.json`. If it does not exist, returns an empty state.
 */
export function loadQuizState(): QuizState {
  if (!fs.existsSync(STATE_FILE)) {
    return { history: [], leitnerBoxes: {} };
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[QuizState] Could not parse quiz-state.json, initializing empty state.');
    return { history: [], leitnerBoxes: {} };
  }
}

/**
 * Persists the quiz state directly to `quiz-state.json`.
 */
export function saveQuizState(state: QuizState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Resets the local quiz state cleanly.
 */
export function resetQuizState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}

/**
 * Retrieves all previously generated question strings for a specific artwork ID.
 */
export function getPreviousQuestions(state: QuizState, artworkId: string): string[] {
  return state.history
    .filter(item => item.artworkId === artworkId)
    .map(item => item.questionText);
}

/**
 * Retrieves all previously used exact source quotes for an artwork to prevent semantic re-generation.
 */
export function getPreviousSourceQuotes(state: QuizState, artworkId: string): string[] {
  return state.history
    .filter(item => item.artworkId === artworkId && item.sourceQuote)
    .map(item => item.sourceQuote!);
}

/**
 * Retrieves all previously used exact source fields for an artwork.
 */
export function getPreviousSourceFields(state: QuizState, artworkId: string): string[] {
  return state.history
    .filter(item => item.artworkId === artworkId && item.sourceField)
    .map(item => item.sourceField!);
}

/**
 * Checks how many questions have been asked for a specific angle/conceptTag on this artwork.
 */
export function getQuestionCountForAngle(state: QuizState, artworkId: string, conceptTag: string): number {
  return state.history.filter(item => item.artworkId === artworkId && item.conceptTag === conceptTag).length;
}

/**
 * Records a user answer, updating both the chronological history and the Leitner spaced-repetition box.
 */
export function recordAnswer(
  artworkId: string,
  conceptTag: string,
  difficulty: 'easy' | 'medium' | 'hard',
  questionText: string,
  answeredCorrectly: boolean,
  sourceQuote?: string,
  sourceField?: string
): LeitnerItem {
  const state = loadQuizState();
  const key = `${artworkId}:${conceptTag}`;
  const now = new Date();

  // Append to history
  state.history.push({
    artworkId,
    conceptTag,
    difficulty,
    questionText,
    sourceQuote,
    sourceField,
    answeredCorrectly,
    answeredAt: now.toISOString()
  });

  // Get or create Leitner state for this concept
  const item: LeitnerItem = state.leitnerBoxes[key] || {
    artworkId,
    conceptTag,
    box: 1,
    consecutiveFailures: 0,
    nextReviewDueAt: now.toISOString()
  };

  if (answeredCorrectly) {
    item.box = Math.min(item.box + 1, 5);
    item.consecutiveFailures = 0;
  } else {
    // Demote to Box 1 on error and track consecutive failures for adaptive difficulty downgrade
    item.box = 1;
    item.consecutiveFailures += 1;
  }

  item.lastQuestionText = questionText;

  // Calculate next due date according to Leitner intervals:
  // Box 1: 1 day, Box 2: 3 days, Box 3: 7 days, Box 4: 14 days, Box 5: 30 days (mastered)
  const intervalDays = [0, 1, 3, 7, 14, 30][item.box] || 1;
  const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  item.nextReviewDueAt = nextReviewDate.toISOString();

  state.leitnerBoxes[key] = item;
  saveQuizState(state);

  return item;
}

/**
 * Finds all Leitner items for a given artwork that are due for review.
 */
export function getDueLeitnerItems(state: QuizState, artworkId: string): LeitnerItem[] {
  const now = new Date();
  return Object.values(state.leitnerBoxes).filter(
    item => item.artworkId === artworkId && new Date(item.nextReviewDueAt) <= now
  );
}
