// Vercel Serverless Function（requirements.md §7）
// 全Groq呼び出しをここに集約し、APIキーをフロントに露出させない。
// task パラメータ（transcribe | example | feedback | chat | summarize）で分岐する。
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI, { toFile } from 'openai';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const WHISPER_MODEL = 'whisper-large-v3';
const CHAT_MODEL = 'llama-3.3-70b-versatile'; // チャット（重い）
const LIGHT_MODEL = 'llama-3.1-8b-instant'; // 要約など軽量タスク

// OpenAI SDK互換：baseURL を Groq に差し替えるだけで動作する
function getClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  return new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
}

// ---- 簡易レートリミット（同一IPから60秒に10回まで） ----
// サーバーレスのウォームインスタンス内で有効なベストエフォート実装
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const hits = new Map<string, number[]>();

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd)) return fwd[0];
  return req.socket?.remoteAddress ?? 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

// ---- task: transcribe（発音チェックの音声認識） ----
async function handleTranscribe(
  client: OpenAI,
  body: { audio?: string; mimeType?: string },
): Promise<{ text: string }> {
  if (!body.audio) throw new HttpError(400, 'audio is required');
  const buffer = Buffer.from(body.audio, 'base64');
  const ext = body.mimeType?.includes('mp4') ? 'mp4' : 'webm';
  const file = await toFile(buffer, `audio.${ext}`, {
    type: body.mimeType ?? 'audio/webm',
  });
  const result = await client.audio.transcriptions.create({
    file,
    model: WHISPER_MODEL,
    language: 'ko',
  });
  return { text: result.text ?? '' };
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqBody {
  task?: string;
  audio?: string;
  mimeType?: string;
  messages?: ChatMessage[];
  text?: string;
  phraseKo?: string;
  phraseJa?: string;
  correct?: string;
  recognized?: string;
  mismatched?: string;
}

// ---- task: example（フレーズの例文生成、8Bで節約・JSON固定） ----
async function handleExample(
  client: OpenAI,
  body: GroqBody,
): Promise<{ example_ko: string; example_ja: string } | null> {
  if (!body.phraseKo) throw new HttpError(400, 'phraseKo is required');
  const completion = await client.chat.completions.create({
    model: LIGHT_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content:
          'あなたは韓国語教師です。指定された韓国語フレーズを使った自然な例文を1つ作り、JSONのみで返してください。形式: {"example_ko": "韓国語の例文", "example_ja": "その日本語訳"}',
      },
      {
        role: 'user',
        content: `フレーズ: ${body.phraseKo}（意味: ${body.phraseJa ?? ''}）`,
      },
    ],
  });
  const content = completion.choices[0]?.message?.content ?? '';
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (
      typeof parsed.example_ko === 'string' &&
      typeof parsed.example_ja === 'string'
    ) {
      return { example_ko: parsed.example_ko, example_ja: parsed.example_ja };
    }
  } catch {
    // パース失敗時は null（フロントは例文欄を非表示）
  }
  return null;
}

// ---- task: feedback（発音フィードバック、8Bで日本語1〜2文） ----
async function handleFeedback(
  client: OpenAI,
  body: GroqBody,
): Promise<{ feedback: string }> {
  if (!body.correct) throw new HttpError(400, 'correct is required');
  const completion = await client.chat.completions.create({
    model: LIGHT_MODEL,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content:
          'あなたは韓国語の発音コーチです。正解文と、学習者の発音認識結果、ズレた音節を踏まえ、どの音をどう直すべきか日本語で1〜2文だけ、やさしく具体的にアドバイスしてください。前置きや記号は不要です。',
      },
      {
        role: 'user',
        content: `正解: ${body.correct}\n認識結果: ${body.recognized ?? ''}\nズレた音節: ${body.mismatched ?? ''}`,
      },
    ],
  });
  return { feedback: completion.choices[0]?.message?.content?.trim() ?? '' };
}

// ---- task: chat（ロールプレイ応答、JSON固定・パース失敗時1回リトライ） ----
async function handleChat(
  client: OpenAI,
  body: { messages?: ChatMessage[] },
): Promise<{ ok: true; reply: unknown } | { ok: false; reason: 'parse' }> {
  if (!Array.isArray(body.messages)) {
    throw new HttpError(400, 'messages is required');
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: body.messages,
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });
    const content = completion.choices[0]?.message?.content ?? '';
    try {
      return { ok: true, reply: JSON.parse(content) };
    } catch {
      // リトライ
    }
  }
  return { ok: false, reason: 'parse' };
}

// ---- task: summarize（会話履歴の要約、8Bで節約） ----
async function handleSummarize(
  client: OpenAI,
  body: { text?: string },
): Promise<{ summary: string }> {
  if (!body.text) throw new HttpError(400, 'text is required');
  const completion = await client.chat.completions.create({
    model: LIGHT_MODEL,
    messages: [
      {
        role: 'system',
        content:
          '次の韓国語ロールプレイ会話を、文脈が分かるように日本語で1〜2文に要約してください。',
      },
      { role: 'user', content: body.text },
    ],
    temperature: 0.3,
  });
  return { summary: completion.choices[0]?.message?.content ?? '' };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (rateLimited(clientIp(req))) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const body = (req.body ?? {}) as GroqBody;

  try {
    const client = getClient();
    switch (body.task) {
      case 'transcribe':
        res.status(200).json(await handleTranscribe(client, body));
        return;
      case 'chat':
        res.status(200).json(await handleChat(client, body));
        return;
      case 'summarize':
        res.status(200).json(await handleSummarize(client, body));
        return;
      case 'example':
        res.status(200).json(await handleExample(client, body));
        return;
      case 'feedback':
        res.status(200).json(await handleFeedback(client, body));
        return;
      default:
        res.status(400).json({ error: `Unknown task: ${String(body.task)}` });
        return;
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // Groq のレート制限など上流エラーのステータス・詳細を引き継ぐ（APIキーは含めない）
    const e = err as {
      status?: number;
      message?: string;
      error?: { message?: string };
    };
    const upstreamStatus = e?.status;
    const detail = e?.error?.message ?? e?.message ?? 'unknown';
    res.status(upstreamStatus === 429 ? 429 : 502).json({
      error: upstreamStatus === 429 ? 'Rate limited upstream' : 'Upstream error',
      upstreamStatus,
      detail,
    });
  }
}
