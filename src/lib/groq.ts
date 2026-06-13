// フロント側から /api/groq を呼ぶクライアント（APIキーはサーバー側で秘匿）

export class GroqError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function postGroq<T>(
  body: Record<string, unknown>,
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new GroqError(res.status, `Groq request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** 発音チェック：録音 blob を Whisper でテキスト化（task: transcribe） */
export async function transcribe(blob: Blob): Promise<string> {
  const audio = await blobToBase64(blob);
  const { text } = await postGroq<{ text: string }>({
    task: 'transcribe',
    audio,
    mimeType: blob.type || 'audio/webm',
  });
  return text;
}

export interface Example {
  example_ko: string;
  example_ja: string;
}

/** フレーズの例文生成（task: example）。パース失敗時は null */
export async function fetchExample(
  phraseKo: string,
  phraseJa: string,
): Promise<Example | null> {
  return postGroq<Example | null>({ task: 'example', phraseKo, phraseJa });
}

/** 発音フィードバック（task: feedback）。不合格時のみ呼ぶ */
export async function fetchFeedback(
  correct: string,
  recognized: string,
  mismatched: string,
): Promise<string> {
  const { feedback } = await postGroq<{ feedback: string }>({
    task: 'feedback',
    correct,
    recognized,
    mismatched,
  });
  return feedback;
}
