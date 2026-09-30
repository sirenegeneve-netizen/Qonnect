/* ============================================================
   13. CHANGEMENTS
   ============================================================ */
function pageChanges(){
  return `
  ${pageHeader("Changements","Maîtrise des changements planifiés impactant le système de management.",
    `<button class="btn btn-primary" data-open-quick="change">+ Déclarer un changement</button>`)}
  <div class="grid grid-2">
    ${DB.changes.map(c=>{
      const p = getProcess(c.processId);
      return `<div class="card card-hover" data-route="changements/${c.id}">
        <h3>${esc(c.title)}</h3>
        <p class="text-sm mt-2">Processus : ${p?esc(p.name):"—"} · Demandeur : ${esc(c.requestedBy)}</p>
        <div class="mt-4">${workflowStepper(QONNECT_SEED.changeSteps, c.step)}</div>
      </div>`;
    }).join("")}
  </div>`;
}
function pageChangeFiche(id){
  const c = getChange(id);
  if(!c) return emptyState("🔄","Changement introuvable","Ce changement n'existe pas.");
  const p = getProcess(c.processId);
  const impProcs = (c.impacted.processes||[]).map(getProcess).filter(Boolean);
  const impDocs = (c.impacted.documents||[]).map(getDocument).filter(Boolean);
  const impRisks = (c.impacted.risks||[]).map(getRisk).filter(Boolean);
  const impInds = (c.impacted.indicators||[]).map(getIndicator).filter(Boolean);

  return `
  ${breadcrumb([{label:"Changements",href:"#/changements"},{label:c.title}])}
  <div class="card mb-2">
    <h1>${esc(c.title)}</h1>
    <p class="section-sub mt-2">Processus : ${p?esc(p.name):"—"} · Demandé par ${esc(c.requestedBy)} le ${fmtDate(c.date)}</p>
    <p class="text-sm mt-4" style="color:var(--text-primary);line-height:1.7;">${esc(c.description)}</p>
    <div class="mt-4">${workflowStepper(QONNECT_SEED.changeSteps, c.step)}</div>
    <div class="flex gap-2 mt-4">
      ${c.step < QONNECT_SEED.changeSteps.length-1 ? `<button class="btn btn-primary" data-advance-change="${c.id}">Passer à l'étape suivante : ${esc(QONNECT_SEED.changeSteps[c.step+1])}</button>` : `<span class="badge badge-success"><span class="badge-dot"></span>Changement clôturé</span>`}
    </div>
  </div>
  <div class="card">
    <h3 class="mb-2">Éléments impactés</h3>
    <div class="grid grid-2">
      <div>
        <div class="text-xs mb-2">PROCESSUS</div>
        ${impProcs.map(pp=>`<div class="rel-link" data-route="processus/${pp.id}"><span class="rel-name">🧩 ${esc(pp.name)}</span><span class="chev">›</span></div>`).join("") || `<p class="text-sm">Aucun</p>`}
        <div class="text-xs mb-2 mt-4">RISQUES</div>
        ${impRisks.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">⚠️ ${esc(r.name)}</span><span class="chev">›</span></div>`).join("") || `<p class="text-sm">Aucun</p>`}
      </div>
      <div>
        <div class="text-xs mb-2">DOCUMENTS</div>
        ${impDocs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span><span class="chev">›</span></div>`).join("") || `<p class="text-sm">Aucun</p>`}
        <div class="text-xs mb-2 mt-4">INDICATEURS</div>
        ${impInds.map(i=>`<div class="rel-link"><span class="rel-name">📊 ${esc(i.name)}</span></div>`).join("") || `<p class="text-sm">Aucun</p>`}
        <div class="text-xs mb-2 mt-4">COMPÉTENCES</div>
        ${(c.impacted.skills||[]).map(s=>`<div class="rel-link"><span class="rel-name">👤 ${esc(s)}</span></div>`).join("") || `<p class="text-sm">Aucune</p>`}
      </div>
    </div>
  </div>`;
}

