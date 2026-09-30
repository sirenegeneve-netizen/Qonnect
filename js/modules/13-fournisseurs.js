/* ============================================================
   13ter. FOURNISSEURS
   ============================================================ */

/* ---------- Logique métier ---------- */
function fournisseurEvalScore(evaluation){
  const totalPoids = evaluation.criteres.reduce((s,c)=>s+c.ponderation,0)||1;
  const weighted = evaluation.criteres.reduce((s,c)=>s+c.note*c.ponderation,0);
  return Math.round((weighted/totalPoids)*10)/10;
}
function fournisseurEvalNiveau(score){
  if(score>=8.5) return "excellent";
  if(score>=7) return "satisfaisant";
  if(score>=5) return "sous_surveillance";
  if(score>=3) return "insuffisant";
  return "critique";
}
function fournisseurLatestEvaluation(fid){
  const evals = DB.fournisseurEvaluations.filter(e=>e.fournisseurId===fid).sort((a,b)=>a.date.localeCompare(b.date));
  return evals.length ? evals[evals.length-1] : null;
}
function fournisseurDocStatusCompute(doc){
  if(!doc.echeance || doc.echeance==="—") return "valide";
  const diffDays = Math.round((new Date(doc.echeance+"T00:00:00")-new Date())/(1000*3600*24));
  if(diffDays<0) return "expire";
  if(diffDays<=90) return "a_renouveler";
  return "valide";
}
function fournisseurRisks(fid){ return DB.risks.filter(r=>r.fournisseurId===fid); }
function fournisseurIncidents(fid){ return DB.fournisseurIncidents.filter(i=>i.fournisseurId===fid); }
function fournisseurAudits(fid){ return DB.audits.filter(a=>a.fournisseurId===fid); }
function fournisseurActions(fid){ return DB.actions.filter(a=>a.fournisseurId===fid); }
function fournisseurDocs(fid){ return DB.fournisseurDocuments.filter(d=>d.fournisseurId===fid); }
function fournisseurPerformanceScore(fid){
  const evalLatest = fournisseurLatestEvaluation(fid);
  let score = evalLatest ? fournisseurEvalScore(evalLatest)*10 : 60;
  const incidents = fournisseurIncidents(fid);
  score -= incidents.filter(i=>i.gravite==="majeure").length*8;
  score -= incidents.filter(i=>i.gravite==="critique").length*15;
  score -= incidents.filter(i=>i.gravite==="mineure").length*3;
  const audits = fournisseurAudits(fid);
  const ecarts = audits.reduce((s,a)=>s+a.findings.filter(isAuditEcart).length,0);
  score -= ecarts*5;
  const risksOuverts = fournisseurRisks(fid).filter(r=>r.status==="ouvert" && (r.level==="critique"||r.level==="eleve")).length;
  score -= risksOuverts*7;
  const actionsRetard = fournisseurActions(fid).filter(a=>a.status==="retard").length;
  score -= actionsRetard*5;
  return {score: Math.max(0, Math.min(100, Math.round(score))), evalLatest, incidents, ecarts, risksOuverts, actionsRetard};
}
function fournisseurDashboardStats(){
  const total = DB.fournisseurs.length;
  const critiques = DB.fournisseurs.filter(f=>f.criticite==="critique").length;
  const surveillance = DB.fournisseurs.filter(f=>f.statut==="sous_surveillance").length;
  const bloques = DB.fournisseurs.filter(f=>f.statut==="bloque"||f.statut==="suspendu").length;
  const evalARealiser = DB.fournisseurs.filter(f=>{ const e=fournisseurLatestEvaluation(f.id); if(!e) return true; const mois=(Date.now()-new Date(e.date+"T00:00:00").getTime())/(1000*3600*24*30); return mois>12; }).length;
  const auditsAPlanifier = DB.audits.filter(a=>a.type==="fournisseur" && a.status==="planifie").length;
  const incidentsOuverts = DB.fournisseurIncidents.filter(i=>!i.actionId).length;
  const risquesEleves = DB.risks.filter(r=>r.fournisseurId && r.status==="ouvert" && (r.level==="critique"||r.level==="eleve")).length;
  const actionsRetard = DB.actions.filter(a=>a.origin==="fournisseur" && a.status==="retard").length;
  const scores = DB.fournisseurs.map(f=>fournisseurPerformanceScore(f.id).score);
  const tauxMaitrise = scores.length ? Math.round(scores.reduce((s,v)=>s+v,0)/scores.length) : 0;
  return {total, critiques, surveillance, bloques, evalARealiser, auditsAPlanifier, incidentsOuverts, risquesEleves, actionsRetard, tauxMaitrise};
}
function fournisseurAlerts(){
  const alerts = [];
  DB.fournisseurDocuments.forEach(d=>{
    const st = fournisseurDocStatusCompute(d);
    const f = getFournisseur(d.fournisseurId);
    if(!f) return;
    if(st==="expire") alerts.push({level:"danger", text:`Le document « ${d.titre} » de ${f.nomCommercial} est expiré.`});
    else if(st==="a_renouveler") alerts.push({level:"warning", text:`Le document « ${d.titre} » de ${f.nomCommercial} arrive à échéance (${fmtDate(d.echeance)}).`});
  });
  DB.fournisseurs.filter(f=>f.criticite==="critique").forEach(f=>{
    const perf = fournisseurPerformanceScore(f.id);
    if(perf.score<50) alerts.push({level:"danger", text:`${f.nomCommercial} est un fournisseur critique avec une performance dégradée (${perf.score}/100).`});
  });
  DB.fournisseurs.filter(f=>f.statut==="sous_surveillance").forEach(f=> alerts.push({level:"warning", text:`${f.nomCommercial} est sous surveillance.`}));
  return alerts;
}

