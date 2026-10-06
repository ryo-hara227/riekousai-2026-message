# りえ高祭2026 非公式メッセージ企画スターター

アメコミ表紙風トップ＋文化祭掲示板風メッセージウォール。フレームワーク・ビルド不要のHTML/CSS/JavaScriptです。公式画像・ロゴ・AIイラストは使用していません。企画名は仮文言なので運営の方針に合わせて編集してください。

## 最初に試す

`index.html` をブラウザで開くと6種類のサンプルが見られます。`app.js` の初期設定は `mode: "demo"`。フォームの投稿はそのブラウザのlocalStorageに保存され、他の端末・運営には届きません。ストレージが使えない環境では送信エラーになります。サンプル・デモ投稿はGASモードでは表示されません。

ローカルサーバーを使う場合、Python 3のある環境でこのフォルダから `python3 -m http.server 8000` を実行し、`http://localhost:8000` を開きます。GASとの通信は公開後のPages URLでも確認してください。

## フォルダ構成

```text
riekousai-2026-starter/
├── index.html       文言・ページ構造・フォーム・非公式表記
├── styles.css       色・フォント・固定背景・6種のカード・画面幅対応
├── app.js           CONFIG・デモ保存・プレビュー・API通信
├── .nojekyll        静的ファイルをそのまま配信
├── README.md        このガイド
├── assets/
│   └── README.md    イラスト制作・差し替えガイド
└── gas/
    └── Code.gs      Sheets API雛形（ブラウザから実行されません）
```

## GitHub Pagesで公開する

1. GitHubで新規リポジトリを作成します。例：`riekousai-2026-message`。無料アカウントで進める場合はPublicを選びます。
2. このフォルダの**中身**をリポジトリのルートにアップロードしてcommitします。`index.html` がルートにあることを確認。Webアップロードで `.nojekyll` が抜けた場合は「Add file → Create new file」で作成できます。
3. リポジトリの「Settings → Pages」を開き、「Build and deployment → Source」を「Deploy from a branch」にします。
4. Branchを `main`、フォルダを `/(root)` にしてSave。
5. 配信完了後、Pages画面のURLを開きます。通常 `https://ユーザー名.github.io/リポジトリ名/` です。反映まで数分かかることがあります。
6. 編集はファイル更新→commitで反映されます。表示が古い場合は再読み込みとActionsの配信状況を確認します。

ファイル参照はすべて `./` から始まる相対パスです。リポジトリ名のサブディレクトリにも対応します。初期状態はデモなので、**実際の募集開始前にGASへ切り替えてください**。公開リポジトリにはパスワード・実投稿のCSV・個人情報をcommitしないでください。

