// ロールプレイのチャットロジック（requirements.md F-09）

import type { RoleplaySituation } from '../data/roleplay';
import { GroqError } from './groq';

export interface Suggestion {
  ko: string;
  ja: string;
}

export interface ChatReply {
  reply_ko: string;
  reply_ja: string;
  suggestions: Suggestion[];
  end: boolean;
}

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 会話履歴の蓄積上限（超過時は古い分を要約）と、直近保持ターン数
export const HISTORY_LIMIT = 20;
export const KEEP_RECENT = 10;

/** システムプロンプト：シチュエーション・役割・難易度・JSON固定を指示 */
export function buildSystemPrompt(situation: RoleplaySituation): string {
  const levelNote =
    situation.level === 'intermediate'
      ? '中級者向け。時々「変化球（トラブルや予想外の応答）」を交えて、自然で少し難しい会話にしてください。'
      : '初級者向け。やさしく短い韓国語で、ゆっくり会話を進めてください。';

  return [
    `あなたは韓国語学習アプリのロールプレイ相手です。シチュエーション「${situation.title}（${situation.titleJa}）」を演じます。`,
    `状況: ${situation.description}`,
    levelNote,
    'ユーザーはK-POPファンの日本人学習者です。あなたから自然に会話を始め、1ターンずつ短く応答してください。',
    'ユーザーが日本語で入力した場合は、まず韓国語での言い方を提案してください。',
    '会話が自然に区切れる場面（店を出る、通話終了など）では end を true にしてください。',
    '必ず以下のJSON形式のみで返答してください（前後に文章を付けない）:',
    '{"reply_ko": "韓国語のセリフ", "reply_ja": "その日本語訳", "suggestions": [{"ko":"返答候補1","ja":"訳1"},{"ko":"返答候補2","ja":"訳2"},{"ko":"返答候補3","ja":"訳3"}], "end": false}',
    'suggestions は必ず3つ、ユーザーが次に言える自然な韓国語の返答候補にしてください。',
  ].join('\n');
}

export type ChatResult =
  | { kind: 'ok'; reply: ChatReply }
  | { kind: 'parse' } // パース失敗（もう一回送ってみて）
  | { kind: 'error' }; // API失敗・429・タイムアウト（混み合ってる）

function isValidReply(value: unknown): value is ChatReply {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.reply_ko === 'string' &&
    typeof v.reply_ja === 'string' &&
    Array.isArray(v.suggestions)
  );
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
    if (!res.ok) throw new GroqError(res.status, `failed: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** 1ターン分のチャット応答を取得 */
export async function chatTurn(messages: ModelMessage[]): Promise<ChatResult> {
  try {
    const data = await postGroq<
      { ok: true; reply: unknown } | { ok: false; reason: string }
    >({ task: 'chat', messages });
    if (!data.ok) return { kind: 'parse' };
    if (!isValidReply(data.reply)) return { kind: 'parse' };
    const reply = data.reply;
    return {
      kind: 'ok',
      reply: {
        reply_ko: reply.reply_ko,
        reply_ja: reply.reply_ja,
        suggestions: reply.suggestions.slice(0, 3),
        end: Boolean(reply.end),
      },
    };
  } catch {
    return { kind: 'error' };
  }
}

/** 古い会話を8Bで1メッセージに要約 */
async function summarize(text: string): Promise<string> {
  const { summary } = await postGroq<{ summary: string }>({
    task: 'summarize',
    text,
  });
  return summary;
}

/**
 * モデルへ送る messages を組み立てる。
 * 履歴（system除く）が HISTORY_LIMIT を超えたら、古い分を要約して1メッセージに置換し、
 * 直近 KEEP_RECENT ターンのみ残す（F-09 / §7）。
 */
export async function buildMessages(
  systemPrompt: string,
  history: ModelMessage[],
): Promise<ModelMessage[]> {
  const system: ModelMessage = { role: 'system', content: systemPrompt };
  if (history.length <= HISTORY_LIMIT) {
    return [system, ...history];
  }
  const old = history.slice(0, history.length - KEEP_RECENT);
  const recent = history.slice(history.length - KEEP_RECENT);
  const text = old.map((m) => `${m.role}: ${m.content}`).join('\n');
  let summaryMsg: ModelMessage;
  try {
    const summary = await summarize(text);
    summaryMsg = { role: 'system', content: `これまでの会話の要約: ${summary}` };
  } catch {
    // 要約に失敗しても会話は継続（直近のみ送る）
    summaryMsg = { role: 'system', content: '（これまでの会話は省略）' };
  }
  return [system, summaryMsg, ...recent];
}
