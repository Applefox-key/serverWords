const WEIGHTS = { flashcard: 1.0, quiz: 0.6, match: 0.6, puzzle: 0.7 };

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Applies SM-2 algorithm and returns updated SR fields.
 * @param {object} entry - current entry with ease_factor, interval_days, repetitions
 * @param {0|3|4|5} grade - Again=0, Hard=3, Good=4, Easy=5
 * @param {'flashcard'|'quiz'|'match'|'puzzle'} mode
 */
export function applyReview(entry, grade, mode) {
  const weight = WEIGHTS[mode] ?? 1.0;
  const now = new Date().toISOString();

  if (grade === 0) {
    return {
      repetitions: 0,
      interval_days: 1,
      ease_factor: entry.ease_factor ?? 2.5,
      next_review_at: addDays(1),
      last_reviewed_at: now,
    };
  }

  const easeDelta = (0.1 - (5 - grade) * 0.08) * weight;
  const newEase = Math.max(1.3, (entry.ease_factor ?? 2.5) + easeDelta);

  const reps = entry.repetitions ?? 0;
  let newInterval;
  if (reps === 0) newInterval = 1;
  else if (reps === 1) newInterval = 3;
  else newInterval = Math.round((entry.interval_days ?? 1) * newEase);

  return {
    repetitions: reps + 1,
    interval_days: newInterval,
    ease_factor: newEase,
    next_review_at: addDays(newInterval),
    last_reviewed_at: now,
  };
}

export function easeToMastery(easeFactor) {
  if (easeFactor < 1.6) return 1;
  if (easeFactor < 1.9) return 2;
  if (easeFactor < 2.2) return 3;
  if (easeFactor < 2.5) return 4;
  return 5;
}
