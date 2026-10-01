/* ============================================================
   12. AUDITS — processus d'audit complet et transversal
   ============================================================ */

/* ---------- Helpers ---------- */
function resolveExigence(id){
  if(!id) return null;
  const legacy = findBy(DB.requirements, id);
  if(legacy) return {ref:legacy.ref, label:legacy.label, referentielId:"ISO9001"};
  const custom = getCustomExigence(id);
  if(custom){
    /* Si le chapitre contient plusieurs exigences, on ajoute un extrait de la phrase pour les distinguer. */
    const siblings = DB.customExigences.filter(e=>e.referentielId===custom.referentielId && e.ref===custom.ref);
    const extra = siblings.length>1 ? exigenceExcerpt(custom,80) : "";
    return {ref:custom.ref, label:custom.title+(extra?" — "+extra:""), referentielId:custom.referentielId};
  }
  return null;
}
function auditConformityRate(a){
  const evaluated = a.questions.filter(q=>["conforme","partiellement_conforme","non_conforme"].includes(q.statut));
  if(!evaluated.length) return null;
  const conformeCount = evaluated.filter(q=>q.statut==="conforme").length;
  return Math.round(conformeCount/evaluated.length*100);
}
function auditProcessHistory(a){
  return DB.audits.filter(x=>x.processId===a.processId && x.id!==a.id).sort((x,y)=>x.date.localeCompare(y.date));
}
function auditRuleBasedAnalysis(a){
  const history = auditProcessHistory(a);
  const bullets = [];
  a.findings.filter(isAuditEcart).forEach(f=>{
    if(!f.requirementId) return;
    const recurrence = history.filter(h=>h.findings.some(hf=>isAuditEcart(hf) && hf.requirementId===f.requirementId));
    if(recurrence.length){
      const ex = resolveExigence(f.requirementId);
      bullets.push({fact:`Écart constaté sur ${ex?ex.ref:f.requirementId} — déjà relevé lors de ${recurrence.length} audit(s) précédent(s) de ce processus.`, analysis:"Une analyse de cause systémique est recommandée plutôt qu'une action ponctuelle."});
    }
  });
  if(!bullets.length) bullets.push({fact:"Aucune récurrence détectée entre cet audit et les audits précédents de ce processus.", analysis:"Sur la base des données actuellement disponibles."});
  return bullets;
}
function generateAuditQuestions(processIds, referentielIds){
  const qs = [];
  (referentielIds && referentielIds.length ? referentielIds : ["ISO9001"]).forEach(refId=>{
    const order = {non_couvert:0,partiellement:1,a_renforcer:2,maitrise:3,optimise:4};
    const views = getReferentielExigenceViews(refId).filter(v=>v.process && processIds.includes(v.process.id)).sort((a,b)=>order[a.level]-order[b.level]);
    views.slice(0,5).forEach(v=>{
      qs.push({ id:"Q-"+Math.random().toString(36).slice(2,8), question:`Comment l'exigence ${v.ref} — ${v.title} est-elle mise en œuvre et démontrée ?`,
        requirementId:v.id, processId:v.process.id, critere:v.ref, preuveAttendue:"Procédure, enregistrement ou indicateur associé", responsableInterroge:v.process.pilot, statut:"non_evalue", commentaire:"", preuveIds:[] });
    });
  });
  processIds.forEach(pid=>{
    const p = getProcess(pid);
    const topRisk = DB.risks.filter(r=>r.processId===pid && r.type==="risque" && r.status==="ouvert").sort((a,b)=>(b.probability*b.impact)-(a.probability*a.impact))[0];
    if(topRisk) qs.push({ id:"Q-"+Math.random().toString(36).slice(2,8), question:`Comment le risque « ${topRisk.name} » est-il maîtrisé ?`, requirementId:null, processId:pid, critere:topRisk.name, preuveAttendue:"Plan de maîtrise du risque", responsableInterroge:p?p.pilot:"", statut:"non_evalue", commentaire:"", preuveIds:[] });
    const priorNc = DB.events.filter(e=>e.processId===pid && e.type==="non_conformite")[0];
    if(priorNc) qs.push({ id:"Q-"+Math.random().toString(36).slice(2,8), question:`L'action corrective suite à « ${priorNc.title} » est-elle efficace ?`, requirementId:null, processId:pid, critere:priorNc.ref, preuveAttendue:"Preuve de vérification d'efficacité", responsableInterroge:p?p.pilot:"", statut:"non_evalue", commentaire:"", preuveIds:[] });
  });
  return qs.slice(0,10);
}

