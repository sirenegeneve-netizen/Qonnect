/* ============================================================
   13bis. COMPÉTENCES & HABILITATIONS
   ============================================================ */

/* ---------- Logique métier ---------- */
function personRequiredCompetences(personId){
  const p = getPerson(personId);
  const poste = p ? getPoste(p.posteId) : null;
  return poste ? poste.competencesRequises : [];
}
function personLatestEvaluation(personId, competenceId){
  const evals = DB.competenceEvaluations.filter(e=>e.personId===personId && e.competenceId===competenceId).sort((a,b)=>a.date.localeCompare(b.date));
  return evals.length ? evals[evals.length-1] : null;
}
function personCompetenceRow(personId, req){
  const evalLatest = personLatestEvaluation(personId, req.competenceId);
  const niveauActuel = evalLatest ? evalLatest.niveauEvalue : null;
  let statut;
  if(niveauActuel===null) statut = "non_evalue";
  else if(niveauActuel >= req.niveauRequis) statut = "conforme";
  else statut = "a_renforcer";
  return { competence:getCompetence(req.competenceId), niveauRequis:req.niveauRequis, obligatoire:req.obligatoire, niveauActuel, ecart: niveauActuel===null?null:(niveauActuel-req.niveauRequis), statut, evaluation:evalLatest };
}
function personMatrix(personId){ return personRequiredCompetences(personId).map(req=>personCompetenceRow(personId, req)); }
function personConformityRate(personId){
  const rows = personMatrix(personId);
  if(!rows.length) return null;
  return Math.round(rows.filter(r=>r.statut==="conforme").length/rows.length*100);
}
function habilitationStatusCompute(ph){
  if(ph.statut==="suspendue") return "suspendue";
  const diffDays = Math.round((new Date(ph.dateExpiration+"T00:00:00")-new Date())/(1000*3600*24));
  if(diffDays<0) return "expiree";
  if(diffDays<=60) return "expire_bientot";
  return "active";
}
function personHabilitationsList(personId){
  return DB.personHabilitations.filter(ph=>ph.personId===personId).map(ph=>({...ph, statutCalcule:habilitationStatusCompute(ph), habilitation:getHabilitation(ph.habilitationId)}));
}
function competenceDashboardStats(){
  const today = new Date().toISOString().slice(0,10);
  const effectif = DB.people.length;
  const fullyConform = DB.people.filter(p=>{ const m=personMatrix(p.id); return m.length && m.every(r=>r.statut==="conforme"); }).length;
  const pctConformes = effectif? Math.round(fullyConform/effectif*100) : 0;
  let ecarts = 0;
  DB.people.forEach(p=> ecarts += personMatrix(p.id).filter(r=>r.statut==="a_renforcer").length);
  const formationsAFaire = DB.actions.filter(a=>a.origin==="competence" && a.status!=="termine").length;
  const allPH = DB.personHabilitations.map(ph=>({...ph, statutCalcule:habilitationStatusCompute(ph)}));
  const habActives = allPH.filter(ph=>ph.statutCalcule==="active").length;
  const habExpirantBientot = allPH.filter(ph=>ph.statutCalcule==="expire_bientot").length;
  const habExpirees = allPH.filter(ph=>ph.statutCalcule==="expiree").length;
  const revuesARealiser = DB.people.filter(p=>p.prochaineRevue && p.prochaineRevue<=today).length;
  return {effectif, pctConformes, ecarts, formationsAFaire, habActives, habExpirantBientot, habExpirees, revuesARealiser};
}
function competenceAlerts(){
  const alerts = [];
  DB.personHabilitations.forEach(ph=>{
    const st = habilitationStatusCompute(ph);
    const person = getPerson(ph.personId), hab = getHabilitation(ph.habilitationId);
    if(!person||!hab) return;
    if(st==="expire_bientot"){ const days = Math.round((new Date(ph.dateExpiration+"T00:00:00")-new Date())/(1000*3600*24)); alerts.push({level:"warning", text:`L'habilitation ${hab.nom} de ${person.name} expire dans ${days} jour(s).`}); }
    if(st==="expiree") alerts.push({level:"danger", text:`${person.name} possède une habilitation expirée : ${hab.nom}. Une action est requise.`});
  });
  DB.people.forEach(p=>{
    personMatrix(p.id).forEach(row=>{
      if(row.statut==="a_renforcer") alerts.push({level:"warning", text:`Le niveau de compétence de ${p.name} en ${row.competence.nom} est inférieur au niveau requis pour son poste.`});
      if(row.statut==="non_evalue" && row.obligatoire) alerts.push({level:"info", text:`La compétence ${row.competence.nom} requise pour le poste de ${p.name} n'a pas encore été évaluée.`});
    });
  });
  const today = new Date().toISOString().slice(0,10);
  DB.people.filter(p=>p.prochaineRevue && p.prochaineRevue<today).forEach(p=> alerts.push({level:"warning", text:`La revue de compétences de ${p.name} est en retard (prévue le ${fmtDate(p.prochaineRevue)}).`}));
  return alerts;
}