/* ---------- Tableau de bord ---------- */
function pageFournisseurs(){
  const s = fournisseurDashboardStats();
  const kpi = (route, val, label, color)=>`<div class="card card-hover" data-route="${route}"><div class="kpi"><div class="val" style="color:${color||'var(--text-primary)'}">${val}</div><div class="lbl">${esc(label)}</div></div></div>`;
  const ranked = [...DB.fournisseurs].map(f=>({f, perf:fournisseurPerformanceScore(f.id)})).sort((a,b)=>b.perf.score-a.perf.score);
  const top = ranked.slice(0,3);
  const risque = ranked.slice(-3).reverse();
  return `
  ${pageHeader("Fournisseurs","Le centre de maîtrise des prestataires externes de Qonnect.",
    `<button class="btn btn-secondary" data-route="fournisseurs/critiques">🛡️ Fournisseurs critiques</button><button class="btn btn-primary" data-open-fournisseur-form>+ Nouveau fournisseur</button>`)}
  <div class="quick-actions mb-4">
    <button class="qa-btn" data-route="fournisseurs/liste">📋 Tous les fournisseurs</button>
    <button class="qa-btn" data-route="fournisseurs/evaluations">📊 Évaluations</button>
    <button class="qa-btn" data-route="fournisseurs/audits">🔍 Audits fournisseurs</button>
    <button class="qa-btn" data-route="fournisseurs/incidents">🚨 Incidents</button>
    <button class="qa-btn" data-route="fournisseurs/risques">⚠️ Risques</button>
    <button class="qa-btn" data-route="fournisseurs/documents">🗂️ Contrats & documents</button>
    <button class="qa-btn" data-route="fournisseurs/performance">📈 Performance</button>
    <button class="qa-btn" data-route="fournisseurs/vues">👁️ Vues Achats / Qualité / Direction / Auditeur</button>
  </div>
  <div class="grid grid-4 mb-4">
    ${kpi("fournisseurs/liste", s.total, "Fournisseurs")}
    ${kpi("fournisseurs/critiques", s.critiques, "Fournisseurs critiques", "var(--danger)")}
    ${kpi("fournisseurs/liste", s.surveillance, "Sous surveillance", s.surveillance?"var(--warning)":"var(--success)")}
    ${kpi("fournisseurs/liste", s.bloques, "Bloqués / suspendus", s.bloques?"var(--danger)":"var(--success)")}
  </div>
  <div class="grid grid-4 mb-4">
    ${kpi("fournisseurs/evaluations", s.evalARealiser, "Évaluations à réaliser", s.evalARealiser?"var(--warning)":"var(--success)")}
    ${kpi("fournisseurs/audits", s.auditsAPlanifier, "Audits à planifier")}
    ${kpi("fournisseurs/incidents", s.incidentsOuverts, "Incidents ouverts", s.incidentsOuverts?"var(--warning)":"var(--success)")}
    ${kpi("fournisseurs/risques", s.risquesEleves, "Risques élevés", s.risquesEleves?"var(--danger)":"var(--success)")}
  </div>
  <div class="card mb-4"><div class="kpi"><div class="val" style="color:var(--primary)">${s.tauxMaitrise} / 100</div><div class="lbl">Taux global de maîtrise des fournisseurs</div></div></div>
  <div class="grid grid-2 mb-4">
    <div class="card">
      <h3 class="mb-2">🏆 Top fournisseurs performants</h3>
      ${top.map(x=>`<div class="rel-link" data-route="fournisseurs/liste/${x.f.id}"><span class="rel-name">${esc(x.f.nomCommercial)}</span><span class="text-sm" style="font-weight:700;color:var(--success);">${x.perf.score}/100</span></div>`).join("")}
    </div>
    <div class="card">
      <h3 class="mb-2">⚠️ Fournisseurs à risque</h3>
      ${risque.map(x=>`<div class="rel-link" data-route="fournisseurs/liste/${x.f.id}"><span class="rel-name">${esc(x.f.nomCommercial)}</span><span class="text-sm" style="font-weight:700;color:var(--danger);">${x.perf.score}/100</span></div>`).join("")}
    </div>
  </div>
  <div class="card">
    <h3 class="mb-2">🔔 Alertes</h3>
    ${(()=>{ const al=fournisseurAlerts(); return al.length? al.slice(0,8).map(a=>`<div class="rel-link"><span class="rel-name">${a.level==="danger"?"🔴":"🟠"} ${esc(a.text)}</span></div>`).join("") : `<p class="text-sm">Aucune alerte active.</p>`; })()}
  </div>`;
}

