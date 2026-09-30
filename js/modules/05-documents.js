/* ============================================================
   7. DOCUMENTS — système documentaire intelligent
   ============================================================ */
const DOC_SECTIONS = [
  {key:"all", label:"Tous les documents"},
  {key:"politique", label:"Politique qualité"},
  {key:"charte", label:"Charte qualité"},
  {key:"manuel", label:"Manuel qualité"},
  {key:"processus", label:"Fiches processus"},
  {key:"procedure", label:"Procédures"},
  {key:"mode_operatoire", label:"Modes opératoires"},
  {key:"formulaire", label:"Formulaires"},
  {key:"enregistrement", label:"Enregistrements"},
  {key:"obsolete", label:"Documents obsolètes"},
];

/* ---------- Relations, santé documentaire, IA ---------- */
function docRelations(doc){
  const process = doc.processId ? getProcess(doc.processId) : null;
  const isWorkDoc = doc.type==="procedure" || doc.type==="mode_operatoire" || doc.type==="instruction";
  const risks = [...new Set([...(doc.riskIds||[]), ...(process && isWorkDoc ? DB.risks.filter(r=>r.processId===process.id && r.type==="risque").map(r=>r.id) : [])])].map(getRisk).filter(Boolean);
  const audits = [...new Set([...(doc.auditIds||[]), ...(process ? DB.audits.filter(a=>a.processId===process.id).map(a=>a.id) : [])])].map(getAudit).filter(Boolean);
  const indicators = [...new Set([...(doc.indicatorIds||[]), ...(process ? DB.indicators.filter(i=>i.processId===process.id).map(i=>i.id) : [])])].map(getIndicator).filter(Boolean);
  const actions = [...new Set([...(doc.actionIds||[]), ...(process && isWorkDoc ? DB.actions.filter(a=>a.processId===process.id).map(a=>a.id) : [])])].map(getAction).filter(Boolean);
  const requirements = (doc.requirementIds||[]).map(id=>findBy(DB.requirements,id)).filter(Boolean);
  // Multi-référentiel : une même preuve (ce document) peut répondre à plusieurs référentiels — jamais dupliquée, toujours recensée.
  const legacyExigences = requirements.map(r=>({ref:r.ref, label:r.label, referentielId:"ISO9001", referentielName:"ISO 9001"}));
  const customExigences = DB.customExigences.filter(e=>(e.docIds||[]).includes(doc.id)).map(e=>{
    const rf = getReferentiel(e.referentielId);
    return {ref:e.ref, label:e.title, referentielId:e.referentielId, referentielName: rf?rf.name:e.referentielId};
  });
  const allExigences = [...legacyExigences, ...customExigences];
  const trainings = DB.trainings.filter(t=>t.documentId===doc.id);
  const changes = DB.changes.filter(c=>(c.impacted.documents||[]).includes(doc.id));
  const events = process ? DB.events.filter(e=>e.processId===process.id && (e.type==="non_conformite"||e.type==="reclamation")) : [];
  const crossDocs = (doc.crossDocIds||[]).map(getDocument).filter(Boolean);
  return {process, risks, audits, indicators, actions, requirements, allExigences, trainings, changes, events, crossDocs};
}

