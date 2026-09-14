/**
 * Stronger with Zoe — backend (Google Apps Script bound to a Google Sheet)
 * ------------------------------------------------------------------
 * Tabs (auto-created): Users · Sessions · Loads · Feedback
 * Endpoints (POST, text/plain JSON):
 *   {action:"sync", user, sessions[], loads[], feedback[]}  → upserts, returns user's sessions+loads
 *   {action:"calories", sid, cal}                              → sets calories on a session (Apple Shortcut)
 *   GET ?ping=1                                                → health check
 * Time-driven triggers (run setupTriggers() once):
 *   sundayEmail()  — Sunday 6 pm: progress email to every user
 *   fridayDigest() — Friday 7 am: feedback digest to OWNER_EMAIL
 * ------------------------------------------------------------------ */
const OWNER_EMAIL = "neelshah0147@gmail.com";
const APP_URL = "https://pivot12.github.io/stronger-with-zoe/"; // filled at deploy
const TZ = "America/Los_Angeles";
const TABS = {
  Users:    ["email","name","unit","created","lastSeen"],
  Sessions: ["sid","email","name","wid","title","start","end","dur","partial","steps","stepsTotal","cal","week","received"],
  Loads:    ["id","email","ex","exName","val","unit","date","sid","wid"],
  Feedback: ["id","app","when","name","email","view","text","ua","status"]
};

function sheet(name){
  const ss=SpreadsheetApp.getActiveSpreadsheet(); let sh=ss.getSheetByName(name);
  if(!sh){ sh=ss.insertSheet(name); sh.appendRow(TABS[name]); sh.setFrozenRows(1); sh.getRange(1,1,1,TABS[name].length).setFontWeight("bold"); }
  return sh;
}
function readAll(name){
  const sh=sheet(name); const vals=sh.getDataRange().getValues(); const head=vals.shift()||TABS[name];
  return vals.filter(r=>r[0]!=="").map(r=>{ const o={}; head.forEach((h,i)=>o[h]=r[i]); return o; });
}
function upsert(name, key, rows){
  if(!rows||!rows.length) return 0;
  const sh=sheet(name); const head=TABS[name]; const vals=sh.getDataRange().getValues(); vals.shift();
  const idx=new Map(vals.map((r,i)=>[String(r[head.indexOf(key)]), i+2]));
  let n=0;
  rows.forEach(o=>{
    const row=head.map(h=> o[h]===undefined||o[h]===null ? "" : (typeof o[h]==="object"? JSON.stringify(o[h]) : o[h]));
    const r=idx.get(String(o[key]));
    if(r){ // keep server-side calories if the client sends null
      if(name==="Sessions"){ const cur=sh.getRange(r,head.indexOf("cal")+1).getValue(); if(cur!=="" && (o.cal===null||o.cal===undefined)) row[head.indexOf("cal")]=cur; }
      sh.getRange(r,1,1,head.length).setValues([row]);
    } else { sh.appendRow(row); n++; }
  });
  return n;
}
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet(e){ return json({ok:true, app:"swz", time:new Date().toISOString()}); }
function doPost(e){
  const lock=LockService.getScriptLock(); lock.tryLock(10000);
  try{
    const b=JSON.parse(e.postData.contents||"{}");
    if(b.action==="calories"){
      const cal=Number(b.cal); if(!b.sid||isNaN(cal)) return json({ok:false,error:"sid/cal required"});
      const sh=sheet("Sessions"); const head=TABS.Sessions; const vals=sh.getDataRange().getValues();
      for(let i=1;i<vals.length;i++){ if(String(vals[i][0])===String(b.sid)){ sh.getRange(i+1,head.indexOf("cal")+1).setValue(Math.round(cal)); return json({ok:true, sid:b.sid, cal:Math.round(cal)}); } }
      // session not synced yet → park it, sync will pick it up
      PropertiesService.getScriptProperties().setProperty("cal_"+b.sid, String(Math.round(cal)));
      return json({ok:true, parked:true});
    }
    if(b.action==="sync"){
      const u=b.user||{}; if(!u.email) return json({ok:false,error:"user required"});
      upsert("Users","email",[{email:u.email,name:u.name,unit:u.unit||"",created:u.created||"",lastSeen:new Date().toISOString()}]);
      const props=PropertiesService.getScriptProperties();
      (b.sessions||[]).forEach(s=>{ s.received=new Date().toISOString(); const parked=props.getProperty("cal_"+s.sid); if(parked&&(s.cal==null)){ s.cal=Number(parked); props.deleteProperty("cal_"+s.sid); } });
      upsert("Sessions","sid",b.sessions||[]);
      upsert("Loads","id",b.loads||[]);
      upsert("Feedback","id",(b.feedback||[]).map(f=>Object.assign({status:"new"},f)));
      const sessions=readAll("Sessions").filter(s=>s.email===u.email).map(s=>({sid:s.sid,email:s.email,name:s.name,wid:s.wid,title:s.title,start:s.start,end:s.end,dur:Number(s.dur),partial:s.partial===true||s.partial==="TRUE"||s.partial==="true",steps:Number(s.steps),stepsTotal:Number(s.stepsTotal),cal:s.cal===""?null:Number(s.cal),week:Number(s.week)}));
      const loads=readAll("Loads").filter(l=>l.email===u.email).map(l=>({id:l.id,email:l.email,ex:l.ex,exName:l.exName,val:l.val==="BW"?"BW":Number(l.val),unit:l.unit,date:l.date,sid:l.sid,wid:l.wid}));
      return json({ok:true, sessions, loads});
    }
    return json({ok:false,error:"unknown action"});
  }catch(err){ return json({ok:false,error:String(err)}); }
  finally{ lock.releaseLock(); }
}

