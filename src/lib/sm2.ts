// SM-2 Spaced Repetition Algorithm
// Based on https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

export interface SM2Data {
  interval: number;       // days until next review
  ease_factor: number;    // easiness factor (>= 1.3)
  repetitions: number;    // number of consecutive correct reviews
  due_date: string;       // ISO date string
  mastered: boolean;      // considered mastered after 5+ reps with good scores
}

export interface SM2Result {
  interval: number;
  ease_factor: number;
  repetitions: number;
  due_date: string;
  mastered: boolean;
}

/**
 * Calculate next review schedule using SM-2 algorithm
 * @param quality - Score from 0-5 (0-2 = fail, 3-5 = pass)
 * @param current - Current SM-2 data for the item
 * @returns Updated SM-2 data
 */
export function calculateSM2(
  quality: number,
  current: SM2Data
): SM2Result {
  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  let { interval, ease_factor, repetitions } = current;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetitions += 1;
  } else {
    // Incorrect response — reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  ease_factor =
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Minimum ease factor is 1.3
  if (ease_factor < 1.3) {
    ease_factor = 1.3;
  }

  // Calculate next due date
  const now = new Date();
  const due = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // Consider mastered after 5 consecutive successful reviews
  const mastered = repetitions >= 5 && quality >= 4;

  return {
    interval,
    ease_factor: Math.round(ease_factor * 100) / 100,
    repetitions,
    due_date: due.toISOString(),
    mastered,
  };
}

/**
 * Get initial SM-2 values for a new verse
 */
export function getInitialSM2(): SM2Data {
  return {
    interval: 1,
    ease_factor: 2.5,
    repetitions: 0,
    due_date: new Date().toISOString(),
    mastered: false,
  };
}
