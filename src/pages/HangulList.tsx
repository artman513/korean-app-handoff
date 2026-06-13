import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { hangul } from '../data';
import { getProgressByType } from '../lib/db';

const TABS = [
  { type: 'consonant', label: '자음 子音' },
  { type: 'vowel', label: '모음 母音' },
] as const;

type TabType = (typeof TABS)[number]['type'];

// F-01 ハングル一覧：자음/모음タブ＋4列グリッド。習得済みセルを強調表示
export default function HangulList() {
  const [tab, setTab] = useState<TabType>('consonant');
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getProgressByType('hangul').then((records) => {
      setMasteredIds(
        new Set(
          records.filter((r) => r.status === 'mastered').map((r) => r.itemId),
        ),
      );
    });
  }, []);

  const items = hangul.filter((h) => h.type === tab);

  return (
    <div>
      <PageHeader
        title="한글"
        subtitle="読みと口の形をおぼえよう♡"
        backTo="/"
        right={`${masteredIds.size}/${hangul.length}`}
      />
      <div className="px-4 pb-4">
        <div role="tablist" aria-label="文字の種類" className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.type}
              type="button"
              role="tab"
              aria-selected={tab === t.type}
              onClick={() => setTab(t.type)}
              className={
                tab === t.type
                  ? 'pill pill-cat flex-1 justify-center py-2 text-sm'
                  : 'pill pill-cat-off flex-1 justify-center py-2 text-sm'
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-4 gap-2.5">
          {items.map((h) => {
            const mastered = masteredIds.has(h.id);
            return (
              <li key={h.id}>
                <Link
                  to={`/hangul/${h.id}`}
                  aria-label={`${h.char}（${h.romaja}）の詳細${mastered ? '・習得済み' : ''}`}
                  className="glass relative flex aspect-square flex-col items-center justify-center transition-transform active:scale-95"
                >
                  {mastered && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1 right-1.5 text-xs"
                      style={{ color: 'var(--gold2)' }}
                    >
                      ✓
                    </span>
                  )}
                  <span className="font-ko text-2xl">{h.char}</span>
                  <span className="font-pop text-xs" style={{ color: 'var(--inksub)' }}>
                    {h.romaja}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-center font-cute text-xs text-pink-200/80">
          ✓ 習得済み・タップで詳細へ
        </p>
      </div>
    </div>
  );
}
