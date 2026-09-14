/* ============================================================
   Stronger with Zoe — Program data (Month 1 · Weeks 1–4)
   Source: "SWZ Aneri Sanghavi Workouts M1 W1-4.pdf" (20 pages)
   Every exercise carries the YouTube video ID linked in the PDF.
   Item fields: n=name, v=YouTube id (null = no video), reps, secs,
   each=true → played twice (Left/Right), note, load=true → prompts
   for weight, eq=[equipment keys]
   Section fields: kind warmup|main|superset|finisher|cooldown|stretch|
   cardio|amrap|ladder|intervals, rounds, restRound (s), restItem (s), cap (s)
   ============================================================ */
const EQUIP = {
  db:{label:"Dumbbells",short:"DBs",icon:"🏋️"}, band:{label:"Resistance band",short:"Band",icon:"➰"},
  mat:{label:"Mat",icon:"🧘"}, chair:{label:"Chair / counter",short:"Chair",icon:"🪑"},
  wall:{label:"Wall",icon:"🧱"}, towel:{label:"Rolled towel",short:"Towel",icon:"🧻"},
  cushion:{label:"Cushion / ball",short:"Cushion",icon:"🔵"}, tread:{label:"Treadmill / bike / outdoors",short:"Treadmill",icon:"🚶"},
  stool:{label:"Stool / step",icon:"🪜"}, water:{label:"Water bottle",icon:"💧"}, trainers:{label:"Supportive trainers",icon:"👟"}
};

/* Reusable items */
const I = {
  breathing:{n:"90/90 Breathing",v:"ehaUhSSY1xY",reps:"8 breaths",eq:["mat","wall"]},
  catcow:{n:"Cat–Cow Spinal Flow",v:"QQ_e6PQf75A",secs:120,eq:["mat"]},
  halfKneelThor:{n:"Half Kneeling Thoracic Rotation",v:"j7u_Z5S6Jlc",secs:60,eq:["mat","cushion"]},
  gluteBridge:{n:"Glute Bridge",v:"mz3yj4MP3Pw",eq:["mat"]},
  deadbug:{n:"Dead Bug",v:"ZXo5tLdqLDw",eq:["mat"]},
  cooldown:{n:"Cooldown Flow",v:"kME6yKjAmGU",secs:300,eq:["mat"]},
  warmupFlow1:{n:"Warmup Flow",v:"ug-UxAJQ31A",secs:300,eq:["mat"]},
  warmupFlow2:{n:"Warmup Flow",v:"kBt7O3INVD8",secs:300,eq:["mat"]},
  birdDog:{n:"Bird Dog",v:"AaYpP7iV378",eq:["mat"]},
  plankHold:{n:"Plank Hold",v:"5L6Ebpsi2mQ",eq:["mat"]},
  plankWalkouts:{n:"Plank Walkouts (no jump)",v:"-zAcUE-8C0E",eq:["mat"]},
  crossMC:{n:"Cross Mountain Climbers",v:"AU8-Nm94Agg",note:"Slow, step in",eq:["mat"]},
  kickSits:{n:"BW Plank Kick Sits",v:"DQ0IKhTOp4Y",eq:["mat"]},
  facePulls:{n:"Face Pulls — Band",v:"FTA-s2df6M4",reps:"20",eq:["band"]},
  wallSit:{n:"Wall Sit",v:"6f9cg2GmOd8",eq:["wall"]},
  heelSlides:{n:"Heel Slides",v:"AIEdkm2q-4k",eq:["mat"]},
  gluteBand:{n:"Glute Band Work",v:"okwRYnylQXw",note:"Band above the knees · lean on a stool or bed",eq:["band","chair"]},
  proneY:{n:"Prone Y Raises",v:"cYLucJwoiFI",reps:"10",eq:["mat"]},
  dbsGluteBridge:{n:"DBs Glute Bridge",v:"eCDHTE105DM",load:true,eq:["db","mat"]},
  dbChestPress:{n:"DB Chest Press on Floor",v:"IMzhorvZ710",load:true,eq:["db","mat"]},
  hamstringMarch1:{n:"Hamstring Marches",v:"jzrdlRMPCYk",eq:["mat"]},
  hamstringMarch2:{n:"Hamstring Marches",v:"K498HXaVrDY",eq:["mat"]},
};
const STRETCH8 = [
  {n:"Lateral Childpose Stretch",v:"Jo6-aIT_bMA",secs:60,eq:["mat"]},
  {n:"Glute Bridge to Overhead Reach",v:"N3wAP8C-F_Q",secs:60,eq:["mat"]},
  {n:"Dynamic Pigeon",v:"ebjctOYLiCM",secs:60,eq:["mat"]},
  {n:"Shoulder Thread the Needle Stretch",v:"wrWIp0ImyqA",secs:60,eq:["mat"]},
  {n:"Wide Split Forearm to Ground Stretch",v:"v2gWM30AA4A",secs:60,eq:["mat"]},
  {n:"Seated Side Lunge with a Twist",v:"iJRnQnx2-s0",secs:60,eq:["mat"]},
  {n:"Cat Camel + Alt Lunge",v:"wefLMKlmchQ",secs:60,eq:["mat"]},
];
const CRAB = {n:"Crab Reach",v:"Ai46F_c3aRU",secs:60,eq:["mat"]};
const w = (base,extra)=>Object.assign({},base,extra);

