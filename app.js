/* ============================================================
   Stronger with Zoe — app.js  (v1.0)
   Single-page PWA. Views: onboarding · today · week · workout · player ·
   history · rules · settings. Storage: localStorage (offline-first) with
   optional Google Apps Script sync (settings.api).
   ============================================================ */
const APP_VERSION = "1.0.1";
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2,"0");
const fmtClock = s => { s=Math.max(0,Math.round(s)); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return h? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`; };
const fmtMin = s => { const m=Math.round(s/60); return m>=60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m} min`; };
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const fmtDate = d => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const fmtTime = d => d.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36);
const isTouch = matchMedia("(pointer:coarse)").matches;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);

/* ── Storage ─────────────────────────────── */
const LS = {
  get(k, d){ try{ const v=localStorage.getItem("swz_"+k); return v==null? d : JSON.parse(v);}catch(e){return d;} },
  set(k, v){ try{ localStorage.setItem("swz_"+k, JSON.stringify(v)); }catch(e){} }
};
const state = {
  profiles: LS.get("profiles", []),
  current: LS.get("current", null),          // email
  sessions: LS.get("sessions", []),          // all users
  loads: LS.get("loads", []),
  feedback: LS.get("feedback", []),
  settings: Object.assign({unit:"lb", sound:!isIOS, autoAdvance:true, watch:true, tv:false, api:"", time:"12:00", beeps:true}, LS.get("settings", {})),
  view: "today", weekShown: null, showNext:false
};
const save = () => { LS.set("profiles",state.profiles); LS.set("current",state.current); LS.set("sessions",state.sessions); LS.set("loads",state.loads); LS.set("feedback",state.feedback); LS.set("settings",state.settings); };
const me = () => state.profiles.find(p=>p.email===state.current) || null;
const mySessions = () => state.sessions.filter(s=>s.email===state.current && s.dur>=300).sort((a,b)=>b.start.localeCompare(a.start));
const myLoads = () => state.loads.filter(l=>l.email===state.current);

/* ── Program helpers ─────────────────────── */
const B1 = PROGRAM.blocks[0], B2 = PROGRAM.blocks[1];
const PSTART = parseISO(B1.start), PEND = parseISO(B2.end);
function weekOf(date){ const d=Math.floor((date - PSTART)/864e5); return Math.max(1, Math.min(4, Math.floor(d/7)+1)); }
function rawWeek(date){ return Math.floor((date - PSTART)/864e5/7)+1; }
function weekStart(n){ return addDays(PSTART, (n-1)*7); }
function blockOfWeek(n){ return n<=2 ? B1 : B2; }
function workoutFor(date){ const n=rawWeek(date); if(n<1||n>4) return null; return WORKOUTS[blockOfWeek(n).schedule[date.getDay()]]; }
function estSecs(W){
  let t=0;
  for(const sec of W.sections){
    if(sec.cap){ t+=sec.cap; continue; }
    let per=0;
    for(const it of sec.items){ const mult=it.each?2:1; per += (it.secs? it.secs : (parseInt(it.reps)||10)*3.2 + 8) * mult; }
    if(sec.restItem) per += sec.restItem*(sec.items.length-1);
    t += per*sec.rounds + (sec.restRound||0)*(sec.rounds-1);
  }
  return t;
}
function equipmentOf(W){ const s=new Set(); for(const sec of W.sections) for(const it of sec.items) (it.eq||[]).forEach(e=>s.add(e)); if(W.kind!=="rest") s.add("water"); return [...s]; }
function exKey(name){ return name.toLowerCase().replace(/\(.*?\)/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim(); }
function lastLoad(name, beforeSid){ const k=exKey(name); const L=myLoads().filter(l=>l.ex===k && l.sid!==beforeSid).sort((a,b)=>b.date.localeCompare(a.date)); return L[0]||null; }
function loadLabel(l){ if(!l) return null; return l.val==="BW" ? "Bodyweight" : `${l.val} ${l.unit}`; }
function kgToUnit(txt){ // annotate "6–8 kg" style notes with lb when unit is lb
  if(state.settings.unit!=="lb" || !txt) return txt;
  return txt.replace(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*kgs?\b/g,(m,a,b)=>{ const f=x=>Math.round(x*2.2046); return b? `${a}–${b} kg ≈ ${f(a)}–${f(b)} lb` : `${a} kg ≈ ${f(a)} lb`; });
}

/* ── Toast ───────────────────────────────── */
let toastT; function toast(msg, inPlayer){ const el=inPlayer? $("#ptoast") : $("#toast"); if(!el) return; el.textContent=msg; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove("show"),2200); }

/* ── Sheet (bottom modal) ─────────────────── */
function openSheet(html){ $("#sheetIn").innerHTML=`<div class="grab"></div>`+html; $("#sheet").classList.add("open"); }
function closeSheet(){ $("#sheet").classList.remove("open"); }
$("#sheet").addEventListener("click", e=>{ if(e.target.id==="sheet") closeSheet(); });

/* ── Sync with Google Apps Script backend ─── */
const apiUrl = () => state.settings.api || (window.SWZ_CONFIG && window.SWZ_CONFIG.api) || "";
let syncTimer=null, syncing=false;
async function sync(force){
  const api=apiUrl(); if(!api || !me()) return;
  if(syncing) return; syncing=true;
  try{
    const body={action:"sync", app:"swz", version:APP_VERSION, user:me(), sessions:state.sessions.filter(s=>s.email===state.current), loads:myLoads(), feedback:state.feedback.filter(f=>!f.sent)};
    const r=await fetch(api,{method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(body), redirect:"follow"});
    const j=await r.json();
    if(j && j.ok){
      // server is authoritative for calories; merge by id
      const map=new Map(state.sessions.map(s=>[s.sid,s]));
      (j.sessions||[]).forEach(s=>{ const loc=map.get(s.sid); if(loc){ if(s.cal!=null) loc.cal=s.cal; } else state.sessions.push(s); });
      const lm=new Map(state.loads.map(l=>[l.id,l])); (j.loads||[]).forEach(l=>{ if(!lm.has(l.id)) state.loads.push(l); });
      state.feedback.forEach(f=>f.sent=true);
      state.lastSync=new Date().toISOString(); save();
      if(state.view==="history") render();
    }
  }catch(e){ console.warn("sync failed", e); }
  finally{ syncing=false; }
}
function scheduleSync(){ clearTimeout(syncTimer); syncTimer=setTimeout(()=>sync(),1500); }
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) sync(); });

/* ── Icons ────────────────────────────────── */
const ICON = {
  today:`<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M8 14h3v3H8z"/></svg>`,
  week:`<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`,
  history:`<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>`,
  rules:`<svg viewBox="0 0 24 24"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h6M9 17h6"/></svg>`,
  chat:`<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-4.6A8 8 0 1 1 21 12z"/></svg>`,
  x:`<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  prev:`<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>`,
  next:`<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`,
  play:`<svg viewBox="0 0 24 24"><path d="M7 5v14l11-7z"/></svg>`,
  pause:`<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>`,
  sound:`<svg viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>`,
  mute:`<svg viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>`,
  tv:`<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  check:`<svg viewBox="0 0 24 24"><path d="M5 12l4 4L19 7"/></svg>`
};