/* ---------- Dashboard ---------- */
function pageCompetences(){
  const s = competenceDashboardStats();
  const kpi = (route, val, label, color)=>`<div class="card card-hover" data-route="${route}"><div class="kpi"><div class="val" style="color:${color||'var(--text-primary)'}">${val}</div><div class="lbl">${esc(label)}</div></div></div>`;
  return `
  ${pageHeader("Compétences & Habilitations","Pour chaque poste, les compétences requises. Pour chaque personne, ce qu'elle maîtrise, comment c'est prouvé, et ce qu'elle est habilitée à faire.",
    `<button class="btn btn-secondary" data-route="competences/auditeur">🔍 Vue Auditeur</button><button class="btn btn-primary" data-open-person-form>+ Collaborateur</button>`)}
  <div class="quick-actions mb-4">
    <button class="qa-btn" data-route="competences/referentiel">📘 Référentiel des compétences</button>
    <button class="qa-btn" data-route="competences/postes">🧭 Postes / fonctions</button>
    <button class="qa-btn" data-route="competences/matrice">🗂️ Matrice globale</button>
    <button class="qa-btn" data-route="competences/habilitations">🪪 Habilitations</button>
    <button class="qa-btn" data-route="competences/personnes">👥 Collaborateurs</button>
  </div>
  <div class="grid grid-4 mb-4">
    ${kpi("competences/personnes", s.effectif, "Effectif suivi")}
    ${kpi("competences/matrice", s.pctConformes+" %", "Compétences conformes", s.pctConformes>=80?"var(--success)":"var(--warning)")}
    ${kpi("competences/matrice", s.ecarts, "Écarts de compétences", s.ecarts?"var(--danger)":"var(--success)")}
    ${kpi("actions", s.formationsAFaire, "Formations / actions à réaliser", s.formationsAFaire?"var(--warning)":"var(--success)")}
  </div>
  <div class="grid grid-4 mb-4">
    ${kpi("competences/habilitations", s.habActives, "Habilitations actives", "var(--success)")}
    ${kpi("competences/habilitations", s.habExpirantBientot, "Expirant bientôt", s.habExpirantBientot?"var(--warning)":"var(--success)")}
    ${kpi("competences/habilitations", s.habExpirees, "Habilitations expirées", s.habExpirees?"var(--danger)":"var(--success)")}
    ${kpi("competences/personnes", s.revuesARealiser, "Revues à réaliser", s.revuesARealiser?"var(--warning)":"var(--success)")}
  </div>
  <div class="card">
    <h3 class="mb-2">🔔 Alertes</h3>
    ${(()=>{ const al=competenceAlerts(); return al.length ? al.slice(0,8).map(a=>`<div class="rel-link"><span class="rel-name">${a.level==="danger"?"🔴":a.level==="warning"?"🟠":"🔵"} ${esc(a.text)}</span></div>`).join("") : `<p class="text-sm">Aucune alerte active.</p>`; })()}
  </div>`;
}

