# こは鯖wiki

自分のMinecraftサーバー用Wiki。閲覧は誰でも可能、編集はDiscordログイン + 管理者承認された「編集者」のみ。

> セットアップ手順、Discord/Cloudflare Tunnelの設定、Docker Composeでの起動方法は、フェーズ10(本番化)で本セクションに追記されます。

## 開発

```bash
docker compose up -d db   # DBだけコンテナで起動
pnpm install
pnpm db:migrate           # マイグレーション適用
pnpm dev                  # http://localhost:3000
```

テスト:

```bash
pnpm typecheck
pnpm test        # vitest (unit/integration)
pnpm test:e2e    # playwright (要 chromium + システムライブラリ。QUESTIONS.md参照)
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
