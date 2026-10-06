/** Sheetsに紐づくApps Scriptに貼り付け。Script Propertiesに秘密を設定。 */
const SETTINGS = {
  sheetName: 'Messages', readOnly: false,
  startsAt: '', endsAt: '', // ISO8601 +09:00。フロントと合わせる
  types: {
    general: {maxChars:150, passwordProperty:'', styles:['speech','comic','sticky','poster','hero']},
    member: {maxChars:400, passwordProperty:'MEMBER_PASSWORD', styles:['speech','comic','sticky','poster','hero','special']}
  }
};
const HEADERS = ['timestamp','penName','message','memberType','cardStyle','visible','requestId'];
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function sheet_(){
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id)throw new Error('SPREADSHEET_IDが未設定です。');
  const sheet=SpreadsheetApp.openById(id).getSheetByName(SETTINGS.sheetName);
  if(!sheet)throw new Error('先にsetupを実行してください。');return sheet;
}
function setup(){
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id)throw new Error('SPREADSHEET_IDを設定してください。');
  const ss=SpreadsheetApp.openById(id);const sheet=ss.getSheetByName(SETTINGS.sheetName)||ss.insertSheet(SETTINGS.sheetName);
  if(sheet.getLastRow()===0){sheet.appendRow(HEADERS);sheet.setFrozenRows(1);}
  if(JSON.stringify(sheet.getRange(1,1,1,HEADERS.length).getValues()[0])!==JSON.stringify(HEADERS))throw new Error('ヘッダーの順序を確認してください。');
}
function doGet(){try{
  const rows=sheet_().getDataRange().getValues().slice(1);
  const messages=rows.filter(r=>r[5]===true||String(r[5]).toLowerCase()==='true').map(r=>({penName:String(r[1]),message:String(r[2]),memberType:String(r[3]),cardStyle:String(r[4])}));
  return json_({ok:true,messages});
}catch(e){return json_({ok:false,error:'一覧を取得できません。運営へお問い合わせください。'});}}
function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    if(!lock.tryLock(10000))throw new Error('混雑しています。少し待ってください。');
    if(SETTINGS.readOnly)throw new Error('現在は閲覧専用です。');
    const now=Date.now();
    ['startsAt','endsAt'].forEach(k=>{if(SETTINGS[k]&&!Number.isFinite(Date.parse(SETTINGS[k])))throw new Error('受付期間の設定エラーです。');});
    if(SETTINGS.startsAt&&now<Date.parse(SETTINGS.startsAt))throw new Error('受付開始前です。');
    if(SETTINGS.endsAt&&now>=Date.parse(SETTINGS.endsAt))throw new Error('受付は終了しました。');
    const p=(e&&e.parameter)||{};const type=SETTINGS.types[p.memberType];
    if(!Object.prototype.hasOwnProperty.call(SETTINGS.types,p.memberType)||!type)throw new Error('参加区分が不正です。');
    if(type.passwordProperty){const secret=PropertiesService.getScriptProperties().getProperty(type.passwordProperty);if(!secret||p.password!==secret)throw new Error('参加区分のパスワードを確認してください。');}
    const name=String(p.penName||'').trim(),message=String(p.message||'').trim();
    if(!name||Array.from(name).length>30||!message||Array.from(message).length>type.maxChars)throw new Error('名前・メッセージの文字数を確認してください。');
    if(!type.styles.includes(p.cardStyle))throw new Error('この区分では選択できないスタイルです。');
    if(p.consent!=='true')throw new Error('公開への同意が必要です。');
    if(!/^[a-zA-Z0-9-]{16,64}$/.test(p.requestId||''))throw new Error('投稿IDが不正です。');
    const sheet=sheet_();const rows=sheet.getDataRange().getValues();
    if(rows.slice(1).some(r=>String(r[6])===p.requestId))return json_({ok:true,pending:true});
    // 数式注入を防止。先頭のアポストロフィはSheetsでは表示されません。
    const literal=s=>/^[=+@-]/.test(s)?"'"+s:s;
    sheet.appendRow([new Date(),literal(name),literal(message),p.memberType,p.cardStyle,false,p.requestId]);
    return json_({ok:true,pending:true});
  }catch(error){return json_({ok:false,error:error.message});}
  finally{if(lock.hasLock())lock.releaseLock();}
}