/* ---------- Référentiel des compétences ---------- */
function pageCompetenceReferentiel(){
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Référentiel des compétences"}])}
  ${pageHeader("Référentiel des compétences","", `<button class="btn btn-primary" data-open-competence-form>+ Nouvelle compétence</button>`)}
  <div class="grid grid-3">
    ${DB.competences.map(c=>`
      <div class="card card-hover" data-route="competences/referentiel/${c.id}">
        <div class="flex justify-between items-center"><span class="badge badge-neutral">${esc(c.code)}</span>${badge(LABELS.competenceCriticite[c.criticite])}</div>
        <h3 class="mt-2">${esc(c.nom)}</h3>
        <p class="text-sm mt-2">${esc(c.domaine)} ${c.reglementaire?"· 🛡️ Réglementaire":""}</p>
        ${!c.actif?badgeRaw("neutral","Inactive"):""}
      </div>`).join("")}
  </div>`;
}
function pageCompetenceFiche(id){
  const c = getCompetence(id);
  if(!c) return emptyState("📘","Compétence introuvable","Cette compétence n'existe pas.");
  const postesReq = DB.postes.filter(p=>p.competencesRequises.some(r=>r.competenceId===id));
  const personnesEvaluees = DB.people.filter(p=>DB.competenceEvaluations.some(e=>e.personId===p.id && e.competenceId===id));
  const docs = (c.documentIds||[]).map(getDocument).filter(Boolean);
  const habs = (c.habilitationIds||[]).map(getHabilitation).filter(Boolean);
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Référentiel",href:"#/competences/referentiel"},{label:c.nom}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center">
      <div><span class="badge badge-neutral">${esc(c.code)}</span> ${badge(LABELS.competenceCriticite[c.criticite])} ${c.reglementaire?badgeRaw("danger","Réglementaire"):""}</div>
      <button class="btn btn-secondary btn-sm" data-open-competence-form="${c.id}">✏️ Modifier</button>
    </div>
    <h1 class="mt-2">${esc(c.nom)}</h1>
    <p class="section-sub mt-2">${esc(c.domaine)} · ${esc(c.type)}</p>
    <p class="text-sm mt-4" style="color:var(--text-primary);">${esc(c.description)}</p>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Postes concernés</h3>
      ${postesReq.length?postesReq.map(p=>{const req=p.competencesRequises.find(r=>r.competenceId===id);return `<div class="rel-link" data-route="competences/postes/${p.id}"><span class="rel-name">${esc(p.intitule)}</span><span class="text-xs">Niveau requis : ${req.niveauRequis} ${req.obligatoire?"(obligatoire)":""}</span></div>`;}).join(""):`<p class="text-sm">Aucun poste ne requiert cette compétence.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Personnes évaluées</h3>
      ${personnesEvaluees.length?personnesEvaluees.map(p=>{const ev=personLatestEvaluation(p.id,id); return `<div class="rel-link" data-route="competences/personnes/${p.id}"><span class="rel-name">${esc(p.name)}</span><span class="text-xs">Niveau ${ev.niveauEvalue} — ${esc(LABELS.niveauCompetence[ev.niveauEvalue])}</span></div>`;}).join(""):`<p class="text-sm">Aucune évaluation enregistrée.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Documents associés</h3>
      ${docs.length?docs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span></div>`).join(""):`<p class="text-sm">Aucun document associé.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Habilitations liées</h3>
      ${habs.length?habs.map(h=>`<div class="rel-link" data-route="competences/habilitations/${h.id}"><span class="rel-name">🪪 ${esc(h.nom)}</span></div>`).join(""):`<p class="text-sm">Aucune habilitation liée.</p>`}
    </div>
  </div>`;
}

