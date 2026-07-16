# こは鯖wiki

自分のMinecraftサーバー用Wiki。閲覧は誰でも可能、編集はDiscordログイン + 管理者承認された「編集者」のみ。

- スタック: Nuxt 4 / Docker Compose / PostgreSQL
- 認証: Discord OAuth (編集者は管理画面での承認制)
- コンテンツ: Markdown、画像アップロード(WebP自動変換)、draw.io図表、検索、自由なパス階層

## セットアップ手順

### 1. リポジトリ準備

```bash
pnpm install
cp .env.example .env
```

`.env` を編集し、少なくとも `NUXT_SESSION_PASSWORD`(32文字以上のランダム文字列)を設定してください。

```bash
# ランダムな値の生成例
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Discord Application の作成

1. [Discord Developer Portal](https://discord.com/developers/applications) で New Application を作成。
2. 「OAuth2」→「General」で **Client ID** と **Client Secret** を控える。
3. 「OAuth2」→「Redirects」に以下を登録:
   - `http://localhost:3000/auth/discord` (開発用)
   - `https://<公開ドメイン>/auth/discord` (本番用)
4. `.env` に反映:
   ```
   NUXT_OAUTH_DISCORD_CLIENT_ID=<Client ID>
   NUXT_OAUTH_DISCORD_CLIENT_SECRET=<Client Secret>
   ```
5. 自分自身を管理者として起動したい場合、自分のDiscordユーザーID(開発者モードでコピー)を `NUXT_ADMIN_DISCORD_IDS` にカンマ区切りで設定。このIDでログインした際に自動的に `admin` ロールが付与される。

### 3. Cloudflare Tunnel の設定 (本番公開する場合のみ)

1. [Cloudflare Zero Trust ダッシュボード](https://one.dash.cloudflare.com/) → Networks → Tunnels で新規Tunnelを作成。
2. 表示されるトークンを `.env` の `TUNNEL_TOKEN` に設定。
3. Tunnelの Public Hostname 設定で、公開したいホスト名 → `http://app:3000` (docker composeネットワーク内のサービス名とポート) をルーティング先として追加。

### 4. 開発時の起動

DBだけコンテナで起動し、アプリはホスト上で直接動かす(ホットリロードのため):

```bash
docker compose up -d db
pnpm db:migrate
pnpm dev            # http://localhost:3000
```

### 5. 本番起動 (Docker Compose)

```bash
docker compose up --build -d app db
# Cloudflare Tunnelも含めて公開する場合
docker compose --profile prod up --build -d
```

`app` コンテナは起動時に自動的にDBマイグレーションを実行してからサーバーを起動します(`docker-entrypoint.sh`)。

## 開発用認証バイパス

E2Eテストや動作確認のため、`.env` に `NUXT_DEV_AUTH_BYPASS=1` を設定すると `POST /api/dev/login { role: 'admin'|'editor'|'viewer' }` で偽のDiscordユーザーとしてログインできます。

**本番では絶対に設定しないでください。** `docker-compose.yml` の `app` サービスはこの変数を一切参照しないため、ローカルの `.env` に残っていてもコンテナ内には伝播しません(意図的な設計)。

## テスト

```bash
pnpm typecheck
pnpm test        # vitest (unit / integration。TEST_DATABASE_URLのPostgresに接続)
pnpm test:e2e    # playwright (chromium headless。要システムライブラリ、QUESTIONS.md参照)
```

## draw.io図表の手動確認手順

draw.io連携は外部iframe(`https://embed.diagrams.net`)とのpostMessage通信のため、自動E2Eは「ダイアログが開きiframeが正しいURLでロードされる」ところまでに留めています(`e2e/drawio.spec.ts`)。postMessageのプロトコル処理そのものは `shared/utils/drawio.test.ts` でユニットテスト済みです。実際の保存フローは以下の手順で手動確認してください。

1. 編集者としてログイン(開発時は `/login` の開発用ログインボタン)。
2. 任意のページを編集し、エディタツールバーの「📐 図表」ボタンをクリック。
3. draw.ioのエディタが全画面ダイアログで開くことを確認。
4. 適当な図形を配置し、draw.io右上の「保存」を押す。
5. ダイアログが自動的に閉じ、エディタのカーソル位置に `![図](/uploads/xxxx.svg)` が挿入されることを確認。
6. 保存したページを開き、図が画像として表示されることを確認。
7. メディアライブラリ(エディタの「🖼️ 画像」ボタン、または `/admin/media`)で、その図(SVG)にカーソルを合わせ「draw.ioで編集」ボタンが出ることを確認。
8. クリックしてdraw.ioが直前に描いた図の状態で開くことを確認(埋め込みXMLの再読み込み)。
9. 図を修正して保存し、ファイル名が変わらず(参照しているページ側の画像も自動的に更新されて)表示されることを確認。

## 環境変数一覧

`.env.example` を参照してください。

## ディレクトリ構成の要点

- `server/database/` — drizzleスキーマ・マイグレーション・DB接続util
- `server/api/`, `server/routes/` — Nitro API / サーバールート
- `server/utils/` — サーバー側の共通ロジック(権限チェック・パス正規化・ツリー生成・アップロード検証など)。Nitroにより自動importされる
- `shared/utils/` — サーバー/クライアント両方から使う純粋関数(draw.ioプロトコル、サイドバーのアウトライン変換など)
- `app/` — Nuxtのページ・レイアウト・コンポーネント
- `e2e/` — Playwrightテスト