/* ── Root render ─────────────────────────── */
function render(){
  const app=$("#app");
  if(!me()){ app.innerHTML=viewOnboarding(); bindOnboarding(); return; }
  const v=state.view;
  app.innerHTML = `
    <section class="view active ${v==="workout"&&WORKOUTS[state.openId]&&WORKOUTS[state.openId].kind!=="rest"?"has-bar":""}" id="v-${v}">${({today:viewToday,week:viewWeek,history:viewHistory,rules:viewRules,settings:viewSettings,workout:viewWorkout})[v]()}</section>
    <nav class="tabs"><div class="in">
      ${["today","week","history","rules"].map(t=>`<button class="tab ${v===t||(v==="workout"&&t==="week")?"active":""}" data-go="${t}">${ICON[t]}<span>${{today:"Today",week:"Week",history:"History",rules:"Rules"}[t]}</span></button>`).join("")}
    </div></nav>
    <button class="fab ${v==="workout"&&WORKOUTS[state.openId]&&WORKOUTS[state.openId].kind!=="rest"?"up":""}" id="fab" aria-label="Send feedback" title="Feedback">${ICON.chat}</button>`;
  app.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  app.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openWorkout(b.dataset.open));
  $("#fab").onclick=openFeedback;
  bindView(v);
  window.scrollTo(0,0);
}
function go(v){ state.view=v; render(); }
function openWorkout(id){ state.openId=id; state.view="workout"; render(); }
function topbar(sub){ const p=me(); return `<div class="topbar"><div class="brand"><div class="logo">Z</div><div><div class="t">Stronger with Zoe</div><div class="s">${esc(sub||"")}</div></div></div><button class="avatar" data-go="settings" aria-label="Profile & settings">${esc((p.name||"?").trim()[0].toUpperCase())}</button></div>`; }

/* ── Onboarding ──────────────────────────── */
function viewOnboarding(){
  return `<div class="onb"><div class="logo">Z</div>
  <h1 style="font-size:30px">Stronger with Zoe</h1>
  <p class="muted" style="margin:8px 0 22px">Your private workout player for Month 1. Tell me who's training so progress is saved to the right person.</p>
  <label class="field"><label>Your name</label><input id="ob-name" placeholder="Aneri" autocomplete="given-name"></label>
  <label class="field"><label>Email</label><input id="ob-email" type="email" placeholder="you@example.com" autocomplete="email" inputmode="email"></label>
  <label class="field"><label>Log weights in</label><select id="ob-unit"><option value="lb">lb (pounds)</option><option value="kg">kg</option></select></label>
  <button class="btn block" id="ob-go" style="margin-top:6px">Let's go</button>
  ${state.profiles.length? `<p class="small muted" style="margin-top:16px">Returning? ${state.profiles.map(p=>`<button class="link" data-pick="${esc(p.email)}">${esc(p.name)}</button>`).join(" · ")}</p>`:""}
  </div>`;
}
function bindOnboarding(){
  $("#ob-go").onclick=()=>{
    const name=$("#ob-name").value.trim(), email=$("#ob-email").value.trim().toLowerCase();
    if(!name){ $("#ob-name").focus(); return toast("Please add your name"); }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ $("#ob-email").focus(); return toast("Please add a valid email"); }
    let p=state.profiles.find(x=>x.email===email); if(!p){ p={name,email,created:new Date().toISOString()}; state.profiles.push(p);} else p.name=name;
    state.current=email; state.settings.unit=$("#ob-unit").value; save(); scheduleSync(); render();
  };
  document.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{ state.current=b.dataset.pick; save(); render(); });
}

/* ── Today ───────────────────────────────── */
function thisWeekDone(){ const ws=weekStart(weekOf(new Date())); const we=addDays(ws,7); return mySessions().filter(s=>{const d=new Date(s.start); return d>=ws && d<we;}); }
function streakWeeks(){ // consecutive program weeks (ending this week or last) with ≥3 sessions
  let n=0; const cw=weekOf(new Date());
  for(let w=cw; w>=1; w--){ const ws=weekStart(w), we=addDays(ws,7); const c=mySessions().filter(s=>{const d=new Date(s.start);return d>=ws&&d<we;}).length; if(c>=3) n++; else if(w!==cw) break; }
  return n;
}
function viewToday(){
  const now=new Date(), W=workoutFor(now), n=rawWeek(now), wk=weekOf(now);
  const doneToday=mySessions().some(s=>s.start.slice(0,10)===isoDate(now));
  const p=me(); const hour=now.getHours(); const greet= hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const total=mySessions().length, mins=Math.round(mySessions().reduce((a,s)=>a+s.dur,0)/60);
  const wkDone=thisWeekDone().length; const wkTarget=6;
  let hero;
  if(!W){ hero = n<1
    ? `<div class="hero" style="background:linear-gradient(135deg,var(--teal),#7FE0D2)"><div class="kicker">Program starts ${fmtDate(PSTART)}</div><h1>${n===0?"Tomorrow we begin":"Get ready"}</h1><div class="meta">Read the rules and try the Daily Mobility Flow today.</div><button class="btn" data-open="mobility">Daily Mobility Flow</button></div>`
    : `<div class="hero" style="background:linear-gradient(135deg,var(--pink),#FF8AC2)"><div class="kicker">Month 1 complete</div><h1>You ran the system.</h1><div class="meta">Repeat any Week 3–4 session until Zoe's Month 2 plan arrives.</div><button class="btn" data-go="week">Open the week</button></div>`;
  } else {
    hero = `<div class="hero" style="background:linear-gradient(135deg,${THUMBS.color(W.id)},${THUMBS.dark(W.id)})"><div class="bgart">${THUMBS.art(W.id,230)}</div>
      <div class="kicker">Week ${wk} · ${esc(W.tag)}</div><h1>${esc(W.title)}</h1>
      <div class="meta">${W.kind==="rest"?"Complete rest — repair day":`≈ ${fmtMin(estSecs(W))} · ${equipmentOf(W).filter(e=>e!=="water").map(e=>EQUIP[e].label).slice(0,3).join(" · ")}`}${doneToday?" · ✓ done today":""}</div>
      <button class="btn" data-open="${W.id}">${W.kind==="rest"?"Rest day plan":doneToday?"Open again":"Start workout"}</button></div>`;
  }
  const nudge = (W && W.kind!=="rest" && !doneToday) ? `<div class="nudge"><b>Kit on, ten minutes, permission to stop.</b> You almost never will. ${wkDone? `${wkDone} down this week — `:""}judge today by whether you did it, not how strong it felt.</div>` : (doneToday? `<div class="nudge"><b>Done for today.</b> Strength is built in the prep — protein, water, and lights out by 10:30.</div>`:"");
  const q=PROGRAM.rules.quotes[wk%2];
  return `${topbar(`${greet}, ${p.name.split(" ")[0]}`)}
  ${hero}${nudge}
  <div class="stats"><div class="stat"><b>${wkDone}<span style="font-size:14px;color:var(--ink-3)">/${wkTarget}</span></b><span>This week</span></div><div class="stat"><b>${streakWeeks()}</b><span>Week streak</span></div><div class="stat"><b>${total}</b><span>Workouts total</span></div></div>
  <div class="sec-title"><h2>Every day</h2><span class="faint small">10 min</span></div>
  <button class="card tight row" data-open="mobility" style="width:100%;text-align:left"><div class="thumb">${THUMBS.svg("mobility")}</div><div class="body"><div class="title">Daily Mobility Flow</div><div class="sub">Hips · spine · deep core · shoulders — do it first</div></div><div class="chev">›</div></button>
  <div class="card"><div class="quote">“${esc(q.q)}”<b>— ${esc(q.by)}</b></div></div>`;
}

