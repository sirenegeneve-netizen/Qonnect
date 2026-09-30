/* ============================================================
   15. VUE CONNEXIONS
   ============================================================ */
function pageConnexions(type, id){
  if(!type || !id){
    return `${pageHeader("Connexions du système","Sélectionnez un élément (processus, risque, document…) pour visualiser ses connexions.")}
    <div class="card">${emptyState("🔗","Aucun élément sélectionné","Ouvrez une fiche processus, risque ou document puis cliquez sur « Voir les connexions ».")}</div>`;
  }
  let entity, name, related = {};
  if(type==="processus"){
    entity = getProcess(id); name = entity?.name;
    related = {
      "Risques": DB.risks.filter(r=>r.processId===id).length,
      "Documents": DB.documents.filter(d=>d.processId===id).length,
      "Indicateurs": DB.indicators.filter(i=>i.processId===id).length,
      "Actions": DB.actions.filter(a=>a.processId===id).length,
      "Audits": DB.audits.filter(a=>a.processId===id).length,
      "Événements": DB.events.filter(e=>e.processId===id).length,
    };
  } else if(type==="risque"){
    entity = getRisk(id); name = entity?.name;
    const p = entity?getProcess(entity.processId):null;
    related = {
      "Processus": p?1:0,
      "Documents": p?DB.documents.filter(d=>d.processId===p.id).length:0,
      "Actions": DB.actions.filter(a=>a.originId===id).length,
      "Événements": DB.events.filter(e=>e.relatedRiskId===id).length,
    };
  } else if(type==="evenement"){
    entity = getEvent(id); name = entity?.title;
    related = {
      "Processus": entity?1:0,
      "Actions": DB.actions.filter(a=>a.originId===id).length,
    };
  }
  if(!entity) return emptyState("🔗","Élément introuvable","Impossible d'afficher les connexions.");

  return `
  ${pageHeader("Connexions du système", "Visualisez en un coup d'œil les éléments reliés à "+name+".")}
  <div class="card">
    <div class="conn-diagram">
      <div class="conn-root">${esc(name)}</div>
      <div class="conn-arrow"></div>
      <div class="conn-row">
        ${Object.entries(related).map(([label,count])=>`
          <div class="conn-node">
            <div class="cn-count">${count}</div>
            <div class="cn-label">${esc(label)}</div>
          </div>`).join("")}
      </div>
    </div>
  </div>
  <div class="mt-4"><button class="btn btn-secondary" data-route="${type==='processus'?'processus/'+id:(type==='risque'?'risques/'+id:'evenements/'+entity.type+'/'+id)}">← Retour à la fiche</button></div>`;
}