function documentHealthIssues(doc){
  const issues = [];
  const today = new Date();
  if(doc.status==="a_reviser") issues.push({level:"warning", text:"Ce document est en attente de révision."});
  if(doc.nextReview && doc.nextReview!=="—"){
    const nr = new Date(doc.nextReview+"T00:00:00");
    if(!isNaN(nr) && nr<today && doc.status!=="obsolete") issues.push({level:"danger", text:"La date de révision prévue ("+fmtDate(doc.nextReview)+") est dépassée."});
  }
  const rel = docRelations(doc);
  rel.crossDocs.forEach(cd=>{ if(cd.status==="obsolete") issues.push({level:"danger", text:"Ce document référence un document obsolète : « "+cd.title+" »."}); });
  (doc.riskIds||[]).forEach(id=>{ if(!getRisk(id)) issues.push({level:"danger", text:"Référence brisée vers un risque inexistant ("+id+")."}); });
  (doc.auditIds||[]).forEach(id=>{ if(!getAudit(id)) issues.push({level:"danger", text:"Référence brisée vers un audit inexistant ("+id+")."}); });
  if(doc.type==="procedure" && rel.risks.length===0) issues.push({level:"warning", text:"Aucun risque n'est associé à cette procédure."});
  const dup = DB.documents.find(d=>d.id!==doc.id && d.processId===doc.processId && d.type===doc.type && d.status!=="obsolete" &&
    d.title.toLowerCase().split(" ").filter(w=>w.length>4).some(w=>doc.title.toLowerCase().includes(w)));
  if(dup) issues.push({level:"warning", text:"Ce document semble recouper « "+dup.title+" »."});
  return issues;
}
function documentHealthStatus(doc){
  const issues = documentHealthIssues(doc);
  if(issues.some(i=>i.level==="danger")) return "rouge";
  if(issues.some(i=>i.level==="warning")) return "orange";
  return "vert";
}

function documentAIInsights(){
  const insights = [];
  DB.processes.forEach(p=>{
    const hasProc = DB.documents.some(d=>d.processId===p.id && d.type==="procedure" && d.status!=="obsolete");
    if(!hasProc) insights.push("Aucune procédure ne couvre actuellement le processus « "+p.name+" ».");
  });
  DB.requirements.filter(r=>r.status==="non_couvert").forEach(r=> insights.push("L'exigence "+r.ref+" — "+r.label+" — n'est couverte par aucun document."));
  const aReviser = DB.documents.filter(d=>d.status==="a_reviser");
  if(aReviser.length) insights.push(aReviser.length+" document(s) sont en attente de révision : "+aReviser.map(d=>d.ref).join(", ")+".");
  const flagged = new Set();
  DB.documents.filter(d=>d.status!=="obsolete").forEach(d=>{
    const dup = DB.documents.find(d2=>d2.id!==d.id && d2.status!=="obsolete" && d2.processId===d.processId && d2.type===d.type &&
      !flagged.has(d.id+"|"+d2.id) && !flagged.has(d2.id+"|"+d.id) &&
      d.title.toLowerCase().split(" ").filter(w=>w.length>4).some(w=>d2.title.toLowerCase().includes(w)));
    if(dup){ insights.push("Les documents « "+d.title+" » et « "+dup.title+" » semblent couvrir un sujet proche."); flagged.add(d.id+"|"+dup.id); }
  });
  return insights;
}