公式手順：[GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## どこを変更すると何が変わるか

| 変更対象 | 編集箇所 | 効果 |
|---|---|---|
| タイトル・紹介文・ボタン・非公式表記 | `index.html` の `title`、`.cover`、フッター | ページ文言。非公式表記は残してください |
| 問い合わせ先 | `app.js` の `CONFIG.contact` | フッターの連絡先（テキスト） |
| メイン色 | `styles.css` の `:root` | `--yellow` ボタン、`--red` 見出し、`--blue` アクセント、`--ink` 文字・枠 |
| パネルの透過度 | `--panel: rgba(255,253,245,.9)` | 最後の数値を下げるほど背景が見える。文字の可読性を確認 |
| 表紙の透過度 | `.cover` の `background` | 表紙パネルのみ。ウォールとは別に調整 |
| フォント | `--font-body`、`--font-heading` | 本文と見出し。初期は端末フォント、外部通信不要 |
| 最大横幅・角丸 | `--max-width`、`--radius` | 全体の横幅、前景パネルの角丸 |
| 背景 | `--bg-desktop`、`--bg-mobile`、`--bg-position` | 固定背景イラスト。詳細は `assets/README.md` |
| カードの外観 | `.card-*` | `speech/comic/sticky/poster/hero/special` 各種の枠・色 |
| カードの表示名 | `CONFIG.styles` | フォームの選択肢とカードラベル |
| 区分・文字数・選択可能スタイル | `CONFIG.types` | 参加区分ごとの表示・制限 |
| GAS接続 | `CONFIG.mode`、`CONFIG.gasUrl` | 実保存APIへの切り替え |
| 受付期間・閲覧専用 | `CONFIG.startsAt/endsAt/readOnly` | フォーム受付状態（サーバー側も必ず合わせる） |
| サンプル文 | `app.js` の `samples` | デモだけに表示される6枚 |
| 列数 | CSS末尾の `@media` と `.cards` | 初期はスマホ1列・700px以上2列・1000px以上3列 |

イラストを上・下で別々にしたい場合は `.cover` に専用の背景を加えるなど拡張できます。現段階は全画面1レイヤーが固定されています。背景を薄くする際は文字とのコントラストを確認してください。

### 色・フォントの編集例

```css
:root {
  --yellow: #ffe34b;
  --blue: #164aa7;
  --red: #b92639;
  --font-body: system-ui, "Noto Sans JP", sans-serif;
  --font-heading: "Arial Black", "Noto Sans JP", sans-serif;
}
```

フォント名を書くだけでは未インストールのフォントは読み込まれません。自前のwoff2を配信するなら利用許諾を確認し、`assets/`に置いて `@font-face` を追加します。日本語を含むフォントか、代替フォントがあるか確認してください。

### 投稿区分・文字数・特別カード

`CONFIG.types.general` は一般参加者（150文字）、`member` はフラスタ企画メンバー（400文字）。キーはSheetsに保存する識別子、`label` は画面の表示名です。フロントの文字数はUnicodeコードポイント数です（複合絵文字は見た目の1文字と一致しない場合があります）。GASも同じ計数をします。

```js
member: {
  label: "フラスタ企画メンバー",
  maxChars: 400,
  passwordRequired: true,
  styles: ["speech", "comic", "sticky", "poster", "hero", "special"]
}
```

初期デモはパスワード不要・自己申告。GAS雛形はmemberにパスワードが必要です。GASに切り替える際は上記 `passwordRequired: true` にして、GAS側の `MEMBER_PASSWORD` を設定します。パスワード本体をフロントに書かないでください。パスワード不要のメンバー運用ならGAS側の `passwordProperty: ''` にしますが、その場合は誰でもメンバーとして投稿できます。

一般参加者にもパスワードを付けるなら、フロントの `general.passwordRequired: true` とGASの `general.passwordProperty: 'GENERAL_PASSWORD'` を設定し、同名のスクリプトプロパティに秘密を保存します。区分追加時はフロントの `types` とGASの `types` に同じキーを追加。文字数・stylesの許可リストも両方に合わせます。

`special` を一般にも開放するならgeneralの `styles` に追加（フロント/GAS両方）。表示を変えるならCSSの `.card-special` を編集。新スタイルは `CONFIG.styles`・各区分のstyles・GASの許可リスト・CSSを合わせて追加します。

### 受付期間・公開期間・閲覧専用

日時は `+09:00` を付けたISO8601で入力します。初期値は未設定です。例は運営が決める日程に差し替えてください。

```js
startsAt: "2026-10-01T00:00:00+09:00",
endsAt: "2026-12-07T00:00:00+09:00",
readOnly: false,
```

開始は含む、終了は含まないため、この例は12月6日23:59:59まで受付。受付終了後もウォールは閲覧できます。終了判定は送信時にも行います。GASの `SETTINGS` にも同じ日時を設定し、再デプロイしてください。端末の時計とサーバーの時計が異なる場合はGAS判定が最終です。

任意に受付停止する場合は**フロントとGASの両方を `readOnly: true`** にします。`?view=...` などのURLで受付制限を解除する機能はありません。

「サイトそのものの公開期間」は受付期間と別です。閲覧終了時にはGitHub Pagesの配信を停止し、GASのデプロイも無効にします。フロントで非表示にするだけでは公開APIからの取得を止められません。GitHub Pagesは静的公開なので、閲覧用パスワードによる保護はこのスターターに含まれません。

## Google Apps Script + Sheets 連携

### セットアップ

1. 新しい非公開Googleスプレッドシートを作成します。URL `/d/` と `/edit` の間がIDです。
2. 「拡張機能 → Apps Script」を開き、`gas/Code.gs` を貼り付けます。
3. Apps Scriptの「プロジェクトの設定 → スクリプト プロパティ」に `SPREADSHEET_ID` とIDを追加。メンバー認証を使うなら `MEMBER_PASSWORD` も設定します。
4. `setup` 関数を選んで実行し、必要な権限を承認。`Messages` シートとヘッダーが作られます。既存データのヘッダー順を変更しないでください。
5. 「デプロイ → 新しいデプロイ → ウェブアプリ」を選び、実行者を自分、アクセスを全員にしてデプロイ。組織のポリシーで匿名アクセスできない場合はこの方式は使用できません。
6. 発行された `/exec` URLを `CONFIG.gasUrl` に貼り、`mode: "gas"` に変更。memberの `passwordRequired: true` を合わせます。`/dev` URLは使用しません。
7. GAS設定を更新した場合は「デプロイを管理 → 編集 → 新しいバージョン」で再デプロイ。同じURLを維持できます。
8. GitHub Pagesから実投稿し、Sheetsに `visible=false` の行が追加されることを確認。運営が確認後に `visible` セルを `TRUE`（またはチェックボックスON）にします。ウォールの再読み込みで掲載されます。

公式説明：[Web Apps](https://developers.google.com/apps-script/guides/web)、[Content Service](https://developers.google.com/apps-script/guides/content)

### 列とAPI契約

| 列 | 用途 |
|---|---|
| timestamp | GASサーバーで記録する日時 |
| penName / message | 公開する名前・本文 |
| memberType / cardStyle | 区分・表示スタイルのキー |
| visible | 初期FALSE。TRUEの投稿だけ公開APIに返す |
| requestId | 送信ID。同じIDの二重保存を防止 |

GET `/exec?action=list` → `{ "ok": true, "messages": [...] }`。公開されるデータは名前・本文・区分・スタイルだけです。

POST `/exec` → URLSearchParams形式で `penName,message,memberType,cardStyle,password,consent,requestId` を送信。成功は `{ "ok": true, "pending": true }`、失敗は `{ "ok": false, "error": "..." }`。GASはエラーでもHTTP 200を返す場合があるためフロントは `ok` を確認します。秘密はURLやシートに保存しません。

JSONのContent-Typeや独自ヘッダーを追加するとCORSプリフライトが発生する場合があります。初期コードは通常のフォーム形式です。ContentServiceにはリダイレクトがあるためfetchはfollowを使用。実環境でブラウザのCORS・アクセス権・リダイレクトを確認してください。`no-cors`に変えると応答を読めず保存成功を確認できないので使用しません。読み取りがブロックされる環境では、APIプロキシ等の別構成が必要です。

### 運用上の範囲

これは小規模企画向け雛形です。共有パスワードは個人認証ではなく、流出した人を識別できません。一般参加の匿名投稿にはCAPTCHAやIPベースのレート制限は未実装です。運営確認を必須にしており、必要に応じて個別招待・別API等を追加してください。Sheetsは公開共有しないでください。

通信失敗でもPOSTが保存されている場合があります。フロントは成功と断定せず運営への確認を案内します。同じrequestIdならGASが重複を防ぎますが、手動再送時は別IDになるため、Sheetsで重複がないか確認してください。パスワードを送信するPOST本文をログに出さないでください。公開メッセージは検索・コピーされる可能性があるため個人情報を投稿しないよう案内しています。

入力はDOMの `textContent` で表示し、投稿内のHTMLを実行しません。GASで名前・本文の先頭が数式記号の場合は文字列化します。非表示操作はSheetsの `visible` をFALSEに変更→ウォール再読み込みです。投稿の編集・削除を参加者が行う機能、ページング、閲覧認証は未実装です。実投稿が大量になる際はAPI取得件数とページ分割を追加します。

## 公開前に確認

- 運営連絡先と文言、受付日時を設定。非公式表記がトップとフッターにある。
- スマホとPC、キーボードTab移動、200%拡大で読める。
- 6種プレビュー、区分変更、文字数超過、未同意、空白のみ入力を確認。
- GASから公開済みだけ取得し、非表示・パスワード不正・終了後投稿が拒否される。
- 投稿承認後に再読み込みで表示され、接続失敗時に成功扱いしない。
- 使用イラスト・フォントの許諾とクレジットを確認。

デモ保存のリセット：ブラウザ開発者ツールのConsoleで `localStorage.removeItem('riekousai-2026-demo-v1')` を実行して再読み込みします。GASモードの投稿データには影響しません。

## この一式の検証範囲

Chromeの自動操作で390px・1440px幅の横はみ出し、6種類表示、特別カードの区分制限、文字数超過、デモ投稿・再読み込み保存、区分フィルター、HTML文字列の安全な表示を確認済みです。JavaScript構文チェックも通っています。GASはモックで公開フラグ、数式注入対策、重複ID、文字数、カード権限、パスワード、閲覧専用、受付終了の判定を確認しました。実際のGoogleアカウント・Sheets・CORSを含むエンドツーエンド接続は未検証です。公開前にご自身のデプロイで確認してください。
