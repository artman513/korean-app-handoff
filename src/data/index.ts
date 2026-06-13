import hangulJson from './hangul.json';
import phrasesJson from './phrases.json';
import patternsJson from './patterns.json';
import verbsJson from './verbs.json';
import type {
  HangulChar,
  Pattern,
  Phrase,
  PhraseCategory,
  Verb,
} from '../types/data';

export const hangul = hangulJson.hangul as HangulChar[];
export const phraseCategories = phrasesJson.categories as PhraseCategory[];
export const phrases = phrasesJson.phrases as Phrase[];
export const patterns = patternsJson.patterns as Pattern[];
export const verbs = verbsJson.verbs as Verb[];