/* ── Emails ─────────────────────────────── */
function fmtMin(s){ const m=Math.round(Number(s)/60); return m>=60? Math.floor(m/60)+"h "+(m%60)+"m" : m+" min"; }
function sundayEmail(){
  const users=readAll("Users"); const sessions=readAll("Sessions").filter(s=>Number(s.dur)>=300);
  const now=new Date(); const weekAgo=new Date(now.getTime()-7*864e5);
  users.forEach(u=>{
    const mine=sessions.filter(s=>s.email===u.email); const wk=mine.filter(s=>new Date(s.start)>=weekAgo);
    const mins=wk.reduce((a,s)=>a+Number(s.dur),0); const cal=wk.reduce((a,s)=>a+(s.cal?Number(s.cal):0),0);
    const list=wk.map(s=>"• "+Utilities.formatDate(new Date(s.start),TZ,"EEE d MMM")+" — "+s.title+" ("+fmtMin(s.dur)+(s.cal?", "+Math.round(s.cal)+" kcal":"")+")").join("\n");
    const line = wk.length>=4 ? "Four lunchtimes you keep beat seven you dread — you kept them." : wk.length>=3 ? "Three strength days build the engine. That's the system working." : wk.length>0 ? "Something always beats nothing. Next week: kit on, ten minutes, permission to stop." : "A quiet week. No guilt — pick the next session, ten minutes, permission to stop.";
    const body = `Hi ${u.name||""},\n\nYour week with Zoe:\n\n${wk.length} workout${wk.length===1?"":"s"} · ${fmtMin(mins)}${cal?" · "+Math.round(cal)+" kcal":""}\n${list||"(no sessions logged)"}\n\n${line}\n\nAll-time: ${mine.length} workouts · ${fmtMin(mine.reduce((a,s)=>a+Number(s.dur),0))}.\n\nThis is also the moment for your Sunday check-in to Zoe: how training felt, energy, sleep, motivation, and your wins.\n\nOpen the app: ${APP_URL}\n`;
    try{ MailApp.sendEmail({to:u.email, subject:`Stronger with Zoe — week wrap: ${wk.length} workout${wk.length===1?"":"s"}`, body}); }catch(e){ console.warn(e); }
  });
}
function fridayDigest(){
  const sh=sheet("Feedback"); const rows=readAll("Feedback"); const fresh=rows.filter(r=>r.status==="new");
  if(!fresh.length){ MailApp.sendEmail({to:OWNER_EMAIL, subject:"SWZ app — no new feedback this week", body:"Nothing new in the improvement log for the Stronger with Zoe app.\n\nSheet: "+SpreadsheetApp.getActiveSpreadsheet().getUrl()}); return; }
  const body="New feedback for the Stronger with Zoe app (for your approval):\n\n"+fresh.map((f,i)=>`${i+1}. [${Utilities.formatDate(new Date(f.when),TZ,"EEE d MMM HH:mm")}] ${f.name} · screen: ${f.view}\n   "${f.text}"`).join("\n\n")+"\n\nReply with the numbers you approve. Sheet: "+SpreadsheetApp.getActiveSpreadsheet().getUrl();
  MailApp.sendEmail({to:OWNER_EMAIL, subject:`SWZ app — ${fresh.length} feedback item${fresh.length===1?"":"s"} to review`, body});
  const head=TABS.Feedback; const vals=sh.getDataRange().getValues();
  for(let i=1;i<vals.length;i++){ if(vals[i][head.indexOf("status")]==="new") sh.getRange(i+1,head.indexOf("status")+1).setValue("emailed"); }
}
function setupTriggers(){
  ScriptApp.getProjectTriggers().forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sundayEmail").timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(18).inTimezone(TZ).create();
  ScriptApp.newTrigger("fridayDigest").timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(7).inTimezone(TZ).create();
  Object.keys(TABS).forEach(sheet);
}
