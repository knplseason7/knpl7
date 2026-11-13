/* KNPL-7 Skill Rating – detailed side-by-side comparison report (built in the browser with pdf-lib).
   No player data lives in this file: it is passed in from the unlocked page. */
(function(){
'use strict';
const ALLW={KNPL4:.70,KNPL5:.85,KNPL6:1,SPL6:.70,SPL7:.85,SPL8:1,CBL4:.70,CBL5:.85,CBL6:1,NPL3:.85,NPL4:1,YPL14:.70,YPL15:.85,YPL16:1};
const MU=1.3289703617415451,REFP=3.3343340625,REFW=0.5211337513061651,REFA=170.11750000000004;
const BANDS=[['Conqueror Vanguard','85–100'],['Conqueror Core','75–84'],['Dominator Apex','63–74'],['Dominator Core','50–62'],['Rising Star Elite','25–49'],['Rising Star Core','0–24']];
const BAND=Object.fromEntries(BANDS);
const SL=k=>k.replace(/(\D+)(\d+)/,'$1-$2');
const f=(v,d=2)=>(Math.round(v*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);
const hex=h=>{const n=parseInt(h.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
const SYMC='≥≤Σ→≡',ZAPC='✔✘★';
const SAFE=/[\x20-\x7e -ÿ–—‘’“”•…€]/;

window.KNPLReport=async function(o){
  const {PDFDocument,StandardFonts,rgb}=o.PDFLib;
  const C=h=>rgb(...hex(h));
  const NAVY=C('#0b1f3a'),NAVY2=C('#16386b'),OR=C('#f28c28'),OR2=C('#c96a10'),GREEN=C('#1d7a44'),INK=C('#14213d'),GREY=C('#4a5568'),DIM=C('#7a859c'),
        BOX=C('#f4f6fa'),WHY=C('#fff6ea'),LINE=C('#e3e8f0'),ZEB=C('#f6f8fc'),TOT=C('#fff3e4'),COLB=C('#dfe5ef'),COLBG=C('#fbfcfe'),WH=rgb(1,1,1),PALE=C('#cfe0ff'),PEACH=C('#ffd2a8'),STEPB=C('#b9c4d8'),WTH=C('#e8eef9');
  const doc=await PDFDocument.create();
  const F=await doc.embedFont(StandardFonts.Helvetica),B=await doc.embedFont(StandardFonts.HelveticaBold),
        SY=await doc.embedFont(StandardFonts.Symbol);
  let logo=null;if(o.logo){try{logo=await doc.embedPng(o.logo)}catch(e){}}
  const P=o.players;const N=P.length;
  const land=N>=4;const W=land?841.89:595.28,H=land?595.28:841.89;const M=22.7;
  const FS=N<=2?7.8:7.1;           // table font size
  const HEADH=50,FOOTH=26;const TOP=H-HEADH-10,BOT=FOOTH+8;
  const pages=[];let pg=null,y=0;

  /* ---------- text primitives ---------- */
  const clean=s=>String(s).replace(/✗/g,'✘').replace(/₹/g,'Rs ').replace(/[  ]/g,' ');
  const fontFor=(ch,base)=>SYMC.includes(ch)?SY:SAFE.test(ch)?base:null;
  function runs(t,base){const out=[];for(const ch of clean(t)){if(ZAPC.includes(ch)){out.push({g:ch});continue}let fo=fontFor(ch,base);let c=ch;if(!fo){fo=base;c='?'}
      const l=out[out.length-1];if(l&&l.f===fo)l.t+=c;else out.push({f:fo,t:c})}return out}
  const tw=(t,sz,base)=>runs(t,base).reduce((a,r)=>a+(r.g?sz*.95:r.f.widthOfTextAtSize(r.t,sz)),0);
  function glyph(g,x,yy,sz,color){const u=sz*.95;const L=(x1,y1,x2,y2,t)=>pg.drawLine({start:{x:x+x1*u,y:yy+y1*u},end:{x:x+x2*u,y:yy+y2*u},thickness:u*t,color,lineCap:1});
    if(g==='✔'){L(.08,.38,.36,.08,.15);L(.36,.08,.88,.76,.15)}
    else if(g==='✘'){L(.18,.08,.72,.68,.13);L(.72,.08,.18,.68,.13)}
    else{let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.2:.47;d+=(i?' L ':'M ')+(0.48+r*Math.cos(a)).toFixed(3)+' '+(0.47+r*Math.sin(a)).toFixed(3)}
      pg.drawSvgPath(d+' Z',{x,y:yy+u*.85,scale:u,color,borderWidth:0})}}
  function txt(t,x,yy,sz,base,color){for(const r of runs(t,base)){if(r.g){glyph(r.g,x,yy,sz,color);x+=sz*.95;continue}pg.drawText(r.t,{x,y:yy,size:sz,font:r.f,color});x+=r.f.widthOfTextAtSize(r.t,sz)}return x}
  function fit(t,sz,base,w){t=clean(t);if(tw(t,sz,base)<=w)return t;while(t.length>1&&tw(t+'…',sz,base)>w)t=t.slice(0,-1);return t+'…'}
  /* rich segments: {t,b,c,pill,big} ; wrap into lines */
  function wrapRich(segs,sz,w){
    const toks=[];segs.forEach(s=>{if(s.pill){toks.push({...s,sp:true});return}
      String(s.t).split(/(\s+)/).forEach(p=>{if(p==='')return;toks.push({...s,t:p,ws:/^\s+$/.test(p)})})});
    const lines=[];let cur=[],cw=0;
    const tokW=k=>k.pill?tw(k.t,k.big?sz*1.7:sz*1.12,B)+(k.big?14:9):tw(k.t,k.small?sz*.92:sz,k.b?B:F);
    toks.forEach(k=>{if(k.ws&&!cur.length)return;const kw=tokW(k);
      if(cw+kw>w&&cur.length&&!k.ws){while(cur.length&&cur[cur.length-1].ws)cur.pop();lines.push(cur);cur=[];cw=0}
      if(k.ws&&!cur.length)return;cur.push(k);cw+=kw});
    while(cur.length&&cur[cur.length-1].ws)cur.pop();if(cur.length)lines.push(cur);
    return lines.map(l=>({toks:l,h:l.some(k=>k.big)?sz*2.3:l.some(k=>k.pill)?sz*1.75:sz*1.5}));
  }
  function drawRichLine(line,x,yb,sz,dc){ // yb = baseline
    for(const k of line.toks){
      if(k.pill){const s=k.big?sz*1.7:sz*1.12;const wdt=tw(k.t,s,B)+(k.big?14:9);
        pg.drawRectangle({x,y:yb-(k.big?4:2.6),width:wdt,height:s+(k.big?6:4.4),color:k.bg||GREEN,borderRadius:3});
        txt(k.t,x+(k.big?7:4.5),yb-(k.big?.4:0),s,B,WH);x+=wdt;continue}
      const s=k.small?sz*.92:sz;x=txt(k.t,x,yb,s,k.b?B:F,k.c||dc||INK)}
  }
  /* ---------- page frame ---------- */
  function newPage(){
    pg=doc.addPage([W,H]);pages.push(pg);
    pg.drawRectangle({x:0,y:H-HEADH,width:W,height:HEADH,color:NAVY});
    pg.drawRectangle({x:W*0.55,y:H-HEADH,width:W*0.45,height:HEADH,color:NAVY2,opacity:.55});
    pg.drawRectangle({x:0,y:H-HEADH-4,width:W,height:4,color:OR});
    let lx=M;
    if(logo){pg.drawCircle({x:M+18,y:H-HEADH/2,size:18,color:WH});pg.drawImage(logo,{x:M+3,y:H-HEADH/2-15,width:30,height:30});lx=M+44}
    txt('KNPL-7 · TECHNICAL & EVALUATION TEAM',lx,H-19,7.2,B,C('#f6b26b'));
    const x2=txt('Skill Rating – ',lx,H-38,15.5,B,WH);txt('Detailed comparison',x2,H-38,15.5,B,OR);
    const r1='STRICTLY CONFIDENTIAL',r2='Core Committee & Franchise Owners';
    txt(r1,W-M-tw(r1,7,B),H-16,7,B,PEACH);txt(r2,W-M-tw(r2,7,B),H-26,7,B,PEACH);
    y=TOP;
  }
  function footers(){
    const nm=P.map(p=>p.n+' ('+p.i+')');const who=nm.length>1?nm.slice(0,-1).join(', ')+' and '+nm[nm.length-1]:nm[0];
    const l1=who+' side by side. Provisional – recalculated after NPL-5 for all players.';
    const l2='Generated '+o.date+(o.who?' · '+o.who:'')+' · Do not share outside the Core Committee and Franchise Owners.';
    const rt='Krishnadas – 99862 18725 · Team KNPL';
    pages.forEach((p,i)=>{pg=p;
      p.drawRectangle({x:0,y:0,width:W,height:FOOTH,color:NAVY});
      const rw=tw(rt,6.8,B);
      txt(fit(l1,6.6,B,W-2*M-rw-20),M,FOOTH-10.5,6.6,B,PALE);txt(fit(l2,6,F,W-2*M-rw-20),M,FOOTH-19.5,6,F,PALE);
      txt(rt,W-M-rw,FOOTH-14.5,6.8,B,WH);
      const pn='Page '+(i+1)+' of '+pages.length;txt(pn,W-M-tw(pn,7,B),H-36,7,B,PEACH)});
  }
  const need=h=>{if(y-h<BOT)newPage()};
  /* ---------- full-width blocks ---------- */
  function secHead(no,title,wt,col,first){
    if(first&&pages.length)newPage();else{y-=4;need(34)}
    const c=C(col);
    pg.drawRectangle({x:M,y:y-24,width:24,height:24,color:c,borderRadius:4});
    const nw=tw(no,15,B);txt(no,M+12-nw/2,y-18.5,15,B,WH);
    txt(title,M+32,y-18.5,15.5,B,NAVY);
    if(wt){const ww=tw(wt,8,B)+14;pg.drawRectangle({x:W-M-ww,y:y-20,width:ww,height:16,color:c,borderRadius:4});txt(wt,W-M-ww+7,y-14.6,8,B,WH)}
    y-=31;return c;
  }
  function twoBoxes(what,why){
    const gap=7,bw=(W-2*M-gap)/2,sz=8;
    const A=wrapRich([{t:'WHAT IT MEASURES  ',b:1,c:OR2,small:1},...what],sz,bw-14),Bl=wrapRich([{t:'WHY IT MATTERS  ',b:1,c:OR2,small:1},...why],sz,bw-17);
    const h=Math.max(A.reduce((a,l)=>a+l.h,0),Bl.reduce((a,l)=>a+l.h,0))+10;need(h);
    pg.drawRectangle({x:M,y:y-h,width:bw,height:h,color:BOX,borderRadius:5});
    pg.drawRectangle({x:M+bw+gap,y:y-h,width:bw,height:h,color:WHY,borderRadius:5});pg.drawRectangle({x:M+bw+gap,y:y-h,width:2.8,height:h,color:OR});
    let yy=y-5;A.forEach(l=>{yy-=l.h;drawRichLine(l,M+7,yy+l.h*.3,sz)});
    yy=y-5;Bl.forEach(l=>{yy-=l.h;drawRichLine(l,M+bw+gap+10,yy+l.h*.3,sz)});
    y-=h+7;
  }
  function fx(segs){const sz=8.2;const L=wrapRich(segs.map(s=>({...s,b:1})),sz,W-2*M-16);const h=L.reduce((a,l)=>a+l.h,0)+9;need(h);
    pg.drawRectangle({x:M,y:y-h,width:W-2*M,height:h,color:NAVY,borderRadius:5});let yy=y-4.5;L.forEach(l=>{yy-=l.h;drawRichLine(l,M+8,yy+l.h*.3,sz,WH)});y-=h+7}
  function note(segs,sz=7.8){const L=wrapRich(segs,sz,W-2*M);const h=L.reduce((a,l)=>a+l.h,0);need(h);let yy=y;L.forEach(l=>{yy-=l.h;drawRichLine(l,M,yy+l.h*.3,sz,GREY)});y-=h+6}
  function wtab(){
    const rows=[['Season weight','KNPL','SPL','CBL','YPL','NPL'],['1.00 latest','KNPL-6','SPL-8','CBL-6','YPL-16','NPL-4'],['0.85 previous','KNPL-5','SPL-7','CBL-5','YPL-15','NPL-3'],['0.70 one before','KNPL-4','SPL-6','CBL-4','YPL-14','–']];
    const rh=12.5,h=rh*4;need(h+4);const cw=[1.6,1,1,1,1,1];const tot=cw.reduce((a,b)=>a+b);const u=(W-2*M)/tot;
    rows.forEach((r,i)=>{const yy=y-rh*(i+1);if(!i)pg.drawRectangle({x:M,y:yy,width:W-2*M,height:rh,color:WTH});
      else pg.drawLine({start:{x:M,y:yy},end:{x:W-M,y:yy},thickness:.6,color:LINE});
      let x=M;r.forEach((c,j)=>{if(i&&!j){const [a,...b]=c.split(' ');const x2=txt(a,x+5,yy+4,7.6,B,INK);txt(' '+b.join(' '),x2,yy+4,7.6,F,INK)}else txt(c,x+5,yy+4,7.6,i?F:B,i?INK:NAVY2);x+=cw[j]*u})});
    y-=h+5;
  }
  /* ---------- side-by-side columns (paged) ---------- */
  // item: {t:'name',p} | {t:'th',cells,w,al} | {t:'tr',cells,tot,z,th} | {t:'step',line,first,last} | {t:'gap'}
  function tableItems(head,widths,align,rows,tot,cw){
    const th={t:'th',cells:head,w:widths,al:align};
    const sum=widths.reduce((a,b)=>a+b);th.px=widths.map(v=>v/sum*(cw-2));
    th.lines=head.map((c,j)=>wrapPlain(c,FS*.92,B,th.px[j]-4));th.h=Math.max(...th.lines.map(l=>l.length))*FS*1.05+5;
    const mk=(r,o)=>{const tr={t:'tr',cells:r,th,...o};const span=j=>{let w=th.px[j];if(tr.tot&&j===0)for(let k=1;k<r.length&&String(r[k])==='';k++)w+=th.px[k];return w};
      tr.sp=r.map((c,j)=>span(j));tr.lines=r.map((c,j)=>{const v=String(c).replace(/^\*/,'');const fo=(tr.tot&&j===0)||/^\*/.test(String(c))?B:F;return tw(v,FS,fo)<=tr.sp[j]-4?[v]:wrapPlain(v,FS,fo,tr.sp[j]-4).slice(0,3)});
      tr.h=Math.max(...tr.lines.map(l=>l.length))*(FS+1.6)+4.4;return tr};
    const it=[th];rows.forEach((r,i)=>it.push(mk(r,{z:i%2})));if(tot)it.push(mk(tot,{tot:1}));it.push({t:'gap',h:6});return it;
  }
  function wrapPlain(t,sz,font,w){const ws=clean(t).split(' ');const out=[];let l='';ws.forEach(x=>{const tr=l?l+' '+x:x;if(tw(tr,sz,font)<=w||!l)l=tr;else{out.push(l);l=x}});if(l)out.push(l);return out}
  function stepItems(lines,cw){const sz=FS*1.04;const out=[];const L=[];lines.forEach(segs=>wrapRich(segs,sz,cw-12).forEach(l=>L.push(l)));
    L.forEach((l,i)=>out.push({t:'step',line:l,sz,first:!i,last:i===L.length-1,h:l.h+(i?0:4)+(i===L.length-1?4:0)}));return out}
  const ih=it=>it.t==='name'?20:it.h;
  function drawItem(it,x,yy,cw){ // yy = top
    if(it.t==='name'){const s=it.contd?' (contd.)':'';let x2=txt(fit(it.p.n,10.5,B,cw-tw('KNPL7-'+it.p.i+s,7,B)-10),x,yy-12,10.5,B,NAVY);txt('  KNPL7-'+it.p.i+s,x2,yy-12,7,B,OR2);
      pg.drawRectangle({x,y:yy-17,width:cw,height:1.4,color:OR});return}
    if(it.t==='th'){pg.drawRectangle({x,y:yy-it.h,width:cw,height:it.h,color:NAVY2});let cx=x+1;
      it.cells.forEach((c,j)=>{const lw=it.px[j];const ls=it.lines[j];ls.forEach((l,k)=>{const lwid=tw(l,FS*.92,B);const tx=it.al[j]==='l'?cx+2:it.al[j]==='c'?cx+(lw-lwid)/2:cx+lw-2-lwid;txt(l,tx,yy-FS*1.05*(k+1)-0.5,FS*.92,B,WH)});cx+=lw});return}
    if(it.t==='tr'){const h=it.h;const th=it.th;
      if(it.tot){pg.drawRectangle({x,y:yy-h,width:cw,height:h,color:TOT});pg.drawLine({start:{x,y:yy},end:{x:x+cw,y:yy},thickness:1.2,color:NAVY2})}
      else{if(it.z)pg.drawRectangle({x,y:yy-h,width:cw,height:h,color:ZEB});pg.drawLine({start:{x,y:yy-h},end:{x:x+cw,y:yy-h},thickness:.5,color:LINE})}
      let cx=x+1;it.cells.forEach((c,j)=>{const lw=th.px[j],sw=it.sp[j];const bold=(it.tot&&j===0)||/^\*/.test(String(c));const fo=bold?B:F;
        if(String(c)===''&&!(it.tot&&j>0&&it.sp[0]>th.px[0]&&false)){cx+=lw;return}
        it.lines[j].forEach((l,k)=>{const v=fit(l,FS,fo,sw-4);const vw=tw(v,FS,fo);const tx=th.al[j]==='l'?cx+2:th.al[j]==='c'?cx+(lw-vw)/2:cx+lw-2-vw;
          const col=v==='✔'?GREEN:v==='✘'?C('#b23b3b'):v==='★'?OR:INK;txt(v,tx,yy-FS-1.6-k*(FS+1.6),FS,fo,col)});cx+=lw});return}
    if(it.t==='step'){pg.drawRectangle({x,y:yy-it.h,width:cw,height:it.h,color:WH});
      pg.drawLine({start:{x,y:yy},end:{x,y:yy-it.h},thickness:.7,color:STEPB,dashArray:[2,1.5]});pg.drawLine({start:{x:x+cw,y:yy},end:{x:x+cw,y:yy-it.h},thickness:.7,color:STEPB,dashArray:[2,1.5]});
      if(it.first)pg.drawLine({start:{x,y:yy},end:{x:x+cw,y:yy},thickness:.7,color:STEPB,dashArray:[2,1.5]});
      if(it.last)pg.drawLine({start:{x,y:yy-it.h},end:{x:x+cw,y:yy-it.h},thickness:.7,color:STEPB,dashArray:[2,1.5]});
      drawRichLine(it.line,x+6,yy-(it.first?4:0)-it.line.h+it.line.h*.32,it.sz);return}
  }
  function columns(cols,cw,gap){ // cols: arrays of items (first item = name)
    const idx=cols.map(()=>0);const PAD=5;
    while(cols.some((c,i)=>idx[i]<c.length)){
      let avail=y-BOT-2*PAD;if(avail<70){newPage();continue}
      const segs=cols.map((c,i)=>{const s=[];let h=0;let k=idx[i];if(k>=c.length)return s;
        if(k>0){const nm={...c[0],contd:1};s.push(nm);h+=ih(nm);if(c[k].t==='tr'&&c[k-1]!==c[k].th){s.push(c[k].th);h+=ih(c[k].th)}}
        while(k<c.length&&h+ih(c[k])<=avail){
          // keep a table header with at least one row
          if(c[k].t==='th'&&k+1<c.length&&h+ih(c[k])+ih(c[k+1])>avail)break;
          s.push(c[k]);h+=ih(c[k]);k++}
        if(k===idx[i]&&avail>=TOP-BOT-2*PAD-1){s.push(c[k]);k++} // oversize safety
        s.k=k;s.h=h;return s});
      const progress=segs.some((s,i)=>s.k>idx[i]);if(!progress){newPage();continue}
      const mh=Math.max(...segs.map(s=>s.h||0));
      segs.forEach((s,i)=>{const x=M+i*(cw+gap);if(!s.length)return;
        pg.drawRectangle({x,y:y-mh-2*PAD,width:cw,height:mh+2*PAD,color:COLBG,borderColor:COLB,borderWidth:1.1,borderRadius:6});
        let yy=y-PAD;s.forEach(it=>{drawItem(it,x+PAD,yy,cw-2*PAD);yy-=ih(it)});idx[i]=s.k});
      y-=mh+2*PAD+6;
      if(cols.some((c,i)=>idx[i]<c.length))newPage();
    }
  }
  const GAP=7;const CW=(W-2*M-GAP*(N-1))/N;const IW=CW-10;
  const sbs=build=>columns(P.map(p=>[{t:'name',p},...build(p)]),CW,GAP);

  /* ---------- per-player data ---------- */
  P.forEach(p=>{const d=p.det;const S=new Map();
    d.L.forEach(m=>{const [k,rnd,op,res,mvp,rk,pom]=m;if(!S.has(k))S.set(k,{k,w:ALLW[k],n:0,mvp:0,won:0,mwc:0,cons:0,pom:[]});const s=S.get(k);
      s.n++;s.mvp+=mvp||0;s.won+=res==='W'?1:0;s.mwc+=(res==='W'&&rk&&rk<=2)?1:0;s.cons+=(mvp||0)>=1?1:0;if(pom)s.pom.push(rnd)});
    p.S=[...S.values()];p.raw=d.raw;p.mm=d.mm});
  const pill=(t,big)=>({t,pill:1,big});
  const capNote=(v,ref,score)=>v/ref*100>100.005?[{t:' (capped at 100)',c:DIM,small:1}]:[];

  /* ---------- 1 Performance ---------- */
  newPage();
  secHead('1','Performance','55% of Skill Rating','#16386b');
  twoBoxes([{t:'Average CricHeroes MVP points per match (batting + bowling + fielding), with recent seasons counting more.'}],
    [{t:'The most direct measure of what a player brings to every match. An average, not a total, so playing more matches alone does not raise it.'}]);
  fx([{t:'Weighted MVP = Σ (season MVP × season weight)  ·  Weighted matches = Σ (season matches × season weight)  ·  Adjusted average = (Weighted MVP + 8 × 1.329) ÷ (Weighted matches + 8)  ·  Score = Adjusted average ÷ 3.334 × 100'}]);
  note([{t:'Fair start:',b:1},{t:' 8 matches at the league average (1.329 MVP per match) are added for every player so a few unusual matches cannot give an extreme average. '},{t:'Reference 3.334',b:1},{t:' = mean of the top 16 adjusted averages × 1.05 (reaching it = 100).'}]);
  wtab();note([{t:'Mat. = matches · Wt = season weight · Wtd = weighted (value × weight)'}],7.2);
  sbs(p=>{const x=p.x;const rows=p.S.map(s=>[SL(s.k),s.n,f(s.mvp),f(s.w),f(s.mvp*s.w),f(s.n*s.w)]);
    return [...tableItems(['Season','Mat.','MVP','Wt','Wtd MVP','Wtd Mat.'],[1.3,.8,1,.8,1.1,1.1],['l','r','r','r','r','r'],rows,['Total',x.m,f(p.raw),'','*'+f(x.ws),'*'+f(x.wm)],IW),
      ...stepItems([[{t:'Simple average = '+f(p.raw)+' ÷ '+x.m+' = '+f(p.raw/x.m,3)+' MVP per match '},{t:'(for reference only)',c:DIM,small:1}],
        [{t:'Fair start: + 8 matches × 1.329 = '},{t:'10.63',b:1},{t:' MVP points and '},{t:'8',b:1},{t:' matches'}],
        [{t:'Adjusted average = ('+f(x.ws)+' + 10.63) ÷ ('+f(x.wm)+' + 8)'}],
        [{t:'= '+f(x.ws+8*MU)+' ÷ '+f(x.wm+8)+' = '},{t:f(x.adj,3),b:1}],
        [{t:'Score = '+f(x.adj,3)+' ÷ 3.334 × 100 = '},pill(f(x.P)),...capNote(x.adj,REFP)]],IW)]});

  /* ---------- 2 Win Impact ---------- */
  secHead('2','Win Impact','15% of Skill Rating','#c96a10',true);
  twoBoxes([{t:'Matches where his team '},{t:'won',b:1},{t:' and he was among '},{t:"his team's top 2 MVP scorers",b:1},{t:' in that match (a match-winning contribution).'}],
    [{t:'Cricket is about winning. It rewards contributions that decide results, not numbers in a losing cause. Counted on actual matches (no season weight).'}]);
  fx([{t:'Score = (Match-winning contributions ÷ Matches played) ÷ 0.521 × 100  (maximum 100)'}]);
  note([{t:'Reference 0.521',b:1},{t:" = a little above the best players' rate (reaching it = 100). The match-by-match record at the end shows each ✔."}]);
  sbs(p=>{const x=p.x;const rate=x.mwc/x.m;
    return [...tableItems(['Season','Matches','Team won','Match-winning contributions'],[1.2,1,1,1.6],['l','r','r','r'],p.S.map(s=>[SL(s.k),s.n,s.won,s.mwc]),['Total',x.m,p.S.reduce((a,s)=>a+s.won,0),'*'+x.mwc],IW),
      ...stepItems([[{t:'Rate = '+x.mwc+' ÷ '+x.m+' = '},{t:f(rate,3),b:1}],[{t:'Score = '+f(rate,3)+' ÷ 0.521 × 100 = '},pill(f(x.W)),...capNote(rate,REFW)]],IW)]});

  /* ---------- 3 Awards ---------- */
  secHead('3','Awards','10% of Skill Rating','#1d7a44',true);
  twoBoxes([{t:"Player of the Match awards and the tournament's Heroes tab awards on CricHeroes, each × its season weight."}],
    [{t:'An independent judgement by the tournament that captures big-match moments numbers may miss. Kept at 10% so it adds recognition without outweighing performance.'}]);
  fx([{t:'Score = (Weighted PoM points + Weighted Heroes points) ÷ 170.1 × 100  (maximum 100)'}]);
  note([{t:'PoM:',b:1},{t:' 5 points; 8 in knockout rounds whose name contains "Final" (pre-quarter, quarter, semi, final). '},{t:'Heroes:',b:1},{t:' Player of the Tournament 15 · Orange/Purple Cap 12 · Best Batter/Bowler 10 · Best WK/Fielder/Most Catches 8 · Emerging/Captain/Most 4s/6s/Dots 5 · others 3. '},{t:'Reference 170.1',b:1},{t:' = a little above the top award totals.'}]);
  sbs(p=>{const x=p.x;let tp=0;const pr=[];p.S.forEach(s=>s.pom.forEach(r=>{const pts=/Final/.test(r)?8:5;tp+=pts*s.w;pr.push([SL(s.k),r,pts,f(s.w),f(pts*s.w)])}));
    const hr=p.det.her.map(([k,a,pts])=>[SL(k),a.replace(' (Most Runs)','').replace(' (Most Wickets)','').replace(' in Tournament',''),pts,f(ALLW[k]),f(pts*ALLW[k])]);
    const tot=x.awP+x.awH;
    return [...tableItems(['Season','PoM round','Pts','Wt','Wtd'],[1.1,1.8,.6,.7,.8],['l','l','r','r','r'],pr.length?pr:[['–','No PoM','','','0.00']],['PoM total','','','','*'+f(x.awP)],IW),
      ...tableItems(['Season','Heroes award','Pts','Wt','Wtd'],[1.1,1.8,.6,.7,.8],['l','l','r','r','r'],hr.length?hr:[['–','No Heroes award','','','0.00']],['Heroes total','','','','*'+f(x.awH)],IW),
      ...stepItems([[{t:'Award points = '+f(x.awP)+' (PoM) + '+f(x.awH)+' (Heroes) = '},{t:f(tot),b:1}],[{t:'Score = '+f(tot)+' ÷ 170.1 × 100 = '},pill(f(x.Aw)),...capNote(tot,REFA)]],IW)]});

  /* ---------- 4 Consistency + 5 Experience ---------- */
  secHead('4','Consistency','10% of Skill Rating','#6a3d9a',true);
  twoBoxes([{t:'Share of matches in which he scored at least 1 MVP point.'}],[{t:'Teams need players who deliver match after match. A percentage is equally fair to few or many matches.'}]);
  fx([{t:'Score = Matches with MVP ≥ 1 ÷ Matches played × 100'}]);
  sbs(p=>{const x=p.x;return [...tableItems(['Season','Matches','MVP ≥ 1','MVP below 1'],[1.2,1,1,1.1],['l','r','r','r'],p.S.map(s=>[SL(s.k),s.n,s.cons,s.n-s.cons]),['Total',x.m,'*'+x.cons,x.m-x.cons],IW),
    ...stepItems([[{t:'Score = '+x.cons+' ÷ '+x.m+' × 100 = '},pill(f(x.C))]],IW)]});
  secHead('5','Experience','10% of Skill Rating','#2a7ab0');
  twoBoxes([{t:'Matches in the playing XI in the last 3 seasons of KNPL and the qualifying leagues.'}],[{t:'Experience counts under pressure. Capped at 30 matches and only 10%, so a long career cannot outweigh current ability.'}]);
  fx([{t:'Score = Matches played ÷ 30 × 100  (maximum 100)'}]);
  sbs(p=>{const x=p.x;return stepItems([[{t:'Matches in playing XI = '+p.S.map(s=>s.n).join(' + ')+' = '},{t:String(x.m),b:1},{t:' (by season, as in the Consistency table)',c:DIM,small:1}],
    [{t:'Score = '+x.m+' ÷ 30 × 100 = '},pill(f(x.E)),...(x.m>30?[{t:' (capped at 100)',c:DIM,small:1}]:[])]],IW)});

  /* ---------- Final ---------- */
  secHead('=','Final Skill Rating','Total of the 5 parts','#c96a10',true);
  fx([{t:'Skill Rating = 0.55 × Performance + 0.15 × Win Impact + 0.10 × Awards + 0.10 × Consistency + 0.10 × Experience → rounded to a whole number'}]);
  sbs(p=>{const x=p.x;const parts=[['Performance',55,x.P],['Win Impact',15,x.W],['Awards',10,x.Aw],['Consistency',10,x.C],['Experience',10,x.E]];
    const tot=parts.reduce((a,[,w,v])=>a+w*v/100,0);const ok=p.mm>=8;
    const cat=[{t:'Category = '},{t:p.c,b:1},{t:' (band '+(BAND[p.c]||'')+')'}];
    return [...tableItems(['Part','Weight','Score','Points (score × weight)'],[1.5,.9,.9,1.5],['l','r','r','r'],parts.map(([n,w,v])=>[n,w+'%',f(v),'*'+f(w*v/100)]),['Total','100%','','*'+f(tot)],IW),
      ...stepItems([[{t:'Skill Rating = '+f(tot)+' → rounded = '},pill(String(p.s),1)],
        [{t:'MVP matches = '+p.mm+' (8 or more needed) '},{t:ok?'✔':'✘',b:1,c:ok?GREEN:C('#b23b3b')}],
        ...(x.rule?[[{t:x.rule+' → placed in Rising Star Elite',c:OR2,b:1}]]:[]),cat],IW)]});
  // category bands grid
  {const cols=3,gap=6,cw=(W-2*M-gap*(cols-1))/cols,rh=15;need(rh*2+gap+22);
   BANDS.forEach(([n,b],i)=>{const r=Math.floor(i/cols),c=i%cols;const x=M+c*(cw+gap),yy=y-r*(rh+4)-rh;
     pg.drawRectangle({x,y:yy,width:cw,height:rh,color:BOX,borderRadius:4});txt(n,x+7,yy+4.6,7.8,B,INK);const bw=tw(b,7.8,B);txt(b,x+cw-7-bw,yy+4.6,7.8,B,OR2)});
   y-=rh*2+4+8;}
  note([{t:'Conqueror and Dominator need 8 or more MVP matches; otherwise Rising Star Elite. Bands are fixed – no quotas.'}]);
  // where the difference comes from
  if(o.keyDiffs&&o.keyDiffs.length){y-=4;need(40);txt('Where the difference comes from',M,y-12,11,B,NAVY);y-=18;
    o.keyDiffs.forEach(t=>{const L=wrapRich([{t}],7.9,W-2*M-12);const h=L.reduce((a,l)=>a+l.h,0);need(h);let yy=y;
      L.forEach((l,i)=>{yy-=l.h;if(!i)pg.drawCircle({x:M+3,y:yy+l.h*.3+2.6,size:1.7,color:OR});drawRichLine(l,M+10,yy+l.h*.3,7.9)});y-=h+1});y-=4}

  /* ---------- Match-by-match ---------- */
  const MLH=[{t:'Team rank',b:1},{t:' = his MVP rank among his own team in that match. '},{t:'Win contr.',b:1},{t:' ✔ = team won and rank 1 or 2 (Part 2). '},{t:'MVP ≥ 1',b:1},{t:' ✔ / ✘ (Part 4). ★ = Player of the Match (Part 3).'}];
  secHead('≡','Match-by-match record','CricHeroes data','#16386b',true);note(MLH);
  P.forEach((p,pi)=>{
    const rows=p.det.L.map(([k,rnd,op,res,mvp,rk,pom])=>[SL(k),rnd,op,{W:'Won',L:'Lost',NR:'NR',T:'Tied'}[res]||res,f(mvp||0),rk||'–',(res==='W'&&rk&&rk<=2)?'✔':'',(mvp||0)>=1?'✔':'✘',pom?'★':'']);
    const it=tableItems(['Season','Round','Opponent','Result','MVP','Team rank','Win contr.','MVP ≥ 1','PoM'],[1,1.7,2.6,.8,.8,.9,.9,.8,.6],['l','l','l','c','r','c','c','c','c'],rows,null,W-2*M-10);
    columns([[{t:'name',p:{...p,n:p.n+'  ·  '+p.x.m+' matches'}},...it]],W-2*M,0);
  });
  footers();
  doc.setTitle('KNPL-7 Skill Rating – Detailed comparison');doc.setAuthor('Team KNPL – Technical & Evaluation Team');doc.setSubject('Strictly confidential – '+P.map(p=>'KNPL7-'+p.i).join(', '));
  return doc.save();
};
})();
