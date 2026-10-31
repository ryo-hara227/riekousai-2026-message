"use strict";
// このファイルはapp.jsの後に読み込んでください。
const GALLERY_CONFIG = {
  readOnly:false, startsAt:"", endsAt:"", // メッセージとは独立。GAS側にも合わせる。
  maxFileBytes:2*1024*1024, maxPixels:40000000, maxSide:2000,
  maxImageBytes:1572864, thumbSide:480, maxThumbBytes:122880,
  maxName:30, maxTitle:40, maxDescription:100, maxAlt:120
};
(()=>{
  const el=id=>document.getElementById(id),len=s=>Array.from(s).length;
  const form=el('illustration-form'),fields=el('illustration-fields'),dialog=el('illustration-dialog');
  let prepared=null,preparing=false,sending=false,fileVersion=0,attempt=null;
  let entries=[],nextCursor=null,listSequence=0,started=false,lastFocus=null,dialogVersion=0;
  let observer=null,activeImages=0,queue=[],mediaEpoch=0;
  const thumbs=new Map(),demoImages=new Map();
  let demoEntries=[];
  function reason(){
    const s=GALLERY_CONFIG,now=Date.now();if(s.readOnly)return 'イラスト投稿は現在お休みしています。';
    for(const k of ['startsAt','endsAt'])if(s[k]&&!Number.isFinite(Date.parse(s[k])))return 'イラスト受付期間の設定を確認してください。';
    if(s.startsAt&&now<Date.parse(s.startsAt))return 'イラストの受付開始前です。';
    if(s.endsAt&&now>=Date.parse(s.endsAt))return 'イラストの受付は終了しました。';return '';
  }
  function controls(){const r=reason();fields.disabled=sending||Boolean(r);el('illustration-submit').disabled=preparing;el('illustration-period-note').textContent=r||'イラストを受け付けています。';el('illustration-write-link').hidden=Boolean(r);}
  function validateText(){const n=len(el('illustration-description').value);el('illustration-count').textContent=`${n} / ${GALLERY_CONFIG.maxDescription}文字`;el('illustration-description').setCustomValidity(n>GALLERY_CONFIG.maxDescription?'ひとことは100文字までです。':'');}
  async function api(params={},payload){
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(CONFIG.gasUrl))throw new Error('GAS URLを確認してください。');
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),payload?60000:30000);
    try{
      const url=CONFIG.gasUrl+(payload?'':'?'+new URLSearchParams(params));
      const response=await fetch(url,{method:payload?'POST':'GET',body:payload?new URLSearchParams(payload):undefined,credentials:'omit',redirect:'follow',signal:ctrl.signal});
      if(!response.ok)throw new Error('通信に失敗しました。');const data=await response.json();if(!data.ok)throw new Error(data.error||'処理できませんでした。');return data;
    }finally{clearTimeout(timer);}
  }
  async function decode(file){
    const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>GALLERY_CONFIG.maxPixels)throw new Error('画像の縦横サイズが大きすぎます。縮小してから選択してください。');return image;}finally{URL.revokeObjectURL(url);}
  }
  function resized(image,side,quality){
    const scale=Math.min(1,side/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');if(!context)throw new Error('このブラウザでは画像の準備ができません。');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    const url=canvas.toDataURL('image/jpeg',quality),data=url.split(',')[1];return {url,data,bytes:Math.floor(data.length*3/4)-(data.endsWith('==')?2:data.endsWith('=')?1:0),width:canvas.width,height:canvas.height};
  }
  function compressed(image,side,limit){for(const q of [.9,.8,.68,.55]){const result=resized(image,side,q);if(result.bytes<=limit)return result;}throw new Error('画像を軽くできませんでした。画像の寸法を小さくしてから選び直してください。');}
  el('illustration-file').addEventListener('change',async()=>{
    const version=++fileVersion;prepared=null;attempt=null;preparing=false;const preview=el('illustration-preview');preview.hidden=true;preview.removeAttribute('src');const input=el('illustration-file');input.setCustomValidity('');const file=input.files[0];
    if(!file){el('illustration-file-status').textContent='';controls();return;}
    preparing=true;controls();el('illustration-file-status').textContent='画像を準備しています…';
    try{
      if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('JPEG・PNG・WebPの画像を選択してください。');
      if(file.size>GALLERY_CONFIG.maxFileBytes)throw new Error('画像は2MBまでです。');
      const image=await decode(file),main=compressed(image,GALLERY_CONFIG.maxSide,GALLERY_CONFIG.maxImageBytes),thumbnail=compressed(image,GALLERY_CONFIG.thumbSide,GALLERY_CONFIG.maxThumbBytes);
      if(version!==fileVersion)return;prepared={main,thumbnail,token:crypto.randomUUID()};preview.src=thumbnail.url;preview.hidden=false;el('illustration-file-status').textContent=`準備できました（表示用 ${main.width} × ${main.height}px）。`;
    }catch(e){if(version!==fileVersion)return;input.setCustomValidity(e.message);el('illustration-file-status').textContent=e.message;}
    finally{if(version===fileVersion){preparing=false;controls();}}
  });
  function make(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
  async function imageData(id,size){
    if(CONFIG.mode==='demo'){const x=demoImages.get(id);if(!x)throw new Error('デモ画像がありません。');return x[size==='full'?'main':'thumbnail'].url;}
    const data=await api({action:'image',id,size});const limit=size==='full'?GALLERY_CONFIG.maxImageBytes:GALLERY_CONFIG.maxThumbBytes;
    if(data.mimeType!=='image/jpeg'||typeof data.data!=='string'||data.data.length>Math.ceil(limit/3)*4||! /^[A-Za-z0-9+/]+={0,2}$/.test(data.data))throw new Error('画像の応答形式を確認してください。');
    return 'data:image/jpeg;base64,'+data.data;
  }
  function pump(){while(activeImages<2&&queue.length){const job=queue.shift();if(job.epoch!==mediaEpoch||!job.node.isConnected)continue;activeImages++;job.run().finally(()=>{activeImages--;pump();});}}
  function enqueue(node,run){queue.push({node,run,epoch:mediaEpoch});pump();}
  function card(item){
    const article=make('article',undefined,'illustration-card'),button=make('button',undefined,'illustration-open');button.type='button';button.setAttribute('aria-label',`${item.title}を拡大する`);
    const placeholder=make('span','画像を読み込みます','illustration-placeholder'),img=make('img',undefined,'illustration-thumbnail');img.alt=item.altText||item.title;img.hidden=true;img.decoding='async';button.append(placeholder,img);
    const info=make('div',undefined,'illustration-info');info.append(make('h3',item.title),make('p',item.penName));if(item.description)info.append(make('p',item.description));
    const status=make('p','', 'illustration-load-status'),retry=make('button','画像を再読み込み','illustration-retry');retry.type='button';retry.hidden=true;article.append(button,info,status,retry);
    let loaded=false,loading=false;
    async function loadThumbnail(){
      if(loading||loaded)return;loading=true;retry.hidden=true;const epoch=mediaEpoch;
      enqueue(article,async()=>{try{
        const url=thumbs.get(item.id)||await imageData(item.id,'thumb');if(epoch!==mediaEpoch||!article.isConnected)return;
        thumbs.set(item.id,url);img.src=url;await img.decode();if(!article.isConnected)return;img.hidden=false;placeholder.hidden=true;loaded=true;status.textContent='';
      }catch(e){if(article.isConnected){placeholder.textContent='画像を表示できませんでした';status.textContent='公開状態や通信状況を確認してください。';retry.hidden=false;}}
      finally{loading=false;}});
    }
    retry.addEventListener('click',()=>{thumbs.delete(item.id);loadThumbnail();});button.addEventListener('click',()=>openDialog(item,button));
    article.loadThumbnail=loadThumbnail;return article;
  }
  function watch(node){if(observer)observer.observe(node);else node.loadThumbnail();}
  if('IntersectionObserver' in window)observer=new IntersectionObserver(observations=>{for(const o of observations)if(o.isIntersecting){observer.unobserve(o.target);o.target.loadThumbnail();}},{rootMargin:'250px'});
  function render(){
    observer?.disconnect();const nodes=entries.map(card);el('gallery-cards').replaceChildren(...nodes);nodes.forEach(watch);el('gallery-more').hidden=nextCursor===null;
    el('gallery-status').textContent=entries.length?`${entries.length}件のイラストを表示しています。`:'まだイラストはありません。';
  }
  async function loadGallery(append=false){
    started=true;const sequence=++listSequence;el('gallery-reload').disabled=true;el('gallery-more').disabled=true;el('gallery-status').textContent='イラスト一覧を読み込んでいます…';
    if(!append){mediaEpoch++;queue=[];thumbs.clear();dialogVersion++;if(dialog.open)dialog.close();el('illustration-dialog-image').removeAttribute('src');el('gallery-cards').replaceChildren();entries=[];nextCursor=null;}
    try{
      const data=CONFIG.mode==='demo'?{illustrations:demoEntries,nextCursor:null}:await api({action:'gallery',cursor:append&&nextCursor!==null?nextCursor:''});
      if(sequence!==listSequence)return;if(!Array.isArray(data.illustrations))throw new Error('一覧の応答形式を確認してください。');
      const merged=append?[...entries,...data.illustrations]:data.illustrations;entries=Array.from(new Map(merged.map(item=>[item.id,item])).values());nextCursor=data.nextCursor??null;render();
    }catch(e){if(sequence===listSequence)el('gallery-status').textContent='一覧を読み込めませんでした。「再読み込み」を押してください。';}
    finally{if(sequence===listSequence){el('gallery-reload').disabled=false;el('gallery-more').disabled=false;}}
  }
  async function openDialog(item,button){
    const version=++dialogVersion;lastFocus=button;el('illustration-dialog-title').textContent=item.title;el('illustration-dialog-author').textContent=item.penName;el('illustration-dialog-description').textContent=item.description||'';
    const img=el('illustration-dialog-image');img.hidden=true;img.removeAttribute('src');img.alt=item.altText||item.title;el('illustration-dialog-status').textContent='大きい画像を読み込んでいます…';if(!dialog.open)dialog.showModal();
    try{const url=await imageData(item.id,'full');if(version!==dialogVersion||!dialog.open)return;img.src=url;await img.decode();if(version!==dialogVersion||!dialog.open)return;img.hidden=false;el('illustration-dialog-status').textContent='';}
    catch{if(version===dialogVersion)el('illustration-dialog-status').textContent='画像を表示できませんでした。非表示・削除済み、または通信エラーの可能性があります。';}
  }
  el('illustration-dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialogVersion++;el('illustration-dialog-image').removeAttribute('src');lastFocus?.focus();});
  el('gallery-reload').addEventListener('click',()=>loadGallery());el('gallery-more').addEventListener('click',()=>loadGallery(true));
  el('illustration-description').addEventListener('input',validateText);
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||preparing||reason())return;validateText();if(!form.reportValidity())return;
    if(!prepared){el('illustration-feedback').textContent='画像を選択し、準備が終わるまでお待ちください。';return;}
    const data={penName:el('illustration-name').value.trim(),title:el('illustration-title').value.trim(),description:el('illustration-description').value.trim(),altText:el('illustration-alt').value.trim()};
    if(!data.penName||len(data.penName)>GALLERY_CONFIG.maxName||!data.title||len(data.title)>GALLERY_CONFIG.maxTitle||len(data.description)>GALLERY_CONFIG.maxDescription||!data.altText||len(data.altText)>GALLERY_CONFIG.maxAlt){el('illustration-feedback').textContent='入力内容と文字数を確認してください。';return;}
    const signature=JSON.stringify(data)+prepared.token;if(!attempt||attempt.signature!==signature)attempt={signature,id:crypto.randomUUID()};
    sending=true;controls();el('illustration-feedback').textContent='画像を送信しています。画面を閉じずにお待ちください。';const current=prepared;
    try{
      const result=CONFIG.mode==='demo'?{ok:true,illustration:{id:attempt.id,...data,width:current.main.width,height:current.main.height}}:await api({}, {...data,action:'illustration',consent:'true',requestId:attempt.id,imageData:current.main.data,thumbnailData:current.thumbnail.data});
      if(result.illustration&&!result.pending){const item=result.illustration;if(CONFIG.mode==='demo'){demoImages.set(item.id,current);demoEntries=[item,...demoEntries.filter(x=>x.id!==item.id)];}++listSequence;el('gallery-reload').disabled=false;el('gallery-more').disabled=false;thumbs.set(item.id,current.thumbnail.url);entries=[item,...entries.filter(x=>x.id!==item.id)];render();}
      form.reset();fileVersion++;prepared=null;attempt=null;el('illustration-preview').hidden=true;el('illustration-preview').removeAttribute('src');el('illustration-file-status').textContent='';validateText();
      el('illustration-feedback').textContent=CONFIG.mode==='demo'?'このページ内にデモ表示しました。運営には送信されず、ページを閉じると消えます。':result.pending?'受け付けました。現在は非表示になっています。':'イラストを掲載しました。';
    }catch(e){el('illustration-feedback').textContent=`送信結果を確認できませんでした。${e.name==='AbortError'?'通信がタイムアウトしました。':e.message} 入力を変えずにもう一度送信すると、同じ投稿IDで確認します。`;}finally{sending=false;controls();}
  });
  el('illustration-mode-note').textContent=CONFIG.mode==='demo'?'デモ版です。画像は運営に届かず、このページを閉じると消えます。':'送信したイラストはすぐに掲載されます。運営判断で非表示・削除にする場合があります。';
  controls();validateText();setInterval(controls,30000);
  if('IntersectionObserver' in window){const startObserver=new IntersectionObserver(items=>{if(items.some(i=>i.isIntersecting)){startObserver.disconnect();if(!started)void loadGallery();}},{rootMargin:'300px'});startObserver.observe(el('gallery'));}else void loadGallery();
})();
