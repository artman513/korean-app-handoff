// 画面背景の装飾（豹紋・グリッター・星のきらめき）と
// アプリ全体で使う SVG 宝石シンボル定義（design-system-v2.html より）。
// Layout に一度だけ配置し、各所から <use href="#i..."/> で参照する。

interface Spark {
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
}

const SPARKS: Spark[] = [
  { top: '84px', left: '22px', size: 16, delay: '0.3s' },
  { top: '160px', right: '26px', size: 12, delay: '1.4s' },
  { top: '320px', left: '18px', size: 14, delay: '0.6s' },
  { top: '430px', right: '14px', size: 10, delay: '0.9s' },
];

export default function SceneDecor() {
  return (
    <>
      {/* SVG 宝石・アイコンライブラリ（不可視・参照用） */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="gFacet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset=".45" stopColor="#FF8AC8" />
            <stop offset="1" stopColor="#C4006B" />
          </linearGradient>
          <linearGradient id="gFacet2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE3F2" />
            <stop offset=".5" stopColor="#FF5CB0" />
            <stop offset="1" stopColor="#A8005C" />
          </linearGradient>
          <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFEFAE" />
            <stop offset=".5" stopColor="#F6D77A" />
            <stop offset="1" stopColor="#C39127" />
          </linearGradient>
          <radialGradient id="gOrb" cx="33%" cy="27%" r="72%">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".5" stopColor="#FF8AC8" />
            <stop offset="1" stopColor="#B80062" />
          </radialGradient>

          <symbol id="iHeart" viewBox="0 0 64 60">
            <path
              d="M32,55 C16,46 4,35 4,21 C4,11 11,5 19,5 C24,5 29,8 32,14 C35,8 40,5 45,5 C53,5 60,11 60,21 C60,35 48,46 32,55Z"
              fill="url(#gFacet)"
              stroke="#fff"
              strokeWidth="2"
            />
            <path d="M32,14 L18,24 L32,40 L46,24Z" fill="#fff" opacity=".35" />
            <ellipse
              cx="21"
              cy="15"
              rx="6"
              ry="3"
              fill="#fff"
              opacity=".9"
              transform="rotate(-28,21,15)"
            />
          </symbol>

          <symbol id="iDia" viewBox="0 0 64 60">
            <polygon
              points="32,6 56,24 32,56 8,24"
              fill="url(#gFacet2)"
              stroke="#fff"
              strokeWidth="2"
            />
            <polygon points="32,6 56,24 44,24 32,18" fill="#fff" opacity=".45" />
            <polygon points="32,6 8,24 20,24 32,18" fill="#fff" opacity=".25" />
            <line
              x1="20"
              y1="24"
              x2="44"
              y2="24"
              stroke="#fff"
              strokeWidth="1.4"
              opacity=".7"
            />
            <circle cx="24" cy="13" r="2" fill="#fff" opacity=".95" />
          </symbol>

          <symbol id="iBow" viewBox="0 0 64 60">
            <path
              d="M30,30 C14,14 2,24 8,34 C12,42 24,38 30,32Z"
              fill="url(#gFacet)"
              stroke="#fff"
              strokeWidth="1.8"
            />
            <path
              d="M34,30 C50,14 62,24 56,34 C52,42 40,38 34,32Z"
              fill="url(#gFacet)"
              stroke="#fff"
              strokeWidth="1.8"
            />
            <path
              d="M27,35 L22,52 L30,48Z"
              fill="url(#gFacet2)"
              stroke="#fff"
              strokeWidth="1.5"
            />
            <path
              d="M37,35 L42,52 L34,48Z"
              fill="url(#gFacet2)"
              stroke="#fff"
              strokeWidth="1.5"
            />
            <circle
              cx="32"
              cy="31"
              r="7"
              fill="url(#gOrb)"
              stroke="#fff"
              strokeWidth="1.8"
            />
          </symbol>

          <symbol id="iHead" viewBox="0 0 64 60">
            <path
              d="M12,34 a20,20 0 0 1 40,0"
              fill="none"
              stroke="url(#gGold)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M14,32 a4,5 0 0 1 8,0 q0,5 -4,7 q-4,-2 -4,-7Z"
              fill="url(#gFacet)"
              stroke="#fff"
              strokeWidth="1.6"
              transform="translate(0,4)"
            />
            <path
              d="M42,32 a4,5 0 0 1 8,0 q0,5 -4,7 q-4,-2 -4,-7Z"
              fill="url(#gFacet)"
              stroke="#fff"
              strokeWidth="1.6"
              transform="translate(0,4)"
            />
            <path
              d="M32,52 C24,47 19,42 19,35 C19,30 22,27 26,27 C28.5,27 30.8,28.4 32,31 C33.2,28.4 35.5,27 38,27 C42,27 45,30 45,35 C45,42 40,47 32,52Z"
              fill="url(#gOrb)"
              stroke="#fff"
              strokeWidth="2"
            />
          </symbol>

          <symbol id="iPuz" viewBox="0 0 64 60">
            <path
              d="M8,10 h48 a4,4 0 0 1 4,4 v26 a4,4 0 0 1 -4,4 h-26 l-10,10 v-10 h-12 a4,4 0 0 1 -4,-4 v-26 a4,4 0 0 1 4,-4Z"
              fill="url(#gFacet)"
              stroke="#fff"
              strokeWidth="2"
              transform="translate(-2,0)"
            />
            <path
              d="M26,18 h5 a4,4 0 0 1 8,0 h5 v5 a4,4 0 0 1 0,8 v5 h-18 v-5 a4,4 0 0 1 0,-8Z"
              fill="#fff"
              opacity=".9"
              transform="translate(-2,0)"
            />
          </symbol>

          <symbol id="iCrown" viewBox="0 0 64 60">
            <path
              d="M8,44 L12,20 L24,32 L32,12 L40,32 L52,20 L56,44Z"
              fill="url(#gGold)"
              stroke="#fff"
              strokeWidth="1.8"
            />
            <rect
              x="8"
              y="43"
              width="48"
              height="9"
              rx="3.5"
              fill="url(#gGold)"
              stroke="#fff"
              strokeWidth="1.5"
            />
            <circle cx="32" cy="10" r="3.6" fill="url(#gOrb)" stroke="#fff" />
            <circle cx="12" cy="18" r="3.2" fill="url(#gOrb)" stroke="#fff" />
            <circle cx="52" cy="18" r="3.2" fill="url(#gOrb)" stroke="#fff" />
          </symbol>

          <symbol id="iStar" viewBox="-10 -10 20 20">
            <path d="M0,-9 L2,-2 L9,0 L2,2 L0,9 L-2,2 L-9,0 L-2,-2Z" fill="#fff" />
          </symbol>

          <symbol id="nHome" viewBox="0 0 24 24">
            <path d="M4,11 L12,4 L20,11 V20 H14 V14 H10 V20 H4Z" />
          </symbol>
          <symbol id="nChart" viewBox="0 0 24 24">
            <path d="M5,20 V12 M12,20 V6 M19,20 V10" />
          </symbol>
          <symbol id="nGear" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12,3 v3 M12,18 v3 M3,12 h3 M18,12 h3 M5.6,5.6 l2.1,2.1 M16.3,16.3 l2.1,2.1 M18.4,5.6 l-2.1,2.1 M7.7,16.3 l-2.1,2.1" />
          </symbol>
          <symbol id="nMic" viewBox="0 0 24 24">
            <rect x="9" y="3" width="6" height="11" rx="3" fill="#fff" stroke="none" />
            <path d="M5,11 a7,7 0 0 0 14,0 M12,18 v3" fill="none" />
          </symbol>
        </defs>
      </svg>

      {/* 装飾レイヤー */}
      <div className="leo" />
      <div className="glit" />
      <div className="glit2" />
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="spark"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            width: `${s.size}px`,
            animationDelay: s.delay,
          }}
        >
          <svg viewBox="-10 -10 20 20">
            <use href="#iStar" />
          </svg>
        </span>
      ))}
    </>
  );
}
