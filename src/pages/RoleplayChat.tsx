import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { roleplaySituations } from '../data/roleplay';
import {
  buildMessages,
  buildSystemPrompt,
  chatTurn,
  type ModelMessage,
  type Suggestion,
} from '../lib/roleplay-chat';
import { incrementChatCount, loadUsage } from '../lib/storage';
import { defaultRate, speakKorean, useKoreanVoice } from '../lib/speech';

const DAILY_LIMIT = 20; // 1日のチャットターン上限（F-09）
const HANGUL = /[가-힣]/;

interface DisplayMessage {
  id: number;
  from: 'ai' | 'user';
  ko: string;
  ja?: string;
  time: number;
}

let msgId = 0;

export default function RoleplayChat() {
  const { id } = useParams<{ id: string }>();
  const situation = roleplaySituations.find((s) => s.id === id);
  const { voice } = useKoreanVoice();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [count, setCount] = useState(() => loadUsage().chat.count);
  const [remaining, setRemaining] = useState<number | null>(
    situation?.timerSec ?? null,
  );

  // モデルへ渡す会話履歴（system は送信時に付与）。ふりかえり用の韓国語ログも保持
  const historyRef = useRef<ModelMessage[]>([]);
  const koUsedRef = useRef<string[]>([]);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemPrompt = situation ? buildSystemPrompt(situation) : '';
  const limitReached = count >= DAILY_LIMIT;

  const pushAi = useCallback(
    (ko: string, ja: string) => {
      setMessages((m) => [
        ...m,
        { id: msgId++, from: 'ai', ko, ja, time: Date.now() },
      ]);
      historyRef.current.push({ role: 'assistant', content: ko });
    },
    [],
  );

  // AIの応答を1ターン取得して反映する共通処理
  const fetchReply = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    const payload = await buildMessages(systemPrompt, historyRef.current);
    const result = await chatTurn(payload);
    setLoading(false);
    return result;
  }, [systemPrompt]);

  // 初回：AIから会話を開始
  useEffect(() => {
    if (!situation || startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      const result = await fetchReply();
      if (result.kind === 'ok') {
        pushAi(result.reply.reply_ko, result.reply.reply_ja);
        setSuggestions(result.reply.suggestions);
        if (result.reply.end) setEnded(true);
      } else {
        setErrorMsg('混み合ってるみたい、少し待ってね');
      }
    })();
  }, [situation, fetchReply, pushAi]);

  // 영통팬싸タイマー：残り0でセッション終了
  useEffect(() => {
    if (remaining === null || ended || messages.length === 0) return;
    if (remaining <= 0) {
      setEnded(true);
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => (r ?? 0) - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining, ended, messages.length]);

  // 新着メッセージで最下部へスクロール
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || ended || limitReached) return;

      // 楽観的に追加。失敗時はロールバックできるよう前の状態を退避
      const prevHistory = [...historyRef.current];
      const userMsg: DisplayMessage = {
        id: msgId++,
        from: 'user',
        ko: trimmed,
        time: Date.now(),
      };
      setMessages((m) => [...m, userMsg]);
      historyRef.current.push({ role: 'user', content: trimmed });
      if (HANGUL.test(trimmed)) koUsedRef.current.push(trimmed);
      setSuggestions([]);
      setInput('');

      const newCount = incrementChatCount().count;
      setCount(newCount);

      const result = await fetchReply();
      if (result.kind === 'ok') {
        pushAi(result.reply.reply_ko, result.reply.reply_ja);
        setSuggestions(result.reply.suggestions);
        if (result.reply.end) setEnded(true);
        return;
      }

      // 失敗：ターンを破棄して入力を復元（F-09 エラー要件）
      historyRef.current = prevHistory;
      if (HANGUL.test(trimmed)) koUsedRef.current.pop();
      setMessages((m) => m.filter((x) => x.id !== userMsg.id));
      setInput(trimmed);
      setErrorMsg(
        result.kind === 'parse'
          ? 'もう一回送ってみて'
          : '混み合ってるみたい、少し待ってね',
      );
    },
    [loading, ended, limitReached, fetchReply, pushAi],
  );

  if (!situation) {
    return (
      <div>
        <PageHeader title="チャット" backTo="/roleplay" />
        <p className="p-4 text-pink-100/80">シチュエーションが見つかりません</p>
      </div>
    );
  }

  // ふりかえり画面
  if (ended) {
    const turns = historyRef.current.filter((m) => m.role === 'user').length;
    return (
      <div>
        <PageHeader title="ふりかえり" subtitle="おつかれさま♡" backTo="/roleplay" />
        <div className="space-y-4 px-4 pb-4">
          <p className="text-center text-4xl">🎉</p>
          <div className="glass p-4 text-center">
            <p className="font-cute text-sm" style={{ color: 'var(--hot)' }}>
              会話ターン数
            </p>
            <p className="gauge-num text-4xl leading-none">{turns}</p>
          </div>
          <div className="glass p-4">
            <p className="mb-2 font-cute text-sm" style={{ color: 'var(--hot)' }}>
              使った韓国語フレーズ
            </p>
            {koUsedRef.current.length === 0 ? (
              <p className="font-pop text-xs" style={{ color: 'var(--inksub)' }}>
                （韓国語での発話はありませんでした）
              </p>
            ) : (
              <ul className="space-y-1">
                {koUsedRef.current.map((ko, i) => (
                  <li key={i} className="font-ko text-sm">
                    ♡ {ko}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col">
      {/* チャットヘッダー */}
      <div className="chat-top relative z-[2] flex items-center gap-2.5 px-4 py-3">
        <Link to="/roleplay" aria-label="戻る" className="font-ko text-2xl text-white">
          ‹
        </Link>
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 34% 28%,#FFB1D8,#FF1A8C 70%)',
            boxShadow: 'inset 0 2px 2px rgba(255,255,255,.8),0 0 10px rgba(255,26,140,.6)',
          }}
        >
          <svg viewBox="0 0 64 60" className="h-5 w-5">
            <use href="#iHeart" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-ko text-sm text-white">
            {situation.title}
          </p>
          <p className="truncate font-cute text-xs" style={{ color: 'var(--gold)' }}>
            {situation.emoji} {situation.titleJa}
          </p>
        </div>
        {remaining !== null ? (
          <span className={`ctimer text-base ${remaining <= 10 ? 'warn' : ''}`}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
        ) : (
          <span className="font-cute text-xs" style={{ color: 'var(--gold)' }}>
            残り{DAILY_LIMIT - count}回
          </span>
        )}
      </div>

      {/* メッセージ一覧 */}
      <div ref={scrollRef} className="relative z-[2] flex-1 space-y-2.5 overflow-y-auto p-4">
        {messages.map((m) =>
          m.from === 'ai' ? (
            <div key={m.id} className="flex flex-col items-start">
              <div className="bub-ai max-w-[80%] rounded-2xl px-3 py-2">
                <p className="font-ko text-sm">{m.ko}</p>
                {m.ja && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--inksub)' }}>
                    {m.ja}
                  </p>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakKorean(m.ko, defaultRate(), voice)}
                  aria-label="読み上げ"
                  className="text-xs text-pink-200/80"
                >
                  🔊
                </button>
                <span className="text-xs text-pink-200/50">
                  {formatTime(m.time)}
                </span>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-end">
              <div className="bub-me max-w-[80%] rounded-2xl px-3 py-2">
                <p className="font-ko text-sm">{m.ko}</p>
              </div>
              <span className="mt-0.5 text-xs text-pink-200/50">
                {formatTime(m.time)}
              </span>
            </div>
          ),
        )}
        {loading && (
          <div className="flex items-start">
            <div className="bub-ai rounded-2xl px-4 py-2.5 text-lg">…</div>
          </div>
        )}
      </div>

      {/* エラー */}
      {errorMsg && (
        <p className="relative z-[2] px-4 pb-1 text-center font-cute text-xs text-pink-200">
          {errorMsg}
        </p>
      )}

      {/* 入力エリア */}
      <div
        className="relative z-[2] p-3"
        style={{ borderTop: '1.5px solid rgba(255,90,170,.3)' }}
      >
        {limitReached ? (
          <p className="py-2 text-center font-cute text-sm text-pink-100/90">
            今日の分はおしまい！また明日♡
          </p>
        ) : (
          <>
            {/* おすすめ返答3択 */}
            {suggestions.length > 0 && !loading && (
              <div className="mb-2 flex flex-col gap-1.5">
                <p className="font-cute text-xs" style={{ color: 'var(--gold)' }}>
                  おすすめの返答 ♡
                </p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void send(s.ko)}
                    className="schip rounded-xl px-3 py-2 text-left transition-transform active:scale-[0.98]"
                  >
                    <span className="block font-ko text-sm">{s.ko}</span>
                    <span
                      className="block font-pop text-xs"
                      style={{ color: 'var(--inksub)' }}
                    >
                      {s.ja}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {/* 自由入力 */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                aria-label="メッセージを入力"
                placeholder="韓国語でも日本語でもOK"
                className="field min-w-0 flex-1 rounded-full px-4 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="送信"
                className="btn-hot px-5 py-2 text-sm"
              >
                送信
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
