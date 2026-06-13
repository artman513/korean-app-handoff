import { useState } from 'react';
import { Link } from 'react-router-dom';
import Onboarding from '../components/Onboarding';
import { loadSettings } from '../lib/storage';

// settings キーが未保存なら初回起動とみなす（F-07 オンボーディング）
const isFirstLaunch = () => localStorage.getItem('settings') === null;

// F-07 ホーム：ロゴ＋宝石アイコンの5機能メニュータイル
const TILES = [
  { to: '/hangul', ko: '한글', ja: 'ハングル学習', icon: 'iDia' },
  { to: '/phrases', ko: '프레이즈', ja: 'フレーズ音読', icon: 'iBow' },
  { to: '/phrases?mode=pronun', ko: '발음 체크', ja: '発音チェック', icon: 'iHead' },
  { to: '/puzzle', ko: '문장 퍼즐', ja: 'パズル学習', icon: 'iPuz' },
];

function GemIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 60"
      className={className}
      style={{
        filter:
          'drop-shadow(0 4px 6px rgba(120,0,60,.55)) drop-shadow(0 0 8px rgba(255,255,255,.35))',
      }}
      aria-hidden="true"
    >
      <use href={`#${id}`} />
    </svg>
  );
}

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(isFirstLaunch);
  const nickname = loadSettings().nickname;

  return (
    <div className="px-4 pt-6 pb-4">
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}

      <div className="pb-3 pt-2">
        <p className="kicker">♡ 즐겁게 배우자! ♡</p>
        <h1 className="app-logo">한국어</h1>
        <p className="app-logo-sub">Study ♡</p>
        {nickname && (
          <p className="mt-1 text-center font-cute text-sm text-pink-200/90">
            {nickname}さん、ようこそ♡
          </p>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <li key={tile.to}>
            <Link
              to={tile.to}
              aria-label={tile.ja}
              className="glass flex flex-col items-center gap-2 px-2 py-4 transition-transform active:scale-95"
            >
              <GemIcon id={tile.icon} className="h-11 w-11" />
              <span className="font-ko text-base">{tile.ko}</span>
              <span className="font-pop text-xs" style={{ color: 'var(--inksub)' }}>
                {tile.ja}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* ロールプレイは横長タイル */}
      <Link
        to="/roleplay"
        aria-label="ロールプレイ"
        className="glass mt-3 flex items-center gap-3 px-4 py-3 transition-transform active:scale-95"
      >
        <GemIcon id="iCrown" className="h-10 w-10 shrink-0" />
        <span className="flex-1">
          <span className="block font-ko text-base">롤플레이</span>
          <span className="block font-pop text-xs" style={{ color: 'var(--inksub)' }}>
            영통팬싸・カフェ・タクシーで会話練習
          </span>
        </span>
        <span aria-hidden="true" className="text-lg" style={{ color: 'var(--inksub)' }}>
          ›
        </span>
      </Link>
    </div>
  );
}
