# 管理画面とデモのUI比較（2026-10-20）

本物の基準は変更前の`app/question/page.tsx`（f77050e）。stagingの実管理者セッションが利用できなかったため、認証を迂回せず、同じ通常ルートとSupabase SDKをループバックの架空Auth/Data APIで操作して比較した。以下の通常画面画像はすべて**通常UI＋モック**であり、実staging DB試験ではない。旧デモ画像は履歴として保持する。

## 差分と改善

| 項目 | 旧デモとの差 | 現在の共通実装 |
| --- | --- | --- |
| 画面構造 | 独立した簡易フォームとテキスト一覧 | 本物の2列レイアウト、カード、カテゴリ色、アイコン、スマホ1列をQuestionManagerへ抽出 |
| 入力 | 本物と異なる入力欄・送信表示 | 同じ5項目、input/textarea/select、検証、入力保持、作成/更新通知 |
| 編集 | 編集中の表示や取消導線が異なる | 同じamber表示、選択カード枠、取消ボタン、変更なし通知 |
| 処理中 | 別々の制御 | 共通の操作lock、フォーム/一覧無効化、AbortSignal、ダブルクリック抑制 |
| 削除 | カード内の簡易確認 | 共通AlertDialog、取消・確定、関連進捗の事前確認、追加進捗の再確認、エラー時の削除禁止 |
| メニュー | デモ独自のナビ | 共通SiteHeader。学習へ戻る導線はデモ内へ向ける |
| 安全性 | メモリCRUD | デモはDemoQuestionRepositoryのみ。通常は既存SupabaseQuestionRepository/CRUD/RPC、AuthガードとRLSを維持 |

本物の機能を隠すためのdemo条件分岐はない。demo条件は削除確認の「サンプルはリセットで戻せる」という補足のみ。認証・権限変更・他ユーザーとの同時更新・実DBの通信/障害は再現しないとデモ上へ明記する。ログイン/アカウント欄の代わりに小さなデモ表示、制限説明とリセットを置くため、画面全体の高さは一致しない。

## 比較画像

同じ架空3問で表示。通常/デモの管理部分を目視で比較した。

| 状態 | 通常UI＋モック | デモ |
| --- | --- | --- |
| PC幅1280px（全体画像） | [通常](./screenshots/admin-parity-20261020/normal-mock-pc.jpg) | [デモ](./screenshots/admin-parity-20261020/demo-pc.jpg) |
| PC 編集中 | [通常](./screenshots/admin-parity-20261020/normal-mock-edit-pc.jpg) | [デモ](./screenshots/admin-parity-20261020/demo-edit-pc.jpg) |
| 390×844（全体画像） | [通常](./screenshots/admin-parity-20261020/normal-mock-mobile.jpg) | [デモ](./screenshots/admin-parity-20261020/demo-mobile.jpg) |
| スマホ幅・進捗付き削除確認 | [通常](./screenshots/admin-parity-20261020/normal-mock-delete-mobile.jpg) | [デモ](./screenshots/admin-parity-20261020/demo-delete-mobile.jpg) |

[DOM計測値](./screenshots/admin-parity-20261020/layout-metrics.json)：PCの列幅486.391/697.609px、フォーム種類・操作ボタンは一致。スマホは双方clientWidth=scrollWidth=390、セクション幅350px、5入力の文字16px/色rgb(15,23,42)で一致。ブラウザのviewport変更は反映が非同期なので、実DOM幅を確認してから計測した。これはAndroid実機のdark/autofill確認ではない。

## 検証結果

- 自動77件成功（既存70＋repository7）、lint・typecheck・ダミーWebpackビルド成功。データ処理のCRUD、進捗警告/再確認、abort、訪問ごとの隔離、実SDKのメソッド/限定RPC引数、権限拒否をデモへ逃がさない境界を確認。
- PC/390pxの両モード：追加・一覧・編集・保存通知・削除取消/確定。共通の編集表示・変更なし通知。デモで必須エラー後の入力保持、進捗付き削除/初期化、学習正解→管理削除警告への反映を確認。
- 通常UI＋モック：保存403でも入力を保持。900ms遅延中は送信/編集/削除を無効化。履歴確認失敗は削除確定を無効化。未ログイン/一般ログインは管理フォームを表示しない。
- デモの390px CRUD・進捗削除・リセットの前後で、架空Auth/Data API記録件数12→12（追加0）。デモのruntime依存にも実クライアント/通常repositoryが含まれないことを自動検査。任意の利用者による直接API要求への認可は、変更していない通常Auth/RLSが担う。
- 検証専用`npm run verify:admin-ui`を追加。接続先は127.0.0.1だけ。実Supabaseを含むビルドは起動拒否。実資格情報・DBデータを使わず、メソッド/パス/状態だけを一時記録。終了後3100/54321のLISTENなしを確認。

## 公開stagingへの反映

コードb07a65fの[CI成功](https://github.com/bonbabo108/codestep/actions/runs/39364164572)と、[Vercel Preview Ready](https://vercel.com/touya1896-7818s-projects/codestep/3KQPoc6DfR1NHA1Ks4HhRVFdsaqC)を確認。チーム/プロジェクトcodestep、同じ作業ブランチ/commit、固定ドメインへの割当を画面で照合した（ビルド17秒）。公開デモでPCの連打1件作成→390pxの編集/保存→削除→リセットを成功確認。390=scrollWidth390。[公開PC画像](./screenshots/admin-parity-20261020/staging-demo-pc.jpg)、[公開390px画像](./screenshots/admin-parity-20261020/staging-demo-mobile.jpg)。Vercelアカウント不要で到達し、メモリ操作のみ。実Android操作とは区別する。

## 未確認と残る差分

- 実staging管理者での最新PC/スマホ画面・実DB CRUD再試験は未実施。既存管理者のログインを本人へ依頼済みで、資格情報のリセットや認証迂回はしていない。2026-10-17の既存staging CRUD/RLS結果と今回のモック試験を区別する。
- 本人の実Android/PCメール認証・セッション維持・最新リンク再送後確認は継続して未確認。
- デモの保存はブラウザのメモリだけ。速度/通信失敗/他利用者の競合や実際のメール認証は同等の実サービスとして扱わない。デモ表示/リセット/削除補足、アカウント操作なし、デモ内のリンク先が意図した差。
- 本番・DB・RLS・管理者権限・既存ユーザー・公開範囲は未変更。main未マージ。

## 再現方法

`.env.local`は本番なので流用しない。まず公開変数をダミーに上書きしてビルドする。

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=local-test-placeholder NEXT_TELEMETRY_DISABLED=1 npm run build -- --webpack
npm run verify:admin-ui
```

通常UIは`http://127.0.0.1:3100/admin/login`から架空の`admin@example.invalid`（一般は`learner@example.invalid`）、パスワード`fictional-password`で通常の画面操作を行う。いずれも実アカウントではない。デモは`http://127.0.0.1:3100/demo/admin`。一時制御JSONのdelayMs/failureで遅延/拒否を再現できる。実Authトークン・メールリンク・ブラウザStorageを注入しない。終了はCtrl+C。
