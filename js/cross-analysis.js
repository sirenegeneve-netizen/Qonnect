/* ============================================================
   ANALYSE TRANSVERSALE DES RÉFÉRENTIELS (étape 5) — vue de LECTURE construite sur les correspondances.
   - Elle ne modifie rien : ni correspondances, ni exigences, ni scores de maîtrise, ni audits.
   - Seules les correspondances VALIDÉES, À JOUR (contenu des deux exigences inchangé depuis la validation) comptent comme « couverture croisée ».
     Les correspondances « à revoir » sont signalées à part et ne sont pas comptées ; les suggestions « à valider » et les rejetées non plus.
   - « Sans correspondance validée » ne veut pas dire « non conforme » : la paire n'a simplement pas (encore) été analysée ou reliée.
   ============================================================ */

const CROSS_UI = { from:null, to:null, filter:"all" };
const CROSS_FILTERS = { all:"Toutes", validee:"Avec correspondance validée", a_valider:"Suggestion à valider", a_revoir:"Correspondance à revoir", aucune:"Sans correspondance validée" };

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

/* Détail d'une paire : une ligne par exigence du référentiel « from », avec son état par rapport au référentiel « to ». */
function crossPairRows(A, fromId, toId){
  return (A.exig[fromId]||[]).map(e=>{
    const links = (A.byEx.get(e.id)||[]).filter(x=>A.owner.get(x.m.exigenceAId===e.id?x.m.exigenceBId:x.m.exigenceAId)===toId);
    const pick = f => links.filter(f).map(x=>({ m:x.m, otherId: x.m.exigenceAId===e.id ? x.m.exigenceBId : x.m.exigenceAId }));
    const validated = pick(x=>x.m.status==="validated" && x.st==="ok");
    const review = pick(x=>x.m.status==="validated" && x.st==="a_revoir");
    const suggested = pick(x=>x.m.status==="suggested");
    const state = validated.length ? "validee" : review.length ? "a_revoir" : suggested.length ? "a_valider" : "aucune";
    return { e, state, validated, review, suggested };
  });
}

/* ---------- Interface ---------- */
function referentielsTopTabsHtml(active){
  return `<div class="tabs"><button class="tab ${active==="liste"?"active":""}" data-route="referentiels">Référentiels</button><button class="tab ${active==="analyse"?"active":""}" data-route="referentiels/analyse">Analyse transversale</button></div>`;
}
function crossExLabel(id, withRef){
  const ep = mappingEndpoint(id); if(!ep) return esc(id);
  const rf = getReferentiel(ep.referentielId);
  return `<a href="#/referentiels/${esc(ep.referentielId)}/exigences/${esc(id)}">${esc(ep.ref)} — ${esc((ep.title||ep.text).slice(0,80))}</a>${withRef&&rf?` <span class="text-xs">(${esc(rf.name)})</span>`:""}`;
}
function crossHeat(pct){ return `background:rgba(34,139,84,${(0.06+0.5*pct/100).toFixed(2)});`; }

