# AME-Markdown-Viewer-Design

[Markdown Viewer](https://github.com/simov/markdown-viewer)
用のカスタムデザインテーマ（`.css`）を格納するリポジトリです。

すべてのテーマは **「伝わりやすいデザイン」** 理念に基づいています。

## テーマ一覧

| テーマ名   | ファイル                | 説明                               |
| ---------- | ----------------------- | ---------------------------------- |
| Cyber-Flat | `themes/Cyber-Flat.css` | サイバーフラット風のモダンなテーマ |

## 使い方

1. Markdown Viewer のオプション画面を開く
2. 「Custom CSS」にテーマファイルの内容を貼り付ける
3. または、テーマファイルのパスを指定して読み込む

## デザイン理念

各テーマは [DESIGN_PHILOSOPHY.md](DESIGN_PHILOSOPHY.md)
に定義されたチェック基準に基づいて設計されています。

- **読みやすさ**: 行間・フォント・余白の最適化
- **見やすさ**: コントラスト・視覚構造の整理
- **見栄えのよさ**: 統一感のあるタイポグラフィ
- **バリアフリー**: ダークモード・レスポンシブ対応

## 開発

```bash
npm install
npm test
```

`npm test` で lint / format / 無効化コメントの検出を一括実行します。
