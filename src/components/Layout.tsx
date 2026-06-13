import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import SceneDecor from './SceneDecor';

// モバイルファースト・PCは中央寄せ max-width 480px（requirements.md §8）
// 画面は design-system-v2 のダークなマゼンタ「スクリーン」として表現する
export default function Layout() {
  return (
    <div className="relative mx-auto min-h-dvh max-w-[480px] overflow-hidden scene shadow-[0_36px_80px_-24px_#000]">
      <SceneDecor />
      <main className="relative z-[2] pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
