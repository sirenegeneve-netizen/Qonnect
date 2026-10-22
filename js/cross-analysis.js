/* ============================================================
   ANALYSE TRANSVERSALE DES RÉFÉRENTIELS (étape 5) — vue de LECTURE construite sur les correspondances.
   - Elle ne modifie rien : ni correspondances, ni exigences, ni scores de maîtrise, ni audits.
   - Seules les correspondances VALIDÉES, À JOUR (contenu des deux exigences inchangé depuis la validation) comptent comme « couverture croisée ».
     Les correspondances « à revoir » sont signalées à part et ne sont pas comptées ; les suggestions « à valider » et les rejetées non plus.
   - « Sans correspondance validée » ne veut pas dire « non conforme » : la paire n'a simplement pas (encore) été analysée ou reliée.
   ============================================================ */

const CROSS_UI = { from:null, tos:[], filter:"all", level:"standard", openTo:false };   /* tos : référentiels comparés (au moins un) */
const CROSS_FILTERS = { all:"Toutes", validee:"Avec correspondance validée", a_valider:"Suggestion à valider", a_revoir:"Correspondance à revoir", similitude:"Similitude détectée (non enregistrée)", aucune:"Sans correspondance ni similitude" };

/* Calcule toute l'analyse en un passage : O(exigences + correspondances). */
function crossAnalysisData(){
  const refs = mappableReferentiels();
  const exig = {}; const owner = new Map();
  refs.forEach(r=>{ exig[r.id] = listExigencesOfReferentiel(r.id); exig[r.id].forEach(e=>owner.set(e.id, r.id)); });
  const byEx = new Map();
  const add = (id,m)=>{ if(!byEx.has(id)) byEx.set(id,[]); byEx.get(id).push(m); };
  const counts = { validated:0, suggested:0, rejected:0, aRevoir:0, anomalies:0 };
  const live = [];   /* correspondances dont les deux extrémités existent et sont actives */
  (DB.exigenceMappings||[]).forEach(m=>{
    const st = mappingState(m);
    if(st==="retiree" || st==="introuvable"){ counts.anomalies++; return; }
    if(m.status==="rejected"){ counts.rejected++; return; }
    if(m.status==="suggested"){ counts.suggested++; }
    else if(st==="a_revoir"){ counts.aRevoir++; }
    else counts.validated++;
    live.push({ m, st }); add(m.exigenceAId,{ m, st }); add(m.exigenceBId,{ m, st });
  });
  /* Matrice : part des exigences de la ligne ayant au moins une correspondance validée à jour dans la colonne. */
  const matrix = {};
  refs.forEach(R=>{
    matrix[R.id] = {};
    refs.forEach(C=>{
      if(R.id===C.id) return;
      let covered = 0, links = 0;
      exig[R.id].forEach(e=>{
        const ok = (byEx.get(e.id)||[]).filter(x=>x.m.status==="validated" && x.st==="ok" && owner.get(x.m.exigenceAId===e.id?x.m.exigenceBId:x.m.exigenceAId)===C.id);
        if(ok.length){ covered++; links += ok.length; }
      });
      const total = exig[R.id].length;
      matrix[R.id][C.id] = { covered, total, links, pct: total ? Math.round(covered*100/total) : 0 };
    });
  });
  return { refs, exig, owner, byEx, counts, matrix, live };
}

/* Similitudes détectées par les règles (étape 4) pour un référentiel source et un ou plusieurs référentiels comparés, SANS rien enregistrer.
   Retour : Map exigenceSourceId → [{ bId, targetId, score, relation, basis }] (paires déjà traitées exclues). Mis en cache le temps que les données ne changent pas. */
