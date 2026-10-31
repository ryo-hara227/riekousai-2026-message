# りえ高祭2026 メッセージ＋イラストギャラリー追加版

同一ページに2つの投稿フォームと2つの一覧を配置します。既存の文言・背景・カードは公開ファイルを基に維持し、画像の処理をgallery.js/gallery.cssへ分けています。実サービスへの反映は行っていません。

最初に **USER_SETUP.md** を読んでください。新タブはsetupが自動作成するため、列を手作業で作る必要はありません。

## ファイル構成

- index.html：既存ページへ専用フォーム・一覧・拡大ダイアログ追加
- app.js：メッセージ用（100文字、区分・パスワードなし）
- styles.css：既存のデザイン
- gallery.js：画像準備・投稿・一覧・画像取得・拡大
- gallery.css：ギャラリー専用の見た目
- gas/Code.gs：Sheets／非公開Drive連携、公開API、運営用削除処理
- USER_SETUP.md：Drive・Sheets・GAS・GitHubの導入／日常管理手順
- tests/：実サービスに接続しない検証コードとテスト画像

GASソースはこのチャットの高速化・100文字版を基にしています。公開中のGAS内部コードは取得していません。独自に変更した設定がある場合は移してください。

## 仕様

| 項目 | 設定 |
|---|---|
| メッセージ | 100文字、従来の6スタイル、即時公開 |
| イラスト | 1投稿1枚、ペンネーム30文字、タイトル40文字 |
| ひとこと | 任意・100文字 |
| 画像の説明 | 必須・120文字。代替テキストとして使用 |
| 選択ファイル | JPEG／PNG／WebP、2MiB（2,097,152バイト）まで |
| 保存する表示用画像 | 長辺2000px以内・JPEG、最大1.5MiB |
| 保存する一覧用画像 | 長辺480px以内・JPEG、最大120KiB |
| 変換 | ブラウザで再描画・縮小・JPEG変換。透明は白、元データは保存しない |
| 公開 | 即時公開。シートのvisibleで非表示 |
| 一覧 | 1ページ12件、もっと見る、画面に近づいてから取得 |
| 画像取得 | 同時2件まで。一覧用を先に、大きい画像は拡大時に取得 |
| 受付 | メッセージ／イラストで日時・閲覧専用を独立指定 |

ブラウザはファイル形式・容量・画素数・文字数を検査。サーバーも公開同意・文字数・JPEG署名／構造／寸法／データ量を検査します。HEIC・GIF・SVGは受け付けません。フロントが画像を軽くできない場合は投稿前に縮小を案内します。

## 保存と配信

- メッセージは既存Messagesを維持。
- イラスト情報はIllustrationsへ。画像の実体は専用の非公開Driveフォルダへ。
- 公開APIにはDriveファイルIDを返さず、ランダムな投稿IDだけを返す。
- 画像はGASが公開状態を毎回確認してから、Base64のJSONとして返す。ブラウザはこれを画像表示する。
- Drive共有リンク・一時サムネイルURLへの依存、画像用の外部サービス契約は不要。
- GASへのHTTPリクエストとBase64転送の待ち時間は残る。大量配信向けCDNではなく小規模企画向けの構成。速度改善率は未測定。

## Illustrations列（自動生成）

| 列 | 名前 | 用途 |
|---|---|---|
| A | timestamp | 投稿日時 |
| B | illustrationId | サイト表示用の投稿ID |
| C | penName | 投稿者名 |
| D | title | タイトル |
| E | description | ひとこと |
| F | altText | 画像の説明 |
| G | imageFileId | 表示用画像のDrive ID（編集しない） |
| H | thumbnailFileId | 一覧用画像のDrive ID（編集しない） |
| I / J | width / height | 表示用画像の幅・高さ |
| K | visible | TRUEで公開、FALSEで非表示 |
| L | requestId | 再送の重複防止用ID |
| M | deleteRequested | 運営が画像削除したい行をTRUEにする |
| N | deletedAt | 削除処理を実行した日時 |

列を削除・並べ替えないでください。シートそのものを公開共有する必要はありません。

## API

- GET `?action=list`：既存メッセージ一覧（fresh=1で短期キャッシュ迂回）
- POST action省略／message：既存メッセージ投稿
- GET `?action=gallery&cursor=`：公開イラスト一覧。nextCursorがnullなら終端
- POST action=illustration：penName,title,description,altText,imageData,thumbnailData,consent,requestId
- GET `?action=image&id=投稿ID&size=thumb`：一覧画像
- GET `?action=image&id=投稿ID&size=full`：拡大画像

POSTはURLSearchParams形式。JSONのContent-Typeや独自ヘッダーを追加しないでください。画像POSTは60秒、その他のギャラリー通信は30秒で画面側がタイムアウトします。保存結果不明の再送では同じ入力・画像に同じrequestIdを使用します。ページを閉じると再送IDは保持しません。

公開中のイラスト一覧はキャッシュせずSheetsから取得。画像も毎回公開状態を確認します。同じタブ内では取得済み一覧画像をメモリに保持しますが、「再読み込み」で一覧画像キャッシュを破棄します。取得済み画像の端末からの回収はできません。ページング中に新規投稿や非表示が入った場合、位置が動くことがあるため、最新全件を見るには先頭から再読み込みしてください。

## デザイン・文言

gallery.cssの.gallery-grid（列数）、.illustration-card（カード）、.illustration-thumbnail（一覧画像）、#illustration-dialog（拡大）を編集します。既存styles.cssの色・フォント変数を継承します。固定文言はindex.htmlのillustration-compose／gallery、動的な案内はgallery.jsです。

画像圧縮上限・文字数を変える場合はgallery.jsのGALLERY_CONFIGとGASのSETTINGS.galleryを合わせます。タイトル等のHTML maxlengthも合わせてください。

## 検証

バックエンドはApps Script／Drive／Sheetsを模したローカル環境で確認。ブラウザテストも全通信をその環境に置き換え、実GASへ書き込んでいません。

確認済み：既存投稿維持、100文字チェック、6スタイル、画像準備、形式・容量・寸法検査、画像の保存と2点管理、即時表示、同じ投稿IDでの重複防止、HTML文字列の安全な表示、遅延取得、拡大／Escape／フォーカス復帰、非表示後の画像取得拒否、削除、途中失敗時の画像片付け、ページ分割、受付停止・期間、スマホ／PCの横はみ出しなし。

実Google環境の権限・リダイレクト・CORS・クォータを含む接続は、USER_SETUP.mdの手順で確認が必要です。GitHub・GASへの更新は未実施です。

開発者向けテスト：Node.jsで `node tests/backend.test.cjs`。ブラウザはPlaywrightとChromiumを用意し `node tests/browser.test.cjs`。任意でCHROME_PATHに既存Chromeの実行ファイルを指定できます。

参考：
- https://developers.google.com/apps-script/reference/drive/file#getBlob()
- https://developers.google.com/apps-script/reference/utilities/utilities#base64Encode(Byte)
- https://developers.google.com/apps-script/reference/content/content-service
- https://developers.google.com/apps-script/guides/services/quotas
