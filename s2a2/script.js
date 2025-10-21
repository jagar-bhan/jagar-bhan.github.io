// ====== Albums: audio + .lrc ======
const albums = {
    1:{ 
        title:"Lungs",
        artist:"Florence & the Machine",
        song:"Dog Days are Over",
        audio:"audio/lungs.mp3",
        lrcUrl:"lyrics/lungs.lrc"
    },
    2:{
        title:"Le Tigre",
        artist:"Le Tigre",
        song:"Deceptacon",
        audio:"audio/letigre.mp3",
        lrcUrl:"lyrics/letigre.lrc"
    },
    3:{
        title:"Songs About Jane",
        artist:"Maroon 5",
        song:"Sunday Morning",
        audio:"audio/saj.mp3",
        lrcUrl:"lyrics/saj.lrc"
    },
    4:{
        title:"Currents",
        artist:"Tame Impala",
        song:"Let it Happen",
        audio:"audio/currents.mp3",
        lrcUrl:"lyrics/currents.lrc"
    },
    5:{
        title:"Is This It",
        artist:"The Strokes",
        song:"Last Nite",
        audio:"audio/isthisit.mp3",
        lrcUrl:"lyrics/isthisit.lrc"
    }
};

// DOM
const panel   = document.getElementById("infoPanel");
const content = document.getElementById("infoContent");
const overlay = document.getElementById("overlay");
const closeBtn= document.getElementById("closeBtn");

// Single audio element
const player = new Audio();
let cleanupLyricsSync = () => {};
let isUserScrubbing = false;

// Helpers
const fmt = t => !isFinite(t) ? "0:00" : `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,"0")}`;

// Build panel
function renderPanel(a){
  content.innerHTML = `
    <h2 class="album-title">${a.title}</h2>
    <p class="artist-name">${a.artist}</p>
    <p class="song-title"><strong>Now Playing:</strong> ${a.song}</p>
    <div class="player">
      <button class="play-btn" id="playBtn" aria-pressed="true">Pause</button>
      <input type="range" id="seek" class="seek" min="0" max="1000" value="0" step="1" aria-label="Seek">
      <div class="time"><span id="cur">0:00</span> / <span id="dur">0:00</span></div>
    </div>
    <div class="lyrics" id="lyrics"><span class="loading">Loading lyrics…</span></div>
  `;
}

// ----- LRC parsing -----
function parseLRC(text){
  const lines = text.split(/\r?\n/), tag=/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?]/g, out=[];
  for(const raw of lines){
    let lyric = raw.replace(tag,"").trim();
    if(!lyric && !/\[\d/.test(raw)) continue;
    let m;
    while((m=tag.exec(raw))){ 
      const mm=+m[1], ss=+m[2], ms=m[3]? +m[3].padEnd(3,"0"):0;
      out.push({time:mm*60+ss+ms/1000, text:lyric});
    }
  }
  return out.sort((a,b)=>a.time-b.time);
}

// ----- Render lyrics with top/bottom spacers for true centering -----
function renderLyricsWithSpacers(entries){
  const box = document.getElementById("lyrics");
  if(!entries.length){ box.textContent="(No lyrics found.)"; return; }

  // Build fragment
  const frag = document.createDocumentFragment();

  const top = document.createElement("div");
  top.className = "lyric-spacer";
  frag.appendChild(top);

  for(const e of entries){
    const line = document.createElement("div");
    line.className = "lyric-line";
    line.dataset.time = e.time;
    line.textContent = e.text || " ";
    frag.appendChild(line);
  }

  const bottom = document.createElement("div");
  bottom.className = "lyric-spacer";
  frag.appendChild(bottom);

  box.innerHTML = "";
  box.appendChild(frag);

  // Make lines clickable to seek
  box.onclick = (ev)=>{
    const el = ev.target.closest(".lyric-line");
    if(!el) return;
    const t = Number(el.dataset.time);
    if(isFinite(t)) player.currentTime = t;
  };

  // Set spacer heights = half container height – half line height
  const anyLine = box.querySelector(".lyric-line");
  const lineH = anyLine ? anyLine.getBoundingClientRect().height : 24;
  function sizeSpacers(){
    const h = box.clientHeight/2 - lineH/2;
    const px = Math.max(0, Math.floor(h));
    top.style.height = px+"px";
    bottom.style.height = px+"px";
  }
  sizeSpacers();
  // Resize observer keeps spacers correct if panel size changes
  const ro = new ResizeObserver(sizeSpacers);
  ro.observe(box);

  return { lines: Array.from(box.querySelectorAll(".lyric-line")), disconnect: ()=>ro.disconnect() };
}

// Binary search: last index with time <= t
function activeIndex(entries, t){
  let lo=0, hi=entries.length-1, ans=0;
  while(lo<=hi){
    const mid=(lo+hi)>>1;
    if(entries[mid].time<=t){ ans=mid; lo=mid+1; }
    else hi=mid-1;
  }
  return ans;
}