/* ---------- Hub documentaire ---------- */
function pageDocuments(section){
  let docs;
  let title;
  if(section==="all"){ docs = DB.documents.filter(d=>d.status!=="obsolete" && matchesScope(d)); title="Tous les documents"; }
  else if(section==="obsolete"){ docs = DB.documents.filter(d=>d.status==="obsolete"); title="Documents obsolètes"; }
  else { docs = DB.documents.filter(d=>d.type===section); title = DOC_SECTIONS.find(s=>s.key===section)?.label || "Documents"; }

  const chips = DOC_SECTIONS.map(s=>`<a class="chip ${s.key===section?'active':''}" data-route="documents/${s.key}">${esc(s.label)}</a>`).join("");
  const healthCounts = {vert:0,orange:0,rouge:0};
  DB.documents.filter(d=>d.status!=="obsolete").forEach(d=> healthCounts[documentHealthStatus(d)]++);

  const cards = docs.map(d=>{
    const p = getProcess(d.processId);
    const health = documentHealthStatus(d);
    return `<div class="card card-hover" data-route="documents/${d.type}/${d.id}">
      <div class="flex justify-between items-center">
        <span class="text-xs" style="font-weight:700;">${esc(d.ref)}</span>
        <span class="flex gap-2 items-center">${health!=="vert"?badge(LABELS.docHealth[health]):""}${badge(LABELS.docStatus[d.status])}</span>
      </div>
      <h3 class="mt-2">${esc(d.title)}</h3>
      <p class="text-sm mt-2">${esc(LABELS.docType[d.type]||d.type)} · Version ${esc(d.version)}</p>
      <p class="text-xs mt-2">Processus : ${p?esc(p.name):"—"} · Révision : ${fmtDate(d.nextReview)}</p>
    </div>`;
  }).join("");

  return `
  ${pageHeader("Documentation du SMQ", "Chaque document est relié aux processus, risques, audits, indicateurs et actions qu'il impacte.",
    `<button class="btn btn-primary" data-open-quick="document">+ Nouveau document</button>`)}
  <div class="quick-actions mb-4">
    <button class="qa-btn" data-route="documents/sante">🏥 Santé documentaire ${healthCounts.rouge?`<span class="badge badge-danger" style="margin-left:4px;"><span class="badge-dot"></span>${healthCounts.rouge}</span>`:""}</button>
    <button class="qa-btn" data-route="documents/cartographie">📐 Cartographie normative</button>
    <button class="qa-btn" data-route="documents/assistant">🤖 Assistant documentaire</button>
    <button class="qa-btn" data-route="documents/modeles">📚 Bibliothèque de modèles</button>
  </div>
  <div class="filters-bar">${chips}</div>
  <h2 class="mb-2" style="font-size:15px;color:var(--text-secondary);font-weight:650;">${esc(title)} (${docs.length})</h2>
  ${docs.length ? `<div class="grid grid-3">${cards}</div>` : `<div class="card">${emptyState("📭","Aucun document","Aucun document dans cette catégorie pour le moment.")}</div>`}`;
}

function pageDocumentSante(){
  const docs = DB.documents.filter(d=>d.status!=="obsolete");
  const withStatus = docs.map(d=>({doc:d, status:documentHealthStatus(d), issues:documentHealthIssues(d)}));
  const groupLabel = {vert:"🟢 Conforme", orange:"🟠 Vigilance", rouge:"🔴 Action requise"};
  return `
  ${breadcrumb([{label:"Documents",href:"#/documents/all"},{label:"Santé documentaire"}])}
  ${pageHeader("Santé documentaire","Détection automatique des incohérences, références brisées et documents à surveiller.")}
  <div class="grid grid-3">${["rouge","orange","vert"].map(st=>`
    <div class="card">
      <h3 class="mb-2">${groupLabel[st]} (${withStatus.filter(w=>w.status===st).length})</h3>
      ${withStatus.filter(w=>w.status===st).map(w=>`<div class="rel-link" data-route="documents/${w.doc.type}/${w.doc.id}/sante"><span class="rel-name">${esc(w.doc.title)}</span><span class="text-xs">${w.issues.length?w.issues.length+" point(s)":""}</span></div>`).join("") || `<p class="text-sm">Aucun</p>`}
    </div>`).join("")}</div>`;
}

function pageDocumentCartographie(){
  return `
  ${breadcrumb([{label:"Documents",href:"#/documents/all"},{label:"Cartographie normative"}])}
  ${pageHeader("Cartographie normative","Quelle exigence est couverte par quel document — et inversement.")}
  ${dataTable(
    [ {label:"Exigence", render:r=>`<strong>${esc(r.ref)}</strong> — ${esc(r.label)}`},
      {label:"Processus", render:r=>{const p=getProcess(r.processId); return p?esc(p.name):"—";}},
      {label:"Couverture", render:r=>{
        const docs = DB.documents.filter(d=>(d.requirementIds||[]).includes(r.id) && d.status!=="obsolete");
        return docs.length ? badgeRaw("success","Oui — "+docs.map(d=>d.ref).join(", ")) : badgeRaw(r.status==="non_couvert"?"danger":"neutral","Non");
      }} ],
    DB.requirements
  )}`;
}

