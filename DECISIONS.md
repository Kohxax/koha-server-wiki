# DECISIONS.md

実装中に行った設計判断を1行ずつ記録する。

- Nuxt 4のtype-checking(app用/server用でtsconfigプロジェクトが分かれる)を跨いで使う型拡張(`declare module '#auth-utils'`)は `server/types` ではなく `shared/types/auth.d.ts` に置く。Nuxt 4の`shared/`はapp/server両方のtsconfigから参照されるため。
- `requireEditor`/`requireAdmin`の権限判定ロジックは`canEdit`/`canAdmin`という純粋関数(`server/utils/permissions.ts`)に切り出した。Nitroのauto-import(`requireUserSession`等)に依存する関数はvitestから直接ユニットテストしづらいため、テスト可能なロジックを分離する方針とした。
- 同様に開発用バイパスの有効判定も`isDevAuthBypassEnabled()`として切り出しユニットテスト対象にした。実際の「バイパスなしで404」は開発サーバーを一時的に環境変数なしで起動して手動検証した(自動テストは`@nuxt/test-utils`のフルサーバー起動が必要で、フェーズごとに多用するには重いため見送り)。
- Docker daemonへのアクセス権限がない状態(dockerグループ未所属)だったため、ユーザーにグループ追加を依頼。グループ追加はセッションの再ログインが必要で、このシェルセッションには反映されないため、`sg docker -c "<command>"`で都度グループ権限を適用してdockerコマンドを実行する運用とした。
- ページ編集/履歴ページは、PLAN.mdが許容する代替方式に倣い `/wiki/[...path]/edit` ではなく `/edit/[...path]`・`/history/[...path]` の形にした(catch-all配下に固定セグメントを続けるルーティングは避ける)。同じ理由でAPI側も `GET /api/pages/[...path]/revisions` ではなく独立した `GET /api/page-revisions/[...path]` にした。
- Nuxtの型付き`$fetch`/`useFetch`は、`/api/pages/${path}`のようなテンプレートリテラルURLに対して、同じ`/api/pages/`配下にある無関係のリテラルルート(`tree.get.ts`)の返り値型を誤って推論することがあった。回避策として`useFetch<Page>(...)` / `$fetch<Page>(...)`のように明示的にジェネリクスを指定している。
- サイドバー自動ツリー生成(`buildPageTree`)は、パスの各セグメントに対応する実ページが存在すればそのタイトルをラベルに、存在しない中間フォルダはセグメント名をそのままラベルにする方式にした。
- Playwright (headless Chromium) もdockerと同様、システムライブラリのインストールに`sudo`が必要で自動化できなかった(QUESTIONS.md参照)。E2Eのコード・設定(`playwright.config.ts`、`e2e/`、dev-bypassでrole別`storageState`を作る`global.setup.ts`)は完成させ、実行検証は依存解消後に行う方針とした。それまではdevサーバー起動+curlによる手動検証でロジックの妥当性を確認している。
- モバイル用の編集/プレビュー切替タブは`md:hidden`のボタンで表示/非表示を制御し、デスクトップでは常に2ペイン(textarea+プレビュー)を並べて表示する。Playwrightのデフォルト(デスクトップ)ビューポートではこのタブボタンは操作対象にしていない。
- アップロード先ディレクトリは環境変数`UPLOAD_DIR`(省略時`./uploads`)で指定する方式にした。本番はdocker composeのボリューム`/data/uploads`をこの変数で指定する想定(phase10で設定)。
- `media.kind`は基本的に`POST /api/media`ではアップロードされたファイルの種別に関わらず既定で`image`。`diagram`(draw.io由来のSVG)はフォームフィールド`kind=diagram`を明示的に送った場合のみ設定される。draw.io統合(phase7)はこの`kind`フィールドを使って区別する想定。
- SVGの安全性チェックは`<script>`・`on*`イベント属性・`javascript:` href・`<foreignObject>`を正規表現で拒否する簡易サニタイズに留めた(draw.io出力を通す最小限の対策として要件通り)。