const WORKOUTS = {
/* ─────────────── DAILY ─────────────── */
mobility:{
  id:"mobility", title:"Daily Mobility Flow", short:"Mobility", kind:"mobility", tag:"Every day · 10 min",
  intro:["A 10-minute routine you do every day — on the mat at home, first thing, or while your toddler naps.","Gentle, back-safe mobility for the hips, spine, deep core, pelvic floor and shoulders that keeps you moving well and makes the strength days feel easy."],
  sections:[{title:"Daily Mobility Flow",kind:"stretch",rounds:1,items:[
    w(I.breathing,{secs:60,reps:null}), I.catcow, w(I.halfKneelThor,{note:"Both sides"}), w(I.gluteBridge,{n:"Glute Bridge (glute activation)",secs:60}), w(I.deadbug,{n:"Dead Bug (deep core, back-safe)",secs:60})
  ]}]
},
/* ─────────────── WEEKS 1–2 ─────────────── */
w1_A:{
  id:"w1_A", title:"Strength A — Lower Body + Glutes", short:"Strength A", kind:"strength", tag:"Day 1 · Mon",
  intro:["Weeks 1–2: master the form. Control is the load — own the tempo and reps before adding weight."],
  sections:[
   {title:"Warmup · Activation Sequence",kind:"warmup",rounds:3,items:[
     I.breathing, {n:"Supermans",v:"j-2tti5NIBU",reps:"10",note:"Slow, squeeze at the top",eq:["mat"]}, w(I.gluteBand,{reps:"1 set"})]},
   {title:"Part 1 · Lower Body Strength",kind:"main",rounds:3,restRound:90,items:[
     {n:"DB Romanian Deadlifts",v:"7pcB1xa4vEg",reps:"10",note:"6–8 kg each — hinge from hips",load:true,eq:["db"]},
     {n:"DB Sumo Squat",v:"sQ-lwJtpwUc",reps:"12",load:true,eq:["db"]},
     w(I.dbsGluteBridge,{reps:"15"}),
     {n:"Goblet Squat",v:"7-80HiXX1K8",reps:"12",note:"8–12 kg DB — to a chair to learn the depth",load:true,eq:["db","chair"]},
     {n:"Calf Raises from Hell",v:"r_KVRDjwZ1g",reps:"12",each:true,note:"Slow, hold the top",eq:["wall"]}]},
   {title:"Core Superset — The Challenge",kind:"superset",rounds:3,restRound:60,note:"Back-to-back. No rest between A and B. Rest 60 sec after both.",items:[
     {n:"Elbow Knee Side Plank Lifts",v:"zaOToxvSk6g",reps:"10",each:true,eq:["mat"]},
     w(I.deadbug,{reps:"10",each:true})]},
   {title:"Conditioning Finisher",kind:"finisher",rounds:4,restRound:60,note:"Minimal rest between exercises, 60 sec between rounds",items:[
     w(I.birdDog,{reps:"10",each:true}), w(I.wallSit,{secs:40}), w(I.hamstringMarch1,{reps:"12"})]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[I.cooldown]}
  ]},
w1_walk:{
  id:"w1_walk", title:"Easy Walk + Optional Core", short:"Easy Walk", kind:"cardio", tag:"Day 2 · Tue",
  intro:["An easy lunchtime: a steady walk to build the base, then a short core circuit on the mat at home if you have the time.","WALK · 30 min steady, outdoors with the stroller or on the treadmill — full sentences possible throughout. Supportive trainers on.","CORE · optional, 3 rounds. A stroller walk counts."],
  sections:[
   {title:"Walk · 30 min steady",kind:"cardio",rounds:1,items:[{n:"Steady Walk",v:null,secs:1800,note:"Conversational pace — full sentences possible. Stroller counts.",eq:["tread","trainers"]}]},
   {title:"Core (optional)",kind:"main",rounds:3,restRound:60,optional:true,note:"Back-to-back, rest 60 sec after.",items:[
     w(I.deadbug,{reps:"20"}), w(I.plankHold,{secs:60,note:"Knees down if you dome"}), {n:"Side Elbow Plank Rotations",v:"mSZp5_v959U",reps:"20",eq:["mat"]}, w(I.birdDog,{reps:"20"})]},
   {title:"Stretching After",kind:"stretch",rounds:1,items:[...STRETCH8,CRAB]}
  ]},
w1_B:{
  id:"w1_B", title:"Strength B — Upper Body + Core", short:"Strength B", kind:"strength", tag:"Day 3 · Wed",
  intro:["Upper body + core. Activation sequence is mat only."],
  sections:[
   {title:"Warmup · Activation Sequence (mat only)",kind:"warmup",rounds:3,items:[
     I.breathing, {n:"Scapular Circles",v:"SBPRhZI2RkI",reps:"15",eq:["mat"]}, w(I.proneY,{reps:"10",each:true})]},
   {title:"Part 1 · Upper Body Strength",kind:"main",rounds:3,restRound:90,items:[
     {n:"DB Bent Over Rows",v:"XgspPFG8Jco",reps:"12",load:true,eq:["db"]},
     {n:"DB Shoulder Press",v:"aDpopwg-eKM",reps:"10",note:"Neutral grip, pain-free range",load:true,eq:["db"]},
     w(I.dbChestPress,{reps:"12"}),
     {n:"DB Rear Delt Fly",v:"eMX4AzoEEUU",reps:"15",load:true,eq:["db"]},
     I.facePulls]},
   {title:"Core Superset — The Challenge",kind:"superset",rounds:4,restRound:60,note:"Back-to-back. No rest between A and B. Rest 60 sec after both.",items:[
     {n:"Bear Crawl Shoulder Taps",v:"Ua1RW-JXgOI",reps:"20",note:"20 total = both sides",eq:["mat"]},
     {n:"BW Mountain Climbers",v:"EBQ3nnOe86M",reps:"30",note:"Slow — step, don't bounce",eq:["mat"]}]},
   {title:"Conditioning Finisher",kind:"finisher",rounds:4,restRound:60,restItem:15,note:"45 sec work / 15 sec rest format",items:[
     {n:"(Band) Standing Lateral Raises",v:"8DGxev-D0fE",secs:45,note:"Target 15 reps · or 2 kg DBs",load:true,eq:["band","db"]},
     {n:"DB Tricep Kickbacks",v:"N6PGS2vPfxM",secs:45,note:"Target 20 reps",load:true,eq:["db"]},
     w(I.kickSits,{secs:45,note:"Target 20 reps"}),
     w(I.plankHold,{secs:30})]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[I.cooldown]}
  ]},
w1_yoga:{
  id:"w1_yoga", title:"Yoga / Pilates + Mobility", short:"Yoga + Mobility", kind:"mobility", tag:"Day 4 · Thu · 20–30 min",
  intro:["Your yoga / Pilates lunchtime — quiet recovery work for the hips, lower back and shoulders, easing the muscular tightness of desk hours.","20–30 min of any gentle yoga or Pilates flow you enjoy, or run the stretch flow below × 2 unhurried rounds. Toddler at home or a late night? A 15-min walk counts.","This is restoration, not a workout. Intervals wait until Week 3 — this month we build the base first."],
  sections:[{title:"Stretch Flow",kind:"stretch",rounds:2,items:[...STRETCH8,CRAB]}]
},
w1_C:{
  id:"w1_C", title:"Strength C — Full Body", short:"Strength C", kind:"strength", tag:"Day 5 · Fri",
  intro:["Full body. Push-ups incline on a counter until braced; renegade rows knees down is fine."],
  sections:[
   {title:"Warmup · Activation Sequence",kind:"warmup",rounds:3,items:[
     I.breathing, w(I.heelSlides,{reps:"20"}), w(I.gluteBand,{reps:"15"})]},
   {title:"Part 1 · Full Body Strength",kind:"main",rounds:3,restRound:90,items:[
     {n:"DB Thrusters",v:"Ns7-zmeljIM",reps:"12",note:"Light — pain-free range",load:true,eq:["db"]},
     {n:"DB Deadlift",v:"pPXfwJLvTX4",reps:"12",load:true,eq:["db"]},
     {n:"Push-Ups",v:"VAMeX7OlwHQ",reps:"10–12",note:"Incline on a counter until braced",eq:["chair"]},
     {n:"Renegade Rows",v:"1LQ88wk8cDY",reps:"12",note:"12 total · knees down is fine",load:true,eq:["db","mat"]},
     {n:"DB Sumo Squat to Bicep Curl",v:"JKuJOfxcnRM",reps:"12",load:true,eq:["db"]}]},
   {title:"Core Superset — The Challenge",kind:"superset",rounds:3,restRound:60,note:"Back-to-back. No rest between A and B. Rest 60 sec after both.",items:[
     {n:"Bear Crawl Lifts with Cushion Squeeze",v:"Y0xmJ3IuOCU",secs:40,note:"Knees 1 inch off floor",eq:["mat","cushion"]},
     {n:"Elbow Plank Knee to Elbow",v:"U_G-lhfgluo",secs:45,eq:["mat"]}]},
   {title:"Conditioning Finisher · Cardio — Low Impact",kind:"finisher",rounds:4,restRound:60,note:"60-sec brisk march, then straight into circuit, 60 sec rest between rounds",items:[
     {n:"Brisk March",v:null,secs:60,note:"On the spot — drive the knees",eq:[]},
     w(I.plankWalkouts,{n:"Plank Walkouts",reps:"8"}),
     {n:"(DB) Wall Squat Hold",v:"6f9cg2GmOd8",secs:40,note:"5–8 kg",load:true,eq:["db","wall"]},
     w(I.crossMC,{reps:"40"})]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[I.cooldown]}
  ]},
w1_cardio:{
  id:"w1_cardio", title:"Cardio + Core — Treadmill / Bike + Circuit", short:"Cardio + Core", kind:"cardio", tag:"Day 6 · Sat",
  intro:["OPTION: swap the whole session for an easy 40-min walk or bike if your toddler is home, you're tired or short on time. Add a gentle yoga / Pilates flow if you fancy it. Something always beats nothing — and a five-hour night is a real reason, not an excuse."],
  sections:[
   {title:"Warmup",kind:"warmup",rounds:1,items:[I.warmupFlow1]},
   {title:"Part 1 · Cardio",kind:"cardio",rounds:1,items:[{n:"Brisk Treadmill Walk (or bike)",v:null,secs:1200,eq:["tread","trainers"]}]},
   {title:"Part 2 · AMRAP 10 min",kind:"amrap",cap:600,rounds:1,infoVideo:"9ksoJD31e_E",note:"As many rounds as possible in 10 minutes. Smooth and controlled.",items:[
     w(I.plankWalkouts,{reps:"10"}), w(I.gluteBridge,{reps:"10"}), {n:"Superman Pulldowns",v:"gloz6uibb5g",reps:"10",eq:["mat"]}]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[I.cooldown]}
  ]},
w1_rest:{
  id:"w1_rest", title:"Rest Day", short:"Rest", kind:"rest", tag:"Day 7 · Sun",
  intro:["YAY!! Complete rest. Your body repairs and gets stronger."],
  restList:[["Steps","An easy walk is optional — a stroller walk in the park counts. Don't force it."],["Sleep","Aim a steady 7 hours tonight. Get to bed earlier if the week ran late."],["Protein","Protein at each meal — a palm each time, ~105 g. Recovery is built from protein."],["Hydration","Keep sipping water — a steady 2.5 L. Ten minutes of morning sun too."],["Mobility","The daily mobility flow (10 min) if you like — plus 2 minutes of 360° breathing."],["Mental","Sunday check-in to Zoe: how training felt, energy, sleep, motivation, and your wins."]],
  quote:"Rest is where the work sets in — muscle repairs, energy rebuilds, the back unwinds. Enjoy it fully; you've earned it.",
  sections:[]
},
/* ─────────────── WEEKS 3–4 ─────────────── */
w3_A:{
  id:"w3_A", title:"Strength A — Lower (Heavier)", short:"Strength A+", kind:"strength", tag:"Day 1 · Mon", heavier:true,
  intro:["W3 & W4 · heavier. Rest 60–90 sec between working sets. Dizzy, or a set feels 2 gears too hard? Stop — tell Zoe."],
  sections:[
   {title:"Warmup · Activation Sequence",kind:"warmup",rounds:3,items:[
     I.breathing, {n:"Glute Bridge March",v:"eCDHTE105DM",reps:"12",eq:["mat"]}, {n:"Standing Clam (band) + Standing March",v:"eCDHTE105DM",reps:"8",each:true,eq:["band"]}]},
   {title:"Part 1 · Lower Body Strength",kind:"main",rounds:3,restRound:90,items:[
     {n:"DB Sumo Squat",v:"fPVvZL26PFc",reps:"15",load:true,eq:["db"]},
     {n:"DB Stiff Deadlift",v:"7pcB1xa4vEg",reps:"15",load:true,eq:["db"]},
     {n:"Bulgarian Split Squat",v:"owTQ5kxZeiU",reps:"8",each:true,note:"Rear foot on chair · shallow to start",load:true,eq:["chair","db"]},
     w(I.dbsGluteBridge,{reps:"15"}),
     {n:"Elevated Heel Squats",v:"r-wWtYEzYIw",reps:"15",note:"Heels on a rolled towel, 5–7 kg DB",load:true,eq:["db","towel"]}]},
   {title:"Core Superset — The Challenge",kind:"superset",rounds:3,restRound:60,note:"Back-to-back. No rest between A and B. Rest 60 sec after both.",items:[
     {n:"Side Plank with Leg Lift",v:"ZNypVhh3-18",reps:"10",each:true,note:"Slow, controlled",eq:["mat"]},
     {n:"Bear Crawl Toe Taps",v:"7J_zyahEG8E",reps:"20",eq:["mat"]}]},
   {title:"Conditioning Finisher",kind:"finisher",rounds:4,restRound:60,note:"Minimal rest between exercises, 60 sec between rounds",items:[
     {n:"DB Swings",v:"wqUKvSouuFI",reps:"20",note:"One dumbbell, 8–10 kg",load:true,eq:["db"]},
     w(I.hamstringMarch2,{reps:"16"}), w(I.crossMC,{reps:"50"})]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[I.cooldown]}
  ]},
w3_B:{
  id:"w3_B", title:"Strength B — Upper Body (Heavier)", short:"Strength B+", kind:"strength", tag:"Day 2 · Wed", heavier:true,
  intro:["W3 & W4 · heavier. Add reps to the indicators, sharpen technique, keep recovery high."],
  sections:[
   {title:"Warmup · Activation Sequence",kind:"warmup",rounds:3,items:[
     I.breathing, {n:"Kneeling Mini Band Pull Aparts",v:"jiz7-6nJvjY",reps:"15",eq:["band","mat"]}, w(I.proneY,{reps:"10"})]},
   {title:"Part 1 · Upper Body Strength",kind:"main",rounds:3,restRound:90,items:[
     {n:"DBs Bent Over Narrow to Wide Grip Rows",v:"UG24rZOvY4Q",reps:"15",load:true,eq:["db"]},
     {n:"DB Pullover",v:"6yYVcIOAERY",reps:"10–12",load:true,eq:["db","mat"]},
     {n:"Incline Tricep Push-Ups",v:"RiZtbn6bvx4",reps:"12",eq:["chair"]},
     {n:"DB Seated Single Arm Shoulder Press",v:"70Jq9LIZLm8",reps:"12",each:true,load:true,eq:["db","chair"]},
     w(I.facePulls,{n:"Face Pulls — use band"})]},
   {title:"Core Superset — The Challenge",kind:"superset",rounds:4,restRound:60,note:"Back-to-back. No rest between A and B. Rest 60 sec after both.",items:[
     {n:"Baby Crawl Army Planks",v:"rL7OCJxaUm0",reps:"12",eq:["mat"]},
     {n:"Hollow Hold",v:"q5y-kxaJ7oc",secs:15,note:"Only if no doming — else dead bug",eq:["mat"]}]},
   {title:"Conditioning Finisher",kind:"finisher",rounds:4,restRound:60,restItem:15,note:"45 sec work / 15 sec rest format",items:[
     {n:"Cardio DB Boxing",v:"96FjG4uAu_s",secs:45,load:true,eq:["db"]},
     {n:"Tricep Dips",v:"cz5AVK2Hf6o",secs:45,note:"Target 15 reps",eq:["stool"]},
     {n:"Low-Impact Plank Step-Outs",v:"YiC-sRQgp6s",secs:45,note:"Target 20 reps",eq:["mat"]}]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[I.cooldown]}
  ]},
w3_int:{
  id:"w3_int", title:"Intervals — Bike or Treadmill (HIIT-lite)", short:"Intervals", kind:"intervals", tag:"Day 3 · Fri",
  intro:["Your first intervals, and they are earned: 30 sec push / 90 sec easy × 8–10, after a 5-min easy warmup. Bike or treadmill incline walk — low-impact by design, so your hips and back stay happy. The easy 90 seconds are real recovery; let the heart rate settle.","Treadmill version: +0.5–0.8 km/h or 3–4% incline for the push — walk, don't run, this month. Dizzy, doming or unusually wiped? Cut to 5 sets — and tell Zoe."],
  sections:[
   {title:"Easy Warmup",kind:"cardio",rounds:1,items:[{n:"Easy Warmup — walk / spin",v:null,secs:300,eq:["tread","trainers"]}]},
   {title:"Intervals × 8",kind:"intervals",rounds:8,items:[
     {n:"PUSH",v:null,secs:30,note:"+0.5–0.8 km/h or 3–4% incline · walk, don't run",eq:["tread"]},
     {n:"EASY",v:null,secs:90,note:"Real recovery — let the heart rate settle",eq:["tread"]}]},
   {title:"Stretch After",kind:"stretch",rounds:1,items:[
     w(I.catcow,{secs:60}), {n:"Shoulder Thread the Needle Stretch",v:"wrWIp0ImyqA",secs:60,eq:["mat"]},
     {n:"World's Greatest Stretch (hip + T-spine)",v:"BtlDLVmlBb4",secs:60,eq:["mat"]},
     {n:"Pelvic Tilt — posterior (physio)",v:"OwFN9Paf26o",secs:60,eq:["mat"]},
     {n:"Hip Flexor Stretch",v:"lKCjfbn9-pQ",secs:60,eq:["mat","chair"]},
     w(I.halfKneelThor,{secs:60})]}
  ]},
w3_C:{
  id:"w3_C", title:"Strength C — Full Body (Heavier)", short:"Strength C+", kind:"strength", tag:"Day 4 · Sat", heavier:true,
  intro:["W3 & W4 · heavier. Keep everything low-impact and comfortable."],
  sections:[
   {title:"Warmup · Activation Sequence",kind:"warmup",rounds:3,items:[
     I.breathing, w(I.heelSlides,{reps:"10"}), {n:"Modified Side Plank Clamshell with Band",v:"vvQnzZcX1tE",reps:"15",each:true,eq:["band","mat"]}]},
   {title:"Part 1 · Full Body Strength",kind:"main",rounds:3,restRound:90,items:[
     {n:"DB Clean and Press",v:"8kM8DzVqu6U",reps:"12",load:true,eq:["db"]},
     {n:"(DB) Skiers",v:"1G169Dygg0M",reps:"15",note:"6–8 kg DB",load:true,eq:["db"]},
     {n:"Baby Crawl Rows",v:"av851jUMNWQ",reps:"12",load:true,eq:["db","mat"]},
     w(I.dbChestPress,{reps:"12",note:"5–7 kg each"}),
     {n:"1 Tricep Pushup + 1 T Rotation",v:"LHXtnmhRV0I",reps:"12",eq:["mat"]}]},
   {title:"Core Superset — The Challenge",kind:"superset",rounds:3,restRound:60,note:"Back-to-back. No rest between A and B. Rest 60 sec after both.",items:[
     {n:"Superman Plank Lifts",v:"PJEmkbPzPk0",reps:"12",eq:["mat"]},
     w(I.plankWalkouts,{secs:40})]},
   {title:"Conditioning Finisher · Cardio — Low Impact",kind:"finisher",rounds:4,restRound:60,note:"Brisk march, then straight into circuit, 60 sec rest between rounds",items:[
     {n:"Brisk March",v:null,secs:60,eq:[]},
     {n:"250 m Treadmill Fast Walk / Incline Walk",v:null,reps:"250 m",eq:["tread"]},
     w(I.kickSits,{reps:"20"}),
     {n:"Wall Squat Marches",v:"Za5DI3QHOmQ",reps:"12",eq:["wall"]},
     w(I.crossMC,{secs:40})]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[{n:"Hip Switch to Kneeling Glute Squeeze",v:"TcYonTu5mkw",secs:60,eq:["mat"]}, w(I.cooldown,{secs:240})]}
  ]},
w3_walk:{
  id:"w3_walk", title:"Steady Walk / Yoga — 30–40 min", short:"Steady Walk", kind:"cardio", tag:"Tue / Thu",
  intro:["30–40 mins continuous brisk-for-you walk or bike — indoors or out, in your supportive trainers. Zone 2, Tuesday and Thursday. Conversational pace. Same effort the whole way. This is the steady-state endurance block.","Alternative: split 2 × 20 mins on chaotic days — one with the stroller counts — or swap Thursday for a yoga / Pilates flow. We're building the engine for Month 2."],
  sections:[
   {title:"Walk · 35 min steady",kind:"cardio",rounds:1,items:[{n:"Steady Walk / Bike",v:null,secs:2100,note:"Zone 2 — conversational, same effort throughout",eq:["tread","trainers"]}]},
   {title:"Stretching After Cardio",kind:"stretch",rounds:1,items:[...STRETCH8,
     {n:"Gentle Lat Stretch",v:"VviHuZuNqpk",secs:30,eq:["mat"]},{n:"Pec Release",v:"SV7l1sfEmO0",secs:30,eq:["wall"]}]}
  ]},
w3_ladder:{
  id:"w3_ladder", title:"Core & Glute Ladder (Optional Bonus)", short:"Core Ladder", kind:"strength", tag:"Optional · bodyweight", optional:true,
  intro:["Bodyweight only — progress with slower tempo and extra reps from Weeks 1–2. Rest up to 2 min between sections — take more if you need it.","If any move pinches, a muscle complains, or it feels 2 gears too hard, swap it for a march or a glute bridge — and tell Zoe."],
  sections:[
   {title:"Warmup",kind:"warmup",rounds:1,items:[I.warmupFlow2]},
   {title:"Part 1 · Ladder AMRAP 10 min",kind:"ladder",cap:600,rounds:1,infoVideo:"9ksoJD31e_E",note:"Start with 2 reps each and add 1 rep every round: 2+2, 3+3, 4+4… as many rounds as possible in 10 minutes (15 min hard cap). Smooth and controlled — the ladder is the challenge, not speed.",items:[
     {n:"Sumo Squats",v:"cOy95DSXZ2M",reps:"ladder",eq:["mat"]}, {n:"Incline Push-Ups",v:"IHM8x9cPsLk",reps:"ladder",eq:["chair"]}]},
   {title:"Part 2 · AMRAP 10 min",kind:"amrap",cap:600,rounds:1,items:[
     {n:"No-Jump Burpee",v:"we5OJ7-zb48",reps:"6",note:"Step back, step in",eq:["mat"]},
     {n:"BW Plank Wrist Elbow Shoulder Taps",v:"VnmJ3yk35dE",reps:"10",eq:["mat"]},
     {n:"DBs Posterior Chain Work 1",v:"NZ1ZwKtj2qI",reps:"10",load:true,eq:["db","mat"]}]},
   {title:"Cooldown",kind:"cooldown",rounds:1,items:[I.cooldown]}
  ]},
w3_rest:{
  id:"w3_rest", title:"Rest Day", short:"Rest", kind:"rest", tag:"Day 7 · Sun",
  intro:["YAY!! W3 & W4 go deeper. Your body repairs and gets stronger today."],
  restList:[["Steps","An easy walk is optional — a slow evening stroll with the family counts. Don't force it."],["Sleep","Aim a steady 7 hours tonight. Strength gains happen in deep sleep."],["Protein","Protein at each meal — a palm each time, ~105 g. Recovery is built from protein."],["Hydration","Keep sipping water — a steady 2.5 L through the day."],["Mobility","The daily mobility flow (10 min) if you fancy it — gentle and unhurried."],["Mental","End-of-week check-in to Zoe: how training felt, energy, sleep, motivation, and your wins."]],
  quote:"Rest is where the work sets in — muscle repairs, the core calms, energy rebuilds. Enjoy it fully; you've earned it.",
  sections:[]
}
};

