/* ============================================================
   10. ÉVÉNEMENTS
   ============================================================ */
function pageEvents(typeFilter){
  const isNC = typeFilter==="non_conformite";
  let events = (typeFilter==="all" ? DB.events : DB.events.filter(e=>e.type===typeFilter)).filter(matchesScope);
  const chips = [{k:"all",l:"Tous"},{k:"non_conformite",l:"Non-conformités"},{k:"incident",l:"Incidents"},{k:"reclamation",l:"Réclamations"},{k:"anomalie",l:"Anomalies"},{k:"suggestion",l:"Suggestions"},{k:"amelioration",l:"Améliorations"}]
    .map(c=>`<a class="chip ${c.k===typeFilter?'active':''}" data-route="evenements/${c.k}">${esc(c.l)}</a>`).join("");

  return `
  ${pageHeader(isNC?"Non-conformités":"Événements","Non-conformités, incidents, réclamations, anomalies, suggestions et améliorations.",
    `<button class="btn btn-primary" data-open-quick="event">+ Déclarer un événement</button>`)}
  <div class="filters-bar">${chips}</div>
  <div class="filters-bar">
    ${filterSelect("f-evt-status","Statut",[{v:"ouvert",l:"Ouvert"},{v:"cloture",l:"Clôturé"}])}
    ${filterSelect("f-evt-priority","Priorité",[{v:"critique",l:"Critique"},{v:"haute",l:"Haute"},{v:"moyenne",l:"Moyenne"},{v:"basse",l:"Basse"}])}
    ${filterSelect("f-evt-process","Processus", DB.processes.map(p=>({v:p.id,l:p.name})))}
  </div>
  <div id="event-table-zone" data-type-filter="${typeFilter}">${eventTable(events)}</div>`;
}
function eventTable(events){
  return dataTable(
    [ {label:"Référence", render:e=>esc(e.ref)},
      {label:"Événement", render:e=>`<div class="cell-title">${esc(e.title)}</div>`},
      {label:"Type", render:e=>esc(LABELS.eventType[e.type])},
      {label:"Processus", render:e=>{const p=getProcess(e.processId); return p?esc(p.name):"—";}},
      {label:"Priorité", render:e=>badge(LABELS.priority[e.priority])},
      {label:"Date", render:e=>fmtDate(e.date)},
      {label:"Statut", render:e=>badge(LABELS.eventStatus[e.status])} ],
    events, {rowRoute:e=>`evenements/${e.type}/${e.id}`, emptyEmoji:"🚨", emptyTitle:"Aucun événement", emptyText:"Aucun événement ne correspond à ces filtres."}
  );
}
function applyEventFilters(){
  const zone = document.getElementById("event-table-zone");
  const typeFilter = zone.getAttribute("data-type-filter");
  const status = document.getElementById("f-evt-status")?.value;
  const priority = document.getElementById("f-evt-priority")?.value;
  const proc = document.getElementById("f-evt-process")?.value;
  let rows = (typeFilter==="all" ? DB.events : DB.events.filter(e=>e.type===typeFilter)).filter(matchesScope);
  if(status) rows = rows.filter(e=>e.status===status);
  if(priority) rows = rows.filter(e=>e.priority===priority);
  if(proc) rows = rows.filter(e=>e.processId===proc);
  zone.innerHTML = eventTable(rows);
}

function eventContextHtml(e){
  const c = e.context;
  if(!c) return "";
  const items = [["Tranche d'âge","ageRange"],["Sexe","sex"],["Prise en charge","careType"],["Moment","moment"],["Conséquence","consequence"]]
    .filter(([,k])=>c[k] && c[k]!=="nc")
    .map(([l,k])=>`<span class="badge badge-neutral" style="margin-right:6px;">${esc(l)} : ${esc(EVENT_CONTEXT[k][c[k]]||c[k])}</span>`);
  return items.length ? `<div class="mt-4"><div class="text-xs mb-2">Contexte de prise en charge (non identifiant)</div>${items.join("")}</div>` : "";
}
function pageEventFiche(id){
  const e = getEvent(id);
  if(!e) return emptyState("🚨","Événement introuvable","Cet événement n'existe pas.");
  const p = getProcess(e.processId);
  const isNC = e.type==="non_conformite";
  const actions = DB.actions.filter(a=>a.originId===e.id);

  return `
  ${breadcrumb([{label:"Événements",href:"#/evenements/all"},{label:LABELS.eventType[e.type],href:"#/evenements/"+e.type},{label:e.ref}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center">
      <div>
        <span class="badge badge-neutral">${esc(e.ref)}</span>
        ${badge(LABELS.priority[e.priority])}
        ${badge(LABELS.eventStatus[e.status])}
      </div>
    </div>
    <h1 class="mt-2">${esc(e.title)}</h1>
    <p class="section-sub mt-2">${esc(LABELS.eventType[e.type])} · Processus : ${p?esc(p.name):"—"} · Déclaré par ${esc(e.declaredBy)} le ${fmtDate(e.date)}</p>
    <p class="text-sm mt-4" style="color:var(--text-primary);line-height:1.7;">${esc(e.description)}</p>
    ${eventContextHtml(e)}
  </div>

  ${isNC ? `<div class="card mb-2">
    <h3 class="mb-2">Suivi du traitement</h3>
    ${workflowStepper(QONNECT_SEED.ncSteps, e.step)}
    <div class="flex gap-2 mt-4">
      ${e.step < QONNECT_SEED.ncSteps.length-1 ? `<button class="btn btn-primary" data-advance-nc="${e.id}">Passer à l'étape suivante : ${esc(QONNECT_SEED.ncSteps[e.step+1])}</button>` : `<span class="badge badge-success"><span class="badge-dot"></span>Traitement clôturé</span>`}
      ${e.step>0 && e.step<QONNECT_SEED.ncSteps.length-1 ? `<button class="btn btn-secondary" data-rewind-nc="${e.id}">Revenir à l'étape précédente</button>`:""}
    </div>
  </div>` : ""}

  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Actions liées</h3>
      ${actions.length? actions.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">${esc(a.title)}</span>${badge(LABELS.actionStatus[a.status])}</div>`).join("")
        : `<p class="text-sm mb-2">Aucune action n'est encore associée.</p>`}
      <button class="btn btn-secondary btn-sm mt-2" data-open-quick="action" data-preset-process="${e.processId}" data-preset-origin-type="evenement" data-preset-origin-id="${e.id}">+ Créer une action</button>
    </div>
    <div class="card">
      <h3 class="mb-2">Relations</h3>
      ${p?`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`:""}
      <div class="rel-link" data-route="connexions/evenement/${e.id}"><span class="rel-name">Voir toutes les connexions</span><span class="chev">›</span></div>
    </div>
  </div>`;
}

