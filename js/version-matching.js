/* ============================================================
   RAPPROCHEMENT DES EXIGENCES ENTRE DEUX VERSIONS D'UN RÉFÉRENTIEL
   Fonctions pures : aucun accès à DB, au DOM ni au stockage.
   Principe : la similarité textuelle n'est qu'un INDICE. Elle ne décide seule que dans les cas sans ambiguïté ;
   tout cas douteux (déplacement + modification, scission, fusion, code réutilisé) reste « à confirmer » ou « à résoudre ».
   Les seuils ci-dessous sont EXPÉRIMENTAUX : à évaluer et ajuster sur des référentiels réels.
   ============================================================ */

const VERSION_MATCH_THRESHOLDS = {
  auto: 0.8,      /* même code, texte modifié : rapprochement automatique à partir de cette similarité */
  confirm: 0.5,   /* entre confirm et auto : proposé, à confirmer par l'utilisateur ; en dessous : ambigu */
  moved: 0.75,    /* code changé ET texte modifié : proposé à confirmer, jamais automatique */
  margin: 0.1,    /* écart minimal avec le 2e meilleur candidat, des deux côtés */
  contain: 0.7,   /* scission / fusion : part des mots d'un fragment retrouvée dans l'exigence d'origine */
  coverage: 0.6,  /* scission / fusion : part de l'exigence d'origine couverte par l'ensemble des fragments */
  minFragmentWords: 4,
};

function vmNorm(t){ return String(t==null?"":t).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
function vmTokens(t){ return vmNorm(t).split(" ").filter(w=>w.length>1); }
function vmTrigrams(t){ const s = " "+vmNorm(t)+" "; const out = new Set(); for(let i=0;i<s.length-2;i++) out.add(s.slice(i,i+3)); return out; }
function vmDice(a, b){ if(!a.size || !b.size) return 0; let n = 0; a.forEach(x=>{ if(b.has(x)) n++; }); return 2*n/(a.size+b.size); }
/* Empreinte du texte normalisé (FNV-1a 32 bits) : un INDICE de changement de contenu, jamais un identifiant. */
function vmHash(t){ const s = vmNorm(t); let h = 0x811c9dc5; for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8,"0"); }
/* Similarité textuelle 0..1 (moyenne de la similarité de mots et de trigrammes). */
function vmSimilarity(a, b){
  const na = vmNorm(a), nb = vmNorm(b);
  if(!na || !nb) return 0;
  if(na===nb) return 1;
  return (vmDice(new Set(vmTokens(a)), new Set(vmTokens(b))) + vmDice(vmTrigrams(a), vmTrigrams(b))) / 2;
}
/* Part des mots de `part` présents dans `whole`. */
function vmContainment(part, whole){
  const p = new Set(vmTokens(part)), w = new Set(vmTokens(whole));
  if(!p.size) return 0; let n = 0; p.forEach(x=>{ if(w.has(x)) n++; }); return n/p.size;
}

/* oldItems : [{ id, ref, text, retired? }]   newItems : [{ ref, text }] (l'index fait office d'identifiant)
   Retour : { pairs:[{ oldId, newIndex, method, score, confidence:"certain"|"to_confirm", refChanged, textChanged }],
              retired:[oldId], added:[newIndex],
              pending:[{ kind:"ambigu"|"scission"|"fusion", oldIds:[], newIndexes:[], reason }],
              stats:{ certain, toConfirm, retired, added, pending } } */