/* ---------- Référentiel des postes ---------- */
function pagePostes(){
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Postes / fonctions"}])}
  ${pageHeader("Postes / fonctions","", `<button class="btn btn-primary" data-open-poste-form>+ Nouveau poste</button>`)}
  ${dataTable(
    [ {label:"Poste", render:p=>`<div class="cell-title">${esc(p.intitule)}</div><div class="cell-sub">${esc(p.code)}</div>`},
      {label:"Département", render:p=>esc(p.departement)},
      {label:"Responsable", render:p=>esc(p.responsable)},
      {label:"Compétences requises", render:p=>p.competencesRequises.length},
      {label:"Criticité", render:p=>badge(LABELS.competenceCriticite[p.criticite])},
      {label:"Effectif", render:p=>DB.people.filter(x=>x.posteId===p.id).length} ],
    DB.postes, {rowRoute:p=>`competences/postes/${p.id}`}
  )}`;
}
function pagePosteFiche(id){
  const p = getPoste(id);
  if(!p) return emptyState("🧭","Poste introuvable","Ce poste n'existe pas.");
  const titulaires = DB.people.filter(x=>x.posteId===id);
  const habs = (p.habilitationsObligatoires||[]).map(getHabilitation).filter(Boolean);
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Postes",href:"#/competences/postes"},{label:p.intitule}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center">
      <div><span class="badge badge-neutral">${esc(p.code)}</span> ${badge(LABELS.competenceCriticite[p.criticite])} ${!p.actif?badgeRaw("neutral","Inactif"):""}</div>
      <button class="btn btn-secondary btn-sm" data-open-poste-form="${p.id}">✏️ Modifier</button>
    </div>
    <h1 class="mt-2">${esc(p.intitule)}</h1>
    <p class="section-sub mt-2">${esc(p.departement)} · Responsable : ${esc(p.responsable)}</p>
    <p class="text-sm mt-4" style="color:var(--text-primary);">${esc(p.description)}</p>
  </div>
  <div class="card mb-2">
    <div class="flex justify-between items-center mb-2"><h3>Compétences requises</h3><button class="btn btn-secondary btn-sm" data-add-poste-competence="${p.id}">+ Ajouter</button></div>
    ${dataTable(
      [ {label:"Compétence", render:r=>{const c=getCompetence(r.competenceId); return c?esc(c.nom):r.competenceId;}},
        {label:"Niveau requis", render:r=>esc(LABELS.niveauCompetence[r.niveauRequis])},
        {label:"Obligatoire", render:r=>r.obligatoire?badgeRaw("danger","Oui"):badgeRaw("neutral","Non")},
        {label:"", render:r=>`<button class="btn btn-ghost btn-sm" data-remove-poste-competence='${jsonAttr({posteId:p.id, competenceId:r.competenceId})}'>✕</button>`} ],
      p.competencesRequises
    )}
  </div>
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Habilitations obligatoires</h3>
      ${habs.length?habs.map(h=>`<div class="rel-link" data-route="competences/habilitations/${h.id}"><span class="rel-name">🪪 ${esc(h.nom)}</span></div>`).join(""):`<p class="text-sm">Aucune.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Titulaires du poste</h3>
      ${titulaires.length?titulaires.map(t=>`<div class="rel-link" data-route="competences/personnes/${t.id}"><span class="rel-name">${esc(t.name)}</span><span class="chev">›</span></div>`).join(""):`<p class="text-sm">Aucun titulaire actuellement.</p>`}
    </div>
  </div>`;
}

/* ---------- Matrice globale ---------- */
function pageCompetenceMatrice(){
  const allComps = DB.competences.filter(c=>c.actif);
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Matrice globale"}])}
  ${pageHeader("Matrice des compétences","Personnes × compétences — conformité calculée automatiquement.")}
  <div class="filters-bar">
    ${filterSelect("f-comp-service","Service", [...new Set(DB.people.map(p=>p.service))].map(s=>({v:s,l:s})))}
    ${filterSelect("f-comp-poste","Poste", DB.postes.map(p=>({v:p.id,l:p.intitule})))}
    ${filterSelect("f-comp-competence","Compétence", allComps.map(c=>({v:c.id,l:c.nom})))}
  </div>
  <div id="comp-matrix-zone">${competenceMatrixTable(DB.people, allComps)}</div>`;
}
function competenceMatrixTable(people, comps){
  return `<div class="card card-flush table-wrap"><table class="dt">
    <thead><tr><th>Collaborateur</th>${comps.map(c=>`<th>${esc(c.nom)}</th>`).join("")}</tr></thead>
    <tbody>${people.map(p=>{
      const poste = getPoste(p.posteId);
      return `<tr class="clickable" data-route="competences/personnes/${p.id}"><td data-label="Collaborateur"><div class="cell-title">${esc(p.name)}</div><div class="cell-sub">${poste?esc(poste.intitule):"—"}</div></td>
      ${comps.map(c=>{
        const req = poste ? poste.competencesRequises.find(r=>r.competenceId===c.id) : null;
        if(!req) return `<td data-label="${esc(c.nom)}" style="text-align:center;color:var(--text-secondary);">—</td>`;
        const row = personCompetenceRow(p.id, req);
        const color = row.statut==="conforme"?"var(--success)":row.statut==="a_renforcer"?"var(--danger)":"var(--text-secondary)";
        const val = row.niveauActuel===null?"?":row.niveauActuel;
        return `<td data-label="${esc(c.nom)}" style="text-align:center;font-weight:700;color:${color};">${val}</td>`;
      }).join("")}</tr>`;
    }).join("")}</tbody>
  </table></div>
  <p class="text-xs mt-2">🟢 Conforme · 🔴 À renforcer · « ? » Non évalué · « — » Compétence non requise pour le poste.</p>`;
}
function applyCompetenceMatrixFilters(){
  const service = document.getElementById("f-comp-service")?.value;
  const posteId = document.getElementById("f-comp-poste")?.value;
  const compId = document.getElementById("f-comp-competence")?.value;
  let people = DB.people;
  if(service) people = people.filter(p=>p.service===service);
  if(posteId) people = people.filter(p=>p.posteId===posteId);
  let comps = DB.competences.filter(c=>c.actif);
  if(compId) comps = comps.filter(c=>c.id===compId);
  document.getElementById("comp-matrix-zone").innerHTML = competenceMatrixTable(people, comps);
}

