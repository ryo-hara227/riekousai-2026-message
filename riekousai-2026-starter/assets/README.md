# 背景イラストの置き方
AI生成イラスト・公式ロゴ・公式画像は同梱していません。初期背景はCSSの色と網点です。

推奨ファイル例：
- `bg-riekousai-desktop.webp`：1920×1080以上、横長
- `bg-riekousai-mobile.webp`：1080×1920程度、縦長

`styles.css` の `:root` を変更：
```css
--bg-desktop: url("./assets/bg-riekousai-desktop.webp");
--bg-mobile: url("./assets/bg-riekousai-mobile.webp");
--bg-position: center;
```
1枚で兼用する場合は両方に同じURLを入れます。PNG/JPGも使用できます。ファイル名は英小文字・ハイフン推奨。大文字小文字を一致させてください。

背景は画面に固定され、前景だけスクロールします。`cover` で画面を埋めるので端が切れます。顔・文字など重要要素は端や中央のUIの下を避け、スマホ縦版を別途作ると調整しやすくなります。表示位置は `--bg-position: 60% center;` などで調整。背景を全部見せるなら `.background` の最初の `background-size` を `contain` に変更（余白ができます）。

イラスト依頼時は「中央に文字が載る・左右上下に装飾を寄せる・極端な明暗差を避ける・端のトリミングを許容する」と伝えてください。圧縮して各画像1MB程度を目安にし、必ずスマホ実機で文字の読みやすさを確認してください。利用許諾・クレジット表記を確認し、必要ならindex.htmlのフッターに追記します。
