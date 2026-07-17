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
pnpm test:unit   # unit tests
pnpm test:integration # TEST_DATABASE_URL（末尾が _test のDBのみ）を使用
pnpm test:e2e    # playwright (chromium headless)
```

## Markdownのサーバーステータス

ページ本文に次の MDC ブロックを記述すると、Minecraft Java Edition サーバーのアイコン・稼働状態・オンライン人数を表示できます。

```md
::server-status{address="play.example.net:25565"}
::
```

ポートを省略した場合は Minecraft Java Edition の SRV レコード（`_minecraft._tcp`）を使用し、存在しない場合は `25565` に接続します。安全のため、接続先は公開 IPv4 アドレスに解決されるホストに限られ、ローカルネットワーク・プライベート IP アドレス・IPv6 アドレスは利用できません。