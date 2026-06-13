# Vercel デプロイ手順

「한국어 Study」を Vercel（無料 Hobby プラン）へデプロイする手順。
フロント（Vite）と Serverless Function（`api/groq.ts`）が 1 プロジェクトで動く構成。

## 前提

- Groq コンソール（https://console.groq.com）で発行した **API キー**
- Vercel アカウント（GitHub アカウントでサインアップ可）
- このリポジトリ（`korean-app-handoff`）

## 設定ファイル（リポジトリに同梱済み）

| ファイル | 役割 |
|---|---|
| `vercel.json` | フレームワーク=Vite / SPA フォールバック（`/api` 以外は `index.html`）/ 関数の最大実行時間 30s |
| `package.json` の `engines.node` | 関数の Node ランタイムを 22.x に固定 |
| `.env.example` | 必要な環境変数の雛形（`GROQ_API_KEY`） |

`vercel.json` の要点：

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": { "api/groq.ts": { "maxDuration": 30 } },
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

- `rewrites` で React Router のディープリンク（例：`/hangul/giyeok`）を `index.html` に返す。
  `/api/*` は除外しているので Serverless Function は素通しされる。
- 静的アセット（`/assets/*`）はファイルが優先されるため rewrites の影響を受けない。

---

## 方法A：Vercel CLI でデプロイ（GitHub 不要・最短）

```bash
# 1. CLI 導入とログイン
npm i -g vercel
vercel login

# 2. プロジェクトをリンク（初回は対話で新規プロジェクト作成）
cd korean-app-handoff
vercel link

# 3. 環境変数 GROQ_API_KEY を 3 環境に登録
#    プロンプトでキー値を貼り付ける
vercel env add GROQ_API_KEY production
vercel env add GROQ_API_KEY preview
vercel env add GROQ_API_KEY development

# 4. ローカルで AI 機能込みの動作確認（/api が動く）
vercel dev
#    → http://localhost:3000 で発音認識・チャット・例文・フィードバックを確認

# 5. 本番デプロイ
vercel --prod
```

> `vite dev`（`npm run dev`）単体では `/api` が動かないため、
> AI 機能のローカル確認には必ず `vercel dev` を使うこと。
> 静的機能（ハングル・フレーズ・パズル・お手本再生）は `npm run dev` だけで確認できる。

---

## 方法B：GitHub 連携（ダッシュボード）

```bash
# 1. GitHub にリポジトリを用意して push
git add -A
git commit -m "한국어 Study 実装"
git branch -M main
git remote add origin <あなたのGitHubリポジトリURL>
git push -u origin main
```

2. Vercel ダッシュボード → **Add New… → Project** → 該当リポジトリを **Import**
3. 設定（多くは自動検出）
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables** に追加（Production / Preview / Development すべてに）
   - Key: `GROQ_API_KEY` / Value: 発行したキー
5. **Deploy** を押す。以降は `main` への push で自動デプロイ。

---

## デプロイ後の確認チェックリスト

- [ ] トップが表示される（ロゴ・タイル・ボトムナビ）
- [ ] ディープリンク直アクセスが 404 にならない（例：`/hangul/giyeok` を直接開く）
- [ ] ハングル/フレーズのお手本再生（`SpeechSynthesis`）が鳴る
- [ ] 発音チェックで録音 → スコアが出る（`/api/groq` task=transcribe）
- [ ] ロールプレイで AI が最初の発話を返す（task=chat）
- [ ] フレーズ詳細の「例文を見る」（task=example）／不合格時のフィードバック（task=feedback）

`/api/groq` が 500 を返す場合は、環境変数 `GROQ_API_KEY` が
対象環境（Production/Preview）に設定されているかをまず確認する。

---

## 運用上の注意（コスト・制限）

- **無料枠**：Groq は 30 RPM / 6,000 TPM / 1,000 RPD（組織単位）。
- **濫用防止**：`api/groq.ts` に簡易レートリミット（同一 IP 60 秒に 10 回）を実装済み。
- **チャット回数**：1 日 20 ターン上限（localStorage `usage` で日次管理）。
- **キャッシュ**：例文・発音フィードバックは IndexedDB に永続キャッシュし、API 呼び出しを節約。
- API キーはフロントに露出しない（必ず `/api/groq` 経由）。`.env` はコミットしない（`.gitignore` 済み）。