const CROSS_SIM_CACHE = { key:"", value:null };
function crossSimilarities(fromId, toIds, level){
  if(level==="off" || !toIds.length) return new Map();
  const key = [fromId, toIds.join(","), level, (DB.exigenceMappings||[]).length, DB.customExigences.length, DB.customExigences.reduce((n,e)=>n+(e.contentHash||"").length+((e.description||"").length),0)].join("|");
  if(CROSS_SIM_CACHE.key===key) return CROSS_SIM_CACHE.value;
  const out = new Map();
  const mine = listExigencesOfReferentiel(fromId);
  toIds.forEach(tid=>{
    suggestMappings(mine, listExigencesOfReferentiel(tid), level).forEach(c=>{
      if(findMapping(c.aId, c.bId)) return;
      if(!out.has(c.aId)) out.set(c.aId, []);
      out.get(c.aId).push({ bId:c.bId, targetId:tid, score:c.score, relation:c.relation, basis:c.basis });
    });
  });
  out.forEach(l=>l.sort((p,q)=>q.score-p.score));
  CROSS_SIM_CACHE.key = key; CROSS_SIM_CACHE.value = out;
  return out;
}

/* Détail : une ligne par exigence du référentiel « from », avec son état par rapport au(x) référentiel(s) « toIds ». */
function crossPairRows(A, fromId, toIds, level){
  const targets = new Set(Array.isArray(toIds) ? toIds : [toIds]);
  const sims = crossSimilarities(fromId, [...targets], level||"off");
  return (A.exig[fromId]||[]).map(e=>{
    const links = (A.byEx.get(e.id)||[]).filter(x=>targets.has(A.owner.get(x.m.exigenceAId===e.id?x.m.exigenceBId:x.m.exigenceAId)));
    const pick = f => links.filter(f).map(x=>({ m:x.m, otherId: x.m.exigenceAId===e.id ? x.m.exigenceBId : x.m.exigenceAId }));
    const validated = pick(x=>x.m.status==="validated" && x.st==="ok");
    const review = pick(x=>x.m.status==="validated" && x.st==="a_revoir");
    const suggested = pick(x=>x.m.status==="suggested");
    const similar = sims.get(e.id) || [];
    const state = validated.length ? "validee" : review.length ? "a_revoir" : suggested.length ? "a_valider" : similar.length ? "similitude" : "aucune";
    return { e, state, validated, review, suggested, similar };
  });
}

/* ---------- Interface ---------- */
function referentielsTopTabsHtml(active){
  return `<div class="tabs"><button class="tab ${active==="liste"?"active":""}" data-route="referentiels">Référentiels</button><button class="tab ${active==="analyse"?"active":""}" data-route="referentiels/analyse">Analyse transversale</button></div>`;
}
/* Rang d'une exigence parmi celles du même référentiel qui portent le même code (« 4.1 (2/3) ») : plusieurs phrases d'exigence d'un même article
   ne sont pas des doublons. Calculé à l'affichage, sans rien enregistrer. */
function crossRankInfo(id){
  const c = getCustomExigence(id); if(!c) return { rank:1, of:1 };
  const same = DB.customExigences.filter(e=>e.referentielId===c.referentielId && e.ref===c.ref && e.status!=="retired");
  return { rank: Math.max(1, same.findIndex(e=>e.id===id)+1), of: Math.max(1, same.length) };
}
function crossCode(id, ref){ const k = crossRankInfo(id); return ref + (k.of>1 ? " ("+k.rank+"/"+k.of+")" : ""); }
function crossExcerpt(ep, max){
  const t = (ep.text||"").replace(/\s+/g," ").trim();
  if(!t || t===(ep.title||"") || ep.legacy) return "";
  return t.length>max ? t.slice(0,max-1).trimEnd()+"…" : t;
}
function crossExLabel(id, withRef){
  const ep = mappingEndpoint(id); if(!ep) return esc(id);
  const rf = getReferentiel(ep.referentielId);
  const ex = crossExcerpt(ep, 110);
  return `<a href="#/referentiels/${esc(ep.referentielId)}/exigences/${esc(id)}">${esc(crossCode(id, ep.ref))} — ${esc((ep.title||ep.text).slice(0,80))}</a>${withRef&&rf?` <span class="text-xs">(${esc(rf.name)})</span>`:""}${ex?`<span class="text-xs" style="display:block;font-weight:400;">${esc(ex)}</span>`:""}`;
}
function crossHeat(pct){ return `background:rgba(34,139,84,${(0.06+0.5*pct/100).toFixed(2)});`; }

