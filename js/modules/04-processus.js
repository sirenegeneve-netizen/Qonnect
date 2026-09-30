/* ============================================================
   6. PROCESSUS — cartographie + fiche
   ============================================================ */
function processMiniStats(pid){
  const risks = DB.risks.filter(r=>r.processId===pid && r.type==="risque" && r.status!=="cloture");
  const docs = DB.documents.filter(d=>d.processId===pid);
  const inds = DB.indicators.filter(i=>i.processId===pid);
  const events = DB.events.filter(e=>e.processId===pid && e.status==="ouvert");
  const actions = DB.actions.filter(a=>a.processId===pid && a.status==="retard");
  const audits = DB.audits.filter(a=>a.processId===pid && a.status==="planifie");
  const changes = DB.changes.filter(c=>c.processId===pid && c.step < QONNECT_SEED.changeSteps.length-1);
  return {risks,docs,inds,events,actions,audits,changes};
}

function pageProcessCarto(){
  const groups = [
    {key:"management", title:"Processus de management"},
    {key:"operationnel", title:"Processus opérationnels"},
    {key:"support", title:"Processus support"},
  ];
  return `
  ${pageHeader("Cartographie des processus","Cliquez sur un processus pour consulter sa fiche complète.")}
  ${groups.map(g=>{
    const list = DB.processes.filter(p=>p.group===g.key);
    return `<div class="section">
      <div class="pmap-group-title">${esc(g.title)}</div>
      <div class="grid grid-3">
        ${list.map(p=>{
          const s = processMiniStats(p.id);
          return `<div class="card card-hover" data-route="processus/${p.id}">
            <div class="pcard">
              <div class="picon">${p.icon}</div>
              <div>
                <div class="pname">${esc(p.name)}</div>
                <div class="text-sm">Pilote : ${esc(p.pilot)}</div>
              </div>
              <div class="pmini">
                ${s.risks.length?`<span>🔴 ${s.risks.length} risque(s)</span>`:""}
                ${s.actions.length?`<span>⏱ ${s.actions.length} action(s) en retard</span>`:""}
                ${(!s.risks.length && !s.actions.length)?`<span>🟢 Sous contrôle</span>`:""}
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }).join("")}`;
}

function pageProcessFiche(pid, tab){
  const p = getProcess(pid);
  if(!p) return emptyState("🧩","Processus introuvable","Ce processus n'existe pas ou a été supprimé.");
  const s = processMiniStats(pid);
  const allRisks = DB.risks.filter(r=>r.processId===pid);
  const allDocs = DB.documents.filter(d=>d.processId===pid);
  const allEvents = DB.events.filter(e=>e.processId===pid);
  const allActions = DB.actions.filter(a=>a.processId===pid);
  const allAudits = DB.audits.filter(a=>a.processId===pid);
  const allChanges = DB.changes.filter(c=>c.processId===pid);
  const allInds = DB.indicators.filter(i=>i.processId===pid);

  const tabs = [
    {id:"general", label:"Vue générale"},
    {id:"risques", label:`Risques (${allRisks.length})`},
    {id:"documents", label:`Documents (${allDocs.length})`},
    {id:"performance", label:`Performance (${allInds.length})`},
    {id:"evenements", label:`Événements (${allEvents.length})`},
    {id:"audits", label:`Audits (${allAudits.length})`},
    {id:"changements", label:`Changements (${allChanges.length})`},
  ];

  let body = "";
  if(tab==="general"){
    body = `<div class="grid grid-2">
      <div class="card"><h3 class="mb-2">Finalité</h3><p class="text-sm" style="color:var(--text-primary)">${esc(p.purpose)}</p></div>
      <div class="card">
        <h3 class="mb-2">Synthèse</h3>
        <div class="rel-link" data-route="processus/${p.id}/risques"><span class="rel-name">Risques</span><span>${s.risks.length} ouvert(s) <span class="chev">›</span></span></div>
        <div class="rel-link" data-route="processus/${p.id}/documents"><span class="rel-name">Documents</span><span>${allDocs.length} <span class="chev">›</span></span></div>
        <div class="rel-link" data-route="processus/${p.id}/performance"><span class="rel-name">Indicateurs</span><span>${allInds.length} <span class="chev">›</span></span></div>
        <div class="rel-link" data-route="processus/${p.id}/evenements"><span class="rel-name">Événements</span><span>${s.events.length} ouvert(s) <span class="chev">›</span></span></div>
        <div class="rel-link" data-route="processus/${p.id}/audits"><span class="rel-name">Audits</span><span>${allAudits.length} <span class="chev">›</span></span></div>
        <div class="rel-link" data-route="processus/${p.id}/changements"><span class="rel-name">Changements</span><span>${allChanges.length} <span class="chev">›</span></span></div>
        <div class="rel-link" data-route="connexions/processus/${p.id}"><span class="rel-name">Voir les connexions</span><span class="chev">›</span></div>
      </div>
    </div>`;
  } else if(tab==="risques"){
    body = allRisks.length ? dataTable(
      [ {label:"Risque", render:r=>`<div class="cell-title">${esc(r.name)}</div>`},
        {label:"Niveau", render:r=>badge(LABELS.riskLevel[r.level])},
        {label:"Responsable", render:r=>esc(r.owner)},
        {label:"Statut", render:r=>badge(LABELS.riskStatus[r.status])} ],
      allRisks, {rowRoute:r=>`risques/${r.id}`}
    ) : `<div class="card">${emptyState("🟢","Aucun risque","Aucun risque n'est encore enregistré pour ce processus.", `<button class="btn btn-primary" data-open-quick="risk" data-preset-process="${p.id}">+ Identifier un risque</button>`)}</div>`;
  } else if(tab==="documents"){
    body = allDocs.length ? dataTable(
      [ {label:"Document", render:d=>`<div class="cell-title">${esc(d.title)}</div><div class="cell-sub">${esc(d.ref)}</div>`},
        {label:"Type", render:d=>esc(LABELS.docType[d.type]||d.type)},
        {label:"Version", render:d=>esc(d.version)},
        {label:"Statut", render:d=>badge(LABELS.docStatus[d.status])} ],
      allDocs, {rowRoute:d=>`documents/${d.type}/${d.id}`}
    ) : `<div class="card">${emptyState("📭","Aucun document","Aucun document n'est encore associé à ce processus.", `<button class="btn btn-primary" data-open-quick="document" data-preset-process="${p.id}">+ Créer un document</button>`)}</div>`;
  } else if(tab==="performance"){
    body = allInds.length ? `<div class="grid grid-3">${allInds.map(i=>indicatorCard(i)).join("")}</div>`
      : `<div class="card">${emptyState("📊","Aucun indicateur","Aucun indicateur n'est suivi pour ce processus.")}</div>`;
  } else if(tab==="evenements"){
    body = allEvents.length ? dataTable(
      [ {label:"Référence", render:e=>esc(e.ref)},
        {label:"Événement", render:e=>`<div class="cell-title">${esc(e.title)}</div>`},
        {label:"Type", render:e=>esc(LABELS.eventType[e.type])},
        {label:"Priorité", render:e=>badge(LABELS.priority[e.priority])},
        {label:"Statut", render:e=>badge(LABELS.eventStatus[e.status])} ],
      allEvents, {rowRoute:e=>`evenements/${e.type}/${e.id}`}
    ) : `<div class="card">${emptyState("🚨","Aucun événement","Aucun événement n'est encore enregistré pour ce processus.", `<button class="btn btn-primary" data-open-quick="event" data-preset-process="${p.id}">+ Déclarer un événement</button>`)}</div>`;
  } else if(tab==="audits"){
    body = allAudits.length ? dataTable(
      [ {label:"Audit", render:a=>`<div class="cell-title">${esc(a.title)}</div>`},
        {label:"Date", render:a=>fmtDate(a.date)},
        {label:"Auditeur", render:a=>esc(a.auditor)},
        {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
      allAudits, {rowRoute:a=>`audits/${a.id}`}
    ) : `<div class="card">${emptyState("🔍","Aucun audit","Aucun audit n'est planifié pour ce processus.", `<button class="btn btn-primary" data-open-quick="audit" data-preset-process="${p.id}">+ Créer un audit</button>`)}</div>`;
  } else if(tab==="changements"){
    body = allChanges.length ? dataTable(
      [ {label:"Changement", render:c=>`<div class="cell-title">${esc(c.title)}</div>`},
        {label:"Demandeur", render:c=>esc(c.requestedBy)},
        {label:"Étape", render:c=>esc(QONNECT_SEED.changeSteps[c.step])} ],
      allChanges, {rowRoute:c=>`changements/${c.id}`}
    ) : `<div class="card">${emptyState("🔄","Aucun changement","Aucun changement n'est en cours pour ce processus.", `<button class="btn btn-primary" data-open-quick="change" data-preset-process="${p.id}">+ Déclarer un changement</button>`)}</div>`;
  }

  return `
  ${breadcrumb([{label:"Processus",href:"#/processus"},{label:p.name}])}
  <div class="section-head">
    <div>
      <h1>${p.icon} ${esc(p.name)}</h1>
      <p class="section-sub">${esc(LABELS.processGroup[p.group])} · Pilote : ${esc(p.pilot)}</p>
    </div>
  </div>
  ${renderTabs(tabs, tab)}
  ${body}`;
}

function indicatorCard(i){
  const st = LABELS.indStatus[i.status];
  const color = i.status==="vert"?"var(--success)":i.status==="orange"?"var(--warning)":"var(--danger)";
  return `<div class="card card-hover" data-route="objectifs">
    <div class="flex justify-between items-center">
      <h3>${esc(i.name)}</h3>${badge(st)}
    </div>
    <div class="kpi mt-2"><div class="val" style="color:${color}">${esc(i.value)}</div></div>
  </div>`;
}