/* ---------- Référentiel des habilitations ---------- */
function pageHabilitations(){
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Habilitations"}])}
  ${pageHeader("Référentiel des habilitations","", `<button class="btn btn-primary" data-open-habilitation-form>+ Nouvelle habilitation</button>`)}
  <div class="grid grid-3">
    ${DB.habilitations.map(h=>{
      const nb = DB.personHabilitations.filter(ph=>ph.habilitationId===h.id).length;
      return `<div class="card card-hover" data-route="competences/habilitations/${h.id}">
        <div class="flex justify-between items-center"><span class="badge badge-neutral">${esc(h.code)}</span>${!h.actif?badgeRaw("neutral","Inactive"):""}</div>
        <h3 class="mt-2">${esc(h.nom)}</h3>
        <p class="text-sm mt-2">${esc(h.activite)}</p>
        <p class="text-xs mt-2">${nb} attribution(s) · Validité ${h.dureeValiditeMois} mois</p>
      </div>`;
    }).join("")}
  </div>`;
}
function pageHabilitationFiche(id){
  const h = getHabilitation(id);
  if(!h) return emptyState("🪪","Habilitation introuvable","Cette habilitation n'existe pas.");
  const attributions = DB.personHabilitations.filter(ph=>ph.habilitationId===id).map(ph=>({...ph, statutCalcule:habilitationStatusCompute(ph), person:getPerson(ph.personId)}));
  const comps = (h.competencesNecessaires||[]).map(getCompetence).filter(Boolean);
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Habilitations",href:"#/competences/habilitations"},{label:h.nom}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center">
      <span class="badge badge-neutral">${esc(h.code)}</span>
      <button class="btn btn-secondary btn-sm" data-open-habilitation-form="${h.id}">✏️ Modifier</button>
    </div>
    <h1 class="mt-2">${esc(h.nom)}</h1>
    <p class="section-sub mt-2">${esc(h.activite)} · Niveau ${esc(h.niveau)} · Validité ${h.dureeValiditeMois} mois</p>
    <p class="text-sm mt-4" style="color:var(--text-primary);">${esc(h.description)}</p>
    <div class="grid grid-2 mt-4">
      <div><div class="text-xs">AUTORITÉ POUVANT ATTRIBUER</div><div class="text-sm" style="color:var(--text-primary)">${esc(h.autorite)}</div></div>
      <div><div class="text-xs">PRÉREQUIS</div><div class="text-sm" style="color:var(--text-primary)">${esc(h.prerequis||"—")}</div></div>
    </div>
    <p class="text-xs mt-4">Compétences nécessaires : ${comps.map(c=>esc(c.nom)).join(", ")||"—"}</p>
    <p class="text-xs mt-2">${h.formationObligatoire?"✓ Formation obligatoire":""} ${h.evaluationObligatoire?"· ✓ Évaluation obligatoire":""}</p>
  </div>
  <div class="card">
    <div class="flex justify-between items-center mb-2"><h3>Attributions</h3><button class="btn btn-secondary btn-sm" data-attribute-habilitation="${h.id}">+ Attribuer</button></div>
    ${dataTable(
      [ {label:"Collaborateur", render:a=>a.person?esc(a.person.name):"—"},
        {label:"Date d'attribution", render:a=>fmtDate(a.dateAttribution)},
        {label:"Expiration", render:a=>fmtDate(a.dateExpiration)},
        {label:"Statut", render:a=>badge(LABELS.habilitationStatut[a.statutCalcule])},
        {label:"", render:a=>`<button class="btn btn-secondary btn-sm" data-renew-habilitation="${a.id}">Renouveler</button> <button class="btn btn-ghost btn-sm" data-suspend-habilitation="${a.id}">${a.statut==='suspendue'?'Réactiver':'Suspendre'}</button>`} ],
      attributions
    )}
  </div>`;
}

