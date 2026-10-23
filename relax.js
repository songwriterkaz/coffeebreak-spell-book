(function(){
'use strict';
var WARN='For relaxation only. Do not use while driving or operating machinery. Not medical advice.';
var THEMES={
 calm:{name:'Calm',blurb:'Slow, soft and unhurried.',cycle:[4,2,6],freqs:[110,164.81,220,277.18],
  open:['Find a comfortable, safe place to sit or lie down.','Let your shoulders drop and your hands rest.','Breathe in slowly through your nose, and out through your mouth.'],
  mid:['Let the breath find its own slow rhythm.','Notice the weight of your body resting.','Soften your forehead and the space between your eyebrows.','Let your jaw loosen and your tongue rest.','Nothing to fix and nowhere to be right now.','Feel your shoulders drift away from your ears.','Each breath out lets a little more tension go.','Thoughts may come and go like clouds. Let them pass.','Notice your hands, warm and heavy.','Feel the air moving gently in and out.','Let your belly be soft.','You are safe in this quiet moment.','Feel the support beneath you.','Let your breath be easy and unhurried.','Notice the stillness between breaths.','Release any effort from your legs and feet.','Let your eyes be soft, even if they are closed.','Whatever you are carrying can rest for a while.','Feel a gentle warmth spreading through your chest.','Slow and steady, one breath at a time.','Let the sounds around you become part of the quiet.','Notice how much calmer your body already feels.','Rest here as long as you like.','Each breath is a small pause, just for you.'],
  close:['Take one last slow breath.','Gently wiggle your fingers and toes.','When you are ready, carry this calm with you.']},
 confidence:{name:'Confidence',blurb:'Steady, warm and self-assured.',cycle:[4,4,4],freqs:[146.83,220,293.66,369.99],
  open:['Sit comfortably with your back supported.','Let your shoulders settle back and down.','Breathe in steadily, and breathe out slowly.'],
  mid:['Feel your chest open as you breathe in.','You have handled hard things before.','Feel your feet on the ground, steady and strong.','Your voice matters, and you are allowed to use it.','With each breath in, welcome calm strength.','You do not need to be perfect to be worthy.','Let go of the need to prove anything.','Picture yourself standing tall and at ease.','You can take things one step at a time.','Notice what you have already achieved.','Your own pace is a good pace.','Breathe out doubt, and breathe in trust in yourself.','You are allowed to take up space.','Imagine a situation going well, and you feeling steady.','Be kind to yourself, the way you would to a good friend.','Mistakes are part of learning, not a verdict on you.','Feel a quiet confidence growing from within.','You bring your own gifts to everything you do.','It is fine to be a work in progress.','Let your face relax into a small, easy smile.','Your worth is not something you have to earn.','Feel grounded, steady and ready for your day.','You can trust yourself to figure things out.','Breathe in courage, breathe out worry.'],
  close:['Take one last strong, slow breath.','Remember this steady feeling. It belongs to you.','When you are ready, open your eyes and carry on.']},
 sleep:{name:'Sleep',blurb:'Heavy, warm and drifting. Longer breaths out.',cycle:[4,2,8],freqs:[98,146.83,196,246.94],
  open:['Make sure you are somewhere safe and comfortable to rest.','Let your body grow heavy and warm.','Breathe in gently, and let a long breath out.'],
  mid:['With each breath out, sink a little deeper.','Let the day\'s list of things to do fade away.','Relax your eyelids until they feel heavy.','Soften your face, your jaw and your neck.','Let your arms be heavy and loose.','Feel your legs sinking and relaxing.','Nothing more to do today.','Imagine a quiet, dim and comfortable place.','Your breath is slow and sleepy.','Let thoughts drift by without following them.','Feel the warmth of the blanket and the softness of the pillow.','Breathing slower, softer, quieter.','Everything can wait until morning.','Let your mind grow quiet and spacious.','Notice how comfortable it is to rest.','Each breath out is a step toward sleep.','Let go of the day, one muscle at a time.','It is safe to let go.','Let your thoughts become slower and softer.','Feel the gentle rhythm of your breathing.','Rest, easy and heavy, in the quiet.','Sleep can come whenever it is ready.','Drifting, softly drifting.','Heavy, warm and still.'],
  close:['Let your breath carry on slowly by itself.','There is nothing more to do. Rest well.','The tone will fade away. Sleep whenever you are ready.']}
};
var SESSIONS=[
 {id:'pause',name:'Quick pause',mins:3,blurb:'A short reset for a busy moment.',mid:6},
 {id:'settle',name:'Settle',mins:5,blurb:'Time to slow down and unwind.',mid:12},
 {id:'deep',name:'Deep rest',mins:10,blurb:'A long, gentle rest from top to toe.',mid:24}
];
var h,toast,LS;
var prefs={session:'settle',theme:'calm',voice:false,tone:true,vol:0.4};
var P={running:false,paused:false,elapsed:0,last:0,timer:null,lines:[],idx:-1,total:0,theme:null,speed:1,els:null,done:false};
var A={ctx:null,master:null,oscs:[],lfos:[]};

function speedFactor(){
  var m=/[?&]relaxspeed=(\d+)/.exec(location.search);
  var v=m?parseInt(m[1],10):1;return v>0&&v<=60?v:1;
}
function loadPrefs(){var p=LS.get('relax',null);if(p){for(var k in prefs)if(p[k]!==undefined)prefs[k]=p[k];}
  if(!THEMES[prefs.theme])prefs.theme='calm';
  if(!SESSIONS.some(function(s){return s.id===prefs.session;}))prefs.session='settle';}
function savePrefs(){LS.set('relax',prefs);}
function sess(){return SESSIONS.filter(function(s){return s.id===prefs.session;})[0];}
function pick(pool,n){var out=[];for(var i=0;i<n;i++){out.push(pool[Math.floor(i*pool.length/n)]);}return out;}
function buildScript(){
  var s=sess(),t=THEMES[prefs.theme],total=s.mins*60;
  var texts=t.open.concat(pick(t.mid,s.mid),t.close);
  var gap=total/texts.length;
  return texts.map(function(x,i){return {t:Math.round(i*gap),text:x};});
}
function fmt(sec){sec=Math.max(0,Math.ceil(sec));var m=Math.floor(sec/60),s=sec%60;return m+':'+(s<10?'0':'')+s;}
function fmtSpoken(sec){var m=Math.floor(sec/60),s=sec%60;return m+':'+(s<10?'0':'')+s;}

/* audio */
function volGain(){return Math.pow(prefs.vol,2)*0.22;}
function audioStart(){
  if(!prefs.tone)return;
  var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{
    if(!A.ctx){
      A.ctx=new AC();A.master=A.ctx.createGain();A.master.gain.value=0;
      var lp=A.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;lp.Q.value=0.4;
      lp.connect(A.master);A.master.connect(A.ctx.destination);
      var f=THEMES[P.theme||prefs.theme].freqs;
      f.forEach(function(fr,i){
        [-4,4].forEach(function(det){
          var o=A.ctx.createOscillator();o.type='sine';o.frequency.value=fr;o.detune.value=det;
          var g=A.ctx.createGain();g.gain.value=0.12;
          var l=A.ctx.createOscillator();l.frequency.value=0.05+i*0.017;
          var lg=A.ctx.createGain();lg.gain.value=0.07;l.connect(lg);lg.connect(g.gain);
          o.connect(g);g.connect(lp);o.start();l.start();A.oscs.push(o);A.lfos.push(l);
        });
      });
    }
    if(A.ctx.state==='suspended')A.ctx.resume();
    A.master.gain.setTargetAtTime(volGain(),A.ctx.currentTime,1.2);
  }catch(e){}
}
function audioQuiet(){if(A.ctx&&A.master){try{A.master.gain.setTargetAtTime(0,A.ctx.currentTime,0.4);}catch(e){}}}
function audioStop(){
  if(!A.ctx)return;var c=A.ctx,o=A.oscs,l=A.lfos;
  try{A.master.gain.setTargetAtTime(0,c.currentTime,0.5);}catch(e){}
  A.ctx=null;A.master=null;A.oscs=[];A.lfos=[];
  setTimeout(function(){try{o.concat(l).forEach(function(x){x.stop();});c.close();}catch(e){}},2500);
}
function audioVol(){if(A.ctx&&A.master&&prefs.tone&&P.running&&!P.paused)A.master.gain.setTargetAtTime(volGain(),A.ctx.currentTime,0.1);}

/* speech */
function hasSpeech(){return 'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;}
function speak(text){
  if(!prefs.voice||!hasSpeech())return;
  try{
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    u.rate=0.8;u.pitch=0.95;u.volume=Math.min(1,0.5+prefs.vol*0.5);
    var vs=speechSynthesis.getVoices()||[];
    var en=vs.filter(function(v){return /^en/i.test(v.lang);});
    var soft=en.filter(function(v){return /female|samantha|karen|moira|tessa|serena|natural|google uk english female|libby|sonia|aria/i.test(v.name);});
    var v=soft[0]||en[0];if(v){u.voice=v;u.lang=v.lang;}else u.lang='en-AU';
    speechSynthesis.speak(u);
  }catch(e){}
}
function speechStop(){if(hasSpeech()){try{speechSynthesis.cancel();}catch(e){}}}

/* breathing */
function ease(x){return x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2;}
function phaseAt(sec,cyc){
  var tot=cyc[0]+cyc[1]+cyc[2],p=sec%tot;
  if(p<cyc[0])return {name:'Breathe in',k:ease(p/cyc[0])};
  p-=cyc[0];if(p<cyc[1])return {name:'Hold gently',k:1};
  p-=cyc[1];return {name:'Breathe out',k:1-ease(p/cyc[2])};
}
function reduced(){return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;}

function tick(){
  if(!P.running||P.paused||!P.els)return;
  var now=performance.now();P.elapsed+=(now-P.last)/1000*P.speed;P.last=now;
  if(P.elapsed>=P.total){finish();return;}
  update();
}
function update(){
  var E=P.els,cyc=THEMES[P.theme].cycle,ph=phaseAt(P.elapsed,cyc);
  var lo=reduced()?0.88:0.55;
  E.circle.style.transform='scale('+(lo+(1-lo)*ph.k).toFixed(3)+')';
  E.glow.style.opacity=(0.35+0.5*ph.k).toFixed(2);
  if(E.phase.textContent!==ph.name)E.phase.textContent=ph.name;
  E.time.textContent=fmt(P.total-P.elapsed)+' left';
  E.bar.style.width=(100*P.elapsed/P.total).toFixed(1)+'%';
  E.bar.parentNode.setAttribute('aria-valuenow',Math.round(100*P.elapsed/P.total));
  var i=P.idx;
  while(i+1<P.lines.length&&P.lines[i+1].t<=P.elapsed)i++;
  if(i!==P.idx){P.idx=i;showLine(P.lines[i].text);speak(P.lines[i].text);
    var items=E.script.querySelectorAll('li');items.forEach(function(li,k){if(k===i)li.setAttribute('aria-current','true');else li.removeAttribute('aria-current');});}
}
function showLine(text){
  var w=P.els.words;w.style.opacity=0;
  setTimeout(function(){if(P.els&&P.els.words===w){w.textContent=text;w.style.opacity=1;}},350);
}
function finish(){
  P.running=false;P.done=true;clearInterval(P.timer);speechStop();audioStop();
  var E=P.els;if(!E)return;
  E.circle.style.transform='scale(0.55)';E.phase.textContent='Complete';E.time.textContent='0:00 left';E.bar.style.width='100%';
  E.words.style.opacity=1;E.words.textContent='Well done for taking this time for yourself.';
  E.pauseBtn.classList.add('hidden');E.endBtn.textContent='Back to sessions';
  E.endBtn.classList.remove('ghost');
  E.done.classList.remove('hidden');
}
function begin(){
  var s=sess();
  P.theme=prefs.theme;P.total=s.mins*60;P.lines=buildScript();P.idx=-1;P.elapsed=0;P.speed=speedFactor();
  P.running=true;P.paused=false;P.done=false;
  buildPlayer();
  P.last=performance.now();
  audioStart();
  update();
  clearInterval(P.timer);P.timer=setInterval(tick,100);
}
function stop(){
  clearInterval(P.timer);P.running=false;P.paused=false;P.done=false;P.els=null;
  speechStop();audioStop();
}
function pauseToggle(){
  if(!P.running)return;
  P.paused=!P.paused;
  if(P.paused){speechStop();audioQuiet();P.els.pauseBtn.textContent='Resume';P.els.phase.textContent='Paused';}
  else{P.last=performance.now();P.els.pauseBtn.textContent='Pause';audioStart();}
}
function endSession(){stop();mount();}

/* views */
var root=null;
function scriptList(lines,withTimes){
  return h('ol',{class:'rx-script'},lines.map(function(l){return h('li',null,[h('span',{class:'rx-ts',text:fmtSpoken(l.t)}),document.createTextNode(' '+l.text)]);}));
}
function toggleBtn(label,on,fn,id){
  var b=h('button',{class:'rx-toggle',type:'button',role:'switch','aria-checked':on?'true':'false',id:id,onclick:function(){var v=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',v?'true':'false');b.querySelector('.rx-state').textContent=v?'On':'Off';fn(v);}},
    [h('span',{class:'rx-lab',text:label}),h('span',{class:'rx-state',text:on?'On':'Off'})]);
  return b;
}
function setupView(){
  var wrap=h('div',{class:'rx'});
  wrap.appendChild(h('h2',{text:'Calm guided relaxation'}));
  wrap.appendChild(h('p',{class:'note',text:'A gentle breathing session for your own rest and self-confidence. Follow the circle, read the soft words, or switch on a spoken voice and a quiet tone.'}));
  wrap.appendChild(h('p',{class:'rx-warn',role:'note',text:WARN}));

  wrap.appendChild(h('h3',{text:'Choose a session'}));
  var sessBox=h('div',{class:'rx-sessions',role:'radiogroup','aria-label':'Session length'});
  SESSIONS.forEach(function(s){
    var b=h('button',{class:'rx-card',type:'button',role:'radio','aria-checked':prefs.session===s.id?'true':'false','data-session':s.id,onclick:function(){prefs.session=s.id;savePrefs();mount();}},
      [h('b',{text:s.name}),h('span',{class:'rx-mins',text:s.mins+' minutes'}),h('small',{text:s.blurb})]);
    sessBox.appendChild(b);
  });
  wrap.appendChild(sessBox);

  wrap.appendChild(h('h3',{text:'Choose a theme'}));
  var chips=h('div',{class:'chips',role:'group','aria-label':'Theme'},Object.keys(THEMES).map(function(k){
    return h('button',{class:'chip',type:'button','data-theme':k,'aria-pressed':prefs.theme===k?'true':'false',text:THEMES[k].name,onclick:function(){prefs.theme=k;savePrefs();mount();}});
  }));
  wrap.appendChild(chips);
  wrap.appendChild(h('p',{class:'note',text:THEMES[prefs.theme].blurb}));

  wrap.appendChild(h('h3',{text:'Sound'}));
  var vNote=h('p',{class:'note',id:'rxVoiceNote',text:hasSpeech()?'The voice uses your device\'s built-in speech. How it sounds depends on your device.':'Spoken voice is not available in this browser. You can still read the words on screen.'});
  var vt=toggleBtn('Spoken voice',prefs.voice&&hasSpeech(),function(v){prefs.voice=v;savePrefs();if(!v)speechStop();},'rxVoice');
  if(!hasSpeech())vt.setAttribute('disabled','disabled');
  var tt=toggleBtn('Soft tone',prefs.tone,function(v){prefs.tone=v;savePrefs();if(P.running){if(v)audioStart();else audioStop();}},'rxTone');
  var vol=h('input',{type:'range',min:'0',max:'1',step:'0.05',value:String(prefs.vol),id:'rxVol','aria-label':'Tone volume'});
  vol.addEventListener('input',function(){prefs.vol=parseFloat(vol.value);savePrefs();audioVol();volOut.textContent=Math.round(prefs.vol*100)+'%';});
  var volOut=h('span',{class:'rx-volout',text:Math.round(prefs.vol*100)+'%'});
  wrap.appendChild(h('div',{class:'rx-sound'},[vt,tt,h('label',{class:'rx-vol',for:'rxVol'},[h('span',{text:'Volume'}),vol,volOut])]));
  wrap.appendChild(vNote);

  wrap.appendChild(h('div',{class:'actions'},[h('button',{class:'btn',type:'button',id:'rxStart',text:'Begin '+sess().mins+' minute session',onclick:begin})]));

  var lines=buildScript();
  var det=h('details',{class:'rx-text'},[h('summary',{text:'Read the text version'}),h('p',{class:'note',text:THEMES[prefs.theme].name+', '+sess().mins+' minutes. The same words are shown and spoken during the session.'}),scriptList(lines)]);
  wrap.appendChild(det);
  wrap.appendChild(h('p',{class:'note rx-foot',text:'Written for your own relaxation and self-confidence only.'}));
  return wrap;
}
function buildPlayer(){
  var th=THEMES[P.theme];
  root.innerHTML='';
  var wrap=h('div',{class:'rx rx-player'});
  var glow=h('div',{class:'rx-glow','aria-hidden':'true'});
  var circle=h('div',{class:'rx-circle','aria-hidden':'true'});
  var stage=h('div',{class:'rx-stage'},[glow,circle]);
  var phase=h('div',{class:'rx-phase',role:'status','aria-live':'off',text:'Breathe in'});
  var words=h('p',{class:'rx-words','aria-live':'polite',text:''});
  var time=h('div',{class:'rx-time',text:fmt(P.total)+' left'});
  var bar=h('div',{class:'rx-bar',role:'progressbar','aria-label':'Session progress','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':'0'},[h('span')]);
  var pauseBtn=h('button',{class:'btn small',type:'button',id:'rxPause',text:'Pause',onclick:pauseToggle});
  var endBtn=h('button',{class:'btn small ghost',type:'button',id:'rxEnd',text:'End session',onclick:endSession});
  var vt=toggleBtn('Voice',prefs.voice&&hasSpeech(),function(v){prefs.voice=v;savePrefs();if(!v)speechStop();else if(P.idx>=0)speak(P.lines[P.idx].text);},'rxVoice2');
  if(!hasSpeech())vt.setAttribute('disabled','disabled');
  var tt=toggleBtn('Tone',prefs.tone,function(v){prefs.tone=v;savePrefs();if(v){if(!P.paused)audioStart();}else audioStop();},'rxTone2');
  var vol=h('input',{type:'range',min:'0',max:'1',step:'0.05',value:String(prefs.vol),id:'rxVol2','aria-label':'Tone volume'});
  vol.addEventListener('input',function(){prefs.vol=parseFloat(vol.value);savePrefs();audioVol();});
  var script=scriptList(P.lines);
  var det=h('details',{class:'rx-text'},[h('summary',{text:'Text version'}),script]);
  var done=h('p',{class:'note hidden rx-done',text:'Session complete. Take a moment before you get up. '});
  wrap.appendChild(h('div',{class:'rx-head'},[h('span',{class:'cat',text:th.name}),h('span',{class:'note',text:sess().name+', '+sess().mins+' minutes'})]));
  wrap.appendChild(stage);wrap.appendChild(phase);wrap.appendChild(words);wrap.appendChild(time);wrap.appendChild(bar);
  wrap.appendChild(h('div',{class:'actions rx-ctl'},[pauseBtn,endBtn]));
  wrap.appendChild(h('div',{class:'rx-sound'},[vt,tt,h('label',{class:'rx-vol',for:'rxVol2'},[h('span',{text:'Volume'}),vol])]));
  wrap.appendChild(done);
  wrap.appendChild(det);
  wrap.appendChild(h('p',{class:'rx-warn',role:'note',text:WARN}));
  root.appendChild(wrap);
  P.els={circle:circle,glow:glow,phase:phase,words:words,time:time,bar:bar.firstChild,pauseBtn:pauseBtn,endBtn:endBtn,script:script,done:done};
  bar.firstChild.parentNode.setAttribute('aria-valuenow','0');
  P.els.bar=bar.firstChild;
}
function mount(){
  root.innerHTML='';root.appendChild(setupView());
}
function view(){
  loadPrefs();stop();
  root=h('div',{id:'rxRoot'});
  mount();
  return root;
}
window.CBRelax={
  init:function(o){h=o.h;toast=o.toast;LS=o.LS;},
  view:view,
  stop:stop,
  debug:function(){return {running:P.running,paused:P.paused,done:P.done,elapsed:P.elapsed,total:P.total,idx:P.idx,audio:A.ctx?A.ctx.state:'none',gain:A.master?A.master.gain.value:null,osc:A.oscs.length,prefs:prefs};}
};
})();
