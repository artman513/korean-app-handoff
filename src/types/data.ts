// data/ 配下のJSON（静的バンドル）の型定義。スキーマは requirements.md §4 / §6 に準拠

export type HangulType = 'consonant' | 'vowel' | 'syllable';

export interface HangulChar {
  id: string;
  char: string;
  romaja: string;
  type: HangulType;
  mouthHint: string;
  exampleWord: string;
  exampleMeaning: string;
}

export interface PhraseCategory {
  id: string;
  label: string;
  emoji: string;
}

export interface Phrase {
  id: string;
  category: string;
  ko: string;
  ja: string;
  romaja: string;
  level: number; // 1〜3
}

export interface Pattern {
  id: string;
  label: string;
  meaning: string;
  template: string; // {verb} を含む骨組み
  example: string;
  level: number;
}

export type StemType = 'vowel' | 'consonant' | 'hada' | 'rieul';

export interface Verb {
  id: string;
  dict: string;
  meaning: string;
  stemType: StemType;
  forms: Record<string, string>; // patternId → 完成文（完全一致で正誤判定）
}