/* ---------- Tableau de bord & programme ---------- */
function pageAudits(){
  const today = new Date().toISOString().slice(0,10);
  const scopedAudits = DB.audits.filter(matchesScope);
  const aVenir = scopedAudits.filter(a=>a.status==="planifie" && a.date>=today);
  const enRetard = scopedAudits.filter(a=>["planifie","preparation"].includes(a.status) && a.date<today);
  const enCours = scopedAudits.filter(a=>["preparation","en_cours","analyse","synthese","a_valider"].includes(a.status));
  const clotures = scopedAudits.filter(a=>["valide","cloture"].includes(a.status));
  const ncIssues = scopedAudits.reduce((s,a)=>s+a.findings.filter(isAuditEcart).length,0);
  const actionsAudit = DB.actions.filter(a=>a.origin==="audit" && a.status!=="termine" && matchesScope(a));
  const rates = scopedAudits.map(auditConformityRate).filter(r=>r!==null);
  const tauxGlobal = rates.length? Math.round(rates.reduce((s,r)=>s+r,0)/rates.length) : null;

  return `
  ${pageHeader("Audits","Le pilotage transversal de vos audits — de la préparation à la revue de direction.",
    `<button class="btn btn-secondary" data-route="audits/programme">📅 Programme d'audit</button><button class="btn btn-primary" data-open-audit-wizard>+ Nouvel audit</button>`)}
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val">${aVenir.length}</div><div class="lbl">Audits à venir</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--warning)">${enCours.length}</div><div class="lbl">Audits en cours</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${enRetard.length?'var(--danger)':'var(--success)'}">${enRetard.length}</div><div class="lbl">Audits en retard</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${clotures.length}</div><div class="lbl">Audits clôturés</div></div></div>
  </div>
  <div class="grid grid-3 mb-4">
    <div class="card"><div class="kpi"><div class="val" style="color:var(--danger)">${ncIssues}</div><div class="lbl">Écarts / NC issus des audits</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${actionsAudit.length}</div><div class="lbl">Actions en cours (origine audit)</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--primary)">${tauxGlobal===null?"—":tauxGlobal+" %"}</div><div class="lbl">Taux de conformité moyen</div></div></div>
  </div>
  ${dataTable(
    [ {label:"Réf.", render:a=>esc(a.ref||a.id)},
      {label:"Audit", render:a=>`<div class="cell-title">${esc(a.title)}</div><div class="cell-sub">${esc(LABELS.auditType[a.type]||a.type||"—")}</div>`},
      {label:"Processus", render:a=>{const p=getProcess(a.processId); return p?esc(p.name):"—";}},
      {label:"Responsable", render:a=>esc(a.responsable||a.auditor)},
      {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Constats", render:a=>a.findings.length},
      {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    scopedAudits, {rowRoute:a=>`audits/${a.id}`, emptyEmoji:"🔍", emptyTitle:"Aucun audit", emptyText:"Aucun audit n'est encore planifié."}
  )}`;
}

function pageAuditProgramme(){
  const rows = DB.processes.map(p=>{
    const processAudits = DB.audits.filter(a=>a.processId===p.id).sort((a,b)=>a.date.localeCompare(b.date));
    const last = processAudits.filter(a=>["valide","cloture"].includes(a.status)).slice(-1)[0];
    const next = processAudits.find(a=>["planifie","preparation"].includes(a.status));
    const critRisk = DB.risks.some(r=>r.processId===p.id && r.type==="risque" && r.status==="ouvert" && r.level==="critique");
    const highRisk = DB.risks.some(r=>r.processId===p.id && r.type==="risque" && r.status==="ouvert" && r.level==="eleve");
    const ncCount = DB.events.filter(e=>e.processId===p.id && e.type==="non_conformite").length;
    const monthsSinceLast = last ? Math.round((Date.now()-new Date(last.date+"T00:00:00").getTime())/(1000*3600*24*30)) : 999;
    let score = 0;
    if(critRisk) score+=3; else if(highRisk) score+=2;
    score += Math.min(ncCount,3);
    if(monthsSinceLast>12) score+=2; else if(monthsSinceLast>6) score+=1;
    if(!last) score+=3;
    const priorite = score>=5?"haute":score>=3?"moyenne":"basse";
    return {process:p, last, next, priorite, critRisk};
  }).sort((a,b)=>({haute:0,moyenne:1,basse:2}[a.priorite])-({haute:0,moyenne:1,basse:2}[b.priorite]));

  return `
  ${breadcrumb([{label:"Audits",href:"#/audits"},{label:"Programme d'audit"}])}
  ${pageHeader("Programme d'audit","Priorités suggérées selon la criticité des processus, les risques, l'historique des écarts et l'ancienneté du dernier audit.")}
  ${dataTable(
    [ {label:"Processus", render:r=>esc(r.process.name)},
      {label:"Risque critique", render:r=>r.critRisk?badgeRaw("danger","Oui"):badgeRaw("neutral","Non")},
      {label:"Dernier audit", render:r=>r.last?fmtDate(r.last.date):"Jamais audité"},
      {label:"Prochain audit", render:r=>r.next?fmtDate(r.next.date):"Non planifié"},
      {label:"Priorité suggérée", render:r=>badge(LABELS.priority[r.priorite])},
      {label:"", render:r=>`<button class="btn btn-secondary btn-sm" data-open-audit-wizard data-preset-process="${r.process.id}">+ Planifier</button>`} ],
    rows
  )}`;
}

/* ---------- Fiche audit ---------- */
function auditTabsHtml(a, active){
  const tabs = [
    {id:"resume",label:"Résumé"}, {id:"perimetre",label:"Périmètre & objectifs"}, {id:"grille",label:"Grille d'audit"},
    {id:"constats",label:"Constats ("+a.findings.length+")"}, {id:"parties",label:"Parties prenantes"}, {id:"analyse",label:"Analyse"},
    {id:"tracabilite",label:"Traçabilité"}, {id:"rapport",label:"Rapport"}, {id:"validation",label:"Validation"},
  ];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="audits/${a.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}

function pageAuditFiche(id, tab, qIdx){
  const a = getAudit(id);
  if(!a) return emptyState("🔍","Audit introuvable","Cet audit n'existe pas.");
  tab = tab || "resume";
  const p = getProcess(a.processId);
  const isLocked = a.status==="cloture";
  const stepIndex = AUDIT_WORKFLOW_STEPS.indexOf(a.status);

  const header = `
  ${breadcrumb([{label:"Audits",href:"#/audits"},{label:a.title}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px;">
      <div>
        <span class="badge badge-neutral">${esc(a.ref||a.id)}</span> ${badge(LABELS.auditStatus[a.status])}
        <h1 class="mt-2">${esc(a.title)}</h1>
        <p class="section-sub mt-2">${esc(LABELS.auditType[a.type]||a.type||"—")} · Processus : ${p?esc(p.name):"—"} · Responsable : ${esc(a.responsable||a.auditor)} · Date : ${fmtDate(a.date)}${a.site?" · Site : "+esc(a.site):""}</p>
      </div>
    </div>
    <div class="mt-4">${workflowStepper(AUDIT_WORKFLOW_LABELS, stepIndex<0?0:stepIndex)}</div>
    <div class="flex gap-2 mt-4" style="flex-wrap:wrap;">
      ${!isLocked && stepIndex<AUDIT_WORKFLOW_STEPS.length-1 ? `<button class="btn btn-primary" data-advance-audit="${a.id}">Passer à l'étape suivante : ${AUDIT_WORKFLOW_LABELS[stepIndex+1]}</button>` : ""}
      ${isLocked?`<span class="badge badge-neutral"><span class="badge-dot"></span>Audit clôturé — verrouillé</span>`:""}
    </div>
  </div>
  ${auditTabsHtml(a, tab)}`;

  let body = "";
  if(tab==="resume") body = auditTabResume(a);
  else if(tab==="perimetre") body = auditTabPerimetre(a, isLocked);
  else if(tab==="grille") body = auditTabGrille(a, qIdx, isLocked);
  else if(tab==="constats") body = auditTabConstats(a, isLocked);
  else if(tab==="parties") body = auditTabParties(a, isLocked);
  else if(tab==="analyse") body = auditTabAnalyse(a);
  else if(tab==="tracabilite") body = auditTabTracabilite(a);
  else if(tab==="rapport") body = auditTabRapport(a);
  else if(tab==="validation") body = auditTabValidation(a, isLocked);
  return header + body;
}

function auditTabResume(a){
  const rate = auditConformityRate(a);
  const forces = a.findings.filter(f=>f.type==="point_fort").slice(0,3);
  const vigilance = a.findings.filter(f=>f.type==="vigilance"||f.type==="opportunite").slice(0,3);
  const ncCount = a.findings.filter(isAuditEcart).length;
  const oppCount = a.findings.filter(f=>f.type==="opportunite").length;
  const actionsCount = a.findings.filter(f=>f.actionId).length;
  return `
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Périmètre</h3>
      <p class="text-sm">${esc(a.perimeter?.activites||a.scope||"—")}</p>
      <p class="text-xs mt-2">${a.perimeter?.periodeDebut?"Période : "+fmtDate(a.perimeter.periodeDebut)+" → "+fmtDate(a.perimeter.periodeFin):""}</p>
      ${a.perimeter?.exclusions?`<p class="text-xs mt-2">Exclusions : ${esc(a.perimeter.exclusions)}</p>`:""}
    </div>
    <div class="card">
      <h3 class="mb-2">Objectifs</h3>
      ${(a.objectifs&&a.objectifs.length?a.objectifs:[a.objective]).filter(Boolean).map(o=>`<p class="text-sm mt-2">• ${esc(o)}</p>`).join("")}
    </div>
  </div>
  <div class="card mt-4">
    <h3 class="mb-2">Résultat</h3>
    <div class="flex items-center gap-3">
      ${rate!==null?ringGauge(rate,"var(--primary)",72):""}
      <div class="kpi"><div class="val">${rate===null?"—":rate+" %"}</div><div class="lbl">des critères vérifiés sont conformes</div></div>
    </div>
    <div class="grid grid-4 mt-4">
      <div class="kpi"><div class="val" style="color:var(--danger)">${ncCount}</div><div class="lbl">Non-conformités / écarts</div></div>
      <div class="kpi"><div class="val" style="color:var(--warning)">${oppCount}</div><div class="lbl">Opportunités d'amélioration</div></div>
      <div class="kpi"><div class="val">${actionsCount}</div><div class="lbl">Actions</div></div>
      <div class="kpi"><div class="val">${a.questions.length}</div><div class="lbl">Questions</div></div>
    </div>
  </div>
  <div class="grid grid-2 mt-4">
    <div class="card">
      <h3 class="mb-2">🟢 Points forts</h3>
      ${forces.length?forces.map(f=>`<p class="text-sm mt-2">${esc(f.text)}</p>`).join(""):`<p class="text-sm">Aucun point fort enregistré pour le moment.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">🟠 Points de vigilance</h3>
      ${vigilance.length?vigilance.map(f=>`<p class="text-sm mt-2">${esc(f.text)}</p>`).join(""):`<p class="text-sm">Aucun point de vigilance enregistré.</p>`}
    </div>
  </div>`;
}

function auditTabPerimetre(a, isLocked){
  const pr = a.perimeter || {};
  const processesNames = (a.processIds||[a.processId]).filter(Boolean).map(id=>{const p=getProcess(id); return p?p.name:id;});
  const docs = (a.criteres?.documentIds||[]).map(getDocument).filter(Boolean);
  const reqs = (a.criteres?.requirementIds||[]).map(resolveExigence).filter(Boolean);
  return `
  <div class="card mb-4">
    <div class="flex justify-between items-center mb-2"><h3>Périmètre de l'audit</h3>${!isLocked?`<button class="btn btn-secondary btn-sm" data-edit-audit-perimeter="${a.id}">✏️ Modifier</button>`:""}</div>
    <p class="text-sm">Processus : ${processesNames.map(esc).join(", ")||"—"}</p>
    <p class="text-sm mt-2">Site : ${esc(a.site||"—")}</p>
    <p class="text-sm mt-2">Activités : ${esc(pr.activites||"—")}</p>
    ${pr.produits?`<p class="text-sm mt-2">Produits / services : ${esc(pr.produits)}</p>`:""}
    <p class="text-sm mt-2">Période auditée : ${pr.periodeDebut?fmtDate(pr.periodeDebut)+" → "+fmtDate(pr.periodeFin):"—"}</p>
    <p class="text-sm mt-2">Exclusions : ${esc(pr.exclusions||"Aucune")}</p>
    <p class="text-sm mt-2">Motifs : ${(a.motifs||[]).map(m=>esc(LABELS.auditMotif[m]||m)).join(", ")||"—"}</p>
  </div>
  <div class="card mb-4">
    <h3 class="mb-2">Objectifs</h3>
    ${(a.objectifs&&a.objectifs.length?a.objectifs:[a.objective]).filter(Boolean).map(o=>`<p class="text-sm mt-2">• ${esc(o)}</p>`).join("")}
  </div>
  <div class="card">
    <h3 class="mb-2">Critères d'audit</h3>
    <p class="text-xs mb-2">RÉFÉRENTIEL(S)</p>
    <p class="text-sm">${(a.referentielIds||[]).map(id=>{const r=getReferentiel(id); return r?esc(r.name):esc(id);}).join(", ")||"—"}</p>
    <p class="text-xs mb-2 mt-4">EXIGENCES</p>
    ${reqs.length?reqs.map(r=>`<div class="rel-link"><span class="rel-name">${esc(r.ref)} — ${esc(r.label)}</span></div>`).join(""):`<p class="text-sm">Aucune exigence sélectionnée.</p>`}
    <p class="text-xs mb-2 mt-4">DOCUMENTS APPLICABLES</p>
    ${docs.length?docs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span></div>`).join(""):`<p class="text-sm">Aucun document applicable sélectionné.</p>`}
  </div>`;
}

function auditTabGrille(a, qIdx, isLocked){
  const total = a.questions.length;
  if(!total){
    return `<div class="card">${emptyState("📋","Aucune question","Générez ou ajoutez des questions pour construire la grille d'audit.",
      `<button class="btn btn-primary" data-generate-questions="${a.id}">🧠 Générer des questions</button>`)}</div>`;
  }
  let idx = qIdx!=null ? parseInt(qIdx,10) : 0;
  if(isNaN(idx) || idx<0) idx = 0;
  if(idx>=total) idx = total-1;
  const q = a.questions[idx];
  const answered = a.questions.filter(x=>x.statut!=="non_evalue").length;
  const ex = resolveExigence(q.requirementId);
  const proc = getProcess(q.processId);
  const availableDocs = DB.documents.filter(d=>d.status!=="obsolete");

  return `
  <div class="card mb-4">
    <div class="flex justify-between items-center"><span class="text-sm" style="font-weight:700;">${answered} / ${total} questions évaluées</span>
      ${!isLocked?`<button class="btn btn-secondary btn-sm" data-generate-questions="${a.id}">🧠 Générer plus</button>`:""}
    </div>
    <div class="progress mt-2"><div style="width:${Math.round(answered/total*100)}%"></div></div>
  </div>
  <div class="card mb-4">
    <div class="flex justify-between items-center">${badge(LABELS.questionStatus[q.statut])}${ex?badgeRaw("info",ex.ref):""}</div>
    <h3 class="mt-2">${esc(q.question)}</h3>
    <p class="text-xs mt-4">PROCESSUS</p><p class="text-sm">${proc?esc(proc.name):"—"}</p>
    <p class="text-xs mt-4">CRITÈRE</p><p class="text-sm">${esc(q.critere||"—")}</p>
    <p class="text-xs mt-4">PREUVE ATTENDUE</p><p class="text-sm">${esc(q.preuveAttendue||"—")}</p>
    <p class="text-xs mt-4">RESPONSABLE INTERROGÉ</p><p class="text-sm">${esc(q.responsableInterroge||"—")}</p>
    ${!isLocked?`
    <div class="field mt-4"><label>Statut</label><select id="q-statut">${Object.entries(LABELS.questionStatus).map(([v,l])=>`<option value="${v}" ${q.statut===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
    <div class="field"><label>Commentaire / réponse</label><textarea id="q-comment">${esc(q.commentaire)}</textarea></div>
    <div class="field"><label>Preuve(s) constatée(s) — sélectionner un document déjà présent dans Qonnect</label>
      <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
        ${availableDocs.map(d=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="q-preuve-cb" value="${d.id}" ${q.preuveIds.includes(d.id)?"checked":""} style="width:auto;"> ${esc(d.title)}</label>`).join("")}
      </div>
    </div>
    <button class="btn btn-primary" data-save-question='${jsonAttr({auditId:a.id, questionId:q.id, qIdx:idx})}'>Enregistrer la réponse</button>
    `:`
    <p class="text-sm mt-4"><strong>Commentaire :</strong> ${esc(q.commentaire||"—")}</p>
    ${q.preuveIds.length?`<p class="text-xs mt-4">PREUVES</p>${q.preuveIds.map(id=>{const d=getDocument(id); return d?`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span></div>`:"";}).join("")}`:""}
    `}
    <div class="flex justify-between mt-4">
      <button class="btn btn-secondary" ${idx<=0?"disabled":""} data-route="audits/${a.id}/grille/${idx-1}">← Précédent</button>
      <button class="btn btn-secondary" ${idx>=total-1?"disabled":""} data-route="audits/${a.id}/grille/${idx+1}">Suivant →</button>
    </div>
  </div>
  ${!isLocked?`<div class="mb-2"><button class="btn btn-secondary btn-sm" data-add-question="${a.id}">+ Ajouter une question manuelle</button></div>`:""}
  <div class="card card-flush table-wrap">
    <table class="dt"><thead><tr><th>#</th><th>Question</th><th>Statut</th></tr></thead><tbody>
      ${a.questions.map((qq,i)=>`<tr class="clickable" data-route="audits/${a.id}/grille/${i}" style="${i===idx?'background:var(--primary-soft);':''}"><td>${i+1}</td><td>${esc(qq.question)}</td><td>${badge(LABELS.questionStatus[qq.statut])}</td></tr>`).join("")}
    </tbody></table>
  </div>`;
}

function auditTabConstats(a, isLocked){
  return `
  ${!isLocked?`<div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-quick="finding" data-preset-audit="${a.id}">+ Ajouter un constat</button></div>`:""}
  ${a.findings.length? a.findings.map(f=>{
    const ct = LABELS.constatType[f.type]||{l:f.type,c:"neutral",e:""};
    const ex = resolveExigence(f.requirementId);
    return `<div class="card mb-2">
      <div class="flex justify-between items-center">${badge(ct)}${f.gravite?badgeRaw("neutral",LABELS.constatGravite[f.gravite]):""}</div>
      <p class="text-sm mt-2" style="color:var(--text-primary)">${esc(f.text)}</p>
      ${ex?`<p class="text-xs mt-2">Exigence : ${esc(ex.ref)} — ${esc(ex.label)}</p>`:""}
      ${f.cause?`<p class="text-xs mt-2">Cause potentielle : ${esc(f.cause)}</p>`:""}
      <div class="flex gap-2 mt-2" style="flex-wrap:wrap;">
        ${f.ncEventId?`<span class="badge badge-neutral" data-route="evenements/non_conformite/${f.ncEventId}" style="cursor:pointer;">NC créée →</span>`:(isAuditEcart(f)&&!isLocked?`<button class="btn btn-secondary btn-sm" data-create-nc-from-constat='${jsonAttr({auditId:a.id, constatId:f.id})}'>+ Créer une NC</button>`:"")}
        ${f.actionId?`<span class="badge badge-neutral" data-route="actions" style="cursor:pointer;">Action créée →</span>`:(!isLocked?`<button class="btn btn-secondary btn-sm" data-create-action-from-constat='${jsonAttr({auditId:a.id, constatId:f.id})}'>+ Créer une action</button>`:"")}
        ${f.riskId?`<span class="badge badge-neutral" data-route="risques/${f.riskId}" style="cursor:pointer;">Risque associé →</span>`:""}
      </div>
    </div>`;
  }).join("") : `<div class="card">${emptyState("📝","Aucun constat","Ajoutez les constats relevés pendant l'audit.")}</div>`}`;
}

function auditTabParties(a, isLocked){
  return `
  ${!isLocked?`<div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-add-party="${a.id}">+ Ajouter une partie prenante</button></div>`:""}
  ${a.parties.length? a.parties.map(pt=>{
    const qs = a.questions.filter(q=>pt.questionIds.includes(q.id));
    const answered = qs.filter(q=>q.statut!=="non_evalue").length;
    return `<div class="card mb-2">
      <div class="flex justify-between items-center"><h3>${esc(pt.name)}</h3>${badge(LABELS.partyStatus[pt.status])}</div>
      <p class="text-sm mt-2">${esc(pt.role)} · ${qs.length} question(s) à compléter · ${answered}/${qs.length} répondue(s)</p>
      <p class="text-xs mt-2">Échéance : ${fmtDate(pt.echeance)}</p>
      ${!isLocked && pt.status!=="complete"?`<button class="btn btn-secondary btn-sm mt-2" data-relaunch-party='${jsonAttr({auditId:a.id, partyName:pt.name})}'>🔔 Relancer</button>`:""}
    </div>`;
  }).join("") : `<div class="card">${emptyState("🤝","Aucune partie prenante","Ajoutez les personnes qui doivent contribuer à cet audit.")}</div>`}`;
}

function auditTabAnalyse(a){
  const history = auditProcessHistory(a);
  const analysis = auditRuleBasedAnalysis(a);
  return `
  <div class="card mb-4">
    <h3 class="mb-2">Comparaison avec les audits précédents du même processus</h3>
    ${history.length? `<div class="table-wrap"><table class="dt"><thead><tr><th>Date</th><th>Écarts</th><th>Points forts</th></tr></thead><tbody>
      ${[...history, a].sort((x,y)=>x.date.localeCompare(y.date)).map(h=>`<tr ${h.id===a.id?'style="background:var(--primary-soft);"':""}><td>${fmtDate(h.date)}${h.id===a.id?" (cet audit)":""}</td><td>${h.findings.filter(isAuditEcart).length}</td><td>${h.findings.filter(f=>f.type==="point_fort").length}</td></tr>`).join("")}
    </tbody></table></div>` : `<p class="text-sm">Aucun audit précédent sur ce processus pour établir une comparaison.</p>`}
  </div>
  <div class="card">
    <h3 class="mb-2">🤖 Analyse Qonnect</h3>
    ${analysis.map(b=>`<div class="mt-2"><p class="text-sm"><strong>Fait constaté :</strong> ${esc(b.fact)}</p><p class="text-sm mt-2" style="color:var(--text-secondary);"><strong>Analyse proposée :</strong> ${esc(b.analysis)}</p></div>`).join("<hr style='border:none;border-top:1px solid var(--border);margin:12px 0;'>")}
    <p class="text-xs mt-4">Qonnect distingue toujours le fait constaté de l'analyse proposée — aucune preuve ni résultat n'est inventé.</p>
  </div>`;
}

function auditTabTracabilite(a){
  const rows = a.questions.map(q=>{
    const ex = resolveExigence(q.requirementId);
    const proc = getProcess(q.processId);
    const constat = a.findings.find(f=>f.questionId===q.id);
    return {q, ex, proc, constat};
  });
  return dataTable(
    [ {label:"Question", render:r=>esc(r.q.question.slice(0,50))+(r.q.question.length>50?"…":"")},
      {label:"Exigence", render:r=>r.ex?esc(r.ex.ref):"—"},
      {label:"Processus", render:r=>r.proc?esc(r.proc.name):"—"},
      {label:"Preuve", render:r=>r.q.preuveIds.length+" doc(s)"},
      {label:"Constat", render:r=>r.constat?badge(LABELS.constatType[r.constat.type]):"—"},
      {label:"Action / NC", render:r=>r.constat?(r.constat.actionId?"✅ Action":"")+(r.constat.ncEventId?" 🚨 NC":""):"—"} ],
    rows
  );
}

function auditTabRapport(a){
  return `
  <div class="card">
    <h3 class="mb-2">Générer les sorties de l'audit</h3>
    <p class="text-sm mb-4">Le rapport reprend l'identification, les objectifs, le périmètre, les référentiels, la méthodologie, les questions, les preuves, les constats, la synthèse et la conclusion — sans ressaisie.</p>
    <div class="quick-actions">
      <button class="btn btn-primary" data-generate-audit-report="${a.id}">📄 Générer le rapport d'audit</button>
      <button class="btn btn-secondary" data-route="audits/${a.id}/resume">📊 Résumé exécutif (vue Direction)</button>
    </div>
  </div>`;
}

function auditTabValidation(a, isLocked){
  const stepIndex = AUDIT_WORKFLOW_STEPS.indexOf(a.status);
  return `
  <div class="card">
    <h3 class="mb-2">Workflow de validation</h3>
    ${workflowStepper(AUDIT_WORKFLOW_LABELS, stepIndex<0?0:stepIndex)}
    <div class="flex gap-2 mt-4">
      ${!isLocked && stepIndex<AUDIT_WORKFLOW_STEPS.length-1 ? `<button class="btn btn-primary" data-advance-audit="${a.id}">Passer à l'étape suivante : ${AUDIT_WORKFLOW_LABELS[stepIndex+1]}</button>` : `<span class="badge badge-success"><span class="badge-dot"></span>Audit clôturé — conservé et tracé</span>`}
    </div>
    <p class="text-xs mt-4">Une fois clôturé, l'audit devient non modifiable par défaut ; la traçabilité de chaque étape est conservée.</p>
  </div>`;
}

