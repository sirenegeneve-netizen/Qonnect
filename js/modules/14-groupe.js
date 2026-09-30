/* ============================================================
   13quater. GROUPE / ÉTABLISSEMENTS / SERVICES
   ============================================================ */
function loadScope(){
  try{ const raw = localStorage.getItem("qonnect_scope_v1"); if(raw) return JSON.parse(raw); }catch(e){}
  return {level:"groupe"};
}
function saveScope(){ localStorage.setItem("qonnect_scope_v1", JSON.stringify(CURRENT_SCOPE)); }
let CURRENT_SCOPE = loadScope();
function scopeLabel(){
  if(CURRENT_SCOPE.level==="groupe") return DB.groupe.nom;
  const etab = getEtablissement(CURRENT_SCOPE.etablissementId);
  if(CURRENT_SCOPE.level==="etablissement") return DB.groupe.nom+" / "+(etab?etab.nom:"?");
  const svc = getService(CURRENT_SCOPE.serviceId);
  return DB.groupe.nom+" / "+(etab?etab.nom:"?")+" / "+(svc?svc.nom:"?");
}
function updateScopePill(){
  const el = document.getElementById("scope-label");
  if(el) el.textContent = scopeLabel();
}
function matchesScope(entity){
  if(CURRENT_SCOPE.level==="groupe") return true;
  const eid = entity.etablissementId;
  if(eid==="GROUPE") return true;
  const effectiveEid = eid || DEFAULT_ETABLISSEMENT_ID;
  if(effectiveEid!==CURRENT_SCOPE.etablissementId) return false;
  if(CURRENT_SCOPE.level==="service"){
    if(!entity.serviceId) return true;
    return entity.serviceId===CURRENT_SCOPE.serviceId;
  }
  return true;
}
function openScopeSelector(){
  const etabs = DB.etablissements;
  openModal({title:"Changer de périmètre",
    bodyHtml:`
      <p class="text-xs mb-2">Le périmètre sélectionné filtre les vues des principaux modules (risques, audits, actions, événements, fournisseurs, documents). La Revue de Direction et les Référentiels restent transversaux.</p>
      <div class="rel-link" data-set-scope='${jsonAttr({level:"groupe"})}' style="cursor:pointer;"><span class="rel-name">🏢 ${esc(DB.groupe.nom)}</span><span class="text-xs">Groupe — vision consolidée</span></div>
      ${etabs.map(e=>{
        const services = DB.services.filter(s=>s.etablissementId===e.id);
        return `<div class="rel-link" data-set-scope='${jsonAttr({level:"etablissement", etablissementId:e.id})}' style="cursor:pointer;"><span class="rel-name">🏭 ${esc(e.nom)}</span></div>`
          + services.map(s=>`<div class="rel-link" style="padding-left:24px;cursor:pointer;" data-set-scope='${jsonAttr({level:"service", etablissementId:e.id, serviceId:s.id})}'><span class="rel-name">↳ ${esc(s.nom)}</span></div>`).join("");
      }).join("")}
    `,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Fermer</button>`,
  });
}
function fournisseurMatchesScope(f){
  if(CURRENT_SCOPE.level==="groupe") return true;
  if(Array.isArray(f.etablissementIds) && f.etablissementIds.length){
    return f.etablissementIds.includes(CURRENT_SCOPE.etablissementId);
  }
  return matchesScope(f);
}
function etablissementStats(eid){
  return {
    services: DB.services.filter(s=>s.etablissementId===eid).length,
    risksOpen: DB.risks.filter(r=>scopeEtablissementId(r)===eid && r.type==="risque" && r.status==="ouvert").length,
    actionsRetard: DB.actions.filter(a=>scopeEtablissementId(a)===eid && a.status==="retard").length,
    auditsEcarts: DB.audits.filter(a=>scopeEtablissementId(a)===eid).reduce((s,a)=>s+a.findings.filter(isAuditEcart).length,0),
  };
}
function pageGroupe(){
  const s = {
    etablissements: DB.etablissements.length,
    services: DB.services.length,
    risquesEleves: DB.risks.filter(r=>r.type==="risque"&&r.status==="ouvert"&&(r.level==="critique"||r.level==="eleve")).length,
    audits: DB.audits.length,
    incidentsFournisseurs: DB.fournisseurIncidents.length,
    reclamations: DB.events.filter(e=>e.type==="reclamation").length,
    fournisseurs: DB.fournisseurs.length,
    actionsOuvertes: DB.actions.filter(a=>a.status!=="termine").length,
  };
  const rows = DB.etablissements.map(e=>({etab:e, stats:etablissementStats(e.id)}));
  return `
  ${pageHeader("Vision Groupe", esc(DB.groupe.nom)+" — vue consolidée de l'ensemble des établissements, sans jamais perdre l'établissement d'origine de chaque donnée.",
    `<button class="btn btn-secondary" data-open-scope-selector>🏢 Changer de périmètre</button>`)}
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val">${s.etablissements}</div><div class="lbl">Établissements</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${s.services}</div><div class="lbl">Services</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${s.risquesEleves?'var(--danger)':'var(--success)'}">${s.risquesEleves}</div><div class="lbl">Risques élevés/critiques (Groupe)</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${s.actionsOuvertes}</div><div class="lbl">Actions ouvertes (Groupe)</div></div></div>
  </div>
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val">${s.audits}</div><div class="lbl">Audits (Groupe)</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${s.incidentsFournisseurs}</div><div class="lbl">Incidents fournisseurs</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${s.reclamations}</div><div class="lbl">Réclamations</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${s.fournisseurs}</div><div class="lbl">Fournisseurs référencés</div></div></div>
  </div>
  <div class="card">
    <div class="flex justify-between items-center mb-2" style="flex-wrap:wrap;gap:8px;"><h3>Comparaison entre établissements</h3><span class="text-xs">Règle d'agrégation : somme pour les compteurs ci-dessous.</span></div>
    ${dataTable(
      [ {label:"Établissement", render:r=>`<div class="cell-title">${esc(r.etab.nom)}</div><div class="cell-sub">${esc(r.etab.type)}</div>`},
        {label:"Services", render:r=>r.stats.services},
        {label:"Risques ouverts", render:r=>r.stats.risksOpen},
        {label:"Actions en retard", render:r=>r.stats.actionsRetard},
        {label:"Écarts d'audit", render:r=>r.stats.auditsEcarts},
        {label:"", render:r=>`<button class="btn btn-secondary btn-sm" data-set-scope='${jsonAttr({level:"etablissement", etablissementId:r.etab.id})}'>Voir ce périmètre →</button>`} ],
      rows
    )}
  </div>`;
}

