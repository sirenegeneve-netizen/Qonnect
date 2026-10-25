/* ============================================================
   SUGGESTION DE CORRESPONDANCES PAR RÈGLES (étape 4) — fonctions pures : aucun accès à DB, au DOM ni au stockage.
   Principe : le moteur PROPOSE, il ne décide jamais. Ses résultats deviennent des correspondances « à valider » ; seule une personne les valide.
   Signaux combinés (aucun n'est une preuve d'équivalence, et un code identique seul ne suffit jamais) :
     - mots-clés communs, pondérés par leur rareté dans les deux référentiels (un mot présent partout compte peu) ;
     - similarité du texte ;
     - code identique (utile entre normes à structure commune) ;
     - intitulés de chapitre proches.
   Les seuils et poids ci-dessous sont EXPÉRIMENTAUX : à ajuster sur des référentiels réels.
   Dépend de version-matching.js (vmNorm, vmSimilarity).
   ============================================================ */

const MAPPING_SUGGEST_LEVELS = {
  prudent:  { label:"Prudent",  min:0.40 },
  standard: { label:"Standard", min:0.30 },
  large:    { label:"Large",    min:0.22 },
};
const MAPPING_SUGGEST_WEIGHTS = { keywords:0.45, text:0.35, code:0.12, chapter:0.08 };
const MAPPING_SUGGEST_OPTS = { perSource:3, maxCandidates:15, minContent:0.15, stemLen:6, margin:0.05 };

/* Racines de mots passe-partout des textes normatifs (« méthodes et techniques appropriées… ») : elles se retrouvent dans des exigences sans rapport.
   Elles comptent encore, mais bien moins : deux exigences ne se ressemblent pas parce qu'elles disent « approprié » ou « utiliser ». (EXPÉRIMENTAL) */
const MS_GENERIC = new Set(["method","techni","approp","compri","adequa","necess"]);
const MS_GENERIC_FACTOR = 0.35;
const MS_STOP = new Set(("dans pour avec sans leur leurs cette cettes ainsi entre comme selon etre sont elle elles nous vous plus tout tous doit doivent doivent ete etre ayant afin lors ceux celle ces ses aux des les une que qui par sur sous the and for with that this shall must should are have been their which from into such any all other les mise place organisation organisme"+
  " exigence exigences").split(" "));

/* Lexique de synonymes du domaine qualité (EXPÉRIMENTAL, explicite et auditable) : plusieurs racines ramenées à une racine commune
   pour que « direction » et « leadership », ou « achats » et « prestataires externes », se recoupent. */
const MS_SYNONYMS = [
  ["~direction",  ["direction","dirigeant","leadership"]],
  ["~achats",     ["achat","prestataire","fournisseur","soustrait","externe"]],
  ["~documents",  ["document","enregistrement","dossier","manuel"]],
  ["~client",     ["client","reclamation","feedback","satisfaction"]],
  ["~amelioration",["amelior","correctif","corrective","preventi"]],
  ["~risque",     ["risque","opportunit"]],
  ["~competence", ["competence","sensibilis","formation"]],
  ["~mesure",     ["mesure","surveillance","evaluation","analyse"]],
];
function msStems(text){
  const out = new Set();
  vmNorm(text).split(" ").forEach(w=>{
    if(w.length<5 || MS_STOP.has(w)) return;
    const syn = MS_SYNONYMS.find(g=>g[1].some(p=>w.startsWith(p)));      /* mot entier (préfixe) : « prestation » ≠ « prestataire » */
    out.add(syn ? syn[0] : w.slice(0, MAPPING_SUGGEST_OPTS.stemLen));   /* un synonyme est ramené à son concept commun */
  });
  return out;
}
/* Contexte hiérarchique : pour un intitulé « pauvre » (moins de 3 mots distinctifs, ex. « Généralités »), on ajoute le titre du chapitre parent
   déduit du code (4.2.1 → 4.2 → 4) afin de ne pas confondre tous les « Généralités » entre eux. */
function msWithContext(list){
  const byRef = new Map(); list.forEach(x=>{ const k = String(x.ref||"").trim(); if(k && !byRef.has(k)) byRef.set(k, x); });
  return list.map(x=>{
    const own = (x.text||"")+" "+(x.title||"");
    if(msStems(own).size>=3) return own;
    let ctx = "", ref = String(x.ref||"").trim();
    for(let i=0;i<2;i++){
      const parent = ref.replace(/[.\-][^.\-]+$/,"");
      if(!parent || parent===ref) break;
      const p = byRef.get(parent); if(p) ctx = (p.title||p.text||"")+" "+ctx;
      ref = parent;
    }
    return ctx ? ctx+" "+own : own;
  });
}
/* Langue approximative d'un texte : "fr" | "en" | "?" (utilisé pour avertir quand deux référentiels n'ont pas la même langue). */
function msGuessLang(texts){
  const FR = new Set("le la les des du de un une et est sont pour dans par sur avec aux qui que doit doivent être ont au ce cette".split(" "));
  const EN = new Set("the of and to is are be shall for in on with that this by as must should have been which".split(" "));
  let fr = 0, en = 0;
  texts.slice(0,200).forEach(t=> vmNorm(t).split(" ").forEach(w=>{ if(FR.has(w)) fr++; if(EN.has(w)) en++; }));
  if(fr+en<10) return "?";
  return fr>=en*1.5 ? "fr" : en>=fr*1.5 ? "en" : "?";
}

/* source / target : [{ id, ref, text, chapterTitle? }]. Retour trié par score décroissant :
   [{ aId, bId, score, relation, basis:[string], signals:{keywords,text,code,chapter}, mutual, close }] (aId = source, bId = cible). */
