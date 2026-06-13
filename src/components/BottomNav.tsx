import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: '홈', aria: 'ホーム', icon: 'nHome' },
  { to: '/progress', label: '진행', aria: '進捗', icon: 'nChart' },
  { to: '/settings', label: '설정', aria: '設定', icon: 'nGear' },
] as const;

// 共通ボトムナビ（F-07）。全画面に表示。アイコンは SceneDecor の SVG シンボルを参照
export default function BottomNav() {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="nav-bar fixed bottom-0 left-1/2 z-10 w-full max-w-[480px] -translate-x-1/2"
    >
      <ul className="flex">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              aria-label={tab.aria}
              className="block py-2.5 pb-4"
            >
              {({ isActive }) => (
                <span
                  className={`nav-item flex flex-col items-center gap-1 text-xs ${
                    isActive ? 'on' : ''
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <use href={`#${tab.icon}`} />
                  </svg>
                  {tab.label}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
