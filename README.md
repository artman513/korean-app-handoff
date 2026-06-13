# 한국어 Study — 実装ハンドオフ

K-POP・韓国アイドルファン向け韓国語学習Webアプリの実装パッケージ。
**このREADMEを読んだら、まず `docs/requirements.md` を全文読んでから実装を開始すること。**

## パッケージ構成

```
korean-app-handoff/
├── README.md                      ← このファイル
├── docs/
│   └── requirements.md            ← 機能要件定義書 v1.3（実装の正）
├── data/                          ← 静的データ（src/data/ にそのまま配置）
│   ├── hangul.json                ← ハングル24字（子音14・母音10）
│   ├── phrases.json               ← 推し活フレーズ50個（7カテゴリ）
│   ├── patterns.json              ← 文型8種（パズル用）
│   └── verbs.json                 ← 動詞15種×8活用形（パズルの正解テーブル）
└── design/
    ├── functional-mockup.html     ← 画面構成・UIレイアウトの参考（8画面）
    └── design-system-v2.html      ← 最終デザインの方向性（CSS/SVGのみで実装）
```

## 実装ルール

1. **requirements.md が唯一の正**。本READMEと食い違ったら requirements.md に従う
2. **実装は requirements.md §10 のフェーズ順**に進める。各フェーズの完了条件を満たしてから次へ
3. **データは data/ のJSONをそのまま使う**。スキーマ変更・項目追加をしない（活用形は事前計算済み。活用ルールエンジンを実装しないこと）
4. **画面レイアウトは functional-mockup.html に従う**。見た目（色・質感）は design-system-v2.html に従う。デザイン適用はPhase 9（最後）でよい。Phase 1〜8は素のTailwindで機能優先
5. **Groq APIキーは環境変数 `GROQ_API_KEY`**。Vercel Serverless Function（`/api/groq.ts`）経由のみで呼び出し、フロントに露出させない

## 技術スタック（requirements.md §9 に準拠）

- Vite + React + TypeScript + Tailwind CSS + React Router
- IndexedDB（idb）+ localStorage
- Web Speech API SpeechSynthesis（お手本再生）
- MediaRecorder + Groq Whisper（発音認識）
- Groq API：Llama 3.1 8B（軽量タスク）/ Llama 3.3 70B（チャット）
- dnd-kit（パズル）
- デプロイ先：Vercel

## 環境変数

```
GROQ_API_KEY=（Groqコンソールで発行）
```

## 最初にやること（Phase 1）

1. Vite + React + TS プロジェクト作成、Tailwind・React Router・idb・dnd-kit 導入
2. `data/` の4ファイルを `src/data/` に配置し、型定義（TypeScript interface）を起こす
3. requirements.md §5 の画面一覧どおりにルーティングと空ページを作成
4. 共通ボトムナビ（홈 / 진행 / 설정）を実装
5. IndexedDB（progress / cache ストア）と localStorage（settings / usage）の初期化ユーティリティを作成

完了条件：全画面に遷移できる骨組みが動くこと。

## 注意（ハマりどころ）

- **Whisperは無音でも幻聴テキストを返すことがある**。requirements.md F-03 のエラー処理（空・短すぎ・韓国語以外）を必ず実装
- **チャットのレスポンスは JSON 固定**（F-09のスキーマ参照）。`response_format: { type: "json_object" }` を指定し、パース失敗時は1回リトライ
- **SpeechSynthesisのko-KRボイスは非同期ロード**。`voiceschanged` イベント後に取得すること
- **回数制限**（チャット20ターン/日）は localStorage `usage` で日付管理。実装を忘れると無料枠が枯れる
