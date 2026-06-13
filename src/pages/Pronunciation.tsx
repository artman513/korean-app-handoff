import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { phrases } from '../data';
import { getCache, setCache } from '../lib/db';
import { fetchFeedback, GroqError, transcribe } from '../lib/groq';
import { recordPronunciationResult } from '../lib/progress';
import {
  defaultRate,
  RATE_SLOW,
  speakKorean,
  useKoreanVoice,
} from '../lib/speech';
import {
  computeScore,
  isUsableRecognition,
  judge,
  type Judgement,
  type ScoreResult,
} from '../lib/score';
import {
  isRecorderSupported,
  useRecorder,
  type RecorderError,
} from '../lib/recorder';

type Phase = 'idle' | 'recording' | 'analyzing' | 'result' | 'error';

const JUDGE_LABEL: Record<Judgement, string> = {
  perfect: '완벽!',
  pass: '좋아요',
  fail: '다시!',
};

// F-03 発音チェック：録音→Whisper→スコア→保存→不合格時フィードバック
export default function Pronunciation() {
  const { id } = useParams<{ id: string }>();
  const phrase = phrases.find((p) => p.id === id);
  const { supported: speechSupported, voice } = useKoreanVoice();

  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [feedback, setFeedback] = useState('');

  // 不合格時のフィードバック取得（キャッシュ優先・F-03）
  const loadFeedback = useCallback(
    async (
      phraseId: string,
      correct: string,
      recognized: string,
      scored: ScoreResult,
    ) => {
      const cacheKey = `feedback:${phraseId}`;
      const cached = await getCache<string>(cacheKey);
      if (cached) {
        setFeedback(cached);
        return;
      }
      const mismatched = [...scored.targetNorm]
        .filter((_, i) => !scored.targetMatched[i])
        .join(' ');
      try {
        const text = await fetchFeedback(correct, recognized, mismatched);
        if (text) {
          await setCache(cacheKey, text);
          setFeedback(text);
        }
      } catch {
        // フィードバック取得失敗はスコア表示に影響させない（無視）
      }
    },
    [],
  );

  const analyze = useCallback(
    async (blob: Blob) => {
      if (!phrase) return;
      setPhase('analyzing');
      try {
        const text = await transcribe(blob);
        if (!isUsableRecognition(text)) {
          setErrorMsg('聞き取れなかったよ、もう一回♡');
          setPhase('error');
          return;
        }
        const scored = computeScore(text, phrase.ko);
        setResult(scored);
        setFeedback('');
        setPhase('result');
        await recordPronunciationResult(phrase.id, scored.score);
        // 不合格かつキャッシュ未存在のときのみフィードバック生成（F-03）
        if (scored.score < 70) {
          void loadFeedback(phrase.id, phrase.ko, text, scored);
        }
      } catch (err) {
        const rateLimited = err instanceof GroqError && err.status === 429;
        setErrorMsg(
          rateLimited
            ? '混み合ってるみたい、少し待ってね'
            : '通信に失敗したみたい。少し待ってね',
        );
        setPhase('error');
      }
    },
    [phrase, loadFeedback],
  );

  const onRecorderError = useCallback((e: RecorderError) => {
    setErrorMsg(
      e.kind === 'permission'
        ? 'マイクの使用を許可してね（ブラウザの設定から有効化できます）'
        : 'この端末では録音が使えません',
    );
    setPhase('error');
  }, []);

  const recorder = useRecorder({ onComplete: analyze, onError: onRecorderError });

  if (!phrase) {
    return (
      <div>
        <PageHeader title="発音チェック" backTo="/phrases?mode=pronun" />
        <p className="p-4 text-pink-100/80">フレーズが見つかりません</p>
      </div>
    );
  }

  const canSpeak = speechSupported && voice !== null;
  const recorderUnavailable = !isRecorderSupported();

  const handleRecordButton = () => {
    if (recorder.status === 'recording') {
      recorder.stop();
      return;
    }
    setPhase('recording');
    void recorder.start();
  };

  const reset = () => {
    setResult(null);
    setErrorMsg('');
    setPhase('idle');
  };

  const stamp = result && judge(result.score) === 'perfect' ? '완벽!' : '대박!';

  return (
    <div className="relative">
      {/* 合格時のプリクラ風スタンプ */}
      {phase === 'result' &&
        result &&
        judge(result.score) !== 'fail' && (
          <span className="stamp absolute right-5 top-2 z-[6] text-3xl">
            {stamp}
          </span>
        )}

      <PageHeader
        title="발음 체크"
        subtitle="うまく言えたら 완벽!"
        backTo="/phrases?mode=pronun"
      />
      <div className="space-y-4 px-4 pb-4">
        {/* 対象フレーズ */}
        <div className="glass px-4 py-5 text-center">
          <p className="font-ko text-2xl leading-snug">
            {result ? (
              <HighlightedKo phrase={phrase.ko} result={result} />
            ) : (
              phrase.ko
            )}
          </p>
          <p className="mt-2 font-pop text-xs" style={{ color: 'var(--inksub)' }}>
            {phrase.ja} ・ {phrase.romaja}
          </p>
        </div>

        <button
          type="button"
          disabled={!canSpeak}
          onClick={() => speakKorean(phrase.ko, defaultRate(), voice)}
          aria-label="お手本を聞く"
          className="btn-ghost w-full py-2.5 text-sm"
        >
          🔊 お手本を聞く
        </button>

        {/* 結果ゲージ */}
        {phase === 'result' && result && (
          <ResultGauge
            result={result}
            phraseKo={phrase.ko}
            voice={canSpeak ? voice : null}
            feedback={feedback}
          />
        )}

        {/* 分析中 */}
        {phase === 'analyzing' && (
          <p className="py-4 text-center font-cute text-sm text-pink-100/90">
            聞き取り中…🎧
          </p>
        )}

        {/* エラー */}
        {phase === 'error' && (
          <div className="glass p-4 text-center">
            <p className="font-ko text-sm" style={{ color: 'var(--hot)' }}>
              {errorMsg}
            </p>
          </div>
        )}

        {/* 録音ボタン */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            type="button"
            disabled={recorderUnavailable || phase === 'analyzing'}
            onClick={handleRecordButton}
            aria-label={
              recorder.status === 'recording' ? '録音を止める' : '録音する'
            }
            className={`rec-btn grid h-20 w-20 place-items-center ${
              recorder.status === 'recording' ? 'recording animate-pulse' : ''
            }`}
          >
            {recorder.status === 'recording' ? (
              <span className="text-2xl text-white">⏹</span>
            ) : (
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
                <use href="#nMic" />
              </svg>
            )}
          </button>
          <p className="font-cute text-xs text-pink-100/90">
            {recorderUnavailable
              ? 'この端末では録音が使えません'
              : recorder.status === 'recording'
                ? '録音中…（最長10秒・タップで停止）'
                : phase === 'result' || phase === 'error'
                  ? 'もう一度挑戦できます'
                  : 'タップして発音してみよう'}
          </p>
          {(phase === 'result' || phase === 'error') && (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-bold text-pink-200 underline"
            >
              リセット
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 正解の音節のうち、ズレた箇所を色分け表示（ガラスカード上）
function HighlightedKo({
  phrase,
  result,
}: {
  phrase: string;
  result: ScoreResult;
}) {
  // result.targetMatched は正規化後の音節順。表示用に元テキストの音節へ対応付ける
  const syllables = [...phrase];
  let normIndex = 0;
  return (
    <>
      {syllables.map((ch, i) => {
        const isHangul = /[가-힣]/.test(ch);
        if (!isHangul) return <span key={i}>{ch}</span>;
        const matched = result.targetMatched[normIndex] ?? false;
        normIndex++;
        return (
          <span
            key={i}
            style={
              matched
                ? undefined
                : {
                    color: '#C4006B',
                    textDecoration: 'underline wavy rgba(255,26,140,.6) 2px',
                  }
            }
          >
            {ch}
          </span>
        );
      })}
    </>
  );
}

function ResultGauge({
  result,
  phraseKo,
  voice,
  feedback,
}: {
  result: ScoreResult;
  phraseKo: string;
  voice: SpeechSynthesisVoice | null;
  feedback: string;
}) {
  const j = judge(result.score);
  const circumference = 2 * Math.PI * 42; // r=42
  const offset = circumference * (1 - result.score / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative mx-auto h-36 w-36">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,.14)"
            strokeWidth="9"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#gFacet)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div
          className="gauge-num absolute inset-0 flex flex-col items-center justify-center text-4xl leading-none"
          role="img"
          aria-label={`スコア ${result.score}点`}
        >
          {result.score}
          <span className="font-ko text-xs text-pink-100/90">点</span>
        </div>
      </div>
      <p className="verdict text-2xl">{JUDGE_LABEL[j]}</p>

      {j !== 'fail' && voice && (
        <button
          type="button"
          onClick={() => speakKorean(phraseKo, RATE_SLOW, voice)}
          className="text-xs font-bold text-pink-200 underline"
        >
          🔊 お手本をもう一度
        </button>
      )}
      {j === 'fail' && feedback && (
        <div className="glass mt-1 w-full p-3 text-sm leading-relaxed">
          💡 {feedback}
        </div>
      )}
    </div>
  );
}