const PROGRAM = {
  brand:"Stronger with Zoe", coach:"Zoe", client:"Aneri Sanghavi", month:1,
  daily:"mobility",
  blocks:[
    {id:"b1",name:"Weeks 1–2 · Master the form",start:"2026-09-14",end:"2026-09-27",weeks:[1,2],
     subtitle:"DB + Band Home Strength · Fat Loss + Strength · At Home + Treadmill / Bike",
     goal:"Weeks 1–2 master the form · 3 strength days + cardio + yoga + walking. Repeat Week 1 with slower tempo + 2 extra reps in Week 2 — own the form before you add anything.",
     schedule:{1:"w1_A",2:"w1_walk",3:"w1_B",4:"w1_yoga",5:"w1_C",6:"w1_cardio",0:"w1_rest"},optional:[]},
    {id:"b2",name:"Weeks 3–4 · The Build Block",start:"2026-09-28",end:"2026-10-11",weeks:[3,4],
     subtitle:"More reps, slower tempo + your first intervals",
     goal:"Add reps to the indicators · sharpen technique · keep recovery high. Rest 60–90 sec between working sets · Intervals arrive Friday — short, low-impact, earned.",
     schedule:{1:"w3_A",2:"w3_walk",3:"w3_B",4:"w3_walk",5:"w3_int",6:"w3_C",0:"w3_rest"},optional:["w3_ladder"]}
  ],
  rules:{
    training:["LOG EVERY WORKING SET: reps × tempo × RPE (1–10 effort).","Hydrate well before lifting — keep a water bottle handy.","FORM RULE — every movement stays in a comfortable, pain-free range · control before load.","PROGRESSION RULE — add reps or slow the tempo only when a set feels easy at the top of the range.","INDICATOR MOVES: DBs Glute Bridge · DB Romanian Deadlift · Wall Sit — track every week.","If form breaks: reduce reps or rest longer. Form > reps. Always.","Any sharp pain, dizziness, doming or pelvic-floor pressure: stop, sit, sip water — message Zoe.","WARM-UP RULE: do the activation + daily mobility first. Spine NEUTRAL, core BRACED, exhale on effort — no doming."],
    form:["Brace your deep core before every rep","Neutral spine — ribs down, core on","Exhale on effort — no ab doming","Full range, controlled tempo","Warm up + mobility flow first","Add reps only when form is clean","Quality over quantity, every time"],
    recovery:["Sleep 7 h — lights out by 10:30","Protein at every meal — ~105 g","Water 2.5 L · 10 min sunlight daily","Walk on your non-lifting days","Supportive trainers on the treadmill","Pre-decide the 9 PM haldi milk — no drift","Any pinch or sharp pain → stop & reset"],
    session:"Run the mobility flow first, then brace, breathe and move well. We build strength on clean reps and real recovery — that is the whole game, and it compounds over the month.",
    remember:"You are not starting from zero — you have trained before, and it shows in your legs and arms. Your form matters here: the odd muscular ache means every rep stays in a pain-free range — warm up longer, shorten before you push — and the post-baby core means exhale, gentle pelvic-floor lift, then move, on every rep. Weeks 1–2 are clean form only; intervals arrive in Week 3. Sleep is your lever: on a five-hour night, judge a session by whether you did it, not by how strong it felt — cut the volume, walk instead, tell Zoe.",
    footnotes:["Control is the load — own the tempo & reps before adding weight.","Rest up to 90 sec between circuits.","Do NOT skip Warmup or Cooldown.","(Total) counts = both sides.","Exhale before effort. Ribs down. No ab doming — stop if you feel core pressure.","SUPERSET = both exercises back-to-back, no rest between them."],
    quotes:[{q:"We are not over-fat, we are under-muscled.",by:"Dr Gabrielle Lyon"},{q:"If you can build a muscle, you can build a mindset.",by:"Jay Shetty"}],
    reminder:{q:"How do I keep going when it gets hard?",a:"YOU DON'T. YOU RUN THE SYSTEM INSTEAD. Time, stress and a house that eats one way derail you — so we stopped depending on motivation and perfect weeks. Three strength days build the engine, the walks and intervals build stamina, the core and pelvic-floor work protect your back, and a guarded 7 hours of sleep does the repair. On a five-hour night: kit on, ten minutes, permission to stop. You almost never will. You don't earn strength in the set. You earn it in the prep — the warm-up you didn't skip, the sleep you protected, the protein you hit, the walk you took. The set is just where it shows up."},
    tips:["Repeat Week 1 with slower tempo + 2 extra reps in Week 2 — own the form before you add anything. A heavy-feeling session is a short night, not weakness. Four lunchtimes you keep beat seven you dread.","Weeks 1–2 master the form. Weeks 3–4 add reps, tempo & your first intervals. Yours is a rebuild, not a rescue — we wake the core, add muscle and the shape follows, well before 25 December. — Z"]
  }
};
