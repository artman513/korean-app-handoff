// localStorage 初期化ユーティリティ（requirements.md §6）
// settings: ニックネーム・音声速度・効果音 / usage: API利用回数（日次）

export type SpeechSpeed = 'normal' | 'slow';

export interface Settings {
  nickname: string;
  speechSpeed: SpeechSpeed;
  soundEffects: boolean;
}

export interface ChatUsage {
  date: string; // YYYY-MM-DD（ローカル日付）
  count: number;
}

export interface Usage {
  chat: ChatUsage;
}

const SETTINGS_KEY = 'settings';
const USAGE_KEY = 'usage';

export const DEFAULT_SETTINGS: Settings = {
  nickname: '',
  speechSpeed: 'normal',
  soundEffects: true,
};

function todayLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function readJSON<T>(key: string): Partial<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

// ---- settings ----

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...readJSON<Settings>(SETTINGS_KEY) };
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

// ---- usage（日付が変わったらリセット） ----

export function loadUsage(): Usage {
  const stored = readJSON<Usage>(USAGE_KEY);
  const chat = stored?.chat;
  if (!chat || chat.date !== todayLocal()) {
    return { chat: { date: todayLocal(), count: 0 } };
  }
  return { chat };
}

export function incrementChatCount(): ChatUsage {
  const usage = loadUsage();
  usage.chat.count += 1;
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return usage.chat;
}

export function resetUsage(): void {
  localStorage.removeItem(USAGE_KEY);
}