/* ── Week ────────────────────────────────── */
function weekList(n, compact){
  const blk=blockOfWeek(n), ws=weekStart(n), today=isoDate(new Date());
  const rows=[1,2,3,4,5,6,0].map((dow,i)=>{ const d=addDays(ws,i); const W=WORKOUTS[blk.schedule[dow]]; const ds=isoDate(d);
    const done=mySessions().some(s=>s.wid===W.id && s.start.slice(0,10)===ds);
    const eq=equipmentOf(W).filter(e=>!["water","mat","trainers"].includes(e)).map(e=>EQUIP[e].icon+" "+(EQUIP[e].short||EQUIP[e].label));
    return `<button class="wk-row ${ds===today?"today":""}" data-open="${W.id}"><div class="day"><b>${DAYS[dow].toUpperCase()}</b><span>${d.getDate()}</span></div><div class="thumb">${THUMBS.svg(W.id)}</div>
      <div class="body" style="flex:1;min-width:0"><div class="title" style="font-family:var(--head);font-weight:700;font-size:14px">${esc(W.title)}</div><div class="sub small muted ell">${W.kind==="rest"?"Repair day":`≈ ${fmtMin(estSecs(W))}${eq.length?" · "+eq.slice(0,3).join(" · "):" · bodyweight"}`}</div></div>
      ${done?`<div class="done">✓</div>`:`<div class="chev" style="color:var(--ink-3);font-size:22px">›</div>`}</button>`; }).join("");
  const opt=blk.optional.map(id=>{const W=WORKOUTS[id]; return `<button class="wk-row" data-open="${id}"><div class="day"><b>OPT</b><span>any</span></div><div class="thumb">${THUMBS.svg(id)}</div><div class="body" style="flex:1;min-width:0"><div class="title" style="font-family:var(--head);font-weight:700;font-size:14px">${esc(W.title)}</div><div class="sub small muted ell">Bonus · ≈ ${fmtMin(estSecs(W))}</div></div><div class="chev" style="color:var(--ink-3);font-size:22px">›</div></button>`;}).join("");
  return `<div class="card tight">${rows}${opt}</div>`;
}
function viewWeek(){
  const now=new Date(); const cw=weekOf(now); const n=state.weekShown||cw; const blk=blockOfWeek(n); const ws=weekStart(n), we=addDays(ws,6);
  const next=n+1;
  return `${topbar("Week structure")}
  <div class="card" style="background:linear-gradient(135deg,var(--card),var(--card));">
    <div class="pill" style="margin-bottom:8px">${esc(blk.name)}</div>
    <h1 style="font-size:22px">Week ${n}${n===cw?" · this week":""}</h1>
    <p class="muted small" style="margin-top:4px">${fmtDate(ws)} – ${fmtDate(we)} · ${esc(blk.subtitle)}</p>
    <p class="small" style="margin-top:10px">${esc(blk.goal)}</p>
    <div class="chips" style="margin-top:10px">${[1,2,3,4].map(w=>`<button class="chip ${w===n?"pink":""}" data-week="${w}">W${w}${w===cw?" · now":""}</button>`).join("")}</div>
  </div>
  <div class="sec-title"><h2>Workouts · Week ${n}</h2><span class="faint small">tap to open</span></div>
  ${weekList(n)}
  <button class="card tight row" data-open="mobility" style="width:100%;text-align:left"><div class="thumb" style="width:52px;height:52px;border-radius:15px">${THUMBS.svg("mobility")}</div><div class="body"><div class="title">Daily Mobility Flow</div><div class="sub">Every single day · 10 min</div></div><div class="chev">›</div></button>
  <div style="margin:18px 0 10px"><button class="btn ghost block" id="nextWeekBtn">${state.showNext?"Hide next week":"Next Week"} ${next<=4?`· Week ${next}`:""} ${state.showNext?"▴":"▾"}</button></div>
  <div id="nextWeek" class="${state.showNext?"":"hide"}">
    ${next<=4 ? `<div class="sec-title"><h2>Week ${next} · ${esc(blockOfWeek(next).name)}</h2><span class="faint small">${fmtDate(weekStart(next))} – ${fmtDate(addDays(weekStart(next),6))}</span></div>${weekList(next)}`
      : `<div class="card"><h3>After Week 4</h3><p class="small muted" style="margin-top:6px">Month 1 ends ${fmtDate(PEND)}. Zoe's Month 2 plan replaces this — until then, repeat the Week 3–4 sessions.</p></div>`}
  </div>`;
}
function bindWeek(){
  document.querySelectorAll("[data-week]").forEach(b=>b.onclick=()=>{ state.weekShown=+b.dataset.week; state.showNext=false; render(); });
  $("#nextWeekBtn").onclick=()=>{ state.showNext=!state.showNext; render(); if(state.showNext) setTimeout(()=>$("#nextWeek").scrollIntoView({behavior:"smooth",block:"start"}),50); };
}

/* ── Workout overview ────────────────────── */
function viewWorkout(){
  const W=WORKOUTS[state.openId]; if(!W) return `<p>Not found</p>`;
  const eq=equipmentOf(W);
  const hist=mySessions().filter(s=>s.wid===W.id);
  const secs = W.sections.map(sec=>`<div class="sec"><div class="h"><h3>${esc(sec.title)}</h3><span class="r">${sec.cap?`${sec.cap/60} min cap`:sec.rounds>1?`× ${sec.rounds} rounds`:"1 round"}</span></div>
    ${sec.note?`<p class="small muted" style="margin:-2px 0 6px">${esc(sec.note)}</p>`:""}
    ${sec.items.map(it=>{ const ll=lastLoad(it.n); return `<div class="ex"><div class="n">${esc(it.n)}${it.note?`<small>${esc(kgToUnit(it.note))}</small>`:""}</div>${ll?`<div class="last">${esc(loadLabel(ll))}</div>`:""}<div class="v">${it.secs?fmtClock(it.secs):it.reps?esc(it.reps)+(it.each?" each":""):""}</div></div>`;}).join("")}</div>`).join("");
  return `<button class="back" data-go="week">‹ Week</button>
    <div class="ov-head"><div class="thumb">${THUMBS.svg(W.id)}</div><div style="min-width:0"><div class="pill" style="margin-bottom:6px">${esc(W.tag)}</div><h1>${esc(W.title)}</h1>${W.kind!=="rest"?`<p class="small muted" style="margin-top:4px">≈ ${fmtMin(estSecs(W))} · ${W.sections.reduce((a,s)=>a+s.items.length,0)} exercises${hist.length?` · done ${hist.length}×`:""}</p>`:""}</div></div>
    ${W.intro.map(t=>`<p class="small muted" style="margin-bottom:8px">${esc(t)}</p>`).join("")}
    ${W.kind==="rest" ? `<div class="card">${W.restList.map(([k,v])=>`<div style="margin-bottom:10px"><b style="color:var(--pink);font-family:var(--head);font-size:13px;letter-spacing:.06em">${esc(k.toUpperCase())}</b><div class="small">${esc(v)}</div></div>`).join("")}</div><div class="card"><div class="quote">🌿 ${esc(W.quote)}</div></div><button class="btn ghost block" data-open="mobility">Daily Mobility Flow (optional)</button>`
    : `<div class="sec-title"><h2>Equipment</h2></div><div class="card tight"><div class="eq-grid">${eq.map(e=>`<div class="eq"><div class="i">${EQUIP[e].icon}</div><span>${esc(EQUIP[e].label)}</span></div>`).join("")}</div></div>
       <div class="sec-title"><h2>Plan</h2><span class="faint small">last weights shown in teal</span></div><div class="card">${secs}</div>
       <div class="start-bar"><div class="in"><button class="btn block" id="startBtn" style="min-height:56px;font-size:17px">▶&nbsp; Start ${esc(W.short)}</button></div></div>`}`;
}

/* ── History ─────────────────────────────── */
function viewHistory(){
  const S=mySessions(); const total=S.length, mins=Math.round(S.reduce((a,s)=>a+s.dur,0)/60), cal=S.reduce((a,s)=>a+(s.cal||0),0);
  const today=new Date(); const days=[]; for(let i=27;i>=0;i--){ const d=addDays(today,-i); const ds=isoDate(d); days.push({d, on:S.some(s=>s.start.slice(0,10)===ds), today:i===0}); }
  const list = S.length? S.map((s,i)=>{ const d=new Date(s.start); return `<div class="hist"><div class="thumb">${THUMBS.svg(s.wid)}</div><div class="b"><div class="t ell">${esc(s.title)}</div><div class="m ell">${esc(s.name)} · ${fmtDate(d)} · ${fmtTime(d)}${s.partial?" · partial":""}</div></div><div class="num"><b>${fmtMin(s.dur)}</b>${s.cal!=null?`${Math.round(s.cal)} kcal`:`<span class="faint">#${total-i}</span>`}</div></div>`; }).join("")
    : `<p class="muted small" style="padding:10px 0">No workouts logged yet. A session is recorded once it has run for 5 minutes.</p>`;
  return `${topbar("History")}
    <div class="stats"><div class="stat"><b>${total}</b><span>Workouts</span></div><div class="stat"><b>${mins}</b><span>Minutes</span></div><div class="stat"><b>${cal?Math.round(cal):"–"}</b><span>kcal (Watch)</span></div></div>
    <div class="card"><h3>Last 4 weeks</h3><div class="heat">${days.map(x=>`<i class="${x.on?"on":""} ${x.today?"today":""}">${x.d.getDate()}</i>`).join("")}</div><p class="tiny faint" style="margin-top:8px">Don't break the chain — three sessions a week keeps the streak.</p></div>
    <div class="sec-title"><h2>All workouts</h2><span class="faint small">${me().name}</span></div>
    <div class="card tight">${list}</div>
    ${!apiUrl()?`<p class="tiny faint">Calories arrive from Apple Watch via the Shortcut once the backend URL is set in Settings.</p>`:""}`;
}

/* ── Rules ───────────────────────────────── */
function viewRules(){
  const R=PROGRAM.rules;
  return `${topbar("Training rules")}
  <div class="card rules"><h2>Training rules</h2><ul>${R.training.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div>
  <div class="two"><div class="box"><h3>Build clean form</h3><ul>${R.form.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div><div class="box teal"><h3>Protect recovery (your lever)</h3><ul>${R.recovery.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></div></div>
  <div class="card" style="margin-top:14px"><h3 style="color:var(--teal);margin-bottom:6px">EVERY SESSION</h3><p class="small">${esc(R.session)}</p><div class="box" style="margin-top:12px"><p class="small" style="font-weight:600">REMEMBER: ${esc(R.remember)}</p></div></div>
  <div class="card"><h3 style="margin-bottom:6px">Please note</h3><ol class="small muted" style="padding-left:18px;margin:0">${R.footnotes.map(t=>`<li style="margin-bottom:4px">${esc(t)}</li>`).join("")}</ol></div>
  <div class="card"><h3 style="color:var(--teal);margin-bottom:8px">MY REMINDER</h3><p class="small" style="font-weight:700">Q: “${esc(R.reminder.q)}”</p><p class="small" style="margin-top:6px">A: ${esc(R.reminder.a)}</p></div>
  ${R.quotes.map(q=>`<div class="card"><div class="quote">“${esc(q.q)}”<b>— ${esc(q.by)}</b></div></div>`).join("")}
  <div class="box lime"><h3>My tip for the month</h3>${R.tips.map(t=>`<p class="small" style="margin-bottom:8px;font-style:italic">${esc(t)}</p>`).join("")}</div>
  <div style="height:14px"></div>`;
}

/* ── Settings / profile ──────────────────── */
function viewSettings(){
  const s=state.settings, p=me();
  const tog=(k,label,sub)=>`<div class="toggle"><div class="l"><b>${label}</b><span>${sub}</span></div><button class="sw ${s[k]?"on":""}" data-tog="${k}" role="switch" aria-checked="${!!s[k]}"></button></div>`;
  return `<button class="back" data-go="today">‹ Back</button>
  <h1 style="margin:6px 0 14px">Profile & settings</h1>
  <div class="card"><div class="row"><div class="avatar" style="width:48px;height:48px;font-size:20px">${esc(p.name[0].toUpperCase())}</div><div class="body"><div class="title">${esc(p.name)}</div><div class="sub ell">${esc(p.email)}</div></div></div>
    <div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" id="switchUser">Switch person</button><button class="btn ghost sm" id="editUser">Edit</button></div></div>
  <div class="card">
    <div class="toggle"><div class="l"><b>Weight unit</b><span>Used when logging loads</span></div><select id="unitSel" style="border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--bg)"><option value="lb" ${s.unit==="lb"?"selected":""}>lb</option><option value="kg" ${s.unit==="kg"?"selected":""}>kg</option></select></div>
    ${tog("sound","Video sound on","Off = videos play muted (most reliable autoplay on iPhone)")}
    ${tog("autoAdvance","Auto-advance timed steps","Timed holds, rests and cardio move on by themselves")}
    ${tog("beeps","Countdown beeps","3-2-1 tones before a step ends")}
    ${tog("watch","Apple Watch controls","Show Play/Pause/Next on the Watch's Now Playing screen (beta)")}
    ${tog("tv","TV mode","Larger text for AirPlay mirroring to Apple TV")}
  </div>
  <div class="card"><h3>Backend (Google Sheet)</h3><p class="small muted" style="margin:4px 0 10px">Apps Script web-app URL. Syncs history, weights and feedback; enables the Sunday progress email and Watch calories.</p>
    <label class="field"><input id="apiUrl" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(s.api||(window.SWZ_CONFIG&&window.SWZ_CONFIG.api)||"")}"></label>
    <div class="btn-row"><button class="btn sm" id="saveApi">Save & sync</button><span class="tiny faint" style="align-self:center">${state.lastSync?`Last sync ${fmtTime(new Date(state.lastSync))}`:"Not synced yet"}</span></div></div>
  <div class="card"><h3>Apple Watch calories (one-time setup)</h3>
    <p class="small muted" style="margin:4px 0 10px">Start a <b>Strength Training</b> workout on your Watch when you press Start here. After finishing, tap “Get calories” — it runs a Shortcut that reads Active Energy for the session window and posts it to your sheet.</p>
    <div class="step"><b>1</b><span>Shortcuts app → + → name it exactly <code>SWZ Calories</code></span></div>
    <div class="step"><b>2</b><span>Add <strong>Get Text from Input</strong> (Shortcut Input) → <strong>Split Text</strong> by custom “|” → gives 3 items: session id, start, end</span></div>
    <div class="step"><b>3</b><span><strong>Find Health Samples</strong> · Type: Active Energy · Start Date is after <i>item 2</i> · End Date is before <i>item 3</i> → <strong>Calculate Statistics</strong> Sum</span></div>
    <div class="step"><b>4</b><span><strong>Get Contents of URL</strong> · your backend URL · POST · Request Body JSON: <code>action</code>=calories, <code>sid</code>=item 1, <code>cal</code>=Sum</span></div>
    <div class="step"><b>5</b><span>Shortcut settings → allow “Show in Share Sheet” off, “Ask before running” off. Done.</span></div></div>
  <div class="card"><h3>Install on iPhone</h3><p class="small muted" style="margin-top:4px">Safari → Share → <b>Add to Home Screen</b>. Opens full-screen, works offline. For Apple TV: Control Centre → Screen Mirroring, then turn on TV mode above.</p></div>
  <div class="card"><div class="btn-row"><button class="btn ghost sm" id="exportBtn">Export data (JSON)</button><button class="btn ghost sm" id="syncNow">Sync now</button></div><p class="tiny faint" style="margin-top:10px">v${APP_VERSION} · Program: ${esc(PROGRAM.brand)} · Month ${PROGRAM.month} · ${esc(B1.start)} → ${esc(B2.end)}</p></div>`;
}
function bindSettings(){
  document.querySelectorAll("[data-tog]").forEach(b=>b.onclick=()=>{ const k=b.dataset.tog; state.settings[k]=!state.settings[k]; save(); b.classList.toggle("on",state.settings[k]); });
  $("#unitSel").onchange=e=>{ state.settings.unit=e.target.value; save(); toast("Unit: "+e.target.value); };
  $("#saveApi").onclick=async()=>{ state.settings.api=$("#apiUrl").value.trim(); save(); toast("Saved — syncing…"); await sync(true); render(); };
  $("#syncNow").onclick=async()=>{ toast("Syncing…"); await sync(true); render(); toast(apiUrl()?"Synced":"Add a backend URL first"); };
  $("#switchUser").onclick=()=>{ state.current=null; save(); render(); };
  $("#editUser").onclick=()=>{ const p=me(); openSheet(`<h2>Edit profile</h2><label class="field" style="margin-top:12px"><label>Name</label><input id="e-name" value="${esc(p.name)}"></label><button class="btn block" id="e-save">Save</button>`); $("#e-save").onclick=()=>{ p.name=$("#e-name").value.trim()||p.name; save(); scheduleSync(); closeSheet(); render(); }; };
  $("#exportBtn").onclick=()=>{ const blob=new Blob([JSON.stringify({profiles:state.profiles,sessions:state.sessions,loads:state.loads},null,1)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="swz-data.json"; a.click(); };
}
function bindView(v){ if(v==="week") bindWeek(); if(v==="settings") bindSettings(); if(v==="workout" && $("#startBtn")) $("#startBtn").onclick=()=>startWorkout(state.openId); }

/* ── Feedback bubble ─────────────────────── */
function openFeedback(){
  openSheet(`<h2>Feedback</h2><p class="small muted" style="margin:4px 0 12px">Spotted a bug, or want something changed? It goes straight to the improvement log (reviewed every Friday).</p>
   <label class="field"><textarea id="fb-text" placeholder="e.g. The rest timer should beep louder…"></textarea></label>
   <button class="btn block" id="fb-send">Send feedback</button>`);
  $("#fb-send").onclick=()=>{ const t=$("#fb-text").value.trim(); if(!t) return toast("Write something first");
    state.feedback.push({id:uid(), app:"swz", text:t, name:me().name, email:me().email, view:state.view, when:new Date().toISOString(), ua:navigator.userAgent.slice(0,80), sent:false}); save(); closeSheet(); toast("Thanks — logged ✓"); scheduleSync(); };
}

/* ══════════════════════════════════════════
   PLAYER
   ══════════════════════════════════════════ */
const P = { W:null, steps:[], i:0, runMs:0, runStart:null, paused:false, remain:0, tick:null, yt:null, ytReady:false, vid:null, sid:null, amrapRounds:0, ladder:2, ladderIdx:0, amrapIdx:0, sessionLoads:{}, milestones:new Set() };
function buildSteps(W){
  const steps=[];
  W.sections.forEach((sec,si)=>{
    if(sec.kind==="amrap"||sec.kind==="ladder"){ steps.push({type:sec.kind, sec, si, secs:sec.cap}); return; }
    for(let r=1;r<=sec.rounds;r++){
      sec.items.forEach((it,ii)=>{
        (it.each?["L","R"]:[null]).forEach(side=>steps.push({type:"work", sec, si, it, ii, round:r, rounds:sec.rounds, side, secs:it.secs||null}));
        if(sec.restItem && ii<sec.items.length-1) steps.push({type:"rest", secs:sec.restItem, sec, si, round:r, rounds:sec.rounds});
      });
      if(sec.restRound && r<sec.rounds) steps.push({type:"rest", secs:sec.restRound, sec, si, round:r, rounds:sec.rounds, roundEnd:true});
    }
  });
  return steps;
}
function elapsedMs(){ return P.runMs + (P.runStart? Date.now()-P.runStart : 0); }
function startWorkout(id){
  const W=WORKOUTS[id]; if(!W || !W.sections.length) return;
  Object.assign(P,{W, steps:buildSteps(W), i:0, runMs:0, runStart:Date.now(), paused:false, remain:0, vid:null, sid:uid(), start:new Date(), amrapRounds:0, ladder:2, ladderIdx:0, amrapIdx:0, sessionLoads:{}, milestones:new Set()});
  const pl=$("#player"); pl.classList.toggle("tv", !!state.settings.tv);
  pl.innerHTML=`
    <div class="p-top"><button class="ib" id="p-exit" aria-label="Exit">${ICON.x}</button>
      <div class="clock" id="p-clock"><span class="dot"></span><span id="p-el">0:00</span></div>
      <div style="display:flex;gap:8px"><button class="ib" id="p-sound" aria-label="Sound">${state.settings.sound?ICON.sound:ICON.mute}</button><button class="ib" id="p-tv" aria-label="TV mode">${ICON.tv}</button></div></div>
    <div class="p-progress"><i id="p-bar"></i></div>
    <div class="p-body" id="p-body"></div>
    <div class="p-ctrl"><button class="cb" id="p-prev" aria-label="Previous">${ICON.prev}</button><button class="cb next" id="p-next"><span>Next</span>${ICON.next}</button><button class="cb" id="p-pause" aria-label="Pause">${ICON.pause}</button></div>
    <div class="toast" id="ptoast"></div><div class="p-milestone" id="p-ms"></div>`;
  pl.classList.add("open"); document.body.style.overflow="hidden";
  $("#p-exit").onclick=confirmExit; $("#p-next").onclick=()=>nextStep(true); $("#p-prev").onclick=prevStep; $("#p-pause").onclick=togglePause;
  $("#p-sound").onclick=()=>{ state.settings.sound=!state.settings.sound; save(); $("#p-sound").innerHTML=state.settings.sound?ICON.sound:ICON.mute; if(P.yt&&P.ytReady){ state.settings.sound? P.yt.unMute() : P.yt.mute(); } toast(state.settings.sound?"Sound on":"Muted",true); };
  $("#p-tv").onclick=()=>{ state.settings.tv=!state.settings.tv; save(); pl.classList.toggle("tv",state.settings.tv); toast(state.settings.tv?"TV mode on — AirPlay mirror to Apple TV":"TV mode off",true); };
  ensureYT(); mediaSessionStart(); wakeLock();
  showStep(); P.tick=setInterval(tick,250);
}
function curStep(){ return P.steps[P.i]; }
function stepVideo(st){ if(st.type==="work") return st.it.v; if(st.type==="amrap"||st.type==="ladder"){ const it=st.sec.items[st.type==="amrap"?P.amrapIdx:P.ladderIdx]; return it.v; } return null; }
function nextWorkStep(from){ for(let k=from+1;k<P.steps.length;k++){ if(P.steps[k].type!=="rest") return P.steps[k]; } return null; }
function describe(st){ if(!st) return "Finish"; if(st.type==="work") return st.it.n + (st.side? ` · ${st.side==="L"?"Left":"Right"}`:""); if(st.type==="amrap") return "AMRAP · "+st.sec.title; if(st.type==="ladder") return "Ladder · "+st.sec.title; return "Rest"; }
function showStep(){
  const st=curStep(); if(!st){ return finishWorkout(false); }
  const body=$("#p-body"); const total=P.steps.length; $("#p-bar").style.width=`${Math.round(P.i/total*100)}%`;
  P.remain = st.secs || 0; P.stepStart=Date.now();
  const vid=stepVideo(st); const isShort = vid && VIDEOS[vid] && VIDEOS[vid].short;
  if(st.type==="rest"){
    const nx=nextWorkStep(P.i);
    body.innerHTML=`<div class="p-rest"><div class="lbl">${st.roundEnd?`Round ${st.round} of ${st.rounds} done · rest`:"Rest"}</div><div class="cd p-cd">${st.secs}</div>
      <div class="nxt">Next up${nx&&nx.type==="work"?` · Round ${st.roundEnd?st.round+1:st.round}`:""}<b>${esc(describe(nx))}</b>${nx&&nx.type==="work"?`<span class="small">${targetText(nx)}</span>`:""}</div>
      <div class="p-timer" style="width:min(100%,420px)"><div class="bar"><i id="p-tbar"></i></div></div></div>`;
    setVideo(null); mediaSessionMeta("Rest · "+fmtClock(st.secs), P.W.title);
    $("#p-next").innerHTML=`<span>Skip rest</span>${ICON.next}`; $("#p-next").classList.remove("lime");
    return;
  }
  const secTitle=st.sec.title; const roundTxt = st.sec.rounds>1? `Round ${st.round}/${st.rounds}` : "";
  const nx=nextWorkStep(P.i);
  if(st.type==="work"){
    const it=st.it; const ll=lastLoad(it.n, P.sid); const cur=P.sessionLoads[exKey(it.n)];
    const loadHtml = (it.load || cur || ll) ? `<button class="p-load" id="p-load">🏋️ <b>${cur? esc(loadLabel(cur)) : "Add weight"}</b>${ll?`<span class="last">· last ${esc(loadLabel(ll))} (${fmtDate(new Date(ll.date)).slice(4)})</span>`:""}</button>` : "";
    body.innerHTML=`<div class="p-video ${isShort?"short":""}" id="p-vwrap">${st.side?`<div class="p-side ${st.side}">${st.side==="L"?"Left side":"Right side"}</div>`:""}<div id="yt"></div><div class="novid ${vid?"hide":""}" id="p-novid"><div><div class="big">${it.secs?fmtClock(it.secs):esc(it.reps||"")}</div><div class="small" style="opacity:.8;margin-top:8px">${esc(it.n)}</div></div></div></div>
      <div class="p-info"><div class="p-kicker"><span>${esc(secTitle)}</span><span>${roundTxt}${st.side?` · ${st.side==="L"?"Left":"Right"}`:""}</span></div>
        <div class="p-name">${esc(it.n)}</div>
        <div class="p-target"><span class="big ${st.side?"side-"+st.side:""}">${it.secs? `<span class="p-cd">${fmtClock(it.secs)}</span>` : esc(it.reps||"Go")}</span><span class="u">${it.secs?"seconds":it.each?"reps · "+(st.side==="L"?"left":"right")+" side":(it.reps&&/^\d/.test(it.reps)?"reps":"")}</span></div>
        ${it.note?`<div class="p-note">${esc(kgToUnit(it.note))}</div>`:""}
        ${it.secs?`<div class="p-timer"><div class="bar"><i id="p-tbar"></i></div></div>`:""}
        ${loadHtml}
        <div class="p-note faint small" style="margin-top:10px">Next: ${esc(describe(nx))}</div></div>`;
    if(loadHtml) $("#p-load").onclick=()=>openLoadSheet(it);
    $("#p-next").innerHTML=`<span>${nx?"Next":"Finish"}</span>${ICON.next}`; $("#p-next").classList.toggle("lime",!nx);
    mediaSessionMeta(describe(st)+(it.reps?` · ${it.reps}`:""), `${P.W.title} · ${roundTxt}`);
  } else { // amrap / ladder
    const items=st.sec.items; const idx = st.type==="amrap"?P.amrapIdx:P.ladderIdx; const it=items[idx];
    const reps = st.type==="ladder" ? P.ladder : it.reps;
    body.innerHTML=`<div class="p-video ${isShort?"short":""}" id="p-vwrap"><div id="yt"></div><div class="novid ${vid?"hide":""}" id="p-novid"><div class="big">${esc(reps)}</div></div></div>
      <div class="p-info"><div class="p-kicker"><span>${esc(secTitle)}</span><span>${st.type==="ladder"?"Ladder":"AMRAP"} · <span class="p-cd">${fmtClock(st.secs)}</span></span></div>
        <div class="p-name">${esc(it.n)}</div>
        <div class="p-target"><span class="big">${esc(String(reps))}</span><span class="u">reps · then tap Next</span></div>
        ${st.sec.note?`<div class="p-note">${esc(st.sec.note)}</div>`:""}
        <div class="p-timer"><div class="bar"><i id="p-tbar"></i></div></div>
        <div class="p-amrap"><span class="rc">Rounds <b id="p-rounds">${P.amrapRounds}</b></span>${items.map((x,k)=>`<span class="rc" style="${k===idx?"outline:2px solid var(--lime)":""}">${k+1}. ${esc(x.n)}</span>`).join("")}</div></div>`;
    $("#p-next").innerHTML=`<span>Next exercise</span>${ICON.next}`; $("#p-next").classList.remove("lime");
    mediaSessionMeta(`${it.n} × ${reps}`, `${P.W.title} · ${st.type==="ladder"?"Ladder":"AMRAP"}`);
  }
  setVideo(vid);
  milestone();
}
function targetText(st){ const it=st.it; return it.secs? fmtClock(it.secs)+" s" : (it.reps? it.reps+(it.each?" each side":" reps") : ""); }
function milestone(){
  const pct=P.i/P.steps.length; const st=curStep();
  const fire=(k,msg)=>{ if(P.milestones.has(k)) return; P.milestones.add(k); const el=$("#p-ms"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),1800); };
  if(P.i===0) fire("start","Warm-up first. Spine neutral, core braced. 🌱");
  else if(pct>=0.5 && pct<0.6) fire("half","Halfway. You showed up — that's the win. 💪");
  else if(st && st.type==="work" && st.rounds>1 && st.round===st.rounds && st.ii===0 && !st.side || (st&&st.side==="L"&&st.ii===0&&st.round===st.rounds)) fire("last"+st.si,"Last round — finish strong. 🔥");
  else if(st && st.sec.kind==="cooldown") fire("cool","Cooldown. Breathe out, let the heart rate settle. 🧘");
}
function tick(){
  if(P.paused) return;
  $("#p-el").textContent=fmtClock(elapsedMs()/1000);
  const st=curStep(); if(!st||!st.secs) return;
  const run=(Date.now()-P.stepStart)/1000; const remain=Math.max(0, st.secs-run);
  document.querySelectorAll(".p-cd").forEach(cd=>cd.textContent = st.type==="rest"? String(Math.ceil(remain)) : fmtClock(Math.ceil(remain)));
  const tb=$("#p-tbar"); if(tb) tb.style.width=`${(remain/st.secs)*100}%`;
  const rc=Math.ceil(remain); if(rc!==P.lastBeep && rc<=3 && rc>=1 && state.settings.beeps){ P.lastBeep=rc; beep(660,0.08); }
  if(remain<=0 && !P.done){ P.done=true; if(state.settings.beeps) beep(990,0.25);
    if(st.type==="amrap"||st.type==="ladder"){ toast(`Time! ${P.amrapRounds} rounds`,true); setTimeout(()=>{ P.done=false; P.amrapRounds=0; P.ladder=2; P.ladderIdx=0; P.amrapIdx=0; P.i++; showStep(); },1200); }
    else if(state.settings.autoAdvance){ setTimeout(()=>{ P.done=false; P.i++; showStep(); },400); }
    else { P.done=false; toast("Time — tap Next",true); }
  }
}
function nextStep(manual){
  const st=curStep(); if(!st) return;
  if(st.type==="amrap"||st.type==="ladder"){
    const items=st.sec.items;
    if(st.type==="amrap"){ P.amrapIdx++; if(P.amrapIdx>=items.length){ P.amrapIdx=0; P.amrapRounds++; } }
    else { P.ladderIdx++; if(P.ladderIdx>=items.length){ P.ladderIdx=0; P.amrapRounds++; P.ladder++; } }
    // keep the cap timer running: re-render info without resetting stepStart
    const keep=P.stepStart; showStep(); P.stepStart=keep; return;
  }
  P.done=false; P.lastBeep=null; P.i++; if(P.i>=P.steps.length){ finishWorkout(false); return; } showStep();
}
function prevStep(){ if(P.i===0) return; P.done=false; P.lastBeep=null; P.i--; while(P.i>0 && P.steps[P.i].type==="rest") P.i--; showStep(); }
function togglePause(){ P.paused=!P.paused; const c=$("#p-clock"); c.classList.toggle("paused",P.paused); $("#p-pause").innerHTML=P.paused?ICON.play:ICON.pause;
  if(P.paused){ P.runMs+=Date.now()-P.runStart; P.runStart=null; P.pausedAt=Date.now(); if(P.yt&&P.ytReady) try{P.yt.pauseVideo();}catch(e){} if(silent) silent.pause(); }
  else { P.runStart=Date.now(); P.stepStart+=Date.now()-P.pausedAt; if(P.yt&&P.ytReady) try{P.yt.playVideo();}catch(e){} if(silent) silent.play().catch(()=>{}); }
  if("mediaSession" in navigator) navigator.mediaSession.playbackState=P.paused?"paused":"playing";
  toast(P.paused?"Paused":"Resumed",true);
}
function confirmExit(){
  const secs=elapsedMs()/1000;
  openSheet(`<h2>Leave workout?</h2><p class="small muted" style="margin:6px 0 14px">${secs>=300?`You've done ${fmtClock(secs)} — it will be saved as a partial session.`:`Under 5 minutes — this session won't be recorded.`}</p><div class="btn-row"><button class="btn ghost" id="x-stay">Keep going</button><button class="btn" id="x-leave" style="background:var(--danger)">Leave</button></div>`);
  $("#x-stay").onclick=closeSheet; $("#x-leave").onclick=()=>{ closeSheet(); finishWorkout(true); };
}
function finishWorkout(partial){
  clearInterval(P.tick); if(P.runStart){ P.runMs+=Date.now()-P.runStart; P.runStart=null; }
  const dur=Math.round(P.runMs/1000); const end=new Date();
  setVideo(null); mediaSessionStop(); releaseWake();
  let rec=null;
  if(dur>=300){
    rec={sid:P.sid, email:me().email, name:me().name, wid:P.W.id, title:P.W.title, start:P.start.toISOString(), end:end.toISOString(), dur, partial:!!partial, steps:P.i, stepsTotal:P.steps.length, cal:null, week:weekOf(P.start)};
    state.sessions.push(rec);
    // persist this session's loads
    Object.values(P.sessionLoads).forEach(l=>state.loads.push(l));
    save(); scheduleSync();
  }
  const pl=$("#player");
  if(!rec){ pl.classList.remove("open"); document.body.style.overflow=""; toast(partial?"Not recorded (under 5 min)":"Done"); render(); return; }
  const cnt=mySessions().length;
  const scURL=`shortcuts://run-shortcut?name=${encodeURIComponent("SWZ Calories")}&input=text&text=${encodeURIComponent(`${rec.sid}|${rec.start}|${rec.end}`)}`;
  pl.innerHTML=`<div class="p-body" style="padding:calc(var(--sat) + 20px) 20px 30px;color:#fff">
    <div class="sum-hero"><div style="font-size:52px">${partial?"👏":"🎉"}</div><div class="big">${fmtClock(dur)}</div><div class="lbl">${partial?"Partial session saved":"Workout complete"}</div>
      <p style="margin-top:10px;color:#D9D6E4">${esc(P.W.title)} · workout #${cnt}</p>
      <p class="small" style="margin-top:8px;color:#B9B6C8">${partial?"Something always beats nothing.":"You don't earn strength in the set — you earned it in the prep. Protein, water, lights out by 10:30."}</p></div>
    <div style="max-width:440px;margin:10px auto 0;display:grid;gap:10px">
      <a class="btn teal block" href="${scURL}" id="calBtn">⌚ Get calories from Apple Watch</a>
      <button class="btn ghost block" id="calManual" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.15)">Enter calories manually</button>
      <button class="btn block" id="doneBtn" style="background:#fff;color:#0E0E14">Done</button></div>
    <p class="tiny" style="text-align:center;margin-top:14px;color:#7E7B92">Calories sync into History within a few minutes once the Shortcut posts them.</p></div>`;
  $("#doneBtn").onclick=()=>{ pl.classList.remove("open"); document.body.style.overflow=""; state.view="history"; render(); };
  $("#calManual").onclick=()=>{ const v=prompt("Active calories (kcal) from your Watch:"); const n=parseFloat(v); if(!isNaN(n)){ rec.cal=n; save(); scheduleSync(); toast("Saved "+Math.round(n)+" kcal"); } };
}

/* ── Load (weights) logging ──────────────── */
function openLoadSheet(it){
  const k=exKey(it.n); const cur=P.sessionLoads[k]; const ll=lastLoad(it.n,P.sid); const u=state.settings.unit;
  const quick=[...new Set([ll&&ll.val!=="BW"?ll.val:null, 5,8,10,12,15,20,25,30].filter(x=>x!=null))].slice(0,8);
  openSheet(`<h2>${esc(it.n)}</h2><p class="small muted" style="margin:4px 0 12px">What did you use today? ${ll?`Last time: <b>${esc(loadLabel(ll))}</b> on ${fmtDate(new Date(ll.date))}.`:""}</p>
    <div class="chips" style="margin-bottom:12px"><button class="chip ${cur&&cur.val==="BW"?"pink":""}" data-q="BW">Bodyweight</button>${quick.map(q=>`<button class="chip ${cur&&cur.val==q?"pink":""}" data-q="${q}">${q} ${u}</button>`).join("")}</div>
    <div class="field"><label>Custom (${u})</label><div style="display:flex;gap:8px"><input id="l-val" type="number" inputmode="decimal" step="0.5" placeholder="e.g. 17.5" value="${cur&&cur.val!=="BW"?cur.val:""}" style="flex:1"><button class="btn" id="l-save">Save</button></div></div>
    <p class="tiny faint">Saved with this session and shown the next time this exercise comes up.</p>`);
  const set=(val)=>{ P.sessionLoads[k]={id:uid(), email:me().email, ex:k, exName:it.n, val, unit:u, date:new Date().toISOString(), sid:P.sid, wid:P.W.id}; closeSheet(); showStep(); toast(`Logged ${val==="BW"?"bodyweight":val+" "+u}`,true); };
  document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>set(b.dataset.q==="BW"?"BW":parseFloat(b.dataset.q)));
  $("#l-save").onclick=()=>{ const n=parseFloat($("#l-val").value); if(isNaN(n)) return toast("Enter a number"); set(n); };
}

/* ── YouTube player ──────────────────────── */
function ensureYT(){
  if(window.YT && window.YT.Player) return;
  if(!document.getElementById("ytapi")){ const s=document.createElement("script"); s.id="ytapi"; s.src="https://www.youtube.com/iframe_api"; document.head.appendChild(s); }
}
window.onYouTubeIframeAPIReady=()=>{ if(P.W && P.pendingVid) setVideo(P.pendingVid); };
function setVideo(vid){
  const host=document.getElementById("yt");
  if(!vid){ if(P.yt){ try{P.yt.destroy();}catch(e){} P.yt=null; P.ytReady=false; P.vid=null; } P.pendingVid=null; return; }
  if(!(window.YT && window.YT.Player)){ P.pendingVid=vid; ensureYT(); return; }
  if(!host){ return; }
  // host element is re-created on every step; always build a fresh player
  if(P.yt){ try{P.yt.destroy();}catch(e){} P.yt=null; P.ytReady=false; }
  P.vid=vid;
  P.yt=new YT.Player("yt",{videoId:vid, playerVars:{autoplay:1, playsinline:1, rel:0, modestbranding:1, controls:1, fs:0, iv_load_policy:3, mute:state.settings.sound?0:1, loop:1, playlist:vid, origin:location.origin},
    events:{ onReady:e=>{ P.ytReady=true; try{ state.settings.sound? e.target.unMute() : e.target.mute(); if(!P.paused) e.target.playVideo(); }catch(x){} },
             onStateChange:e=>{ if(e.data===YT.PlayerState.ENDED && !P.paused){ try{ e.target.seekTo(0); e.target.playVideo(); }catch(x){} } },
             onError:()=>{ const nv=document.getElementById("p-novid"); if(nv){ nv.classList.remove("hide"); nv.innerHTML=`<div><div class="small">Video unavailable</div><a class="link" style="color:#fff" target="_blank" href="https://youtu.be/${vid}">Open on YouTube</a></div>`; } } }});
}

/* ── Media Session (Apple Watch / lock-screen controls) ── */
let silent=null;
function silentWav(){ // 2 s of silence, 8 kHz mono PCM — tiny data URI so the page owns an audio session
  const n=16000, buf=new ArrayBuffer(44+n), v=new DataView(buf); const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  w(0,"RIFF"); v.setUint32(4,36+n,true); w(8,"WAVE"); w(12,"fmt "); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,8000,true); v.setUint32(28,8000,true); v.setUint16(32,1,true); v.setUint16(34,8,true); w(36,"data"); v.setUint32(40,n,true); for(let i=0;i<n;i++) v.setUint8(44+i,128);
  return URL.createObjectURL(new Blob([buf],{type:"audio/wav"}));
}
function mediaSessionStart(){
  if(!state.settings.watch || !("mediaSession" in navigator)) return;
  try{
    if(!silent){ silent=new Audio(silentWav()); silent.loop=true; silent.volume=0.01; }
    silent.play().catch(()=>{});
    navigator.mediaSession.setActionHandler("play",()=>{ if(P.paused) togglePause(); });
    navigator.mediaSession.setActionHandler("pause",()=>{ if(!P.paused) togglePause(); });
    navigator.mediaSession.setActionHandler("nexttrack",()=>nextStep(true));
    navigator.mediaSession.setActionHandler("previoustrack",prevStep);
    navigator.mediaSession.playbackState="playing";
  }catch(e){}
}
function mediaSessionMeta(title, artist){
  if(!("mediaSession" in navigator) || !state.settings.watch) return;
  try{ navigator.mediaSession.metadata=new MediaMetadata({title, artist, album:"Stronger with Zoe", artwork:[{src:"icon-512.png",sizes:"512x512",type:"image/png"}]}); }catch(e){}
}
function mediaSessionStop(){ try{ if(silent){ silent.pause(); } if("mediaSession" in navigator){ navigator.mediaSession.playbackState="none"; navigator.mediaSession.metadata=null; } }catch(e){} }