/* ---------- Fiche collaborateur ---------- */
function pagePersonnes(){
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Collaborateurs"}])}
  ${pageHeader("Collaborateurs","", `<button class="btn btn-primary" data-open-person-form>+ Nouveau collaborateur</button>`)}
  <div class="grid grid-3">
    ${DB.people.map(p=>{
      const poste = getPoste(p.posteId);
      const rate = personConformityRate(p.id);
      const today = new Date().toISOString().slice(0,10);
      const revueEnRetard = p.prochaineRevue && p.prochaineRevue<today;
      return `<div class="card card-hover" data-route="competences/personnes/${p.id}">
        <div class="flex justify-between items-center"><h3>${esc(p.name)}</h3>${rate!==null?badgeRaw(rate>=80?"success":"warning",rate+"%"):badgeRaw("neutral","Non évalué")}</div>
        <p class="text-sm mt-2">${poste?esc(poste.intitule):"—"} · ${esc(p.service)}</p>
        ${revueEnRetard?`<p class="text-xs mt-2" style="color:var(--danger);">🔴 Revue de compétences en retard</p>`:""}
      </div>`;
    }).join("")}
  </div>`;
}
function personTabsHtml(p, active){
  const tabs = [{id:"infos",label:"Informations"},{id:"matrice",label:"Matrice individuelle"},{id:"evaluations",label:"Évaluations"},{id:"preuves",label:"Preuves"},{id:"habilitations",label:"Habilitations"},{id:"revues",label:"Revues"}];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="competences/personnes/${p.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}
function pagePersonneFiche(id, tab){
  const p = getPerson(id);
  if(!p) return emptyState("👤","Collaborateur introuvable","Ce collaborateur n'existe pas.");
  tab = tab || "infos";
  const poste = getPoste(p.posteId);
  const rate = personConformityRate(p.id);
  const header = `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Collaborateurs",href:"#/competences/personnes"},{label:p.name}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center">
      <div><h1>${esc(p.name)}</h1><p class="section-sub mt-2">${poste?esc(poste.intitule):"—"} · ${esc(p.service)}${p.manager?" · Manager : "+esc(p.manager):""}</p></div>
      <div class="flex gap-2 items-center">
        ${rate!==null?badgeRaw(rate>=80?"success":"warning","Conformité : "+rate+"%"):badgeRaw("neutral","Non évalué")}
        <button class="btn btn-secondary btn-sm" data-open-person-form="${p.id}">✏️</button>
      </div>
    </div>
  </div>
  ${personTabsHtml(p, tab)}`;
  let body = "";
  if(tab==="infos") body = personTabInfos(p, poste);
  else if(tab==="matrice") body = personTabMatrice(p);
  else if(tab==="evaluations") body = personTabEvaluations(p);
  else if(tab==="preuves") body = personTabPreuves(p);
  else if(tab==="habilitations") body = personTabHabilitations(p);
  else if(tab==="revues") body = personTabRevues(p);
  return header + body;
}
function personTabInfos(p, poste){
  return `
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Informations</h3>
      <p class="text-sm">Fonction : ${poste?esc(poste.intitule):"—"}</p>
      <p class="text-sm mt-2">Service : ${esc(p.service)}</p>
      <p class="text-sm mt-2">Manager : ${esc(p.manager||"—")}</p>
      <p class="text-sm mt-2">Date d'entrée : ${fmtDate(p.dateEntree)}</p>
      <p class="text-sm mt-2">Dernière revue : ${p.derniereRevue?fmtDate(p.derniereRevue):"Jamais réalisée"}</p>
      <p class="text-sm mt-2">Prochaine revue : ${fmtDate(p.prochaineRevue)}</p>
    </div>
    <div class="card">
      <h3 class="mb-2">Processus rattaché</h3>
      ${p.processId?(()=>{const pr=getProcess(p.processId); return pr?`<div class="rel-link" data-route="processus/${pr.id}"><span class="rel-name">🧩 ${esc(pr.name)}</span><span class="chev">›</span></div>`:"";})():`<p class="text-sm">—</p>`}
    </div>
  </div>`;
}
function personTabMatrice(p){
  const rows = personMatrix(p.id);
  return `
  ${!rows.length?`<div class="card">${emptyState("🗂️","Aucune compétence requise","Ce collaborateur n'est rattaché à aucun poste avec compétences définies.")}</div>`:dataTable(
    [ {label:"Compétence", render:r=>esc(r.competence.nom)},
      {label:"Niveau requis", render:r=>r.niveauRequis+" — "+esc(LABELS.niveauCompetence[r.niveauRequis])},
      {label:"Niveau actuel", render:r=>r.niveauActuel===null?"—":r.niveauActuel+" — "+esc(LABELS.niveauCompetence[r.niveauActuel])},
      {label:"Écart", render:r=>r.ecart===null?"—":(r.ecart>=0?"+":"")+r.ecart},
      {label:"Statut", render:r=>badge(LABELS.ecartStatut[r.statut])},
      {label:"", render:r=>`
        <button class="btn btn-secondary btn-sm" data-open-evaluation-form='${jsonAttr({personId:p.id, competenceId:r.competence.id})}'>Évaluer</button>
        ${r.statut==="a_renforcer"?`<button class="btn btn-secondary btn-sm" data-create-dev-action='${jsonAttr({personId:p.id, competenceId:r.competence.id})}'>+ Action</button>`:""}
      `} ],
    rows
  )}`;
}
function personTabEvaluations(p){
  const evals = DB.competenceEvaluations.filter(e=>e.personId===p.id).sort((a,b)=>b.date.localeCompare(a.date));
  return dataTable(
    [ {label:"Compétence", render:e=>{const c=getCompetence(e.competenceId); return c?esc(c.nom):"—";}},
      {label:"Niveau évalué", render:e=>e.niveauEvalue},
      {label:"Date", render:e=>fmtDate(e.date)},
      {label:"Évaluateur", render:e=>esc(e.evaluateur)},
      {label:"Méthode", render:e=>esc(e.methode)},
      {label:"Résultat", render:e=>esc(e.resultat)} ],
    evals, {emptyEmoji:"📋", emptyTitle:"Aucune évaluation", emptyText:"Aucune évaluation n'a encore été enregistrée."}
  );
}
function personTabPreuves(p){
  const preuves = DB.competencePreuves.filter(pr=>pr.personId===p.id);
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-preuve-form="${p.id}">+ Ajouter une preuve</button></div>
  ${preuves.length? preuves.map(pr=>{
    const c = getCompetence(pr.competenceId);
    const doc = pr.documentId ? getDocument(pr.documentId) : null;
    return `<div class="card mb-2">
      <div class="flex justify-between items-center"><h3 style="font-size:14.5px;">${esc(pr.label)}</h3>${badgeRaw("info",LABELS.preuveCompetenceType[pr.type]||pr.type)}</div>
      <p class="text-sm mt-2">Compétence : ${c?esc(c.nom):"—"} · ${fmtDate(pr.date)} · Évaluateur : ${esc(pr.evaluateur)}</p>
      <p class="text-xs mt-2">Résultat : ${esc(pr.resultat)}</p>
      ${doc?`<div class="rel-link" data-route="documents/${doc.type}/${doc.id}"><span class="rel-name">📄 ${esc(doc.title)}</span></div>`:""}
    </div>`;
  }).join("") : `<div class="card">${emptyState("📎","Aucune preuve","Aucune preuve de compétence n'a encore été associée.")}</div>`}`;
}
function personTabHabilitations(p){
  const list = personHabilitationsList(p.id);
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-attribute-habilitation-for="${p.id}">+ Attribuer une habilitation</button></div>
  ${list.length? dataTable(
    [ {label:"Habilitation", render:ph=>ph.habilitation?esc(ph.habilitation.nom):"—"},
      {label:"Attribution", render:ph=>fmtDate(ph.dateAttribution)},
      {label:"Expiration", render:ph=>fmtDate(ph.dateExpiration)},
      {label:"Statut", render:ph=>badge(LABELS.habilitationStatut[ph.statutCalcule])},
      {label:"", render:ph=>`<button class="btn btn-secondary btn-sm" data-renew-habilitation="${ph.id}">Renouveler</button>`} ],
    list
  ) : `<div class="card">${emptyState("🪪","Aucune habilitation","Aucune habilitation n'est attribuée à ce collaborateur.")}</div>`}`;
}
function personTabRevues(p){
  const reviews = DB.competenceReviews.filter(r=>r.personId===p.id).sort((a,b)=>b.date.localeCompare(a.date));
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-review-form="${p.id}">+ Nouvelle revue</button></div>
  ${reviews.length? reviews.map(r=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center"><h3 style="font-size:14.5px;">Revue du ${fmtDate(r.date)}</h3><span class="text-xs">Évaluateur : ${esc(r.evaluateur)}</span></div>
      <p class="text-sm mt-2"><strong>Compétences maîtrisées :</strong> ${r.competencesMaitrisees.join(", ")||"—"}</p>
      <p class="text-sm mt-2"><strong>À renforcer :</strong> ${r.competencesARenforcer.join(", ")||"—"}</p>
      <p class="text-sm mt-2"><strong>Conclusion :</strong> ${esc(r.conclusion)}</p>
      <p class="text-xs mt-2">Prochaine revue : ${fmtDate(r.prochaineDateRevue)}</p>
    </div>`).join("") : `<div class="card">${emptyState("📝","Aucune revue","Aucune revue de compétences n'a encore été réalisée pour ce collaborateur.")}</div>`}`;
}

/* ---------- Vue Auditeur ---------- */
function pageCompetenceAuditeur(){
  const s = competenceDashboardStats();
  const nonEvaluees = [];
  DB.people.forEach(p=> personMatrix(p.id).filter(r=>r.statut==="non_evalue" && r.obligatoire).forEach(r=> nonEvaluees.push({person:p, row:r})));
  const habExpirees = DB.personHabilitations.map(ph=>({...ph, statutCalcule:habilitationStatusCompute(ph)})).filter(ph=>ph.statutCalcule==="expiree");
  const today = new Date().toISOString().slice(0,10);
  const revuesRetard = DB.people.filter(p=>p.prochaineRevue && p.prochaineRevue<today);
  return `
  ${breadcrumb([{label:"Compétences & Habilitations",href:"#/competences"},{label:"Vue Auditeur"}])}
  ${pageHeader("État des compétences et habilitations","Vue synthétique conçue pour répondre rapidement aux questions d'un audit RH.")}
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val">${DB.people.length}</div><div class="lbl">Collaborateurs</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${DB.postes.length}</div><div class="lbl">Postes</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--primary)">${s.pctConformes} %</div><div class="lbl">Taux de conformité</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${s.ecarts?'var(--danger)':'var(--success)'}">${s.ecarts}</div><div class="lbl">Écarts</div></div></div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Formations obligatoires non réalisées / compétences non évaluées</h3>
      ${nonEvaluees.length?nonEvaluees.slice(0,8).map(x=>`<div class="rel-link" data-route="competences/personnes/${x.person.id}"><span class="rel-name">${esc(x.person.name)} — ${esc(x.row.competence.nom)}</span></div>`).join(""):`<p class="text-sm">Toutes les compétences obligatoires sont évaluées.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Habilitations expirées</h3>
      ${habExpirees.length?habExpirees.map(ph=>{const person=getPerson(ph.personId); return `<div class="rel-link" data-route="competences/personnes/${ph.personId}"><span class="rel-name">${person?esc(person.name):"—"} — ${esc(ph.habilitation?ph.habilitation.nom:getHabilitation(ph.habilitationId).nom)}</span></div>`;}).join(""):`<p class="text-sm">Aucune habilitation expirée.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Revues de compétences en retard</h3>
      ${revuesRetard.length?revuesRetard.map(p=>`<div class="rel-link" data-route="competences/personnes/${p.id}"><span class="rel-name">${esc(p.name)}</span></div>`).join(""):`<p class="text-sm">Aucune revue en retard.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Réponses aux questions d'audit RH</h3>
      <p class="text-xs">1. Compétences définies par fonction ? <strong>Oui</strong> — ${DB.postes.length} postes avec exigences formalisées.</p>
      <p class="text-xs mt-2">2-3. Compétences détenues et évaluées ? ${DB.competenceEvaluations.length} évaluation(s) enregistrée(s).</p>
      <p class="text-xs mt-2">4. Écarts identifiés ? ${s.ecarts} écart(s) détecté(s) automatiquement.</p>
      <p class="text-xs mt-2">5. Actions suivies ? ${DB.actions.filter(a=>a.origin==="competence").length} action(s), dont ${s.formationsAFaire} en cours.</p>
      <p class="text-xs mt-2">7. Habilitations suivies ? ${s.habActives} active(s), ${s.habExpirees} expirée(s).</p>
      <p class="text-xs mt-2">8. Preuves disponibles ? ${DB.competencePreuves.length} preuve(s) enregistrée(s), consultables depuis chaque évaluation.</p>
      <p class="text-xs mt-2">9. Revues réalisées ? ${DB.competenceReviews.length} revue(s) enregistrée(s) ; ${revuesRetard.length} en retard.</p>
    </div>
  </div>`;
}

