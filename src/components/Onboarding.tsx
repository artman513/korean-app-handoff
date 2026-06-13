import { useState } from 'react';
import { saveSettings } from '../lib/storage';

interface Props {
  onDone: () => void;
}

// F-07 初回起動時のオンボーディング：ニックネーム入力（スキップ可）
export default function Onboarding({ onDone }: Props) {
  const [nickname, setNickname] = useState('');

  const finish = (name: string) => {
    saveSettings({ nickname: name });
    onDone();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ようこそ"
        className="glass w-full max-w-xs p-6 text-center"
      >
        <p className="text-3xl">🙌</p>
        <h2 className="mt-2 font-ko text-lg">한국어 Study へようこそ！</h2>
        <p className="mt-1 font-pop text-xs" style={{ color: 'var(--inksub)' }}>
          ニックネームを教えてね（あとで変更できます）
        </p>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          aria-label="ニックネーム"
          placeholder="ニックネーム"
          className="field mt-4 w-full px-3 py-2 text-center text-sm"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => finish('')}
            className="btn-ghost flex-1 py-2 text-sm"
          >
            スキップ
          </button>
          <button
            type="button"
            onClick={() => finish(nickname.trim())}
            className="btn-hot flex-1 py-2 text-sm"
          >
            はじめる
          </button>
        </div>
      </div>
    </div>
  );
}
