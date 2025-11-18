const stage = document.getElementById('stage');
const charEl = document.getElementById('char');
const charImg = document.getElementById('charImg');
const fallback = document.getElementById('fallback');
const speech = document.getElementById('speech');

const term = document.getElementById('term');
const cmdForm = document.getElementById('cmdForm');
const cmdInput = document.getElementById('cmdInput');
const runBtn = document.getElementById('runBtn');
const rollBtn = document.getElementById('rollBtn');
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const errorSlider = document.getElementById('errorChance');
const errorLabel = document.getElementById('errorLabel');
const stepSlider = document.getElementById('stepSize');
const stepLabel = document.getElementById('stepLabel');
const clock = document.getElementById('clock');
const helpBtn = document.getElementById('helpBtn');

let started = false, startTime = null, clockId = null;
let step = Number(stepSlider.value || 100);
let nextGarbled = false, swappedAxes = false, ignoreNext = false, frozenUntil = 0;

const state = { x: 0, y: 0, emotion: 'happy', pose: 'T' };
const EMOTIONS = ['happy','sad','angry','confused'];
const POSES = ['T','star','point'];
const spriteExists = new Map();

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function nowClock(){
  const s = Math.floor((Date.now()-startTime)/1000);
  clock.textContent = `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function log(t, cls='sys'){
  const p = document.createElement('p');
  p.className = `line ${cls}`;
  p.textContent = t;
  term.appendChild(p);
  term.scrollTop = term.scrollHeight;
}
function loadImage(url, cb){ const i=new Image(); i.onload=()=>cb(true); i.onerror=()=>cb(false); i.src=url; }
function garble(s){
  const symbols = ['#','%','&','*','+','?','/','~','@','¢','§','µ','¥','¬'];
  const randomLetter = () =>
    String.fromCharCode(97 + Math.floor(Math.random()*26)); // a–z
  let chars = s.split('');
  let out = chars.map((c, i) => {
    let r = Math.random();
    if (r < 0.10) {
      c = randomLetter() + c;
    }
    else if (r < 0.20) {
      c = c + symbols[Math.floor(Math.random()*symbols.length)];
    }
    else if (r < 0.30) {
      c = randomLetter();
    }
    else if (r < 0.40) {
      c = symbols[Math.floor(Math.random()*symbols.length)];
    }
    else if (r < 0.50) {
      c = c + c;
    }
    else {
      const m = {a:'ä',e:'€',i:'¡',o:'ø',u:'ʉ',A:'Å',E:'Σ',I:'Ï',O:'Ø',U:'Û'};
      if (m[c]) c = m[c];
    }
    return c;
  });
  if (out.length > 3 && Math.random() < 0.10) {
    const i = Math.floor(Math.random()*out.length);
    const j = Math.floor(Math.random()*out.length);
    let temp = out[i];
    out[i] = out[j];
    out[j] = temp;
  }
  return out.join('');
}

function centerCharacter(){ state.x=0; state.y=0; updateTransform(); }
function updateTransform(){ charEl.style.transform=`translate(-50%,-50%) translate(${state.x}px,${state.y}px)`; }
function spritePath(e,p){ return `sprites/${e}_${p}.png`; }
function showFallback(){
  charImg.removeAttribute('src'); charImg.style.display='none'; fallback.style.display='grid';
  fallback.textContent = ({happy:'🙂',sad:'😢',angry:'😠',confused:'😕'})[state.emotion] || '🙂';
}
function applySprite(){
  const key=`${state.emotion}_${state.pose}`, src=spritePath(state.emotion,state.pose);
  if(spriteExists.has(key) && !spriteExists.get(key)) return showFallback();
  loadImage(src, ok=>{
    spriteExists.set(key, ok);
    if(ok){ charImg.src=src; charImg.style.display='block'; fallback.style.display='none'; }
    else{ showFallback(); log(`Missing sprite: ${key}.png → /sprites`, 'err'); }
  });
}
function say(text, ms=1600){
  const c = nextGarbled ? garble(text) : text;
  nextGarbled = false;
  speech.textContent = c;
  speech.hidden = false;
  setTimeout(()=>{ speech.hidden = true; }, ms);
}

/* Session */
function setEnabled(live){
  cmdInput.disabled = !live;
  runBtn.disabled   = !live;
  rollBtn.disabled  = !live;
  endBtn.disabled   = !live;
  startBtn.disabled = live;
}
function start(){
  if(started) return;
  started = true;
  startTime = Date.now();
  clockId = setInterval(nowClock, 1000);
  setEnabled(true);
  centerCharacter();
  applySprite();
  log('🎬 PLAY — audience may program the Character.', 'sys');
  showHelpPanel();
}
function end(){
  setEnabled(false);
  started = false;
  clearInterval(clockId);
  log('🏁 STOP — curtain call. ✅', 'sys');
}

/* Commands */
function chanceInterrupt(){ return Math.random()*100 < Number(errorSlider.value); }
function runCommand(raw){
  const now=Date.now(); if(now<frozenUntil){ log('(ignored due to freeze)','sys'); return; }
  const line=raw.trim(); if(!line) return;
  log(`> ${line}`, 'user');
  if(chanceInterrupt()){ triggerInterrupt(); return; }
  interpret(line);
}
function interpret(cmd){
  const lower = cmd.toLowerCase();

  if(lower==='help' || lower==='commands'){ showHelpPanel(); return; }

  if(lower.startsWith('clear()')){
    swappedAxes=false; nextGarbled=false; state.emotion='happy'; state.pose='T';
    centerCharacter(); applySprite(); say('reset'); log('Reset: emotion=happy, pose=T, centered.','sys'); return;
  }

  if(lower.startsWith('wait(') && lower.endsWith(')')){
    const ms=Number(cmd.match(/wait\((\d+)\)/i)?.[1]||1000); frozenUntil=Date.now()+ms;
    log(`Freeze for ~${Math.round(ms/1000)}s.`,'sys'); return;
  }

  if(lower.startsWith('print(')){
    let text=cmd.match(/print\((.*)\)/i)?.[1]??'""'; text=text.replace(/^"(.*)"$/,'$1');
    say(text); log(`SAY: ${text}`,'sys'); return;
  }

  if(lower.startsWith('emotion(')){
    const val=cmd.match(/emotion\(["']?([a-z]+)["']?\)/i)?.[1]||'happy';
    state.emotion=val.toLowerCase(); applySprite(); log(`EMOTION → ${state.emotion}`,'sys'); return;
  }

  if(lower.startsWith('pose(')){
    let p=cmd.match(/pose\(["']?([A-Za-z]+)["']?\)/i)?.[1]||'T';
    if(!POSES.includes(p)){ log(`Unknown pose "${p}". Try T | star | point.`,'err'); return; }
    state.pose=p; applySprite(); log(`POSE → ${state.pose}`,'sys'); return;
  }

  if(lower.startsWith('move(')){
    let dir=cmd.match(/move\(["']?([a-z]+)["']?\)/i)?.[1]||'right';
    dir=dir.toLowerCase();
    if(swappedAxes){
      if(dir==='left')dir='right'; else if(dir==='right')dir='left';
      else if(dir==='up')dir='down'; else if(dir==='down')dir='up';
      swappedAxes=false;
    }
    if(dir==='left')  state.x -= step;
    if(dir==='right') state.x += step;
    if(dir==='up')    state.y -= step;
    if(dir==='down')  state.y += step;
    updateTransform();
    log(`MOVE: ${dir} (${state.x}, ${state.y})`,'sys'); return;
  }

  if(lower.startsWith('repeat(')){
    const m=cmd.match(/repeat\((\d+)\s*,\s*(.+)\)$/i); const n=Math.min(Number(m?.[1]||1),4); const inner=(m?.[2]||'').trim();
    for(let i=1;i<=n;i++){ log(`— repeat ${i}/${n}`,'sys'); interpret(inner); } return;
  }

  log('Unknown command. Type `help` for options.','err');
}

/* Interrupts */
const INTERRUPTS=[
  {name:'Lag',action:freeze},
  {name:'Bugged Keyboard',action:glitch},
  {name:'System Reboot',action:reboot},
  {name:'Swapped Axes',action:swap}
];
function triggerInterrupt(){ const ev=INTERRUPTS[Math.floor(Math.random()*INTERRUPTS.length)]; log(`!! Interrupt: ${ev.name}`,'err'); ev.action(); }
function freeze(){ const sec=3+Math.floor(Math.random()*3); frozenUntil=Date.now()+sec*1000; log(`(Freeze ${sec}s)`,'sys'); }
function glitch(){ nextGarbled=true; log('Bugged Keyboard - Next words are garbled.','sys'); }
function reboot(){ swappedAxes=false; nextGarbled=false; centerCharacter(); state.emotion='happy'; state.pose='T'; applySprite();
  say('reboot'); ignoreNext=true; log('System Reboot - reset and ignore the next command.','sys'); }
function swap(){ swappedAxes=true; log('Swapped Axes - left - right, up - down for next move().','sys'); }

/* UI */
errorSlider.addEventListener('input',()=>{ errorLabel.textContent=`${errorSlider.value}%`; });
stepSlider.value=100; stepLabel.textContent=`100px`;
stepSlider.addEventListener('input',()=>{ step=Number(stepSlider.value); stepLabel.textContent=`${step}px`; });

startBtn.addEventListener('click', start);
endBtn.addEventListener('click', end);
rollBtn.addEventListener('click', ()=>{ if(started) triggerInterrupt(); });

cmdForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  const raw=cmdInput.value.trim(); if(!started) return;
  if(ignoreNext){ log('(ignored due to reboot)','sys'); ignoreNext=false; cmdInput.value=''; return; }
  runCommand(raw); cmdInput.value='';
});

/* template buttons: auto-start and prefill; help types into console */
document.querySelectorAll('.buttons .btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(btn.id==='helpBtn'){
      if(!started) start();
      runCommand('help');
      return;
    }
    if(!started) start();
    const tpl = btn.getAttribute('data-template');
    const cmd = btn.getAttribute('data-cmd');
    if(tpl){
      cmdInput.value = tpl;
      cmdInput.focus();
      let pos = tpl.indexOf('""'); if(pos>=0){ cmdInput.setSelectionRange(pos+1,pos+1); return; }
      pos = tpl.indexOf('()'); if(pos>=0){ cmdInput.setSelectionRange(pos+1,pos+1); return; }
      cmdInput.setSelectionRange(tpl.length, tpl.length);
    }else if(cmd){
      runCommand(cmd);
    }
  });
});

function onResize(){ updateTransform(); }
window.addEventListener('resize', onResize);

/* sprite detection */
function detectSprites(){
  EMOTIONS.forEach(e=> POSES.forEach(p=>{
    const key=`${e}_${p}`, path=spritePath(e,p);
    loadImage(path, ok=>{ spriteExists.set(key,ok); if(!ok) log(`(optional) Add: ${key}.png`,'err'); });
  }));
}

/* help (one command per line) */
function showHelpPanel(){
  log('Available Commands:', 'sys');
  log(' print("text")', 'sys');
  log(' move("left" | "right" | "up" | "down")', 'sys');
  log(' emotion("happy" | "sad" | "angry" | "confused")', 'sys');
  log(' pose("T" | "star" | "point")', 'sys');
  log(' repeat(n, command)', 'sys');
  log(' wait(ms)', 'sys');
  log(' clear()', 'sys');
  log(' help', 'sys');
}

function init(){ setEnabled(false); errorLabel.textContent=`${errorSlider.value}%`; detectSprites(); applySprite(); }
init();
