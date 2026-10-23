(function(){
'use strict';
var S=window.SPELLS.map(function(s,i){s.id=i;return s;});
var CATS=['Love','Luck','Confidence','Money','Calm','Creativity','Fresh Start','Courage','Voodoo'];
var LS={get:function(k,d){try{var v=localStorage.getItem('cbsb_'+k);return v===null?d:JSON.parse(v);}catch(e){return d;}},set:function(k,v){try{localStorage.setItem('cbsb_'+k,JSON.stringify(v));}catch(e){}}};
var favs=LS.get('favs',[]);
var page=document.getElementById('page');
var toastEl=document.getElementById('toast');
var state={tab:'today',cat:'All',spellId:null,ctx:null,from:'today'};
var TABS=['today','draw','browse','favs','relax','remind'];
var order=0;

function h(tag,attrs,kids){
  var e=document.createElement(tag);
  if(attrs){for(var k in attrs){if(attrs[k]===null||attrs[k]===undefined)continue;if(k==='text')e.textContent=attrs[k];else if(k==='class')e.className=attrs[k];else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),attrs[k]);else e.setAttribute(k,attrs[k]);}}
  (kids||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});
  return e;
}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){toastEl.classList.remove('show');},2600);}
function dayNumber(d){d=d||new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);}
function todayIndex(){return ((dayNumber()*11+13)%S.length+S.length)%S.length;}
function isFav(id){return favs.indexOf(id)>-1;}
function toggleFav(id){var i=favs.indexOf(id);if(i>-1){favs.splice(i,1);toast('Removed from favourites');}else{favs.push(id);toast('Saved to favourites');}LS.set('favs',favs);updateFavN();}
function updateFavN(){document.getElementById('favN').textContent=favs.length;}
function dateLabel(){return new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'});}
var FUN='For fun and inspiration only. Spells are not a promise of results and are not medical, legal or financial advice.';
function spellText(s){return s.n+' ('+s.c+')\n\n'+s.p.join('\n')+'\n\nRitual: '+s.r+'\n\nIntention: '+s.i+'\n\nFrom the Coffeebreak Spell Book\n'+FUN;}

/* sharing */
function wrap(ctx,text,maxW){var words=text.split(' '),lines=[],line='';words.forEach(function(w){var t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;});if(line)lines.push(line);return lines;}
function makeImage(s){
  return new Promise(function(res){
    var W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
    var g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#ffd3e6');g.addColorStop(1,'#f06aa4');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.fillStyle='#fff8fb';rr(x,60,60,W-120,H-120,36);x.fill();
    x.strokeStyle='#d9a441';x.lineWidth=4;rr(x,84,84,W-168,H-168,28);x.stroke();
    x.textAlign='center';
    x.fillStyle='#a0306a';x.font='28px Georgia,serif';x.fillText(s.c.toUpperCase(),W/2,270);
    x.fillStyle='#e83e8c';x.font='italic 66px Georgia,serif';var y=340;
    wrap(x,s.n,W-260).forEach(function(l){x.fillText(l,W/2,y);y+=76;});
    x.fillStyle='#5a1840';x.font='italic 40px Georgia,serif';y+=20;
    s.p.forEach(function(l){wrap(x,l,W-280).forEach(function(w){x.fillText(w,W/2,y);y+=56;});});
    y+=26;x.font='34px Georgia,serif';x.fillStyle='#7a3a5c';
    wrap(x,'Ritual: '+s.r,W-260).forEach(function(l){x.fillText(l,W/2,y);y+=46;});
    y+=24;x.fillStyle='#e83e8c';x.font='italic 40px Georgia,serif';
    wrap(x,s.i,W-260).forEach(function(l){x.fillText(l,W/2,y);y+=54;});
    var yEnd=y;
    function finish(){
      x.fillStyle='#a0306a';x.font='24px Georgia,serif';
      x.fillText('Coffeebreak Spell Book',W/2,H-200);
      x.font='20px Georgia,serif';
      wrap(x,FUN,W-300).forEach(function(l,i){x.fillText(l,W/2,H-160+i*26);});
      c.toBlob(function(b){res(b);},'image/png');
    }
    var im=new Image();im.onload=function(){x.drawImage(im,W/2-60,100,120,120);if(s.c!=='Voodoo'){finish();return;}var d=new Image();d.onload=function(){var dh=Math.min(200,H-230-yEnd);if(dh>90)x.drawImage(d,W/2-dh*0.385,yEnd-10,dh*0.77,dh);finish();};d.onerror=finish;d.src='doll.svg';};im.onerror=finish;im.src='logo.png';
  });
}
function rr(x,a,b,w,hh,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+hh,r);x.arcTo(a+w,b+hh,a,b+hh,r);x.arcTo(a,b+hh,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
function download(blob,name){var u=URL.createObjectURL(blob);var a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);}
function shareImage(s){
  makeImage(s).then(function(b){
    var f;try{f=new File([b],'coffeebreak-spell.png',{type:'image/png'});}catch(e){f=null;}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:s.n}).catch(function(){});}
    else{download(b,'coffeebreak-spell-'+s.n.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.png');toast('Spell image saved');}
  });
}
function shareText(s){
  var t=spellText(s);
  if(navigator.share){navigator.share({title:s.n,text:t}).catch(function(){});return;}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast('Spell copied to share');},function(){fallbackCopy(t);});}else fallbackCopy(t);
}
function fallbackCopy(t){var ta=h('textarea',{style:'position:fixed;opacity:0'});ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Spell copied to share');}catch(e){toast('Could not copy');}ta.remove();}

/* views */
function spellView(s,opts){
  opts=opts||{};
  var fav=isFav(s.id);
  var kids=[
    h('span',{class:'sparkle','aria-hidden':'true',text:'\u2726'}),
    opts.date?h('div',{class:'date',text:opts.date}):null,
    h('span',{class:'cat',text:s.c}),
    h('h2',{text:s.n}),
    s.c==='Voodoo'?h('img',{class:'doll',src:'doll.svg',alt:'A drawn pink felt charm doll with a ribbon bow',width:'110',height:'143'}):null,
    h('div',{class:'verse'},s.p.map(function(l){return h('span',{text:l});})),
    h('h3',{text:'Your ritual'}),
    h('p',{class:'ritual',text:s.r}),
    s.c==='Voodoo'?h('p',{class:'note',text:'A playful craft doll for good things in your own life. No pins, no harm and nothing aimed at anyone else.'}):null,
    h('div',{class:'intent',text:'Intention: '+s.i}),
    h('div',{class:'actions'},[
      h('button',{class:'btn small',type:'button','aria-pressed':fav,id:'favBtn',text:fav?'\u2665 Saved':'\u2661 Save',onclick:function(){toggleFav(s.id);var b=document.getElementById('favBtn');var f=isFav(s.id);b.textContent=f?'\u2665 Saved':'\u2661 Save';b.setAttribute('aria-pressed',f);}}),
      h('button',{class:'btn small ghost',type:'button',text:'Share as image',onclick:function(){shareImage(s);}}),
      h('button',{class:'btn small ghost',type:'button',text:'Share as text',onclick:function(){shareText(s);}})
    ])
  ];
  if(opts.extra)kids.push(opts.extra);
  return h('div',null,kids);
}
function ctxNav(list,pos){
  return h('div',{class:'nav2'},[
    h('button',{class:'btn small ghost',type:'button',disabled:pos<=0?'disabled':null,text:'\u2190 Turn back',onclick:function(){showSpell(list[pos-1],list,'back');}}),
    h('span',{class:'note',text:(pos+1)+' of '+list.length}),
    h('button',{class:'btn small ghost',type:'button',disabled:pos>=list.length-1?'disabled':null,text:'Turn page \u2192',onclick:function(){showSpell(list[pos+1],list,'fwd');}})
  ]);
}
function viewToday(){
  var s=S[todayIndex()];
  return h('div',null,[
    h('h3',{text:'Spell of the day'}),
    spellView(s,{date:dateLabel(),extra:h('p',{class:'note',text:'Today\'s spell stays the same all day and a new one arrives tomorrow.'})})
  ]);
}
function viewDraw(){
  var drawn=LS.get('drawn',null);
  var wrapEl=h('div',null,[h('h3',{text:'Draw a spell'})]);
  var slot=h('div',{id:'drawSlot'});
  function put(s){slot.innerHTML='';slot.appendChild(spellView(s));}
  if(drawn!==null&&S[drawn]){put(S[drawn]);}
  else slot.appendChild(h('p',{class:'empty',text:'Close your eyes, take a breath, and draw a spell from the book.'}));
  var btn=h('button',{class:'btn',id:'drawBtn',type:'button',text:drawn!==null?'Draw another spell':'Draw a spell',onclick:function(){
    var cur=LS.get('drawn',null),n;
    do{n=Math.floor(Math.random()*S.length);}while(n===cur&&S.length>1);
    LS.set('drawn',n);slot.style.opacity=0;
    setTimeout(function(){put(S[n]);btn.textContent='Draw another spell';slot.style.transition='opacity .4s';slot.style.opacity=1;},200);
  }});
  wrapEl.appendChild(h('div',{class:'actions'},[btn]));
  wrapEl.appendChild(slot);
  return wrapEl;
}
function viewBrowse(){
  var chips=h('div',{class:'chips',role:'group','aria-label':'Categories'},['All'].concat(CATS).map(function(c){
    return h('button',{class:'chip',type:'button','aria-pressed':state.cat===c,text:c,onclick:function(){state.cat=c;render('browse','same');}});
  }));
  var list=S.filter(function(s){return state.cat==='All'||s.c===state.cat;});
  return h('div',null,[
    h('h2',{text:'All the spells'}),
    h('p',{class:'note',text:S.length+' spells in '+CATS.length+' categories. Tap one to read it.'}),
    chips,
    h('div',{class:'list'},list.map(function(s){return h('button',{class:'card',type:'button',onclick:function(){showSpell(s,list,'fwd','browse');}},[h('b',{text:s.n}),h('small',{text:s.c})]);}))
  ]);
}
function viewFavs(){
  var list=favs.map(function(i){return S[i];}).filter(Boolean);
  if(!list.length)return h('div',null,[h('h2',{text:'Favourites'}),h('p',{class:'empty',text:'No favourites yet. Tap Save on any spell and it will wait for you here, kept on this device.'})]);
  return h('div',null,[h('h2',{text:'Favourites'}),h('p',{class:'note',text:'Kept on this device only.'}),
    h('div',{class:'list'},list.map(function(s){return h('button',{class:'card',type:'button',onclick:function(){showSpell(s,list,'fwd','favs');}},[h('b',{text:s.n}),h('small',{text:s.c})]);}))]);
}
function viewRemind(){
  var r=LS.get('remind',{on:false,time:'08:00'});
  var timeIn=h('input',{type:'time',id:'remTime',value:r.time});
  var msg=h('p',{class:'note',id:'remMsg'});
  function status(){msg.textContent=r.on?'Reminder is on for '+r.time+' each day. It works while this page is open or installed on your phone. For a reminder that always works, add it to your calendar.':'Reminder is off.';}
  var onBtn=h('button',{class:'btn',type:'button',text:'Turn reminder on',onclick:function(){
    r={on:true,time:timeIn.value||'08:00'};LS.set('remind',r);
    if('Notification' in window&&Notification.permission==='default'){Notification.requestPermission().then(function(p){if(p!=='granted')toast('Notifications are blocked, you will see a note inside the book');});}
    status();toast('Reminder saved');
  }});
  var offBtn=h('button',{class:'btn ghost',type:'button',text:'Turn off',onclick:function(){r.on=false;LS.set('remind',r);status();toast('Reminder is off');}});
  var icsBtn=h('button',{class:'btn ghost small',type:'button',text:'Add to my calendar',onclick:function(){
    var t=(timeIn.value||'08:00').split(':');var d=new Date();var pad=function(n){return String(n).padStart(2,'0');};
    var ds=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(t[0])+pad(t[1])+'00';
    var ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Coffeebreak//Spell Book//EN','BEGIN:VEVENT','UID:cb-spell-'+Date.now()+'@coffeebreak','DTSTAMP:'+ds,'DTSTART:'+ds,'DURATION:PT15M','RRULE:FREQ=DAILY','SUMMARY:Coffeebreak Spell of the Day','DESCRIPTION:Open the Coffeebreak Spell Book for today\'s spell. For fun and inspiration only.','BEGIN:VALARM','TRIGGER:PT0S','ACTION:DISPLAY','DESCRIPTION:Your spell of the day is ready','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
    download(new Blob([ics],{type:'text/calendar'}),'coffeebreak-spell-reminder.ics');toast('Calendar file saved');
  }});
  status();
  return h('div',null,[h('h2',{text:'Daily reminder'}),h('p',{text:'Choose a time for a gentle note to open your spell of the day. This is optional.'}),
    h('label',{class:'row',for:'remTime'},[document.createTextNode('Remind me at '),timeIn]),
    h('div',{class:'actions'},[onBtn,offBtn,icsBtn]),msg]);
}
function showSpell(s,list,dir,from){
  state.spellId=s.id;state.ctx=list;if(from)state.from=from;
  var pos=list.indexOf(s);
  var back=h('button',{class:'btn small ghost',type:'button',text:'\u2190 Back to the list',onclick:function(){render(state.from,'back');}});
  var content=spellView(s,{extra:h('div',null,[ctxNav(list,pos),h('div',{class:'actions'},[back])])});
  swap(content,dir==='back'?'back':'fwd');
  setActiveTab(state.from);
}
function setActiveTab(t){document.querySelectorAll('.tab').forEach(function(b){if(b.dataset.tab===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
function swap(node,dir){
  var back=dir==='back';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function put(){page.innerHTML='';page.appendChild(node);page.scrollTop=0;page.classList.remove('turn-out','back-out');if(!reduce){page.classList.add(back?'back-in':'turn-in');setTimeout(function(){page.classList.remove('turn-in','back-in');},420);}}
  if(reduce||!page.firstChild){put();return;}
  page.classList.add(back?'back-out':'turn-out');
  setTimeout(put,300);
}
function render(tab,dir){
  if(window.CBRelax)window.CBRelax.stop();
  var prev=TABS.indexOf(state.tab);state.tab=tab;state.from=tab;
  var idx=TABS.indexOf(tab);
  var d=dir==='same'?'same':dir||(idx<prev?'back':'fwd');
  var v={today:viewToday,draw:viewDraw,browse:viewBrowse,favs:viewFavs,relax:function(){return window.CBRelax.view();},remind:viewRemind}[tab]();
  if(d==='same'){page.innerHTML='';page.appendChild(v);}else swap(v,d);
  setActiveTab(tab);
}

/* reminder while open */
function checkReminder(){
  var r=LS.get('remind',null);if(!r||!r.on)return;
  var now=new Date(),p=function(n){return String(n).padStart(2,'0');};
  var hm=p(now.getHours())+':'+p(now.getMinutes());
  var key=now.toDateString();
  if(hm>=r.time&&LS.get('lastRemind','')!==key){
    LS.set('lastRemind',key);
    var s=S[todayIndex()];
    if('Notification' in window&&Notification.permission==='granted'){try{new Notification('Your spell of the day',{body:s.n+': '+s.i,icon:'icon-192.png'});}catch(e){}}
    toast('Your spell of the day is ready: '+s.n);
  }
}
setInterval(checkReminder,30000);

/* wiring */
var cover=document.getElementById('cover'),book=document.getElementById('book');
function openBook(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(){cover.classList.add('hidden');cover.classList.remove('opening');book.classList.remove('hidden');render('today','fwd');checkReminder();}
  if(reduce){go();return;}
  cover.classList.add('opening');setTimeout(go,650);
}
function closeBook(){if(window.CBRelax)window.CBRelax.stop();book.classList.add('hidden');cover.classList.remove('hidden');page.innerHTML='';}
document.getElementById('openBtn').addEventListener('click',openBook);
document.getElementById('closeBtn').addEventListener('click',closeBook);
document.getElementById('favCount').addEventListener('click',function(){render('favs');});
document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){render(b.dataset.tab);});});
if(window.CBRelax)window.CBRelax.init({h:h,toast:toast,LS:LS});
updateFavN();
window.__cb={spells:S,todayIndex:todayIndex};
})();
