import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { hangul, patterns, phrases } from '../data';
import {
  getAllProgress,
  getDueProgress,
  type ItemType,
  type ProgressRecord,
} from '../lib/db';

interface DueItem {
  itemId: string;
  itemType: ItemType;
  label: string; // 表示テキスト（文字・フレーズ・文型ラベル）
  sub: string; // 補足（意味など）
  to: string; // 遷移先（各学習画面）
}

// progress レコードを表示用に解決（見つからない場合は除外）
function resolveDueItem(record: ProgressRecord): DueItem | null {
  switch (record.itemType) {
    case 'hangul': {
      const h = hangul.find((x) => x.id === record.itemId);
      return h
        ? { itemId: h.id, itemType: 'hangul', label: h.char, sub: h.romaja, to: `/hangul/${h.id}` }
        : null;
    }
    case 'phrase': {
      const p = phrases.find((x) => x.id === record.itemId);
      return p
        ? { itemId: p.id, itemType: 'phrase', label: p.ko, sub: p.ja, to: `/pronunciation/${p.id}` }
        : null;
    }
    case 'pattern': {
      const pt = patterns.find((x) => x.id === record.itemId);
      return pt
        ? { itemId: pt.id, itemType: 'pattern', label: pt.label, sub: pt.meaning, to: '/puzzle' }
        : null;
    }
  }
}

const TYPE_BADGE: Record<ItemType, string> = {
  hangul: 'ハングル',
  phrase: 'フレーズ',
  pattern: '文型',
};

// F-06 進捗・復習：習得サマリ＋復習キュー（期限到来アイテム）
export default function ProgressPage() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [due, setDue] = useState<DueItem[]>([]);

  useEffect(() => {
    getAllProgress().then(setRecords);
    getDueProgress().then((rows) => {
      setDue(rows.map(resolveDueItem).filter((x): x is DueItem => x !== null));
    });
  }, []);

  const masteredCount = (type: ItemType) =>
    records.filter((r) => r.itemType === type && r.status === 'mastered').length;
  const passedPhrases = records.filter(
    (r) => r.itemType === 'phrase' && r.bestScore >= 70,
  ).length;

  const summary = [
    { label: 'ハングル', value: `${masteredCount('hangul')} / ${hangul.length}` },
    { label: 'フレーズ合格', value: `${passedPhrases} / ${phrases.length}` },
    { label: '文型', value: `${masteredCount('pattern')} / ${patterns.length}` },
  ];

  return (
    <div>
      <PageHeader title="진행" subtitle="きみの成長記録♡" />
      <div className="space-y-6 px-4 pb-4">
        {/* 習得状況サマリ */}
        <section>
          <h2 className="mb-2 font-cute text-sm text-pink-100/90">習得状況</h2>
          <ul className="grid grid-cols-3 gap-2.5">
            {summary.map((row) => (
              <li key={row.label} className="glass px-2 py-4 text-center">
                <p className="gauge-num text-2xl leading-none">{row.value}</p>
                <p
                  className="mt-1.5 font-pop text-xs"
                  style={{ color: 'var(--inkcard)' }}
                >
                  {row.label}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* 復習キュー */}
        <section>
          <h2 className="mb-2 flex items-center font-cute text-sm text-pink-100/90">
            復習キュー
            {due.length > 0 && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 font-ko text-xs text-white"
                style={{ background: 'var(--hot)' }}
              >
                {due.length}
              </span>
            )}
          </h2>
          {due.length === 0 ? (
            <p className="glass p-6 text-center font-cute text-sm">
              いま復習する項目はありません ✨
            </p>
          ) : (
            <ul className="space-y-2.5">
              {due.map((item) => (
                <li key={`${item.itemType}:${item.itemId}`}>
                  <Link
                    to={item.to}
                    aria-label={`${item.label} を復習する`}
                    className="glass flex items-center gap-3 px-3.5 py-3 transition-transform active:scale-[0.98]"
                  >
                    <span className="pill pill-lv1 text-xs">
                      {TYPE_BADGE[item.itemType]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-ko text-base">
                        {item.label}
                      </span>
                      <span
                        className="block truncate font-pop text-xs"
                        style={{ color: 'var(--inksub)' }}
                      >
                        {item.sub}
                      </span>
                    </span>
                    <span aria-hidden="true" style={{ color: 'var(--inksub)' }}>
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
