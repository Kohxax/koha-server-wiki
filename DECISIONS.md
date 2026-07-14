# DECISIONS.md

実装中に行った設計判断を1行ずつ記録する。

- Nuxt 4のtype-checking(app用/server用でtsconfigプロジェクトが分かれる)を跨いで使う型拡張(`declare module '#auth-utils'`)は `server/types` ではなく `shared/types/auth.d.ts` に置く。Nuxt 4の`shared/`はapp/server両方のtsconfigから参照されるため。
- `requireEditor`/`requireAdmin`の権限判定ロジックは`canEdit`/`canAdmin`という純粋関数(`server/utils/permissions.ts`)に切り出した。Nitroのauto-import(`requireUserSession`等)に依存する関数はvitestから直接ユニットテストしづらいため、テスト可能なロジックを分離する方針とした。
- 同様に開発用バイパスの有効判定も`isDevAuthBypassEnabled()`として切り出しユニットテスト対象にした。実際の「バイパスなしで404」は開発サーバーを一時的に環境変数なしで起動して手動検証した(自動テストは`@nuxt/test-utils`のフルサーバー起動が必要で、フェーズごとに多用するには重いため見送り)。
- Docker daemonへのアクセス権限がない状態(dockerグループ未所属)だったため、ユーザーにグループ追加を依頼。グループ追加はセッションの再ログインが必要で、このシェルセッションには反映されないため、`sg docker -c "<command>"`で都度グループ権限を適用してdockerコマンドを実行する運用とした。
