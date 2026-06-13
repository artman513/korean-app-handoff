// 発音スコア算出（requirements.md F-03）
// score = (1 - levenshtein(認識, 正解) / max(len)) × 100。音節（=ハングル1文字）単位で比較。

const HANGUL_SYLLABLE = /[가-힣]/;

/** 空白・句読点・記号を除去（音節比較の前処理） */
export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

/** ハングル音節の占める割合（0〜1）。韓国語以外の混入判定に使う */
export function hangulRatio(normalized: string): number {
  if (normalized.length === 0) return 0;
  let count = 0;
  for (const ch of normalized) if (HANGUL_SYLLABLE.test(ch)) count++;
  return count / normalized.length;
}

interface LevResult {
  distance: number;
  /** 正解側の各文字が認識側と一致したか（true=一致）。ハイライト表示に使う */
  targetMatched: boolean[];
}

/** 編集距離（DP）＋バックトレースで正解側の一致フラグを得る */
function levenshtein(recognized: string, target: string): LevResult {
  const a = [...recognized];
  const b = [...target];
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  // バックトレース：正解(b)側の各文字が「置換/削除されず一致」したかを記録
  const targetMatched = new Array<boolean>(n).fill(false);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    if (dp[i][j] === dp[i - 1][j - 1] + cost) {
      if (cost === 0) targetMatched[j - 1] = true;
      i--;
      j--;
    } else if (dp[i][j] === dp[i - 1][j] + 1) {
      i--; // 認識側の余分（挿入）
    } else {
      j--; // 正解側の欠落（削除）
    }
  }

  return { distance: dp[m][n], targetMatched };
}

export interface ScoreResult {
  score: number; // 0〜100
  recognizedNorm: string;
  targetNorm: string;
  /** 正解の各音節が一致したか（false=ズレた音節→ハイライト） */
  targetMatched: boolean[];
}

export function computeScore(recognized: string, target: string): ScoreResult {
  const recognizedNorm = normalize(recognized);
  const targetNorm = normalize(target);
  const { distance, targetMatched } = levenshtein(recognizedNorm, targetNorm);
  const maxLen = Math.max(recognizedNorm.length, targetNorm.length);
  const score =
    maxLen === 0 ? 0 : Math.round((1 - distance / maxLen) * 100);
  return {
    score: Math.max(0, Math.min(100, score)),
    recognizedNorm,
    targetNorm,
    targetMatched,
  };
}

export type Judgement = 'perfect' | 'pass' | 'fail';

export function judge(score: number): Judgement {
  if (score >= 90) return 'perfect';
  if (score >= 70) return 'pass';
  return 'fail';
}

/**
 * 認識結果が発音判定に使えるか検証する（F-03 エラー要件）。
 * - 空 / 極端に短い（無音・雑音）
 * - 韓国語以外（日本語・英語）が大半
 */
export function isUsableRecognition(recognized: string): boolean {
  const norm = normalize(recognized);
  if (norm.length === 0) return false;
  return hangulRatio(norm) >= 0.5;
}
