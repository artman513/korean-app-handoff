import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { phraseCategories, phrases } from '../data';
import { getProgressByType } from '../lib/db';

const LV_PILL = ['pill-lv1', 'pill-lv1', 'pill-lv2', 'pill-lv3'];

// F-02 フレーズ一覧：カテゴリタブ＋リスト。?mode=pronun で発音モード
export default function PhraseList() {
  const [searchParams] = useSearchParams();
  const isPronunMode = searchParams.get('mode') === 'pronun';
  const [activeCat, setActiveCat] = useState(phraseCategories[0].id);
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getProgressByType('phrase').then((records) => {
      setPassedIds(
        new Set(records.filter((r) => r.bestScore >= 70).map((r) => r.itemId)),
      );
    });
  }, []);

  const items = phrases.filter((p) => p.category === activeCat);

  return (
    <div>
      <PageHeader
        title="프레이즈"
        subtitle={isPronunMode ? '発音するフレーズを選ぼ♡' : '推しに届けたい一言を♡'}
        backTo="/"
        right={`${passedIds.size}/${phrases.length}`}
      />
      <div className="px-4 pb-4">
        <div
          role="tablist"
          aria-label="カテゴリ"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
        >
          {phraseCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCat === cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`pill shrink-0 text-sm ${
                activeCat === cat.id ? 'pill-cat' : 'pill-cat-off'
              }`}
            >
              <span aria-hidden="true">{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-2.5">
          {items.map((p) => {
            const passed = passedIds.has(p.id);
            return (
              <li key={p.id}>
                <Link
                  to={
                    isPronunMode ? `/pronunciation/${p.id}` : `/phrases/${p.id}`
                  }
                  aria-label={`${p.ko}（${p.ja}）${passed ? '・合格済み' : ''}`}
                  className="glass flex items-center gap-2 px-3.5 py-3 transition-transform active:scale-[0.98]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-ko text-base">
                      {p.ko}
                    </span>
                    <span
                      className="block truncate font-pop text-xs"
                      style={{ color: 'var(--inksub)' }}
                    >
                      {p.ja}
                    </span>
                  </span>
                  <span className={`pill ${LV_PILL[p.level]}`}>
                    Lv{p.level}
                    {passed && ' ✓'}
                  </span>
                  <span aria-hidden="true" style={{ color: 'var(--inksub)' }}>
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
