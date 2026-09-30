/* ============================================================
   5ter. REVUE DE DIRECTION — cockpit de pilotage
   ============================================================ */
function reviewProcessSynthesis(){
  return DB.processes.map(p=>{
    const critRisks = DB.risks.filter(r=>r.processId===p.id && r.type==="risque" && r.status==="ouvert" && r.level==="critique").length;
    const lateActions = DB.actions.filter(a=>a.processId===p.id && a.status==="retard").length;
    const openNc = DB.events.filter(e=>e.processId===p.id && e.type==="non_conformite" && e.status==="ouvert").length;
    let status = "vert";
    if(critRisks>0 || lateActions>=2) status = "rouge";
    else if(lateActions>=1 || openNc>=1) status = "orange";
    return {process:p, status, critRisks, lateActions, openNc};
  });
}

function reviewAlerts(review){
  const alerts = [];
  const lateActions = DB.actions.filter(a=>a.status==="retard");
  if(lateActions.length) alerts.push({level:"danger", text:`${lateActions.length} action(s) sont en retard.`});
  const critRisksNoAction = DB.risks.filter(r=>r.type==="risque" && r.level==="critique" && r.status==="ouvert" && !DB.actions.some(a=>a.originId===r.id));
  if(critRisksNoAction.length) alerts.push({level:"danger", text:`${critRisksNoAction.length} risque(s) critique(s) ne disposent d'aucune action de maîtrise.`});
  const ncByProcess = {};
  DB.events.filter(e=>e.type==="non_conformite").forEach(e=>{ ncByProcess[e.processId] = (ncByProcess[e.processId]||0)+1; });
  Object.entries(ncByProcess).forEach(([pid,count])=>{ if(count>=2){ const p=getProcess(pid); alerts.push({level:"warning", text:`Les non-conformités se répètent sur le processus ${p?p.name:pid} (${count} occurrences).`}); } });
  const indComplaint = getIndicator("IND-002");
  if(indComplaint && indComplaint.trend>0) alerts.push({level:"warning", text:`Les réclamations augmentent (+${indComplaint.trend}).`});
  const unfavorableAudits = DB.audits.filter(a=>a.findings.some(f=>isAuditEcart(f)) && a.status!=="cloture");
  if(unfavorableAudits.length) alerts.push({level:"warning", text:`${unfavorableAudits.length} audit(s) présentent des écarts non encore clôturés.`});
  const prevReview = review.previousReviewId ? getReview(review.previousReviewId) : null;
  if(prevReview && prevReview.decisions.length){
    const pct = Math.round(prevReview.decisions.filter(d=>d.statut==="realisee").length / prevReview.decisions.length * 100);
    alerts.push({level: pct>=80?"success":"info", text:`${pct} % des décisions de la précédente revue sont clôturées.`});
  }
  if(!alerts.some(a=>a.level==="danger")) alerts.push({level:"success", text:"Aucun point bloquant majeur n'est détecté sur les données actuellement disponibles."});
  return alerts;
}

function reviewScoreComponents(){
  const objProgressAvg = Math.round(DB.objectives.reduce((s,o)=>s+o.progress,0)/Math.max(DB.objectives.length,1));
  const auditsOk = DB.audits.filter(a=>!a.findings.some(f=>isAuditEcart(f))).length;
  const auditsPct = Math.round(auditsOk/Math.max(DB.audits.length,1)*100);
  const ncTotal = DB.events.filter(e=>e.type==="non_conformite").length;
  const ncClosed = DB.events.filter(e=>e.type==="non_conformite" && e.status==="cloture").length;
  const ncPct = ncTotal ? Math.round(ncClosed/ncTotal*100) : 100;
  const riskTotal = DB.risks.filter(r=>r.type==="risque").length;
  const riskControlled = DB.risks.filter(r=>r.type==="risque" && r.status!=="ouvert").length;
  const riskPct = riskTotal ? Math.round(riskControlled/riskTotal*100) : 100;
  const satisfaction = parseInt(getIndicator("IND-001")?.value) || 0;
  const actionsTotal = DB.actions.length;
  const actionsOnTime = DB.actions.filter(a=>a.status!=="retard").length;
  const actionsPct = actionsTotal ? Math.round(actionsOnTime/actionsTotal*100) : 100;
  const processPct = Math.round(reviewProcessSynthesis().filter(p=>p.status==="vert").length/DB.processes.length*100);
  const components = [
    {label:"Performance (objectifs)", pct:objProgressAvg},
    {label:"Audits", pct:auditsPct},
    {label:"NC / CAPA", pct:ncPct},
    {label:"Risques", pct:riskPct},
    {label:"Satisfaction", pct:satisfaction},
    {label:"Actions dans les délais", pct:actionsPct},
    {label:"Processus maîtrisés", pct:processPct},
  ];
  const global = Math.round(components.reduce((s,c)=>s+c.pct,0)/components.length);
  return {global, components};
}

