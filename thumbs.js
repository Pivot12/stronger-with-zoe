/* Generative SVG thumbnails — one distinct motif per workout family so a repeated
   workout is recognisable at a glance. Heavier (W3–4) versions keep the motif, deepen
   the palette and add a "+" seal. Pure SVG, no external assets. */
const THUMBS = (() => {
  const PAL = {
    lower:   ["#FF6B9A","#FFB199","#7A1B4E"],   // coral–pink sunrise
    upper:   ["#20A4A0","#7FE0D2","#0B4F52"],   // teal wings
    full:    ["#7B5CFF","#C9B8FF","#2B1A6B"],   // violet burst
    walk:    ["#5BB85D","#C6EFA5","#1F5C2A"],   // green path
    yoga:    ["#B48CFF","#F1E3FF","#4A2E8A"],   // lavender lotus
    cardio:  ["#FF8A3D","#FFD2A8","#8A2E00"],   // orange pulse
    rest:    ["#2D3A8C","#8FA4FF","#0D1240"],   // night sky
    mobility:["#F5B400","#FFE79A","#7A4B00"],   // amber sun
    intervals:["#E8264A","#FFB3C0","#6E0A1F"],  // red bolt
    ladder:  ["#E0B000","#FFF0A8","#6B4A00"],   // gold ladder
  };
  const FAMILY = {w1_A:"lower",w3_A:"lower",w1_B:"upper",w3_B:"upper",w1_C:"full",w3_C:"full",
    w1_walk:"walk",w3_walk:"walk",w1_yoga:"yoga",w1_cardio:"cardio",w1_rest:"rest",w3_rest:"rest",
    mobility:"mobility",w3_int:"intervals",w3_ladder:"ladder"};

  const motifs = {
    lower: (c)=>`<path d="M0 78 Q30 40 60 62 T120 58 V120 H0Z" fill="${c[2]}" opacity=".35"/>
      <path d="M8 96 Q60 8 112 96" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
      <circle cx="60" cy="30" r="9" fill="#fff"/>`,
    upper: (c)=>`<g fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 72 L60 42 L102 72"/><path d="M28 96 L60 70 L92 96" opacity=".7"/><path d="M40 48 L60 34 L80 48" opacity=".45"/></g>`,
    full: (c)=>`<g fill="#fff"><path d="M60 14 L74 46 L106 60 L74 74 L60 106 L46 74 L14 60 L46 46Z"/>
      <circle cx="60" cy="60" r="11" fill="${c[0]}"/></g>`,
    walk: (c)=>`<path d="M14 100 C 40 60, 60 110, 84 68 S 118 40, 112 22" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 18"/>
      <circle cx="14" cy="100" r="8" fill="#fff"/><circle cx="112" cy="22" r="10" fill="${c[2]}" stroke="#fff" stroke-width="4"/>`,
    yoga: (c)=>`<g fill="#fff" opacity=".95"><path d="M60 26 C72 44 72 70 60 92 C48 70 48 44 60 26Z"/>
      <path d="M60 92 C40 90 26 78 22 60 C40 64 52 76 60 92Z" opacity=".75"/><path d="M60 92 C80 90 94 78 98 60 C80 64 68 76 60 92Z" opacity=".75"/></g>`,
    cardio:(c)=>`<path d="M8 66 H34 L44 40 L58 92 L70 52 L78 66 H112" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
    rest:  (c)=>`<path d="M78 24 A34 34 0 1 0 96 84 A28 28 0 0 1 78 24Z" fill="#fff"/>
      <g fill="#fff"><circle cx="30" cy="34" r="3"/><circle cx="44" cy="22" r="2"/><circle cx="26" cy="66" r="2.5"/></g>`,
    mobility:(c)=>`<circle cx="60" cy="62" r="20" fill="#fff"/><g stroke="#fff" stroke-width="7" stroke-linecap="round">
      <path d="M60 18 V28"/><path d="M60 96 V106"/><path d="M16 62 H26"/><path d="M94 62 H104"/><path d="M29 31 L36 38"/><path d="M84 86 L91 93"/><path d="M91 31 L84 38"/><path d="M36 86 L29 93"/></g>`,
    intervals:(c)=>`<path d="M66 12 L30 66 H58 L50 108 L92 50 H64Z" fill="#fff"/>`,
    ladder:(c)=>`<g stroke="#fff" stroke-width="8" stroke-linecap="round"><path d="M36 108 V14"/><path d="M84 108 V14"/>
      <path d="M36 32 H84"/><path d="M36 56 H84"/><path d="M36 80 H84"/></g>`,
  };
  function svg(id, size=120){
    const fam = FAMILY[id] || "full"; const c = PAL[fam];
    const W = WORKOUTS[id]; const heavy = W && W.heavier;
    const g = heavy ? `${c[2]}` : c[1];
    return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${(W&&W.short)||id}">
      <defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${g}"/></linearGradient></defs>
      <rect width="120" height="120" rx="26" fill="url(#g${id})"/>
      ${motifs[fam](c)}
      ${heavy?`<circle cx="98" cy="22" r="14" fill="#fff"/><text x="98" y="28" text-anchor="middle" font-size="19" font-weight="800" fill="${c[2]}" font-family="Montserrat,system-ui">+</text>`:""}
    </svg>`;
  }
  function art(id,size=200){ const fam=FAMILY[id]||"full"; const c=PAL[fam]; return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">${motifs[fam](c)}</svg>`; }
  return { svg, art, color:(id)=>PAL[FAMILY[id]||"full"][0], dark:(id)=>PAL[FAMILY[id]||"full"][2], family:(id)=>FAMILY[id]||"full" };
})();
