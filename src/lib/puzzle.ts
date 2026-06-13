// パズルセッションの組み立て（requirements.md F-04）

import { verbs } from '../data';
import type { Verb } from '../types/data';

export const SESSION_SIZE = 5;
export const OPTION_COUNT = 4;

export interface PuzzleQuestion {
  patternId: string;
  target: Verb; // 正解の動詞
  options: Verb[]; // 提示する動詞カード（正解＋ダミー、シャッフル済み）
  answer: string; // 完成文（target.forms[patternId]）
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 文型1つ × SESSION_SIZE 問のセッションを生成する */
export function buildSession(
  patternId: string,
  count: number = SESSION_SIZE,
): PuzzleQuestion[] {
  const targets = shuffle(verbs).slice(0, count);
  return targets.map((target) => {
    const answer = target.forms[patternId];
    // 正解と同じ完成文になる動詞（例：can/future の 사다・살다）はダミーから除外し、
    // 正解が一意になるようにする
    const distractors = shuffle(
      verbs.filter(
        (v) => v.id !== target.id && v.forms[patternId] !== answer,
      ),
    ).slice(0, OPTION_COUNT - 1);
    return {
      patternId,
      target,
      options: shuffle([target, ...distractors]),
      answer,
    };
  });
}

// 正解・コンボ演出のスタンプ
export const STAMPS = ['천재!', '대박!', '최고!', '완벽!', '굿!'] as const;

export function randomStamp(): string {
  return STAMPS[Math.floor(Math.random() * STAMPS.length)];
}