function suggestMappings(source, target, level, optsOverride){
  const O = Object.assign({}, MAPPING_SUGGEST_OPTS, optsOverride||{});
  const W = MAPPING_SUGGEST_WEIGHTS;
  const min = (MAPPING_SUGGEST_LEVELS[level]||MAPPING_SUGGEST_LEVELS.standard).min;
  const sEff = msWithContext(source), tEff = msWithContext(target);
  const S = source.map((x,i)=>({ x, eff:sEff[i], stems:msStems(sEff[i]), ref:vmNorm(x.ref) }));
  const T = target.map((x,i)=>({ x, eff:tEff[i], stems:msStems(tEff[i]), ref:vmNorm(x.ref) }));
  /* Rareté des mots : poids idf calculé sur l'ensemble des deux référentiels. */
  const df = new Map(), N = S.length+T.length;
  S.concat(T).forEach(e=> e.stems.forEach(s=> df.set(s,(df.get(s)||0)+1)));
  const idf = s => Math.log(1 + N/(df.get(s)||1)) * (s[0]==="~" ? 1.6 : MS_GENERIC.has(s) ? MS_GENERIC_FACTOR : 1);   /* un concept du lexique qualité pèse plus qu'un mot isolé */
  const mass = e => { let m = 0; e.stems.forEach(s=>{ m += idf(s); }); return m; };
  S.forEach(e=>{ e.mass = mass(e); }); T.forEach(e=>{ e.mass = mass(e); });
  /* Index inversé de la cible : on ne compare qu'à des candidats qui partagent des mots rares. */
  const inv = new Map(), byCode = new Map();
  T.forEach((e,i)=>{ e.stems.forEach(s=>{ if(!inv.has(s)) inv.set(s,[]); inv.get(s).push(i); }); if(e.ref){ if(!byCode.has(e.ref)) byCode.set(e.ref,[]); byCode.get(e.ref).push(i); } });

  const cand = [];   /* { si, ti, score, ... } */
  S.forEach((a, si)=>{
    const acc = new Map();
    a.stems.forEach(s=>{ const l = inv.get(s); if(!l || l.length>Math.max(40, T.length*0.25)) return; const w = idf(s); l.forEach(i=> acc.set(i,(acc.get(i)||0)+w)); });
    (byCode.get(a.ref)||[]).forEach(i=>{ if(!acc.has(i)) acc.set(i,0); });
    const top = [...acc.entries()].sort((p,q)=>q[1]-p[1]).slice(0, O.maxCandidates);
    top.forEach(([ti])=>{
      const b = T[ti];
      let shared = 0; const sharedStems = [];
      a.stems.forEach(s=>{ if(b.stems.has(s)){ shared += idf(s); sharedStems.push(s); } });
      const kw = (a.mass && b.mass) ? shared / Math.sqrt(a.mass*b.mass) : 0;
      const txt = vmSimilarity(a.eff, b.eff);
      if(kw < O.minContent && txt < 0.3) return;            /* le code seul ne suffit jamais */
      const code = (a.ref && a.ref===b.ref) ? 1 : 0;
      const chap = (a.x.chapterTitle && b.x.chapterTitle) ? vmSimilarity(a.x.chapterTitle, b.x.chapterTitle) : 0;
      const score = W.keywords*kw + W.text*txt + W.code*code + W.chapter*chap;
      if(score < min) return;
      cand.push({ si, ti, score, kw, txt, code, chap, sharedStems:sharedStems.sort((p,q)=>idf(q)-idf(p)) });
    });
  });
  /* Les meilleurs candidats de chaque exigence source ; on note si le rapprochement est réciproque et s'il existe un candidat presque aussi bon. */
  const bySrc = new Map(); cand.forEach(c=>{ if(!bySrc.has(c.si)) bySrc.set(c.si,[]); bySrc.get(c.si).push(c); });
  const bestOfTarget = new Map(); cand.forEach(c=>{ const b = bestOfTarget.get(c.ti); if(!b || c.score>b.score) bestOfTarget.set(c.ti,c); });
  const out = [];
  bySrc.forEach(list=>{
    list.sort((p,q)=>q.score-p.score);
    list.slice(0, O.perSource).forEach((c,rank)=>{
      const second = list[rank===0?1:0];
      const mutual = bestOfTarget.get(c.ti)===c && rank===0;
      const close = !!second && (rank===0 ? c.score-second.score < O.margin : false);
      const a = S[c.si].x, b = T[c.ti].x;
      const basis = [];
      if(c.sharedStems.length){ const words = c.sharedStems.slice(0,5); basis.push("Mots-clés communs : "+words.join(", ")); }
      basis.push("Similarité du texte : "+Math.round(c.txt*100)+" %");
      if(c.code) basis.push("Même code : "+a.ref);
      if(c.chap>=0.5) basis.push("Chapitres proches : « "+(a.chapterTitle||"")+" » / « "+(b.chapterTitle||"")+" »");
      if(mutual) basis.push("Meilleur candidat des deux côtés");
      if(close) basis.push("Attention : un autre candidat est presque aussi proche");
      out.push({ aId:a.id, bId:b.id, score:c.score, relation: c.txt>=0.7 ? "equivalente" : "partielle", basis,
        signals:{ keywords:c.kw, text:c.txt, code:c.code, chapter:c.chap }, mutual, close });
    });
  });
  return out.sort((p,q)=>q.score-p.score);
}
if(typeof module!=="undefined" && module.exports) module.exports = { suggestMappings, msGuessLang, msStems, MAPPING_SUGGEST_LEVELS };
