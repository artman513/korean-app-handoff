import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { clearAllStores } from '../lib/db';
import { loadSettings, resetUsage, saveSettings } from '../lib/storage';

// F-08 設定：ニックネーム・音声速度・効果音・データリセット・アプリ情報
export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = async () => {
    await clearAllStores();
    resetUsage();
    setConfirmReset(false);
    setResetDone(true);
  };

  return (
    <div>
      <PageHeader title="설정" subtitle="きみ好みにカスタム♡" />
      <div className="space-y-5 px-4 pb-4">
        <div className="glass p-4">
          <label className="block">
            <span className="mb-1.5 block font-cute text-sm" style={{ color: 'var(--hot)' }}>
              ニックネーム
            </span>
            <input
              type="text"
              value={settings.nickname}
              onChange={(e) =>
                setSettings(saveSettings({ nickname: e.target.value }))
              }
              aria-label="ニックネーム"
              placeholder="ニックネームを入力"
              className="field w-full px-3 py-2 text-sm"
            />
          </label>
        </div>

        <fieldset className="glass p-4">
          <legend className="px-1 font-cute text-sm" style={{ color: 'var(--hot)' }}>
            音声速度
          </legend>
          <div className="mt-1 flex gap-2">
            {(['normal', 'slow'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                aria-label={speed === 'normal' ? '標準' : 'ゆっくり'}
                onClick={() => setSettings(saveSettings({ speechSpeed: speed }))}
                className={`flex-1 py-2 text-sm ${
                  settings.speechSpeed === speed
                    ? 'btn-hot'
                    : 'btn-ghost'
                }`}
              >
                {speed === 'normal' ? '標準' : '🐢 ゆっくり'}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="glass flex items-center justify-between p-4">
          <span className="font-cute text-sm" style={{ color: 'var(--inkcard)' }}>
            効果音
          </span>
          <input
            type="checkbox"
            checked={settings.soundEffects}
            onChange={(e) =>
              setSettings(saveSettings({ soundEffects: e.target.checked }))
            }
            aria-label="効果音のオン・オフ"
            className="h-5 w-5 accent-pink-500"
          />
        </label>

        {/* データリセット */}
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          aria-label="学習データをリセット"
          className="w-full rounded-full border-2 py-2.5 text-sm font-bold"
          style={{ borderColor: 'rgba(255,120,120,.6)', color: '#ff9a9a' }}
        >
          学習データをリセット
        </button>
        {resetDone && (
          <p className="text-center font-cute text-xs text-pink-100/90">
            学習データを初期化しました
          </p>
        )}

        <p className="text-center font-cute text-xs text-pink-100/70">
          한국어 Study v0.1.0
        </p>
      </div>

      {/* 確認ダイアログ */}
      {confirmReset && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="データリセットの確認"
            className="glass w-full max-w-xs p-5 text-center"
          >
            <p className="font-ko text-base">本当にリセットしますか？</p>
            <p className="mt-2 font-pop text-xs" style={{ color: 'var(--inksub)' }}>
              進捗・SRS・キャッシュがすべて削除されます。この操作は元に戻せません。
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="btn-ghost flex-1 py-2 text-sm"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => void handleReset()}
                className="flex-1 rounded-full py-2 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(180deg,#ff7a7a,#d40000)' }}
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
