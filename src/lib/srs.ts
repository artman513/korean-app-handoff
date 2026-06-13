// SRS（間隔反復）の共通ロジック（requirements.md F-06）

import type { ProgressStatus } from './db';

/** SRSレベル（0〜5）→ 次回復習までの日数 */
export const SRS_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const SRS_MAX_LEVEL = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export function clampSrsLevel(level: number): number {
  return Math.min(SRS_MAX_LEVEL, Math.max(0, Math.round(level)));
}

/** new（0）→ learning（1〜4）→ mastered（5） */
export function statusForSrsLevel(level: number): ProgressStatus {
  const clamped = clampSrsLevel(level);
  if (clamped === 0) return 'new';
  if (clamped >= SRS_MAX_LEVEL) return 'mastered';
  return 'learning';
}

export function nextReviewAtForSrsLevel(
  level: number,
  from: number = Date.now(),
): number {
  return from + SRS_INTERVAL_DAYS[clampSrsLevel(level)] * DAY_MS;
}