/* ── Beeps & wake lock ───────────────────── */
let actx=null; function beep(f,d){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); const o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=f; o.connect(g); g.connect(actx.destination); g.gain.setValueAtTime(0.0001,actx.currentTime); g.gain.exponentialRampToValueAtTime(0.4,actx.currentTime+0.01); g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+d); o.start(); o.stop(actx.currentTime+d+0.02);}catch(e){} }
let wl=null; async function wakeLock(){ try{ if("wakeLock" in navigator) wl=await navigator.wakeLock.request("screen"); }catch(e){} }
function releaseWake(){ try{ wl&&wl.release(); wl=null; }catch(e){} }
document.addEventListener("visibilitychange",()=>{ if(!document.hidden && $("#player").classList.contains("open")) wakeLock(); });

/* ── Calorie return via URL (?sid=&cal=) ─── */
(function handleCalorieURL(){
  const q=new URLSearchParams(location.search); const sid=q.get("sid"), cal=parseFloat(q.get("cal"));
  if(sid && !isNaN(cal)){ const s=state.sessions.find(x=>x.sid===sid); if(s){ s.cal=cal; save(); }
    if(apiUrl()){ fetch(apiUrl(),{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"calories",sid,cal}),redirect:"follow"}).catch(()=>{}); }
    history.replaceState(null,"",location.pathname); setTimeout(()=>toast(`Saved ${Math.round(cal)} kcal`),400); state.view="history"; }
})();

/* ── Boot ─────────────────────────────────── */
if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }
render(); sync();