function pageAnalyseTransversale(){
  const head = pageHeader("Référentiels","Analyse transversale : où les exigences de vos référentiels se recoupent, et ce qui n'a pas encore été relié.", "")+referentielsTopTabsHtml("analyse");
  const A = crossAnalysisData();
  if(A.refs.length<2) return head+emptyState("🧭","Au moins deux référentiels sont nécessaires","L'analyse transversale compare les exigences de plusieurs référentiels. Importez un deuxième référentiel pour commencer.");
  if(!CROSS_UI.from || !A.exig[CROSS_UI.from]) CROSS_UI.from = A.refs[0].id;
  const toOptions = A.refs.filter(r=>r.id!==CROSS_UI.from);
  CROSS_UI.tos = (CROSS_UI.tos||[]).filter(id=>toOptions.some(o=>o.id===id));
  if(!CROSS_UI.tos.length) CROSS_UI.tos = [toOptions[0].id];
  const c = A.counts;
  const kpi = (v,l,hint)=>`<div class="kpi"><div class="val">${v}</div><div class="lbl">${esc(l)}</div>${hint?`<div class="text-xs">${esc(hint)}</div>`:""}</div>`;
  const matrixHtml = `<div class="card card-flush table-wrap"><table class="dt"><thead><tr><th>Part des exigences de la ligne…</th>${A.refs.map(r=>`<th>${esc(r.name)}</th>`).join("")}</tr></thead><tbody>${A.refs.map(R=>`<tr><td><div class="cell-title">${esc(R.name)}</div><div class="text-xs">${A.exig[R.id].length} exigence(s)</div></td>${A.refs.map(C=>{
      if(R.id===C.id) return `<td class="text-xs" style="text-align:center;">—</td>`;
      const x = A.matrix[R.id][C.id];
      return `<td style="${crossHeat(x.pct)}text-align:center;cursor:pointer;" data-cross-pair='${jsonAttr({from:R.id,to:C.id})}' title="Voir le détail ${esc(R.name)} → ${esc(C.name)}"><strong>${x.pct} %</strong><div class="text-xs">${x.covered}/${x.total}</div></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="text-xs mt-2">… ayant au moins une correspondance <strong>validée et à jour</strong> dans le référentiel de la colonne. Cliquez une case pour le détail. La matrice n'est pas symétrique : un référentiel peut être plus détaillé que l'autre.</p>`;
  const rows = crossPairRows(A, CROSS_UI.from, CROSS_UI.tos, CROSS_UI.level);
  const nBy = s => rows.filter(r=>r.state===s).length;
  const shown = CROSS_UI.filter==="all" ? rows : rows.filter(r=>r.state===CROSS_UI.filter);
  const fromR = getReferentiel(CROSS_UI.from);
  const toNames = CROSS_UI.tos.map(id=>(getReferentiel(id)||{}).name||id).join(", ");
  const stBadge = s => s==="validee" ? badgeRaw("success","Correspondance validée") : s==="a_revoir" ? badgeRaw("warning","À revoir") : s==="a_valider" ? badgeRaw("warning","Suggestion à valider") : s==="similitude" ? badgeRaw("info","Similitude détectée") : badgeRaw("neutral","Sans correspondance ni similitude");
  const nSim = nBy("similitude");
  const warns = CROSS_UI.tos.map(tid=>{ const l1 = msGuessLang((A.exig[CROSS_UI.from]||[]).map(e=>e.text)), l2 = msGuessLang((A.exig[tid]||[]).map(e=>e.text)); return (l1!=="?"&&l2!=="?"&&l1!==l2) ? (getReferentiel(tid)||{}).name : null; }).filter(Boolean);
  const opt = (v,l,cur)=>`<option value="${esc(v)}" ${v===cur?"selected":""}>${esc(l)}</option>`;
  return head+`
  <div class="aq-callout" style="margin:12px 0;">Vue de <strong>lecture</strong> : elle ne modifie ni les correspondances, ni les niveaux de maîtrise, ni les audits. Seules les correspondances <strong>validées et à jour</strong> sont comptées. « Sans correspondance validée » ne signifie pas « non conforme » : l'exigence n'a simplement pas (encore) été reliée.</div>
  <div class="grid grid-4 mb-2">
    ${kpi(A.refs.length,"Référentiels comparables")}
    ${kpi(c.validated,"Correspondances validées","à jour")}
    ${kpi(c.suggested,"Suggestions à valider",c.suggested?"en attente de votre décision":"")}
    ${kpi(c.aRevoir,"À revoir","contenu modifié depuis la validation")}
  </div>
  ${c.anomalies?`<p class="text-xs mb-2">⚠️ ${c.anomalies} correspondance(s) liée(s) à une exigence retirée ou introuvable : non comptée(s). Voir l'onglet « Correspondances » du référentiel concerné.</p>`:""}
  ${(c.validated+c.suggested+c.aRevoir)===0?`<div class="aq-callout warn" style="margin-bottom:12px;">Aucune correspondance enregistrée pour le moment : ouvrez l'onglet « Correspondances » d'un référentiel (« Suggérer » ou « Ajouter ») pour alimenter cette analyse.</div>`:""}
  <h3 class="mb-2 mt-4">Couverture croisée</h3>
  ${matrixHtml}
  <h3 class="mb-2 mt-4">Détail d'une paire de référentiels</h3>
  <div class="flex justify-between items-center mb-2" style="gap:8px;flex-wrap:wrap;">
    <div class="filters-bar" style="margin:0;">
      <select data-cross-filter="from" aria-label="Référentiel source">${A.refs.map(r=>opt(r.id,r.name,CROSS_UI.from)).join("")}</select>
      <span class="text-sm">→</span>
      ${multiPickHtml("cross-to","Comparé avec",toOptions.map(r=>({id:r.id,name:r.name})),CROSS_UI.tos,CROSS_UI.openTo)}
      <select data-cross-filter="level" aria-label="Détection des similitudes">${[["off","Similitudes : masquées"],["prudent","Similitudes : prudent"],["standard","Similitudes : standard"],["large","Similitudes : large"]].map(([v,l])=>opt(v,l,CROSS_UI.level)).join("")}</select>
      <select data-cross-filter="filter" aria-label="Filtre">${Object.keys(CROSS_FILTERS).map(k=>opt(k, CROSS_FILTERS[k]+(k==="all"?" ("+rows.length+")":" ("+nBy(k)+")"), CROSS_UI.filter)).join("")}</select>
    </div>
    <div class="flex gap-2">${nSim?`<button class="btn btn-secondary btn-sm" data-cross-save-sim>Enregistrer ${nSim} similitude(s) comme suggestions à valider</button>`:""}<button class="btn btn-secondary btn-sm" data-cross-export>⬇ Exporter en CSV</button></div>
  </div>
  ${CROSS_UI.level!=="off"?`<p class="text-xs mb-2">« Similitude détectée » : proposition calculée par les règles (mots-clés, texte, codes, chapitres) et <strong>non enregistrée</strong>. Ce n'est pas une correspondance : une ressemblance n'est jamais une preuve d'équivalence. Enregistrez-la comme suggestion pour la valider ou la rejeter.</p>`:""}
  ${warns.length?`<div class="aq-callout warn" style="margin-bottom:8px;">⚠️ Langue différente pour : ${warns.map(esc).join(", ")} — les similitudes seront rares ou absentes. Traduisez d'abord le référentiel importé en anglais.</div>`:""}
  ${dataTable([
    {label:`Exigence de ${fromR?fromR.name:""}`, render:r=>`<div class="cell-title">${crossExLabel(r.e.id,false)}</div>`},
    {label:"État", render:r=>stBadge(r.state)},
    {label:`Correspondance dans ${toNames}`, render:r=>{
      const multi = CROSS_UI.tos.length>1;
      const all = [...r.validated.map(x=>({x,t:""})), ...r.review.map(x=>({x,t:" · à revoir"})), ...r.suggested.map(x=>({x,t:" · suggestion"}))];
      const lines = all.map(({x,t})=>`<div class="text-sm">${crossExLabel(x.otherId,multi)} <span class="text-xs">(${esc(MAPPING_RELATIONS[x.m.relation].label.toLowerCase())}${t})</span></div>`);
      if(!all.length) r.similar.slice(0,3).forEach(x=>lines.push(`<div class="text-sm">${crossExLabel(x.bId,multi)} <span class="text-xs">(similitude ${Math.round(x.score*100)} % · non enregistrée)</span></div>`));
      return lines.length ? lines.join("") : `<span class="text-xs">—</span>`; }} ],
    shown, {emptyEmoji:"🧭", emptyTitle:"Aucune exigence pour ce filtre", emptyText:"Changez de filtre."})}`;
}

/* Export CSV du détail affiché (séparateur « ; » et BOM UTF-8 pour une ouverture directe dans Excel en français). */
function crossPairCsv(fromId, toIds, level){
  const A = crossAnalysisData();
  const ids = Array.isArray(toIds) ? toIds : [toIds];
  const q = v => '"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const lines = [["Référentiel source","Code","Exigence","État","Référentiel comparé","Code lié","Exigence liée","Relation","Statut de la correspondance"].map(q).join(";")];
  const fromR = getReferentiel(fromId);
  const STATE = { validee:"Correspondance validée", a_revoir:"À revoir", a_valider:"Suggestion à valider", similitude:"Similitude détectée (non enregistrée)", aucune:"Sans correspondance ni similitude" };
  const csvEx = ep => { const x = crossExcerpt(ep,200); return (ep.title||ep.text)+(x?" — "+x:""); };
  const rf = id => { const ep = mappingEndpoint(id); return ep ? ((getReferentiel(ep.referentielId)||{}).name||"") : ""; };
  crossPairRows(A, fromId, ids, level||"off").forEach(r=>{
    const links = [...r.validated, ...r.review, ...r.suggested];
    const fe = mappingEndpoint(r.e.id); const fx = fe ? crossExcerpt(fe,200) : "";
    const base = [fromR.name, crossCode(r.e.id, r.e.ref), (r.e.title||r.e.text)+(fx?" — "+fx:""), STATE[r.state]];
    if(links.length) links.forEach(x=>{ const ep = mappingEndpoint(x.otherId);
      lines.push([...base, rf(x.otherId), ep?crossCode(ep.id,ep.ref):"", ep?csvEx(ep):"", MAPPING_RELATIONS[x.m.relation].label, MAPPING_STATUS[x.m.status].l].map(q).join(";")); });
    else if(r.similar.length) r.similar.forEach(x=>{ const ep = mappingEndpoint(x.bId);
      lines.push([...base, rf(x.bId), ep?crossCode(ep.id,ep.ref):"", ep?csvEx(ep):"", MAPPING_RELATIONS[x.relation].label+" (proposée)", "Non enregistrée · indice "+Math.round(x.score*100)+" %"].map(q).join(";")); });
    else lines.push([...base, ids.map(i=>(getReferentiel(i)||{}).name||i).join(" / "), "", "", "", ""].map(q).join(";"));
  });
  return "\ufeff"+lines.join("\r\n");
}
function crossExportCsv(){
  const csv = crossPairCsv(CROSS_UI.from, CROSS_UI.tos, CROSS_UI.level);
  const slug = id => vmNorm((getReferentiel(id)||{}).name||id).replace(/ /g,"-");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8" }));
  a.download = "analyse-transversale-"+slug(CROSS_UI.from)+"-vers-"+CROSS_UI.tos.map(slug).join("-et-")+".csv";
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
/* Enregistre les similitudes affichées comme suggestions « à valider » (jamais validées) ; le détail se met à jour. */
function crossSaveSimilarities(){
  const A = crossAnalysisData();
  const rows = crossPairRows(A, CROSS_UI.from, CROSS_UI.tos, CROSS_UI.level).filter(r=>r.state==="similitude");
  const before = DB.exigenceMappings.length; let n = 0;
  rows.forEach(r=> r.similar.forEach(x=>{ const res = createMapping(r.e.id, x.bId, { relation:x.relation, origin:"regles", status:"suggested", confidence:x.score, basis:x.basis }); if(res.ok) n++; }));
  try{ saveDB(); }catch(e){ DB.exigenceMappings.length = before; toast("Enregistrement impossible (stockage plein ?) : rien n'a été enregistré.","⚠️"); return; }
  toast(n+" suggestion(s) enregistrée(s) — à valider dans l'onglet « Correspondances »","✅"); render();
}
