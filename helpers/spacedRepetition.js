// Weights affect both ease_factor delta and repetitions increment.
// Game modes also cap the effective grade so a lucky correct answer
// in a 4-choice quiz can't push the card to "Easy" tier.
const WEIGHTS   = { flashcard: 0.9, quiz: 0.5, match: 0.5, puzzle: 0.6, write: 1.0 };
const MAX_GRADE = { flashcard: 5,   quiz: 4,   match: 4,   puzzle: 4,   write: 5   };

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Applies SM-2 algorithm and returns updated SR fields.
 * @param {object} entry - current entry with ease_factor, interval_days, repetitions
 * @param {0|3|4|5} grade - Again=0, Hard=3, Good=4, Easy=5
 * @param {'flashcard'|'quiz'|'match'|'puzzle'|'write'} mode
 */
export function applyReview(entry, grade, mode) {
  const weight = WEIGHTS[mode] ?? 1.0;
  const now = new Date().toISOString();

  // grade=0 (Again) always resets — even if reviewed earlier today.
  if (grade === 0) {
    return {
      repetitions: 0,
      interval_days: 1,
      ease_factor: entry.ease_factor ?? 2.5,
      next_review_at: addDays(1),
      last_reviewed_at: now,
    };
  }

  // One counted session per card per day. Subsequent sessions are silently skipped
  // so replaying games all evening can't inflate repetitions.
  const todayStr = now.slice(0, 10);
  const lastStr = (entry.last_reviewed_at ?? '').slice(0, 10);
  if (todayStr === lastStr) return null;

  // Game modes are low-stakes — cap the grade so a trivial correct answer
  // doesn't count as "Easy" and inflate the card's ease_factor.
  const effectiveGrade = Math.min(grade, MAX_GRADE[mode] ?? 5);
  const easeDelta = (0.1 - (5 - effectiveGrade) * 0.08) * weight;
  const newEase = Math.max(1.3, (entry.ease_factor ?? 2.5) + easeDelta);

  // repetitions is stored as REAL (SQLite stores fractional values in INTEGER
  // affinity columns without data loss).  Weighted increment means game sessions
  // advance mastery proportionally slower than real flashcard reviews.
  const reps = entry.repetitions ?? 0;
  let newInterval;
  if (reps < 1) newInterval = 1;
  else if (reps < 2) newInterval = 3;
  else newInterval = Math.round((entry.interval_days ?? 1) * newEase);

  return {
    repetitions: reps + weight,
    interval_days: newInterval,
    ease_factor: newEase,
    next_review_at: addDays(newInterval),
    last_reviewed_at: now,
  };
}

function repCap(repetitions) {
  if (repetitions >= 10) return 5;
  if (repetitions >= 6)  return 4;
  if (repetitions >= 3)  return 3;
  if (repetitions >= 1)  return 2;
  return 0;
}

export function easeToMastery(easeFactor, repetitions) {
  if (!repetitions) return null;
  const fromEase = easeFactor < 1.7 ? 1
    : easeFactor < 2.0 ? 2
    : easeFactor < 2.3 ? 3
    : easeFactor < 2.6 ? 4
    : 5;
  return Math.min(fromEase, repCap(repetitions));
}
