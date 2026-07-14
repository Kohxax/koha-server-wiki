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
- draw.io連携の再編集時、SVGに埋め込まれたmxfile XMLを自前でパース/デコードせず、SVGファイルの生テキストをそのまま`load`アクションの`xml`にpostMessageする方式にした。draw.ioのembed APIはSVG全体(埋め込みXML付き)を渡してもそこから図を復元できるため、これが最もシンプル。
- draw.ioの保存postMessageプロトコル自体はブラウザのpostMessageに依存しVueコンポーネントに密結合するため、`shared/utils/drawio.ts`にプロトコルのメッセージ組み立て/パース処理を純粋関数として切り出し、vitestで直接ユニットテストできるようにした(コンポーネントマウントによるE2E風テストは要らない)。
- (バグ修正) SVGサニタイズの正規表現`on\w+\s*=`が"content="のような無害な属性名の中間にマッチしてしまう不具合を発見(`\b`で単語境界を追加して修正)。draw.ioの埋め込みXML属性(`content="..."`)を含む正当なSVGが誤って拒否される実害があったため、回帰テストを追加した。
- 検索は要件通りILIKE(pg_trgmインデックス済み)のシンプルな部分一致にした。全文検索ランキング(ts_vector等)は個人用小規模Wikiの規模では過剰と判断し見送り。マッチ箇所周辺を抜粋する`buildExcerpt`はMarkdown記号を簡易的に除去する純粋関数として切り出しunitテストした。
- サイドバー手動ツリー編集UIは、ネストしたTreeNode[]を直接ドラッグ操作するのではなく「フラットな行 + インデントレベル」のアウトライン形式(`shared/utils/sidebar-outline.ts`)で実装した。ページ内アウトラインエディタの標準的な実装パターンで、追加/削除/並べ替え/インデントをシンプルな配列操作に落とし込める。並べ替え・インデントは対象ノードのサブツリーをブロック単位で一緒に動かす。
- `GET /api/sidebar`は表示モードに応じた`tree`に加えて、モードに関わらず常に永続化済みの手動ツリーを`manualTree`として返すようにした。管理画面のアウトラインエディタは常に`manualTree`から初期化することで、自動モード表示中でも手動ツリーの編集内容を失わない(「自動に切り替えても消えず、手動に戻せば復元される」という要件を満たすための必須の設計)。
- `/admin/media`・`/admin/sidebar`はAPI権限(editor+)に合わせて`require-editor`ミドルウェア、`/admin/users`のみ`require-admin`にした。PLAN.mdのルーティング表で各画面の権限レベルが異なる(users=adminのみ、sidebar=editor+)と明記されているため、/admin配下を一律adminのみにはしていない。