function pageFournisseursListe(){
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Tous les fournisseurs"}])}
  ${pageHeader("Fournisseurs","", `<button class="btn btn-primary" data-open-fournisseur-form>+ Nouveau fournisseur</button>`)}
  <div class="filters-bar">
    ${filterSelect("f-frn-statut","Statut", Object.entries(LABELS.fournisseurStatut).map(([v,l])=>({v,l:l.l})))}
    ${filterSelect("f-frn-criticite","Criticité", Object.entries(LABELS.fournisseurCriticite).map(([v,l])=>({v,l:l.l})))}
  </div>
  <div id="frn-list-zone">${fournisseurTable(DB.fournisseurs.filter(fournisseurMatchesScope))}</div>`;
}
function fournisseurTable(list){
  return dataTable(
    [ {label:"Fournisseur", render:f=>`<div class="cell-title">${esc(f.nomCommercial)}</div><div class="cell-sub">${(f.categories||[]).join(", ")}</div>`},
      {label:"Criticité", render:f=>badge(LABELS.fournisseurCriticite[f.criticite])},
      {label:"Statut", render:f=>badge(LABELS.fournisseurStatut[f.statut])},
      {label:"Performance", render:f=>{const p=fournisseurPerformanceScore(f.id); return `<span style="font-weight:700;color:${p.score>=70?'var(--success)':p.score>=50?'var(--warning)':'var(--danger)'}">${p.score}/100</span>`;}},
      {label:"Référent interne", render:f=>esc(f.referentInterne)} ],
    list, {rowRoute:f=>`fournisseurs/liste/${f.id}`, emptyEmoji:"🏭", emptyTitle:"Aucun fournisseur", emptyText:"Aucun fournisseur ne correspond à ces filtres."}
  );
}
function applyFournisseurFilters(){
  const statut = document.getElementById("f-frn-statut")?.value;
  const criticite = document.getElementById("f-frn-criticite")?.value;
  let rows = DB.fournisseurs.filter(fournisseurMatchesScope);
  if(statut) rows = rows.filter(f=>f.statut===statut);
  if(criticite) rows = rows.filter(f=>f.criticite===criticite);
  document.getElementById("frn-list-zone").innerHTML = fournisseurTable(rows);
}

function pageFournisseursCritiques(){
  const critiques = DB.fournisseurs.filter(f=>f.criticite==="critique");
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Fournisseurs critiques"}])}
  ${pageHeader("Fournisseurs critiques","Vue dédiée aux Achats, à la Qualité et à la Direction — dépendances, risques et continuité.")}
  ${critiques.length? critiques.map(f=>{
    const perf = fournisseurPerformanceScore(f.id);
    const risks = fournisseurRisks(f.id);
    const incidents = fournisseurIncidents(f.id);
    return `<div class="card mb-4">
      <div class="flex justify-between items-center"><h3>${esc(f.nomCommercial)}</h3><span style="font-weight:700;color:${perf.score>=70?'var(--success)':perf.score>=50?'var(--warning)':'var(--danger)'}">${perf.score}/100</span></div>
      <p class="text-sm mt-2">${esc(f.criticiteJustification||"—")}</p>
      <div class="grid grid-3 mt-4">
        <div><div class="text-xs">RISQUES</div>${risks.length?risks.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">${esc(r.name)}</span></div>`).join(""):`<p class="text-sm">Aucun</p>`}</div>
        <div><div class="text-xs">INCIDENTS</div>${incidents.length?incidents.map(i=>`<p class="text-sm mt-2">${esc(i.description.slice(0,60))}</p>`).join(""):`<p class="text-sm">Aucun</p>`}</div>
        <div><div class="text-xs">DÉPENDANCE</div><p class="text-sm">${(f.produitsServices||[]).map(p=>p.nom).join(", ")}</p></div>
      </div>
      <button class="btn btn-secondary btn-sm mt-4" data-route="fournisseurs/liste/${f.id}">Voir la fiche complète</button>
    </div>`;
  }).join("") : `<div class="card">${emptyState("🟢","Aucun fournisseur critique","Aucun fournisseur n'est classé critique actuellement.")}</div>`}`;
}

function pageFournisseurEvaluationsHub(){
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Évaluations"}])}
  ${pageHeader("Évaluations fournisseurs","")}
  ${dataTable(
    [ {label:"Fournisseur", render:e=>{const f=getFournisseur(e.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Date", render:e=>fmtDate(e.date)},
      {label:"Périodicité", render:e=>esc(e.periode)},
      {label:"Score", render:e=>fournisseurEvalScore(e)+"/10"},
      {label:"Niveau", render:e=>badge(LABELS.fournisseurEvalNiveau[fournisseurEvalNiveau(fournisseurEvalScore(e))])},
      {label:"Évaluateur", render:e=>esc(e.evaluateur)} ],
    [...DB.fournisseurEvaluations].sort((a,b)=>b.date.localeCompare(a.date)), {rowRoute:e=>`fournisseurs/liste/${e.fournisseurId}/evaluations`}
  )}`;
}
function pageFournisseurAuditsHub(){
  const audits = DB.audits.filter(a=>a.type==="fournisseur");
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Audits fournisseurs"}])}
  ${pageHeader("Audits fournisseurs","", `<button class="btn btn-primary" data-open-audit-wizard>+ Nouvel audit fournisseur</button>`)}
  ${dataTable(
    [ {label:"Fournisseur", render:a=>{const f=getFournisseur(a.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Audit", render:a=>`<div class="cell-title">${esc(a.title)}</div>`},
      {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Constats", render:a=>a.findings.length},
      {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    audits, {rowRoute:a=>`audits/${a.id}`, emptyEmoji:"🔍", emptyTitle:"Aucun audit fournisseur", emptyText:"Aucun audit fournisseur n'est encore planifié."}
  )}`;
}
function pageFournisseurIncidentsHub(){
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Incidents"}])}
  ${pageHeader("Incidents fournisseurs","À ne pas confondre avec les non-conformités du module NC/CAPA.")}
  ${dataTable(
    [ {label:"Fournisseur", render:i=>{const f=getFournisseur(i.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Type", render:i=>esc(LABELS.incidentType[i.type]||i.type)},
      {label:"Description", render:i=>esc(i.description.slice(0,60))},
      {label:"Gravité", render:i=>badge(LABELS.incidentGravite[i.gravite])},
      {label:"Date", render:i=>fmtDate(i.date)},
      {label:"Lien", render:i=>(i.ncEventId?"🚨 NC · ":"")+(i.riskId?"⚠️ Risque · ":"")+(i.actionId?"✅ Action":"")||"—"} ],
    [...DB.fournisseurIncidents].sort((a,b)=>b.date.localeCompare(a.date)), {rowRoute:i=>`fournisseurs/liste/${i.fournisseurId}/incidents`}
  )}`;
}
function pageFournisseurRisquesHub(){
  const risks = DB.risks.filter(r=>r.fournisseurId);
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Risques fournisseurs"}])}
  ${pageHeader("Risques fournisseurs","")}
  ${dataTable(
    [ {label:"Fournisseur", render:r=>{const f=getFournisseur(r.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Risque", render:r=>esc(r.name)},
      {label:"Niveau", render:r=>badge(LABELS.riskLevel[r.level])},
      {label:"Responsable", render:r=>esc(r.owner)},
      {label:"Statut", render:r=>badge(LABELS.riskStatus[r.status])} ],
    risks, {rowRoute:r=>`risques/${r.id}`, emptyEmoji:"⚠️", emptyTitle:"Aucun risque fournisseur", emptyText:"Aucun risque n'est encore associé à un fournisseur."}
  )}`;
}
function pageFournisseurDocumentsHub(){
  const docs = DB.fournisseurDocuments.map(d=>({...d, statutCalcule:fournisseurDocStatusCompute(d)}));
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Contrats & documents"}])}
  ${pageHeader("Contrats & documents fournisseurs","Gestion des échéances — contrats, certifications, assurances.")}
  ${dataTable(
    [ {label:"Fournisseur", render:d=>{const f=getFournisseur(d.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Document", render:d=>`<div class="cell-title">${esc(d.titre)}</div><div class="cell-sub">${esc(LABELS.fournisseurDocType[d.type]||d.type)}</div>`},
      {label:"Échéance", render:d=>fmtDate(d.echeance)},
      {label:"Responsable", render:d=>esc(d.responsable)},
      {label:"Statut", render:d=>badge(LABELS.fournisseurDocStatut[d.statutCalcule])} ],
    [...docs].sort((a,b)=>(a.echeance||"").localeCompare(b.echeance||"")), {rowRoute:d=>`fournisseurs/liste/${d.fournisseurId}/documents`}
  )}`;
}
function pageFournisseurPerformanceHub(){
  const ranked = [...DB.fournisseurs].map(f=>({f, perf:fournisseurPerformanceScore(f.id)})).sort((a,b)=>b.perf.score-a.perf.score);
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Performance"}])}
  ${pageHeader("Performance des fournisseurs","Score composite : dernière évaluation, incidents, écarts d'audit, risques ouverts, actions en retard.")}
  ${dataTable(
    [ {label:"Fournisseur", render:x=>esc(x.f.nomCommercial)},
      {label:"Score", render:x=>`<strong style="color:${x.perf.score>=70?'var(--success)':x.perf.score>=50?'var(--warning)':'var(--danger)'}">${x.perf.score}/100</strong>`},
      {label:"Dernière évaluation", render:x=>x.perf.evalLatest?fournisseurEvalScore(x.perf.evalLatest)+"/10 le "+fmtDate(x.perf.evalLatest.date):"Non évalué"},
      {label:"Incidents", render:x=>x.perf.incidents.length},
      {label:"Écarts d'audit", render:x=>x.perf.ecarts},
      {label:"Risques ouverts", render:x=>x.perf.risksOuverts} ],
    ranked, {rowRoute:x=>`fournisseurs/liste/${x.f.id}`}
  )}`;
}
function pageFournisseurVues(){
  const s = fournisseurDashboardStats();
  const views = [{id:"achats",l:"Vue Achats"},{id:"qualite",l:"Vue Qualité"},{id:"direction",l:"Vue Direction"},{id:"auditeur",l:"Vue Auditeur"}];
  const active = "achats";
  let content = "";
  if(active==="achats"){
    content = `<div class="card"><h3 class="mb-2">Vue Achats</h3><p class="text-sm">Suivi opérationnel : ${s.total} fournisseurs, ${s.evalARealiser} évaluation(s) à réaliser, ${s.actionsRetard} action(s) en retard.</p></div>`;
  }
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Vues"}])}
  ${pageHeader("Vues Achats / Qualité / Direction / Auditeur","")}
  <div class="filters-bar">${views.map(v=>`<a class="chip ${v.id==='achats'?'active':''}" data-route="fournisseurs/vues/${v.id}">${esc(v.l)}</a>`).join("")}</div>
  <div class="grid grid-2">
    <div class="card"><h3 class="mb-2">🛒 Vue Achats</h3><p class="text-sm">${s.total} fournisseurs suivis · ${s.evalARealiser} évaluation(s) à réaliser · ${s.actionsRetard} action(s) en retard.</p></div>
    <div class="card"><h3 class="mb-2">✅ Vue Qualité</h3><p class="text-sm">${s.auditsAPlanifier} audit(s) à planifier · ${s.incidentsOuverts} incident(s) ouvert(s) · ${DB.fournisseurEvaluations.length} évaluation(s) enregistrée(s).</p></div>
    <div class="card"><h3 class="mb-2">🧭 Vue Direction</h3><p class="text-sm">Taux global de maîtrise : <strong>${s.tauxMaitrise}/100</strong> · ${s.critiques} fournisseur(s) critique(s) · ${s.risquesEleves} risque(s) élevé(s).</p></div>
    <div class="card"><h3 class="mb-2">🔍 Vue Auditeur</h3><p class="text-sm">${DB.fournisseurDocuments.length} document(s) suivi(s) · ${DB.audits.filter(a=>a.type==='fournisseur').length} audit(s) fournisseur réalisé(s) ou planifié(s).</p></div>
  </div>`;
}

/* ---------- Fiche fournisseur ---------- */
function fournisseurTabsHtml(f, active){
  const tabs = [
    {id:"identification",label:"Identification"}, {id:"produits",label:"Produits & services"}, {id:"documents",label:"Documents"},
    {id:"evaluations",label:"Évaluations"}, {id:"incidents",label:"Incidents"}, {id:"risques",label:"Risques"},
    {id:"audits",label:"Audits"}, {id:"actions",label:"Actions"}, {id:"performance",label:"Performance"},
  ];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="fournisseurs/liste/${f.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}
function pageFournisseurFiche(id, tab){
  const f = getFournisseur(id);
  if(!f) return emptyState("🏭","Fournisseur introuvable","Ce fournisseur n'existe pas.");
  tab = tab || "identification";
  const perf = fournisseurPerformanceScore(id);
  const stepIndex = FOURNISSEUR_WORKFLOW_STEPS.indexOf(f.statut==="actif"?"actif":f.statut==="sous_surveillance"?"surveillance":f.statut==="suspendu"?"suspension":f.statut==="bloque"?"suspension":f.statut==="archive"?"archivage":"prospect");
  const header = `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Liste",href:"#/fournisseurs/liste"},{label:f.nomCommercial}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px;">
      <div>
        ${badge(LABELS.fournisseurCriticite[f.criticite])} ${badge(LABELS.fournisseurStatut[f.statut])}
        <h1 class="mt-2">${esc(f.nomCommercial)}</h1>
        <p class="section-sub mt-2">${esc(f.raisonSociale)} · ${(f.categories||[]).join(", ")}</p>
      </div>
      <div class="flex gap-2 items-center">
        <span style="font-weight:700;font-size:20px;color:${perf.score>=70?'var(--success)':perf.score>=50?'var(--warning)':'var(--danger)'}">${perf.score}/100</span>
        <button class="btn btn-secondary btn-sm" data-open-fournisseur-form="${f.id}">✏️</button>
      </div>
    </div>
    <div class="mt-4">${workflowStepper(FOURNISSEUR_WORKFLOW_LABELS, stepIndex<0?0:stepIndex)}</div>
  </div>
  ${fournisseurTabsHtml(f, tab)}`;
  let body = "";
  if(tab==="identification") body = frnTabIdentification(f);
  else if(tab==="produits") body = frnTabProduits(f);
  else if(tab==="documents") body = frnTabDocuments(f);
  else if(tab==="evaluations") body = frnTabEvaluations(f);
  else if(tab==="incidents") body = frnTabIncidents(f);
  else if(tab==="risques") body = frnTabRisques(f);
  else if(tab==="audits") body = frnTabAudits(f);
  else if(tab==="actions") body = frnTabActions(f);
  else if(tab==="performance") body = frnTabPerformance(f, perf);
  return header + body;
}
function frnTabIdentification(f){
  return `
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Identification</h3>
      <p class="text-sm">Raison sociale : ${esc(f.raisonSociale)}</p>
      <p class="text-sm mt-2">SIRET : ${esc(f.siret)} · TVA : ${esc(f.tva)}</p>
      <p class="text-sm mt-2">Pays : ${esc(f.pays)}</p>
      <p class="text-sm mt-2">Site web : ${esc(f.siteWeb||"—")}</p>
      <p class="text-sm mt-2">Adresse : ${esc(f.adresse)}</p>
      <p class="text-sm mt-2">Référent interne : ${esc(f.referentInterne)}</p>
      <p class="text-sm mt-2">Date d'entrée : ${fmtDate(f.dateEntree)}</p>
    </div>
    <div class="card">
      <h3 class="mb-2">Contacts</h3>
      ${(f.contacts||[]).map(c=>`<div class="rel-link"><span class="rel-name">${esc(c.nom)}</span><span class="text-sm">${esc(c.role)}</span></div>`).join("")||`<p class="text-sm">Aucun contact renseigné.</p>`}
      <h3 class="mb-2 mt-4">Criticité</h3>
      ${badge(LABELS.fournisseurCriticite[f.criticite])}
      <p class="text-sm mt-2">${esc(f.criticiteJustification||"—")}</p>
    </div>
  </div>
  <div class="card mt-4">
    <h3 class="mb-2">Processus concernés</h3>
    ${(f.processIds||[]).map(pid=>{const p=getProcess(pid); return p?`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`:"";}).join("")||`<p class="text-sm">Aucun processus associé.</p>`}
  </div>`;
}
function frnTabProduits(f){
  return `<div class="grid grid-2">${(f.produitsServices||[]).map(p=>`<div class="card"><h3>${esc(p.nom)}</h3><p class="text-sm mt-2">${esc(p.description)}</p></div>`).join("")||`<div class="card">${emptyState("📦","Aucun produit/service","Aucun produit ou service n'est encore associé à ce fournisseur.")}</div>`}</div>`;
}
function frnTabDocuments(f){
  const docs = fournisseurDocs(f.id).map(d=>({...d, statutCalcule:fournisseurDocStatusCompute(d)}));
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-fournisseur-doc-form="${f.id}">+ Ajouter un document</button></div>
  ${docs.length? dataTable(
    [ {label:"Document", render:d=>`<div class="cell-title">${esc(d.titre)}</div><div class="cell-sub">${esc(LABELS.fournisseurDocType[d.type]||d.type)}</div>`},
      {label:"Date", render:d=>fmtDate(d.date)},
      {label:"Échéance", render:d=>fmtDate(d.echeance)},
      {label:"Responsable", render:d=>esc(d.responsable)},
      {label:"Statut", render:d=>badge(LABELS.fournisseurDocStatut[d.statutCalcule])} ],
    docs
  ) : `<div class="card">${emptyState("🗂️","Aucun document","Aucun document n'est encore associé à ce fournisseur.")}</div>`}`;
}
function frnTabEvaluations(f){
  const evals = DB.fournisseurEvaluations.filter(e=>e.fournisseurId===f.id).sort((a,b)=>b.date.localeCompare(a.date));
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-fournisseur-eval-form="${f.id}">+ Nouvelle évaluation</button></div>
  ${evals.length? evals.map(e=>{
    const score = fournisseurEvalScore(e);
    const niveau = fournisseurEvalNiveau(score);
    return `<div class="card mb-2">
      <div class="flex justify-between items-center"><h3 style="font-size:14.5px;">Évaluation du ${fmtDate(e.date)} (${esc(e.periode)})</h3>${badge(LABELS.fournisseurEvalNiveau[niveau])}</div>
      <p class="text-sm mt-2">Score global : <strong>${score}/10</strong> · Évaluateur : ${esc(e.evaluateur)}</p>
      ${e.criteres.map(c=>`<div class="flex justify-between items-center mt-2"><span class="text-sm">${esc(c.nom)} (pondération ${c.ponderation}%)</span><span class="text-sm" style="font-weight:700;">${c.note}/10</span></div>${c.commentaire?`<p class="text-xs mt-2">${esc(c.commentaire)}</p>`:""}`).join("")}
    </div>`;
  }).join("") : `<div class="card">${emptyState("📊","Aucune évaluation","Aucune évaluation n'a encore été réalisée pour ce fournisseur.")}</div>`}`;
}
function frnTabIncidents(f){
  const incidents = fournisseurIncidents(f.id);
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-fournisseur-incident-form="${f.id}">+ Déclarer un incident</button></div>
  ${incidents.length? incidents.map(i=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center">${badgeRaw("info",LABELS.incidentType[i.type]||i.type)}${badge(LABELS.incidentGravite[i.gravite])}</div>
      <p class="text-sm mt-2" style="color:var(--text-primary);">${esc(i.description)}</p>
      <p class="text-xs mt-2">Impact : ${esc(i.impact)} · ${fmtDate(i.date)}</p>
      <div class="flex gap-2 mt-2" style="flex-wrap:wrap;">
        ${i.ncEventId?`<span class="badge badge-neutral" data-route="evenements/non_conformite/${i.ncEventId}" style="cursor:pointer;">NC liée →</span>`:`<button class="btn btn-secondary btn-sm" data-create-nc-from-incident="${i.id}">+ Créer une NC</button>`}
        ${i.actionId?`<span class="badge badge-neutral" data-route="actions" style="cursor:pointer;">Action liée →</span>`:`<button class="btn btn-secondary btn-sm" data-create-action-from-incident="${i.id}">+ Créer une action</button>`}
        ${i.riskId?`<span class="badge badge-neutral" data-route="risques/${i.riskId}" style="cursor:pointer;">Risque associé →</span>`:""}
      </div>
    </div>`).join("") : `<div class="card">${emptyState("🚨","Aucun incident","Aucun incident n'a été déclaré pour ce fournisseur.")}</div>`}`;
}
function frnTabRisques(f){
  const risks = fournisseurRisks(f.id);
  return risks.length? dataTable(
    [ {label:"Risque", render:r=>esc(r.name)}, {label:"Niveau", render:r=>badge(LABELS.riskLevel[r.level])},
      {label:"Responsable", render:r=>esc(r.owner)}, {label:"Statut", render:r=>badge(LABELS.riskStatus[r.status])} ],
    risks, {rowRoute:r=>`risques/${r.id}`}
  ) : `<div class="card">${emptyState("⚠️","Aucun risque","Aucun risque n'est encore identifié pour ce fournisseur.", `<button class="btn btn-primary" data-open-quick="risk" data-preset-process="${(f.processIds||[])[0]||''}">+ Identifier un risque</button>`)}</div>`;
}
function frnTabAudits(f){
  const audits = fournisseurAudits(f.id);
  return audits.length? dataTable(
    [ {label:"Audit", render:a=>esc(a.title)}, {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Constats", render:a=>a.findings.length}, {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    audits, {rowRoute:a=>`audits/${a.id}`}
  ) : `<div class="card">${emptyState("🔍","Aucun audit","Aucun audit n'a encore été réalisé pour ce fournisseur.", `<button class="btn btn-primary" data-open-audit-wizard data-preset-process="${(f.processIds||[])[0]||''}">+ Créer un audit</button>`)}</div>`;
}
function frnTabActions(f){
  const actions = fournisseurActions(f.id);
  return actions.length? actionTable(actions) : `<div class="card">${emptyState("✅","Aucune action","Aucune action n'est encore ouverte pour ce fournisseur.")}</div>`;
}
function frnTabPerformance(f, perf){
  return `
  <div class="card mb-4">
    <div class="flex items-center gap-3">
      ${ringGauge(perf.score, perf.score>=70?"var(--success)":perf.score>=50?"var(--warning)":"var(--danger)", 80)}
      <div class="kpi"><div class="val">${perf.score}/100</div><div class="lbl">Score de performance global</div></div>
    </div>
  </div>
  <div class="card">
    <h3 class="mb-2">Composantes du score</h3>
    <p class="text-sm">Dernière évaluation : ${perf.evalLatest?fournisseurEvalScore(perf.evalLatest)+"/10 le "+fmtDate(perf.evalLatest.date):"Non évaluée"}</p>
    <p class="text-sm mt-2">Incidents pris en compte : ${perf.incidents.length}</p>
    <p class="text-sm mt-2">Écarts d'audit : ${perf.ecarts}</p>
    <p class="text-sm mt-2">Risques élevés/critiques ouverts : ${perf.risksOuverts}</p>
    <p class="text-sm mt-2">Actions en retard : ${perf.actionsRetard}</p>
    <p class="text-xs mt-4">Score calculé automatiquement à partir des données réelles — jamais déclaré sans preuve.</p>
  </div>`;
}

