// 学習結果を progress ストアに反映する共通処理（requirements.md F-06）

import { getProgress, putProgress, type ProgressRecord } from './db';
import {
  clampSrsLevel,
  nextReviewAtForSrsLevel,
  statusForSrsLevel,
} from './srs';

/**
 * 発音チェックの結果を反映（F-06）。
 * 70点以上で srsLevel +1 / 69点以下で -1（最低0）。bestScore・attempts は毎回更新。
 */
export async function recordPronunciationResult(
  phraseId: string,
  score: number,
): Promise<ProgressRecord> {
  const prev = await getProgress(phraseId);
  const pass = score >= 70;
  const srsLevel = clampSrsLevel((prev?.srsLevel ?? 0) + (pass ? 1 : -1));
  const now = Date.now();
  const record: ProgressRecord = {
    itemId: phraseId,
    itemType: 'phrase',
    status: statusForSrsLevel(srsLevel),
    srsLevel,
    nextReviewAt: nextReviewAtForSrsLevel(srsLevel, now),
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    attempts: (prev?.attempts ?? 0) + 1,
    updatedAt: now,
  };
  await putProgress(record);
  return record;
}

/**
 * パズルセッションの結果を反映（F-06）。
 * 正答率80%以上で srsLevel +1 / 未満は変化なし。
 */
export async function recordPatternResult(
  patternId: string,
  correct: number,
  total: number,
): Promise<ProgressRecord> {
  const prev = await getProgress(patternId);
  const passed = total > 0 && correct / total >= 0.8;
  const srsLevel = clampSrsLevel((prev?.srsLevel ?? 0) + (passed ? 1 : 0));
  const now = Date.now();
  const record: ProgressRecord = {
    itemId: patternId,
    itemType: 'pattern',
    status: statusForSrsLevel(srsLevel),
    srsLevel,
    nextReviewAt: nextReviewAtForSrsLevel(srsLevel, now),
    bestScore: 0,
    attempts: (prev?.attempts ?? 0) + 1,
    updatedAt: now,
  };
  await putProgress(record);
  return record;
}