function pageDocumentAssistant(){
  const insights = documentAIInsights();
  return `
  ${breadcrumb([{label:"Documents",href:"#/documents/all"},{label:"Assistant documentaire"}])}
  ${pageHeader("Assistant documentaire","Analyse automatique de la documentation du SMQ à partir des données réelles.")}
  <div class="card">
    ${insights.length ? `<ul>${insights.map(i=>`<li class="text-sm mt-2">${esc(i)}</li>`).join("")}</ul>` : `<p class="text-sm">Aucune incohérence détectée sur la documentation actuelle. 👍</p>`}
    <p class="text-xs mt-4">Analyse générée à partir des données disponibles dans Qonnect. Ne remplace pas le jugement du responsable qualité.</p>
  </div>`;
}

function pageDocumentTemplates(){
  return `
  ${breadcrumb([{label:"Documents",href:"#/documents/all"},{label:"Bibliothèque de modèles"}])}
  ${pageHeader("Bibliothèque de modèles","Modèles prêts à l'emploi pour ISO 9001, ISO 13485 et ISO 27001. Choisissez-en un puis adaptez-le.")}
  <div class="grid grid-3">${DB.documentTemplates.map(t=>`
    <div class="card">
      <span class="badge badge-info">${esc(t.referentiel)}</span>
      <h3 class="mt-2">${esc(t.title)}</h3>
      <p class="text-xs mt-2">${t.sections.length} sections : ${t.sections.slice(0,3).map(esc).join(", ")}${t.sections.length>3?"…":""}</p>
      <button class="btn btn-secondary btn-sm mt-4" data-open-quick="document" data-preset-template="${t.id}">Utiliser ce modèle</button>
    </div>`).join("")}</div>`;
}

/* ---------- Fiche document ---------- */
const DOC_VIEWS = [{id:"direction",l:"Vue Direction"},{id:"responsable",l:"Vue Responsable"},{id:"operationnelle",l:"Vue Opérationnelle"},{id:"auditeur",l:"Vue Auditeur"}];