function reviewAIAnalysis(review){
  const score = reviewScoreComponents();
  const bullets = [];
  bullets.push(`Le niveau global du système de management est estimé à ${score.global} % sur la base des données disponibles.`);
  const objAtteints = DB.objectives.filter(o=>o.status==="atteint").length;
  bullets.push(`${objAtteints} objectif(s) sur ${DB.objectives.length} sont atteints à ce jour.`);
  const lateActions = DB.actions.filter(a=>a.status==="retard").length;
  if(lateActions) bullets.push(`${lateActions} action(s) sont en retard et méritent une priorisation.`);
  const critOpen = DB.risks.filter(r=>r.type==="risque" && r.level==="critique" && r.status==="ouvert").length;
  if(critOpen) bullets.push(`${critOpen} risque(s) critique(s) restent ouverts.`);
  if(!lateActions && !critOpen) bullets.push(`Aucun point bloquant majeur n'est détecté sur les données actuellement disponibles.`);
  return `<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>
    <p class="text-xs mt-4">Analyse générée à partir des données disponibles dans Qonnect. Validation par la Direction requise.</p>`;
}

function reviewImprovementOpportunities(){
  const opps = [];
  DB.indicators.filter(i=>i.status!=="vert").forEach(i=>{
    opps.push({id:"OPP-IND-"+i.id, source:"Indicateur dégradé : "+i.name, analysis:`La valeur actuelle (${i.value}) est en dessous de la cible attendue.`, proposal:`Analyser les causes et définir un plan d'action sur l'indicateur ${i.name}.`});
  });
  const ncByProcess = {};
  DB.events.filter(e=>e.type==="non_conformite").forEach(e=>{ (ncByProcess[e.processId]=ncByProcess[e.processId]||[]).push(e); });
  Object.entries(ncByProcess).forEach(([pid,list])=>{ if(list.length>=2){ const p=getProcess(pid); opps.push({id:"OPP-NC-"+pid, source:"Récurrence de non-conformités — "+(p?p.name:pid), analysis:`${list.length} non-conformités ont été enregistrées sur ce processus.`, proposal:`Réaliser une analyse de cause racine transverse sur le processus ${p?p.name:pid}.`}); } });
  DB.risks.filter(r=>r.type==="risque" && (r.level==="critique"||r.level==="eleve") && r.status==="ouvert").forEach(r=>{
    opps.push({id:"OPP-RISK-"+r.id, source:`Risque ${LABELS.riskLevel[r.level].l.toLowerCase()} : ${r.name}`, analysis:r.description, proposal:`Renforcer le plan de maîtrise du risque « ${r.name} ».`});
  });
  DB.objectives.filter(o=>o.status==="en_retard" || (o.status==="en_cours" && o.progress<50)).forEach(o=>{
    opps.push({id:"OPP-OBJ-"+o.id, source:"Objectif non atteint : "+o.title, analysis:`Progression actuelle : ${o.progress} %.`, proposal:`Revoir le plan d'action associé à l'objectif « ${o.title} ».`});
  });
  DB.audits.filter(a=>a.findings.some(f=>isAuditEcart(f))).forEach(a=>{
    opps.push({id:"OPP-AUD-"+a.id, source:"Écart d'audit : "+a.title, analysis:`${a.findings.filter(f=>isAuditEcart(f)).length} écart(s) relevé(s).`, proposal:`Vérifier l'efficacité des actions correctives associées.`});
  });
  return opps;
}

const REVIEW_STEPS = ["brouillon","preparation","revue","validation","cloturee"];
const REVIEW_STEP_LABELS = ["Brouillon","Préparation","Revue","Validation","Clôture"];

