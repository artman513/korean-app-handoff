// MediaRecorder による録音フック（requirements.md F-03）
// audio/webm 優先・Safari は audio/mp4 にフォールバック。最長10秒で自動停止。

import { useCallback, useEffect, useRef, useState } from 'react';

export const MAX_RECORD_MS = 10_000;

export function isRecorderSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof MediaRecorder !== 'undefined'
  );
}

function pickMimeType(): string {
  const candidates = ['audio/webm', 'audio/mp4'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return ''; // ブラウザ既定に任せる
}

export type RecorderStatus = 'idle' | 'recording';
export type RecorderErrorKind = 'unsupported' | 'permission' | 'unknown';

export interface RecorderError {
  kind: RecorderErrorKind;
  message: string;
}

interface UseRecorderOptions {
  onComplete: (blob: Blob) => void;
  onError?: (error: RecorderError) => void;
}

export function useRecorder({ onComplete, onError }: UseRecorderOptions) {
  const supported = isRecorderSupported();
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (!supported) {
      onError?.({ kind: 'unsupported', message: 'MediaRecorder 非対応' });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError?.({ kind: 'permission', message: 'マイクの許可が必要です' });
      return;
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type });
      cleanup();
      setStatus('idle');
      onComplete(blob);
    };

    recorder.start();
    setStatus('recording');
    timerRef.current = window.setTimeout(stop, MAX_RECORD_MS);
  }, [supported, onComplete, onError, cleanup, stop]);

  // アンマウント時に録音・ストリームを確実に止める
  useEffect(() => cleanup, [cleanup]);

  return { supported, status, start, stop };
}
