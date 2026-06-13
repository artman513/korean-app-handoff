import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import PuzzleSession from '../components/PuzzleSession';
import { patterns } from '../data';
import type { Pattern } from '../types/data';

const LV_PILL = ['pill-lv1', 'pill-lv1', 'pill-lv2'];

// F-04 パズル学習：文型選択 → セッション（5問）
export default function Puzzle() {
  const [selected, setSelected] = useState<Pattern | null>(null);

  if (selected) {
    return (
      <div>
        <PageHeader title={selected.label} subtitle="文を完成させよう♡" backTo="/" />
        <PuzzleSession
          key={selected.id}
          pattern={selected}
          onFinish={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="문장 퍼즐" subtitle="動詞カードで文を作ろ♡" backTo="/" />
      <ul className="space-y-2.5 px-4 pb-4">
        {patterns.map((pattern) => (
          <li key={pattern.id}>
            <button
              type="button"
              onClick={() => setSelected(pattern)}
              aria-label={`${pattern.label}（${pattern.meaning}）を始める`}
              className="glass flex w-full items-center justify-between px-4 py-3.5 text-left transition-transform active:scale-[0.98]"
            >
              <span>
                <span className="block font-ko text-base">{pattern.label}</span>
                <span
                  className="block font-pop text-xs"
                  style={{ color: 'var(--inksub)' }}
                >
                  {pattern.meaning}（例：{pattern.example}）
                </span>
              </span>
              <span className={`pill ${LV_PILL[pattern.level - 1] ?? 'pill-lv1'}`}>
                Lv{pattern.level}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