function matchExigenceVersions(oldItems, newItems, thresholds){
  const T = Object.assign({}, VERSION_MATCH_THRESHOLDS, thresholds||{});
  const oldList = oldItems.map(o=>({ id:o.id, ref:vmNorm(o.ref), text:o.text||"", norm:vmNorm(o.text), retired:!!o.retired }));
  const newList = newItems.map((n,i)=>({ i, ref:vmNorm(n.ref), text:n.text||"", norm:vmNorm(n.text) }));
  let oRem = oldList.slice(), nRem = newList.slice();
  const pairs = [], pending = [];
  const take = (o, n, extra)=>{
    oRem = oRem.filter(x=>x!==o); nRem = nRem.filter(x=>x!==n);
    pairs.push(Object.assign({ oldId:o.id, newIndex:n.i, refChanged:o.ref!==n.ref, textChanged:o.norm!==n.norm }, extra));
  };
  /* Les exigences actives passent avant les exigences retirées (une exigence retirée peut réapparaître). */
  const activeFirst = (a,b)=> (a.retired?1:0)-(b.retired?1:0);

  /* 1) Texte identique : même code → certain ; code différent → certain seulement si unique des deux côtés. */
  const byText = new Map();
  oRem.forEach(o=>{ if(o.norm){ if(!byText.has(o.norm)) byText.set(o.norm,{o:[],n:[]}); byText.get(o.norm).o.push(o); } });
  nRem.forEach(n=>{ if(n.norm && byText.has(n.norm)) byText.get(n.norm).n.push(n); });
  byText.forEach(g=>{
    g.o.sort(activeFirst);
    const os = g.o.slice(), ns = g.n.slice();
    os.slice().forEach(o=>{ const n = ns.find(x=>x.ref===o.ref); if(n){ ns.splice(ns.indexOf(n),1); os.splice(os.indexOf(o),1); take(o,n,{ method:"code+texte", score:1, confidence:"certain" }); } });
    if(os.length===1 && ns.length===1) take(os[0], ns[0], { method:"texte_identique", score:1, confidence:"certain" });
  });

  /* 2) Même code : on apparie par similarité, en exigeant un écart net avec le 2e candidat. */
  const refs = [...new Set(oRem.map(o=>o.ref))];
  refs.forEach(ref=>{
    let os = oRem.filter(o=>o.ref===ref), ns = nRem.filter(n=>n.ref===ref);
    if(!ref || !os.length || !ns.length) return;
    if(os.length===1 && ns.length===1){
      const s = vmSimilarity(os[0].text, ns[0].text);
      if(s>=T.auto) take(os[0], ns[0], { method:"code+texte_modifie", score:s, confidence:"certain" });
      else if(s>=T.confirm) take(os[0], ns[0], { method:"code+texte_modifie", score:s, confidence:"to_confirm" });
      else { pending.push({ kind:"ambigu", oldIds:[os[0].id], newIndexes:[ns[0].i], reason:"Même code, mais textes très différents : code réutilisé ou exigence remplacée ?", score:s }); oRem = oRem.filter(x=>x!==os[0]); nRem = nRem.filter(x=>x!==ns[0]); }
      return;
    }
    const scores = []; os.forEach(o=> ns.forEach(n=> scores.push({ o, n, s:vmSimilarity(o.text,n.text) })));
    scores.sort((a,b)=>b.s-a.s);
    const used = new Set();
    scores.forEach(c=>{
      if(used.has(c.o)||used.has(c.n)||c.s<T.confirm) return;
      const rivalO = Math.max(0, ...scores.filter(x=>x.o===c.o && x.n!==c.n && !used.has(x.n)).map(x=>x.s));
      const rivalN = Math.max(0, ...scores.filter(x=>x.n===c.n && x.o!==c.o && !used.has(x.o)).map(x=>x.s));
      const clear = c.s - Math.max(rivalO, rivalN) >= T.margin;
      used.add(c.o); used.add(c.n);
      take(c.o, c.n, { method:"code+texte_modifie", score:c.s, confidence: (c.s>=T.auto && clear) ? "certain" : "to_confirm" });
    });
  });

  /* 3) Code changé ET texte modifié : meilleur candidat réciproque, jamais automatique. */
  const cands = [];
  oRem.forEach(o=> nRem.forEach(n=>{ const s = vmSimilarity(o.text,n.text); if(s>=T.moved) cands.push({ o, n, s }); }));
  cands.sort((a,b)=>b.s-a.s);
  cands.forEach(c=>{
    if(!oRem.includes(c.o) || !nRem.includes(c.n)) return;
    const rivalO = Math.max(0, ...nRem.filter(n=>n!==c.n).map(n=>vmSimilarity(c.o.text,n.text)));
    const rivalN = Math.max(0, ...oRem.filter(o=>o!==c.o).map(o=>vmSimilarity(o.text,c.n.text)));
    if(c.s - Math.max(rivalO, rivalN) >= T.margin) take(c.o, c.n, { method:"texte_similaire_code_change", score:c.s, confidence:"to_confirm" });
  });

  /* 4) Scission (1 → N) et fusion (N → 1) : toujours à résoudre manuellement.
     Les appariements « à confirmer » sont d'abord relâchés : un fragment qui porte le même code que l'exigence d'origine
     serait sinon pris pour cette exigence modifiée. Les appariements certains ne sont jamais remis en cause. */
  const released = pairs.filter(p=>p.confidence==="to_confirm");
  released.forEach(pr=>{ pairs.splice(pairs.indexOf(pr),1); oRem.push(oldList.find(x=>x.id===pr.oldId)); nRem.push(newList[pr.newIndex]); });
  const words = t => vmTokens(t).length;
  const covered = (parts, whole)=>{ const w = new Set(vmTokens(whole)); if(!w.size) return 0; const hit = new Set(); parts.forEach(p=>vmTokens(p).forEach(x=>{ if(w.has(x)) hit.add(x); })); return hit.size/w.size; };
  oRem.slice().forEach(o=>{
    const frags = nRem.filter(n=> words(n.text)>=T.minFragmentWords && vmContainment(n.text, o.text)>=T.contain);
    if(frags.length>=2 && covered(frags.map(f=>f.text), o.text)>=T.coverage){
      pending.push({ kind:"scission", oldIds:[o.id], newIndexes:frags.map(f=>f.i), reason:"Une exigence semble avoir été scindée en plusieurs." });
      oRem = oRem.filter(x=>x!==o); frags.forEach(f=>{ nRem = nRem.filter(x=>x!==f); });
    }
  });
  nRem.slice().forEach(n=>{
    const olds = oRem.filter(o=> words(o.text)>=T.minFragmentWords && vmContainment(o.text, n.text)>=T.contain);
    if(olds.length>=2 && covered(olds.map(o=>o.text), n.text)>=T.coverage){
      pending.push({ kind:"fusion", oldIds:olds.map(o=>o.id), newIndexes:[n.i], reason:"Plusieurs exigences semblent avoir été fusionnées en une seule." });
      nRem = nRem.filter(x=>x!==n); olds.forEach(o=>{ oRem = oRem.filter(x=>x!==o); });
    }
  });
  released.forEach(pr=>{
    const o = oRem.find(x=>x.id===pr.oldId), n = nRem.find(x=>x.i===pr.newIndex);
    if(o && n){ oRem = oRem.filter(x=>x!==o); nRem = nRem.filter(x=>x!==n); pairs.push(pr); }
  });

  /* 5) Le reste : retirées (jamais supprimées) et ajoutées. Une exigence déjà retirée reste retirée. */
  const retired = oRem.filter(o=>!o.retired).map(o=>o.id);
  const added = nRem.map(n=>n.i);
  return { pairs, retired, added, pending,
    stats:{ certain:pairs.filter(p=>p.confidence==="certain").length, toConfirm:pairs.filter(p=>p.confidence==="to_confirm").length, retired:retired.length, added:added.length, pending:pending.length } };
}
if(typeof module!=="undefined" && module.exports) module.exports = { matchExigenceVersions, vmSimilarity, vmHash, vmNorm, VERSION_MATCH_THRESHOLDS };
