// F-09 ロールプレイのシチュエーション定義（requirements.md §4 F-09）

export type RoleplayLevel = 'beginner' | 'intermediate';

export interface RoleplaySituation {
  id: string;
  title: string;
  titleJa: string;
  description: string;
  level: RoleplayLevel;
  emoji: string;
  /** 영통팬싸のみ：セッションのタイマー秒数 */
  timerSec?: number;
}

export const ROLEPLAY_LEVEL_LABEL: Record<RoleplayLevel, string> = {
  beginner: '初級',
  intermediate: '中級',
};

export const roleplaySituations: RoleplaySituation[] = [
  {
    id: 'fansign_call',
    title: '영통팬싸',
    titleJa: 'ビデオ通話ファンサイン',
    description: '推しとの1分間ビデオ通話。時間内に伝えたいことを伝えよう',
    level: 'intermediate',
    emoji: '📹',
    timerSec: 60,
  },
  {
    id: 'goods_shop',
    title: '콘서트 굿즈 구매',
    titleJa: 'コンサートグッズ購入',
    description: '会場のグッズ売り場で欲しいものを買おう',
    level: 'beginner',
    emoji: '🛍️',
  },
  {
    id: 'photocard_trade',
    title: '포카 교환',
    titleJa: 'フォトカード交換',
    description: '現場で出会ったファンとトレカを交換しよう',
    level: 'intermediate',
    emoji: '🃏',
  },
  {
    id: 'cafe_order',
    title: '카페에서 주문',
    titleJa: 'カフェで注文',
    description: '韓国のカフェでドリンクを注文しよう',
    level: 'beginner',
    emoji: '☕',
  },
  {
    id: 'taxi',
    title: '택시',
    titleJa: 'タクシー',
    description: '行き先を伝えて目的地まで移動しよう',
    level: 'beginner',
    emoji: '🚕',
  },
  {
    id: 'friend_chat',
    title: '친구와 수다',
    titleJa: '友達と雑談',
    description: '韓国人の友達と推しの近況についておしゃべりしよう',
    level: 'intermediate',
    emoji: '💬',
  },
];
