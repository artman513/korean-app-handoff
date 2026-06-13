import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { hangul } from '../data';
import { getProgress, putProgress, type ProgressRecord } from '../lib/db';
import {
  RATE_NORMAL,
  RATE_SLOW,
  speakKorean,
  useKoreanVoice,
} from '../lib/speech';
import { nextReviewAtForSrsLevel, statusForSrsLevel } from '../lib/srs';

// F-01 ハングル詳細：口の形ヒント・例単語・お手本再生（標準/ゆっくり）・習得トグル
export default function HangulDetail() {
  const { id } = useParams<{ id: string }>();
  const item = hangul.find((h) => h.id === id);
  const { supported, ready, voice } = useKoreanVoice();
  const [progress, setProgress] = useState<ProgressRecord | null>(null);

  useEffect(() => {
    if (!item) return;
    getProgress(item.id).then((record) => setProgress(record ?? null));
  }, [item]);

  if (!item) {
    return (
      <div>
        <PageHeader title="ハングル詳細" backTo="/hangul" />
        <p className="p-4 text-pink-100/80">文字が見つかりません</p>
      </div>
    );
  }

  const mastered = progress?.status === 'mastered';
  const canSpeak = supported && voice !== null;
  const speechUnavailable = ready && !canSpeak;

  const play = (rate: number) => speakKorean(item.exampleWord, rate, voice);

  const toggleMastered = async () => {
    const now = Date.now();
    const srsLevel = mastered ? 0 : 5;
    const record: ProgressRecord = {
      itemId: item.id,
      itemType: 'hangul',
      status: statusForSrsLevel(srsLevel),
      srsLevel,
      nextReviewAt: nextReviewAtForSrsLevel(srsLevel, now),
      bestScore: 0,
      attempts: progress?.attempts ?? 0,
      updatedAt: now,
    };
    await putProgress(record);
    setProgress(record);
  };

  return (
    <div>
      <PageHeader title={`${item.char}`} subtitle={item.romaja} backTo="/hangul" />
      <div className="space-y-3 px-4 pb-4">
        <div className="glass py-7 text-center">
          <p className="font-display text-7xl leading-none text-[#7a0040]">
            {item.char}
          </p>
          <p className="mt-3 font-ko text-xl" style={{ color: 'var(--hot)' }}>
            {item.romaja}
          </p>
        </div>

        <div className="glass p-4">
          <p className="mb-1 font-cute text-sm" style={{ color: 'var(--hot)' }}>
            口の形ヒント
          </p>
          <p className="text-sm leading-relaxed">{item.mouthHint}</p>
        </div>

        <div className="glass p-4 text-center">
          <p className="font-ko text-2xl">{item.exampleWord}</p>
          <p className="mt-1 font-pop text-xs" style={{ color: 'var(--inksub)' }}>
            {item.exampleMeaning}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canSpeak}
            onClick={() => play(RATE_NORMAL)}
            aria-label={`お手本を聞く（${item.exampleWord}）`}
            className="btn-hot flex-1 py-3 text-sm"
          >
            🔊 聞く
          </button>
          <button
            type="button"
            disabled={!canSpeak}
            onClick={() => play(RATE_SLOW)}
            aria-label={`お手本をゆっくり聞く（${item.exampleWord}）`}
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

        <button
          type="button"
          onClick={toggleMastered}
          aria-pressed={mastered}
          aria-label="習得済みにする"
          className={mastered ? 'btn-hot w-full py-3 text-sm' : 'btn-ghost w-full py-3 text-sm'}
        >
          {mastered ? '✓ 習得済み（タップで解除）' : '✓ 習得済みにする'}
        </button>
      </div>
    </div>
  );
}
