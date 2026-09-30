/* ============================================================
   8. RISQUES
   ============================================================ */
function pageRisks(){
  const risks = DB.risks.filter(matchesScope);
  return `
  ${pageHeader("Risques & opportunités","Registre des risques et opportunités de l'organisation.",
    `<button class="btn btn-primary" data-open-quick="risk">+ Identifier un risque</button>`)}
  <div class="filters-bar">
    ${filterSelect("f-risk-level","Niveau",[{v:"critique",l:"Critique"},{v:"eleve",l:"Élevé"},{v:"faible",l:"Faible"},{v:"opportunite",l:"Opportunité"}])}
    ${filterSelect("f-risk-process","Processus", DB.processes.map(p=>({v:p.id,l:p.name})))}
    ${filterSelect("f-risk-status","Statut",[{v:"ouvert",l:"Ouvert"},{v:"maitrise",l:"Maîtrisé"},{v:"cloture",l:"Clôturé"}])}
  </div>
  <div id="risk-table-zone">${riskTable(risks)}</div>`;
}
function riskTable(risks){
  return dataTable(
    [ {label:"Niveau", render:r=>badge(LABELS.riskLevel[r.level])},
      {label:"Risque / opportunité", render:r=>`<div class="cell-title">${esc(r.name)}</div>`},
      {label:"Processus", render:r=>{const p=getProcess(r.processId); return p?esc(p.name):"—";}},
      {label:"Responsable", render:r=>esc(r.owner)},
      {label:"Statut", render:r=>badge(LABELS.riskStatus[r.status])} ],
    risks, {rowRoute:r=>`risques/${r.id}`, emptyEmoji:"🟢", emptyTitle:"Aucun risque", emptyText:"Aucun risque ne correspond à ces filtres."}
  );
}
function applyRiskFilters(){
  const lvl = document.getElementById("f-risk-level")?.value;
  const proc = document.getElementById("f-risk-process")?.value;
  const status = document.getElementById("f-risk-status")?.value;
  let rows = DB.risks.filter(matchesScope);
  if(lvl) rows = rows.filter(r=>r.level===lvl);
  if(proc) rows = rows.filter(r=>r.processId===proc);
  if(status) rows = rows.filter(r=>r.status===status);
  document.getElementById("risk-table-zone").innerHTML = riskTable(rows);
}

function pageRiskFiche(id){
  const r = getRisk(id);
  if(!r) return emptyState("⚠️","Risque introuvable","Ce risque n'existe pas.");
  const p = getProcess(r.processId);
  const docs = DB.documents.filter(d=>d.processId===r.processId && (d.type==="procedure"||d.type==="mode_operatoire"));
  const actions = DB.actions.filter(a=>a.originId===r.id);
  const events = DB.events.filter(e=>e.relatedRiskId===r.id);
  const score = r.probability*r.impact;

  return `
  ${breadcrumb([{label:"Risques",href:"#/risques"},{label:r.name}])}
  <div class="grid" style="grid-template-columns:2fr 1fr;gap:24px;">
    <div>
      <div class="card mb-2">
        <div class="flex justify-between items-center">
          ${badge(LABELS.riskLevel[r.level])}${badge(LABELS.riskStatus[r.status])}
        </div>
        ${r.sourceContext?`<p class="text-xs mt-2">🧭 Ce risque existe parce qu'il est issu de l'enjeu « ${esc(r.sourceContext.label)} »</p>`:""}
        <h1 class="mt-2">${esc(r.name)}</h1>
        <p class="section-sub mt-2">Processus : ${p?esc(p.name):"—"} · Responsable : ${esc(r.owner)}</p>
        <p class="text-sm mt-4" style="color:var(--text-primary);line-height:1.7;">${esc(r.description)}</p>
        <div class="grid grid-2 mt-4">
          <div class="card"><div class="text-xs">PROBABILITÉ</div><div class="kpi"><div class="val">${r.probability}/5</div></div></div>
          <div class="card"><div class="text-xs">IMPACT</div><div class="kpi"><div class="val">${r.impact}/5</div></div></div>
        </div>
        <p class="text-sm mt-2">Score de criticité : <strong>${score}/25</strong></p>
      </div>
      <div class="card">
        <h3 class="mb-2">Actions associées</h3>
        ${actions.length? actions.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">${esc(a.title)}</span>${badge(LABELS.actionStatus[a.status])}</div>`).join("")
          : `<p class="text-sm mb-2">Aucune action n'est encore associée à ce risque.</p>`}
        <button class="btn btn-secondary btn-sm mt-2" data-open-quick="action" data-preset-process="${r.processId}" data-preset-origin-type="risque" data-preset-origin-id="${r.id}">+ Créer une action</button>
      </div>
    </div>
    <div>
      <div class="card mb-2">
        <h3 class="mb-2">Relations</h3>
        ${p?`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`:""}
        ${docs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span><span class="chev">›</span></div>`).join("")}
        ${events.map(e=>`<div class="rel-link" data-route="evenements/${e.type}/${e.id}"><span class="rel-name">🚨 ${esc(e.title)}</span><span class="chev">›</span></div>`).join("")}
        <div class="rel-link" data-route="connexions/risque/${r.id}"><span class="rel-name">Voir toutes les connexions</span><span class="chev">›</span></div>
      </div>
      <div class="card">
        <h3 class="mb-2">Statut</h3>
        <div class="field">
          <label>Faire évoluer le statut</label>
          <select id="risk-status-select">
            <option value="ouvert" ${r.status==="ouvert"?"selected":""}>Ouvert</option>
            <option value="maitrise" ${r.status==="maitrise"?"selected":""}>Maîtrisé</option>
            <option value="cloture" ${r.status==="cloture"?"selected":""}>Clôturé</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" data-update-risk-status="${r.id}">Mettre à jour</button>
      </div>
    </div>
  </div>`;
}

