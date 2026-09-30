/* ============================================================
   11. ACTIONS
   ============================================================ */
function pageActions(){
  return `
  ${pageHeader("Actions","Toutes les actions issues des événements, risques, audits, indicateurs, objectifs et changements.",
    `<button class="btn btn-primary" data-open-quick="action">+ Créer une action</button>`)}
  <div class="filters-bar">
    ${filterSelect("f-act-status","Statut",[{v:"retard",l:"En retard"},{v:"en_cours",l:"En cours"},{v:"a_faire",l:"À faire"},{v:"termine",l:"Terminée"}])}
    ${filterSelect("f-act-origin","Origine",Object.entries(LABELS.actionOrigin).map(([v,l])=>({v,l})))}
    ${filterSelect("f-act-process","Processus", DB.processes.map(p=>({v:p.id,l:p.name})))}
  </div>
  <div id="action-table-zone">${actionTable(DB.actions.filter(matchesScope))}</div>`;
}
function actionTable(rows){
  const sorted = [...rows].sort((a,b)=>{
    const order = {retard:0,en_cours:1,a_faire:2,termine:3};
    return order[a.status]-order[b.status] || a.due.localeCompare(b.due);
  });
  return dataTable(
    [ {label:"Action", render:a=>`<div class="cell-title">${esc(a.title)}</div>`},
      {label:"Responsable", render:a=>esc(a.owner)},
      {label:"Échéance", render:a=>fmtDate(a.due)},
      {label:"Priorité", render:a=>badge(LABELS.priority[a.priority])},
      {label:"Origine", render:a=>esc(LABELS.actionOrigin[a.origin]||a.origin) + (a.sourceContext?` <span class="text-xs" title="Issu de l'enjeu ${esc(a.sourceContext.label)}">🧭</span>`:"")},
      {label:"Statut", render:a=>badge(LABELS.actionStatus[a.status])},
      {label:"", render:a=> a.status!=="termine" ? `<button class="btn btn-secondary btn-sm" data-complete-action="${a.id}">Marquer terminée</button>` : "" } ],
    sorted, {emptyEmoji:"✅", emptyTitle:"Aucune action", emptyText:"Aucune action ne correspond à ces filtres."}
  );
}
function applyActionFilters(){
  const status = document.getElementById("f-act-status")?.value;
  const origin = document.getElementById("f-act-origin")?.value;
  const proc = document.getElementById("f-act-process")?.value;
  let rows = DB.actions.filter(matchesScope);
  if(status) rows = rows.filter(a=>a.status===status);
  if(origin) rows = rows.filter(a=>a.origin===origin);
  if(proc) rows = rows.filter(a=>a.processId===proc);
  document.getElementById("action-table-zone").innerHTML = actionTable(rows);
}