function reviewTabsHtml(review, active){
  const tabs = [
    {id:"synthese",label:"Synthèse"}, {id:"decisions-precedentes",label:"Décisions précédentes"},
    {id:"contexte",label:"Contexte"}, {id:"performance",label:"Performance"}, {id:"satisfaction",label:"Satisfaction"},
    {id:"processus",label:"Processus"}, {id:"nc-capa",label:"NC / CAPA"}, {id:"audits",label:"Audits"},
    {id:"ressources",label:"Ressources"}, {id:"risques",label:"Risques"}, {id:"changements",label:"Changements"},
    {id:"amelioration",label:"Amélioration"}, {id:"decisions",label:"Décisions"}, {id:"actions",label:"Actions"},
    {id:"conclusion",label:"Conclusion"},
  ];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="revue-direction/${review.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}

function pageRevueDirection(reviewId, tab){
  const review = reviewId ? getReview(reviewId) : getLatestReview();
  if(!review) return emptyState("📅","Aucune revue de direction","Créez votre première revue de direction.", `<button class="btn btn-primary" data-open-review-form>+ Préparer la revue de direction</button>`);
  tab = tab || "synthese";
  const prevReview = review.previousReviewId ? getReview(review.previousReviewId) : null;
  const alerts = reviewAlerts(review);
  const score = reviewScoreComponents();
  const lateActionsCount = DB.actions.filter(a=>a.status==="retard").length;
  const prevDecisionRate = prevReview && prevReview.decisions.length ? Math.round(prevReview.decisions.filter(d=>d.statut==="realisee").length/prevReview.decisions.length*100) : null;
  const activeRef = DB.referentiels.find(r=>r.active);
  const stepIndex = REVIEW_STEPS.indexOf(review.status);
  const isClosed = review.status==="cloturee";

  const selector = `<select id="review-picker" style="height:40px;border:1px solid var(--border);border-radius:8px;padding:0 12px;">
    ${[...DB.managementReviews].reverse().map(r=>`<option value="${r.id}" ${r.id===review.id?"selected":""}>${esc(r.periodLabel)} — ${esc(LABELS.reviewStatus[r.status].l)}</option>`).join("")}
  </select>`;

  const header = `
  ${pageHeader("Revue de Direction", "Le cockpit de pilotage de votre système de management.",
    `${selector}<button class="btn btn-secondary" data-open-review-form>+ Nouvelle revue</button>`)}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:12px;">
      <div>
        <h2>${esc(review.periodLabel)}</h2>
        <p class="section-sub mt-2">Du ${fmtDate(review.periodStart)} au ${fmtDate(review.periodEnd)} · Revue le ${fmtDate(review.reviewDate)||"—"} · Prochaine revue : ${fmtDate(review.nextReviewDate)||"—"}${activeRef?" · Référentiel : "+esc(activeRef.name):""}</p>
      </div>
      ${badge(LABELS.reviewStatus[review.status])}
    </div>
    <div class="mt-4">${workflowStepper(REVIEW_STEP_LABELS, stepIndex)}</div>
    <div class="flex gap-2 mt-4" style="flex-wrap:wrap;">
      ${!isClosed && stepIndex<REVIEW_STEPS.length-1 ? `<button class="btn btn-primary" data-advance-review="${review.id}">Passer à l'étape suivante : ${REVIEW_STEP_LABELS[stepIndex+1]}</button>` : ""}
      ${isClosed ? `<button class="btn btn-secondary" data-new-review-version="${review.id}">Créer une nouvelle version</button>` : ""}
    </div>
  </div>
  <div class="grid grid-4 mb-2">
    <div class="card"><div class="kpi"><div class="val">${prevDecisionRate===null?"—":prevDecisionRate+" %"}</div><div class="lbl">Décisions précédentes clôturées</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${lateActionsCount?'var(--danger)':'var(--success)'}">${lateActionsCount}</div><div class="lbl">Actions en retard</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--primary)">${score.global} %</div><div class="lbl">Niveau global de performance</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${alerts.some(a=>a.level==='danger')?'var(--danger)':'var(--warning)'}">${alerts.length}</div><div class="lbl">Point(s) d'attention</div></div></div>
  </div>
  ${reviewTabsHtml(review, tab)}`;

  let body = "";
  if(tab==="synthese") body = reviewTabSynthese(review, alerts, score);
  else if(tab==="decisions-precedentes") body = reviewTabDecisionsPrecedentes(review, prevReview);
  else if(tab==="contexte") body = reviewTabContexte(review, isClosed);
  else if(tab==="performance") body = reviewTabPerformance(review);
  else if(tab==="satisfaction") body = reviewTabSatisfaction(review);
  else if(tab==="processus") body = reviewTabProcessus(review);
  else if(tab==="nc-capa") body = reviewTabNcCapa(review);
  else if(tab==="audits") body = reviewTabAudits(review);
  else if(tab==="ressources") body = reviewTabRessources(review);
  else if(tab==="risques") body = reviewTabRisques(review);
  else if(tab==="changements") body = reviewTabChangements(review);
  else if(tab==="amelioration") body = reviewTabAmelioration(review, isClosed);
  else if(tab==="decisions") body = reviewTabDecisions(review, isClosed);
  else if(tab==="actions") body = reviewTabActions(review);
  else if(tab==="conclusion") body = reviewTabConclusion(review, isClosed);

  return header + body;
}

function reviewTabSynthese(review, alerts, score){
  const kpi = (route, val, label, color)=>`<div class="card card-hover" data-route="${route}"><div class="kpi"><div class="val" style="color:${color||'var(--text-primary)'}">${val}</div><div class="lbl">${esc(label)}</div></div></div>`;
  const objAtteints = DB.objectives.filter(o=>o.status==="atteint").length;
  const ncOuvertes = DB.events.filter(e=>e.type==="non_conformite" && e.status==="ouvert").length;
  const auditsPlanifies = DB.audits.filter(a=>a.status==="planifie").length;
  const risquesOuverts = DB.risks.filter(r=>r.type==="risque" && r.status==="ouvert").length;
  const satisf = getIndicator("IND-001");

  return `
  <div class="section">
    <div class="section-head"><h2>Où en est mon système de management ?</h2></div>
    <div class="grid grid-4">
      ${kpi("objectifs", DB.objectives.length, "Objectifs ("+objAtteints+" atteints)")}
      ${kpi("objectifs", DB.indicators.filter(i=>i.status!=="vert").length, "Indicateurs hors cible", "var(--warning)")}
      ${kpi("audits", auditsPlanifies, "Audits à préparer")}
      ${kpi("evenements/non_conformite", ncOuvertes, "Non-conformités ouvertes", ncOuvertes?"var(--danger)":"var(--success)")}
      ${kpi("actions", DB.actions.filter(a=>a.status==="retard").length, "Actions / CAPA en retard", "var(--danger)")}
      ${kpi("risques", risquesOuverts, "Risques ouverts", "var(--warning)")}
      ${kpi("dashboard", satisf?satisf.value:"—", "Satisfaction / réclamations")}
      ${kpi("processus", DB.processes.length, "Processus")}
      ${kpi("changements", DB.changes.length, "Changements")}
      ${kpi(`revue-direction/${review.id}/decisions-precedentes`, review.previousReviewId?getReview(review.previousReviewId).decisions.length:0, "Décisions précédentes")}
    </div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">🔔 Points nécessitant l'attention de la Direction</h3>
      ${alerts.map(a=>`<div class="rel-link"><span class="rel-name">${a.level==="danger"?"🔴":a.level==="warning"?"🟠":a.level==="success"?"🟢":"🔵"} ${esc(a.text)}</span></div>`).join("")}
    </div>
    <div class="card">
      <h3 class="mb-2">🤖 Analyse proposée par Qonnect</h3>
      ${reviewAIAnalysis(review)}
    </div>
  </div>

  <div class="card mt-4">
    <h3 class="mb-2">📈 État du système de management — ${score.global} %</h3>
    ${score.components.map(c=>`
      <div class="flex justify-between items-center mt-2"><span class="text-sm">${esc(c.label)}</span><span class="text-sm" style="font-weight:700;">${c.pct} %</span></div>
      <div class="progress mt-2" style="margin-bottom:10px;"><div style="width:${c.pct}%;background:${c.pct>=70?'var(--success)':c.pct>=40?'var(--warning)':'var(--danger)'}"></div></div>
    `).join("")}
  </div>`;
}

function reviewTabDecisionsPrecedentes(review, prevReview){
  if(!prevReview) return `<div class="card">${emptyState("📋","Aucune revue précédente","Il s'agit de la première revue de direction enregistrée.")}</div>`;
  const rate = prevReview.decisions.length ? Math.round(prevReview.decisions.filter(d=>d.statut==="realisee").length/prevReview.decisions.length*100) : 0;
  return `
  <div class="card mb-4"><div class="kpi"><div class="val" style="color:var(--primary)">${rate} %</div><div class="lbl">Taux de réalisation des décisions de la revue « ${esc(prevReview.periodLabel)} »</div></div></div>
  ${dataTable(
    [ {label:"Décision", render:d=>`<div class="cell-title">${esc(d.decision)}</div>`},
      {label:"Responsable", render:d=>esc(d.responsable)},
      {label:"Échéance", render:d=>fmtDate(d.echeance)},
      {label:"Statut", render:d=>badge(LABELS.decisionStatus[d.statut])},
      {label:"Preuve", render:d=>esc(d.preuve||"—")},
      {label:"", render:d=>`<button class="btn btn-secondary btn-sm" data-edit-decision='${jsonAttr({reviewId:prevReview.id,decisionId:d.id})}'>Mettre à jour</button>`} ],
    prevReview.decisions
  )}`;
}

function reviewTabContexte(review, isClosed){
  return `
  ${!isClosed?`<div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-context-change-form="${review.id}">+ Ajouter un changement</button></div>`:""}
  ${review.contextChanges.length ? review.contextChanges.map(c=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center">
        <p class="text-sm" style="color:var(--text-primary)">${esc(c.text)}</p>
        ${c.confirmed?badgeRaw("success","Confirmé"):badgeRaw("warning","À confirmer")}
      </div>
      <p class="text-xs mt-2">Source : ${esc(c.source)}</p>
      ${!isClosed && !c.confirmed ? `<button class="btn btn-secondary btn-sm mt-2" data-confirm-context-change='${jsonAttr({reviewId:review.id,changeId:c.id})}'>Confirmer</button>` : ""}
    </div>`).join("")
    : `<div class="card">${emptyState("🧭","Aucun changement de contexte","Aucune évolution significative du contexte n'a été enregistrée pour cette période.")}</div>`}`;
}

function reviewTabPerformance(review){
  const objAtteints = DB.objectives.filter(o=>o.status==="atteint").length;
  const objPartiels = DB.objectives.filter(o=>o.status==="en_cours").length;
  const objNonAtteints = DB.objectives.filter(o=>o.status==="en_retard").length;
  return `
  <div class="grid grid-3 mb-4">
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${objAtteints}</div><div class="lbl">Objectifs atteints</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--warning)">${objPartiels}</div><div class="lbl">Objectifs partiellement atteints</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--danger)">${objNonAtteints}</div><div class="lbl">Objectifs non atteints</div></div></div>
  </div>
  <div class="card">
    <h3 class="mb-2">Évolution des indicateurs</h3>
    ${DB.indicators.map(i=>`<div class="rel-link" data-route="objectifs"><span class="rel-name">${esc(i.name)}</span><span class="text-sm">${esc(i.value)} · tendance ${i.trend>=0?"+":""}${i.trend} ${badge(LABELS.indStatus[i.status])}</span></div>`).join("")}
  </div>`;
}

function reviewTabSatisfaction(review){
  const satisf = getIndicator("IND-001");
  const compl = getIndicator("IND-002");
  const reclamations = DB.events.filter(e=>e.type==="reclamation");
  return `
  <div class="grid grid-2 mb-4">
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${satisf?satisf.value:"—"}</div><div class="lbl">Satisfaction globale (tendance ${satisf&&satisf.trend>=0?"+":""}${satisf?satisf.trend:"—"})</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--danger)">${compl?compl.value:"—"}</div><div class="lbl">Réclamations (tendance ${compl&&compl.trend>=0?"+":""}${compl?compl.trend:"—"})</div></div></div>
  </div>
  <div class="card">
    <h3 class="mb-2">Réclamations enregistrées</h3>
    ${reclamations.length ? dataTable(
      [ {label:"Réclamation", render:e=>`<div class="cell-title">${esc(e.title)}</div>`},
        {label:"Date", render:e=>fmtDate(e.date)},
        {label:"Statut", render:e=>badge(LABELS.eventStatus[e.status])} ],
      reclamations, {rowRoute:e=>`evenements/${e.type}/${e.id}`}
    ) : `<p class="text-sm">Aucune réclamation enregistrée sur la période.</p>`}
  </div>`;
}

function reviewTabProcessus(review){
  const synth = reviewProcessSynthesis();
  const groupLabel = {vert:"🟢 Processus maîtrisés", orange:"🟠 Processus à surveiller", rouge:"🔴 Processus nécessitant une action"};
  return `<div class="grid grid-3">${["vert","orange","rouge"].map(st=>`
    <div class="card">
      <h3 class="mb-2">${groupLabel[st]}</h3>
      ${synth.filter(s=>s.status===st).map(s=>`<div class="rel-link" data-route="processus/${s.process.id}"><span class="rel-name">${esc(s.process.name)}</span><span class="chev">›</span></div>`).join("") || `<p class="text-sm">Aucun</p>`}
    </div>`).join("")}</div>`;
}

function reviewTabNcCapa(review){
  const nc = DB.events.filter(e=>e.type==="non_conformite");
  const open = nc.filter(e=>e.status==="ouvert").length;
  const closed = nc.filter(e=>e.status==="cloture").length;
  const capaActions = DB.actions.filter(a=>a.origin==="evenement" && nc.some(e=>e.id===a.originId));
  const ncByProcess = {};
  nc.forEach(e=>{ ncByProcess[e.processId]=(ncByProcess[e.processId]||0)+1; });
  const trendAlerts = Object.entries(ncByProcess).filter(([,c])=>c>=2).map(([pid,c])=>{ const p=getProcess(pid); return `Les non-conformités liées au processus ${p?p.name:pid} sont au nombre de ${c} sur la période analysée.`; });
  return `
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val">${nc.length}</div><div class="lbl">Non-conformités totales</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--warning)">${open}</div><div class="lbl">NC ouvertes</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${closed}</div><div class="lbl">NC clôturées</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${capaActions.length}</div><div class="lbl">CAPA associées</div></div></div>
  </div>
  ${trendAlerts.length?`<div class="card mb-4">
    <h3 class="mb-2">Analyse des tendances</h3>
    ${trendAlerts.map(t=>`<p class="text-sm mt-2">⚠️ ${esc(t)}</p>`).join("")}
    <p class="text-xs mt-2">Constat généré à partir des données enregistrées dans Qonnect.</p>
  </div>`:""}
  ${dataTable(
    [ {label:"Référence", render:e=>esc(e.ref)}, {label:"Non-conformité", render:e=>`<div class="cell-title">${esc(e.title)}</div>`},
      {label:"Processus", render:e=>{const p=getProcess(e.processId); return p?esc(p.name):"—";}},
      {label:"Priorité", render:e=>badge(LABELS.priority[e.priority])}, {label:"Statut", render:e=>badge(LABELS.eventStatus[e.status])} ],
    nc, {rowRoute:e=>`evenements/${e.type}/${e.id}`}
  )}`;
}

function reviewTabAudits(review){
  const nbEcarts = DB.audits.reduce((s,a)=>s+a.findings.filter(f=>isAuditEcart(f)).length,0);
  const actionsFromAudits = DB.actions.filter(a=>a.origin==="audit");
  const cloturees = actionsFromAudits.filter(a=>a.status==="termine").length;
  const tauxCloture = actionsFromAudits.length ? Math.round(cloturees/actionsFromAudits.length*100) : 100;
  return `
  <div class="grid grid-3 mb-4">
    <div class="card"><div class="kpi"><div class="val">${DB.audits.length}</div><div class="lbl">Audits réalisés / planifiés</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${nbEcarts?'var(--warning)':'var(--success)'}">${nbEcarts}</div><div class="lbl">Écarts relevés (toutes périodes)</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--primary)">${tauxCloture} %</div><div class="lbl">Taux de clôture des actions d'audit</div></div></div>
  </div>
  ${dataTable(
    [ {label:"Audit", render:a=>`<div class="cell-title">${esc(a.title)}</div>`}, {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Écarts", render:a=>a.findings.filter(f=>isAuditEcart(f)).length}, {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    DB.audits, {rowRoute:a=>`audits/${a.id}`}
  )}`;
}

function reviewTabRessources(review){
  const skillsNeeded = [...new Set(DB.changes.flatMap(c=>c.impacted.skills||[]))];
  const rh = getProcess("PROC-006");
  const compRisk = getRisk("RISK-002");
  return `
  <div class="card mb-4">
    <h3 class="mb-2">Évaluation des ressources</h3>
    <p class="text-sm">${compRisk && compRisk.status==="ouvert" ? "⚠️ Besoins / insuffisances identifiés — voir le risque « "+esc(compRisk.name)+" »." : "🟢 Ressources jugées suffisantes sur la base des données disponibles."}</p>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Compétences à développer</h3>
      ${skillsNeeded.length ? skillsNeeded.map(s=>`<div class="rel-link"><span class="rel-name">${esc(s)}</span></div>`).join("") : `<p class="text-sm">Aucun besoin de compétence identifié via les changements en cours.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Risques liés aux ressources</h3>
      ${rh ? `<div class="rel-link" data-route="processus/${rh.id}"><span class="rel-name">🧩 ${esc(rh.name)}</span><span class="chev">›</span></div>` : ""}
      ${compRisk ? `<div class="rel-link" data-route="risques/${compRisk.id}"><span class="rel-name">⚠️ ${esc(compRisk.name)}</span>${badge(LABELS.riskLevel[compRisk.level])}</div>` : ""}
    </div>
  </div>`;
}

function reviewTabRisques(review){
  const critiques = DB.risks.filter(r=>r.type==="risque"&&r.level==="critique"&&r.status==="ouvert");
  const eleves = DB.risks.filter(r=>r.type==="risque"&&r.level==="eleve"&&r.status==="ouvert");
  const maitrises = DB.risks.filter(r=>r.type==="risque"&&r.status!=="ouvert");
  const opportunites = DB.risks.filter(r=>r.type==="opportunite");
  return `
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val" style="color:var(--danger)">${critiques.length}</div><div class="lbl">Risques critiques</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--warning)">${eleves.length}</div><div class="lbl">Risques élevés</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${maitrises.length}</div><div class="lbl">Risques maîtrisés</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--info)">${opportunites.length}</div><div class="lbl">Opportunités</div></div></div>
  </div>
  ${critiques.length?`<div class="card mb-4"><p class="text-sm">⚠️ ${critiques.length} risque(s) critique(s) restent ouverts${critiques.filter(r=>!DB.actions.some(a=>a.originId===r.id)).length?", dont "+critiques.filter(r=>!DB.actions.some(a=>a.originId===r.id)).length+" sans action arrivée à échéance":""}.</p></div>`:""}
  <div class="mt-2 mb-4"><button class="btn btn-secondary btn-sm" data-route="risques">Ouvrir le registre des risques →</button></div>
  <div class="card">
    <h3 class="mb-2">🏭 Performance des fournisseurs</h3>
    ${(()=>{
      const s = fournisseurDashboardStats();
      const risque = [...DB.fournisseurs].map(f=>({f, perf:fournisseurPerformanceScore(f.id)})).sort((a,b)=>a.perf.score-b.perf.score).slice(0,3);
      return `<div class="grid grid-4 mb-4">
        <div class="kpi"><div class="val" style="color:var(--primary)">${s.tauxMaitrise}/100</div><div class="lbl">Maîtrise globale</div></div>
        <div class="kpi"><div class="val" style="color:${s.critiques?'var(--warning)':'var(--success)'}">${s.critiques}</div><div class="lbl">Fournisseurs critiques</div></div>
        <div class="kpi"><div class="val" style="color:${s.incidentsOuverts?'var(--danger)':'var(--success)'}">${s.incidentsOuverts}</div><div class="lbl">Incidents ouverts</div></div>
        <div class="kpi"><div class="val" style="color:${s.actionsRetard?'var(--danger)':'var(--success)'}">${s.actionsRetard}</div><div class="lbl">Actions en retard</div></div>
      </div>
      <p class="text-xs mb-2">FOURNISSEURS À SURVEILLER</p>
      ${risque.map(x=>`<div class="rel-link" data-route="fournisseurs/liste/${x.f.id}"><span class="rel-name">${esc(x.f.nomCommercial)}</span><span class="text-sm" style="font-weight:700;color:${x.perf.score<50?'var(--danger)':'var(--warning)'}">${x.perf.score}/100</span></div>`).join("")}
      <div class="mt-2"><button class="btn btn-secondary btn-sm" data-route="fournisseurs">Ouvrir le module Fournisseurs →</button></div>`;
    })()}
  </div>`;
}

function reviewTabChangements(review){
  return dataTable(
    [ {label:"Changement", render:c=>`<div class="cell-title">${esc(c.title)}</div><div class="cell-sub">${esc(c.description)}</div>`},
      {label:"Responsable", render:c=>esc(c.requestedBy)},
      {label:"Étape", render:c=>esc(QONNECT_SEED.changeSteps[c.step])} ],
    DB.changes, {rowRoute:c=>`changements/${c.id}`}
  );
}

function reviewTabAmelioration(review, isClosed){
  const opps = reviewImprovementOpportunities();
  return opps.length ? opps.map(o=>`
    <div class="card mb-2">
      <div class="text-xs">OPPORTUNITÉ DÉTECTÉE</div>
      <h3 class="mt-2">${esc(o.source)}</h3>
      <p class="text-sm mt-2">${esc(o.analysis)}</p>
      <div class="text-xs mt-4">PROPOSITION</div>
      <p class="text-sm mt-2">${esc(o.proposal)}</p>
      ${!isClosed?`<button class="btn btn-secondary btn-sm mt-4" data-convert-opportunity='${jsonAttr({reviewId:review.id,source:o.source,proposal:o.proposal})}'>+ Transformer en décision</button>`:""}
    </div>`).join("")
    : `<div class="card">${emptyState("🟢","Aucune opportunité détectée","Aucune faiblesse récurrente n'est détectée sur les données actuelles.")}</div>`;
}

function reviewTabDecisions(review, isClosed){
  return `
  ${!isClosed?`<div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-decision-form="${review.id}">+ Nouvelle décision</button></div>`:""}
  ${review.decisions.length ? review.decisions.map(d=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center"><h3>${esc(d.decision)}</h3>${badge(LABELS.decisionStatus[d.statut])}</div>
      <p class="text-sm mt-2"><strong>Contexte :</strong> ${esc(d.contexte)}</p>
      <p class="text-sm mt-2"><strong>Justification :</strong> ${esc(d.justification)}</p>
      <div class="grid grid-3 mt-4">
        <div><div class="text-xs">RESPONSABLE</div><div class="text-sm" style="color:var(--text-primary)">${esc(d.responsable)}</div></div>
        <div><div class="text-xs">ÉCHÉANCE</div><div class="text-sm" style="color:var(--text-primary)">${fmtDate(d.echeance)}</div></div>
        <div><div class="text-xs">PRIORITÉ</div>${badge(LABELS.priority[d.priorite])}</div>
      </div>
      ${d.indicatorId?`<p class="text-xs mt-2">Indicateur associé : ${esc(getIndicator(d.indicatorId)?.name||d.indicatorId)}</p>`:""}
      ${d.actionId?`<p class="text-xs mt-2">✅ Action créée : ${esc(getAction(d.actionId)?.title||d.actionId)} <span style="cursor:pointer;color:var(--primary);" data-route="actions">(voir)</span></p>`
        : (!isClosed?`<button class="btn btn-secondary btn-sm mt-2" data-create-action-from-decision='${jsonAttr({reviewId:review.id,decisionId:d.id})}'>+ Créer l'action</button>`:"")}
      ${!isClosed?`<button class="btn btn-secondary btn-sm mt-2" data-edit-decision='${jsonAttr({reviewId:review.id,decisionId:d.id})}'>Modifier le statut / la preuve</button>`:""}
    </div>`).join("")
    : `<div class="card">${emptyState("📝","Aucune décision","Ajoutez les décisions prises lors de cette revue de direction.")}</div>`}`;
}

function reviewTabActions(review){
  const reviewActions = DB.actions.filter(a=>a.origin==="revue_direction");
  return reviewActions.length ? actionTable(reviewActions) : `<div class="card">${emptyState("✅","Aucune action","Aucune action n'a encore été créée depuis une revue de direction.")}</div>`;
}

function reviewTabConclusion(review, isClosed){
  const c = review.conclusion;
  return `
  <div class="card mb-4">
    <h3 class="mb-2">Adéquation du système de management</h3>
    <p class="text-sm">Pertinence : le système répond-il toujours aux besoins de l'organisation ? · Adéquation : les ressources sont-elles suffisantes ? · Efficacité : les résultats attendus sont-ils atteints ? · Amélioration : quels changements sont nécessaires ?</p>
  </div>
  <div class="card">
    <h3 class="mb-2">Conclusion de la Direction</h3>
    <div class="grid grid-2">
      <div class="field"><label>Système de management</label>
        <select id="concl-smq" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionSmq).map(([v,l])=>`<option value="${v}" ${c.smq===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label>Performance</label>
        <select id="concl-performance" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionPerf).map(([v,l])=>`<option value="${v}" ${c.performance===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label>Ressources</label>
        <select id="concl-ressources" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionRessources).map(([v,l])=>`<option value="${v}" ${c.ressources===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label>Amélioration</label>
        <select id="concl-amelioration" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionAmelioration).map(([v,l])=>`<option value="${v}" ${c.amelioration===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
    </div>
    <div class="field mt-2"><label>Commentaires de la Direction</label><textarea id="concl-commentaire" ${isClosed?"disabled":""}>${esc(c.commentaire)}</textarea></div>
    ${!isClosed?`<button class="btn btn-primary" data-save-conclusion="${review.id}">Enregistrer la conclusion</button>`:""}
  </div>

  <div class="card mt-4">
    <h3 class="mb-2">Sorties de la revue de direction</h3>
    <div class="quick-actions">
      <button class="btn btn-secondary" data-generate-report="${review.id}">📄 Générer le compte-rendu</button>
      <button class="btn btn-secondary" data-route="actions">🗂 Voir le plan d'actions</button>
      <button class="btn btn-secondary" data-route="revue-direction/${review.id}/resume">📊 Voir la synthèse Direction</button>
    </div>
  </div>`;
}

/* ---------- Synthèse Direction (sortie courte) ---------- */
function pageRevueSynthese(review){
  const score = reviewScoreComponents();
  const opps = reviewImprovementOpportunities().slice(0,5);
  const alerts = reviewAlerts(review);
  const forces = alerts.filter(a=>a.level==="success").concat(
    DB.objectives.filter(o=>o.status==="atteint").map(o=>({text:"Objectif atteint : "+o.title}))
  ).slice(0,5);
  const vigilance = alerts.filter(a=>a.level==="danger"||a.level==="warning").slice(0,5);
  const majorDecisions = review.decisions.slice(0,5);
  const priorityActions = DB.actions.filter(a=>a.status!=="termine").sort((a,b)=>({critique:0,haute:1,moyenne:2,basse:3}[a.priority]-({critique:0,haute:1,moyenne:2,basse:3}[b.priority]))).slice(0,5);

  return `
  ${breadcrumb([{label:"Revue de Direction",href:"#/revue-direction/"+review.id},{label:"Synthèse Direction"}])}
  ${pageHeader("Synthèse Direction — "+review.periodLabel, "L'essentiel à retenir de cette revue de direction.")}
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">5 chiffres clés</h3>
      <p class="text-sm">Niveau global du SMQ : <strong>${score.global} %</strong></p>
      <p class="text-sm mt-2">Objectifs atteints : <strong>${DB.objectives.filter(o=>o.status==="atteint").length}/${DB.objectives.length}</strong></p>
      <p class="text-sm mt-2">Actions en retard : <strong>${DB.actions.filter(a=>a.status==="retard").length}</strong></p>
      <p class="text-sm mt-2">Risques critiques ouverts : <strong>${DB.risks.filter(r=>r.type==="risque"&&r.level==="critique"&&r.status==="ouvert").length}</strong></p>
      <p class="text-sm mt-2">Décisions de cette revue : <strong>${review.decisions.length}</strong></p>
    </div>
    <div class="card">
      <h3 class="mb-2">Points forts</h3>
      ${forces.length?forces.map(f=>`<p class="text-sm mt-2">🟢 ${esc(f.text)}</p>`).join(""):`<p class="text-sm">—</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Points de vigilance</h3>
      ${vigilance.length?vigilance.map(v=>`<p class="text-sm mt-2">${v.level==="danger"?"🔴":"🟠"} ${esc(v.text)}</p>`).join(""):`<p class="text-sm">—</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Décisions majeures</h3>
      ${majorDecisions.length?majorDecisions.map(d=>`<p class="text-sm mt-2">• ${esc(d.decision)}</p>`).join(""):`<p class="text-sm">—</p>`}
    </div>
  </div>
  <div class="card mt-4">
    <h3 class="mb-2">Actions prioritaires</h3>
    ${priorityActions.length?priorityActions.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">${esc(a.title)}</span>${badge(LABELS.priority[a.priority])}</div>`).join(""):`<p class="text-sm">Aucune action prioritaire en cours.</p>`}
  </div>`;
}

