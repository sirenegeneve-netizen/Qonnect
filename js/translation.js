/* Traduction des référentiels importés (anglais → français) avec le modèle local (WebLLM) : rien ne quitte le navigateur.
   Le texte d'origine est conservé (exigence.original) et l'on peut basculer entre traduction et original. */

const TRANSLATION_SCHEMA = { type:"object", properties:{ translations:{ type:"array", items:{ type:"string" } } }, required:["translations"] };
const TRANSLATION_SYSTEM_PROMPT = "Tu es un traducteur professionnel spécialisé en management de la qualité, sécurité des patients et référentiels normatifs (ISO, HAS, H+, ANQ). Tu traduis de l'anglais vers le français, avec le vocabulaire consacré du domaine (système de management de la qualité, non-conformité, action corrective, revue de direction, partie intéressée, preuve, enregistrement…). Tu conserves exactement les codes, numéros, sigles et références (ISO 9001, GOV-1.1, 4.1, SGQ…). Glossaire : risk appetite = appétence pour le risque ; risk tolerance = tolérance au risque ; stakeholders = parties prenantes ; outcome = résultat ; supply chain = chaîne d'approvisionnement ; third parties = tiers ; asset = actif ; incident = incident ; threat = menace ; vulnerability = vulnérabilité. Tu écris exclusivement en français, en alphabet latin : jamais de chinois, de japonais, de russe ni d'aucune autre langue ou écriture. Tu n'ajoutes rien, tu n'expliques rien, tu ne résumes pas. Tu réponds uniquement en JSON : {\"translations\":[…]} avec exactement une traduction par texte reçu, dans le même ordre.";

