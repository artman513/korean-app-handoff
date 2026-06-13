// Web Speech API SpeechSynthesis によるお手本再生（requirements.md F-01 / F-02）

import { useEffect, useState } from 'react';
import { loadSettings } from './storage';

export const RATE_NORMAL = 1.0;
export const RATE_SLOW = 0.7;

/** 設定の音声速度デフォルト（F-08）に対応する rate を返す */
export function defaultRate(): number {
  return loadSettings().speechSpeed === 'slow' ? RATE_SLOW : RATE_NORMAL;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function findKoreanVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('ko')) ??
    null
  );
}

export interface KoreanVoiceState {
  /** SpeechSynthesis 自体が使えるか */
  supported: boolean;
  /** ボイス一覧のロードが完了したか（voiceschanged 後に確定） */
  ready: boolean;
  voice: SpeechSynthesisVoice | null;
}

/**
 * ko-KR ボイスの取得。ボイス一覧は非同期ロードされるため、
 * voiceschanged イベント後に有無を判定する（F-01 エラー要件）。
 * イベントが発火しない環境向けに2秒のフォールバックを置く。
 */
export function useKoreanVoice(): KoreanVoiceState {
  const supported = isSpeechSupported();
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supported) {
      setReady(true);
      return;
    }
    const update = () => {
      setVoice(findKoreanVoice());
      if (window.speechSynthesis.getVoices().length > 0) setReady(true);
    };
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    const fallback = window.setTimeout(() => setReady(true), 2000);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update);
      window.clearTimeout(fallback);
    };
  }, [supported]);

  return { supported, ready, voice };
}

/** 韓国語テキストを読み上げる。再生中のものがあればキャンセルして差し替える */
export function speakKorean(
  text: string,
  rate: number,
  voice: SpeechSynthesisVoice | null,
): void {
  if (!isSpeechSupported()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
