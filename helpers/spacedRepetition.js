// Weights affect both ease_factor delta and repetitions increment.
// Game modes also cap the effective grade so a lucky correct answer
// in a 4-choice quiz can't push the card to "Easy" tier.
const WEIGHTS     = { flashcard: 0.9, quiz: 0.5, match: 0.5, puzzle: 0.6, write: 1.0 };
const MAX_GRADE   = { flashcard: 5,   quiz: 4,   match: 4,   puzzle: 4,   write: 5   };
// No cap on ease_factor — capping it at 2.5 would prevent mastery_level from
// ever reaching 5 (which requires ease >= 2.6). The astronomical-interval bug
// was caused by unbounded interval_days, not by ease_factor itself.
const MAX_INTERVAL = 730;          // cap at 2 years — prevents dates beyond year 9999 (SQLite lexicographic bug)
const MAX_INTERVAL_PREMASTER = 21; // cards below mastery=5 are never scheduled more than 3 weeks out

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

  if (grade === 0) {
    if (mode === 'flashcard') {
      // "Again" in dedicated review: hard SM-2 lapse — full reset.
      // next_review_at = now so the card surfaces immediately in Due for same-day recovery.
      return {
        repetitions: 0,
        interval_days: 1,
        ease_factor: entry.ease_factor ?? 2.5,
        next_review_at: now,
        last_reviewed_at: now,
      };
    }

    // Wrong answer in a game mode (quiz/write/match/puzzle): soft lapse.
    // Penalise ease and shorten the interval without wiping mastery progress.
    const todayStr = now.slice(0, 10);
    const lastStr  = (entry.last_reviewed_at ?? '').slice(0, 10);
    if (todayStr === lastStr) return null;  // one lapse recorded per day

    const reps         = entry.repetitions ?? 0;
    const prevInterval = entry.interval_days ?? 1;
    const newEase      = Math.max(1.3, (entry.ease_factor ?? 2.5) - 0.2);
    const recoveryInterval = Math.max(1, Math.round(prevInterval * 0.2));

    return {
      repetitions:      Math.max(0, reps - weight),
      interval_days:    recoveryInterval,
      ease_factor:      newEase,
      next_review_at:   addDays(recoveryInterval),
      last_reviewed_at: now,
    };
  }

  // One counted session per card per day. Subsequent sessions are silently skipped
  // so replaying games all evening can't inflate repetitions.
  // Exception: if the card was hard-reset today (flashcard Again), allow one
  // positive re-review so the user can recover it in Due the same day.
  const todayStr = now.slice(0, 10);
  const lastStr  = (entry.last_reviewed_at ?? '').slice(0, 10);
  if (todayStr === lastStr) {
    const wasHardResetToday = (entry.repetitions ?? 0) === 0 && entry.next_review_at != null;
    if (!wasHardResetToday) return null;
  }

  // Game modes are low-stakes — cap the grade so a trivial correct answer
  // doesn't count as "Easy" and inflate the card's ease_factor.
  const effectiveGrade = Math.min(grade, MAX_GRADE[mode] ?? 5);
  const easeDelta = (0.1 - (5 - effectiveGrade) * 0.08) * weight;
  const newEase = Math.max(1.3, (entry.ease_factor ?? 2.5) + easeDelta);

  // Early-phase multiplier: Easy cards return less often, Hard cards come back sooner.
  // SM-2 (reps >= 4.5) is already grade-sensitive via ease_factor.
  const earlyMult = effectiveGrade >= 5 ? 1.5 : effectiveGrade <= 3 ? 0.5 : 1.0;

  // repetitions is stored as REAL (SQLite stores fractional values in INTEGER
  // affinity columns without data loss).  Weighted increment means game sessions
  // advance mastery proportionally slower than real flashcard reviews.
  const reps = entry.repetitions ?? 0;
  let newInterval;
  if      (reps < 0.5) newInterval = Math.max(1, Math.round(1  * earlyMult));
  else if (reps < 1.5) newInterval = Math.max(1, Math.round(2  * earlyMult));
  else if (reps < 2.5) newInterval = Math.max(1, Math.round(4  * earlyMult));
  else if (reps < 3.5) newInterval = Math.max(1, Math.round(7  * earlyMult));
  else if (reps < 4.5) newInterval = Math.max(1, Math.round(14 * earlyMult));
  else                 newInterval = Math.round((entry.interval_days ?? 1) * newEase);

  const newReps = reps + weight;
  const postMastery = easeToMastery(newEase, newReps);
  const intervalCap = (postMastery !== null && postMastery >= 5) ? MAX_INTERVAL : MAX_INTERVAL_PREMASTER;
  const cappedInterval = Math.min(intervalCap, newInterval);

  return {
    repetitions: newReps,
    interval_days: cappedInterval,
    ease_factor: newEase,
    next_review_at: addDays(cappedInterval),
    last_reviewed_at: now,
  };
}

function repCap(repetitions) {
  if (repetitions >= 6) return 5;
  if (repetitions >= 4) return 4;
  if (repetitions >= 2) return 3;
  if (repetitions >= 1) return 2;
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