// ----- Sync to audio: keep active line centered -----
function syncLyrics(entries, lines, onResizeCenter){
  const box = document.getElementById("lyrics");
  let last=-1;

  function centerOn(el){
    if(!el) return;
    const target = el.offsetTop - (box.clientHeight - el.clientHeight)/2;
    const clamped = Math.max(0, Math.min(target, box.scrollHeight - box.clientHeight));
    // only smooth-scroll if far; prevents jitter
    const far = Math.abs(box.scrollTop - clamped) > 8;
    box.scrollTo({ top: clamped, behavior: far ? "smooth" : "auto" });
  }

  function update(){
    const i = activeIndex(entries, player.currentTime);
    if(i === last) return;
    if(last>=0) lines[last].classList.remove("active");
    lines[i]?.classList.add("active");
    last = i;
    centerOn(lines[i]);
  }

  player.addEventListener("timeupdate", update);
  player.addEventListener("seeked", update);
  player.addEventListener("loadedmetadata", update);
  player.addEventListener("play", update);
  window.addEventListener("resize", ()=>onResizeCenter());

  // initial center
  requestAnimationFrame(update);

  // cleanup
  return ()=> {
    player.removeEventListener("timeupdate", update);
    player.removeEventListener("seeked", update);
    player.removeEventListener("loadedmetadata", update);
    player.removeEventListener("play", update);
    window.removeEventListener("resize", ()=>onResizeCenter());
  };
}

// Load LRC, render, and start syncing
async function loadLyricsAndSync(url){
  const box = document.getElementById("lyrics");
  box.innerHTML = `<span class="loading">Loading lyrics…</span>`;
  try{
    const res = await fetch(url, { cache:"no-store" });
    if(!res.ok) throw new Error(res.status);
    const text = await res.text();
    const entries = parseLRC(text);
    const rendered = renderLyricsWithSpacers(entries);
    const centerAgain = ()=> {
      const i = activeIndex(entries, player.currentTime);
      const el = rendered.lines[i];
      if(el){
        const target = el.offsetTop - (box.clientHeight - el.clientHeight)/2;
        box.scrollTop = Math.max(0, Math.min(target, box.scrollHeight - box.clientHeight));
      }
    };
    cleanupLyricsSync = syncLyrics(entries, rendered.lines, centerAgain);
  }catch(e){
    box.innerHTML = `<span class="error">Couldn't load synced lyrics.</span>`;
    cleanupLyricsSync = ()=>{};
  }
}

// Controls
function wireControls(){
  const playBtn = document.getElementById("playBtn");
  const seek    = document.getElementById("seek");
  const cur     = document.getElementById("cur");
  const dur     = document.getElementById("dur");

  playBtn.onclick = ()=> {
    if(player.paused){ player.play(); playBtn.textContent="Pause"; playBtn.setAttribute("aria-pressed","true"); }
    else { player.pause(); playBtn.textContent="Play"; playBtn.setAttribute("aria-pressed","false"); }
  };

  player.addEventListener("loadedmetadata", ()=> dur.textContent = fmt(player.duration), { once:true });

  player.addEventListener("timeupdate", ()=> {
    if(!isUserScrubbing){
      const ratio = player.currentTime / (player.duration || 1);
      seek.value = String(Math.round(ratio*1000));
    }
    cur.textContent = fmt(player.currentTime);
  });

  seek.addEventListener("input", ()=> isUserScrubbing = true);
  seek.addEventListener("change", ()=> {
    player.currentTime = (Number(seek.value)/1000) * (player.duration || 0);
    isUserScrubbing = false;
  });

  player.addEventListener("ended", ()=> {
    playBtn.textContent = "Play";
    playBtn.setAttribute("aria-pressed","false");
  }, { once:true });
}

// Open / close
async function playAlbum(id){
  const a = albums[id]; if(!a) return;
  renderPanel(a);
  panel.classList.add("active"); overlay.classList.add("active");

  player.src = a.audio; player.currentTime = 0;
  player.play().catch(()=>{ const btn=document.getElementById("playBtn"); if(btn){ btn.textContent="Play"; btn.setAttribute("aria-pressed","false"); } });

  wireControls();
  cleanupLyricsSync();
  await loadLyricsAndSync(a.lrcUrl);
}

function closeInfo(){
  panel.classList.remove("active"); overlay.classList.remove("active");
  player.pause(); cleanupLyricsSync();
}

// Bindings
document.querySelectorAll(".cloud").forEach(c => c.addEventListener("click", ()=>playAlbum(c.dataset.album)));
overlay.addEventListener("click", closeInfo);
closeBtn.addEventListener("click", closeInfo);
document.addEventListener("keydown", e => { if(e.key==="Escape") closeInfo(); });
