/* Man's Last Stand: Multiplayer (co-op expeditions + trading).
   Peer-to-peer (WebRTC via PeerJS). The host relays and orders inputs; every player simulates the whole
   battle with the same seeded random numbers (deterministic lockstep) and the clients compare state hashes. */
(function(){
"use strict";
const M=MP,el=id=>document.getElementById(id);
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const VER="1:"+Object.keys(AR).length+":"+Object.keys(P).length+":"+Object.keys(B).length;
const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const TYPES=new Set(["Junk",...Object.values(AR).flatMap(a=>Object.keys(a.w||{}))]);
const num=(x,lo,hi,d)=>{x=+x;return Number.isFinite(x)?Math.min(hi,Math.max(lo,x)):d||0};
Object.assign(M,{phase:"off",host:false,room:"",links:[],players:[],cfg:{area:"wasteland",len:5,mode:0},sel:[],ready:false,name:LS("ufmpn")||"Player"+Math.floor(NR()*900+100),err:"",info:"",tr:null,seq:0,hs:{},maxPer:2,joinCode:"",rng:null,rc:0,link:null});
M.hid="p0";
/* ---------- transports ---------- */
const loadPeer=()=>window.Peer?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js";s.onload=ok;s.onerror=()=>no(new Error("The PeerJS connection library could not be loaded (offline or blocked)."));document.head.appendChild(s)});
const wrapC=c=>{const l={send:m=>{try{c.send(m)}catch(e){}},close:()=>{try{c.close()}catch(e){}},onmsg:null,onclose:null};c.on("data",d=>l.onmsg&&l.onmsg(d));c.on("close",()=>l.onclose&&l.onclose());c.on("error",()=>l.onclose&&l.onclose());return l};
const peerNet={
host(code,ok,onlink,err){loadPeer().then(()=>{const pr=new Peer("mls-"+code);this.pr=pr;pr.on("open",()=>ok());pr.on("connection",c=>c.on("open",()=>onlink(wrapC(c))));pr.on("error",e=>err(e.type==="unavailable-id"?"code-taken":"Could not reach the matchmaking server ("+(e.type||e.message)+")."))}).catch(e=>err(e.message))},
join(code,open,err){loadPeer().then(()=>{const pr=new Peer();this.pr=pr;let done=0;const to=setTimeout(()=>{if(!done)err("Could not connect (timed out). Check the code, or a firewall may be blocking peer-to-peer.")},15000);pr.on("open",()=>{const c=pr.connect("mls-"+code,{reliable:true,serialization:"json"});c.on("open",()=>{done=1;clearTimeout(to);open(wrapC(c))});c.on("error",e=>{clearTimeout(to);err("Connection error ("+(e.type||e.message)+").")})});pr.on("error",e=>{clearTimeout(to);err(e.type==="peer-unavailable"?"No room with that code.":"Could not reach the matchmaking server ("+(e.type||e.message)+").")})}).catch(e=>err(e.message))},
close(){try{this.pr&&this.pr.destroy()}catch(e){}this.pr=null}};
/* same-browser loopback, used for automated testing (?mpnet=bc) */
const bcNet={
host(code,ok,onlink){const ch=this.ch=new BroadcastChannel("mls-"+code),ls={};const mk=id=>({send:m=>ch.postMessage({to:id,from:"H",d:JSON.parse(JSON.stringify(m))}),close:()=>ch.postMessage({to:id,from:"H",d:{k:"bye"}}),onmsg:null,onclose:null});
ch.onmessage=e=>{const x=e.data;if(x.to!=="H")return;let l=ls[x.from];if(!l){if(x.d.k!=="hello")return;l=ls[x.from]=mk(x.from);ch.postMessage({to:x.from,from:"H",d:{k:"hi"}});onlink(l);return}if(x.d.k==="bye"){l.onclose&&l.onclose();delete ls[x.from];return}l.onmsg&&l.onmsg(x.d)};ok()},
join(code,open,err){const ch=this.ch=new BroadcastChannel("mls-"+code),me="C"+Math.random().toString(36).slice(2,9);let l=null;const t=setTimeout(()=>err("No room with that code."),2500);
ch.onmessage=e=>{const x=e.data;if(x.to!==me)return;if(x.d.k==="hi"&&!l){clearTimeout(t);l={send:m=>ch.postMessage({to:"H",from:me,d:JSON.parse(JSON.stringify(m))}),close:()=>ch.postMessage({to:"H",from:me,d:{k:"bye"}}),onmsg:null,onclose:null};open(l);return}if(x.d.k==="bye"){l&&l.onclose&&l.onclose();return}l&&l.onmsg&&l.onmsg(x.d)};ch.postMessage({to:"H",from:me,d:{k:"hello"}})},
close(){try{this.ch.close()}catch(e){}}};
const NETK=(new URLSearchParams(location.search)).get("mpnet")||LS("mpnet")||"peer",net=NETK==="bc"?bcNet:peerNet;
/* ---------- helpers ---------- */
const mpName=id=>{const p=M.players.find(x=>x.id===id);return p?p.name:id};window.mpName=mpName;
const pl=id=>M.players.find(p=>p.id===id);
const linkOf=id=>{const e=M.links.find(x=>x.pid===id);return e&&e.l};
const hostBcast=(m,self)=>{M.links.forEach(e=>e.l.send(m));if(self)onMsg(m)};
const toHost=m=>{if(M.host)hostRecv(M.me,m);else M.link&&M.link.send(m)};
const maxPer=()=>M.players.length<=2?2:1;
const code5=()=>{const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<5;i++)s+=c[Math.floor(NR()*c.length)];return s};
const visible=()=>{const e=el("tmp");return e&&!e.hidden};
const refresh=()=>{if(visible())mpUI()};
function snap(id){const c=col.find(x=>x.id==id);if(!c)return null;const card=JSON.parse(JSON.stringify(c,(k,v)=>k==="img"||k==="bg"?undefined:v)),cs=item((EQ[id]||{}).cons);return{oid:id,card,b:JSON.parse(JSON.stringify(bonus(id))),cons:cs?JSON.parse(JSON.stringify(cs)):null,dw:!!isDW(c)}}
function cleanSnap(x){try{const c=x.card,b=x.b;if(!c||!b||!B[c.b]||!P[c.p]||!Array.isArray(c.sk)||c.sk.length!==5)return null;
const out={oid:String(x.oid),card:{...c,name:String(c.name||"Undead").slice(0,24),dmg:num(c.dmg,0,300),arm:num(c.arm,0,300),sk:c.sk.map(k=>[String(k[0]).slice(0,40),String(k[1]).slice(0,40),...k.slice(2).filter(v=>typeof v!=="object")])},
b:{d:num(b.d,-50,300),a:num(b.a,-50,300),h:num(b.h,-100,1000),w:num(b.w,0,20),hit:num(b.hit,-50,100),crit:num(b.crit,-50,100),rg:num(b.rg,0,50),cl:num(b.cl,0,1),mask:b.mask?1:0,gg:b.gg?1:0,hw:b.hw?1:0,fl:b.fl?1:0,p:{head:num(b.p&&b.p.head,-20,100),chest:num(b.p&&b.p.chest,-20,100),arms:num(b.p&&b.p.arms,-20,100),legs:num(b.p&&b.p.legs,-20,100)}},
cons:x.cons&&CONS[x.cons.n]?{id:num(x.cons.id,0,1e16),t:"Consumable",n:x.cons.n,rar:num(x.cons.rar,1,5),v:num(x.cons.v,0,500)}:null,dw:!!x.dw};
for(const k of ["img","bg"])delete out.card[k];return out}catch(e){return null}}
/* ---------- room lifecycle ---------- */
function resetRoom(keep){M.phase="off";M.host=false;M.room="";M.links=[];M.players=[];M.sel=[];M.ready=false;M.tr=null;M.link=null;M.me="";if(!keep)try{net.close()}catch(e){}}
function createRoom(tries){M.err="";M.info="";M.name=(M.name||"Player").slice(0,16);LS("ufmpn",M.name);const code=code5();M.host=true;M.me="p0";M.phase="connecting";M.room=code;M.players=[{id:"p0",name:M.name,units:[],ready:true}];M.links=[];M.seq=0;refresh();
net.host(code,()=>{M.phase="lobby";refresh()},hostLink,e=>{if(e==="code-taken"&&(tries||0)<4){try{net.close()}catch(x){}return createRoom((tries||0)+1)}const m=e==="code-taken"?"Could not reserve a room code. Try again.":e;resetRoom();M.err=m;refresh()})}
function joinRoom(code){M.err="";M.info="";code=String(code||"").trim().toUpperCase();if(code.length<4){M.err="Enter the room code from your host.";return refresh()}M.name=(M.name||"Player").slice(0,16);LS("ufmpn",M.name);M.host=false;M.phase="connecting";M.room=code;refresh();
net.join(code,l=>{M.link=l;l.onmsg=onMsg;l.onclose=()=>hostGone();l.send({k:"hello",name:M.name,v:VER})},e=>{resetRoom();M.err=e;refresh()})}
function leaveRoom(){const wasBattle=M.on;if(M.host)hostBcast({k:"closed"});else if(M.link)M.link.send({k:"leave"});
if(wasBattle&&S&&!S.over){S.over=true;S.end="Left the expedition";S.res=1;M.on=false;bt()}M.on=false;const L=M.links.slice(),K=M.link;setTimeout(()=>{L.forEach(e=>e.l.close&&e.l.close());if(K)K.close();setTimeout(()=>{try{net.close()}catch(e){}},200)},150);resetRoom(true);refresh()}
function hostGone(){if(M.phase==="off")return;if(M.on&&S&&!S.over){S.over=true;S.end="Host disconnected";S.res=1;log("📴 The host disconnected. The expedition ends here (loot found so far is yours).");bt()}M.on=false;resetRoom();M.err="The host left the room.";refresh()}
/* ---------- host side ---------- */
function hostLink(l){const ent={pid:null,l};l.onmsg=m=>{if(!ent.pid){if(!m||m.k!=="hello")return;
if(m.v!==VER){l.send({k:"deny",why:"Version mismatch. Both players need the same version of the game (reload the page)."});setTimeout(()=>l.close(),400);return}
if(M.phase!=="lobby"||M.players.length>=3){l.send({k:"deny",why:M.phase!=="lobby"?"That expedition has already started.":"The room is full (3 players)."});setTimeout(()=>l.close(),400);return}
const id=["p1","p2"].find(x=>!M.players.some(p=>p.id===x));ent.pid=id;M.links.push(ent);M.players.push({id,name:String(m.name||"Player").slice(0,16),units:[],ready:false});l.send({k:"welcome",you:id});trimPicks();lobbyOut();return}
hostRecv(ent.pid,m)};l.onclose=()=>{if(ent.pid){const p=ent.pid;ent.pid=null;hostLeft(p)}}}
function trimPicks(){const mp=maxPer();M.players.forEach(p=>{if(p.units.length>mp){p.units=p.units.slice(0,mp);p.ready=false}})}
function hostLeft(pid){M.links=M.links.filter(e=>e.pid!==pid&&e.pid!==null);
if(M.phase==="battle"&&M.on){hostIn({k:"left",p:pid},M.me)}else{M.players=M.players.filter(p=>p.id!==pid);trimPicks();lobbyOut()}
if(M.tr&&M.tr.w===pid){M.tr=null;M.info="The trade was cancelled because "+mpName(pid)+" left."}refresh()}
function lobbyOut(){const pub=M.players.map(p=>({id:p.id,name:p.name,ready:p.ready,units:p.units.map(x=>({n:x.card.name,b:x.card.b,p:x.card.p}))}));
hostBcast({k:"lobby",players:pub,cfg:M.cfg,mp:maxPer()});refresh()}
function hostRecv(pid,m){if(!m)return;switch(m.k){
case"pick":{const p=pl(pid);if(!p||M.phase!=="lobby")return;const us=(Array.isArray(m.units)?m.units:[]).map(cleanSnap).filter(Boolean).slice(0,maxPer());p.units=us;p.ready=!!m.ready&&us.length>0;lobbyOut();return}
case"in":{const d=m.d||{};if(!M.on)return;hostIn({k:String(d.k||"").slice(0,8),e:d.e,p:d.p,i:d.i},pid);return}
case"h":hostH(pid,m.s,m.h);return;
case"tr":{if(m.to===M.me)onTr(pid,m.d);else{const l=linkOf(m.to);if(l)l.send({k:"tr",from:pid,d:m.d})}return}
case"leave":{const l=linkOf(pid);hostLeft(pid);if(l)setTimeout(()=>l.close(),100);return}}}
function hostIn(d,from){hostBcast({k:"seqin",s:++M.sq,from,d},true)}
function hostH(pid,s,h){const e=M.hs[s]||(M.hs[s]={});e[pid]=h;const need=1+M.links.length;if(Object.keys(e).length>=need){const v=Object.values(e);delete M.hs[s];if(v.some(x=>x!==v[0]))hostBcast({k:"desync",s},true);Object.keys(M.hs).forEach(k=>{if(+k<s-30)delete M.hs[k]})}}
function hostStart(){M.err="";const ps=M.players;if(ps.length<2){M.info="You need at least one other player.";return refresh()}
if(!ps.slice(1).every(p=>p.ready)){M.info="Everyone must press Ready first.";return refresh()}
const mine=M.sel.map(snap).filter(Boolean).slice(0,maxPer());if(!mine.length){M.info="Choose an undead to bring.";return refresh()}
ps[0].units=mine;const seed=Math.floor(NR()*2147483646)+1,units=[];ps.forEach(p=>p.units.forEach(sn=>units.push({own:p.id,sn})));
if(!AR[M.cfg.area]||!locOpen(M.cfg.area))M.cfg.area="wasteland";
M.phase="battle";hostBcast({k:"start",seed,cfg:M.cfg,units,players:ps.map(p=>({id:p.id,name:p.name}))},true)}
/* ---------- messages (every player) ---------- */
function onMsg(m){if(!m)return;switch(m.k){
case"welcome":M.me=m.you;M.phase="lobby";refresh();return;
case"deny":{const w=m.why;resetRoom();M.err=w;refresh();return}
case"closed":{if(M.on&&S&&!S.over){S.over=true;S.end="Host left";S.res=1;bt()}M.on=false;resetRoom();M.err="The host closed the room.";refresh();return}
case"lobby":{if(M.host)return;M.players=m.players;M.cfg=m.cfg;M.maxPer=m.mp;const me=pl(M.me);if(me)M.ready=!!me.ready;if(M.sel.length>m.mp){M.sel=M.sel.slice(0,m.mp);M.ready=false}if(M.phase==="battle"&&!M.on)M.phase="lobby";refresh();return}
case"start":mpStart(m);return;
case"seqin":mpApply(m.s,m.from,m.d);return;
case"desync":{if(S&&M.on&&!S.over){S.over=true;S.end="Desync detected";S.res=1;log("⚠ The game states of the players drifted apart, so the expedition was stopped to keep it fair. Loot found so far is kept.");bt()}return}
case"tr":onTr(m.from,m.d);return}}
/* ---------- co-op battle ---------- */
function simIn(f){const o=MPR;MPR=M.rng;try{return f()}finally{MPR=o}}
function mpStart(m){const cfg=m.cfg||{};if(!AR[cfg.area])cfg.area="wasteland";
M.on=true;M.phase="battle";if(!M.host)M.players=m.players.map(p=>({...p,units:[],ready:false}));M.n=M.players.length;M.idx=Math.max(0,M.players.findIndex(p=>p.id===M.me));M.seq=0;M.sq=0;M.ctr=0;M.idb=5e15+m.seed*1e3;M.sc=0;M.lc=0;M.pool.length=0;M.rc=0;M.hs={};
const g=mul(m.seed);M.rng=()=>{M.rc++;return g()};
const U=m.units.map(x=>{const sn=cleanSnap(x.sn);sn.card.oid=sn.oid;sn.card.id=x.own+"_"+sn.oid;const u=mkUnit(sn.card,{b:sn.b,cons:sn.cons,dw:sn.dw});u.own=x.own;return u});
try{aud()}catch(e){}
S={r:1,area:cfg.area,len:num(cfg.len,1,99,5),mode:num(cfg.mode,0,2,0),res:0,lost:[],rd:1,loot:[],spec:[],auto:false,end:"",U,ai:0,ally:0,over:false,log:[],gone:{}};UA=null;TE=null;
simIn(()=>{spawn();log("🌍 The party arrives at the "+AR[S.area].n+" ("+M.players.map(p=>p.name).join(", ")+"). "+AR[S.area].lore.split(". ")[0]+".");intro()});
tab(2);xView(false);bt()}
function mpIn(d){if(M.host)hostIn(d,M.me);else if(M.link)M.link.send({k:"in",d})}
window.mpAuto=()=>{AT=null;if(!M.on||!S||S.over||!M.host)return;mpIn({k:"as"})};
function hashS(){const a=[S.r,S.rd,S.ai,S.ally,S.tg.e,S.tg.p,S.over?1:0,S.U.length,S.N.length,M.rc];S.U.forEach(u=>{PT.forEach(p=>a.push(u.P[p].h,u.P[p].a));a.push(u.blk,u.buff,u.cds.join(","),u.dg,u.cn,u.rg)});S.N.forEach(n=>{PT.forEach(p=>a.push(n.E[p].h));a.push(n.ea,n.skip?1:0,n.heavy?1:0)});
const t=a.join("|");let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mpApply(s,from,d){if(!M.on||!S||!d)return;if(s!==M.seq+1){onMsg({k:"desync",s});return}M.seq=s;simIn(()=>doIn(from,d));
const h=hashS();if(M.host)hostH(M.me,s,h);else if(M.link)M.link.send({k:"h",s,h});refresh()}
function doIn(from,d){if(S.over)return;const u=S.U[S.ai],ow=u&&u.own;switch(d.k){
case"tg":{if(from!==ow||S.auto)return;const e=num(d.e,0,99,-1),n=S.N[e];if(!n||dead(n.E))return;const p=PT.includes(d.p)?d.p:"chest";if(n.E[p].h<=0)return;S.tg={e,p};bt();return}
case"ally":{if(from!==ow||S.auto)return;const i=num(d.i,0,9,-1);if(S.U[i]&&alive(S.U[i])){S.ally=i;bt()}return}
case"act":{if(from!==ow||S.auto)return;const i=+d.i;if(!(i>=0&&i<=4&&i===Math.floor(i)))return;act(i);return}
case"use":{if(from!==ow||S.auto)return;useCons();return}
case"auto":{S.auto=!S.auto;bt();return}
case"as":{if(from!==M.hid)return;if(!S.auto&&!(u&&S.gone[u.own]))return;autoStep(1);return}
case"ret":{if(from!==M.hid)return;clearTimeout(AT);endExp("Retreated");return}
case"left":{if(from!==M.hid)return;if(!S.gone[d.p]){S.gone[d.p]=1;log("📴 "+mpName(d.p)+" disconnected. Their undead fight on automatically.");bt()}return}}}
window.mpClick=e=>{
if(e.target.closest("[data-snx]")){SND=!SND;LS("ufsnd",SND?"1":"0");if(SND)aud();return bt()}
if(e.target.closest("[data-auto]"))return mpIn({k:"auto"});
if(e.target.closest("[data-ret]")){if(M.host)mpIn({k:"ret"});return}
if(mpNM()||S.auto)return;
if(e.target.closest("[data-use]"))return mpIn({k:"use"});
const ua=e.target.closest("[data-ua]");if(ua)return mpIn({k:"ally",i:+ua.dataset.ua});
const lp=e.target.closest("[data-lp]");if(lp)return mpIn({k:"tg",e:+lp.dataset.le,p:lp.dataset.lp});
const t=e.target.closest("[data-t]");if(t&&!t.disabled)return mpIn({k:"tg",e:S.tg.e,p:t.dataset.t});
const b=e.target.closest(".sb");if(b){if(!b.disabled)mpIn({k:"act",i:+b.dataset.i});return}
const d=e.target.closest("[data-e]");if(d)return mpIn({k:"tg",e:+d.dataset.e,p:"chest"})};
window.mpEnd=()=>{M.on=false;if(M.phase==="battle")M.phase="lobby";M.ready=false;if(M.host){M.players.forEach(p=>{p.ready=p.id===M.me});lobbyOut()}};
window.mpShare=its=>{const mine=its.filter((_,i)=>(M.lc+i)%M.n===M.idx);M.lc+=its.length;M.pool.length=0;mine.forEach(i=>INV.push(i));sv();if(its.length>1)log("   (The party's loot is shared out: you receive "+mine.length+" of "+its.length+".)");return mine};
/* ---------- trading ---------- */
const pubItem=i=>({id:i.id,t:i.t,n:i.n,rar:i.rar,v:i.v,...(i.s?{s:i.s}:{}),...(i.mb!=null?{mb:i.mb}:{})});
function cleanItem(x){if(!x||!TYPES.has(String(x.t)))return null;const t=String(x.t),n=String(x.n||"").slice(0,48);if(!n)return null;if(t==="Consumable"&&!CONS[n])return null;if(t==="Implant"&&!IM[n])return null;
const it={id:0,t,n,rar:Math.round(num(x.rar,1,5,1)),v:num(x.v,0,200,1)};if(x.s!=null)it.s=String(x.s).slice(0,12);if(x.mb!=null)it.mb=num(x.mb,0,99);if(t==="Armor"&&!(it.s in IT.Armor))return null;return it}
const specKeys=()=>{const o=[];Object.keys(PC).forEach(k=>PC[k]>0&&o.push("P:"+k));Object.keys(BC).forEach(k=>BC[k]>0&&o.push("B:"+k));return o};
const specHave=k=>k[0]==="P"?PC[k.slice(2)]||0:BC[k.slice(2)]||0;
const specName=k=>k[0]==="P"?k.slice(2):BN(k.slice(2));
const specValid=k=>typeof k==="string"&&/^[PB]:/.test(k)&&(k[0]==="P"?(P[k.slice(2)]&&k.slice(2)!=="Nobody"):(B[k.slice(2)]&&k.slice(2)!=="Human"));
function cleanOffer(d){const items=(Array.isArray(d.items)?d.items:[]).slice(0,40).map(cleanItem).filter(Boolean),spec={};let tot=0;Object.keys(d.spec||{}).slice(0,40).forEach(k=>{if(specValid(k)){const n=Math.round(num(d.spec[k],0,99));if(n>0&&tot<200){spec[k]=n;tot+=n}}});return{items,spec}}
const offerKey=o=>JSON.stringify([o.items.map(i=>[i.n,i.t,i.rar,i.v,i.s||"",i.mb||0].join("~")).sort(),Object.keys(o.spec).sort().map(k=>k+"="+o.spec[k])]);
const hash=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const trSend=(to,d)=>{if(M.host){const l=linkOf(to);l&&l.send({k:"tr",from:M.me,d})}else M.link&&M.link.send({k:"tr",to,d})};
const newTr=w=>({w,mine:{items:[],spec:{}},theirs:{items:[],spec:{}},lm:false,lt:false,cm:null,ct:null,msg:"",done:false});
function myOffer(){const t=M.tr;return{items:t.mine.items.map(id=>item(id)).filter(Boolean).map(pubItem),spec:{...t.mine.spec}}}
function sendOffer(){const t=M.tr;t.lm=false;t.lt=false;t.cm=null;t.ct=null;trSend(t.w,{t:"offer",...myOffer()});refresh()}
function startTrade(pid){if(M.tr||!pl(pid))return;M.tr=newTr(pid);trSend(pid,{t:"open"});M.info="";refresh()}
function mineValid(){const t=M.tr;return t.mine.items.every(id=>{const i=item(id);return i&&!worn(id)})&&Object.keys(t.mine.spec).every(k=>specValid(k)&&specHave(k)>=t.mine.spec[k])}
function setLock(on){const t=M.tr;if(!t||t.done)return;if(on&&!mineValid()){t.msg="Something you offered is no longer available.";return refresh()}t.lm=on;if(!on){t.cm=null}trSend(t.w,{t:"lock",on});maybeCommit();refresh()}
function maybeCommit(){const t=M.tr;if(!t||!t.lm||!t.lt||t.cm)return;if(!mineValid()){t.msg="Something you offered is no longer available.";t.lm=false;trSend(t.w,{t:"lock",on:false});return}
const a=offerKey(myOffer()),b=offerKey(t.theirs);t.cm=hash(M.me<t.w?a+"##"+b:b+"##"+a);trSend(t.w,{t:"commit",h:t.cm});tryExec()}
function tryExec(){const t=M.tr;if(!t||!t.cm||!t.ct||t.done)return;if(t.cm!==t.ct){t.msg="The two sides disagree about the terms, so nothing was exchanged.";t.lm=t.lt=false;t.cm=t.ct=null;return refresh()}
if(!mineValid()){t.msg="Trade failed: something you offered is no longer available.";return refresh()}
const ids=new Set(t.mine.items);INV=INV.filter(i=>!ids.has(i.id));Object.keys(t.mine.spec).forEach(k=>{const C=k[0]==="P"?PC:BC;C[k.slice(2)]=(C[k.slice(2)]||0)-t.mine.spec[k]});
t.theirs.items.forEach(i=>INV.push({...i,id:uid()}));Object.keys(t.theirs.spec).forEach(k=>{const C=k[0]==="P"?PC:BC,D=k[0]==="P"?DP:DB,n=k.slice(2);C[n]=(C[n]||0)+t.theirs.spec[k];if(!D.includes(n))D.push(n)});
sv();svd();svc();try{fillSel()}catch(e){}t.done=true;t.msg="Trade complete! You gave "+(t.mine.items.length+Object.keys(t.mine.spec).length)+" thing(s) and received "+(t.theirs.items.length+Object.keys(t.theirs.spec).length)+".";t.mine={items:[],spec:{}};refresh()}
function onTr(from,d){if(!d)return;if(d.t==="open"){if(M.tr&&M.tr.w!==from){trSend(from,{t:"busy"});return}if(!M.tr)M.tr=newTr(from);M.info=mpName(from)+" wants to trade.";refresh();return}
if(!M.tr&&d.t==="offer"&&pl(from))M.tr=newTr(from);const t=M.tr;if(d.t==="busy"){if(t&&t.w===from){M.tr=null;M.info=mpName(from)+" is already in another trade."}refresh();return}
if(!t||t.w!==from)return;switch(d.t){
case"offer":{t.theirs=cleanOffer(d);t.lt=false;t.ct=null;t.cm=null;if(t.lm){t.lm=false;trSend(t.w,{t:"lock",on:false})}t.msg="";t.done=false;break}
case"lock":{t.lt=!!d.on;if(!d.on){t.ct=null}maybeCommit();break}
case"commit":{t.ct=String(d.h);tryExec();break}
case"cancel":{M.tr=null;M.info=mpName(from)+" cancelled the trade.";break}}refresh()}
/* ---------- UI ---------- */
const rc=i=>`<span class="r${i.rar}">${esc(RN[i.rar]+" "+i.n)}</span>`;
function mpUI(){const e=el("tmp");if(!e)return;const h=[];h.push(`<h2 style="margin-top:6px">Multiplayer</h2>`);
if(M.err)h.push(`<p class="s" style="color:var(--acc);margin:6px 0">⚠ ${esc(M.err)}</p>`);
if(M.phase==="off"){h.push(`<p class="s" style="margin:6px 0">Play co-op expeditions with 1–2 friends (2–3 players) and trade loot and specimens. Connections are direct between players (WebRTC); one player hosts and shares a room code.</p>
<label>Your name</label><input id="mpn" maxlength="16" value="${esc(M.name)}" data-notr="1">
<button data-a="create" style="margin-top:10px">Create a room</button>
<label style="margin-top:14px">Or join a friend's room</label><input id="mpj" maxlength="8" placeholder="Room code" value="${esc(M.joinCode)}" data-notr="1" style="text-transform:uppercase"><button data-a="join" style="margin-top:8px">Join room</button>
<p class="s" style="margin:12px 0 0">Everything runs on your devices, with no game server, so this is built for friends who trust each other. All players need the same version of the game.</p>`);e.innerHTML=h.join("");return}
if(M.phase==="connecting"){h.push(`<p class="s">Connecting…</p><button class="g" data-a="leave">Cancel</button>`);e.innerHTML=h.join("");return}
const mp=M.host?maxPer():M.maxPer;
h.push(`<div class="card" style="margin-top:8px"><b>Room code: <span data-notr="1" style="letter-spacing:3px;font-size:20px">${esc(M.room)}</span></b> <button class="g" data-a="copy" style="width:auto;padding:4px 10px;margin-left:8px">Copy</button><p class="s" style="margin:6px 0 0">${M.host?"You are the host. Share this code with your friends.":"Connected to the host."}</p></div>`);
h.push(`<div class="card" style="margin-top:10px"><b>Players (${M.players.length}/3)</b>${M.players.map(p=>`<div class="it"><span>${p.id===M.hid?"👑 ":""}${esc(p.name)}${p.id===M.me?" <i>(you)</i>":""}</span><span>${(p.units||[]).length?esc(p.units.map(u=>u.n||(u.card&&u.card.name)).join(", "))+" ":""}${p.id===M.hid?"":p.ready?"✔ ready":"…"}</span></div>`).join("")}</div>`);
if(M.phase==="battle"&&M.on){h.push(`<div class="card" style="margin-top:10px;border-color:var(--acc)"><b>⚔ Expedition in progress</b><p class="s" style="margin:6px 0">${esc(AR[S.area].n)}, wave ${S.r}.</p><button data-a="goto">Go to the battle</button></div>`)}
else{h.push(`<div class="card" style="margin-top:10px"><b>Your undead</b><p class="s" style="margin:4px 0 8px">Bring up to ${mp} undead${mp==1?" (3 players: one each)":""}. ${M.host?"":"Press Ready when you are set."}</p>${col.length?col.map(c=>`<button class="${M.sel.includes(c.id)?"":"g"}" data-a="sel" data-v="${c.id}" style="text-align:left;margin-top:6px">${M.sel.includes(c.id)?"✔ ":""}${esc(c.name)} <small>· ${esc(c.p)} · ${esc(BN(c.b))}</small></button>`).join(""):'<p class="s">Forge an undead first.</p>'}</div>`);
const cfg=M.cfg;if(M.host){const ar=openLocs();h.push(`<div class="card" style="margin-top:10px"><b>Expedition</b><label>Location</label><select id="mpa">${ar.map(k=>`<option value="${k}" ${cfg.area===k?"selected":""}>${esc(AR[k].n)} (${AR[k].df})</option>`).join("")}</select><label>Waves</label><select id="mpl">${[3,5,8,99].map(n=>`<option value="${n}" ${+cfg.len===n?"selected":""}>${n==99?"Endless (retreat to end)":n+" waves"}</option>`).join("")}</select><label>Risk</label><select id="mpr">${MD.map((m,i)=>`<option value="${i}" ${+cfg.mode===i?"selected":""}>${m.n}</option>`).join("")}</select><p class="s" style="margin:6px 0 0">Loot and specimens are split between the players. Only you can retreat.</p></div>
<button data-a="start" style="margin-top:10px">⚔ Start co-op expedition</button>`)}
else{h.push(`<div class="card" style="margin-top:10px"><b>Expedition</b><p class="s" style="margin:6px 0 0">${esc((AR[cfg.area]||{n:"?"}).n)} · ${+cfg.len==99?"Endless":cfg.len+" waves"} · Risk: ${esc((MD[+cfg.mode]||MD[0]).n)} (set by the host)</p></div><button data-a="ready" style="margin-top:10px" class="${M.ready?"g":""}">${M.ready?"✔ Ready (tap to cancel)":"Ready"}</button>`)}}
if(M.info)h.push(`<p class="s" style="margin:8px 0;color:var(--acc)">${esc(M.info)}</p>`);
const others=M.players.filter(p=>p.id!==M.me);
if(others.length){h.push(`<div class="card" style="margin-top:12px"><b>🤝 Trade</b>`);
if(!M.tr)h.push(`<p class="s" style="margin:4px 0 6px">Swap loot and specimens with another player. Both of you must lock the same deal.</p>`+others.map(p=>`<button data-a="trade" data-v="${p.id}" style="margin-top:6px">Trade with ${esc(p.name)}</button>`).join(""));else h.push(tradeHTML());h.push(`</div>`)}
h.push(`<button class="g" data-a="leave" style="margin-top:14px">Leave room</button>`);
e.innerHTML=h.join("")}
window.mpUI=mpUI;
const tf={f:"All"};
function tradeHTML(){const t=M.tr,who=esc(mpName(t.w)),mi=t.mine.items.map(id=>item(id)).filter(Boolean);const out=[];
out.push(`<p class="s" style="margin:4px 0">Trading with <b>${who}</b>. Changing an offer unlocks both sides.</p>`);
if(t.msg)out.push(`<p class="s" style="color:var(--acc);margin:4px 0">${esc(t.msg)}</p>`);
out.push(`<b style="font-size:13px;display:block;margin-top:8px">You offer</b>`+(mi.length||Object.keys(t.mine.spec).length?mi.map(i=>`<div class="it"><span>${rc(i)}</span><button class="g" data-a="tdel" data-v="${i.id}" style="width:auto;padding:2px 10px">✕</button></div>`).join("")+Object.keys(t.mine.spec).map(k=>`<div class="it"><span>🧬 ${esc(specName(k))}</span><span><button class="g" data-a="tsp" data-v="${esc(k)}" data-d="-1" style="width:auto;padding:2px 10px">−</button> ×${t.mine.spec[k]} <button class="g" data-a="tsp" data-v="${esc(k)}" data-d="1" style="width:auto;padding:2px 10px">+</button></span></div>`).join(""):`<p class="s" style="margin:2px 0">Nothing yet.</p>`));
out.push(`<b style="font-size:13px;display:block;margin-top:8px">${who} offers</b>`+(t.theirs.items.length||Object.keys(t.theirs.spec).length?t.theirs.items.map(i=>`<div class="it"><span>${rc(i)}</span></div>`).join("")+Object.keys(t.theirs.spec).map(k=>`<div class="it"><span>🧬 ${esc(specName(k))}</span><span>×${t.theirs.spec[k]}</span></div>`).join(""):`<p class="s" style="margin:2px 0">Nothing yet.</p>`));
if(!t.done){out.push(`<p class="s" style="margin:8px 0 4px"><span>You:</span> ${t.lm?"🔒 locked":"⬜ open"} · <span>${who}:</span> ${t.lt?"🔒 locked":"⬜ open"}${t.lm&&t.lt?" · <span>confirming…</span>":""}</p><div class="tabs"><button data-a="tlock" class="${t.lm?"g":""}">${t.lm?"Unlock":"🔒 Lock offer"}</button><button class="g" data-a="tcancel">Cancel trade</button></div>`);
const types=["All",...new Set(INV.filter(i=>!worn(i.id)).map(i=>i.t))];if(!types.includes(tf.f))tf.f="All";
const pool=INV.filter(i=>!worn(i.id)&&!t.mine.items.includes(i.id)&&(tf.f==="All"||i.t===tf.f)).sort((a,b)=>b.rar-a.rar);
out.push(`<details style="margin-top:8px"><summary style="cursor:pointer;font-size:13px">Add items from Storage (${pool.length})</summary><select id="mpf">${types.map(x=>`<option ${x===tf.f?"selected":""}>${esc(x)}</option>`).join("")}</select>${pool.slice(0,60).map(i=>`<button class="g" data-a="tadd" data-v="${i.id}" style="text-align:left;margin-top:4px">${rc(i)} <small>· ${esc(i.t)}</small></button>`).join("")||'<p class="s">No items available.</p>'}${pool.length>60?`<p class="s">Showing the best 60. Filter by type to see more.</p>`:""}</details>`);
const sk=specKeys().filter(k=>!(k in t.mine.spec)&&specValid(k));
out.push(`<details style="margin-top:6px"><summary style="cursor:pointer;font-size:13px">Add specimens (${sk.length})</summary>${sk.map(k=>`<button class="g" data-a="tsp" data-v="${esc(k)}" data-d="1" style="text-align:left;margin-top:4px">🧬 ${esc(specName(k))} <small>· you have ${specHave(k)}</small></button>`).join("")||'<p class="s">No specimens to trade.</p>'}</details>`)}
else out.push(`<button data-a="tclose" style="margin-top:8px">Close</button>`);
return out.join("")}
function onClick(ev){const b=ev.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,v=b.dataset.v;
if(a==="create"){const n=el("mpn");if(n)M.name=n.value.trim()||M.name;return createRoom()}
if(a==="join"){const n=el("mpn"),j=el("mpj");if(n)M.name=n.value.trim()||M.name;M.joinCode=j?j.value:"";return joinRoom(M.joinCode)}
if(a==="leave")return leaveRoom();
if(a==="copy"){try{navigator.clipboard.writeText(M.room);M.info="Code copied."}catch(e){M.info="Select the code and copy it."}return mpUI()}
if(a==="goto"){tab(2);xView(false);return bt()}
if(a==="sel"){const id=+v,i=M.sel.indexOf(id),mp=M.host?maxPer():M.maxPer;if(i>=0)M.sel.splice(i,1);else if(M.sel.length<mp)M.sel.push(id);else if(mp===1)M.sel=[id];M.ready=false;if(!M.host)toHost({k:"pick",units:M.sel.map(snap).filter(Boolean),ready:false});return mpUI()}
if(a==="ready"){if(!M.sel.length){M.info="Choose an undead first.";return mpUI()}M.info="";const r=!M.ready;M.ready=r;toHost({k:"pick",units:M.sel.map(snap).filter(Boolean),ready:r});return mpUI()}
if(a==="start")return hostStart();
if(a==="trade")return startTrade(v);
const t=M.tr;if(!t)return;
if(a==="tcancel"){trSend(t.w,{t:"cancel"});M.tr=null;return mpUI()}
if(a==="tclose"){M.tr=null;return mpUI()}
if(a==="tlock")return setLock(!t.lm);
if(a==="tadd"){const id=+v;if(item(id)&&!t.mine.items.includes(id)&&t.mine.items.length<40){t.mine.items.push(id);sendOffer()}return}
if(a==="tdel"){t.mine.items=t.mine.items.filter(x=>x!=+v);return sendOffer()}
if(a==="tsp"){const k=v,d=+b.dataset.d,cur=t.mine.spec[k]||0,n=Math.max(0,Math.min(specHave(k),cur+d));if(n)t.mine.spec[k]=n;else delete t.mine.spec[k];return sendOffer()}}
function onChange(ev){const id=ev.target.id;if(id==="mpa")M.cfg.area=ev.target.value;else if(id==="mpl")M.cfg.len=+ev.target.value;else if(id==="mpr")M.cfg.mode=+ev.target.value;else if(id==="mpf"){tf.f=ev.target.value;return mpUI()}else return;if(M.host)lobbyOut()}
window.addEventListener("beforeunload",()=>{try{if(M.host)hostBcast({k:"closed"});else if(M.link)M.link.send({k:"leave"})}catch(e){}});
const box=el("tmp");if(box){box.addEventListener("click",onClick);box.addEventListener("change",onChange);box.addEventListener("input",ev=>{if(ev.target.id==="mpn")M.name=ev.target.value;if(ev.target.id==="mpj")M.joinCode=ev.target.value})}
const tb=el("tabP");if(tb)tb.hidden=false;
window.MPX={createRoom,joinRoom,leaveRoom,hashS,snap,cleanSnap,startTrade,hostStart,simIn};
})();