/* Estimation grossière : le texte est-il plutôt en anglais ? (mots outils anglais vs français) */
function looksEnglish(text){
  const words = String(text||"").toLowerCase().slice(0,20000).match(/[a-zàâçéèêëîïôûùüÿœ']+/g) || [];
  if(words.length<30) return false;
  const en = new Set(["the","of","and","to","is","are","shall","should","must","be","that","with","for","by","in","on","as","this","which","from","or","an","has","have","been","their","it"]);
  const fr = new Set(["le","la","les","de","des","du","et","est","sont","doit","doivent","que","qui","pour","par","dans","sur","avec","une","un","au","aux","ce","cette","son","ses","leur","en"]);
  let e=0, f=0; words.forEach(w=>{ if(en.has(w)) e++; else if(fr.has(w)) f++; });
  return e > f*1.5;
}

/* Champs traduisibles d'une exigence, dans un ordre fixe : [{ get, set }] */
function translatableFields(e){
  const f = [];
  f.push({ get:()=>e.title, set:v=>{ e.title = v; } });
  f.push({ get:()=>e.description, set:v=>{ e.description = v; } });
  (e.attendus||[]).forEach(a=> f.push({ get:()=>a.label, set:v=>{ a.label = v; }, attendu:a }));
  if(e.chapter && typeof e.chapter==="object" && e.chapter.title) f.push({ get:()=>e.chapter.title, set:v=>{ e.chapter = Object.assign({}, e.chapter, { title:v }); } });
  if(e.chapterTitle) f.push({ get:()=>e.chapterTitle, set:v=>{ e.chapterTitle = v; } });
  if(e.objectif && e.objectif.title) f.push({ get:()=>e.objectif.title, set:v=>{ e.objectif = Object.assign({}, e.objectif, { title:v }); } });
  return f.filter(x=>x.get());
}

/* Une traduction est refusée si elle contient une autre écriture que le latin (les petits modèles dérivent parfois vers le chinois),
   si elle est vide ou si sa longueur est incohérente avec la source. */
const TRANSLATION_FOREIGN_SCRIPT_RE = /[\u0370-\u03ff\u0400-\u052f\u0590-\u06ff\u0900-\u0dff\u0e00-\u0eff\u1100-\u11ff\u3000-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;
function isValidTranslation(src, fr){
  if(typeof fr!=="string" || !fr.trim()) return false;
  if(TRANSLATION_FOREIGN_SCRIPT_RE.test(fr) && !TRANSLATION_FOREIGN_SCRIPT_RE.test(src)) return false;
  const r = fr.trim().length / Math.max(1, src.trim().length);
  return r>=0.35 && r<=3.5;
}

/* Traduit une liste de textes par lots. Renvoie un tableau de même longueur (null si un texte n'a pas pu être traduit). */
async function translateTexts(texts, onProgress){
  const engine = await ensureLocalLlm(onProgress);
  const out = new Array(texts.length).fill(null);
  const batches = []; let cur = [], size = 0;
  texts.forEach((t,i)=>{ if(cur.length && (cur.length>=6 || size+t.length>1800)){ batches.push(cur); cur = []; size = 0; } cur.push(i); size += t.length; });
  if(cur.length) batches.push(cur);
  async function ask(idx, strict){
    const reply = await engine.chat.completions.create({
      messages:[ { role:"system", content:TRANSLATION_SYSTEM_PROMPT }, { role:"user", content:"Traduis ces "+idx.length+" textes en français"+(strict?" — IMPORTANT : écris uniquement en français avec l'alphabet latin, sans aucun caractère chinois ou autre écriture":"")+" :\n"+JSON.stringify(idx.map(i=>texts[i])) } ],
      temperature:strict?0.3:0, max_tokens:1800,
      response_format:{ type:"json_object", schema:JSON.stringify(TRANSLATION_SCHEMA) },
    });
    const choice = reply && reply.choices && reply.choices[0];
    if(!choice || choice.finish_reason==="length") return null;
    try{ const p = parseLlmJson(choice.message && choice.message.content); return Array.isArray(p.translations) && p.translations.length===idx.length && p.translations.every((x,k)=>isValidTranslation(texts[idx[k]], x)) ? p.translations.map(x=>x.trim()) : null; }catch(err){ return null; }
  }
  let done = 0;
  for(const idx of batches){
    if(onProgress) onProgress({ status:"translating", progress:done/texts.length, text:"Traduction… "+done+" / "+texts.length });
    let res = await ask(idx);
    if(!res){ /* lot refusé : on retente texte par texte */
      res = [];
      for(const i of idx){
        let r = await ask([i]);
        if(!r) r = await ask([i], true);   /* 2e essai, consigne renforcée */
        res.push(r ? r[0] : null);
      }
    }
    if(res) idx.forEach((i,k)=>{ out[i] = res[k]; });
    done += idx.length;
  }
  if(onProgress) onProgress({ status:"translating", progress:1, text:"Traduction terminée." });
  return out;
}

/* Traduit en place les exigences (titre, texte, attendus, chapitre, objectif). Conserve l'original dans e.original.
   Renvoie { translated, failed }. */
async function translateExigences(exigences, onProgress){
  const jobs = []; /* { e, field, text } */
  exigences.forEach(e=>{
    if(e.original) return;
    translatableFields(e).forEach(field=> jobs.push({ e, field, text:field.get() }));
  });
  const unique = [...new Set(jobs.map(j=>j.text))];
  const tr = await translateTexts(unique, onProgress);
  const map = new Map(unique.map((t,i)=>[t,tr[i]]));
  let failed = 0;
  const touched = new Set();
  jobs.forEach(j=>{
    const fr = map.get(j.text);
    if(!fr){ failed++; return; }
    if(!j.e.original){ j.e.original = { fields:[], kw:[] }; }
    j.e.original.fields.push({ text:j.text, fr });
    j.field.set(fr);
    if(j.field.attendu){
      const a = j.field.attendu; const orig = a.keywords||[];
      j.e.original.kw.push({ id:a.id, keywords:orig.slice() });
      a.keywords = [...new Set([...keywordStems(fr), ...orig])];
    }
    touched.add(j.e);
  });
  touched.forEach(e=>{ e.lang = "fr"; e.sourceLang = "en"; });
  return { translated:touched.size, failed };
}

/* Bascule l'affichage entre la traduction et le texte d'origine ("fr" | "original"). */
function setExigencesLanguage(exigences, lang){
  exigences.forEach(e=>{
    if(!e.original) return;
    const fields = translatableFields(e); /* même ordre qu'à la traduction (les champs non traduits sont ignorés) */
    const byText = new Map(); e.original.fields.forEach(x=>{ byText.set(e.lang==="fr"?x.fr:x.text, x); });
    fields.forEach(f=>{ const x = byText.get(f.get()); if(x) f.set(lang==="fr" ? x.fr : x.text); });
    (e.attendus||[]).forEach(a=>{
      const k = e.original.kw.find(x=>x.id===a.id); if(!k) return;
      a.keywords = lang==="fr" ? [...new Set([...keywordStems(a.label), ...k.keywords])] : k.keywords.slice();
    });
    e.lang = lang;
  });
}