function docTabsHtml(doc, active){
  const tabs = [
    {id:"contenu",label:"Contenu"}, {id:"relations",label:"Relations"}, {id:"exigences",label:"Exigences"},
    {id:"impact",label:"Impact"}, {id:"historique",label:"Historique"}, {id:"formation",label:"Formation"}, {id:"sante",label:"Santé documentaire"},
  ];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="documents/${doc.type}/${doc.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}

function docFlowchartHtml(steps){
  return `<div class="conn-diagram" style="gap:10px;">${steps.map((s,i)=>`${i>0?'<div class="conn-arrow"></div>':''}<div class="conn-node" style="cursor:default;"><div class="cn-label" style="font-weight:700;">${esc(s)}</div></div>`).join("")}</div>`;
}

function pageDocumentFiche(id, tab, view){
  const d = getDocument(id);
  if(!d) return emptyState("📄","Document introuvable","Ce document n'existe pas.");
  tab = tab || "contenu";
  view = view || "responsable";
  const rel = docRelations(d);
  const health = documentHealthStatus(d);
  const p = rel.process;

  const header = `
  ${breadcrumb([{label:"Documents",href:"#/documents/all"},{label:LABELS.docType[d.type]||d.type,href:"#/documents/"+d.type},{label:d.title}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px;">
      <div class="flex gap-2 items-center">
        <span class="badge badge-neutral">${esc(d.ref)}</span>
        ${badge(LABELS.docStatus[d.status])}
        ${badge(LABELS.docHealth[health])}
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary btn-sm" data-print>🖨 Exporter (démo)</button>
        <button class="btn btn-danger btn-sm" data-archive-doc="${d.id}">Archiver</button>
      </div>
    </div>
    <h1 class="mt-2">${esc(d.title)}</h1>
    <p class="section-sub mt-2">${esc(LABELS.docType[d.type]||d.type)} · Version ${esc(d.version)}${p?" · Processus : "+esc(p.name):""}</p>
    <div class="grid grid-4 mt-4">
      <div><div class="text-xs">AUTEUR</div><div class="text-sm" style="color:var(--text-primary)">${esc(d.author)}</div></div>
      <div><div class="text-xs">APPROBATEUR</div><div class="text-sm" style="color:var(--text-primary)">${esc(d.approver)}</div></div>
      <div><div class="text-xs">DATE</div><div class="text-sm" style="color:var(--text-primary)">${fmtDate(d.date)}</div></div>
      <div><div class="text-xs">PROCHAINE RÉVISION</div><div class="text-sm" style="color:var(--text-primary)">${fmtDate(d.nextReview)}</div></div>
    </div>
  </div>
  ${docTabsHtml(d, tab)}`;

  let body = "";
  if(tab==="contenu") body = docTabContenu(d, rel, view);
  else if(tab==="relations") body = docTabRelations(d, rel);
  else if(tab==="exigences") body = docTabExigences(d, rel);
  else if(tab==="impact") body = docTabImpact(d, rel);
  else if(tab==="historique") body = docTabHistorique(d);
  else if(tab==="formation") body = docTabFormation(d, rel);
  else if(tab==="sante") body = docTabSante(d);

  return header + body;
}

function docTabContenu(d, rel, view){
  const chips = DOC_VIEWS.map(v=>`<a class="chip ${v.id===view?'active':''}" data-route="documents/${d.type}/${d.id}/contenu/${v.id}">${esc(v.l)}</a>`).join("");
  let inner = "";
  if(view==="direction"){
    const summary = d.body.split("\n")[0].slice(0,240);
    inner = `<div class="card">
      <h3 class="mb-2">Résumé exécutif</h3>
      <p class="text-sm" style="color:var(--text-primary)">${esc(summary)}${d.body.length>240?"…":""}</p>
      <div class="grid grid-4 mt-4">
        <div class="kpi"><div class="val">${rel.risks.length}</div><div class="lbl">Risques</div></div>
        <div class="kpi"><div class="val">${rel.audits.length}</div><div class="lbl">Audits</div></div>
        <div class="kpi"><div class="val">${rel.actions.length}</div><div class="lbl">Actions</div></div>
        <div class="kpi"><div class="val">${rel.allExigences.length}</div><div class="lbl">Exigences</div></div>
      </div>
    </div>`;
  } else if(view==="operationnelle"){
    inner = `<div class="card">
      ${d.flowSteps.length?`<h3 class="mb-2">Étapes</h3>${docFlowchartHtml(d.flowSteps)}`:""}
      <h3 class="mb-2 mt-4">L'essentiel</h3>
      <p class="text-sm" style="color:var(--text-primary);line-height:1.7;">${esc(d.body.split("\n").slice(0,4).join(" "))}</p>
      ${rel.crossDocs.length?`<h3 class="mb-2 mt-4">Formulaires et enregistrements associés</h3>${rel.crossDocs.map(cd=>`<div class="rel-link" data-route="documents/${cd.type}/${cd.id}"><span class="rel-name">${esc(cd.title)}</span></div>`).join("")}`:""}
    </div>`;
  } else if(view==="auditeur"){
    inner = `<div class="card">
      <h3 class="mb-2">Contenu</h3>
      <p class="text-sm" style="color:var(--text-primary);line-height:1.7;white-space:pre-line;">${esc(d.body)}</p>
      <h3 class="mb-2 mt-4">Exigences couvertes</h3>
      ${rel.allExigences.length?rel.allExigences.map(e=>`<div class="rel-link"><span class="rel-name">${esc(e.ref)} — ${esc(e.label)}</span>${badgeRaw("success",e.referentielName)}</div>`).join(""):`<p class="text-sm">Aucune exigence explicitement associée.</p>`}
      <h3 class="mb-2 mt-4">Preuves associées</h3>
      ${rel.audits.map(a=>`<div class="rel-link" data-route="audits/${a.id}"><span class="rel-name">🔍 ${esc(a.title)}</span></div>`).join("")}
      ${rel.actions.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">✅ ${esc(a.title)}</span></div>`).join("")}
      ${(!rel.audits.length && !rel.actions.length)?`<p class="text-sm">Aucune preuve associée pour le moment.</p>`:""}
    </div>`;
  } else {
    inner = `<div class="card">
      ${d.flowSteps.length?`<h3 class="mb-2">Logigramme</h3>${docFlowchartHtml(d.flowSteps)}<div class="mt-4"></div>`:""}
      <h3 class="mb-2">Contenu</h3>
      <p class="text-sm" style="color:var(--text-primary);line-height:1.7;white-space:pre-line;">${esc(d.body)}</p>
    </div>`;
  }
  return `<div class="filters-bar">${chips}</div>${inner}`;
}

function docTabRelations(d, rel){
  const section = (title, items, routeFn, icon)=> items.length? `<div class="card mb-2"><h3 class="mb-2">${esc(title)}</h3>${items.map(x=>`<div class="rel-link" data-route="${routeFn(x)}"><span class="rel-name">${icon} ${esc(x.name||x.title)}</span><span class="chev">›</span></div>`).join("")}</div>` : "";
  const hasAny = rel.process || rel.risks.length || rel.audits.length || rel.indicators.length || rel.actions.length || rel.changes.length || rel.crossDocs.length || rel.events.length;
  return `
  ${rel.process?`<div class="card mb-2"><h3 class="mb-2">Processus</h3><div class="rel-link" data-route="processus/${rel.process.id}"><span class="rel-name">🧩 ${esc(rel.process.name)}</span><span class="chev">›</span></div></div>`:""}
  ${section("Risques associés", rel.risks, r=>"risques/"+r.id, "⚠️")}
  ${section("Audits associés", rel.audits, a=>"audits/"+a.id, "🔍")}
  ${section("Indicateurs associés", rel.indicators, i=>"objectifs", "📊")}
  ${section("Actions associées", rel.actions, a=>"actions", "✅")}
  ${section("Changements associés", rel.changes, c=>"changements/"+c.id, "🔄")}
  ${section("Non-conformités / réclamations associées", rel.events, e=>"evenements/"+e.type+"/"+e.id, "🚨")}
  ${section("Documents liés", rel.crossDocs, cd=>"documents/"+cd.type+"/"+cd.id, "📄")}
  ${!hasAny ? `<div class="card">${emptyState("🔗","Aucune relation","Ce document n'est pas encore relié à d'autres éléments du SMQ.")}</div>` : ""}
  `;
}

function docTabExigences(d, rel){
  const byRef = {};
  rel.allExigences.forEach(e=>{ (byRef[e.referentielName]=byRef[e.referentielName]||[]).push(e); });
  const refNames = Object.keys(byRef);
  return `
  <div class="card mb-2">
    <p class="text-sm">Référentiel(s) associé(s) au document : ${(d.referentiels||[]).map(esc).join(", ")||"—"}</p>
    ${refNames.length>1?`<p class="text-xs mt-2">🔗 Ce document répond à ${refNames.length} référentiels différents — la même preuve est réutilisée, jamais dupliquée.</p>`:""}
  </div>
  ${refNames.length? refNames.map(rn=>`
    <div class="card mb-2">
      <h3 class="mb-2">${esc(rn)}</h3>
      ${byRef[rn].map(e=>`<div class="rel-link"><span class="rel-name">${esc(e.ref)} — ${esc(e.label)}</span>${badgeRaw("success","Couverte")}</div>`).join("")}
    </div>`).join("")
    : `<div class="card">${emptyState("📐","Aucune exigence associée","Ce document n'est pas encore relié à une exigence normative précise.")}</div>`}`;
}

function docTabImpact(d, rel){
  const otherDocs = DB.documents.filter(d2=>d2.id!==d.id && d2.processId===d.processId && d.processId && d2.status!=="obsolete");
  return `
  <div class="card mb-4">
    <h3 class="mb-2">Si ce document est modifié, cela impacte :</h3>
    <div class="grid grid-4">
      <div class="kpi"><div class="val">${rel.process?1:0}</div><div class="lbl">Processus</div></div>
      <div class="kpi"><div class="val">${rel.risks.length}</div><div class="lbl">Risques</div></div>
      <div class="kpi"><div class="val">${rel.audits.length}</div><div class="lbl">Audits</div></div>
      <div class="kpi"><div class="val">${rel.actions.filter(a=>a.status!=="termine").length}</div><div class="lbl">Actions ouvertes</div></div>
      <div class="kpi"><div class="val">${rel.trainings.length}</div><div class="lbl">Formation(s)</div></div>
      <div class="kpi"><div class="val">${otherDocs.length}</div><div class="lbl">Autres documents</div></div>
    </div>
  </div>
  ${otherDocs.length?`<div class="card"><h3 class="mb-2">Autres documents du même processus</h3>${otherDocs.map(od=>`<div class="rel-link" data-route="documents/${od.type}/${od.id}"><span class="rel-name">${esc(od.title)}</span></div>`).join("")}</div>`:""}
  `;
}

function docTabHistorique(d){
  const history = DB.documentHistory[d.id] || [{version:d.version, date:d.date, note:"Version en vigueur"}];
  return `<div class="card">${history.map(h=>`<div class="rel-link"><span class="rel-name">Version ${esc(h.version)}</span><span class="text-sm">${fmtDate(h.date)}${h.note?" · "+esc(h.note):""}</span></div>`).join("")}</div>`;
}

function docTabFormation(d, rel){
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-training-form="${d.id}">+ Lancer une campagne de lecture</button></div>
  ${rel.trainings.length? rel.trainings.map(t=>{
    const pct = Math.round(t.completedBy.length/Math.max(t.audience.length,1)*100);
    return `<div class="card mb-2">
      <div class="flex justify-between items-center"><h3>${esc(t.title)}</h3><span class="text-sm" style="font-weight:700;">${pct}%</span></div>
      <div class="progress mt-2"><div style="width:${pct}%"></div></div>
      <p class="text-xs mt-2">Échéance : ${fmtDate(t.dueDate)}${t.quiz?" · Quiz associé":""}</p>
      <div class="mt-2">${t.audience.map(name=>`<span class="badge ${t.completedBy.includes(name)?'badge-success':'badge-neutral'}" style="margin-right:6px;margin-top:6px;display:inline-flex;">${t.completedBy.includes(name)?"✓ ":""}${esc(name)}</span>`).join("")}</div>
      ${t.audience.some(n=>!t.completedBy.includes(n))?`<button class="btn btn-secondary btn-sm mt-4" data-mark-training-read="${t.id}">Marquer une lecture</button>`:""}
    </div>`;
  }).join("") : `<div class="card">${emptyState("🎓","Aucune campagne","Aucune prise de connaissance n'a encore été organisée pour ce document.")}</div>`}`;
}

function docTabSante(d){
  const issues = documentHealthIssues(d);
  const status = documentHealthStatus(d);
  return `
  <div class="card mb-4"><div class="flex items-center gap-3">${badge(LABELS.docHealth[status])}<span class="text-sm">${issues.length} point(s) détecté(s)</span></div></div>
  ${issues.length? issues.map(i=>`<div class="card mb-2"><p class="text-sm">${i.level==="danger"?"🔴":"🟠"} ${esc(i.text)}</p></div>`).join("") : `<div class="card">${emptyState("🟢","Aucune anomalie détectée","Ce document est cohérent avec le reste du système documentaire.")}</div>`}`;
}