function pageAnalyseTransversale(){
  const head = pageHeader("Référentiels","Analyse transversale : où les exigences de vos référentiels se recoupent, et ce qui n'a pas encore été relié.", "")+referentielsTopTabsHtml("analyse");
  const A = crossAnalysisData();
  if(A.refs.length<2) return head+emptyState("🧭","Au moins deux référentiels sont nécessaires","L'analyse transversale compare les exigences de plusieurs référentiels. Importez un deuxième référentiel pour commencer.");
  if(!CROSS_UI.from || !A.exig[CROSS_UI.from]) CROSS_UI.from = A.refs[0].id;
  if(!CROSS_UI.to || !A.exig[CROSS_UI.to] || CROSS_UI.to===CROSS_UI.from) CROSS_UI.to = (A.refs.find(r=>r.id!==CROSS_UI.from)||{}).id;
  const c = A.counts;
  const kpi = (v,l,hint)=>`<div class="kpi"><div class="val">${v}</div><div class="lbl">${esc(l)}</div>${hint?`<div class="text-xs">${esc(hint)}</div>`:""}</div>`;
  const matrixHtml = `<div class="card card-flush table-wrap"><table class="dt"><thead><tr><th>Part des exigences de la ligne…</th>${A.refs.map(r=>`<th>${esc(r.name)}</th>`).join("")}</tr></thead><tbody>${A.refs.map(R=>`<tr><td><div class="cell-title">${esc(R.name)}</div><div class="text-xs">${A.exig[R.id].length} exigence(s)</div></td>${A.refs.map(C=>{
      if(R.id===C.id) return `<td class="text-xs" style="text-align:center;">—</td>`;
      const x = A.matrix[R.id][C.id];
      return `<td style="${crossHeat(x.pct)}text-align:center;cursor:pointer;" data-cross-pair='${jsonAttr({from:R.id,to:C.id})}' title="Voir le détail ${esc(R.name)} → ${esc(C.name)}"><strong>${x.pct} %</strong><div class="text-xs">${x.covered}/${x.total}</div></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="text-xs mt-2">… ayant au moins une correspondance <strong>validée et à jour</strong> dans le référentiel de la colonne. Cliquez une case pour le détail. La matrice n'est pas symétrique : un référentiel peut être plus détaillé que l'autre.</p>`;
  const rows = crossPairRows(A, CROSS_UI.from, CROSS_UI.to);
  const nBy = s => rows.filter(r=>r.state===s).length;
  const shown = CROSS_UI.filter==="all" ? rows : rows.filter(r=>r.state===CROSS_UI.filter);
  const fromR = getReferentiel(CROSS_UI.from), toR = getReferentiel(CROSS_UI.to);
  const stBadge = s => s==="validee" ? badgeRaw("success","Correspondance validée") : s==="a_revoir" ? badgeRaw("warning","À revoir") : s==="a_valider" ? badgeRaw("warning","Suggestion à valider") : badgeRaw("neutral","Sans correspondance validée");
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
      <select data-cross-filter="to" aria-label="Référentiel comparé">${A.refs.filter(r=>r.id!==CROSS_UI.from).map(r=>opt(r.id,r.name,CROSS_UI.to)).join("")}</select>
      <select data-cross-filter="filter" aria-label="Filtre">${Object.keys(CROSS_FILTERS).map(k=>opt(k, CROSS_FILTERS[k]+(k==="all"?" ("+rows.length+")":" ("+nBy(k)+")"), CROSS_UI.filter)).join("")}</select>
    </div>
    <button class="btn btn-secondary btn-sm" data-cross-export>⬇ Exporter en CSV</button>
  </div>
  ${dataTable([
    {label:`Exigence de ${fromR?fromR.name:""}`, render:r=>`<div class="cell-title">${crossExLabel(r.e.id,false)}</div>`},
    {label:"État", render:r=>stBadge(r.state)},
    {label:`Correspondance dans ${toR?toR.name:""}`, render:r=>{
      const all = [...r.validated.map(x=>({x,t:""})), ...r.review.map(x=>({x,t:" · à revoir"})), ...r.suggested.map(x=>({x,t:" · suggestion"}))];
      return all.length ? all.map(({x,t})=>`<div class="text-sm">${crossExLabel(x.otherId,false)} <span class="text-xs">(${esc(MAPPING_RELATIONS[x.m.relation].label.toLowerCase())}${t})</span></div>`).join("") : `<span class="text-xs">—</span>`; }} ],
    shown, {emptyEmoji:"🧭", emptyTitle:"Aucune exigence pour ce filtre", emptyText:"Changez de filtre."})}`;
}

/* Export CSV de la paire affichée (séparateur « ; » et BOM UTF-8 pour une ouverture directe dans Excel en français). */
function crossPairCsv(fromId, toId){
  const A = crossAnalysisData();
  const q = v => '"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const lines = [["Référentiel source","Code","Exigence","État","Référentiel comparé","Code lié","Exigence liée","Relation","Statut de la correspondance"].map(q).join(";")];
  const fromR = getReferentiel(fromId), toR = getReferentiel(toId);
  const STATE = { validee:"Correspondance validée", a_revoir:"À revoir", a_valider:"Suggestion à valider", aucune:"Sans correspondance validée" };
  crossPairRows(A, fromId, toId).forEach(r=>{
    const links = [...r.validated, ...r.review, ...r.suggested];
    if(!links.length) lines.push([fromR.name, r.e.ref, r.e.title||r.e.text, STATE[r.state], toR.name, "", "", "", ""].map(q).join(";"));
    links.forEach(x=>{ const ep = mappingEndpoint(x.otherId);
      lines.push([fromR.name, r.e.ref, r.e.title||r.e.text, STATE[r.state], toR.name, ep?ep.ref:"", ep?(ep.title||ep.text):"", MAPPING_RELATIONS[x.m.relation].label, MAPPING_STATUS[x.m.status].l].map(q).join(";")); });
  });
  return "﻿"+lines.join("\r\n");
}
function crossExportCsv(){
  const csv = crossPairCsv(CROSS_UI.from, CROSS_UI.to);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8" }));
  a.download = "analyse-transversale-"+vmNorm(getReferentiel(CROSS_UI.from).name).replace(/ /g,"-")+"-vers-"+vmNorm(getReferentiel(CROSS_UI.to).name).replace(/ /g,"-")+".csv";
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
