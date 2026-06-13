import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { phrases } from '../data';
import { getCache, setCache } from '../lib/db';
import { fetchExample, type Example } from '../lib/groq';
import {
  RATE_NORMAL,
  RATE_SLOW,
  speakKorean,
  useKoreanVoice,
} from '../lib/speech';

// F-02 フレーズ詳細：お手本再生（標準/ゆっくり）＋発音チェック導線＋例文生成
export default function PhraseDetail() {
  const { id } = useParams<{ id: string }>();
  const phrase = phrases.find((p) => p.id === id);
  const { supported, ready, voice } = useKoreanVoice();

  // 例文：初回のみGroq、以降キャッシュ（F-02）。'hidden'=パース失敗で非表示
  const [example, setExample] = useState<Example | null>(null);
  const [exampleState, setExampleState] = useState<
    'idle' | 'loading' | 'done' | 'hidden'
  >('idle');

  const loadExample = async () => {
    if (!phrase || exampleState === 'loading') return;
    setExampleState('loading');
    const cacheKey = `example:${phrase.id}`;
    const cached = await getCache<Example>(cacheKey);
    if (cached) {
      setExample(cached);
      setExampleState('done');
      return;
    }
    try {
      const result = await fetchExample(phrase.ko, phrase.ja);
      if (result) {
        await setCache(cacheKey, result);
        setExample(result);
        setExampleState('done');
      } else {
        setExampleState('hidden'); // パース失敗時は例文欄を非表示
      }
    } catch {
      setExampleState('idle'); // 通信失敗時は再試行できるよう戻す
    }
  };

  if (!phrase) {
    return (
      <div>
        <PageHeader title="フレーズ詳細" backTo="/phrases" />
        <p className="p-4 text-pink-100/80">フレーズが見つかりません</p>
      </div>
    );
  }

  const canSpeak = supported && voice !== null;
  const speechUnavailable = ready && !canSpeak;

  const play = (rate: number) => speakKorean(phrase.ko, rate, voice);

  return (
    <div>
      <PageHeader title="프레이즈" subtitle="声に出して練習しよ♡" backTo="/phrases" />
      <div className="space-y-3 px-4 pb-4">
        <div className="glass px-4 py-7 text-center">
          <p className="font-ko text-3xl leading-snug">{phrase.ko}</p>
          <p className="mt-2 font-pop text-sm" style={{ color: 'var(--inksub)' }}>
            {phrase.ja}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--hot)' }}>
            {phrase.romaja}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canSpeak}
            onClick={() => play(RATE_NORMAL)}
            aria-label="お手本を聞く"
            className="btn-hot flex-1 py-3 text-sm"
          >
            🔊 お手本
          </button>
          <button
            type="button"
            disabled={!canSpeak}
            onClick={() => play(RATE_SLOW)}
            aria-label="お手本をゆっくり聞く"
            className="btn-ghost flex-1 py-3 text-sm"
          >
            🐢 ゆっくり
          </button>
        </div>
        {speechUnavailable && (
          <p className="text-center text-xs text-pink-100/80">
            この端末ではお手本再生が使えません
          </p>
        )}

        <Link
          to={`/pronunciation/${phrase.id}`}
          className="btn-ghost block w-full py-3 text-center text-sm"
        >
          🎙️ 発音してみる
        </Link>

        {exampleState === 'done' && example ? (
          <div className="glass p-4 text-center">
            <p className="font-cute text-xs" style={{ color: 'var(--hot)' }}>
              例文
            </p>
            <p className="mt-1 font-ko text-base">{example.example_ko}</p>
            <p className="mt-0.5 font-pop text-xs" style={{ color: 'var(--inksub)' }}>
              {example.example_ja}
            </p>
          </div>
        ) : exampleState === 'hidden' ? null : (
          <button
            type="button"
            onClick={() => void loadExample()}
            disabled={exampleState === 'loading'}
            aria-label="例文を見る"
            className="btn-ghost w-full py-3 text-sm"
          >
            {exampleState === 'loading' ? '生成中…' : '📝 例文を見る'}
          </button>
        )}
      </div>
    </div>
  );
}
