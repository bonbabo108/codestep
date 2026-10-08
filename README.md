# CodeStep

## サイトイメージ

![CodeStepの学習画面](./docs/app-learning.png)


## アプリ概要

CodeStep は、学習問題への解答と正誤判定を通して、プログラミング学習を進めるための学習アプリです。
ユーザー登録・ログイン後に学習進捗を保存でき、管理画面では学習問題の作成・一覧表示・編集・削除ができます。
講座提出用のポートフォリオとして制作しました。

## アプリURL

公開URL：[https://codestep-two.vercel.app](https://codestep-two.vercel.app)

## 機能一覧

- ユーザー登録・ログイン機能
- 学習問題の表示機能
- 解答入力・正誤判定機能
- 学習進捗の保存機能
## 設計ドキュメント

CodeStepの画面構成とデータベース設計を確認できる資料です。

| 種類 | 内容 | ファイル |
| --- | --- | --- |
| ワイヤーフレーム | ログイン画面、学習画面、管理画面の画面構成 | [wireframe.png](./docs/wireframe.png) |
| ER図 | profiles、questions、user_progress のテーブル構成 | [er-diagram.png](./docs/er-diagram.png) |

設計画像は `docs/` フォルダに配置しています。上記のリンクから確認できます。
- 管理画面での問題作成機能
- 管理画面での問題一覧表示機能
- 管理画面での問題編集機能
- 管理画面での問題削除機能

## 設計ドキュメント

| ドキュメント | ファイル |
| --- | --- |
| ワイヤーフレーム | [ワイヤーフレーム](./docs/wireframe.png) |
| ER図 | [ER図](./docs/er-diagram.png) |

設計画像は `docs/` フォルダに配置しています。上記のリンクから確認できます。

## 使用技術

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- GitHub
