"use strict";
// ===== 運営設定（秘密情報はここに置かない） =====
const CONFIG = {
  mode: "gas", // demo: このブラウザ内だけ / gas: GASに接続
  gasUrl: "https://script.google.com/macros/s/AKfycbzC-1WIQgFEJoKieocgOt9pcHwRRGf6PChFCzpL9VFrO3LqQVhkk2zZsCb-En8Gq5mB/exec", // https://script.google.com/macros/s/DEPLOYMENT_ID/exec
  readOnly: false,
  startsAt: "", // 空欄=制限なし。例: 2026-10-01T00:00:00+09:00
  endsAt: "", // 終了時刻は含まない。例: 2026-12-07T00:00:00+09:00
  contact: "運営連絡先を設定してください",
  types: {
    general: {label:"一般参加者", maxChars:150, passwordRequired:false, styles:["speech","comic","sticky","poster","hero"]},
    member: {label:"フラスタ企画メンバー", maxChars:400, passwordRequired:false, styles:["speech","comic","sticky","poster","hero","special"]}
  },
  styles: {speech:"吹き出し",comic:"コミックコマ",sticky:"付箋",poster:"学園祭ポスター",hero:"HERO CARD",special:"SPECIAL MESSAGE"}
};
const $ = id => document.getElementById(id);
const lengthOf = text => Array.from(text).length; // Unicodeコードポイント単位
const STORAGE = "riekousai-2026-demo-v1";
const samples = Object.keys(CONFIG.styles).map((style,i)=>({id:"sample-"+i,penName:["ありがとう係","青空","放課後のりえ高生","応援団","HERO FAN","フラスタ企画メンバー"][i],message:["いつも元気をもらっています。\nありがとうの気持ちが届きますように！","笑顔いっぱいの一日になりますように！","日頃の感謝を、一枚の付箋に。\nこれからも応援しています。","みんなの想いで、にぎやかな文化祭に！","あなたの声に何度も勇気をもらいました。","大切な仲間と一緒に、応援の気持ちを届けます。"][i],memberType:style==="special"?"member":"general",cardStyle:style}));
let messages=[], busy=false;
function card(data){
  const style=Object.hasOwn(CONFIG.styles,data.cardStyle)?data.cardStyle:"speech";
  const el=document.createElement("article");el.className="card card-"+style;
  const tag=document.createElement("span");tag.className="card-label";tag.textContent=CONFIG.styles[style];
  const content=document.createElement("p");content.textContent=String(data.message||"");
  const footer=document.createElement("footer");footer.textContent=String(data.penName||"名無し")+" / "+(CONFIG.types[data.memberType]?.label||"参加者");
  el.append(tag,content,footer);return el; // 投稿HTMLを解釈しない
}
function availability(){
  if(CONFIG.readOnly)return "現在は閲覧専用です。";
  const now=Date.now();
  for(const key of ["startsAt","endsAt"])if(CONFIG[key]&&!Number.isFinite(Date.parse(CONFIG[key])))return "受付期間の設定を確認してください。";
  if(CONFIG.startsAt&&now<Date.parse(CONFIG.startsAt))return "投稿受付はまだ始まっていません。";
  if(CONFIG.endsAt&&now>=Date.parse(CONFIG.endsAt))return "投稿受付は終了しました。";
  return "";
}
function updateAvailability(){const reason=availability();$("form-fields").disabled=busy||Boolean(reason);$("period-note").textContent=reason||"投稿受付中です。";$("write-link").hidden=Boolean(reason);}
function updateForm(resetStyles=false){
  const type=CONFIG.types[$("memberType").value];
  if(resetStyles){$("cardStyle").replaceChildren(...type.styles.map(key=>new Option(CONFIG.styles[key],key)));$("password").value="";}
  $("password-row").hidden=!type.passwordRequired;$("password").required=type.passwordRequired;
  const n=lengthOf($("message").value);$("count").textContent=`${n} / ${type.maxChars}文字`;
  $("message").setCustomValidity(n>type.maxChars?`メッセージは${type.maxChars}文字までです。`:"");
  $("preview").replaceChildren(card({penName:$("penName").value||"あなたのペンネーム",message:$("message").value||"ここにあなたの想いが入ります。",memberType:$("memberType").value,cardStyle:$("cardStyle").value}));
}
function render(){const filter=$("filter").value;const shown=messages.filter(m=>filter==="all"||m.memberType===filter);$("cards").replaceChildren(...shown.map(card));$("wall-status").textContent=`${shown.length}枚のカード${CONFIG.mode==="demo"?"（サンプル・この端末のデモ投稿）":""}`;if(!shown.length)$("wall-status").textContent="まだ表示できるメッセージはありません。";}
function localMessages(){try{const data=JSON.parse(localStorage.getItem(STORAGE)||"[]");return Array.isArray(data)?data.filter(x=>x&&typeof x.message==="string"&&typeof x.penName==="string"):[];}catch{return [];}}
async function api(payload){
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(CONFIG.gasUrl))throw new Error("GAS URLを設定してください。");
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
  try{const response=await fetch(CONFIG.gasUrl+(payload?"":"?action=list"),{method:payload?"POST":"GET",body:payload?new URLSearchParams(payload):undefined,credentials:"omit",signal:controller.signal,redirect:"follow"});if(!response.ok)throw new Error("APIとの通信に失敗しました。");const result=await response.json();if(!result.ok)throw new Error(result.error||"処理に失敗しました。");return result;}finally{clearTimeout(timer);}
}
async function load(){ $("reload").disabled=true;$("wall-status").textContent="読み込み中…";try{messages=CONFIG.mode==="demo"?[...samples,...localMessages()]: (await api()).messages;if(!Array.isArray(messages))throw new Error("APIの応答形式を確認してください。");render();}catch(e){$("wall-status").textContent="読み込めませんでした。設定・通信を確認して再読み込みしてください。";}finally{$("reload").disabled=false;}}
Object.entries(CONFIG.types).forEach(([key,type])=>{$("memberType").add(new Option(type.label,key));$("filter").add(new Option(type.label,key));});
$("contact").textContent=CONFIG.contact;
$("mode-note").textContent=CONFIG.mode==="demo"?"デモ版：送信内容はこのブラウザ内だけに保存され、運営には届きません。メンバー区分は自己申告です。":"送信後、運営の確認を経て掲載されます。";
$("memberType").addEventListener("change",()=>updateForm(true));["penName","message","cardStyle"].forEach(id=>$(id).addEventListener("input",()=>updateForm()));$("filter").addEventListener("change",render);$("reload").addEventListener("click",load);
$("message-form").addEventListener("submit",async event=>{
  event.preventDefault();updateAvailability();if(busy||availability())return;
  const payload={penName:$("penName").value.trim(),message:$("message").value.trim(),memberType:$("memberType").value,cardStyle:$("cardStyle").value,password:$("password").value,consent:"true",requestId:crypto.randomUUID()};
  if(!payload.penName||lengthOf(payload.penName)>30||!payload.message){$("feedback").textContent="ペンネーム（30文字以内）とメッセージを入力してください。";return;}
  busy=true;updateAvailability();$("feedback").textContent="送信中…";
  try{if(CONFIG.mode==="demo"){const {password,consent,...saved}=payload;localStorage.setItem(STORAGE,JSON.stringify([...localMessages(),saved]));}else{await api(payload);}
    $("message-form").reset();updateForm(true);$("feedback").textContent=CONFIG.mode==="demo"?"このブラウザにデモ投稿を保存しました。運営には送信されていません。":"受け付けました。確認後に掲載されます。";await load();
  }catch(e){$("feedback").textContent=`送信結果を確認できませんでした：${e.name==="AbortError"?"通信がタイムアウトしました。":e.message} GASモードでは保存済みの可能性があります。再送前に運営へ確認してください。`;}
  finally{busy=false;updateAvailability();}
});
updateForm(true);updateAvailability();setInterval(updateAvailability,30000);load();
