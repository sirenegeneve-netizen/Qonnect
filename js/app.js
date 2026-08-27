/* ============================================================
   QONNECT — Application (routeur, pages, interactions)
   Vanilla JS uniquement — aucune dépendance externe.
   ============================================================ */

/* ---------------------------------------------------------
   1. CONFIGURATION DE LA NAVIGATION
   --------------------------------------------------------- */
const NAV = [
  { items:[
      {route:"dashboard", icon:"🏠", label:"Vue d'ensemble"},
      {route:"contexte", icon:"🧭", label:"Contexte & Stratégie"},
  ]},
  { title:"Pilotage", items:[
      {route:"revue-direction", icon:"📅", label:"Revue de Direction"},
  ]},
  { title:"Système de management", items:[
      {route:"processus", icon:"🧩", label:"Processus"},
      {route:"risques", icon:"⚠️", label:"Risques & opportunités"},
      {route:"objectifs", icon:"🎯", label:"Objectifs & indicateurs"},
      {route:"changements", icon:"🔄", label:"Changements"},
  ]},
  { title:"Système documentaire", items:[
      {route:"documents/politique", icon:"📜", label:"Politique qualité"},
      {route:"documents/charte", icon:"📗", label:"Charte qualité"},
      {route:"documents/manuel", icon:"📘", label:"Manuel qualité"},
      {route:"documents/procedure", icon:"📄", label:"Procédures"},
      {route:"documents/mode_operatoire", icon:"🛠️", label:"Modes opératoires"},
      {route:"documents/formulaire", icon:"🧾", label:"Formulaires"},
      {route:"documents/enregistrement", icon:"🗂️", label:"Enregistrements"},
      {route:"documents/all", icon:"📚", label:"Tous les documents"},
  ]},
  { title:"Qualité & amélioration", items:[
      {route:"evenements/all", icon:"🚨", label:"Événements"},
      {route:"evenements/non_conformite", icon:"⛔", label:"Non-conformités"},
      {route:"evenements/reclamation", icon:"📮", label:"Réclamations"},
      {route:"actions", icon:"✅", label:"Actions"},
  ]},
  { title:"Ressources humaines", items:[
      {route:"competences", icon:"🎓", label:"Compétences & Habilitations"},
  ]},
  { title:"Achats & partenaires", items:[
      {route:"fournisseurs", icon:"🏭", label:"Fournisseurs"},
  ]},
  { title:"Évaluation", items:[
      {route:"audits", icon:"🔍", label:"Audits"},
      {route:"referentiels", icon:"📐", label:"Référentiels"},
      {route:"conformite", icon:"🛡️", label:"Conformité"},
  ]},
  { items:[
      {route:"ai", icon:"🤖", label:"Qonnect AI"},
      {route:"admin", icon:"⚙️", label:"Administration"},
  ]},
];

const PAGE_TITLES = {
  dashboard:"Vue d'ensemble", contexte:"Contexte & Stratégie", "revue-direction":"Revue de Direction", processus:"Processus", risques:"Risques & opportunités",
  objectifs:"Objectifs & indicateurs", changements:"Changements", documents:"Documentation du SMQ",
  evenements:"Événements & non-conformités", actions:"Actions", audits:"Audits", competences:"Compétences & Habilitations", fournisseurs:"Fournisseurs",
  referentiels:"Référentiels", conformite:"Conformité", connexions:"Connexions du système",
  ai:"Qonnect AI", admin:"Administration",
};

/* ---------------------------------------------------------
   2. SHELL (sidebar + header) — construit une fois
   --------------------------------------------------------- */
function buildShell(){
  const sidebarHtml = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">Q</div>
        <div class="brand-name">QONNECT</div>
      </div>
      <nav class="sidebar-nav">
        ${NAV.map(group=>`
          <div class="nav-group">
            ${group.title?`<div class="nav-group-title">${esc(group.title)}</div>`:""}
            ${group.items.map(it=>`
              <button class="nav-item" data-route="${it.route}" data-nav-key="${it.route.split('/')[0]}">
                <span class="nav-icon">${it.icon}</span><span class="nav-label">${esc(it.label)}</span>
              </button>`).join("")}
          </div>`).join("")}
      </nav>
      <button class="sidebar-collapse-btn" id="collapse-btn">
        <span id="collapse-icon">«</span><span id="collapse-text">Réduire</span>
      </button>
    </aside>
    <div class="sidebar-scrim" id="sidebar-scrim"></div>`;

  const headerHtml = `
    <header class="header">
      <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
      <div class="header-title" id="header-title">Vue d'ensemble</div>
      <div class="header-search">
        <span class="search-icon">🔎</span>
        <input type="text" id="global-search" placeholder="Rechercher dans Qonnect..." autocomplete="off">
        <div class="search-results" id="search-results"></div>
      </div>
      <div class="header-right">
        <button class="icon-btn" title="Notifications"><span class="dot"></span>🔔</button>
        <button class="icon-btn" title="Aide">❓</button>
        <div class="avatar">MC</div>
      </div>
    </header>
    <main class="content" id="content-area"></main>`;

  document.getElementById("root").innerHTML = `
    <div class="app-shell">
      ${sidebarHtml}
      <div class="main-col">
        ${headerHtml}
      </div>
    </div>`;
}

function setActiveNav(moduleKey){
  document.querySelectorAll(".nav-item").forEach(el=>{
    el.classList.toggle("active", el.getAttribute("data-nav-key")===moduleKey);
  });
  document.getElementById("header-title").textContent = PAGE_TITLES[moduleKey] || "Qonnect";
  document.title = "Qonnect — " + (PAGE_TITLES[moduleKey] || "");
}

/* ---------------------------------------------------------
   3. ROUTEUR
   --------------------------------------------------------- */
function parseHash(){
  const raw = (location.hash || "#/dashboard").replace(/^#\/?/, "");
  return raw.split("/").filter(Boolean);
}
function navigate(route){ location.hash = "#/"+route; }

function render(){
  const parts = parseHash();
  const mod = parts[0] || "dashboard";
  const content = document.getElementById("content-area");
  let html = "";
  try{
    switch(mod){
      case "dashboard": html = pageDashboard(); break;
      case "contexte": html = pageContexte(parts[1], parts[2]); break;
      case "revue-direction":
        if(parts[2]==="resume"){ const rv = parts[1] ? getReview(parts[1]) : getLatestReview(); html = rv ? pageRevueSynthese(rv) : emptyState("📅","Revue introuvable","Cette revue de direction n'existe pas."); }
        else html = pageRevueDirection(parts[1], parts[2]);
        break;
      case "processus": html = parts[1] ? pageProcessFiche(parts[1], parts[2]||"general") : pageProcessCarto(); break;
      case "documents":
        if(["sante","cartographie","assistant","modeles"].includes(parts[1]) && !parts[2]){
          html = parts[1]==="sante" ? pageDocumentSante() : parts[1]==="cartographie" ? pageDocumentCartographie() : parts[1]==="assistant" ? pageDocumentAssistant() : pageDocumentTemplates();
        } else {
          html = parts[2] ? pageDocumentFiche(parts[2], parts[3], parts[4]) : pageDocuments(parts[1]||"all");
        }
        break;
      case "risques": html = parts[1] ? pageRiskFiche(parts[1]) : pageRisks(); break;
      case "objectifs": html = pageObjectives(); break;
      case "evenements": html = parts[2] ? pageEventFiche(parts[2]) : pageEvents(parts[1]||"all"); break;
      case "actions": html = pageActions(); break;
      case "audits":
        if(parts[1]==="programme") html = pageAuditProgramme();
        else html = parts[1] ? pageAuditFiche(parts[1], parts[2], parts[3]) : pageAudits();
        break;
      case "changements": html = parts[1] ? pageChangeFiche(parts[1]) : pageChanges(); break;
      case "competences":
        if(!parts[1]) html = pageCompetences();
        else if(parts[1]==="referentiel") html = parts[2] ? pageCompetenceFiche(parts[2]) : pageCompetenceReferentiel();
        else if(parts[1]==="postes") html = parts[2] ? pagePosteFiche(parts[2]) : pagePostes();
        else if(parts[1]==="matrice") html = pageCompetenceMatrice();
        else if(parts[1]==="habilitations") html = parts[2] ? pageHabilitationFiche(parts[2]) : pageHabilitations();
        else if(parts[1]==="personnes") html = parts[2] ? pagePersonneFiche(parts[2], parts[3]) : pagePersonnes();
        else if(parts[1]==="auditeur") html = pageCompetenceAuditeur();
        else html = pageCompetences();
        break;
      case "fournisseurs":
        if(!parts[1]) html = pageFournisseurs();
        else if(parts[1]==="liste") html = parts[2] ? pageFournisseurFiche(parts[2], parts[3]) : pageFournisseursListe();
        else if(parts[1]==="critiques") html = pageFournisseursCritiques();
        else if(parts[1]==="evaluations") html = pageFournisseurEvaluationsHub();
        else if(parts[1]==="audits") html = pageFournisseurAuditsHub();
        else if(parts[1]==="incidents") html = pageFournisseurIncidentsHub();
        else if(parts[1]==="risques") html = pageFournisseurRisquesHub();
        else if(parts[1]==="documents") html = pageFournisseurDocumentsHub();
        else if(parts[1]==="performance") html = pageFournisseurPerformanceHub();
        else if(parts[1]==="vues") html = pageFournisseurVues();
        else html = pageFournisseurs();
        break;
      case "referentiels": html = parts[1] ? pageReferentielDetail(parts[1], parts[2], parts[3]) : pageReferentiels(); break;
      case "conformite": html = pageConformite(parts[1]); break;
      case "connexions": html = pageConnexions(parts[1], parts[2]); break;
      case "ai": html = pageAI(); break;
      case "admin": html = pageAdmin(); break;
      default: html = pageDashboard(); mod="dashboard";
    }
  }catch(err){
    console.error(err);
    html = `<div class="empty-state">${emptyState("⚠️","Une erreur est survenue","Impossible d'afficher cette page.")}
      <div class="card" style="text-align:left;max-width:640px;margin:16px auto 0;">
        <p class="text-xs" style="font-weight:700;">DÉTAIL TECHNIQUE (pour le débogage)</p>
        <p class="text-sm mt-2" style="font-family:monospace;color:var(--danger);word-break:break-word;">${esc(err.message)}</p>
        <p class="text-xs mt-2">Route : ${esc(location.hash)}</p>
      </div>
    </div>`;
  }
  content.innerHTML = html;
  setActiveNav(mod);
  window.scrollTo({top:0});
  if(mod==="ai") aiScrollBottom();
}
window.addEventListener("hashchange", render);

/* ---------------------------------------------------------
   4. HELPERS DE RENDU GÉNÉRIQUES
   --------------------------------------------------------- */
function pageHeader(title, subtitle, actionsHtml){
  return `<div class="section-head">
    <div><h1>${esc(title)}</h1>${subtitle?`<p class="section-sub">${esc(subtitle)}</p>`:""}</div>
    ${actionsHtml?`<div class="flex gap-2">${actionsHtml}</div>`:""}
  </div>`;
}

function dataTable(columns, rows, opts){
  opts = opts || {};
  if(!rows.length){
    return `<div class="card">${emptyState(opts.emptyEmoji||"📭", opts.emptyTitle||"Aucun élément", opts.emptyText||"Rien à afficher pour le moment.", opts.emptyCta||"")}</div>`;
  }
  return `<div class="card card-flush table-wrap"><table class="dt">
    <thead><tr>${columns.map(c=>`<th>${esc(c.label)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row=>`
      <tr class="${opts.rowRoute?'clickable':''}" ${opts.rowRoute?`data-route="${opts.rowRoute(row)}"`:""}>
        ${columns.map(c=>`<td data-label="${esc(c.label)}">${c.render(row)}</td>`).join("")}
      </tr>`).join("")}
    </tbody></table></div>`;
}

function filterSelect(id, label, options, current){
  return `<select id="${id}" data-filter="${id}">
    <option value="">${esc(label)}</option>
    ${options.map(o=>`<option value="${o.v}" ${o.v===current?"selected":""}>${esc(o.l)}</option>`).join("")}
  </select>`;
}

function statusDot(color){ return `<span class="wf-circle" style="width:8px;height:8px;background:${color}"></span>`; }

function priorityDot(p){
  const map = {critique:"var(--danger)", haute:"var(--warning)", moyenne:"var(--info)", basse:"var(--text-secondary)"};
  return map[p]||"var(--text-secondary)";
}

/* ============================================================
   5. PAGE — TABLEAU DE BORD
   ============================================================ */
function pageDashboard(){
  const actionsRetard = DB.actions.filter(a=>a.status==="retard");
  const ncOuvertes = DB.events.filter(e=>e.type==="non_conformite" && e.status==="ouvert");
  const risquesEleves = DB.risks.filter(r=>r.type==="risque" && (r.level==="critique"||r.level==="eleve") && r.status==="ouvert");
  const indHorsCible = DB.indicators.filter(i=>i.status!=="vert");
  const docsAReviser = DB.documents.filter(d=>d.status==="a_reviser");
  const auditsAPreparer = DB.audits.filter(a=>a.status==="planifie");

  const attnRow = (dot, label, route)=>`<div class="attn-row" data-route="${route}">
    <span class="attn-dot" style="background:${dot}"></span><span class="attn-txt">${esc(label)}</span><span class="chev">›</span></div>`;

  const aTraiter = [
    ...actionsRetard.map(a=>attnRow("var(--danger)", `${actionsRetard.length} action(s) en retard`, "actions")).slice(0,1),
    ...ncOuvertes.length ? [attnRow("var(--danger)", `${ncOuvertes.length} non-conformité(s) à analyser`, "evenements/non_conformite")] : [],
    ...risquesEleves.length ? [attnRow("var(--danger)", `${risquesEleves.length} risque(s) élevés ou critiques`, "risques")] : [],
  ];
  const aSurveiller = [
    ...indHorsCible.length ? [attnRow("var(--warning)", `${indHorsCible.length} indicateur(s) hors cible`, "objectifs")] : [],
    ...docsAReviser.length ? [attnRow("var(--warning)", `${docsAReviser.length} document(s) à réviser`, "documents/all")] : [],
    ...auditsAPreparer.length ? [attnRow("var(--warning)", `${auditsAPreparer.length} audit(s) à préparer`, "audits")] : [],
  ];

  const kpi = (val,label,color)=>`<div class="card"><div class="kpi"><div class="val" style="color:${color}">${val}</div><div class="lbl">${esc(label)}</div></div></div>`;

  return `
  <div class="section">
    <h1>Bonjour 👋</h1>
    <p class="section-sub">Voici ce qui mérite votre attention.</p>
  </div>

  <div class="section">
    <div class="grid grid-2">
      <div class="card">
        <h3 class="mb-2">À traiter</h3>
        <div class="attn-list">${aTraiter.length?aTraiter.join(""):`<p class="text-sm">Rien d'urgent à traiter aujourd'hui.</p>`}</div>
      </div>
      <div class="card">
        <h3 class="mb-2">À surveiller</h3>
        <div class="attn-list">${aSurveiller.length?aSurveiller.join(""):`<p class="text-sm">Aucun point de vigilance particulier.</p>`}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Système de management de la qualité</h2></div>
    <div class="grid grid-3">
      ${kpi("94 %","Actions dans les délais","var(--success)")}
      ${kpi("97 %","Documents à jour","var(--success)")}
      ${kpi("89 %","Objectifs suivis","var(--warning)")}
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Actions rapides</h2></div>
    <div class="quick-actions">
      <button class="qa-btn" data-open-quick="event">➕ Déclarer un événement</button>
      <button class="qa-btn" data-open-quick="action">➕ Créer une action</button>
      <button class="qa-btn" data-open-quick="risk">➕ Identifier un risque</button>
      <button class="qa-btn" data-open-quick="document">➕ Créer un document</button>
      <button class="qa-btn" data-open-quick="objective">➕ Créer un objectif</button>
      <button class="qa-btn" data-open-quick="audit">➕ Créer un audit</button>
      <button class="qa-btn" data-open-quick="change">➕ Déclarer un changement</button>
    </div>
  </div>`;
}

/* ============================================================
   5bis. CONTEXTE & STRATÉGIE — fondation du système de management
   ============================================================ */
function contextCounts(){
  return {
    external: DB.contextExternal.length,
    internal: DB.contextInternal.length,
    stakeholders: DB.stakeholders.length,
    needs: DB.stakeholders.reduce((n,s)=>n+s.needs.length,0),
    exigences: DB.stakeholders.reduce((n,s)=>n+s.needs.filter(x=>x.type==="exigence").length,0),
    orientations: DB.orientations.length,
  };
}

function contextImpactStats(){
  const riskIdsFromContext = DB.risks.filter(r=>r.sourceContext).map(r=>r.id);
  const changesImpacted = DB.changes.filter(c=>(c.impacted.risks||[]).some(rid=>riskIdsFromContext.includes(rid))).length;
  return {
    risks: DB.risks.filter(r=>r.sourceContext && r.type==="risque").length,
    opportunities: DB.risks.filter(r=>r.sourceContext && r.type==="opportunite").length,
    objectives: DB.objectives.filter(o=>o.sourceContext).length,
    indicators: DB.indicators.filter(i=>i.objectiveId && getObjective(i.objectiveId) && getObjective(i.objectiveId).sourceContext).length,
    actions: DB.actions.filter(a=>a.sourceContext).length,
    changes: changesImpacted,
  };
}

function contextMaturity(){
  const checks = [
    {ok: DB.contextExternal.length>0, label:"Enjeux externes définis"},
    {ok: DB.contextInternal.length>0, label:"Enjeux internes définis"},
    {ok: DB.stakeholders.length>0, label:"Parties intéressées définies"},
    {ok: DB.stakeholders.some(s=>s.needs.length>0), label:"Besoins et attentes définis"},
    {ok: !!DB.climate.evaluated, label:"Enjeux climatiques évalués"},
    {ok: DB.orientations.length>0, label:"Orientations stratégiques définies"},
    {ok: DB.risks.some(r=>r.sourceContext) || DB.objectives.some(o=>o.sourceContext) || DB.actions.some(a=>a.sourceContext), label:"Liens créés avec le SMQ"},
  ];
  const pct = Math.round(checks.filter(c=>c.ok).length / checks.length * 100);
  const gaps = [];
  if(!DB.stakeholders.some(s=>s.category==="fournisseur" && s.needs.length>0)) gaps.push("Aucune attente fournisseur définie");
  if(!DB.climate.evaluated) gaps.push("Enjeux climatiques non analysés");
  if(DB.orientations.length<2) gaps.push("Objectifs stratégiques incomplets");
  checks.forEach(c=>{ if(!c.ok && gaps.length<6 && !gaps.some(g=>g.includes(c.label.split(" ")[0]))) gaps.push(c.label.replace("définis","non définis").replace("définies","non définies").replace("évalués","non évalués")); });
  return {pct, checks, gaps:gaps.slice(0,6)};
}

function pageContexte(sub, id){
  if(!sub) return pageContexteHub();
  if(sub==="external") return pageContexteIssues("external");
  if(sub==="internal") return pageContexteIssues("internal");
  if(sub==="stakeholders") return id ? pageStakeholderFiche(id) : pageStakeholders();
  if(sub==="besoins") return pageContexteBesoins();
  if(sub==="climate") return pageContexteClimate();
  if(sub==="orientations") return pageOrientations();
  if(sub==="assistant") return pageContexteAssistant();
  if(sub==="carte") return pageContexteCarte();
  if(sub==="direction") return pageContexteDirection();
  return pageContexteHub();
}

function pageContexteHub(){
  const c = contextCounts();
  const impact = contextImpactStats();
  const mat = contextMaturity();

  const blockCard = (route, emoji, title, desc, countLabel)=>`
    <div class="card card-hover" data-route="contexte/${route}">
      <div class="picon" style="margin-bottom:10px;">${emoji}</div>
      <h3>${esc(title)}</h3>
      <p class="text-sm mt-2">${esc(desc)}</p>
      <p class="text-xs mt-4" style="font-weight:700;color:var(--primary);">${esc(countLabel)}</p>
    </div>`;

  const kpi = (route, emoji, count, label)=>`
    <div class="card card-hover" data-route="${route}">
      <div class="kpi"><div class="val">${emoji} ${count}</div><div class="lbl">${esc(label)}</div></div>
    </div>`;

  return `
  ${pageHeader("Notre organisation","Le contexte n'est pas une formalité : c'est le point de départ de tout le système Qonnect.",
    `<button class="btn btn-secondary" data-route="contexte/direction">🧭 Vue Direction</button>`)}

  ${assistantEmbedHtml()}

  <div class="section">
    <div class="grid grid-3">
      ${blockCard("external","🌍","Enjeux externes","Qu'est-ce qui peut influencer votre activité depuis l'extérieur ?", c.external+" enjeu(x) identifié(s)")}
      ${blockCard("internal","🏢","Enjeux internes","Qu'est-ce qui influence votre organisation de l'intérieur ?", c.internal+" enjeu(x) identifié(s)")}
      ${blockCard("stakeholders","🤝","Parties intéressées","Qui a des attentes vis-à-vis de votre organisation ?", c.stakeholders+" partie(s) intéressée(s)")}
      ${blockCard("besoins","📋","Besoins & Attentes","Qu'attendent réellement vos parties intéressées ?", c.needs+" besoin(s)/attente(s) · "+c.exigences+" exigence(s)")}
      ${blockCard("climate","🌱","Enjeux climatiques","Votre activité et le changement climatique.", "Criticité : "+esc(LABELS.importance[DB.climate.criticality]?.l||DB.climate.criticality))}
      ${blockCard("orientations","🎯","Orientations stratégiques","Quels sont les objectifs stratégiques de votre organisation ?", c.orientations+" orientation(s)")}
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>🎯 Impact sur votre système de management</h2></div>
    <p class="section-sub mt-2" style="margin-bottom:16px;">Les informations définies dans votre contexte ont déjà généré les éléments suivants dans votre système.</p>
    <div class="grid grid-3">
      ${kpi("risques","🛡️",impact.risks,"Risques générés")}
      ${kpi("risques","🚀",impact.opportunities,"Opportunités générées")}
      ${kpi("objectifs","🎯",impact.objectives,"Objectifs générés")}
      ${kpi("objectifs","📊",impact.indicators,"Indicateurs générés")}
      ${kpi("actions","✅",impact.actions,"Actions générées")}
      ${kpi("changements","🔄",impact.changes,"Changements impactés")}
    </div>
  </div>

  <div class="section">
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:24px;">
      <div class="card">
        <h3 class="mb-2">📈 Maturité du contexte</h3>
        <div class="flex items-center gap-3">
          ${ringGauge(mat.pct, "var(--primary)", 72)}
          <div class="kpi"><div class="val">${mat.pct} %</div><div class="lbl">du contexte est structuré</div></div>
        </div>
        ${mat.gaps.length ? `<div class="mt-4">
          <div class="text-xs mb-2">POINTS À COMPLÉTER</div>
          ${mat.gaps.map(g=>`<p class="text-sm mt-2">⚠️ ${esc(g)}</p>`).join("")}
        </div>` : `<p class="text-sm mt-4">🟢 Votre contexte est complet.</p>`}
      </div>
      <div class="card">
        <h3 class="mb-2">Comment Qonnect construit votre système</h3>
        <p class="text-sm mb-2">Chaque étape ci-dessous affiche les nombres réels de votre système.</p>
        ${contextImpactFlowHtml()}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>🗺 Carte stratégique</h2></div>
    <p class="section-sub mt-2" style="margin-bottom:16px;">Cliquez sur un élément pour explorer ses relations.</p>
    <div class="card">${contextStrategicMapHtml()}</div>
  </div>`;
}

/* ---------- Diagrammes réutilisables ---------- */
function contextImpactFlowHtml(){
  const stage = (label,count)=>`<div class="rel-link"><span class="rel-name">${esc(label)}</span><span class="text-sm" style="font-weight:700;color:var(--primary)">${count}</span></div>`;
  return `
    ${stage("Contexte", DB.contextExternal.length + DB.contextInternal.length + DB.stakeholders.length)}
    ${stage("Enjeux", DB.contextExternal.length + DB.contextInternal.length)}
    ${stage("Risques & Opportunités", DB.risks.length)}
    ${stage("Objectifs", DB.objectives.length)}
    ${stage("Actions", DB.actions.length)}
    ${stage("Indicateurs", DB.indicators.length)}
    ${stage("Performance", Math.round((DB.requirements.filter(r=>r.status==="maitrise").length/Math.max(DB.requirements.length,1))*100)+" % de maîtrise")}
  `;
}

function contextStrategicMapHtml(){
  const node = (route, emoji, label, count)=>`<div class="conn-node" data-route="${route}"><div class="cn-count">${count}</div><div class="cn-label">${emoji} ${esc(label)}</div></div>`;
  return `
    <div class="conn-diagram" style="gap:16px;">
      ${node("contexte/external","🌍","Enjeux externes", DB.contextExternal.length)}
      <div class="conn-arrow"></div>
      ${node("contexte/internal","🏢","Enjeux internes", DB.contextInternal.length)}
      <div class="conn-arrow"></div>
      ${node("contexte/stakeholders","🤝","Parties intéressées", DB.stakeholders.length)}
      <div class="conn-arrow"></div>
      ${node("risques","⚠️","Risques & opportunités", DB.risks.length)}
      <div class="conn-arrow"></div>
      ${node("objectifs","🎯","Objectifs", DB.objectives.length)}
      <div class="conn-arrow"></div>
      ${node("objectifs","📊","Indicateurs", DB.indicators.length)}
      <div class="conn-arrow"></div>
      ${node("objectifs","🏁","Résultats", DB.objectives.filter(o=>o.status==="atteint").length)}
    </div>`;
}

function pageContexteIssues(kind){
  const list = kind==="external" ? DB.contextExternal : DB.contextInternal;
  const title = kind==="external" ? "Enjeux externes" : "Enjeux internes";
  const question = kind==="external" ? "Qu'est-ce qui peut influencer votre activité depuis l'extérieur ?" : "Qu'est-ce qui influence votre organisation de l'intérieur ?";
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:title}])}
  ${pageHeader(title, question, `<button class="btn btn-primary" data-open-issue-form="${kind}">+ Ajouter un enjeu</button>`)}
  ${list.length ? `<div class="grid grid-3">${list.map(iss=>`
    <div class="card">
      <div class="flex justify-between items-center"><h3>${esc(iss.title)}</h3>${badge(LABELS.importance[iss.importance])}</div>
      <p class="text-sm mt-2">${esc(iss.description)}</p>
      <p class="text-xs mt-4">IMPACT POTENTIEL</p>
      <p class="text-sm">${esc(iss.impact)}</p>
      <button class="btn btn-secondary btn-sm mt-4" data-open-contexte-suggest="${iss.id}">🧠 Générer des suggestions</button>
    </div>`).join("")}</div>`
    : `<div class="card">${emptyState("🌍","Aucun enjeu identifié","Ajoutez les éléments qui influencent votre activité.")}</div>`}`;
}

function pageStakeholders(){
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Parties intéressées"}])}
  ${pageHeader("Parties intéressées","Qui a des attentes vis-à-vis de votre organisation ?", `<button class="btn btn-primary" data-open-stakeholder-form>+ Ajouter une partie intéressée</button>`)}
  ${DB.stakeholders.length ? `<div class="grid grid-3">${DB.stakeholders.map(s=>`
    <div class="card card-hover" data-route="contexte/stakeholders/${s.id}">
      <div class="flex justify-between items-center"><h3>${esc(s.name)}</h3>${badge(LABELS.importance[s.importance])}</div>
      <p class="text-sm mt-2">${esc(LABELS.stakeholderCat[s.category]||s.category)} · Influence ${esc(LABELS.importance[s.influence]?.l||s.influence)}</p>
      <p class="text-xs mt-4">${s.needs.length} besoin(s)/attente(s)/exigence(s)</p>
    </div>`).join("")}</div>`
    : `<div class="card">${emptyState("🤝","Aucune partie intéressée","Ajoutez les parties qui ont des attentes vis-à-vis de votre organisation.")}</div>`}`;
}

function pageStakeholderFiche(id){
  const s = getStakeholder(id);
  if(!s) return emptyState("🤝","Partie intéressée introuvable","Cet élément n'existe pas.");
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Parties intéressées",href:"#/contexte/stakeholders"},{label:s.name}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center">${badge(LABELS.importance[s.importance])}</div>
    <h1 class="mt-2">${esc(s.name)}</h1>
    <p class="section-sub mt-2">${esc(LABELS.stakeholderCat[s.category]||s.category)} · Niveau d'influence : ${esc(LABELS.importance[s.influence]?.l||s.influence)}</p>
  </div>
  <div class="card">
    <div class="flex justify-between items-center mb-2">
      <h3>Besoins, attentes et exigences</h3>
      <button class="btn btn-secondary btn-sm" data-open-need-form="${s.id}">+ Ajouter</button>
    </div>
    ${s.needs.length ? s.needs.map(n=>`<div class="rel-link"><span class="rel-name">${esc(n.text)}</span>${badgeRaw("info",LABELS.needType[n.type]||n.type)}</div>`).join("")
      : `<p class="text-sm">Aucun besoin renseigné pour le moment.</p>`}
  </div>`;
}

function pageContexteBesoins(){
  const rows = [];
  DB.stakeholders.forEach(s=> s.needs.forEach(n=> rows.push({stakeholder:s, need:n})));
  const c = contextCounts();
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Besoins & Attentes"}])}
  ${pageHeader("Besoins & Attentes","Qu'attendent réellement vos parties intéressées ?", `<button class="btn btn-primary" data-open-need-global>+ Ajouter un besoin</button>`)}
  <div class="grid grid-3 mb-4">
    <div class="card"><div class="kpi"><div class="val">${c.needs}</div><div class="lbl">Besoin(s) / attente(s) identifié(s)</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${c.exigences}</div><div class="lbl">Exigence(s) associée(s)</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${DB.stakeholders.length}</div><div class="lbl">Partie(s) intéressée(s) concernée(s)</div></div></div>
  </div>
  ${rows.length ? dataTable(
    [ {label:"Besoin / attente / exigence", render:r=>`<div class="cell-title">${esc(r.need.text)}</div>`},
      {label:"Partie intéressée", render:r=>esc(r.stakeholder.name)},
      {label:"Type", render:r=>badgeRaw("info",LABELS.needType[r.need.type]||r.need.type)} ],
    rows, {rowRoute:r=>`contexte/stakeholders/${r.stakeholder.id}`}
  ) : `<div class="card">${emptyState("📋","Aucun besoin identifié","Ajoutez les besoins, attentes et exigences de vos parties intéressées.")}</div>`}`;
}

function pageContexteClimate(){
  const c = DB.climate;
  const q = (key,label)=>`<div class="field">
    <label>${esc(label)}</label>
    <select id="climate-${key}"><option value="true" ${c[key]?"selected":""}>Oui</option><option value="false" ${!c[key]?"selected":""}>Non</option></select>
  </div>`;
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Enjeux climatiques"}])}
  ${pageHeader("Enjeux climatiques","Répondez à ces questions guidées pour évaluer l'exposition de votre organisation.")}
  <div class="card mb-2" style="max-width:640px;">
    ${q("q1","Le changement climatique peut-il avoir un impact sur votre activité ?")}
    ${q("q2","Votre activité a-t-elle un impact environnemental significatif ?")}
    ${q("q3","Vos fournisseurs sont-ils exposés ?")}
    ${q("q4","Vos infrastructures sont-elles exposées ?")}
    ${q("q5","Vos clients sont-ils concernés ?")}
    <button class="btn btn-primary" id="save-climate-btn">Enregistrer et calculer le score</button>
  </div>
  <div class="card" style="max-width:640px;">
    <h3 class="mb-2">Score de criticité</h3>
    ${badge(LABELS.importance[c.criticality])}
    ${!c.evaluated?`<p class="text-sm mt-2">⚠️ Cette évaluation n'a pas encore été enregistrée.</p>`:""}
  </div>`;
}

function pageOrientations(){
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Orientations stratégiques"}])}
  ${pageHeader("Orientations stratégiques","Quels sont les objectifs stratégiques de votre organisation ?", `<button class="btn btn-primary" data-open-orientation-form>+ Ajouter une orientation</button>`)}
  ${DB.orientations.length ? dataTable(
    [ {label:"Orientation", render:o=>`<div class="cell-title">${esc(o.title)}</div><div class="cell-sub">${esc(o.description)}</div>`},
      {label:"Responsable", render:o=>esc(o.responsible)},
      {label:"Échéance", render:o=>fmtDate(o.due)},
      {label:"Priorité", render:o=>badge(LABELS.priority[o.priority])} ],
    DB.orientations
  ) : `<div class="card">${emptyState("🎯","Aucune orientation","Ajoutez les objectifs stratégiques de votre organisation.")}</div>`}`;
}

/* ---------- Assistant stratégique ---------- */
function contextAssistantSuggest(text){
  const low = text.toLowerCase();
  let base = {
    enjeu:"Difficulté identifiée", parties:["Collaborateurs"], risks:["Impact opérationnel à préciser"],
    opportunities:["Amélioration organisationnelle"], objectives:["Réduire l'impact identifié"], actions:["Analyser la situation et définir un plan d'action"],
  };
  if(/p[ée]nurie|recrut|personnel|comp[ée]tence/.test(low)){
    base = { enjeu:"Difficulté de recrutement", parties:["Clients","Collaborateurs"],
      risks:["Dégradation de la qualité","Retards de production ou de service","Surcharge de travail"],
      opportunities:["Formation interne","Automatisation","Réorganisation des équipes"],
      objectives:["Réduction du turnover","Développement des compétences"],
      actions:["Plan de formation","Plan de recrutement","Cartographie des compétences"] };
  } else if(/fournisseur|approvisionnement|rupture|d[ée]pendons/.test(low)){
    base = { enjeu:"Dépendance fournisseur", parties:["Clients","Fournisseurs"],
      risks:["Rupture d'approvisionnement","Hausse des coûts"],
      opportunities:["Diversification du panel fournisseurs"],
      objectives:["Sécuriser le panel fournisseurs stratégiques"],
      actions:["Qualifier un second fournisseur","Auditer le fournisseur actuel"] };
  } else if(/cyber|informatique|si |syst[eè]me d'information|donn[ée]es|erp/.test(low)){
    base = { enjeu:"Exposition aux cybermenaces", parties:["Clients","Collaborateurs","Autorités"],
      risks:["Indisponibilité du système d'information","Fuite de données"],
      opportunities:["Modernisation du système d'information"],
      objectives:["Renforcer la sécurité du système d'information"],
      actions:["Déployer l'authentification multi-facteurs","Réaliser un audit de sécurité"] };
  } else if(/client|r[ée]clamation|satisfaction|d[ée]lai/.test(low)){
    base = { enjeu:"Insatisfaction client", parties:["Clients"],
      risks:["Perte de clients","Dégradation de l'image"],
      opportunities:["Amélioration de la relation client"],
      objectives:["Réduire les réclamations clients","Maintenir la satisfaction client"],
      actions:["Analyser les causes de réclamation","Renforcer le support client"] };
  } else if(/certifi|iso ?9001|iso9001/.test(low)){
    base = { enjeu:"Projet de certification ISO 9001", parties:["Clients","Autorités","Organismes certificateurs"],
      risks:["Non-conformité aux exigences de la norme","Délai de préparation insuffisant"],
      opportunities:["Amélioration de l'image et de la confiance client"],
      objectives:["Obtenir la certification ISO 9001"],
      actions:["Réaliser un diagnostic de maturité","Planifier un audit à blanc"] };
  }
  return base;
}

function assistantEmbedHtml(){
  const examples = [
    "Nous avons des difficultés à recruter.",
    "Nous souhaitons nous certifier ISO 9001.",
    "Nous dépendons trop d'un fournisseur.",
    "Nous voulons améliorer la satisfaction client.",
    "Nous déployons un nouvel ERP.",
  ];
  return `
  <div class="section">
    <div class="card" style="background:linear-gradient(135deg,var(--primary-soft),var(--surface));border-color:var(--primary-soft);">
      <h2>🤖 Assistant stratégique</h2>
      <p class="section-sub mt-2">Décrivez une difficulté, un changement ou une ambition. Qonnect vous aide à construire votre système.</p>
      <div class="field mt-4" style="max-width:720px;">
        <textarea id="ctx-assist-input" placeholder="Ex : Nous avons des difficultés à recruter."></textarea>
      </div>
      <div class="quick-actions mb-2">
        ${examples.map(ex=>`<button class="chip" data-ai-suggest-fill="${esc(ex)}">${esc(ex)}</button>`).join("")}
      </div>
      <button class="btn btn-primary" id="ctx-assist-run">Analyser</button>
    </div>
    <div id="ctx-assist-result" class="mt-4"></div>
  </div>`;
}

function pageContexteAssistant(){
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Assistant stratégique"}])}
  ${assistantEmbedHtml()}`;
}

function renderAssistantSuggestion(text, s){
  const chipList = arr => arr.map(t=>`<span class="badge badge-neutral mb-2" style="margin-right:6px;">${esc(t)}</span>`).join("");
  return `
  <div class="card" style="max-width:720px;">
    <div class="text-xs">ENJEU SUGGÉRÉ</div>
    <h3 class="mt-2">${esc(s.enjeu)}</h3>
    <p class="text-sm mt-2">à partir de : « ${esc(text)} »</p>

    <div class="mt-4"><div class="text-xs mb-2">PARTIES INTÉRESSÉES CONCERNÉES</div>${chipList(s.parties)}</div>
    <div class="mt-4"><div class="text-xs mb-2">RISQUES POSSIBLES</div>${chipList(s.risks)}</div>
    <div class="mt-4"><div class="text-xs mb-2">OPPORTUNITÉS</div>${chipList(s.opportunities)}</div>
    <div class="mt-4"><div class="text-xs mb-2">OBJECTIFS POSSIBLES</div>${chipList(s.objectives)}</div>
    <div class="mt-4"><div class="text-xs mb-2">ACTIONS POSSIBLES</div>${chipList(s.actions)}</div>

    <p class="text-sm mt-4">Validez les suggestions que vous souhaitez intégrer à votre système. Chaque élément créé restera tracé jusqu'à cet enjeu.</p>
    <div class="flex gap-2 mt-2" style="flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" data-accept-suggestion='${jsonAttr({kind:"issue",label:s.enjeu})}'>+ Ajouter l'enjeu</button>
      ${s.risks.map(r=>`<button class="btn btn-secondary btn-sm" data-accept-suggestion='${jsonAttr({kind:"risk",label:r,source:s.enjeu})}'>+ Risque : ${esc(r)}</button>`).join("")}
      ${s.opportunities.map(o=>`<button class="btn btn-secondary btn-sm" data-accept-suggestion='${jsonAttr({kind:"opportunity",label:o,source:s.enjeu})}'>+ Opportunité : ${esc(o)}</button>`).join("")}
      ${s.objectives.map(o=>`<button class="btn btn-secondary btn-sm" data-accept-suggestion='${jsonAttr({kind:"objective",label:o,source:s.enjeu})}'>+ Objectif : ${esc(o)}</button>`).join("")}
      ${s.actions.map(a=>`<button class="btn btn-secondary btn-sm" data-accept-suggestion='${jsonAttr({kind:"action",label:a,source:s.enjeu})}'>+ Action : ${esc(a)}</button>`).join("")}
    </div>
  </div>`;
}

/* ---------- Carte stratégique (page dédiée, lien profond) ---------- */
function pageContexteCarte(){
  const nbRisksFromContext = DB.risks.filter(r=>r.sourceContext).length;
  const nbObjFromContext = DB.objectives.filter(o=>o.sourceContext).length;
  const nbActFromContext = DB.actions.filter(a=>a.sourceContext).length;
  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Carte stratégique"}])}
  ${pageHeader("Carte stratégique de l'organisation","Du contexte jusqu'aux résultats : la logique de construction de votre système de management.")}
  <div class="card">${contextStrategicMapHtml()}</div>
  <div class="card mt-4">
    <h3 class="mb-2">Traçabilité issue du contexte</h3>
    <p class="text-sm">${nbRisksFromContext} risque(s), ${nbObjFromContext} objectif(s) et ${nbActFromContext} action(s) sont directement issus d'un enjeu du contexte.</p>
  </div>`;
}

/* ---------- Vue Direction ---------- */
function pageContexteDirection(){
  const topIssues = [...DB.contextExternal, ...DB.contextInternal].filter(i=>i.importance==="haute").slice(0,4);
  const topRisks = DB.risks.filter(r=>r.type==="risque" && r.status==="ouvert").sort((a,b)=>(b.probability*b.impact)-(a.probability*a.impact)).slice(0,4);
  const objs = DB.objectives.slice(0,4);
  const pctAtteints = Math.round((DB.objectives.filter(o=>o.status==="atteint").length/Math.max(DB.objectives.length,1))*100);
  const pctConformite = Math.round((DB.requirements.filter(r=>r.status==="maitrise").length/Math.max(DB.requirements.length,1))*100);

  return `
  ${breadcrumb([{label:"Contexte & Stratégie",href:"#/contexte"},{label:"Vue Direction"}])}
  ${pageHeader("Vue Direction","Une synthèse claire, sans jargon qualité, pour comprendre où en est l'organisation.")}

  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Quels sont nos principaux enjeux ?</h3>
      ${topIssues.length ? topIssues.map(i=>`<div class="rel-link"><span class="rel-name">${esc(i.title)}</span>${badge(LABELS.importance[i.importance])}</div>`).join("")
        : `<p class="text-sm">Aucun enjeu majeur identifié pour le moment.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Quels sont nos principaux risques ?</h3>
      ${topRisks.length ? topRisks.map(r=>`<div class="rel-link"><span class="rel-name">${esc(r.name)}</span>${badge(LABELS.riskLevel[r.level])}</div>`).join("")
        : `<p class="text-sm">Aucun risque majeur ouvert actuellement.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Quels objectifs soutiennent notre stratégie ?</h3>
      ${objs.length ? objs.map(o=>`<div class="rel-link"><span class="rel-name">${esc(o.title)}</span><span class="text-sm" style="font-weight:700;">${o.progress}%</span></div>`).join("")
        : `<p class="text-sm">Aucun objectif défini pour le moment.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Quels résultats obtenons-nous ?</h3>
      <div class="grid grid-2">
        <div class="kpi"><div class="val" style="color:var(--success)">${pctAtteints}%</div><div class="lbl">Objectifs atteints</div></div>
        <div class="kpi"><div class="val" style="color:var(--primary)">${pctConformite}%</div><div class="lbl">Maîtrise du référentiel</div></div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   5ter. REVUE DE DIRECTION — cockpit de pilotage
   ============================================================ */
function reviewProcessSynthesis(){
  return DB.processes.map(p=>{
    const critRisks = DB.risks.filter(r=>r.processId===p.id && r.type==="risque" && r.status==="ouvert" && r.level==="critique").length;
    const lateActions = DB.actions.filter(a=>a.processId===p.id && a.status==="retard").length;
    const openNc = DB.events.filter(e=>e.processId===p.id && e.type==="non_conformite" && e.status==="ouvert").length;
    let status = "vert";
    if(critRisks>0 || lateActions>=2) status = "rouge";
    else if(lateActions>=1 || openNc>=1) status = "orange";
    return {process:p, status, critRisks, lateActions, openNc};
  });
}

function reviewAlerts(review){
  const alerts = [];
  const lateActions = DB.actions.filter(a=>a.status==="retard");
  if(lateActions.length) alerts.push({level:"danger", text:`${lateActions.length} action(s) sont en retard.`});
  const critRisksNoAction = DB.risks.filter(r=>r.type==="risque" && r.level==="critique" && r.status==="ouvert" && !DB.actions.some(a=>a.originId===r.id));
  if(critRisksNoAction.length) alerts.push({level:"danger", text:`${critRisksNoAction.length} risque(s) critique(s) ne disposent d'aucune action de maîtrise.`});
  const ncByProcess = {};
  DB.events.filter(e=>e.type==="non_conformite").forEach(e=>{ ncByProcess[e.processId] = (ncByProcess[e.processId]||0)+1; });
  Object.entries(ncByProcess).forEach(([pid,count])=>{ if(count>=2){ const p=getProcess(pid); alerts.push({level:"warning", text:`Les non-conformités se répètent sur le processus ${p?p.name:pid} (${count} occurrences).`}); } });
  const indComplaint = getIndicator("IND-002");
  if(indComplaint && indComplaint.trend>0) alerts.push({level:"warning", text:`Les réclamations augmentent (+${indComplaint.trend}).`});
  const unfavorableAudits = DB.audits.filter(a=>a.findings.some(f=>isAuditEcart(f)) && a.status!=="cloture");
  if(unfavorableAudits.length) alerts.push({level:"warning", text:`${unfavorableAudits.length} audit(s) présentent des écarts non encore clôturés.`});
  const prevReview = review.previousReviewId ? getReview(review.previousReviewId) : null;
  if(prevReview && prevReview.decisions.length){
    const pct = Math.round(prevReview.decisions.filter(d=>d.statut==="realisee").length / prevReview.decisions.length * 100);
    alerts.push({level: pct>=80?"success":"info", text:`${pct} % des décisions de la précédente revue sont clôturées.`});
  }
  if(!alerts.some(a=>a.level==="danger")) alerts.push({level:"success", text:"Aucun point bloquant majeur n'est détecté sur les données actuellement disponibles."});
  return alerts;
}

function reviewScoreComponents(){
  const objProgressAvg = Math.round(DB.objectives.reduce((s,o)=>s+o.progress,0)/Math.max(DB.objectives.length,1));
  const auditsOk = DB.audits.filter(a=>!a.findings.some(f=>isAuditEcart(f))).length;
  const auditsPct = Math.round(auditsOk/Math.max(DB.audits.length,1)*100);
  const ncTotal = DB.events.filter(e=>e.type==="non_conformite").length;
  const ncClosed = DB.events.filter(e=>e.type==="non_conformite" && e.status==="cloture").length;
  const ncPct = ncTotal ? Math.round(ncClosed/ncTotal*100) : 100;
  const riskTotal = DB.risks.filter(r=>r.type==="risque").length;
  const riskControlled = DB.risks.filter(r=>r.type==="risque" && r.status!=="ouvert").length;
  const riskPct = riskTotal ? Math.round(riskControlled/riskTotal*100) : 100;
  const satisfaction = parseInt(getIndicator("IND-001")?.value) || 0;
  const actionsTotal = DB.actions.length;
  const actionsOnTime = DB.actions.filter(a=>a.status!=="retard").length;
  const actionsPct = actionsTotal ? Math.round(actionsOnTime/actionsTotal*100) : 100;
  const processPct = Math.round(reviewProcessSynthesis().filter(p=>p.status==="vert").length/DB.processes.length*100);
  const components = [
    {label:"Performance (objectifs)", pct:objProgressAvg},
    {label:"Audits", pct:auditsPct},
    {label:"NC / CAPA", pct:ncPct},
    {label:"Risques", pct:riskPct},
    {label:"Satisfaction", pct:satisfaction},
    {label:"Actions dans les délais", pct:actionsPct},
    {label:"Processus maîtrisés", pct:processPct},
  ];
  const global = Math.round(components.reduce((s,c)=>s+c.pct,0)/components.length);
  return {global, components};
}

function reviewAIAnalysis(review){
  const score = reviewScoreComponents();
  const bullets = [];
  bullets.push(`Le niveau global du système de management est estimé à ${score.global} % sur la base des données disponibles.`);
  const objAtteints = DB.objectives.filter(o=>o.status==="atteint").length;
  bullets.push(`${objAtteints} objectif(s) sur ${DB.objectives.length} sont atteints à ce jour.`);
  const lateActions = DB.actions.filter(a=>a.status==="retard").length;
  if(lateActions) bullets.push(`${lateActions} action(s) sont en retard et méritent une priorisation.`);
  const critOpen = DB.risks.filter(r=>r.type==="risque" && r.level==="critique" && r.status==="ouvert").length;
  if(critOpen) bullets.push(`${critOpen} risque(s) critique(s) restent ouverts.`);
  if(!lateActions && !critOpen) bullets.push(`Aucun point bloquant majeur n'est détecté sur les données actuellement disponibles.`);
  return `<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>
    <p class="text-xs mt-4">Analyse générée à partir des données disponibles dans Qonnect. Validation par la Direction requise.</p>`;
}

function reviewImprovementOpportunities(){
  const opps = [];
  DB.indicators.filter(i=>i.status!=="vert").forEach(i=>{
    opps.push({id:"OPP-IND-"+i.id, source:"Indicateur dégradé : "+i.name, analysis:`La valeur actuelle (${i.value}) est en dessous de la cible attendue.`, proposal:`Analyser les causes et définir un plan d'action sur l'indicateur ${i.name}.`});
  });
  const ncByProcess = {};
  DB.events.filter(e=>e.type==="non_conformite").forEach(e=>{ (ncByProcess[e.processId]=ncByProcess[e.processId]||[]).push(e); });
  Object.entries(ncByProcess).forEach(([pid,list])=>{ if(list.length>=2){ const p=getProcess(pid); opps.push({id:"OPP-NC-"+pid, source:"Récurrence de non-conformités — "+(p?p.name:pid), analysis:`${list.length} non-conformités ont été enregistrées sur ce processus.`, proposal:`Réaliser une analyse de cause racine transverse sur le processus ${p?p.name:pid}.`}); } });
  DB.risks.filter(r=>r.type==="risque" && (r.level==="critique"||r.level==="eleve") && r.status==="ouvert").forEach(r=>{
    opps.push({id:"OPP-RISK-"+r.id, source:`Risque ${LABELS.riskLevel[r.level].l.toLowerCase()} : ${r.name}`, analysis:r.description, proposal:`Renforcer le plan de maîtrise du risque « ${r.name} ».`});
  });
  DB.objectives.filter(o=>o.status==="en_retard" || (o.status==="en_cours" && o.progress<50)).forEach(o=>{
    opps.push({id:"OPP-OBJ-"+o.id, source:"Objectif non atteint : "+o.title, analysis:`Progression actuelle : ${o.progress} %.`, proposal:`Revoir le plan d'action associé à l'objectif « ${o.title} ».`});
  });
  DB.audits.filter(a=>a.findings.some(f=>isAuditEcart(f))).forEach(a=>{
    opps.push({id:"OPP-AUD-"+a.id, source:"Écart d'audit : "+a.title, analysis:`${a.findings.filter(f=>isAuditEcart(f)).length} écart(s) relevé(s).`, proposal:`Vérifier l'efficacité des actions correctives associées.`});
  });
  return opps;
}

const REVIEW_STEPS = ["brouillon","preparation","revue","validation","cloturee"];
const REVIEW_STEP_LABELS = ["Brouillon","Préparation","Revue","Validation","Clôture"];

function reviewTabsHtml(review, active){
  const tabs = [
    {id:"synthese",label:"Synthèse"}, {id:"decisions-precedentes",label:"Décisions précédentes"},
    {id:"contexte",label:"Contexte"}, {id:"performance",label:"Performance"}, {id:"satisfaction",label:"Satisfaction"},
    {id:"processus",label:"Processus"}, {id:"nc-capa",label:"NC / CAPA"}, {id:"audits",label:"Audits"},
    {id:"ressources",label:"Ressources"}, {id:"risques",label:"Risques"}, {id:"changements",label:"Changements"},
    {id:"amelioration",label:"Amélioration"}, {id:"decisions",label:"Décisions"}, {id:"actions",label:"Actions"},
    {id:"conclusion",label:"Conclusion"},
  ];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="revue-direction/${review.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}

function pageRevueDirection(reviewId, tab){
  const review = reviewId ? getReview(reviewId) : getLatestReview();
  if(!review) return emptyState("📅","Aucune revue de direction","Créez votre première revue de direction.", `<button class="btn btn-primary" data-open-review-form>+ Préparer la revue de direction</button>`);
  tab = tab || "synthese";
  const prevReview = review.previousReviewId ? getReview(review.previousReviewId) : null;
  const alerts = reviewAlerts(review);
  const score = reviewScoreComponents();
  const lateActionsCount = DB.actions.filter(a=>a.status==="retard").length;
  const prevDecisionRate = prevReview && prevReview.decisions.length ? Math.round(prevReview.decisions.filter(d=>d.statut==="realisee").length/prevReview.decisions.length*100) : null;
  const activeRef = DB.referentiels.find(r=>r.active);
  const stepIndex = REVIEW_STEPS.indexOf(review.status);
  const isClosed = review.status==="cloturee";

  const selector = `<select id="review-picker" style="height:40px;border:1px solid var(--border);border-radius:8px;padding:0 12px;">
    ${[...DB.managementReviews].reverse().map(r=>`<option value="${r.id}" ${r.id===review.id?"selected":""}>${esc(r.periodLabel)} — ${esc(LABELS.reviewStatus[r.status].l)}</option>`).join("")}
  </select>`;

  const header = `
  ${pageHeader("Revue de Direction", "Le cockpit de pilotage de votre système de management.",
    `${selector}<button class="btn btn-secondary" data-open-review-form>+ Nouvelle revue</button>`)}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:12px;">
      <div>
        <h2>${esc(review.periodLabel)}</h2>
        <p class="section-sub mt-2">Du ${fmtDate(review.periodStart)} au ${fmtDate(review.periodEnd)} · Revue le ${fmtDate(review.reviewDate)||"—"} · Prochaine revue : ${fmtDate(review.nextReviewDate)||"—"}${activeRef?" · Référentiel : "+esc(activeRef.name):""}</p>
      </div>
      ${badge(LABELS.reviewStatus[review.status])}
    </div>
    <div class="mt-4">${workflowStepper(REVIEW_STEP_LABELS, stepIndex)}</div>
    <div class="flex gap-2 mt-4" style="flex-wrap:wrap;">
      ${!isClosed && stepIndex<REVIEW_STEPS.length-1 ? `<button class="btn btn-primary" data-advance-review="${review.id}">Passer à l'étape suivante : ${REVIEW_STEP_LABELS[stepIndex+1]}</button>` : ""}
      ${isClosed ? `<button class="btn btn-secondary" data-new-review-version="${review.id}">Créer une nouvelle version</button>` : ""}
    </div>
  </div>
  <div class="grid grid-4 mb-2">
    <div class="card"><div class="kpi"><div class="val">${prevDecisionRate===null?"—":prevDecisionRate+" %"}</div><div class="lbl">Décisions précédentes clôturées</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${lateActionsCount?'var(--danger)':'var(--success)'}">${lateActionsCount}</div><div class="lbl">Actions en retard</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--primary)">${score.global} %</div><div class="lbl">Niveau global de performance</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${alerts.some(a=>a.level==='danger')?'var(--danger)':'var(--warning)'}">${alerts.length}</div><div class="lbl">Point(s) d'attention</div></div></div>
  </div>
  ${reviewTabsHtml(review, tab)}`;

  let body = "";
  if(tab==="synthese") body = reviewTabSynthese(review, alerts, score);
  else if(tab==="decisions-precedentes") body = reviewTabDecisionsPrecedentes(review, prevReview);
  else if(tab==="contexte") body = reviewTabContexte(review, isClosed);
  else if(tab==="performance") body = reviewTabPerformance(review);
  else if(tab==="satisfaction") body = reviewTabSatisfaction(review);
  else if(tab==="processus") body = reviewTabProcessus(review);
  else if(tab==="nc-capa") body = reviewTabNcCapa(review);
  else if(tab==="audits") body = reviewTabAudits(review);
  else if(tab==="ressources") body = reviewTabRessources(review);
  else if(tab==="risques") body = reviewTabRisques(review);
  else if(tab==="changements") body = reviewTabChangements(review);
  else if(tab==="amelioration") body = reviewTabAmelioration(review, isClosed);
  else if(tab==="decisions") body = reviewTabDecisions(review, isClosed);
  else if(tab==="actions") body = reviewTabActions(review);
  else if(tab==="conclusion") body = reviewTabConclusion(review, isClosed);

  return header + body;
}

function reviewTabSynthese(review, alerts, score){
  const kpi = (route, val, label, color)=>`<div class="card card-hover" data-route="${route}"><div class="kpi"><div class="val" style="color:${color||'var(--text-primary)'}">${val}</div><div class="lbl">${esc(label)}</div></div></div>`;
  const objAtteints = DB.objectives.filter(o=>o.status==="atteint").length;
  const ncOuvertes = DB.events.filter(e=>e.type==="non_conformite" && e.status==="ouvert").length;
  const auditsPlanifies = DB.audits.filter(a=>a.status==="planifie").length;
  const risquesOuverts = DB.risks.filter(r=>r.type==="risque" && r.status==="ouvert").length;
  const satisf = getIndicator("IND-001");

  return `
  <div class="section">
    <div class="section-head"><h2>Où en est mon système de management ?</h2></div>
    <div class="grid grid-4">
      ${kpi("objectifs", DB.objectives.length, "Objectifs ("+objAtteints+" atteints)")}
      ${kpi("objectifs", DB.indicators.filter(i=>i.status!=="vert").length, "Indicateurs hors cible", "var(--warning)")}
      ${kpi("audits", auditsPlanifies, "Audits à préparer")}
      ${kpi("evenements/non_conformite", ncOuvertes, "Non-conformités ouvertes", ncOuvertes?"var(--danger)":"var(--success)")}
      ${kpi("actions", DB.actions.filter(a=>a.status==="retard").length, "Actions / CAPA en retard", "var(--danger)")}
      ${kpi("risques", risquesOuverts, "Risques ouverts", "var(--warning)")}
      ${kpi("dashboard", satisf?satisf.value:"—", "Satisfaction / réclamations")}
      ${kpi("processus", DB.processes.length, "Processus")}
      ${kpi("changements", DB.changes.length, "Changements")}
      ${kpi(`revue-direction/${review.id}/decisions-precedentes`, review.previousReviewId?getReview(review.previousReviewId).decisions.length:0, "Décisions précédentes")}
    </div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">🔔 Points nécessitant l'attention de la Direction</h3>
      ${alerts.map(a=>`<div class="rel-link"><span class="rel-name">${a.level==="danger"?"🔴":a.level==="warning"?"🟠":a.level==="success"?"🟢":"🔵"} ${esc(a.text)}</span></div>`).join("")}
    </div>
    <div class="card">
      <h3 class="mb-2">🤖 Analyse proposée par Qonnect</h3>
      ${reviewAIAnalysis(review)}
    </div>
  </div>

  <div class="card mt-4">
    <h3 class="mb-2">📈 État du système de management — ${score.global} %</h3>
    ${score.components.map(c=>`
      <div class="flex justify-between items-center mt-2"><span class="text-sm">${esc(c.label)}</span><span class="text-sm" style="font-weight:700;">${c.pct} %</span></div>
      <div class="progress mt-2" style="margin-bottom:10px;"><div style="width:${c.pct}%;background:${c.pct>=70?'var(--success)':c.pct>=40?'var(--warning)':'var(--danger)'}"></div></div>
    `).join("")}
  </div>`;
}

function reviewTabDecisionsPrecedentes(review, prevReview){
  if(!prevReview) return `<div class="card">${emptyState("📋","Aucune revue précédente","Il s'agit de la première revue de direction enregistrée.")}</div>`;
  const rate = prevReview.decisions.length ? Math.round(prevReview.decisions.filter(d=>d.statut==="realisee").length/prevReview.decisions.length*100) : 0;
  return `
  <div class="card mb-4"><div class="kpi"><div class="val" style="color:var(--primary)">${rate} %</div><div class="lbl">Taux de réalisation des décisions de la revue « ${esc(prevReview.periodLabel)} »</div></div></div>
  ${dataTable(
    [ {label:"Décision", render:d=>`<div class="cell-title">${esc(d.decision)}</div>`},
      {label:"Responsable", render:d=>esc(d.responsable)},
      {label:"Échéance", render:d=>fmtDate(d.echeance)},
      {label:"Statut", render:d=>badge(LABELS.decisionStatus[d.statut])},
      {label:"Preuve", render:d=>esc(d.preuve||"—")},
      {label:"", render:d=>`<button class="btn btn-secondary btn-sm" data-edit-decision='${jsonAttr({reviewId:prevReview.id,decisionId:d.id})}'>Mettre à jour</button>`} ],
    prevReview.decisions
  )}`;
}

function reviewTabContexte(review, isClosed){
  return `
  ${!isClosed?`<div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-context-change-form="${review.id}">+ Ajouter un changement</button></div>`:""}
  ${review.contextChanges.length ? review.contextChanges.map(c=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center">
        <p class="text-sm" style="color:var(--text-primary)">${esc(c.text)}</p>
        ${c.confirmed?badgeRaw("success","Confirmé"):badgeRaw("warning","À confirmer")}
      </div>
      <p class="text-xs mt-2">Source : ${esc(c.source)}</p>
      ${!isClosed && !c.confirmed ? `<button class="btn btn-secondary btn-sm mt-2" data-confirm-context-change='${jsonAttr({reviewId:review.id,changeId:c.id})}'>Confirmer</button>` : ""}
    </div>`).join("")
    : `<div class="card">${emptyState("🧭","Aucun changement de contexte","Aucune évolution significative du contexte n'a été enregistrée pour cette période.")}</div>`}`;
}

function reviewTabPerformance(review){
  const objAtteints = DB.objectives.filter(o=>o.status==="atteint").length;
  const objPartiels = DB.objectives.filter(o=>o.status==="en_cours").length;
  const objNonAtteints = DB.objectives.filter(o=>o.status==="en_retard").length;
  return `
  <div class="grid grid-3 mb-4">
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${objAtteints}</div><div class="lbl">Objectifs atteints</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--warning)">${objPartiels}</div><div class="lbl">Objectifs partiellement atteints</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--danger)">${objNonAtteints}</div><div class="lbl">Objectifs non atteints</div></div></div>
  </div>
  <div class="card">
    <h3 class="mb-2">Évolution des indicateurs</h3>
    ${DB.indicators.map(i=>`<div class="rel-link" data-route="objectifs"><span class="rel-name">${esc(i.name)}</span><span class="text-sm">${esc(i.value)} · tendance ${i.trend>=0?"+":""}${i.trend} ${badge(LABELS.indStatus[i.status])}</span></div>`).join("")}
  </div>`;
}

function reviewTabSatisfaction(review){
  const satisf = getIndicator("IND-001");
  const compl = getIndicator("IND-002");
  const reclamations = DB.events.filter(e=>e.type==="reclamation");
  return `
  <div class="grid grid-2 mb-4">
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${satisf?satisf.value:"—"}</div><div class="lbl">Satisfaction globale (tendance ${satisf&&satisf.trend>=0?"+":""}${satisf?satisf.trend:"—"})</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--danger)">${compl?compl.value:"—"}</div><div class="lbl">Réclamations (tendance ${compl&&compl.trend>=0?"+":""}${compl?compl.trend:"—"})</div></div></div>
  </div>
  <div class="card">
    <h3 class="mb-2">Réclamations enregistrées</h3>
    ${reclamations.length ? dataTable(
      [ {label:"Réclamation", render:e=>`<div class="cell-title">${esc(e.title)}</div>`},
        {label:"Date", render:e=>fmtDate(e.date)},
        {label:"Statut", render:e=>badge(LABELS.eventStatus[e.status])} ],
      reclamations, {rowRoute:e=>`evenements/${e.type}/${e.id}`}
    ) : `<p class="text-sm">Aucune réclamation enregistrée sur la période.</p>`}
  </div>`;
}

function reviewTabProcessus(review){
  const synth = reviewProcessSynthesis();
  const groupLabel = {vert:"🟢 Processus maîtrisés", orange:"🟠 Processus à surveiller", rouge:"🔴 Processus nécessitant une action"};
  return `<div class="grid grid-3">${["vert","orange","rouge"].map(st=>`
    <div class="card">
      <h3 class="mb-2">${groupLabel[st]}</h3>
      ${synth.filter(s=>s.status===st).map(s=>`<div class="rel-link" data-route="processus/${s.process.id}"><span class="rel-name">${esc(s.process.name)}</span><span class="chev">›</span></div>`).join("") || `<p class="text-sm">Aucun</p>`}
    </div>`).join("")}</div>`;
}

function reviewTabNcCapa(review){
  const nc = DB.events.filter(e=>e.type==="non_conformite");
  const open = nc.filter(e=>e.status==="ouvert").length;
  const closed = nc.filter(e=>e.status==="cloture").length;
  const capaActions = DB.actions.filter(a=>a.origin==="evenement" && nc.some(e=>e.id===a.originId));
  const ncByProcess = {};
  nc.forEach(e=>{ ncByProcess[e.processId]=(ncByProcess[e.processId]||0)+1; });
  const trendAlerts = Object.entries(ncByProcess).filter(([,c])=>c>=2).map(([pid,c])=>{ const p=getProcess(pid); return `Les non-conformités liées au processus ${p?p.name:pid} sont au nombre de ${c} sur la période analysée.`; });
  return `
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val">${nc.length}</div><div class="lbl">Non-conformités totales</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--warning)">${open}</div><div class="lbl">NC ouvertes</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${closed}</div><div class="lbl">NC clôturées</div></div></div>
    <div class="card"><div class="kpi"><div class="val">${capaActions.length}</div><div class="lbl">CAPA associées</div></div></div>
  </div>
  ${trendAlerts.length?`<div class="card mb-4">
    <h3 class="mb-2">Analyse des tendances</h3>
    ${trendAlerts.map(t=>`<p class="text-sm mt-2">⚠️ ${esc(t)}</p>`).join("")}
    <p class="text-xs mt-2">Constat généré à partir des données enregistrées dans Qonnect.</p>
  </div>`:""}
  ${dataTable(
    [ {label:"Référence", render:e=>esc(e.ref)}, {label:"Non-conformité", render:e=>`<div class="cell-title">${esc(e.title)}</div>`},
      {label:"Processus", render:e=>{const p=getProcess(e.processId); return p?esc(p.name):"—";}},
      {label:"Priorité", render:e=>badge(LABELS.priority[e.priority])}, {label:"Statut", render:e=>badge(LABELS.eventStatus[e.status])} ],
    nc, {rowRoute:e=>`evenements/${e.type}/${e.id}`}
  )}`;
}

function reviewTabAudits(review){
  const nbEcarts = DB.audits.reduce((s,a)=>s+a.findings.filter(f=>isAuditEcart(f)).length,0);
  const actionsFromAudits = DB.actions.filter(a=>a.origin==="audit");
  const cloturees = actionsFromAudits.filter(a=>a.status==="termine").length;
  const tauxCloture = actionsFromAudits.length ? Math.round(cloturees/actionsFromAudits.length*100) : 100;
  return `
  <div class="grid grid-3 mb-4">
    <div class="card"><div class="kpi"><div class="val">${DB.audits.length}</div><div class="lbl">Audits réalisés / planifiés</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:${nbEcarts?'var(--warning)':'var(--success)'}">${nbEcarts}</div><div class="lbl">Écarts relevés (toutes périodes)</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--primary)">${tauxCloture} %</div><div class="lbl">Taux de clôture des actions d'audit</div></div></div>
  </div>
  ${dataTable(
    [ {label:"Audit", render:a=>`<div class="cell-title">${esc(a.title)}</div>`}, {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Écarts", render:a=>a.findings.filter(f=>isAuditEcart(f)).length}, {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    DB.audits, {rowRoute:a=>`audits/${a.id}`}
  )}`;
}

function reviewTabRessources(review){
  const skillsNeeded = [...new Set(DB.changes.flatMap(c=>c.impacted.skills||[]))];
  const rh = getProcess("PROC-006");
  const compRisk = getRisk("RISK-002");
  return `
  <div class="card mb-4">
    <h3 class="mb-2">Évaluation des ressources</h3>
    <p class="text-sm">${compRisk && compRisk.status==="ouvert" ? "⚠️ Besoins / insuffisances identifiés — voir le risque « "+esc(compRisk.name)+" »." : "🟢 Ressources jugées suffisantes sur la base des données disponibles."}</p>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Compétences à développer</h3>
      ${skillsNeeded.length ? skillsNeeded.map(s=>`<div class="rel-link"><span class="rel-name">${esc(s)}</span></div>`).join("") : `<p class="text-sm">Aucun besoin de compétence identifié via les changements en cours.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Risques liés aux ressources</h3>
      ${rh ? `<div class="rel-link" data-route="processus/${rh.id}"><span class="rel-name">🧩 ${esc(rh.name)}</span><span class="chev">›</span></div>` : ""}
      ${compRisk ? `<div class="rel-link" data-route="risques/${compRisk.id}"><span class="rel-name">⚠️ ${esc(compRisk.name)}</span>${badge(LABELS.riskLevel[compRisk.level])}</div>` : ""}
    </div>
  </div>`;
}

function reviewTabRisques(review){
  const critiques = DB.risks.filter(r=>r.type==="risque"&&r.level==="critique"&&r.status==="ouvert");
  const eleves = DB.risks.filter(r=>r.type==="risque"&&r.level==="eleve"&&r.status==="ouvert");
  const maitrises = DB.risks.filter(r=>r.type==="risque"&&r.status!=="ouvert");
  const opportunites = DB.risks.filter(r=>r.type==="opportunite");
  return `
  <div class="grid grid-4 mb-4">
    <div class="card"><div class="kpi"><div class="val" style="color:var(--danger)">${critiques.length}</div><div class="lbl">Risques critiques</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--warning)">${eleves.length}</div><div class="lbl">Risques élevés</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--success)">${maitrises.length}</div><div class="lbl">Risques maîtrisés</div></div></div>
    <div class="card"><div class="kpi"><div class="val" style="color:var(--info)">${opportunites.length}</div><div class="lbl">Opportunités</div></div></div>
  </div>
  ${critiques.length?`<div class="card mb-4"><p class="text-sm">⚠️ ${critiques.length} risque(s) critique(s) restent ouverts${critiques.filter(r=>!DB.actions.some(a=>a.originId===r.id)).length?", dont "+critiques.filter(r=>!DB.actions.some(a=>a.originId===r.id)).length+" sans action arrivée à échéance":""}.</p></div>`:""}
  <div class="mt-2 mb-4"><button class="btn btn-secondary btn-sm" data-route="risques">Ouvrir le registre des risques →</button></div>
  <div class="card">
    <h3 class="mb-2">🏭 Performance des fournisseurs</h3>
    ${(()=>{
      const s = fournisseurDashboardStats();
      const risque = [...DB.fournisseurs].map(f=>({f, perf:fournisseurPerformanceScore(f.id)})).sort((a,b)=>a.perf.score-b.perf.score).slice(0,3);
      return `<div class="grid grid-4 mb-4">
        <div class="kpi"><div class="val" style="color:var(--primary)">${s.tauxMaitrise}/100</div><div class="lbl">Maîtrise globale</div></div>
        <div class="kpi"><div class="val" style="color:${s.critiques?'var(--warning)':'var(--success)'}">${s.critiques}</div><div class="lbl">Fournisseurs critiques</div></div>
        <div class="kpi"><div class="val" style="color:${s.incidentsOuverts?'var(--danger)':'var(--success)'}">${s.incidentsOuverts}</div><div class="lbl">Incidents ouverts</div></div>
        <div class="kpi"><div class="val" style="color:${s.actionsRetard?'var(--danger)':'var(--success)'}">${s.actionsRetard}</div><div class="lbl">Actions en retard</div></div>
      </div>
      <p class="text-xs mb-2">FOURNISSEURS À SURVEILLER</p>
      ${risque.map(x=>`<div class="rel-link" data-route="fournisseurs/liste/${x.f.id}"><span class="rel-name">${esc(x.f.nomCommercial)}</span><span class="text-sm" style="font-weight:700;color:${x.perf.score<50?'var(--danger)':'var(--warning)'}">${x.perf.score}/100</span></div>`).join("")}
      <div class="mt-2"><button class="btn btn-secondary btn-sm" data-route="fournisseurs">Ouvrir le module Fournisseurs →</button></div>`;
    })()}
  </div>`;
}

function reviewTabChangements(review){
  return dataTable(
    [ {label:"Changement", render:c=>`<div class="cell-title">${esc(c.title)}</div><div class="cell-sub">${esc(c.description)}</div>`},
      {label:"Responsable", render:c=>esc(c.requestedBy)},
      {label:"Étape", render:c=>esc(QONNECT_SEED.changeSteps[c.step])} ],
    DB.changes, {rowRoute:c=>`changements/${c.id}`}
  );
}

function reviewTabAmelioration(review, isClosed){
  const opps = reviewImprovementOpportunities();
  return opps.length ? opps.map(o=>`
    <div class="card mb-2">
      <div class="text-xs">OPPORTUNITÉ DÉTECTÉE</div>
      <h3 class="mt-2">${esc(o.source)}</h3>
      <p class="text-sm mt-2">${esc(o.analysis)}</p>
      <div class="text-xs mt-4">PROPOSITION</div>
      <p class="text-sm mt-2">${esc(o.proposal)}</p>
      ${!isClosed?`<button class="btn btn-secondary btn-sm mt-4" data-convert-opportunity='${jsonAttr({reviewId:review.id,source:o.source,proposal:o.proposal})}'>+ Transformer en décision</button>`:""}
    </div>`).join("")
    : `<div class="card">${emptyState("🟢","Aucune opportunité détectée","Aucune faiblesse récurrente n'est détectée sur les données actuelles.")}</div>`;
}

function reviewTabDecisions(review, isClosed){
  return `
  ${!isClosed?`<div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-decision-form="${review.id}">+ Nouvelle décision</button></div>`:""}
  ${review.decisions.length ? review.decisions.map(d=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center"><h3>${esc(d.decision)}</h3>${badge(LABELS.decisionStatus[d.statut])}</div>
      <p class="text-sm mt-2"><strong>Contexte :</strong> ${esc(d.contexte)}</p>
      <p class="text-sm mt-2"><strong>Justification :</strong> ${esc(d.justification)}</p>
      <div class="grid grid-3 mt-4">
        <div><div class="text-xs">RESPONSABLE</div><div class="text-sm" style="color:var(--text-primary)">${esc(d.responsable)}</div></div>
        <div><div class="text-xs">ÉCHÉANCE</div><div class="text-sm" style="color:var(--text-primary)">${fmtDate(d.echeance)}</div></div>
        <div><div class="text-xs">PRIORITÉ</div>${badge(LABELS.priority[d.priorite])}</div>
      </div>
      ${d.indicatorId?`<p class="text-xs mt-2">Indicateur associé : ${esc(getIndicator(d.indicatorId)?.name||d.indicatorId)}</p>`:""}
      ${d.actionId?`<p class="text-xs mt-2">✅ Action créée : ${esc(getAction(d.actionId)?.title||d.actionId)} <span style="cursor:pointer;color:var(--primary);" data-route="actions">(voir)</span></p>`
        : (!isClosed?`<button class="btn btn-secondary btn-sm mt-2" data-create-action-from-decision='${jsonAttr({reviewId:review.id,decisionId:d.id})}'>+ Créer l'action</button>`:"")}
      ${!isClosed?`<button class="btn btn-secondary btn-sm mt-2" data-edit-decision='${jsonAttr({reviewId:review.id,decisionId:d.id})}'>Modifier le statut / la preuve</button>`:""}
    </div>`).join("")
    : `<div class="card">${emptyState("📝","Aucune décision","Ajoutez les décisions prises lors de cette revue de direction.")}</div>`}`;
}

function reviewTabActions(review){
  const reviewActions = DB.actions.filter(a=>a.origin==="revue_direction");
  return reviewActions.length ? actionTable(reviewActions) : `<div class="card">${emptyState("✅","Aucune action","Aucune action n'a encore été créée depuis une revue de direction.")}</div>`;
}

function reviewTabConclusion(review, isClosed){
  const c = review.conclusion;
  return `
  <div class="card mb-4">
    <h3 class="mb-2">Adéquation du système de management</h3>
    <p class="text-sm">Pertinence : le système répond-il toujours aux besoins de l'organisation ? · Adéquation : les ressources sont-elles suffisantes ? · Efficacité : les résultats attendus sont-ils atteints ? · Amélioration : quels changements sont nécessaires ?</p>
  </div>
  <div class="card">
    <h3 class="mb-2">Conclusion de la Direction</h3>
    <div class="grid grid-2">
      <div class="field"><label>Système de management</label>
        <select id="concl-smq" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionSmq).map(([v,l])=>`<option value="${v}" ${c.smq===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label>Performance</label>
        <select id="concl-performance" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionPerf).map(([v,l])=>`<option value="${v}" ${c.performance===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label>Ressources</label>
        <select id="concl-ressources" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionRessources).map(([v,l])=>`<option value="${v}" ${c.ressources===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label>Amélioration</label>
        <select id="concl-amelioration" ${isClosed?"disabled":""}>${Object.entries(LABELS.conclusionAmelioration).map(([v,l])=>`<option value="${v}" ${c.amelioration===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
    </div>
    <div class="field mt-2"><label>Commentaires de la Direction</label><textarea id="concl-commentaire" ${isClosed?"disabled":""}>${esc(c.commentaire)}</textarea></div>
    ${!isClosed?`<button class="btn btn-primary" data-save-conclusion="${review.id}">Enregistrer la conclusion</button>`:""}
  </div>

  <div class="card mt-4">
    <h3 class="mb-2">Sorties de la revue de direction</h3>
    <div class="quick-actions">
      <button class="btn btn-secondary" data-generate-report="${review.id}">📄 Générer le compte-rendu</button>
      <button class="btn btn-secondary" data-route="actions">🗂 Voir le plan d'actions</button>
      <button class="btn btn-secondary" data-route="revue-direction/${review.id}/resume">📊 Voir la synthèse Direction</button>
    </div>
  </div>`;
}

/* ---------- Synthèse Direction (sortie courte) ---------- */
function pageRevueSynthese(review){
  const score = reviewScoreComponents();
  const opps = reviewImprovementOpportunities().slice(0,5);
  const alerts = reviewAlerts(review);
  const forces = alerts.filter(a=>a.level==="success").concat(
    DB.objectives.filter(o=>o.status==="atteint").map(o=>({text:"Objectif atteint : "+o.title}))
  ).slice(0,5);
  const vigilance = alerts.filter(a=>a.level==="danger"||a.level==="warning").slice(0,5);
  const majorDecisions = review.decisions.slice(0,5);
  const priorityActions = DB.actions.filter(a=>a.status!=="termine").sort((a,b)=>({critique:0,haute:1,moyenne:2,basse:3}[a.priority]-({critique:0,haute:1,moyenne:2,basse:3}[b.priority]))).slice(0,5);

  return `
  ${breadcrumb([{label:"Revue de Direction",href:"#/revue-direction/"+review.id},{label:"Synthèse Direction"}])}
  ${pageHeader("Synthèse Direction — "+review.periodLabel, "L'essentiel à retenir de cette revue de direction.")}
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">5 chiffres clés</h3>
      <p class="text-sm">Niveau global du SMQ : <strong>${score.global} %</strong></p>
      <p class="text-sm mt-2">Objectifs atteints : <strong>${DB.objectives.filter(o=>o.status==="atteint").length}/${DB.objectives.length}</strong></p>
      <p class="text-sm mt-2">Actions en retard : <strong>${DB.actions.filter(a=>a.status==="retard").length}</strong></p>
      <p class="text-sm mt-2">Risques critiques ouverts : <strong>${DB.risks.filter(r=>r.type==="risque"&&r.level==="critique"&&r.status==="ouvert").length}</strong></p>
      <p class="text-sm mt-2">Décisions de cette revue : <strong>${review.decisions.length}</strong></p>
    </div>
    <div class="card">
      <h3 class="mb-2">Points forts</h3>
      ${forces.length?forces.map(f=>`<p class="text-sm mt-2">🟢 ${esc(f.text)}</p>`).join(""):`<p class="text-sm">—</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Points de vigilance</h3>
      ${vigilance.length?vigilance.map(v=>`<p class="text-sm mt-2">${v.level==="danger"?"🔴":"🟠"} ${esc(v.text)}</p>`).join(""):`<p class="text-sm">—</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">Décisions majeures</h3>
      ${majorDecisions.length?majorDecisions.map(d=>`<p class="text-sm mt-2">• ${esc(d.decision)}</p>`).join(""):`<p class="text-sm">—</p>`}
    </div>
  </div>
  <div class="card mt-4">
    <h3 class="mb-2">Actions prioritaires</h3>
    ${priorityActions.length?priorityActions.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">${esc(a.title)}</span>${badge(LABELS.priority[a.priority])}</div>`).join(""):`<p class="text-sm">Aucune action prioritaire en cours.</p>`}
  </div>`;
}

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
  if(section==="all"){ docs = DB.documents.filter(d=>d.status!=="obsolete"); title="Tous les documents"; }
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

/* ============================================================
   8. RISQUES
   ============================================================ */
function pageRisks(){
  const risks = DB.risks;
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
  let rows = DB.risks;
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

/* ============================================================
   9. OBJECTIFS & INDICATEURS
   ============================================================ */
function pageObjectives(){
  return `
  ${pageHeader("Objectifs & indicateurs","Pilotage de la performance du système de management.",
    `<button class="btn btn-primary" data-open-quick="objective">+ Créer un objectif</button>`)}
  <div class="section">
    <div class="section-head"><h2>Objectifs</h2></div>
    <div class="grid grid-2">
      ${DB.objectives.map(o=>{
        const p = getProcess(o.processId);
        return `<div class="card">
          <div class="flex justify-between items-center">
            <h3>${esc(o.title)}</h3>${badge(LABELS.objStatus[o.status])}
          </div>
          ${o.sourceContext?`<p class="text-xs mt-2">🧭 Issu de l'enjeu « ${esc(o.sourceContext.label)} »</p>`:""}
          <p class="text-sm mt-2">Cible : ${esc(o.target)} · Processus : ${p?esc(p.name):"—"}</p>
          <div class="flex justify-between items-center mt-4"><span class="text-sm">Progression</span><span class="text-sm" style="font-weight:700;color:var(--text-primary)">${o.progress}%</span></div>
          <div class="progress mt-2"><div style="width:${o.progress}%"></div></div>
          <div class="mt-4">
            ${(o.indicatorIds||[]).map(iid=>{const i=getIndicator(iid); if(!i) return ""; return `<div class="rel-link"><span class="rel-name">${esc(i.name)}</span>${badge(LABELS.indStatus[i.status])}</div>`;}).join("")}
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
  <div class="section">
    <div class="section-head"><h2>Indicateurs</h2></div>
    <div class="grid grid-3">
      ${DB.indicators.map(i=>{
        const p = getProcess(i.processId);
        const color = i.status==="vert"?"var(--success)":i.status==="orange"?"var(--warning)":"var(--danger)";
        return `<div class="card">
          <div class="flex justify-between items-center"><h3>${esc(i.name)}</h3>${badge(LABELS.indStatus[i.status])}</div>
          <div class="kpi mt-2"><div class="val" style="color:${color}">${esc(i.value)}</div><div class="lbl">${p?esc(p.name):"—"} · tendance ${i.trend>=0?"+":""}${i.trend}</div></div>
        </div>`;
      }).join("")}
    </div>
  </div>`;
}

/* ============================================================
   10. ÉVÉNEMENTS
   ============================================================ */
function pageEvents(typeFilter){
  const isNC = typeFilter==="non_conformite";
  let events = typeFilter==="all" ? DB.events : DB.events.filter(e=>e.type===typeFilter);
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
  let rows = typeFilter==="all" ? DB.events : DB.events.filter(e=>e.type===typeFilter);
  if(status) rows = rows.filter(e=>e.status===status);
  if(priority) rows = rows.filter(e=>e.priority===priority);
  if(proc) rows = rows.filter(e=>e.processId===proc);
  zone.innerHTML = eventTable(rows);
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
  <div id="action-table-zone">${actionTable(DB.actions)}</div>`;
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
  let rows = DB.actions;
  if(status) rows = rows.filter(a=>a.status===status);
  if(origin) rows = rows.filter(a=>a.origin===origin);
  if(proc) rows = rows.filter(a=>a.processId===proc);
  document.getElementById("action-table-zone").innerHTML = actionTable(rows);
}

/* ============================================================
   12. AUDITS — processus d'audit complet et transversal
   ============================================================ */

/* ---------- Helpers ---------- */
function resolveExigence(id){
  if(!id) return null;
  const legacy = findBy(DB.requirements, id);
  if(legacy) return {ref:legacy.ref, label:legacy.label, referentielId:"ISO9001"};
  const custom = getCustomExigence(id);
  if(custom) return {ref:custom.ref, label:custom.title, referentielId:custom.referentielId};
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
  const aVenir = DB.audits.filter(a=>a.status==="planifie" && a.date>=today);
  const enRetard = DB.audits.filter(a=>["planifie","preparation"].includes(a.status) && a.date<today);
  const enCours = DB.audits.filter(a=>["preparation","en_cours","analyse","synthese","a_valider"].includes(a.status));
  const clotures = DB.audits.filter(a=>["valide","cloture"].includes(a.status));
  const ncIssues = DB.audits.reduce((s,a)=>s+a.findings.filter(isAuditEcart).length,0);
  const actionsAudit = DB.actions.filter(a=>a.origin==="audit" && a.status!=="termine");
  const rates = DB.audits.map(auditConformityRate).filter(r=>r!==null);
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
    DB.audits, {rowRoute:a=>`audits/${a.id}`, emptyEmoji:"🔍", emptyTitle:"Aucun audit", emptyText:"Aucun audit n'est encore planifié."}
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

/* ============================================================
   13ter. FOURNISSEURS
   ============================================================ */

/* ---------- Logique métier ---------- */
function fournisseurEvalScore(evaluation){
  const totalPoids = evaluation.criteres.reduce((s,c)=>s+c.ponderation,0)||1;
  const weighted = evaluation.criteres.reduce((s,c)=>s+c.note*c.ponderation,0);
  return Math.round((weighted/totalPoids)*10)/10;
}
function fournisseurEvalNiveau(score){
  if(score>=8.5) return "excellent";
  if(score>=7) return "satisfaisant";
  if(score>=5) return "sous_surveillance";
  if(score>=3) return "insuffisant";
  return "critique";
}
function fournisseurLatestEvaluation(fid){
  const evals = DB.fournisseurEvaluations.filter(e=>e.fournisseurId===fid).sort((a,b)=>a.date.localeCompare(b.date));
  return evals.length ? evals[evals.length-1] : null;
}
function fournisseurDocStatusCompute(doc){
  if(!doc.echeance || doc.echeance==="—") return "valide";
  const diffDays = Math.round((new Date(doc.echeance+"T00:00:00")-new Date())/(1000*3600*24));
  if(diffDays<0) return "expire";
  if(diffDays<=90) return "a_renouveler";
  return "valide";
}
function fournisseurRisks(fid){ return DB.risks.filter(r=>r.fournisseurId===fid); }
function fournisseurIncidents(fid){ return DB.fournisseurIncidents.filter(i=>i.fournisseurId===fid); }
function fournisseurAudits(fid){ return DB.audits.filter(a=>a.fournisseurId===fid); }
function fournisseurActions(fid){ return DB.actions.filter(a=>a.fournisseurId===fid); }
function fournisseurDocs(fid){ return DB.fournisseurDocuments.filter(d=>d.fournisseurId===fid); }
function fournisseurPerformanceScore(fid){
  const evalLatest = fournisseurLatestEvaluation(fid);
  let score = evalLatest ? fournisseurEvalScore(evalLatest)*10 : 60;
  const incidents = fournisseurIncidents(fid);
  score -= incidents.filter(i=>i.gravite==="majeure").length*8;
  score -= incidents.filter(i=>i.gravite==="critique").length*15;
  score -= incidents.filter(i=>i.gravite==="mineure").length*3;
  const audits = fournisseurAudits(fid);
  const ecarts = audits.reduce((s,a)=>s+a.findings.filter(isAuditEcart).length,0);
  score -= ecarts*5;
  const risksOuverts = fournisseurRisks(fid).filter(r=>r.status==="ouvert" && (r.level==="critique"||r.level==="eleve")).length;
  score -= risksOuverts*7;
  const actionsRetard = fournisseurActions(fid).filter(a=>a.status==="retard").length;
  score -= actionsRetard*5;
  return {score: Math.max(0, Math.min(100, Math.round(score))), evalLatest, incidents, ecarts, risksOuverts, actionsRetard};
}
function fournisseurDashboardStats(){
  const total = DB.fournisseurs.length;
  const critiques = DB.fournisseurs.filter(f=>f.criticite==="critique").length;
  const surveillance = DB.fournisseurs.filter(f=>f.statut==="sous_surveillance").length;
  const bloques = DB.fournisseurs.filter(f=>f.statut==="bloque"||f.statut==="suspendu").length;
  const evalARealiser = DB.fournisseurs.filter(f=>{ const e=fournisseurLatestEvaluation(f.id); if(!e) return true; const mois=(Date.now()-new Date(e.date+"T00:00:00").getTime())/(1000*3600*24*30); return mois>12; }).length;
  const auditsAPlanifier = DB.audits.filter(a=>a.type==="fournisseur" && a.status==="planifie").length;
  const incidentsOuverts = DB.fournisseurIncidents.filter(i=>!i.actionId).length;
  const risquesEleves = DB.risks.filter(r=>r.fournisseurId && r.status==="ouvert" && (r.level==="critique"||r.level==="eleve")).length;
  const actionsRetard = DB.actions.filter(a=>a.origin==="fournisseur" && a.status==="retard").length;
  const scores = DB.fournisseurs.map(f=>fournisseurPerformanceScore(f.id).score);
  const tauxMaitrise = scores.length ? Math.round(scores.reduce((s,v)=>s+v,0)/scores.length) : 0;
  return {total, critiques, surveillance, bloques, evalARealiser, auditsAPlanifier, incidentsOuverts, risquesEleves, actionsRetard, tauxMaitrise};
}
function fournisseurAlerts(){
  const alerts = [];
  DB.fournisseurDocuments.forEach(d=>{
    const st = fournisseurDocStatusCompute(d);
    const f = getFournisseur(d.fournisseurId);
    if(!f) return;
    if(st==="expire") alerts.push({level:"danger", text:`Le document « ${d.titre} » de ${f.nomCommercial} est expiré.`});
    else if(st==="a_renouveler") alerts.push({level:"warning", text:`Le document « ${d.titre} » de ${f.nomCommercial} arrive à échéance (${fmtDate(d.echeance)}).`});
  });
  DB.fournisseurs.filter(f=>f.criticite==="critique").forEach(f=>{
    const perf = fournisseurPerformanceScore(f.id);
    if(perf.score<50) alerts.push({level:"danger", text:`${f.nomCommercial} est un fournisseur critique avec une performance dégradée (${perf.score}/100).`});
  });
  DB.fournisseurs.filter(f=>f.statut==="sous_surveillance").forEach(f=> alerts.push({level:"warning", text:`${f.nomCommercial} est sous surveillance.`}));
  return alerts;
}

/* ---------- Tableau de bord ---------- */
function pageFournisseurs(){
  const s = fournisseurDashboardStats();
  const kpi = (route, val, label, color)=>`<div class="card card-hover" data-route="${route}"><div class="kpi"><div class="val" style="color:${color||'var(--text-primary)'}">${val}</div><div class="lbl">${esc(label)}</div></div></div>`;
  const ranked = [...DB.fournisseurs].map(f=>({f, perf:fournisseurPerformanceScore(f.id)})).sort((a,b)=>b.perf.score-a.perf.score);
  const top = ranked.slice(0,3);
  const risque = ranked.slice(-3).reverse();
  return `
  ${pageHeader("Fournisseurs","Le centre de maîtrise des prestataires externes de Qonnect.",
    `<button class="btn btn-secondary" data-route="fournisseurs/critiques">🛡️ Fournisseurs critiques</button><button class="btn btn-primary" data-open-fournisseur-form>+ Nouveau fournisseur</button>`)}
  <div class="quick-actions mb-4">
    <button class="qa-btn" data-route="fournisseurs/liste">📋 Tous les fournisseurs</button>
    <button class="qa-btn" data-route="fournisseurs/evaluations">📊 Évaluations</button>
    <button class="qa-btn" data-route="fournisseurs/audits">🔍 Audits fournisseurs</button>
    <button class="qa-btn" data-route="fournisseurs/incidents">🚨 Incidents</button>
    <button class="qa-btn" data-route="fournisseurs/risques">⚠️ Risques</button>
    <button class="qa-btn" data-route="fournisseurs/documents">🗂️ Contrats & documents</button>
    <button class="qa-btn" data-route="fournisseurs/performance">📈 Performance</button>
    <button class="qa-btn" data-route="fournisseurs/vues">👁️ Vues Achats / Qualité / Direction / Auditeur</button>
  </div>
  <div class="grid grid-4 mb-4">
    ${kpi("fournisseurs/liste", s.total, "Fournisseurs")}
    ${kpi("fournisseurs/critiques", s.critiques, "Fournisseurs critiques", "var(--danger)")}
    ${kpi("fournisseurs/liste", s.surveillance, "Sous surveillance", s.surveillance?"var(--warning)":"var(--success)")}
    ${kpi("fournisseurs/liste", s.bloques, "Bloqués / suspendus", s.bloques?"var(--danger)":"var(--success)")}
  </div>
  <div class="grid grid-4 mb-4">
    ${kpi("fournisseurs/evaluations", s.evalARealiser, "Évaluations à réaliser", s.evalARealiser?"var(--warning)":"var(--success)")}
    ${kpi("fournisseurs/audits", s.auditsAPlanifier, "Audits à planifier")}
    ${kpi("fournisseurs/incidents", s.incidentsOuverts, "Incidents ouverts", s.incidentsOuverts?"var(--warning)":"var(--success)")}
    ${kpi("fournisseurs/risques", s.risquesEleves, "Risques élevés", s.risquesEleves?"var(--danger)":"var(--success)")}
  </div>
  <div class="card mb-4"><div class="kpi"><div class="val" style="color:var(--primary)">${s.tauxMaitrise} / 100</div><div class="lbl">Taux global de maîtrise des fournisseurs</div></div></div>
  <div class="grid grid-2 mb-4">
    <div class="card">
      <h3 class="mb-2">🏆 Top fournisseurs performants</h3>
      ${top.map(x=>`<div class="rel-link" data-route="fournisseurs/liste/${x.f.id}"><span class="rel-name">${esc(x.f.nomCommercial)}</span><span class="text-sm" style="font-weight:700;color:var(--success);">${x.perf.score}/100</span></div>`).join("")}
    </div>
    <div class="card">
      <h3 class="mb-2">⚠️ Fournisseurs à risque</h3>
      ${risque.map(x=>`<div class="rel-link" data-route="fournisseurs/liste/${x.f.id}"><span class="rel-name">${esc(x.f.nomCommercial)}</span><span class="text-sm" style="font-weight:700;color:var(--danger);">${x.perf.score}/100</span></div>`).join("")}
    </div>
  </div>
  <div class="card">
    <h3 class="mb-2">🔔 Alertes</h3>
    ${(()=>{ const al=fournisseurAlerts(); return al.length? al.slice(0,8).map(a=>`<div class="rel-link"><span class="rel-name">${a.level==="danger"?"🔴":"🟠"} ${esc(a.text)}</span></div>`).join("") : `<p class="text-sm">Aucune alerte active.</p>`; })()}
  </div>`;
}

function pageFournisseursListe(){
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Tous les fournisseurs"}])}
  ${pageHeader("Fournisseurs","", `<button class="btn btn-primary" data-open-fournisseur-form>+ Nouveau fournisseur</button>`)}
  <div class="filters-bar">
    ${filterSelect("f-frn-statut","Statut", Object.entries(LABELS.fournisseurStatut).map(([v,l])=>({v,l:l.l})))}
    ${filterSelect("f-frn-criticite","Criticité", Object.entries(LABELS.fournisseurCriticite).map(([v,l])=>({v,l:l.l})))}
  </div>
  <div id="frn-list-zone">${fournisseurTable(DB.fournisseurs)}</div>`;
}
function fournisseurTable(list){
  return dataTable(
    [ {label:"Fournisseur", render:f=>`<div class="cell-title">${esc(f.nomCommercial)}</div><div class="cell-sub">${(f.categories||[]).join(", ")}</div>`},
      {label:"Criticité", render:f=>badge(LABELS.fournisseurCriticite[f.criticite])},
      {label:"Statut", render:f=>badge(LABELS.fournisseurStatut[f.statut])},
      {label:"Performance", render:f=>{const p=fournisseurPerformanceScore(f.id); return `<span style="font-weight:700;color:${p.score>=70?'var(--success)':p.score>=50?'var(--warning)':'var(--danger)'}">${p.score}/100</span>`;}},
      {label:"Référent interne", render:f=>esc(f.referentInterne)} ],
    list, {rowRoute:f=>`fournisseurs/liste/${f.id}`, emptyEmoji:"🏭", emptyTitle:"Aucun fournisseur", emptyText:"Aucun fournisseur ne correspond à ces filtres."}
  );
}
function applyFournisseurFilters(){
  const statut = document.getElementById("f-frn-statut")?.value;
  const criticite = document.getElementById("f-frn-criticite")?.value;
  let rows = DB.fournisseurs;
  if(statut) rows = rows.filter(f=>f.statut===statut);
  if(criticite) rows = rows.filter(f=>f.criticite===criticite);
  document.getElementById("frn-list-zone").innerHTML = fournisseurTable(rows);
}

function pageFournisseursCritiques(){
  const critiques = DB.fournisseurs.filter(f=>f.criticite==="critique");
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Fournisseurs critiques"}])}
  ${pageHeader("Fournisseurs critiques","Vue dédiée aux Achats, à la Qualité et à la Direction — dépendances, risques et continuité.")}
  ${critiques.length? critiques.map(f=>{
    const perf = fournisseurPerformanceScore(f.id);
    const risks = fournisseurRisks(f.id);
    const incidents = fournisseurIncidents(f.id);
    return `<div class="card mb-4">
      <div class="flex justify-between items-center"><h3>${esc(f.nomCommercial)}</h3><span style="font-weight:700;color:${perf.score>=70?'var(--success)':perf.score>=50?'var(--warning)':'var(--danger)'}">${perf.score}/100</span></div>
      <p class="text-sm mt-2">${esc(f.criticiteJustification||"—")}</p>
      <div class="grid grid-3 mt-4">
        <div><div class="text-xs">RISQUES</div>${risks.length?risks.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">${esc(r.name)}</span></div>`).join(""):`<p class="text-sm">Aucun</p>`}</div>
        <div><div class="text-xs">INCIDENTS</div>${incidents.length?incidents.map(i=>`<p class="text-sm mt-2">${esc(i.description.slice(0,60))}</p>`).join(""):`<p class="text-sm">Aucun</p>`}</div>
        <div><div class="text-xs">DÉPENDANCE</div><p class="text-sm">${(f.produitsServices||[]).map(p=>p.nom).join(", ")}</p></div>
      </div>
      <button class="btn btn-secondary btn-sm mt-4" data-route="fournisseurs/liste/${f.id}">Voir la fiche complète</button>
    </div>`;
  }).join("") : `<div class="card">${emptyState("🟢","Aucun fournisseur critique","Aucun fournisseur n'est classé critique actuellement.")}</div>`}`;
}

function pageFournisseurEvaluationsHub(){
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Évaluations"}])}
  ${pageHeader("Évaluations fournisseurs","")}
  ${dataTable(
    [ {label:"Fournisseur", render:e=>{const f=getFournisseur(e.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Date", render:e=>fmtDate(e.date)},
      {label:"Périodicité", render:e=>esc(e.periode)},
      {label:"Score", render:e=>fournisseurEvalScore(e)+"/10"},
      {label:"Niveau", render:e=>badge(LABELS.fournisseurEvalNiveau[fournisseurEvalNiveau(fournisseurEvalScore(e))])},
      {label:"Évaluateur", render:e=>esc(e.evaluateur)} ],
    [...DB.fournisseurEvaluations].sort((a,b)=>b.date.localeCompare(a.date)), {rowRoute:e=>`fournisseurs/liste/${e.fournisseurId}/evaluations`}
  )}`;
}
function pageFournisseurAuditsHub(){
  const audits = DB.audits.filter(a=>a.type==="fournisseur");
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Audits fournisseurs"}])}
  ${pageHeader("Audits fournisseurs","", `<button class="btn btn-primary" data-open-audit-wizard>+ Nouvel audit fournisseur</button>`)}
  ${dataTable(
    [ {label:"Fournisseur", render:a=>{const f=getFournisseur(a.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Audit", render:a=>`<div class="cell-title">${esc(a.title)}</div>`},
      {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Constats", render:a=>a.findings.length},
      {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    audits, {rowRoute:a=>`audits/${a.id}`, emptyEmoji:"🔍", emptyTitle:"Aucun audit fournisseur", emptyText:"Aucun audit fournisseur n'est encore planifié."}
  )}`;
}
function pageFournisseurIncidentsHub(){
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Incidents"}])}
  ${pageHeader("Incidents fournisseurs","À ne pas confondre avec les non-conformités du module NC/CAPA.")}
  ${dataTable(
    [ {label:"Fournisseur", render:i=>{const f=getFournisseur(i.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Type", render:i=>esc(LABELS.incidentType[i.type]||i.type)},
      {label:"Description", render:i=>esc(i.description.slice(0,60))},
      {label:"Gravité", render:i=>badge(LABELS.incidentGravite[i.gravite])},
      {label:"Date", render:i=>fmtDate(i.date)},
      {label:"Lien", render:i=>(i.ncEventId?"🚨 NC · ":"")+(i.riskId?"⚠️ Risque · ":"")+(i.actionId?"✅ Action":"")||"—"} ],
    [...DB.fournisseurIncidents].sort((a,b)=>b.date.localeCompare(a.date)), {rowRoute:i=>`fournisseurs/liste/${i.fournisseurId}/incidents`}
  )}`;
}
function pageFournisseurRisquesHub(){
  const risks = DB.risks.filter(r=>r.fournisseurId);
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Risques fournisseurs"}])}
  ${pageHeader("Risques fournisseurs","")}
  ${dataTable(
    [ {label:"Fournisseur", render:r=>{const f=getFournisseur(r.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Risque", render:r=>esc(r.name)},
      {label:"Niveau", render:r=>badge(LABELS.riskLevel[r.level])},
      {label:"Responsable", render:r=>esc(r.owner)},
      {label:"Statut", render:r=>badge(LABELS.riskStatus[r.status])} ],
    risks, {rowRoute:r=>`risques/${r.id}`, emptyEmoji:"⚠️", emptyTitle:"Aucun risque fournisseur", emptyText:"Aucun risque n'est encore associé à un fournisseur."}
  )}`;
}
function pageFournisseurDocumentsHub(){
  const docs = DB.fournisseurDocuments.map(d=>({...d, statutCalcule:fournisseurDocStatusCompute(d)}));
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Contrats & documents"}])}
  ${pageHeader("Contrats & documents fournisseurs","Gestion des échéances — contrats, certifications, assurances.")}
  ${dataTable(
    [ {label:"Fournisseur", render:d=>{const f=getFournisseur(d.fournisseurId); return f?esc(f.nomCommercial):"—";}},
      {label:"Document", render:d=>`<div class="cell-title">${esc(d.titre)}</div><div class="cell-sub">${esc(LABELS.fournisseurDocType[d.type]||d.type)}</div>`},
      {label:"Échéance", render:d=>fmtDate(d.echeance)},
      {label:"Responsable", render:d=>esc(d.responsable)},
      {label:"Statut", render:d=>badge(LABELS.fournisseurDocStatut[d.statutCalcule])} ],
    [...docs].sort((a,b)=>(a.echeance||"").localeCompare(b.echeance||"")), {rowRoute:d=>`fournisseurs/liste/${d.fournisseurId}/documents`}
  )}`;
}
function pageFournisseurPerformanceHub(){
  const ranked = [...DB.fournisseurs].map(f=>({f, perf:fournisseurPerformanceScore(f.id)})).sort((a,b)=>b.perf.score-a.perf.score);
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Performance"}])}
  ${pageHeader("Performance des fournisseurs","Score composite : dernière évaluation, incidents, écarts d'audit, risques ouverts, actions en retard.")}
  ${dataTable(
    [ {label:"Fournisseur", render:x=>esc(x.f.nomCommercial)},
      {label:"Score", render:x=>`<strong style="color:${x.perf.score>=70?'var(--success)':x.perf.score>=50?'var(--warning)':'var(--danger)'}">${x.perf.score}/100</strong>`},
      {label:"Dernière évaluation", render:x=>x.perf.evalLatest?fournisseurEvalScore(x.perf.evalLatest)+"/10 le "+fmtDate(x.perf.evalLatest.date):"Non évalué"},
      {label:"Incidents", render:x=>x.perf.incidents.length},
      {label:"Écarts d'audit", render:x=>x.perf.ecarts},
      {label:"Risques ouverts", render:x=>x.perf.risksOuverts} ],
    ranked, {rowRoute:x=>`fournisseurs/liste/${x.f.id}`}
  )}`;
}
function pageFournisseurVues(){
  const s = fournisseurDashboardStats();
  const views = [{id:"achats",l:"Vue Achats"},{id:"qualite",l:"Vue Qualité"},{id:"direction",l:"Vue Direction"},{id:"auditeur",l:"Vue Auditeur"}];
  const active = "achats";
  let content = "";
  if(active==="achats"){
    content = `<div class="card"><h3 class="mb-2">Vue Achats</h3><p class="text-sm">Suivi opérationnel : ${s.total} fournisseurs, ${s.evalARealiser} évaluation(s) à réaliser, ${s.actionsRetard} action(s) en retard.</p></div>`;
  }
  return `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Vues"}])}
  ${pageHeader("Vues Achats / Qualité / Direction / Auditeur","")}
  <div class="filters-bar">${views.map(v=>`<a class="chip ${v.id==='achats'?'active':''}" data-route="fournisseurs/vues/${v.id}">${esc(v.l)}</a>`).join("")}</div>
  <div class="grid grid-2">
    <div class="card"><h3 class="mb-2">🛒 Vue Achats</h3><p class="text-sm">${s.total} fournisseurs suivis · ${s.evalARealiser} évaluation(s) à réaliser · ${s.actionsRetard} action(s) en retard.</p></div>
    <div class="card"><h3 class="mb-2">✅ Vue Qualité</h3><p class="text-sm">${s.auditsAPlanifier} audit(s) à planifier · ${s.incidentsOuverts} incident(s) ouvert(s) · ${DB.fournisseurEvaluations.length} évaluation(s) enregistrée(s).</p></div>
    <div class="card"><h3 class="mb-2">🧭 Vue Direction</h3><p class="text-sm">Taux global de maîtrise : <strong>${s.tauxMaitrise}/100</strong> · ${s.critiques} fournisseur(s) critique(s) · ${s.risquesEleves} risque(s) élevé(s).</p></div>
    <div class="card"><h3 class="mb-2">🔍 Vue Auditeur</h3><p class="text-sm">${DB.fournisseurDocuments.length} document(s) suivi(s) · ${DB.audits.filter(a=>a.type==='fournisseur').length} audit(s) fournisseur réalisé(s) ou planifié(s).</p></div>
  </div>`;
}

/* ---------- Fiche fournisseur ---------- */
function fournisseurTabsHtml(f, active){
  const tabs = [
    {id:"identification",label:"Identification"}, {id:"produits",label:"Produits & services"}, {id:"documents",label:"Documents"},
    {id:"evaluations",label:"Évaluations"}, {id:"incidents",label:"Incidents"}, {id:"risques",label:"Risques"},
    {id:"audits",label:"Audits"}, {id:"actions",label:"Actions"}, {id:"performance",label:"Performance"},
  ];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="fournisseurs/liste/${f.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}
function pageFournisseurFiche(id, tab){
  const f = getFournisseur(id);
  if(!f) return emptyState("🏭","Fournisseur introuvable","Ce fournisseur n'existe pas.");
  tab = tab || "identification";
  const perf = fournisseurPerformanceScore(id);
  const stepIndex = FOURNISSEUR_WORKFLOW_STEPS.indexOf(f.statut==="actif"?"actif":f.statut==="sous_surveillance"?"surveillance":f.statut==="suspendu"?"suspension":f.statut==="bloque"?"suspension":f.statut==="archive"?"archivage":"prospect");
  const header = `
  ${breadcrumb([{label:"Fournisseurs",href:"#/fournisseurs"},{label:"Liste",href:"#/fournisseurs/liste"},{label:f.nomCommercial}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px;">
      <div>
        ${badge(LABELS.fournisseurCriticite[f.criticite])} ${badge(LABELS.fournisseurStatut[f.statut])}
        <h1 class="mt-2">${esc(f.nomCommercial)}</h1>
        <p class="section-sub mt-2">${esc(f.raisonSociale)} · ${(f.categories||[]).join(", ")}</p>
      </div>
      <div class="flex gap-2 items-center">
        <span style="font-weight:700;font-size:20px;color:${perf.score>=70?'var(--success)':perf.score>=50?'var(--warning)':'var(--danger)'}">${perf.score}/100</span>
        <button class="btn btn-secondary btn-sm" data-open-fournisseur-form="${f.id}">✏️</button>
      </div>
    </div>
    <div class="mt-4">${workflowStepper(FOURNISSEUR_WORKFLOW_LABELS, stepIndex<0?0:stepIndex)}</div>
  </div>
  ${fournisseurTabsHtml(f, tab)}`;
  let body = "";
  if(tab==="identification") body = frnTabIdentification(f);
  else if(tab==="produits") body = frnTabProduits(f);
  else if(tab==="documents") body = frnTabDocuments(f);
  else if(tab==="evaluations") body = frnTabEvaluations(f);
  else if(tab==="incidents") body = frnTabIncidents(f);
  else if(tab==="risques") body = frnTabRisques(f);
  else if(tab==="audits") body = frnTabAudits(f);
  else if(tab==="actions") body = frnTabActions(f);
  else if(tab==="performance") body = frnTabPerformance(f, perf);
  return header + body;
}
function frnTabIdentification(f){
  return `
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Identification</h3>
      <p class="text-sm">Raison sociale : ${esc(f.raisonSociale)}</p>
      <p class="text-sm mt-2">SIRET : ${esc(f.siret)} · TVA : ${esc(f.tva)}</p>
      <p class="text-sm mt-2">Pays : ${esc(f.pays)}</p>
      <p class="text-sm mt-2">Site web : ${esc(f.siteWeb||"—")}</p>
      <p class="text-sm mt-2">Adresse : ${esc(f.adresse)}</p>
      <p class="text-sm mt-2">Référent interne : ${esc(f.referentInterne)}</p>
      <p class="text-sm mt-2">Date d'entrée : ${fmtDate(f.dateEntree)}</p>
    </div>
    <div class="card">
      <h3 class="mb-2">Contacts</h3>
      ${(f.contacts||[]).map(c=>`<div class="rel-link"><span class="rel-name">${esc(c.nom)}</span><span class="text-sm">${esc(c.role)}</span></div>`).join("")||`<p class="text-sm">Aucun contact renseigné.</p>`}
      <h3 class="mb-2 mt-4">Criticité</h3>
      ${badge(LABELS.fournisseurCriticite[f.criticite])}
      <p class="text-sm mt-2">${esc(f.criticiteJustification||"—")}</p>
    </div>
  </div>
  <div class="card mt-4">
    <h3 class="mb-2">Processus concernés</h3>
    ${(f.processIds||[]).map(pid=>{const p=getProcess(pid); return p?`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`:"";}).join("")||`<p class="text-sm">Aucun processus associé.</p>`}
  </div>`;
}
function frnTabProduits(f){
  return `<div class="grid grid-2">${(f.produitsServices||[]).map(p=>`<div class="card"><h3>${esc(p.nom)}</h3><p class="text-sm mt-2">${esc(p.description)}</p></div>`).join("")||`<div class="card">${emptyState("📦","Aucun produit/service","Aucun produit ou service n'est encore associé à ce fournisseur.")}</div>`}</div>`;
}
function frnTabDocuments(f){
  const docs = fournisseurDocs(f.id).map(d=>({...d, statutCalcule:fournisseurDocStatusCompute(d)}));
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-fournisseur-doc-form="${f.id}">+ Ajouter un document</button></div>
  ${docs.length? dataTable(
    [ {label:"Document", render:d=>`<div class="cell-title">${esc(d.titre)}</div><div class="cell-sub">${esc(LABELS.fournisseurDocType[d.type]||d.type)}</div>`},
      {label:"Date", render:d=>fmtDate(d.date)},
      {label:"Échéance", render:d=>fmtDate(d.echeance)},
      {label:"Responsable", render:d=>esc(d.responsable)},
      {label:"Statut", render:d=>badge(LABELS.fournisseurDocStatut[d.statutCalcule])} ],
    docs
  ) : `<div class="card">${emptyState("🗂️","Aucun document","Aucun document n'est encore associé à ce fournisseur.")}</div>`}`;
}
function frnTabEvaluations(f){
  const evals = DB.fournisseurEvaluations.filter(e=>e.fournisseurId===f.id).sort((a,b)=>b.date.localeCompare(a.date));
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-fournisseur-eval-form="${f.id}">+ Nouvelle évaluation</button></div>
  ${evals.length? evals.map(e=>{
    const score = fournisseurEvalScore(e);
    const niveau = fournisseurEvalNiveau(score);
    return `<div class="card mb-2">
      <div class="flex justify-between items-center"><h3 style="font-size:14.5px;">Évaluation du ${fmtDate(e.date)} (${esc(e.periode)})</h3>${badge(LABELS.fournisseurEvalNiveau[niveau])}</div>
      <p class="text-sm mt-2">Score global : <strong>${score}/10</strong> · Évaluateur : ${esc(e.evaluateur)}</p>
      ${e.criteres.map(c=>`<div class="flex justify-between items-center mt-2"><span class="text-sm">${esc(c.nom)} (pondération ${c.ponderation}%)</span><span class="text-sm" style="font-weight:700;">${c.note}/10</span></div>${c.commentaire?`<p class="text-xs mt-2">${esc(c.commentaire)}</p>`:""}`).join("")}
    </div>`;
  }).join("") : `<div class="card">${emptyState("📊","Aucune évaluation","Aucune évaluation n'a encore été réalisée pour ce fournisseur.")}</div>`}`;
}
function frnTabIncidents(f){
  const incidents = fournisseurIncidents(f.id);
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-fournisseur-incident-form="${f.id}">+ Déclarer un incident</button></div>
  ${incidents.length? incidents.map(i=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center">${badgeRaw("info",LABELS.incidentType[i.type]||i.type)}${badge(LABELS.incidentGravite[i.gravite])}</div>
      <p class="text-sm mt-2" style="color:var(--text-primary);">${esc(i.description)}</p>
      <p class="text-xs mt-2">Impact : ${esc(i.impact)} · ${fmtDate(i.date)}</p>
      <div class="flex gap-2 mt-2" style="flex-wrap:wrap;">
        ${i.ncEventId?`<span class="badge badge-neutral" data-route="evenements/non_conformite/${i.ncEventId}" style="cursor:pointer;">NC liée →</span>`:`<button class="btn btn-secondary btn-sm" data-create-nc-from-incident="${i.id}">+ Créer une NC</button>`}
        ${i.actionId?`<span class="badge badge-neutral" data-route="actions" style="cursor:pointer;">Action liée →</span>`:`<button class="btn btn-secondary btn-sm" data-create-action-from-incident="${i.id}">+ Créer une action</button>`}
        ${i.riskId?`<span class="badge badge-neutral" data-route="risques/${i.riskId}" style="cursor:pointer;">Risque associé →</span>`:""}
      </div>
    </div>`).join("") : `<div class="card">${emptyState("🚨","Aucun incident","Aucun incident n'a été déclaré pour ce fournisseur.")}</div>`}`;
}
function frnTabRisques(f){
  const risks = fournisseurRisks(f.id);
  return risks.length? dataTable(
    [ {label:"Risque", render:r=>esc(r.name)}, {label:"Niveau", render:r=>badge(LABELS.riskLevel[r.level])},
      {label:"Responsable", render:r=>esc(r.owner)}, {label:"Statut", render:r=>badge(LABELS.riskStatus[r.status])} ],
    risks, {rowRoute:r=>`risques/${r.id}`}
  ) : `<div class="card">${emptyState("⚠️","Aucun risque","Aucun risque n'est encore identifié pour ce fournisseur.", `<button class="btn btn-primary" data-open-quick="risk" data-preset-process="${(f.processIds||[])[0]||''}">+ Identifier un risque</button>`)}</div>`;
}
function frnTabAudits(f){
  const audits = fournisseurAudits(f.id);
  return audits.length? dataTable(
    [ {label:"Audit", render:a=>esc(a.title)}, {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Constats", render:a=>a.findings.length}, {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    audits, {rowRoute:a=>`audits/${a.id}`}
  ) : `<div class="card">${emptyState("🔍","Aucun audit","Aucun audit n'a encore été réalisé pour ce fournisseur.", `<button class="btn btn-primary" data-open-audit-wizard data-preset-process="${(f.processIds||[])[0]||''}">+ Créer un audit</button>`)}</div>`;
}
function frnTabActions(f){
  const actions = fournisseurActions(f.id);
  return actions.length? actionTable(actions) : `<div class="card">${emptyState("✅","Aucune action","Aucune action n'est encore ouverte pour ce fournisseur.")}</div>`;
}
function frnTabPerformance(f, perf){
  return `
  <div class="card mb-4">
    <div class="flex items-center gap-3">
      ${ringGauge(perf.score, perf.score>=70?"var(--success)":perf.score>=50?"var(--warning)":"var(--danger)", 80)}
      <div class="kpi"><div class="val">${perf.score}/100</div><div class="lbl">Score de performance global</div></div>
    </div>
  </div>
  <div class="card">
    <h3 class="mb-2">Composantes du score</h3>
    <p class="text-sm">Dernière évaluation : ${perf.evalLatest?fournisseurEvalScore(perf.evalLatest)+"/10 le "+fmtDate(perf.evalLatest.date):"Non évaluée"}</p>
    <p class="text-sm mt-2">Incidents pris en compte : ${perf.incidents.length}</p>
    <p class="text-sm mt-2">Écarts d'audit : ${perf.ecarts}</p>
    <p class="text-sm mt-2">Risques élevés/critiques ouverts : ${perf.risksOuverts}</p>
    <p class="text-sm mt-2">Actions en retard : ${perf.actionsRetard}</p>
    <p class="text-xs mt-4">Score calculé automatiquement à partir des données réelles — jamais déclaré sans preuve.</p>
  </div>`;
}

/* ============================================================
   14. RÉFÉRENTIELS — moteur de conformité
   ============================================================ */

/* ---------- Bundles de preuves & scoring transparent ---------- */
function legacyRequirementBundle(r){
  const process = getProcess(r.processId);
  const docMap = new Map();
  DB.documents.forEach(d=>{ if(d.status==="obsolete") return; if((d.requirementIds||[]).includes(r.id) || (r.extraDocIds||[]).includes(d.id)) docMap.set(d.id,d); });
  const docs = [...docMap.values()];
  const auditMap = new Map();
  if(process) DB.audits.filter(a=>a.processId===process.id).forEach(a=>auditMap.set(a.id,a));
  (r.extraAuditIds||[]).forEach(id=>{ const a=getAudit(id); if(a) auditMap.set(a.id,a); });
  const audits = [...auditMap.values()];
  const actionMap = new Map();
  if(process) DB.actions.filter(a=>a.processId===process.id && a.status!=="termine").forEach(a=>actionMap.set(a.id,a));
  (r.extraActionIds||[]).forEach(id=>{ const a=getAction(id); if(a && a.status!=="termine") actionMap.set(a.id,a); });
  const actionsOpen = [...actionMap.values()];
  const actionsLate = actionsOpen.filter(a=>a.status==="retard");
  const riskMap = new Map();
  if(process) DB.risks.filter(rk=>rk.processId===process.id && rk.type==="risque" && rk.status==="ouvert" && (rk.level==="critique"||rk.level==="eleve")).forEach(rk=>riskMap.set(rk.id,rk));
  (r.extraRiskIds||[]).forEach(id=>{ const rk=getRisk(id); if(rk && rk.status==="ouvert") riskMap.set(rk.id,rk); });
  const risksOpen = [...riskMap.values()];
  const indicatorsBad = process ? DB.indicators.filter(i=>i.processId===process.id && i.status!=="vert") : [];
  const auditEcarts = audits.some(a=>a.findings.some(f=>isAuditEcart(f)) && a.status!=="cloture");
  return {docs, audits, actionsOpen, actionsLate, risksOpen, indicatorsBad, auditEcarts, process, processes:process?[process]:[]};
}
function customExigenceBundle(e){
  const processes = (e.processIds||[]).map(getProcess).filter(Boolean);
  const docs = (e.docIds||[]).map(getDocument).filter(Boolean).filter(d=>d.status!=="obsolete");
  const audits = (e.auditIds||[]).map(getAudit).filter(Boolean);
  processes.forEach(p=>{ DB.audits.filter(a=>a.processId===p.id).forEach(a=>{ if(!audits.find(x=>x.id===a.id)) audits.push(a); }); });
  let actionsOpen = (e.actionIds||[]).map(getAction).filter(Boolean).filter(a=>a.status!=="termine");
  processes.forEach(p=>{ DB.actions.filter(a=>a.processId===p.id && a.status!=="termine").forEach(a=>{ if(!actionsOpen.find(x=>x.id===a.id)) actionsOpen.push(a); }); });
  const actionsLate = actionsOpen.filter(a=>a.status==="retard");
  let risksOpen = (e.riskIds||[]).map(getRisk).filter(Boolean).filter(r=>r.status==="ouvert");
  processes.forEach(p=>{ DB.risks.filter(r=>r.processId===p.id && r.type==="risque" && r.status==="ouvert" && (r.level==="critique"||r.level==="eleve")).forEach(r=>{ if(!risksOpen.find(x=>x.id===r.id)) risksOpen.push(r); }); });
  const indicatorsBad = processes.flatMap(p=> DB.indicators.filter(i=>i.processId===p.id && i.status!=="vert"));
  const auditEcarts = audits.some(a=>a.findings.some(f=>isAuditEcart(f)) && a.status!=="cloture");
  return {docs, audits, actionsOpen, actionsLate, risksOpen, indicatorsBad, auditEcarts, process:processes[0]||null, processes};
}
function scoreCoverage(bundle){
  if(!bundle.docs.length) return "non_couvert";
  let score = 1;
  score += bundle.audits.length ? 1 : 0;
  score += bundle.auditEcarts ? -1 : 1;
  score += bundle.actionsLate.length===0 ? 1 : -1;
  score += bundle.risksOpen.length===0 ? 1 : -1;
  score += bundle.indicatorsBad.length===0 ? 1 : 0;
  if(score<=1) return "partiellement";
  if(score<=3) return "a_renforcer";
  if(score<=5) return "maitrise";
  return "optimise";
}
function coverageReasons(bundle){
  const reasons = [];
  reasons.push(bundle.docs.length ? `${bundle.docs.length} document(s) associé(s)` : "Aucun document associé — condition bloquante pour la couverture");
  reasons.push(bundle.audits.length ? `${bundle.audits.length} audit(s) existant(s)`+(bundle.auditEcarts?" avec écart(s) non clôturé(s)":", sans écart ouvert") : "Aucun audit associé");
  reasons.push(bundle.actionsLate.length ? `${bundle.actionsLate.length} action(s) en retard` : (bundle.actionsOpen.length? `${bundle.actionsOpen.length} action(s) en cours, aucune en retard` : "Aucune action ouverte"));
  reasons.push(bundle.risksOpen.length ? `${bundle.risksOpen.length} risque(s) élevé(s) ou critique(s) ouvert(s)` : "Aucun risque élevé ouvert");
  if(bundle.indicatorsBad.length) reasons.push(`${bundle.indicatorsBad.length} indicateur(s) hors cible`);
  return reasons;
}
function getReferentielExigenceViews(refId){
  if(refId==="ISO9001"){
    return DB.requirements.map(r=>{
      const bundle = legacyRequirementBundle(r);
      const level = scoreCoverage(bundle);
      return { id:r.id, ref:r.ref, title:r.label, description:"", sourceText:"", type:"exigence", legacy:true, bundle, level, process:bundle.process,
        updatedAt: bundle.docs.reduce((max,d)=> d.date>max?d.date:max, "") };
    });
  }
  return DB.customExigences.filter(e=>e.referentielId===refId).map(e=>{
    const bundle = customExigenceBundle(e);
    const level = scoreCoverage(bundle);
    return { id:e.id, ref:e.ref, title:e.title, description:e.description, sourceText:e.sourceText, type:e.type, legacy:false, bundle, level, process:bundle.process,
      updatedAt: bundle.docs.reduce((max,d)=> d.date>max?d.date:max, "") };
  });
}
function referentielScore(refId){
  const views = getReferentielExigenceViews(refId);
  const total = views.length;
  const counts = {non_couvert:0, partiellement:0, a_renforcer:0, maitrise:0, optimise:0};
  views.forEach(v=> counts[v.level]++);
  const pct = total ? Math.round(((counts.maitrise+counts.optimise)/total)*100) : 0;
  return {views, total, counts, pct};
}

/* ---------- Analyse & import d'un référentiel ---------- */
function parseReferentielText(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const chapterRe = /^(\d+(?:\.\d+){0,3})\s+(.{3,90})$/;
  const reqWordsRe = /\b(doit|doivent|shall|must|est tenu de|il convient de|est requis|obligatoire)\b/i;
  let currentRef = "", currentTitle = "";
  const exigences = [];
  lines.forEach(line=>{
    const m = line.match(chapterRe);
    if(m && !reqWordsRe.test(line)){ currentRef = m[1]; currentTitle = m[2]; return; }
    if(reqWordsRe.test(line)){
      line.split(/(?<=[.;])\s+/).forEach(sentence=>{
        if(reqWordsRe.test(sentence) && sentence.length>15){
          let type = "exigence";
          if(/preuve|enregistrement|trace|document[ée]/i.test(sentence)) type = "preuve";
          else if(/responsab/i.test(sentence)) type = "responsabilite";
          exigences.push({ ref: currentRef || "—", title: (currentTitle || sentence.slice(0,60)).slice(0,90), description: sentence.trim(), sourceText: sentence.trim(), type });
        }
      });
    }
  });
  const seen = new Set();
  const deduped = exigences.filter(e=>{ const k=e.ref+"|"+e.description.slice(0,40); if(seen.has(k)) return false; seen.add(k); return true; });
  return { chapters: [...new Set(deduped.map(e=>e.ref))], exigences: deduped.slice(0,80) };
}
function linkExigenceToSMQ(text){
  const low = text.toLowerCase();
  const words = low.split(/\s+/).filter(w=>w.length>5);
  const processIds = DB.processes.filter(p=> low.includes(p.name.toLowerCase())).map(p=>p.id);
  const docIds = DB.documents.filter(d=> d.status!=="obsolete" && words.some(w=>d.title.toLowerCase().includes(w))).slice(0,3).map(d=>d.id);
  const riskIds = DB.risks.filter(r=> words.some(w=>r.name.toLowerCase().includes(w))).slice(0,3).map(r=>r.id);
  return {processIds, docIds, riskIds, auditIds:[], indicatorIds:[], actionIds:[]};
}

function openReferentielImportModal(presets){
  presets = presets || {};
  const existingRef = presets.refId ? getReferentiel(presets.refId) : null;
  const state = { text:"", parsed:null, meta:{ name: existingRef?existingRef.name:"", version:"", origin:"" } };

  function step1Html(){
    return `
      ${!existingRef?`<div class="field"><label>Nom du référentiel <span class="req">*</span></label><input type="text" id="imp-name" placeholder="Ex : Référentiel groupe qualité"></div>`:`<p class="text-sm mb-2">Référentiel : <strong>${esc(existingRef.name)}</strong></p>`}
      <div class="field-row">
        <div class="field"><label>Version</label><input type="text" id="imp-version" placeholder="Ex : 2026"></div>
        <div class="field"><label>Origine</label><input type="text" id="imp-origin" placeholder="Ex : Import PDF, procédure groupe…"></div>
      </div>
      <div class="field"><label>Fichier (.txt ou .html — lecture automatique)</label><input type="file" id="imp-file" accept=".txt,.html,.htm,.md"></div>
      <p class="text-xs">Les formats PDF et DOCX ne peuvent pas être extraits automatiquement dans ce prototype sans serveur : collez le texte ci-dessous, ou utilisez un export .txt.</p>
      <div class="field"><label>Texte du référentiel <span class="req">*</span></label><textarea id="imp-text" style="min-height:180px;" placeholder="Collez ici le texte du référentiel (chapitres, exigences…)">${esc(state.text)}</textarea></div>
    `;
  }
  function step1Foot(){ return `<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="imp-analyze">🧠 Analyser le document</button>`; }
  function step2Html(){
    const p = state.parsed;
    return `
      <div class="grid grid-3 mb-4">
        <div class="kpi"><div class="val">${p.chapters.length}</div><div class="lbl">Chapitres détectés</div></div>
        <div class="kpi"><div class="val">${p.exigences.length}</div><div class="lbl">Exigences détectées</div></div>
        <div class="kpi"><div class="val">${p.exigences.filter(e=>e.type==="preuve").length}</div><div class="lbl">Preuves attendues</div></div>
      </div>
      <div style="max-height:320px;overflow-y:auto;">
        ${p.exigences.slice(0,15).map(e=>`<div class="rel-link"><span class="rel-name">${esc(e.ref)} — ${esc(e.title)}</span>${badgeRaw("info", LABELS.exigenceType[e.type])}</div>`).join("")}
        ${p.exigences.length>15?`<p class="text-xs mt-2">… et ${p.exigences.length-15} autre(s).</p>`:""}
      </div>
      ${!p.exigences.length?`<p class="text-sm mt-2">⚠️ Aucune exigence détectée. Vérifiez que le texte contient des formulations comme « doit », « doivent » ou « shall ».</p>`:""}
    `;
  }
  function step2Foot(){ return `<button class="btn btn-secondary" id="imp-back">← Revenir</button><button class="btn btn-primary" id="imp-confirm" ${!state.parsed.exigences.length?"disabled":""}>Valider l'import</button>`; }

  function mountStep1(o){
    o.querySelector("#imp-file").addEventListener("change", (e)=>{
      const f = e.target.files[0];
      if(!f) return;
      if(!/\.(txt|html?|md)$/i.test(f.name)){ toast("Ce type de fichier ne peut pas être lu automatiquement — collez le texte","⚠️"); return; }
      const reader = new FileReader();
      reader.onload = ()=>{ o.querySelector("#imp-text").value = String(reader.result).replace(/<[^>]+>/g," "); toast("Fichier chargé"); };
      reader.readAsText(f);
    });
    o.querySelector("#imp-analyze").addEventListener("click", ()=>{
      const text = o.querySelector("#imp-text").value.trim();
      if(!text){ toast("Collez ou importez un texte à analyser","⚠️"); return; }
      state.text = text;
      state.meta.name = existingRef ? existingRef.name : (o.querySelector("#imp-name")?.value.trim() || "Référentiel importé");
      state.meta.version = o.querySelector("#imp-version").value.trim() || String(new Date().getFullYear());
      state.meta.origin = o.querySelector("#imp-origin").value.trim() || "Import texte";
      state.parsed = parseReferentielText(text);
      renderStep(o, 2);
    });
  }
  function mountStep2(o){
    o.querySelector("#imp-back").addEventListener("click", ()=> renderStep(o,1));
    const confirmBtn = o.querySelector("#imp-confirm");
    if(confirmBtn) confirmBtn.addEventListener("click", ()=>{
      let ref = existingRef;
      if(!ref){
        const id = "REF-"+String(Date.now()).slice(-6);
        ref = { id, name:state.meta.name, desc:"Référentiel importé dans Qonnect.", active:false, version:state.meta.version, importDate:new Date().toISOString().slice(0,10), author:"Vous", origin:state.meta.origin, versions:[] };
        DB.referentiels.push(ref);
      }
      const isNewVersion = presets.newVersion && ref.versions.length;
      let diffNote = "Import initial — "+state.parsed.exigences.length+" exigence(s) détectée(s).";
      let diffDetail = null;
      if(isNewVersion){
        const oldExigences = DB.customExigences.filter(e=>e.referentielId===ref.id);
        const keyOf = e => e.ref + "|" + (e.title||"").toLowerCase().slice(0,40);
        const oldMap = new Map(oldExigences.map(e=>[keyOf(e), e]));
        const newMap = new Map(state.parsed.exigences.map(e=>[keyOf(e), e]));
        const added = [...newMap.keys()].filter(k=>!oldMap.has(k)).map(k=>newMap.get(k));
        const removed = [...oldMap.keys()].filter(k=>!newMap.has(k)).map(k=>oldMap.get(k));
        const oldByChapter = {}; oldExigences.forEach(e=>{ (oldByChapter[e.ref]=oldByChapter[e.ref]||[]).push(e); });
        const newByChapter = {}; state.parsed.exigences.forEach(e=>{ (newByChapter[e.ref]=newByChapter[e.ref]||[]).push(e); });
        const modified = [];
        Object.keys(newByChapter).forEach(chRef=>{
          if(oldByChapter[chRef] && oldByChapter[chRef].length && newByChapter[chRef].length){
            const oldTexts = oldByChapter[chRef].map(e=>e.description).join(" ");
            const newTexts = newByChapter[chRef].map(e=>e.description).join(" ");
            if(oldTexts !== newTexts) modified.push("Chapitre "+chRef);
          }
        });
        diffNote = `Nouvelle version — ${added.length} exigence(s) ajoutée(s), ${removed.length} supprimée(s), ${modified.length} chapitre(s) modifié(s).`;
        diffDetail = { added: added.map(e=>e.ref+" — "+e.title), removed: removed.map(e=>e.ref+" — "+e.title), modified };
        DB.customExigences = DB.customExigences.filter(e=>e.referentielId!==ref.id);
      }
      state.parsed.exigences.forEach((e,i)=>{
        const links = linkExigenceToSMQ(e.title+" "+e.description);
        DB.customExigences.push({ id:"CEX-"+ref.id+"-"+i+"-"+String(Date.now()).slice(-4), referentielId:ref.id,
          ref:e.ref, title:e.title, description:e.description, sourceText:e.sourceText, type:e.type, ...links });
      });
      ref.version = state.meta.version; ref.importDate = new Date().toISOString().slice(0,10); ref.origin = state.meta.origin;
      ref.versions.push({version:state.meta.version, date:new Date().toISOString().slice(0,10), note:diffNote, diff:diffDetail});
      saveDB(); closeModal(); toast("Référentiel analysé et importé — "+state.parsed.exigences.length+" exigence(s)");
      navigate(`referentiels/${ref.id}`);
    });
  }
  function renderStep(o, step){
    o.querySelector(".modal-body").innerHTML = step===1?step1Html():step2Html();
    o.querySelector(".modal-foot").innerHTML = step===1?step1Foot():step2Foot();
    if(step===1) mountStep1(o); else mountStep2(o);
  }

  openModal({title: presets.newVersion?"Importer une nouvelle version":"Importer un référentiel", wide:true, bodyHtml:step1Html(), footHtml:step1Foot(), onMount:(o)=>mountStep1(o)});
}

function openReferentielEditForm(refId){
  const ref = getReferentiel(refId);
  if(!ref) return;
  openModal({title:"Modifier le référentiel",
    bodyHtml:`
      <div class="field"><label>Nom <span class="req">*</span></label><input type="text" id="ref-name" value="${esc(ref.name)}"></div>
      <div class="field"><label>Description</label><textarea id="ref-desc">${esc(ref.desc)}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Version</label><input type="text" id="ref-version" value="${esc(ref.version||"")}"></div>
        <div class="field"><label>Origine</label><input type="text" id="ref-origin" value="${esc(ref.origin||"")}"></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ref-save">Enregistrer</button>`,
    onMount:(o)=>{ o.querySelector("#ref-save").addEventListener("click", ()=>{
      const name = o.querySelector("#ref-name").value.trim();
      if(!name){ toast("Merci de saisir un nom","⚠️"); return; }
      ref.name = name; ref.desc = o.querySelector("#ref-desc").value.trim();
      ref.version = o.querySelector("#ref-version").value.trim()||null;
      ref.origin = o.querySelector("#ref-origin").value.trim()||null;
      saveDB(); closeModal(); toast("Référentiel mis à jour"); render();
    });}
  });
}

function deleteReferentiel(refId){
  const ref = getReferentiel(refId);
  if(!ref) return;
  const nbExigences = DB.customExigences.filter(e=>e.referentielId===refId).length + (refId==="ISO9001"?DB.requirements.length:0);
  confirmDialog(`Supprimer définitivement le référentiel « ${ref.name} » et ${nbExigences} exigence(s) associée(s) ? Cette action est irréversible.`, ()=>{
    const wasActive = ref.active;
    DB.referentiels = DB.referentiels.filter(r=>r.id!==refId);
    DB.customExigences = DB.customExigences.filter(e=>e.referentielId!==refId);
    if(refId==="ISO9001") DB.requirements = [];
    if(wasActive && DB.referentiels.length) DB.referentiels[0].active = true;
    saveDB(); toast("Référentiel supprimé"); navigate("referentiels");
  });
}

function openExigenceEditForm(refId, exigenceId){
  const isLegacy = refId==="ISO9001";
  const entity = isLegacy ? findBy(DB.requirements, exigenceId) : getCustomExigence(exigenceId);
  if(!entity) return;
  const currentProcessId = isLegacy ? (entity.processId||"") : ((entity.processIds&&entity.processIds[0])||"");
  const currentDocIds = isLegacy ? (entity.extraDocIds||[]) : (entity.docIds||[]);
  const currentRiskIds = isLegacy ? (entity.extraRiskIds||[]) : (entity.riskIds||[]);
  const currentAuditIds = isLegacy ? (entity.extraAuditIds||[]) : (entity.auditIds||[]);

  openModal({title:"Modifier l'exigence", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Référence</label><input type="text" id="ex-ref" value="${esc(entity.ref)}"></div>
        <div class="field"><label>Processus principal</label><select id="ex-process"><option value="">—</option>${DB.processes.map(p=>`<option value="${p.id}" ${currentProcessId===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Intitulé <span class="req">*</span></label><input type="text" id="ex-title" value="${esc(isLegacy?entity.label:entity.title)}"></div>
      ${!isLegacy?`<div class="field"><label>Description</label><textarea id="ex-desc">${esc(entity.description||"")}</textarea></div>`:""}
      <div class="field"><label>Documents associés (preuves)</label><div style="max-height:130px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
        ${DB.documents.filter(d=>d.status!=="obsolete").map(d=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ex-doc-cb" value="${d.id}" ${currentDocIds.includes(d.id)?"checked":""} style="width:auto;"> ${esc(d.title)}</label>`).join("")}
      </div></div>
      <div class="field-row">
        <div class="field"><label>Risques associés</label><div style="max-height:110px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${DB.risks.map(r=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ex-risk-cb" value="${r.id}" ${currentRiskIds.includes(r.id)?"checked":""} style="width:auto;"> ${esc(r.name)}</label>`).join("")}
        </div></div>
        <div class="field"><label>Audits associés</label><div style="max-height:110px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${DB.audits.map(a=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ex-audit-cb" value="${a.id}" ${currentAuditIds.includes(a.id)?"checked":""} style="width:auto;"> ${esc(a.title)}</label>`).join("")}
        </div></div>
      </div>`,
    footHtml:`<button class="btn btn-danger" id="ex-delete" style="margin-right:auto;">Supprimer</button><button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ex-save">Enregistrer</button>`,
    onMount:(o)=>{
      o.querySelector("#ex-save").addEventListener("click", ()=>{
        const refTxt = o.querySelector("#ex-ref").value.trim() || entity.ref;
        const title = o.querySelector("#ex-title").value.trim();
        if(!title){ toast("Merci de saisir un intitulé","⚠️"); return; }
        const processId = o.querySelector("#ex-process").value || null;
        const docIds = [...o.querySelectorAll(".ex-doc-cb:checked")].map(c=>c.value);
        const riskIds = [...o.querySelectorAll(".ex-risk-cb:checked")].map(c=>c.value);
        const auditIds = [...o.querySelectorAll(".ex-audit-cb:checked")].map(c=>c.value);
        if(isLegacy){
          entity.ref = refTxt; entity.label = title; entity.processId = processId;
          entity.extraDocIds = docIds; entity.extraRiskIds = riskIds; entity.extraAuditIds = auditIds;
        } else {
          entity.ref = refTxt; entity.title = title; entity.description = o.querySelector("#ex-desc").value.trim();
          entity.processIds = processId ? [processId] : []; entity.docIds = docIds; entity.riskIds = riskIds; entity.auditIds = auditIds;
        }
        saveDB(); closeModal(); toast("Exigence mise à jour"); navigate(`referentiels/${refId}/exigences`);
      });
      o.querySelector("#ex-delete").addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement cette exigence ?", ()=>{
          if(isLegacy) DB.requirements = DB.requirements.filter(r=>r.id!==exigenceId);
          else DB.customExigences = DB.customExigences.filter(e=>e.id!==exigenceId);
          saveDB(); closeModal(); toast("Exigence supprimée"); navigate(`referentiels/${refId}/exigences`);
        });
      });
    }
  });
}

/* ---------- Assistant IA spécialisé Référentiels ---------- */
const REF_AI_HISTORY = {};
function refAIGenerateReply(ref, score, q){
  const low = q.toLowerCase();
  if(/r[ée]sum/.test(low)){
    return `${esc(ref.name)} comporte ${score.total} exigence(s) identifiée(s). Niveau global de maîtrise : <strong>${score.pct}%</strong>. ${score.counts.non_couvert} exigence(s) ne sont couvertes par aucun élément du SMQ à ce jour.<p class="text-xs mt-4">Analyse générée à partir des données disponibles dans Qonnect.</p>`;
  }
  if(/non couvert|pas couvert|[ée]cart|manque/.test(low)){
    const list = score.views.filter(v=>v.level==="non_couvert").slice(0,8);
    return list.length? `Exigences non couvertes :<ul>${list.map(v=>`<li>${esc(v.ref)} — ${esc(v.title)}</li>`).join("")}</ul>` : "Toutes les exigences disposent d'au moins un élément de preuve associé.";
  }
  if(/audit/.test(low)){
    const weak = score.views.filter(v=>v.level==="non_couvert"||v.level==="partiellement").slice(0,6);
    return weak.length? `Pour préparer un audit sur ${esc(ref.name)}, concentrez-vous en priorité sur :<ul>${weak.map(v=>`<li>${esc(v.ref)} — ${esc(v.title)}</li>`).join("")}</ul>` : "Aucun point de vigilance majeur identifié actuellement pour cet audit.";
  }
  if(/revue de direction/.test(low)){
    return `Éléments à intégrer à la revue de direction pour ${esc(ref.name)} : niveau de maîtrise (${score.pct}%), ${score.counts.non_couvert} exigence(s) non couvertes, et les risques réglementaires associés aux processus concernés.`;
  }
  if(/pourquoi|conforme|non conforme/.test(low)){
    return `La conformité d'une exigence est calculée à partir des preuves réellement enregistrées dans Qonnect (documents, audits, actions, risques, indicateurs) — jamais déclarée sans preuve. Ouvrez une exigence dans l'onglet « Exigences » pour voir le détail du calcul.`;
  }
  return `Je peux résumer ce référentiel, lister les exigences non couvertes, préparer un audit ou une revue de direction, ou expliquer le calcul de conformité d'une exigence. Que souhaitez-vous savoir sur ${esc(ref.name)} ?`;
}

/* ---------- Pages ---------- */
function pageReferentiels(){
  return `
  ${pageHeader("Référentiels","Le moteur de conformité de Qonnect — importez un référentiel, Qonnect en analyse la structure et calcule automatiquement votre niveau de maîtrise.",
    `<button class="btn btn-primary" data-open-referentiel-import>+ Importer un référentiel</button>`)}
  <div class="grid grid-3">
    ${DB.referentiels.map(r=>{
      const views = getReferentielExigenceViews(r.id);
      const score = views.length ? referentielScore(r.id) : null;
      return `<div class="card ${r.active?'':'card-hover'}" ${r.active?'':`data-select-ref="${r.id}"`} style="${r.active?'border-color:var(--primary);':''}">
        <div class="flex justify-between items-center">
          <h3>${esc(r.name)}</h3>
          ${r.active?badgeRaw("success","Actif"):""}
        </div>
        <p class="text-sm mt-2">${esc(r.desc)}</p>
        ${score?`<div class="flex items-center gap-2 mt-4"><span class="text-sm" style="font-weight:700;color:var(--primary);">${score.pct}%</span><span class="text-xs">de maîtrise · ${score.total} exigence(s)</span></div>`:`<p class="text-xs mt-4">Aucune exigence importée pour le moment.</p>`}
        <div class="flex gap-2 mt-4" style="flex-wrap:wrap;">
          ${views.length?`<a class="btn btn-primary btn-sm" data-route="referentiels/${r.id}">Voir le détail</a>`:""}
          ${r.active?"":`<button class="btn btn-secondary btn-sm" data-select-ref="${r.id}">Sélectionner</button>`}
          <button class="btn btn-secondary btn-sm" data-edit-ref="${r.id}">✏️ Modifier</button>
          <button class="btn btn-danger btn-sm" data-delete-ref="${r.id}">🗑 Supprimer</button>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function referentielTabsHtml(ref, active){
  const tabs = [{id:"vue",label:"Vue d'ensemble"},{id:"exigences",label:"Exigences"},{id:"cartographie",label:"Cartographie"},{id:"versions",label:"Versions"},{id:"assistant",label:"Assistant IA"}];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="referentiels/${ref.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}

function pageReferentielDetail(id, tab, subId){
  const ref = getReferentiel(id);
  if(!ref) return emptyState("🛡️","Référentiel introuvable","Ce référentiel n'existe pas.");
  tab = tab || "vue";
  const score = referentielScore(id);

  const header = `
  ${breadcrumb([{label:"Référentiels",href:"#/referentiels"},{label:ref.name}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px;">
      <div>
        <h1>${esc(ref.name)}</h1>
        <p class="section-sub mt-2">${esc(ref.desc)}${ref.version?" · Version "+esc(ref.version):""}${ref.importDate?" · Importé le "+fmtDate(ref.importDate):""}</p>
      </div>
      ${ref.active?badgeRaw("success","Actif"):`<button class="btn btn-secondary btn-sm" data-select-ref="${ref.id}">Activer</button>`}
    </div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-secondary btn-sm" data-edit-ref="${ref.id}">✏️ Modifier</button>
      <button class="btn btn-danger btn-sm" data-delete-ref="${ref.id}">🗑 Supprimer le référentiel</button>
    </div>
    ${score.total?`
    <div class="flex items-center gap-3 mt-4" style="flex-wrap:wrap;">
      ${ringGauge(score.pct, "var(--primary)", 72)}
      <div class="kpi"><div class="val">${score.pct} %</div><div class="lbl">Niveau global de maîtrise</div></div>
      <div class="grid grid-4" style="flex:1;gap:10px;min-width:280px;">
        <div class="kpi"><div class="val" style="color:var(--success)">${score.counts.maitrise+score.counts.optimise}</div><div class="lbl">Maîtrisées</div></div>
        <div class="kpi"><div class="val" style="color:var(--warning)">${score.counts.a_renforcer}</div><div class="lbl">À renforcer</div></div>
        <div class="kpi"><div class="val" style="color:var(--warning)">${score.counts.partiellement}</div><div class="lbl">Partielles</div></div>
        <div class="kpi"><div class="val" style="color:var(--danger)">${score.counts.non_couvert}</div><div class="lbl">Non couvertes</div></div>
      </div>
    </div>` : `<div class="mt-4">${emptyState("📥","Aucune exigence importée","Importez ce référentiel pour que Qonnect en analyse automatiquement la structure.", `<button class="btn btn-primary" data-open-referentiel-import data-preset-ref="${ref.id}">+ Importer ce référentiel</button>`)}</div>`}
  </div>
  ${score.total?referentielTabsHtml(ref, tab):""}`;

  if(!score.total) return header;
  if(tab==="exigences" && subId){
    const v = score.views.find(x=>x.id===subId);
    return header + (v ? refExigenceDetail(ref, v) : emptyState("📐","Exigence introuvable","Cette exigence n'existe pas."));
  }
  let body = "";
  if(tab==="vue") body = refTabVue(ref, score);
  else if(tab==="exigences") body = refTabExigences(ref, score);
  else if(tab==="cartographie") body = refTabCartographie(ref, score);
  else if(tab==="versions") body = refTabVersions(ref);
  else if(tab==="assistant") body = refTabAssistant(ref, score);
  return header + body;
}

function versionDiffHtml(v){
  if(!v.diff) return "";
  const parts = [];
  if(v.diff.added.length) parts.push(`<p class="text-xs mt-2">➕ Ajoutées : ${v.diff.added.map(esc).join(", ")}</p>`);
  if(v.diff.removed.length) parts.push(`<p class="text-xs mt-2">➖ Supprimées : ${v.diff.removed.map(esc).join(", ")}</p>`);
  if(v.diff.modified.length) parts.push(`<p class="text-xs mt-2">✏️ Modifiées : ${v.diff.modified.map(esc).join(", ")}</p>`);
  return parts.join("");
}
function refSynthesisExtras(ref, score){
  const nonCouvertes = score.views.filter(v=>v.level==="non_couvert");
  const competences = [...new Set(nonCouvertes.map(v=>v.process?v.process.name:null).filter(Boolean))];
  const indicateursRecommandes = [...new Set(nonCouvertes.filter(v=>v.process && !DB.indicators.some(i=>i.processId===v.process.id)).map(v=>v.process.name))];
  const auditsRecommandes = [...new Set(nonCouvertes.filter(v=>v.process && !DB.audits.some(a=>a.processId===v.process.id)).map(v=>v.process.name))];
  return `
  <div class="card mt-4">
    <h3 class="mb-2">🧠 Synthèse — ce que ce référentiel exige</h3>
    <p class="text-sm">${score.total} exigence(s) identifiée(s), dont <strong>${nonCouvertes.length}</strong> sans preuve actuellement disponible.</p>
    ${competences.length?`<p class="text-sm mt-2"><strong>Processus à mobiliser (compétences) :</strong> ${competences.map(esc).join(", ")}.</p>`:""}
    <p class="text-sm mt-2"><strong>Documents attendus :</strong> ${nonCouvertes.length} document(s) à créer ou renforcer pour couvrir les exigences non couvertes.</p>
    ${indicateursRecommandes.length?`<p class="text-sm mt-2"><strong>Indicateurs recommandés :</strong> sur ${indicateursRecommandes.map(esc).join(", ")} — aucun indicateur de suivi actuellement.</p>`:""}
    ${auditsRecommandes.length?`<p class="text-sm mt-2"><strong>Audits recommandés :</strong> sur ${auditsRecommandes.map(esc).join(", ")} — non encore audité(s).</p>`:""}
    <p class="text-sm mt-2"><strong>Revue de direction :</strong> ${nonCouvertes.length? "à intégrer à la prochaine revue de direction au vu du nombre d'exigences non couvertes." : "aucun point bloquant à remonter à ce stade."}</p>
    <p class="text-xs mt-4">Synthèse générée à partir des données réelles de Qonnect — jamais inventée.</p>
  </div>`;
}
function refTabVue(ref, score){
  const critiques = score.views.filter(v=>v.level==="non_couvert").slice(0,6);
  const actionsPrioritaires = [...new Map(score.views.flatMap(v=>v.bundle.actionsLate).map(a=>[a.id,a])).values()].slice(0,6);
  return `
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">⚠️ Risques réglementaires</h3>
      ${critiques.length? critiques.map(v=>`<div class="rel-link" data-route="referentiels/${ref.id}/exigences/${v.id}"><span class="rel-name">${esc(v.ref)} — ${esc(v.title)}</span>${badge(LABELS.exigenceCoverage[v.level])}</div>`).join("") : `<p class="text-sm">Aucune exigence critique non couverte.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">✅ Actions prioritaires</h3>
      ${actionsPrioritaires.length? actionsPrioritaires.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">${esc(a.title)}</span>${badge(LABELS.priority[a.priority])}</div>`).join("") : `<p class="text-sm">Aucune action en retard liée à ce référentiel.</p>`}
    </div>
  </div>
  <div class="card mt-4">
    <h3 class="mb-2">Dernières modifications</h3>
    ${ref.versions.length? ref.versions.slice().reverse().map(v=>`<div class="mb-2" style="border-bottom:1px solid var(--border);padding-bottom:8px;"><div class="rel-link" style="border:none;padding-bottom:0;"><span class="rel-name">Version ${esc(v.version)}</span><span class="text-sm">${fmtDate(v.date)}${v.note?" · "+esc(v.note):""}</span></div>${versionDiffHtml(v)}</div>`).join("") : `<p class="text-sm">Aucun historique.</p>`}
  </div>
  ${refSynthesisExtras(ref, score)}`;
}

function refTabExigences(ref, score){
  return dataTable(
    [ {label:"Exigence", render:v=>`<div class="cell-title">${esc(v.ref)} — ${esc(v.title)}</div>`},
      {label:"Niveau", render:v=>badge(LABELS.exigenceCoverage[v.level])},
      {label:"Preuves", render:v=>v.bundle.docs.length+" doc(s)"},
      {label:"Risques", render:v=>v.bundle.risksOpen.length},
      {label:"Actions", render:v=>v.bundle.actionsOpen.length+(v.bundle.actionsLate.length?" ("+v.bundle.actionsLate.length+" en retard)":"")},
      {label:"Responsable", render:v=>v.process?esc(v.process.pilot):"—"},
      {label:"Dernière MàJ", render:v=>v.updatedAt?fmtDate(v.updatedAt):"—"},
      {label:"", render:v=>`<button class="btn btn-secondary btn-sm" data-edit-exigence='${jsonAttr({refId:ref.id, exigenceId:v.id})}'>✏️</button>`} ],
    score.views, {rowRoute:v=>`referentiels/${ref.id}/exigences/${v.id}`}
  );
}

function refExigenceDetail(ref, v){
  const reasons = coverageReasons(v.bundle);
  const fournisseursConcernes = v.bundle.processes.length ? DB.fournisseurs.filter(f=>(f.processIds||[]).some(pid=>v.bundle.processes.some(p=>p.id===pid))) : [];
  return `
  ${breadcrumb([{label:"Référentiels",href:"#/referentiels"},{label:ref.name,href:"#/referentiels/"+ref.id},{label:v.ref}])}
  <div class="grid" style="grid-template-columns:2fr 1fr;gap:24px;">
    <div>
      <div class="card mb-2">
        <div class="flex justify-between items-center">${badge(LABELS.exigenceCoverage[v.level])}${badgeRaw("neutral", LABELS.exigenceType[v.type]||v.type)}</div>
        <h1 class="mt-2">${esc(v.ref)} — ${esc(v.title)}</h1>
        ${v.sourceText?`<p class="text-sm mt-4" style="color:var(--text-primary);line-height:1.7;">« ${esc(v.sourceText)} »</p>`:""}
      </div>
      <div class="card mb-2">
        <h3 class="mb-2">Pourquoi ce niveau ?</h3>
        <ul>${reasons.map(r=>`<li class="text-sm mt-2">${esc(r)}</li>`).join("")}</ul>
        <p class="text-xs mt-4">Calcul basé sur les preuves réellement enregistrées dans Qonnect — jamais déclaré sans preuve.</p>
      </div>
      ${fournisseursConcernes.length?`<div class="card mb-2">
        <h3 class="mb-2">Fournisseurs concernés</h3>
        <p class="text-xs mb-2">Prestataires externes rattachés aux processus couverts par cette exigence (ISO 9001 §8.4 — maîtrise des processus, produits et services fournis par des tiers).</p>
        ${fournisseursConcernes.map(f=>{const perf=fournisseurPerformanceScore(f.id); return `<div class="rel-link" data-route="fournisseurs/liste/${f.id}"><span class="rel-name">🏭 ${esc(f.nomCommercial)}</span>${badge(LABELS.fournisseurCriticite[f.criticite])}<span class="text-sm">${perf.score}/100</span></div>`;}).join("")}
      </div>`:""}
      <div class="card">
        <h3 class="mb-2">Analyse d'impact — si cette exigence évolue</h3>
        <p class="text-xs mb-2">En cas de modification de cette exigence (ou de sa source normative), Qonnect identifie automatiquement ce qui serait à revoir :</p>
        <div class="grid grid-4">
          <div class="kpi"><div class="val">${v.bundle.processes.length}</div><div class="lbl">Processus</div></div>
          <div class="kpi"><div class="val">${v.bundle.docs.length}</div><div class="lbl">Documents</div></div>
          <div class="kpi"><div class="val">${v.bundle.audits.length}</div><div class="lbl">Audits</div></div>
          <div class="kpi"><div class="val">${v.bundle.actionsOpen.length}</div><div class="lbl">Actions à ouvrir/suivre</div></div>
        </div>
      </div>
    </div>
    <div>
      <div class="card">
        <h3 class="mb-2">Éléments reliés</h3>
        ${v.bundle.processes.map(p=>`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.docs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.audits.map(a=>`<div class="rel-link" data-route="audits/${a.id}"><span class="rel-name">🔍 ${esc(a.title)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.risksOpen.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">⚠️ ${esc(r.name)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.actionsOpen.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">✅ ${esc(a.title)}</span><span class="chev">›</span></div>`).join("")}
        ${(!v.bundle.processes.length && !v.bundle.docs.length && !v.bundle.audits.length && !v.bundle.risksOpen.length && !v.bundle.actionsOpen.length)?`<p class="text-sm">Aucun élément relié pour le moment.</p>`:""}
      </div>
    </div>
  </div>`;
}

function refTabCartographie(ref, score){
  return score.views.map(v=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center"><h3 style="font-size:14.5px;">${esc(v.ref)} — ${esc(v.title)}</h3>${badge(LABELS.exigenceCoverage[v.level])}</div>
      <div class="grid grid-2 mt-2">
        <div>
          ${v.bundle.docs.length?`<div class="text-xs mb-2">DOCUMENTS</div>${v.bundle.docs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span></div>`).join("")}`:""}
          ${v.bundle.audits.length?`<div class="text-xs mb-2 mt-2">AUDITS</div>${v.bundle.audits.map(a=>`<div class="rel-link" data-route="audits/${a.id}"><span class="rel-name">🔍 ${esc(a.title)}</span></div>`).join("")}`:""}
        </div>
        <div>
          ${v.bundle.risksOpen.length?`<div class="text-xs mb-2">RISQUES</div>${v.bundle.risksOpen.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">⚠️ ${esc(r.name)}</span></div>`).join("")}`:""}
          ${v.bundle.actionsOpen.length?`<div class="text-xs mb-2 mt-2">ACTIONS</div>${v.bundle.actionsOpen.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">✅ ${esc(a.title)}</span></div>`).join("")}`:""}
        </div>
      </div>
      ${(!v.bundle.docs.length && !v.bundle.audits.length && !v.bundle.risksOpen.length && !v.bundle.actionsOpen.length)?`<p class="text-sm mt-2">Aucun élément relié.</p>`:""}
    </div>`).join("");
}

function refTabVersions(ref){
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-referentiel-import data-preset-ref="${ref.id}" data-preset-newversion="1">+ Nouvelle version</button></div>
  ${ref.versions.length? ref.versions.slice().reverse().map(v=>`<div class="card mb-2"><div class="flex justify-between items-center"><h3>Version ${esc(v.version)}</h3><span class="text-sm">${fmtDate(v.date)}</span></div>${v.note?`<p class="text-sm mt-2">${esc(v.note)}</p>`:""}${versionDiffHtml(v)}</div>`).join("") : `<div class="card">${emptyState("🕒","Aucune version","Aucun historique de version n'est disponible.")}</div>`}`;
}

function refTabAssistant(ref, score){
  if(!REF_AI_HISTORY[ref.id]) REF_AI_HISTORY[ref.id] = [{role:"bot", text:"Bonjour, je suis l'assistant spécialisé "+esc(ref.name)+". Je peux résumer ce référentiel, identifier les preuves attendues, préparer un audit ou expliquer un niveau de conformité — toujours à partir de vos données réelles."}];
  const suggestions = ["Résume ce référentiel","Quelles exigences ne sont pas couvertes ?","Prépare un audit sur ce référentiel","Pourquoi une exigence peut être non conforme ?"];
  return `
  <div class="card" style="padding:0;">
    <div class="ai-shell" style="padding:20px;height:auto;max-height:560px;">
      <div class="ai-messages" id="ref-ai-messages">${REF_AI_HISTORY[ref.id].map(aiMsgHtml).join("")}</div>
      <div class="ai-suggestions">${suggestions.map(s=>`<button class="chip" data-ref-ai-suggest="${esc(s)}" data-ref-id="${ref.id}">${esc(s)}</button>`).join("")}</div>
      <div class="ai-input-row"><input type="text" id="ref-ai-input" placeholder="Posez une question sur ${esc(ref.name)}…"><button class="btn btn-primary" id="ref-ai-send" data-ref-id="${ref.id}">Envoyer</button></div>
    </div>
  </div>`;
}
function refAiSend(refId, text){
  text = (text||"").trim();
  if(!text) return;
  const ref = getReferentiel(refId);
  const score = referentielScore(refId);
  if(!REF_AI_HISTORY[refId]) REF_AI_HISTORY[refId] = [];
  REF_AI_HISTORY[refId].push({role:"user", text:esc(text)});
  REF_AI_HISTORY[refId].push({role:"bot", text:refAIGenerateReply(ref, score, text)});
  const zone = document.getElementById("ref-ai-messages");
  if(zone){ zone.innerHTML = REF_AI_HISTORY[refId].map(aiMsgHtml).join(""); zone.scrollTop = zone.scrollHeight; }
}

function pageConformite(tab){
  const active = DB.referentiels.find(r=>r.active);
  if(!active) return emptyState("🛡️","Aucun référentiel actif","Sélectionnez un référentiel dans le module Référentiels.", `<button class="btn btn-primary" data-route="referentiels">Aller aux référentiels</button>`);
  return pageReferentielDetail(active.id, tab||"vue");
}

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

/* ============================================================
   16. QONNECT AI (simulée)
   ============================================================ */
let AI_HISTORY = [
  {role:"bot", text:"Bonjour, je suis Qonnect AI. Je peux vous aider à piloter votre système de management à partir de vos données. Que souhaitez-vous savoir ?"}
];
const AI_SUGGESTIONS = [
  "Quels sont mes principaux risques ?",
  "Prépare mon audit Achats.",
  "Quelles procédures doivent être révisées ?",
  "Que dois-je traiter aujourd'hui ?",
  "Prépare ma revue de direction.",
];

function pageAI(){
  return `
  ${pageHeader("Qonnect AI","Posez une question sur votre système de management — les réponses s'appuient sur vos données locales.")}
  <div class="card" style="padding:0;">
    <div class="ai-shell" style="padding:20px;">
      <div class="ai-messages" id="ai-messages">
        ${AI_HISTORY.map(aiMsgHtml).join("")}
      </div>
      <div class="ai-suggestions">
        ${AI_SUGGESTIONS.map(s=>`<button class="chip" data-ai-suggest="${esc(s)}">${esc(s)}</button>`).join("")}
      </div>
      <div class="ai-input-row">
        <input type="text" id="ai-input" placeholder="Écrivez votre question…" autocomplete="off">
        <button class="btn btn-primary" id="ai-send">Envoyer</button>
      </div>
    </div>
  </div>`;
}
function aiMsgHtml(m){
  return `<div class="ai-msg ${m.role==='user'?'user':'bot'}">
    <div class="ai-avatar">${m.role==='user'?'🙂':'🤖'}</div>
    <div class="ai-bubble">${m.text}</div>
  </div>`;
}
function aiScrollBottom(){
  const el = document.getElementById("ai-messages");
  if(el) el.scrollTop = el.scrollHeight;
}
function aiSend(text){
  text = text.trim();
  if(!text) return;
  AI_HISTORY.push({role:"user", text:esc(text)});
  const reply = aiGenerateReply(text);
  AI_HISTORY.push({role:"bot", text:reply});
  const zone = document.getElementById("ai-messages");
  if(zone){
    zone.innerHTML = AI_HISTORY.map(aiMsgHtml).join("");
    aiScrollBottom();
  }
}
function aiGenerateReply(q){
  const low = q.toLowerCase();
  if(low.includes("risque")){
    const top = DB.risks.filter(r=>r.type==="risque" && r.status==="ouvert").sort((a,b)=>(b.probability*b.impact)-(a.probability*a.impact)).slice(0,3);
    return `Voici vos principaux risques ouverts, triés par criticité :<ul>${top.map(r=>{const p=getProcess(r.processId);return `<li><strong>${esc(r.name)}</strong> (${LABELS.riskLevel[r.level].l}) — processus ${p?esc(p.name):"—"}</li>`;}).join("")}</ul>Je vous recommande de prioriser le risque le plus critique et de vérifier que des actions sont en place.`;
  }
  if(low.includes("audit") && low.includes("achat")){
    const a = DB.audits.find(a=>a.processId==="PROC-007");
    const risks = DB.risks.filter(r=>r.processId==="PROC-007");
    const nc = DB.events.filter(e=>e.processId==="PROC-007" && e.type==="non_conformite");
    return `Voici les éléments à considérer pour préparer l'audit Achats${a?` du ${fmtDate(a.date)}`:""} :<ul>
      <li>${risks.length} risque(s) sur ce processus, dont ${risks.filter(r=>r.level==='critique').length} critique(s)</li>
      <li>${nc.length} non-conformité(s) récente(s) à examiner</li>
      <li>Procédure de référence : PR-005 — Gestion des achats et évaluation fournisseurs</li>
    </ul>Souhaitez-vous que j'ouvre la fiche du processus Achats ?`;
  }
  if(low.includes("procédure") && (low.includes("révis")||low.includes("reviser")||low.includes("revoir"))){
    const docs = DB.documents.filter(d=>d.status==="a_reviser");
    return docs.length ? `Ces documents doivent être révisés prochainement :<ul>${docs.map(d=>`<li><strong>${esc(d.title)}</strong> (${esc(d.ref)}) — révision prévue le ${fmtDate(d.nextReview)}</li>`).join("")}</ul>` : `Aucun document n'est actuellement en attente de révision. 👍`;
  }
  if(low.includes("aujourd") || low.includes("traiter")){
    const retard = DB.actions.filter(a=>a.status==="retard");
    const nc = DB.events.filter(e=>e.type==="non_conformite" && e.status==="ouvert");
    return `Voici ce qui mérite votre attention aujourd'hui :<ul>
      <li>${retard.length} action(s) en retard</li>
      <li>${nc.length} non-conformité(s) ouverte(s)</li>
      <li>${DB.audits.filter(a=>a.status==='planifie').length} audit(s) à préparer</li>
    </ul>Je vous conseille de commencer par les actions en retard.`;
  }
  if(low.includes("revue de direction")){
    const nc = DB.events.filter(e=>e.type==="non_conformite");
    const obj = DB.objectives;
    return `Éléments suggérés pour votre revue de direction :<ul>
      <li>${nc.length} non-conformité(s) sur la période, dont ${nc.filter(e=>e.status==='ouvert').length} ouverte(s)</li>
      <li>${obj.filter(o=>o.status==='atteint').length}/${obj.length} objectifs atteints</li>
      <li>${DB.audits.filter(a=>a.status!=='planifie').length} audit(s) réalisé(s)</li>
      <li>${DB.risks.filter(r=>r.level==='critique'&&r.status==='ouvert').length} risque(s) critique(s) ouvert(s)</li>
    </ul>Je peux vous aider à structurer le compte-rendu si vous le souhaitez.`;
  }
  return `Je n'ai pas encore de réponse préparée pour cette question dans ce prototype, mais je peux vous renseigner sur vos risques, vos audits, vos documents à réviser, vos actions du jour ou votre revue de direction.`;
}

/* ============================================================
   17. ADMINISTRATION
   ============================================================ */
function pageAdmin(){
  return `
  ${pageHeader("Administration","Paramètres du prototype Qonnect.")}
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Organisation</h3>
      <p class="text-sm">Nom : Acme Industries</p>
      <p class="text-sm mt-2">Référentiel actif : ${DB.referentiels.find(r=>r.active)?.name || "—"}</p>
      <p class="text-sm mt-2">Utilisateurs : 12 (démonstration)</p>
    </div>
    <div class="card">
      <h3 class="mb-2">Données du prototype</h3>
      <p class="text-sm mb-2">Toutes les données sont stockées localement dans votre navigateur (localStorage). Aucune donnée n'est envoyée à un serveur.</p>
      <button class="btn btn-danger" id="reset-data-btn">Réinitialiser les données de démonstration</button>
    </div>
  </div>`;
}

/* ============================================================
   18. RECHERCHE GLOBALE
   ============================================================ */
function globalSearch(q){
  q = q.trim().toLowerCase();
  if(!q) return {};
  const res = {};
  res["Processus"] = DB.processes.filter(p=>p.name.toLowerCase().includes(q)).map(p=>({label:p.name, route:`processus/${p.id}`}));
  res["Documents"] = DB.documents.filter(d=>d.title.toLowerCase().includes(q)||d.ref.toLowerCase().includes(q)).map(d=>({label:d.title, route:`documents/${d.type}/${d.id}`}));
  res["Risques"] = DB.risks.filter(r=>r.name.toLowerCase().includes(q)).map(r=>({label:r.name, route:`risques/${r.id}`}));
  res["Événements"] = DB.events.filter(e=>e.title.toLowerCase().includes(q)||e.ref.toLowerCase().includes(q)).map(e=>({label:e.title, route:`evenements/${e.type}/${e.id}`}));
  res["Actions"] = DB.actions.filter(a=>a.title.toLowerCase().includes(q)).map(a=>({label:a.title, route:`actions`}));
  res["Audits"] = DB.audits.filter(a=>a.title.toLowerCase().includes(q)).map(a=>({label:a.title, route:`audits/${a.id}`}));
  res["Indicateurs"] = DB.indicators.filter(i=>i.name.toLowerCase().includes(q)).map(i=>({label:i.name, route:`objectifs`}));
  Object.keys(res).forEach(k=>{ if(!res[k].length) delete res[k]; });
  return res;
}
function renderSearchResults(q){
  const box = document.getElementById("search-results");
  if(!q.trim()){ box.classList.remove("open"); box.innerHTML=""; return; }
  const groups = globalSearch(q);
  const keys = Object.keys(groups);
  if(!keys.length){
    box.innerHTML = `<div class="search-empty">Aucun résultat pour « ${esc(q)} »</div>`;
  } else {
    box.innerHTML = keys.map(k=>`
      <div class="search-cat">${esc(k)}</div>
      ${groups[k].slice(0,5).map(r=>`<div class="search-row" data-route="${r.route}" data-close-search><span class="n">${esc(r.label)}</span></div>`).join("")}
    `).join("");
  }
  box.classList.add("open");
}

/* ============================================================
   19. FORMULAIRES MODAUX (actions rapides)
   ============================================================ */
function openQuickForm(kind, presets, triggerEl){
  presets = presets || {};
  const processOptions = DB.processes.map(p=>`<option value="${p.id}" ${presets.processId===p.id?"selected":""}>${esc(p.name)}</option>`).join("");

  if(kind==="event"){
    openModal({title:"Déclarer un événement", wide:false,
      bodyHtml:`
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Pièce non conforme détectée"></div>
        <div class="field"><label>Type <span class="req">*</span></label>
          <select id="qf-type">
            <option value="non_conformite">Non-conformité</option><option value="incident">Incident</option>
            <option value="reclamation">Réclamation</option><option value="anomalie">Anomalie</option>
            <option value="suggestion">Suggestion</option><option value="amelioration">Amélioration</option>
          </select></div>
        <div class="field-row">
          <div class="field"><label>Processus concerné</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
          <div class="field"><label>Priorité</label><select id="qf-priority"><option value="moyenne">Moyenne</option><option value="haute">Haute</option><option value="critique">Critique</option><option value="basse">Basse</option></select></div>
        </div>
        <div class="field"><label>Description</label><textarea id="qf-desc" placeholder="Décrivez ce qui s'est passé…"></textarea></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Déclarer l'événement</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un titre","⚠️"); return; }
        const type = o.querySelector("#qf-type").value;
        const id = nextId("EVT", DB.events);
        const prefixMap = {non_conformite:"NC",incident:"INC",reclamation:"REC",anomalie:"ANO",suggestion:"SUG",amelioration:"AME"};
        const ref = `${prefixMap[type]}-2026-${String(DB.events.length+10).padStart(3,"0")}`;
        DB.events.push({ id, ref, type, title, processId:o.querySelector("#qf-process").value||null,
          priority:o.querySelector("#qf-priority").value, status:"ouvert", declaredBy:"Vous", date:new Date().toISOString().slice(0,10), step:0,
          description:o.querySelector("#qf-desc").value.trim()||"—" });
        saveDB(); closeModal(); toast("Événement déclaré avec succès");
        navigate(`evenements/${type}/${id}`);
      });}
    });
  }

  else if(kind==="action"){
    openModal({title:"Créer une action",
      bodyHtml:`
        <div class="field"><label>Intitulé <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Vérifier l'étalonnage de la sonde"></div>
        <div class="field-row">
          <div class="field"><label>Responsable</label><input type="text" id="qf-owner" placeholder="Nom du responsable"></div>
          <div class="field"><label>Échéance</label><input type="date" id="qf-due"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Priorité</label><select id="qf-priority"><option value="moyenne">Moyenne</option><option value="haute">Haute</option><option value="critique">Critique</option><option value="basse">Basse</option></select></div>
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
        </div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Créer l'action</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un intitulé","⚠️"); return; }
        const id = nextId("ACT", DB.actions);
        DB.actions.push({ id, title, owner:o.querySelector("#qf-owner").value.trim()||"Non assigné",
          due:o.querySelector("#qf-due").value || new Date().toISOString().slice(0,10),
          priority:o.querySelector("#qf-priority").value, status:"a_faire",
          origin:presets.originType||"objectif", originId:presets.originId||null, processId:o.querySelector("#qf-process").value||presets.processId||null });
        saveDB(); closeModal(); toast("Action créée avec succès"); render();
      });}
    });
  }

  else if(kind==="risk"){
    openModal({title:"Identifier un risque",
      bodyHtml:`
        <div class="field"><label>Nom du risque <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Dépendance à un fournisseur unique"></div>
        <div class="field-row">
          <div class="field"><label>Type</label><select id="qf-type"><option value="risque">Risque</option><option value="opportunite">Opportunité</option></select></div>
          <div class="field"><label>Niveau</label><select id="qf-level"><option value="faible">Faible</option><option value="eleve">Élevé</option><option value="critique">Critique</option></select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
          <div class="field"><label>Responsable</label><input type="text" id="qf-owner" placeholder="Nom du responsable"></div>
        </div>
        <div class="field"><label>Description</label><textarea id="qf-desc"></textarea></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Enregistrer</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un nom","⚠️"); return; }
        const isOpp = o.querySelector("#qf-type").value==="opportunite";
        const id = nextId(isOpp?"OPP":"RISK", DB.risks);
        DB.risks.push({ id, name:title, level:isOpp?"opportunite":o.querySelector("#qf-level").value,
          processId:o.querySelector("#qf-process").value||presets.processId||null, owner:o.querySelector("#qf-owner").value.trim()||"Non assigné",
          status:"ouvert", type:isOpp?"opportunite":"risque", description:o.querySelector("#qf-desc").value.trim()||"—", probability:3, impact:3 });
        saveDB(); closeModal(); toast("Risque enregistré avec succès"); navigate(`risques/${id}`);
      });}
    });
  }

  else if(kind==="document"){
    openDocumentWizard(presets);
  }

  else if(kind==="objective"){
    openModal({title:"Créer un objectif",
      bodyHtml:`
        <div class="field"><label>Intitulé <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Réduire les délais de traitement"></div>
        <div class="field-row">
          <div class="field"><label>Cible</label><input type="text" id="qf-target" placeholder="Ex : -10 %"></div>
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
        </div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Créer l'objectif</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un intitulé","⚠️"); return; }
        const id = nextId("OBJ", DB.objectives);
        DB.objectives.push({ id, title, target:o.querySelector("#qf-target").value.trim()||"—", progress:0, status:"en_cours",
          processId:o.querySelector("#qf-process").value||null, indicatorIds:[] });
        saveDB(); closeModal(); toast("Objectif créé avec succès"); navigate("objectifs");
      });}
    });
  }

  else if(kind==="audit"){
    openAuditWizard(presets);
  }

  else if(kind==="finding"){
    openConstatForm(presets.auditId, null);
  }

  else if(kind==="change"){
    openModal({title:"Déclarer un changement",
      bodyHtml:`
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Changement de fournisseur"></div>
        <div class="field-row">
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
          <div class="field"><label>Demandeur</label><input type="text" id="qf-owner" placeholder="Votre nom"></div>
        </div>
        <div class="field"><label>Description</label><textarea id="qf-desc"></textarea></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Déclarer</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un titre","⚠️"); return; }
        const id = nextId("CHG", DB.changes);
        DB.changes.push({ id, title, processId:o.querySelector("#qf-process").value||presets.processId||null, requestedBy:o.querySelector("#qf-owner").value.trim()||"Vous",
          date:new Date().toISOString().slice(0,10), step:0, impacted:{processes:[],documents:[],risks:[],indicators:[],skills:[]}, description:o.querySelector("#qf-desc").value.trim()||"—" });
        saveDB(); closeModal(); toast("Changement déclaré avec succès"); navigate(`changements/${id}`);
      });}
    });
  }
}

/* ============================================================
   19bis-doc. ASSISTANT DE CRÉATION DOCUMENTAIRE (formulaire progressif)
   ============================================================ */
const DOC_WIZARD_TYPES = [
  {v:"politique",l:"Politique",icon:"📜"}, {v:"charte",l:"Charte",icon:"📗"}, {v:"manuel",l:"Manuel",icon:"📘"},
  {v:"processus",l:"Processus",icon:"🧩"}, {v:"procedure",l:"Procédure",icon:"📄"}, {v:"mode_operatoire",l:"Mode opératoire",icon:"🛠️"},
  {v:"instruction",l:"Instruction",icon:"📋"}, {v:"formulaire",l:"Formulaire",icon:"🧾"}, {v:"enregistrement",l:"Enregistrement",icon:"🗂️"},
  {v:"modele",l:"Modèle",icon:"📐"}, {v:"guide",l:"Guide",icon:"📖"}, {v:"referentiel_interne",l:"Référentiel interne",icon:"📚"},
];
const DOC_WIZARD_REFERENTIELS = ["ISO 9001","ISO 13485","ISO 27001","ISO 14971","RGPD","Référentiel interne"];
const DOC_STANDARD_SECTIONS = ["Objet","Domaine d'application","Définitions","Responsabilités","Description du processus","Enregistrements associés","Risques associés","Indicateurs associés","Références normatives","Historique des versions"];

function openDocumentWizard(presets){
  presets = presets || {};
  const state = { step:1, type:null, processId:presets.processId||"", referentiels:[], templateId:null, title:"" };
  if(presets.templateId){
    const tpl = getTemplate(presets.templateId);
    if(tpl){ state.type = tpl.forType; state.templateId = tpl.id; state.title = tpl.title; state.referentiels = [tpl.referentiel]; state.step = 2; }
  }
  const stepTitles = ["Type de document","Processus concerné","Référentiels associés","Structure & récapitulatif"];
  const processOptions = ()=> DB.processes.map(p=>`<option value="${p.id}" ${state.processId===p.id?"selected":""}>${esc(p.name)}</option>`).join("");

  function stepBody(){
    const progress = `<div class="stepper-progress">${[1,2,3,4].map(i=>`<div class="${i<=state.step?'done':''}"></div>`).join("")}</div>
      <div class="step-title">Étape ${state.step}/4 — ${esc(stepTitles[state.step-1])}</div>`;
    if(state.step===1){
      return progress + `<div class="grid grid-3">${DOC_WIZARD_TYPES.map(t=>`
        <div class="card card-hover" style="text-align:center;padding:16px;${state.type===t.v?'border-color:var(--primary);background:var(--primary-soft);':''}" data-wiz-pick-type="${t.v}">
          <div style="font-size:22px;">${t.icon}</div><div class="text-sm mt-2" style="font-weight:600;">${esc(t.l)}</div>
        </div>`).join("")}</div>`;
    }
    if(state.step===2){
      return progress + `<div class="field"><label>Processus concerné</label><select id="wiz-process"><option value="">—</option>${processOptions()}</select></div>
        <p class="text-sm">Qonnect reliera automatiquement ce document aux risques, indicateurs et exigences déjà associés à ce processus.</p>`;
    }
    if(state.step===3){
      return progress + `<div class="field"><label>Référentiels associés (plusieurs choix possibles)</label>
        ${DOC_WIZARD_REFERENTIELS.map(r=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="wiz-ref-cb" value="${esc(r)}" ${state.referentiels.includes(r)?"checked":""} style="width:auto;"> ${esc(r)}</label>`).join("")}
      </div>`;
    }
    const templates = DB.documentTemplates.filter(t=>t.forType===state.type && (state.referentiels.length===0 || state.referentiels.includes(t.referentiel)));
    const reqSuggested = state.processId ? DB.requirements.filter(r=>r.processId===state.processId) : [];
    return progress + `
      <div class="field"><label>Titre du document <span class="req">*</span></label><input type="text" id="wiz-title" value="${esc(state.title)}" placeholder="Ex : Gestion des non-conformités"></div>
      ${templates.length?`<div class="field"><label>Modèle de la bibliothèque (optionnel — génère automatiquement la structure)</label>
        <div class="grid grid-2">${templates.map(t=>`<div class="card card-hover" style="padding:12px;${state.templateId===t.id?'border-color:var(--primary);background:var(--primary-soft);':''}" data-wiz-pick-template="${t.id}">
          <div class="text-sm" style="font-weight:600;">${esc(t.title)}</div><div class="text-xs mt-2">${esc(t.referentiel)} · ${t.sections.length} sections</div>
        </div>`).join("")}</div></div>`:`<p class="text-sm">Aucun modèle disponible pour ce type — une structure standard sera générée automatiquement.</p>`}
      ${reqSuggested.length?`<p class="text-xs mt-2">🔗 ${reqSuggested.length} exigence(s) du processus seront automatiquement associées : ${reqSuggested.map(r=>esc(r.ref)).join(", ")}.</p>`:""}
    `;
  }
  function stepFoot(){
    return `
      ${state.step>1?`<button class="btn btn-secondary" id="wiz-prev">← Précédent</button>`:`<button class="btn btn-secondary" data-close-modal>Annuler</button>`}
      ${state.step<4?`<button class="btn btn-primary" id="wiz-next">Suivant →</button>`:`<button class="btn btn-primary" id="wiz-finish">Créer le document</button>`}
    `;
  }
  function refresh(o){
    o.querySelector(".modal-body").innerHTML = stepBody();
    o.querySelector(".modal-foot").innerHTML = stepFoot();
    mount(o);
  }
  function mount(o){
    if(state.step===1){
      o.querySelectorAll("[data-wiz-pick-type]").forEach(el=>el.addEventListener("click", ()=>{ state.type = el.getAttribute("data-wiz-pick-type"); refresh(o); }));
    }
    if(state.step===4){
      o.querySelectorAll("[data-wiz-pick-template]").forEach(el=>el.addEventListener("click", ()=>{
        state.templateId = el.getAttribute("data-wiz-pick-template");
        const tpl = getTemplate(state.templateId); if(tpl && !state.title) state.title = tpl.title;
        refresh(o);
      }));
      const titleInput = o.querySelector("#wiz-title"); if(titleInput) titleInput.addEventListener("input", e=> state.title = e.target.value);
    }
    const prevBtn = o.querySelector("#wiz-prev"); if(prevBtn) prevBtn.addEventListener("click", ()=>{ state.step--; refresh(o); });
    const nextBtn = o.querySelector("#wiz-next"); if(nextBtn) nextBtn.addEventListener("click", ()=>{
      if(state.step===1 && !state.type){ toast("Choisissez un type de document","⚠️"); return; }
      if(state.step===2){ state.processId = o.querySelector("#wiz-process").value; }
      if(state.step===3){ state.referentiels = [...o.querySelectorAll(".wiz-ref-cb:checked")].map(c=>c.value); }
      state.step++; refresh(o);
    });
    const finishBtn = o.querySelector("#wiz-finish"); if(finishBtn) finishBtn.addEventListener("click", ()=>{
      const title = (o.querySelector("#wiz-title")?.value || state.title).trim();
      if(!title){ toast("Merci de saisir un titre","⚠️"); return; }
      const tpl = state.templateId ? getTemplate(state.templateId) : null;
      const sections = tpl ? tpl.sections : (["procedure","mode_operatoire","instruction"].includes(state.type) ? DOC_STANDARD_SECTIONS : null);
      const body = sections ? sections.map(s=>s+"\n—").join("\n\n") : "Rédigez le contenu du document…";
      const id = nextId("DOC", DB.documents);
      const ref = (state.type||"doc").slice(0,3).toUpperCase()+"-"+String(DB.documents.length+20).padStart(3,"0");
      const reqSuggested = state.processId ? DB.requirements.filter(r=>r.processId===state.processId).map(r=>r.id) : [];
      DB.documents.push({ id, ref, title, type:state.type, version:"1.0", status:"brouillon", processId:state.processId||null,
        author:"Vous", approver:"—", date:new Date().toISOString().slice(0,10), nextReview:"—", body,
        requirementIds:reqSuggested, riskIds:[], auditIds:[], indicatorIds:[], actionIds:[], crossDocIds:[], flowSteps:[],
        referentiels: state.referentiels.length ? state.referentiels : ["ISO 9001"] });
      saveDB(); closeModal(); toast("Document créé — structure générée automatiquement");
      navigate(`documents/${state.type}/${id}`);
    });
  }

  openModal({title:"Nouveau document", wide:true, bodyHtml:stepBody(), footHtml:stepFoot(), onMount:mount});
}

function openTrainingForm(documentId){
  const d = getDocument(documentId);
  const p = d.processId ? getProcess(d.processId) : null;
  const suggested = p ? [p.pilot] : [];
  openModal({title:"Lancer une campagne de lecture",
    bodyHtml:`
      <p class="text-sm mb-2">Document : <strong>${esc(d.title)}</strong></p>
      <div class="field"><label>Personnes concernées (une par ligne)</label><textarea id="qf-audience" placeholder="Nom de chaque personne concernée">${suggested.join("\n")}</textarea></div>
      <div class="field"><label>Échéance</label><input type="date" id="qf-due"></div>
      <div class="field"><label><input type="checkbox" id="qf-quiz" style="width:auto;margin-right:6px;">Associer un quiz de validation</label></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Lancer la campagne</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const audience = o.querySelector("#qf-audience").value.split("\n").map(s=>s.trim()).filter(Boolean);
      if(!audience.length){ toast("Ajoutez au moins une personne concernée","⚠️"); return; }
      const id = "TRN-"+String(Date.now()).slice(-6);
      DB.trainings.push({ id, documentId, title:"Prise de connaissance — "+d.title+" v"+d.version, audience, completedBy:[], quiz:o.querySelector("#qf-quiz").checked, dueDate:o.querySelector("#qf-due").value||"—" });
      saveDB(); closeModal(); toast("Campagne de lecture lancée"); render();
    });}
  });
}

/* ============================================================
   19bis-audit. ASSISTANT DE CRÉATION D'AUDIT & FORMULAIRES
   ============================================================ */
const AUDIT_TYPE_OBJECTIVES = {
  interne: ["Vérifier la conformité au référentiel","Vérifier l'application des procédures"],
  fournisseur: ["Évaluer la performance du fournisseur","Vérifier la maîtrise des risques fournisseur"],
  certification: ["Vérifier la conformité en vue de la certification"],
  suivi: ["Vérifier l'efficacité des actions correctives précédentes"],
  cible: ["Vérifier la maîtrise d'un risque ou d'un point spécifique"],
  processus: ["Évaluer l'efficacité du processus"],
};
function openAuditWizard(presets){
  presets = presets || {};
  const state = {
    step:1, title:"", type:"interne", referentielIds: DB.referentiels.filter(r=>r.active).map(r=>r.id),
    date:"", duration:"1 jour", responsable:"", auditeurs:"", site:"",
    processIds: presets.processId ? [presets.processId] : [],
    motifs:[], activites:"", produits:"", periodeDebut:"", periodeFin:"", exclusions:"",
    objectifs:[], requirementIds:[], documentIds:[], questions:[],
  };
  const stepper = ()=>`<div class="stepper-progress">${[1,2,3,4,5,6].map(i=>`<div class="${i<=state.step?'done':''}"></div>`).join("")}</div>`;
  const processCbs = ()=> DB.processes.map(p=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="wiz-process-cb" value="${p.id}" ${state.processIds.includes(p.id)?"checked":""} style="width:auto;"> ${esc(p.name)}</label>`).join("");
  const refCbs = ()=> DB.referentiels.map(r=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="wiz-ref-cb" value="${r.id}" ${state.referentielIds.includes(r.id)?"checked":""} style="width:auto;"> ${esc(r.name)}</label>`).join("");

  function step1Html(){ return stepper()+`
    <div class="step-title">Étape 1/6 — Identification</div>
    <div class="field"><label>Nom de l'audit <span class="req">*</span></label><input type="text" id="wiz-title" value="${esc(state.title)}" placeholder="Ex : Audit interne Production"></div>
    <div class="field-row">
      <div class="field"><label>Type d'audit</label><select id="wiz-type">${Object.entries(LABELS.auditType).map(([v,l])=>`<option value="${v}" ${state.type===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
      <div class="field"><label>Site / établissement</label><input type="text" id="wiz-site" value="${esc(state.site)}" placeholder="Ex : Siège"></div>
    </div>
    <div class="field"><label>Référentiel(s)</label>${refCbs()}</div>
    <div class="field-row">
      <div class="field"><label>Date prévue</label><input type="date" id="wiz-date" value="${state.date}"></div>
      <div class="field"><label>Durée</label><input type="text" id="wiz-duration" value="${esc(state.duration)}" placeholder="Ex : 1 jour"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Responsable d'audit</label><input type="text" id="wiz-responsable" value="${esc(state.responsable)}"></div>
      <div class="field"><label>Auditeur(s) (séparés par une virgule)</label><input type="text" id="wiz-auditeurs" value="${esc(state.auditeurs)}"></div>
    </div>
    <div class="field"><label>Processus concerné(s)</label>${processCbs()}</div>`;
  }
  function step2Html(){ return stepper()+`
    <div class="step-title">Étape 2/6 — Pourquoi cet audit est-il réalisé ?</div>
    <div class="field">${Object.entries(LABELS.auditMotif).map(([v,l])=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="wiz-motif-cb" value="${v}" ${state.motifs.includes(v)?"checked":""} style="width:auto;"> ${esc(l)}</label>`).join("")}</div>`;
  }
  function step3Html(){ return stepper()+`
    <div class="step-title">Étape 3/6 — Périmètre</div>
    <div class="field"><label>Processus (confirmés)</label>${processCbs()}</div>
    <div class="field"><label>Activités</label><input type="text" id="wiz-activites" value="${esc(state.activites)}" placeholder="Ex : Sélection et évaluation des fournisseurs"></div>
    <div class="field"><label>Produits / services (optionnel)</label><input type="text" id="wiz-produits" value="${esc(state.produits)}"></div>
    <div class="field-row">
      <div class="field"><label>Période auditée — début</label><input type="date" id="wiz-periode-debut" value="${state.periodeDebut}"></div>
      <div class="field"><label>Période auditée — fin</label><input type="date" id="wiz-periode-fin" value="${state.periodeFin}"></div>
    </div>
    <div class="field"><label>Exclusions</label><textarea id="wiz-exclusions" placeholder="Ce qui est explicitement hors périmètre">${esc(state.exclusions)}</textarea></div>
    <div class="card" style="background:var(--background);">
      <p class="text-xs" style="font-weight:700;">PÉRIMÈTRE DE L'AUDIT</p>
      <p class="text-sm mt-2">Processus : ${state.processIds.map(id=>{const p=getProcess(id);return p?p.name:id;}).join(", ")||"—"}</p>
      <p class="text-sm mt-2">Site : ${esc(state.site)||"—"}</p>
    </div>`;
  }
  function step4Html(){
    const suggestions = AUDIT_TYPE_OBJECTIVES[state.type] || ["Vérifier la conformité au référentiel","Évaluer l'efficacité du processus","Identifier des opportunités d'amélioration"];
    return stepper()+`
    <div class="step-title">Étape 4/6 — Objectifs</div>
    <div class="quick-actions mb-2">${suggestions.map(s=>`<button class="chip" data-wiz-add-objectif="${esc(s)}">+ ${esc(s)}</button>`).join("")}</div>
    <div id="wiz-objectifs-list">${state.objectifs.map((o,i)=>`<div class="rel-link"><span class="rel-name">${esc(o)}</span><button class="btn btn-ghost btn-sm" data-wiz-remove-objectif="${i}">✕</button></div>`).join("")}</div>
    <div class="field-row mt-2">
      <div class="field" style="flex:1;"><input type="text" id="wiz-objectif-input" placeholder="Ajouter un objectif personnalisé"></div>
      <button class="btn btn-secondary" id="wiz-add-custom-objectif" style="height:40px;">+ Ajouter</button>
    </div>`;
  }
  function step5Html(){
    const relevantViews = state.processIds.length ? (state.referentielIds.length?state.referentielIds:["ISO9001"]).flatMap(refId=>getReferentielExigenceViews(refId).filter(v=>v.process && state.processIds.includes(v.process.id))) : [];
    const relevantDocs = state.processIds.length ? DB.documents.filter(d=>d.status!=="obsolete" && state.processIds.includes(d.processId)) : [];
    return stepper()+`
    <div class="step-title">Étape 5/6 — Critères d'audit</div>
    <p class="text-sm mb-2">Qonnect propose les exigences pertinentes selon le périmètre sélectionné.</p>
    <div class="field" style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
      ${relevantViews.length?relevantViews.map(v=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="wiz-req-cb" value="${v.id}" ${state.requirementIds.includes(v.id)?"checked":""} style="width:auto;"> ${esc(v.ref)} — ${esc(v.title)} ${badge(LABELS.exigenceCoverage[v.level])}</label>`).join(""):`<p class="text-sm">Sélectionnez un processus et un référentiel pour voir les exigences suggérées.</p>`}
    </div>
    <div class="field mt-4"><label>Documents applicables</label>
      <div style="max-height:150px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
        ${relevantDocs.length?relevantDocs.map(d=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="wiz-doc-cb" value="${d.id}" ${state.documentIds.includes(d.id)?"checked":""} style="width:auto;"> ${esc(d.title)}</label>`).join(""):`<p class="text-sm">Aucun document disponible pour ce périmètre.</p>`}
      </div>
    </div>`;
  }
  function step6Html(){
    const questionsList = state.questions.length ? `<p class="text-sm mb-2">${state.questions.length} question(s) proposée(s) — modifiables après création de l'audit.</p>`+state.questions.map(q=>`<div class="rel-link"><span class="rel-name">${esc(q.question)}</span></div>`).join("") : "";
    return stepper()+`
    <div class="step-title">Étape 6/6 — Plan d'audit & récapitulatif</div>
    <div class="card" style="background:var(--background);margin-bottom:16px;">
      <p class="text-sm"><strong>${esc(state.title||"(sans titre)")}</strong> — ${esc(LABELS.auditType[state.type])}</p>
      <p class="text-xs mt-2">Processus : ${state.processIds.map(id=>{const p=getProcess(id);return p?p.name:id;}).join(", ")||"—"} · Date : ${state.date?fmtDate(state.date):"—"}</p>
      <p class="text-xs mt-2">${state.requirementIds.length} exigence(s) retenue(s) comme critères d'audit</p>
    </div>
    ${state.questions.length?"":`<button class="btn btn-primary" id="wiz-generate-plan">🧠 Générer le plan d'audit</button>`}
    <div id="wiz-questions-preview">${questionsList}</div>`;
  }
  function bodyForStep(){ return state.step===1?step1Html():state.step===2?step2Html():state.step===3?step3Html():state.step===4?step4Html():state.step===5?step5Html():step6Html(); }
  function stepFoot(){ return `
    ${state.step>1?`<button class="btn btn-secondary" id="wiz-prev">← Précédent</button>`:`<button class="btn btn-secondary" data-close-modal>Annuler</button>`}
    ${state.step<6?`<button class="btn btn-primary" id="wiz-next">Suivant →</button>`:`<button class="btn btn-primary" id="wiz-finish">Créer l'audit</button>`}
  `; }
  function captureStepValues(o){
    if(state.step===1){
      state.title = o.querySelector("#wiz-title").value.trim(); state.type = o.querySelector("#wiz-type").value;
      state.site = o.querySelector("#wiz-site").value.trim(); state.date = o.querySelector("#wiz-date").value;
      state.duration = o.querySelector("#wiz-duration").value.trim(); state.responsable = o.querySelector("#wiz-responsable").value.trim();
      state.auditeurs = o.querySelector("#wiz-auditeurs").value.trim();
    }
    if(state.step===3){
      state.activites = o.querySelector("#wiz-activites").value.trim(); state.produits = o.querySelector("#wiz-produits").value.trim();
      state.periodeDebut = o.querySelector("#wiz-periode-debut").value; state.periodeFin = o.querySelector("#wiz-periode-fin").value;
      state.exclusions = o.querySelector("#wiz-exclusions").value.trim();
    }
  }
  function mount(o){
    if(state.step===1||state.step===3) o.querySelectorAll(".wiz-process-cb").forEach(cb=>cb.addEventListener("change", ()=>{ state.processIds = [...o.querySelectorAll(".wiz-process-cb:checked")].map(c=>c.value); }));
    if(state.step===1) o.querySelectorAll(".wiz-ref-cb").forEach(cb=>cb.addEventListener("change", ()=>{ state.referentielIds = [...o.querySelectorAll(".wiz-ref-cb:checked")].map(c=>c.value); }));
    if(state.step===2) o.querySelectorAll(".wiz-motif-cb").forEach(cb=>cb.addEventListener("change", ()=>{ state.motifs = [...o.querySelectorAll(".wiz-motif-cb:checked")].map(c=>c.value); }));
    if(state.step===4){
      o.querySelectorAll("[data-wiz-add-objectif]").forEach(btn=>btn.addEventListener("click", ()=>{ state.objectifs.push(btn.getAttribute("data-wiz-add-objectif")); refresh(o); }));
      o.querySelectorAll("[data-wiz-remove-objectif]").forEach(btn=>btn.addEventListener("click", ()=>{ state.objectifs.splice(parseInt(btn.getAttribute("data-wiz-remove-objectif"),10),1); refresh(o); }));
      o.querySelector("#wiz-add-custom-objectif").addEventListener("click", ()=>{ const val=o.querySelector("#wiz-objectif-input").value.trim(); if(val){ state.objectifs.push(val); refresh(o); } });
    }
    if(state.step===5){
      o.querySelectorAll(".wiz-req-cb").forEach(cb=>cb.addEventListener("change", ()=>{ state.requirementIds = [...o.querySelectorAll(".wiz-req-cb:checked")].map(c=>c.value); }));
      o.querySelectorAll(".wiz-doc-cb").forEach(cb=>cb.addEventListener("change", ()=>{ state.documentIds = [...o.querySelectorAll(".wiz-doc-cb:checked")].map(c=>c.value); }));
    }
    if(state.step===6){
      const genBtn = o.querySelector("#wiz-generate-plan");
      if(genBtn) genBtn.addEventListener("click", ()=>{ state.questions = generateAuditQuestions(state.processIds, state.referentielIds); refresh(o); });
    }
    const prevBtn = o.querySelector("#wiz-prev"); if(prevBtn) prevBtn.addEventListener("click", ()=>{ captureStepValues(o); state.step--; refresh(o); });
    const nextBtn = o.querySelector("#wiz-next"); if(nextBtn) nextBtn.addEventListener("click", ()=>{
      captureStepValues(o);
      if(state.step===1 && !state.title){ toast("Merci de saisir un nom d'audit","⚠️"); return; }
      if(state.step===1 && !state.processIds.length){ toast("Sélectionnez au moins un processus","⚠️"); return; }
      state.step++; refresh(o);
    });
    const finishBtn = o.querySelector("#wiz-finish"); if(finishBtn) finishBtn.addEventListener("click", ()=>{ captureStepValues(o); finishWizard(); });
  }
  function refresh(o){ o.querySelector(".modal-body").innerHTML = bodyForStep(); o.querySelector(".modal-foot").innerHTML = stepFoot(); mount(o); }
  function finishWizard(){
    const id = nextId("AUD", DB.audits);
    const ref = "AUD-"+new Date().getFullYear()+"-"+String(DB.audits.length+1).padStart(3,"0");
    const auditeursArr = state.auditeurs ? state.auditeurs.split(",").map(s=>s.trim()).filter(Boolean) : [];
    DB.audits.push({
      id, ref, title:state.title, type:state.type, referentielIds:state.referentielIds.length?state.referentielIds:["ISO9001"],
      processId: state.processIds[0]||null, processIds: state.processIds, date: state.date||new Date().toISOString().slice(0,10), duration: state.duration,
      responsable: state.responsable||"Non assigné", auditeurs: auditeursArr.length?auditeursArr:[state.responsable||"Non assigné"], site: state.site,
      objective: state.objectifs.join(" "), scope: state.activites, auditor: state.responsable||"Non assigné", status:"planifie",
      motifs: state.motifs, perimeter:{ processIds: state.processIds, activites: state.activites, produits: state.produits, periodeDebut: state.periodeDebut, periodeFin: state.periodeFin, exclusions: state.exclusions },
      objectifs: state.objectifs, criteres:{ referentielIds: state.referentielIds, requirementIds: state.requirementIds, documentIds: state.documentIds },
      questions: state.questions, parties: [], findings: [],
    });
    saveDB(); closeModal(); toast("Audit créé avec succès — "+state.questions.length+" question(s) préparée(s)");
    navigate(`audits/${id}`);
  }
  openModal({title:"Nouvel audit", wide:true, bodyHtml:bodyForStep(), footHtml:stepFoot(), onMount:(o)=>mount(o)});
}

function openConstatForm(auditId, existing){
  const audit = getAudit(auditId);
  openModal({title: existing?"Modifier le constat":"Ajouter un constat", wide:true,
    bodyHtml:`
      <div class="field"><label>Type de constat</label><select id="qf-type">${Object.entries(LABELS.constatType).map(([v,l])=>`<option value="${v}" ${existing&&existing.type===v?"selected":""}>${l.e} ${l.l}</option>`).join("")}</select></div>
      <div class="field"><label>Fait constaté <span class="req">*</span></label><textarea id="qf-text">${esc(existing?existing.text:"")}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Exigence concernée</label><select id="qf-req"><option value="">—</option>${(audit.criteres&&audit.criteres.requirementIds||[]).map(rid=>{const ex=resolveExigence(rid); return ex?`<option value="${rid}" ${existing&&existing.requirementId===rid?"selected":""}>${esc(ex.ref)} — ${esc(ex.label)}</option>`:"";}).join("")}</select></div>
        <div class="field" id="qf-gravite-wrap"><label>Niveau de gravité</label><select id="qf-gravite"><option value="mineure">Mineure</option><option value="majeure">Majeure</option><option value="critique">Critique</option></select></div>
      </div>
      <div class="field"><label>Cause potentielle (si déjà identifiée)</label><textarea id="qf-cause" placeholder="L'analyse de cause approfondie se fait dans le module NC/CAPA">${esc(existing?existing.cause:"")}</textarea></div>
      <div class="field"><label>Risque associé</label><select id="qf-risk"><option value="">—</option>${DB.risks.map(r=>`<option value="${r.id}" ${existing&&existing.riskId===r.id?"selected":""}>${esc(r.name)}</option>`).join("")}</select></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">${existing?"Enregistrer":"Ajouter"}</button>`,
    onMount:(o)=>{
      const typeSel = o.querySelector("#qf-type");
      const toggleGravite = ()=> o.querySelector("#qf-gravite-wrap").style.display = (typeSel.value==="ecart"||typeSel.value==="nc_majeure")?"block":"none";
      typeSel.addEventListener("change", toggleGravite); toggleGravite();
      o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const text = o.querySelector("#qf-text").value.trim();
        if(!text){ toast("Merci de décrire le constat","⚠️"); return; }
        const payload = { type:typeSel.value, text, requirementId:o.querySelector("#qf-req").value||null, cause:o.querySelector("#qf-cause").value.trim(), riskId:o.querySelector("#qf-risk").value||null, gravite:(typeSel.value==="ecart"||typeSel.value==="nc_majeure")?o.querySelector("#qf-gravite").value:null };
        if(existing){ Object.assign(existing, payload); }
        else{ audit.findings.push({ id:"C-"+String(Date.now()).slice(-6), ...payload, processId:audit.processId, questionId:null, ncEventId:null, actionId:null }); }
        saveDB(); closeModal(); toast(existing?"Constat mis à jour":"Constat ajouté"); render();
      });
    }
  });
}

function openQuestionAddForm(auditId){
  const audit = getAudit(auditId);
  openModal({title:"Ajouter une question", wide:true,
    bodyHtml:`
      <div class="field"><label>Question <span class="req">*</span></label><textarea id="qf-question" placeholder="Ex : Comment la traçabilité est-elle assurée ?"></textarea></div>
      <div class="field-row">
        <div class="field"><label>Processus</label><select id="qf-process">${(audit.processIds&&audit.processIds.length?audit.processIds:[audit.processId]).map(id=>{const p=getProcess(id); return p?`<option value="${id}">${esc(p.name)}</option>`:"";}).join("")}</select></div>
        <div class="field"><label>Responsable interrogé</label><input type="text" id="qf-resp"></div>
      </div>
      <div class="field"><label>Critère / référence</label><input type="text" id="qf-critere" placeholder="Ex : PR-005"></div>
      <div class="field"><label>Preuve attendue</label><input type="text" id="qf-preuve-attendue"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const question = o.querySelector("#qf-question").value.trim();
      if(!question){ toast("Merci de saisir la question","⚠️"); return; }
      audit.questions.push({ id:"Q-"+Math.random().toString(36).slice(2,8), question, requirementId:null, processId:o.querySelector("#qf-process").value||audit.processId,
        critere:o.querySelector("#qf-critere").value.trim(), preuveAttendue:o.querySelector("#qf-preuve-attendue").value.trim(), responsableInterroge:o.querySelector("#qf-resp").value.trim(),
        statut:"non_evalue", commentaire:"", preuveIds:[] });
      saveDB(); closeModal(); toast("Question ajoutée"); navigate(`audits/${auditId}/grille/${audit.questions.length-1}`);
    });}
  });
}

function openPartyAddForm(auditId){
  const audit = getAudit(auditId);
  openModal({title:"Ajouter une partie prenante",
    bodyHtml:`
      <div class="field"><label>Nom <span class="req">*</span></label><input type="text" id="qf-name"></div>
      <div class="field"><label>Rôle</label><input type="text" id="qf-role" value="Audité"></div>
      <div class="field"><label>Questions à compléter</label>
        <div style="max-height:150px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${audit.questions.length?audit.questions.map(q=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="qf-q-cb" value="${q.id}" style="width:auto;"> ${esc(q.question.slice(0,60))}</label>`).join(""):"<p class='text-sm'>Aucune question disponible.</p>"}
        </div>
      </div>
      <div class="field"><label>Échéance</label><input type="date" id="qf-echeance"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const name = o.querySelector("#qf-name").value.trim();
      if(!name){ toast("Merci de saisir un nom","⚠️"); return; }
      const questionIds = [...o.querySelectorAll(".qf-q-cb:checked")].map(c=>c.value);
      audit.parties.push({ name, role:o.querySelector("#qf-role").value.trim()||"Audité", questionIds, echeance:o.querySelector("#qf-echeance").value||"—", status:"en_attente" });
      saveDB(); closeModal(); toast("Partie prenante ajoutée — "+questionIds.length+" question(s) assignée(s)"); render();
    });}
  });
}

function openPerimeterEditForm(auditId){
  const audit = getAudit(auditId);
  const pr = audit.perimeter||{};
  openModal({title:"Modifier le périmètre", wide:true,
    bodyHtml:`
      <div class="field"><label>Activités</label><input type="text" id="qf-activites" value="${esc(pr.activites||"")}"></div>
      <div class="field"><label>Produits / services</label><input type="text" id="qf-produits" value="${esc(pr.produits||"")}"></div>
      <div class="field-row">
        <div class="field"><label>Période — début</label><input type="date" id="qf-debut" value="${pr.periodeDebut||""}"></div>
        <div class="field"><label>Période — fin</label><input type="date" id="qf-fin" value="${pr.periodeFin||""}"></div>
      </div>
      <div class="field"><label>Exclusions</label><textarea id="qf-exclusions">${esc(pr.exclusions||"")}</textarea></div>
      <div class="field"><label>Site</label><input type="text" id="qf-site" value="${esc(audit.site||"")}"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Enregistrer</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      audit.perimeter = { processIds:audit.processIds, activites:o.querySelector("#qf-activites").value.trim(), produits:o.querySelector("#qf-produits").value.trim(),
        periodeDebut:o.querySelector("#qf-debut").value, periodeFin:o.querySelector("#qf-fin").value, exclusions:o.querySelector("#qf-exclusions").value.trim() };
      audit.site = o.querySelector("#qf-site").value.trim();
      audit.scope = audit.perimeter.activites;
      saveDB(); closeModal(); toast("Périmètre mis à jour"); render();
    });}
  });
}

function generateAuditReportText(a){
  const p = getProcess(a.processId);
  const lines = [];
  lines.push("Rapport d'audit — "+a.title);
  lines.push("Référence : "+(a.ref||a.id)+" · Type : "+(LABELS.auditType[a.type]||a.type));
  lines.push("Processus : "+(p?p.name:"—")+" · Date : "+fmtDate(a.date)+" · Responsable : "+(a.responsable||a.auditor));
  lines.push("");
  lines.push("Objectifs :");
  (a.objectifs&&a.objectifs.length?a.objectifs:[a.objective]).filter(Boolean).forEach(o=>lines.push("- "+o));
  lines.push("");
  lines.push("Périmètre : "+((a.perimeter&&a.perimeter.activites)||a.scope||"—"));
  lines.push("Référentiel(s) : "+(a.referentielIds||[]).map(id=>{const r=getReferentiel(id);return r?r.name:id;}).join(", "));
  lines.push("");
  const rate = auditConformityRate(a);
  lines.push("Résultat : "+(rate!==null?rate+"% des critères vérifiés sont conformes.":"Résultat non encore calculable."));
  lines.push("");
  lines.push("Constats :");
  a.findings.forEach(f=> lines.push("- ["+(LABELS.constatType[f.type]?LABELS.constatType[f.type].l:f.type)+"] "+f.text));
  lines.push("");
  lines.push("Conclusion : audit "+((LABELS.auditStatus[a.status]?LABELS.auditStatus[a.status].l:a.status)).toLowerCase()+".");
  return lines.join("\n");
}

/* ============================================================
   19bis-comp. FORMULAIRES — COMPÉTENCES & HABILITATIONS
   ============================================================ */
function openCompetenceForm(id){
  const existing = id ? getCompetence(id) : null;
  openModal({title: existing?"Modifier la compétence":"Nouvelle compétence", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Nom <span class="req">*</span></label><input type="text" id="cf-nom" value="${esc(existing?existing.nom:"")}"></div>
        <div class="field"><label>Code</label><input type="text" id="cf-code" value="${esc(existing?existing.code:"")}"></div>
      </div>
      <div class="field"><label>Description</label><textarea id="cf-desc">${esc(existing?existing.description:"")}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Domaine</label><input type="text" id="cf-domaine" value="${esc(existing?existing.domaine:"")}"></div>
        <div class="field"><label>Type</label><select id="cf-type"><option value="métier" ${existing&&existing.type==="métier"?"selected":""}>Métier</option><option value="transversale" ${existing&&existing.type==="transversale"?"selected":""}>Transversale</option><option value="réglementaire" ${existing&&existing.type==="réglementaire"?"selected":""}>Réglementaire</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Criticité</label><select id="cf-crit">${Object.entries(LABELS.competenceCriticite).map(([v,l])=>`<option value="${v}" ${existing&&existing.criticite===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
        <div class="field"><label><input type="checkbox" id="cf-reglem" style="width:auto;margin-right:6px;" ${existing&&existing.reglementaire?"checked":""}> Compétence réglementaire / obligatoire</label></div>
      </div>
      ${existing?`<div class="field"><label><input type="checkbox" id="cf-actif" style="width:auto;margin-right:6px;" ${existing.actif?"checked":""}> Active</label></div>`:""}`,
    footHtml:`${existing?`<button class="btn btn-danger" id="cf-delete" style="margin-right:auto;">Supprimer</button>`:""}<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="cf-submit">${existing?"Enregistrer":"Créer"}</button>`,
    onMount:(o)=>{
      o.querySelector("#cf-submit").addEventListener("click", ()=>{
        const nom = o.querySelector("#cf-nom").value.trim();
        if(!nom){ toast("Merci de saisir un nom","⚠️"); return; }
        const payload = { nom, code:o.querySelector("#cf-code").value.trim()||("C-"+Date.now().toString().slice(-5)), description:o.querySelector("#cf-desc").value.trim(),
          domaine:o.querySelector("#cf-domaine").value.trim(), type:o.querySelector("#cf-type").value, criticite:o.querySelector("#cf-crit").value, reglementaire:o.querySelector("#cf-reglem").checked };
        if(existing){ Object.assign(existing, payload); existing.actif = o.querySelector("#cf-actif").checked; }
        else{ DB.competences.push({ id:nextId("COMP", DB.competences), ...payload, actif:true, niveauRequisPossible:4, documentIds:[], habilitationIds:[] }); }
        saveDB(); closeModal(); toast(existing?"Compétence mise à jour":"Compétence créée"); navigate("competences/referentiel");
      });
      const delBtn = o.querySelector("#cf-delete");
      if(delBtn) delBtn.addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement cette compétence ?", ()=>{
          DB.competences = DB.competences.filter(c=>c.id!==existing.id);
          saveDB(); closeModal(); toast("Compétence supprimée"); navigate("competences/referentiel");
        });
      });
    }
  });
}

function openPosteForm(id){
  const existing = id ? getPoste(id) : null;
  openModal({title: existing?"Modifier le poste":"Nouveau poste", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Intitulé <span class="req">*</span></label><input type="text" id="pf-intitule" value="${esc(existing?existing.intitule:"")}"></div>
        <div class="field"><label>Code</label><input type="text" id="pf-code" value="${esc(existing?existing.code:"")}"></div>
      </div>
      <div class="field"><label>Description</label><textarea id="pf-desc">${esc(existing?existing.description:"")}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Département / service</label><input type="text" id="pf-dept" value="${esc(existing?existing.departement:"")}"></div>
        <div class="field"><label>Responsable / manager</label><input type="text" id="pf-resp" value="${esc(existing?existing.responsable:"")}"></div>
      </div>
      <div class="field"><label>Criticité du poste</label><select id="pf-crit">${Object.entries(LABELS.competenceCriticite).map(([v,l])=>`<option value="${v}" ${existing&&existing.criticite===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
      <div class="field"><label>Habilitations obligatoires</label>
        <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${DB.habilitations.map(h=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="pf-hab-cb" value="${h.id}" ${existing&&(existing.habilitationsObligatoires||[]).includes(h.id)?"checked":""} style="width:auto;"> ${esc(h.nom)}</label>`).join("")}
        </div>
      </div>`,
    footHtml:`${existing?`<button class="btn btn-danger" id="pf-delete" style="margin-right:auto;">Supprimer</button>`:""}<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="pf-submit">${existing?"Enregistrer":"Créer"}</button>`,
    onMount:(o)=>{
      o.querySelector("#pf-submit").addEventListener("click", ()=>{
        const intitule = o.querySelector("#pf-intitule").value.trim();
        if(!intitule){ toast("Merci de saisir un intitulé","⚠️"); return; }
        const habilitationsObligatoires = [...o.querySelectorAll(".pf-hab-cb:checked")].map(c=>c.value);
        const payload = { intitule, code:o.querySelector("#pf-code").value.trim()||("P-"+Date.now().toString().slice(-5)), description:o.querySelector("#pf-desc").value.trim(),
          departement:o.querySelector("#pf-dept").value.trim(), responsable:o.querySelector("#pf-resp").value.trim(), criticite:o.querySelector("#pf-crit").value, habilitationsObligatoires };
        if(existing){ Object.assign(existing, payload); }
        else{ DB.postes.push({ id:nextId("POSTE", DB.postes), ...payload, actif:true, competencesRequises:[] }); }
        saveDB(); closeModal(); toast(existing?"Poste mis à jour":"Poste créé"); navigate("competences/postes");
      });
      const delBtn = o.querySelector("#pf-delete");
      if(delBtn) delBtn.addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement ce poste ?", ()=>{
          DB.postes = DB.postes.filter(p=>p.id!==existing.id);
          saveDB(); closeModal(); toast("Poste supprimé"); navigate("competences/postes");
        });
      });
    }
  });
}

function openAddPosteCompetenceForm(posteId){
  const poste = getPoste(posteId);
  openModal({title:"Ajouter une compétence requise",
    bodyHtml:`
      <div class="field"><label>Compétence</label><select id="apf-comp">${DB.competences.filter(c=>c.actif && !poste.competencesRequises.some(r=>r.competenceId===c.id)).map(c=>`<option value="${c.id}">${esc(c.nom)}</option>`).join("")}</select></div>
      <div class="field"><label>Niveau requis</label><select id="apf-niveau">${Object.entries(LABELS.niveauCompetence).map(([v,l])=>`<option value="${v}" ${v==="2"?"selected":""}>${v} — ${l}</option>`).join("")}</select></div>
      <div class="field"><label><input type="checkbox" id="apf-obligatoire" style="width:auto;margin-right:6px;" checked> Obligatoire</label></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="apf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#apf-submit").addEventListener("click", ()=>{
      const compId = o.querySelector("#apf-comp").value;
      if(!compId){ toast("Aucune compétence disponible à ajouter","⚠️"); return; }
      poste.competencesRequises.push({ competenceId:compId, niveauRequis:parseInt(o.querySelector("#apf-niveau").value,10), obligatoire:o.querySelector("#apf-obligatoire").checked });
      saveDB(); closeModal(); toast("Compétence ajoutée au poste"); render();
    });}
  });
}

function openHabilitationForm(id){
  const existing = id ? getHabilitation(id) : null;
  openModal({title: existing?"Modifier l'habilitation":"Nouvelle habilitation", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Nom <span class="req">*</span></label><input type="text" id="hf-nom" value="${esc(existing?existing.nom:"")}"></div>
        <div class="field"><label>Code</label><input type="text" id="hf-code" value="${esc(existing?existing.code:"")}"></div>
      </div>
      <div class="field"><label>Description</label><textarea id="hf-desc">${esc(existing?existing.description:"")}</textarea></div>
      <div class="field"><label>Activité concernée</label><input type="text" id="hf-activite" value="${esc(existing?existing.activite:"")}"></div>
      <div class="field-row">
        <div class="field"><label>Autorité pouvant attribuer</label><input type="text" id="hf-autorite" value="${esc(existing?existing.autorite:"")}"></div>
        <div class="field"><label>Durée de validité (mois)</label><input type="number" id="hf-duree" value="${existing?existing.dureeValiditeMois:12}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label><input type="checkbox" id="hf-formation" style="width:auto;margin-right:6px;" ${existing&&existing.formationObligatoire?"checked":""}> Formation obligatoire</label></div>
        <div class="field"><label><input type="checkbox" id="hf-evaluation" style="width:auto;margin-right:6px;" ${existing&&existing.evaluationObligatoire?"checked":""}> Évaluation obligatoire</label></div>
      </div>`,
    footHtml:`${existing?`<button class="btn btn-danger" id="hf-delete" style="margin-right:auto;">Supprimer</button>`:""}<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="hf-submit">${existing?"Enregistrer":"Créer"}</button>`,
    onMount:(o)=>{
      o.querySelector("#hf-submit").addEventListener("click", ()=>{
        const nom = o.querySelector("#hf-nom").value.trim();
        if(!nom){ toast("Merci de saisir un nom","⚠️"); return; }
        const payload = { nom, code:o.querySelector("#hf-code").value.trim()||("H-"+Date.now().toString().slice(-5)), description:o.querySelector("#hf-desc").value.trim(),
          activite:o.querySelector("#hf-activite").value.trim(), autorite:o.querySelector("#hf-autorite").value.trim(), dureeValiditeMois:parseInt(o.querySelector("#hf-duree").value,10)||12,
          formationObligatoire:o.querySelector("#hf-formation").checked, evaluationObligatoire:o.querySelector("#hf-evaluation").checked };
        if(existing){ Object.assign(existing, payload); }
        else{ DB.habilitations.push({ id:nextId("HAB", DB.habilitations), ...payload, niveau:"Standard", prerequis:"", competencesNecessaires:[], renouvellement:true, documentsNecessaires:[], actif:true }); }
        saveDB(); closeModal(); toast(existing?"Habilitation mise à jour":"Habilitation créée"); navigate("competences/habilitations");
      });
      const delBtn = o.querySelector("#hf-delete");
      if(delBtn) delBtn.addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement cette habilitation ?", ()=>{
          DB.habilitations = DB.habilitations.filter(h=>h.id!==existing.id);
          DB.personHabilitations = DB.personHabilitations.filter(ph=>ph.habilitationId!==existing.id);
          saveDB(); closeModal(); toast("Habilitation supprimée"); navigate("competences/habilitations");
        });
      });
    }
  });
}

function openPersonForm(id){
  const existing = id ? getPerson(id) : null;
  openModal({title: existing?"Modifier le collaborateur":"Nouveau collaborateur", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Nom <span class="req">*</span></label><input type="text" id="prf-nom" value="${esc(existing?existing.name:"")}"></div>
        <div class="field"><label>Poste</label><select id="prf-poste"><option value="">—</option>${DB.postes.map(p=>`<option value="${p.id}" ${existing&&existing.posteId===p.id?"selected":""}>${esc(p.intitule)}</option>`).join("")}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Service</label><input type="text" id="prf-service" value="${esc(existing?existing.service:"")}"></div>
        <div class="field"><label>Manager</label><input type="text" id="prf-manager" value="${esc(existing?existing.manager||"":"")}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Date d'entrée</label><input type="date" id="prf-entree" value="${existing?existing.dateEntree:""}"></div>
        <div class="field"><label>Prochaine revue de compétences</label><input type="date" id="prf-prochaine" value="${existing?existing.prochaineRevue:""}"></div>
      </div>`,
    footHtml:`${existing?`<button class="btn btn-danger" id="prf-delete" style="margin-right:auto;">Supprimer</button>`:""}<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="prf-submit">${existing?"Enregistrer":"Créer"}</button>`,
    onMount:(o)=>{
      o.querySelector("#prf-submit").addEventListener("click", ()=>{
        const name = o.querySelector("#prf-nom").value.trim();
        if(!name){ toast("Merci de saisir un nom","⚠️"); return; }
        const posteId = o.querySelector("#prf-poste").value||null;
        const poste = posteId ? getPoste(posteId) : null;
        const payload = { name, posteId, service:o.querySelector("#prf-service").value.trim(), manager:o.querySelector("#prf-manager").value.trim()||null,
          processId: existing?existing.processId:null, dateEntree:o.querySelector("#prf-entree").value||new Date().toISOString().slice(0,10), prochaineRevue:o.querySelector("#prf-prochaine").value||"—" };
        if(existing){ Object.assign(existing, payload); }
        else{ DB.people.push({ id:nextId("P", DB.people), ...payload, derniereRevue:null }); }
        saveDB(); closeModal(); toast(existing?"Collaborateur mis à jour":"Collaborateur créé"); navigate("competences/personnes");
      });
      const delBtn = o.querySelector("#prf-delete");
      if(delBtn) delBtn.addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement ce collaborateur ?", ()=>{
          DB.people = DB.people.filter(p=>p.id!==existing.id);
          saveDB(); closeModal(); toast("Collaborateur supprimé"); navigate("competences/personnes");
        });
      });
    }
  });
}

function openEvaluationForm(personId, competenceId){
  const person = getPerson(personId), comp = getCompetence(competenceId);
  const poste = person ? getPoste(person.posteId) : null;
  const req = poste ? poste.competencesRequises.find(r=>r.competenceId===competenceId) : null;
  openModal({title:"Évaluer une compétence", wide:true,
    bodyHtml:`
      <p class="text-sm mb-2"><strong>${esc(person.name)}</strong> — ${esc(comp.nom)} ${req?`(niveau requis : ${req.niveauRequis})`:""}</p>
      <div class="field-row">
        <div class="field"><label>Niveau évalué <span class="req">*</span></label><select id="evf-niveau">${Object.entries(LABELS.niveauCompetence).map(([v,l])=>`<option value="${v}">${v} — ${l}</option>`).join("")}</select></div>
        <div class="field"><label>Date</label><input type="date" id="evf-date" value="${new Date().toISOString().slice(0,10)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Évaluateur</label><input type="text" id="evf-evaluateur" value="${esc(person.manager||"")}"></div>
        <div class="field"><label>Méthode</label><select id="evf-methode"><option>Entretien</option><option>Entretien annuel</option><option>Observation</option><option>Test</option><option>Mise en situation</option><option>Évaluation interne</option></select></div>
      </div>
      <div class="field"><label>Commentaire</label><textarea id="evf-comment"></textarea></div>
      <div class="field"><label>Résultat</label><select id="evf-resultat"><option value="Conforme">Conforme</option><option value="À renforcer">À renforcer</option></select></div>
      <div class="field"><label>Date de prochaine évaluation</label><input type="date" id="evf-prochaine"></div>
      <p class="text-xs">L'historique des évaluations précédentes n'est jamais écrasé — chaque évaluation s'ajoute à l'historique.</p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="evf-submit">Enregistrer l'évaluation</button>`,
    onMount:(o)=>{ o.querySelector("#evf-submit").addEventListener("click", ()=>{
      DB.competenceEvaluations.push({ id:"EVAL-"+String(Date.now()).slice(-6), personId, competenceId, niveauEvalue:parseInt(o.querySelector("#evf-niveau").value,10),
        date:o.querySelector("#evf-date").value||new Date().toISOString().slice(0,10), evaluateur:o.querySelector("#evf-evaluateur").value.trim()||"Non renseigné",
        methode:o.querySelector("#evf-methode").value, commentaire:o.querySelector("#evf-comment").value.trim(), preuveIds:[],
        resultat:o.querySelector("#evf-resultat").value, prochaineEvaluation:o.querySelector("#evf-prochaine").value||"—" });
      saveDB(); closeModal(); toast("Évaluation enregistrée"); render();
    });}
  });
}

function openPreuveForm(personId, competenceId){
  const person = getPerson(personId);
  openModal({title:"Ajouter une preuve de compétence", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Compétence</label><select id="prv-comp">${DB.competences.filter(c=>c.actif).map(c=>`<option value="${c.id}" ${competenceId===c.id?"selected":""}>${esc(c.nom)}</option>`).join("")}</select></div>
        <div class="field"><label>Type de preuve</label><select id="prv-type">${Object.entries(LABELS.preuveCompetenceType).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Libellé <span class="req">*</span></label><input type="text" id="prv-label" placeholder="Ex : Certificat ISO 9001"></div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="prv-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Évaluateur</label><input type="text" id="prv-eval" value="${esc(person.manager||"")}"></div>
      </div>
      <div class="field"><label>Document Qonnect existant (optionnel — ne pas reverser un document déjà présent)</label>
        <select id="prv-doc"><option value="">—</option>${DB.documents.filter(d=>d.status!=="obsolete").map(d=>`<option value="${d.id}">${esc(d.title)}</option>`).join("")}</select></div>
      <div class="field"><label>Résultat</label><input type="text" id="prv-resultat" value="Validé"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="prv-submit">Ajouter la preuve</button>`,
    onMount:(o)=>{ o.querySelector("#prv-submit").addEventListener("click", ()=>{
      const label = o.querySelector("#prv-label").value.trim();
      if(!label){ toast("Merci de saisir un libellé","⚠️"); return; }
      DB.competencePreuves.push({ id:"PRV-"+String(Date.now()).slice(-6), personId, competenceId:o.querySelector("#prv-comp").value, type:o.querySelector("#prv-type").value,
        label, date:o.querySelector("#prv-date").value, evaluateur:o.querySelector("#prv-eval").value.trim()||"Non renseigné", resultat:o.querySelector("#prv-resultat").value.trim(),
        documentId:o.querySelector("#prv-doc").value||null });
      saveDB(); closeModal(); toast("Preuve ajoutée"); render();
    });}
  });
}

function openAttributeHabilitationForm(habilitationId, personId){
  const hab = habilitationId ? getHabilitation(habilitationId) : null;
  openModal({title:"Attribuer une habilitation", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Collaborateur</label><select id="ahf-person" ${personId?"disabled":""}>${DB.people.map(p=>`<option value="${p.id}" ${personId===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Habilitation</label><select id="ahf-hab" ${habilitationId?"disabled":""}>${DB.habilitations.filter(h=>h.actif).map(h=>`<option value="${h.id}" ${habilitationId===h.id?"selected":""}>${esc(h.nom)}</option>`).join("")}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Date d'attribution</label><input type="date" id="ahf-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Durée de validité (mois)</label><input type="number" id="ahf-duree" value="${hab?hab.dureeValiditeMois:12}"></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ahf-submit">Attribuer</button>`,
    onMount:(o)=>{ o.querySelector("#ahf-submit").addEventListener("click", ()=>{
      const pid = personId || o.querySelector("#ahf-person").value;
      const hid = habilitationId || o.querySelector("#ahf-hab").value;
      const dateAttribution = o.querySelector("#ahf-date").value || new Date().toISOString().slice(0,10);
      const dureeMois = parseInt(o.querySelector("#ahf-duree").value,10) || 12;
      const dExp = new Date(dateAttribution+"T00:00:00"); dExp.setMonth(dExp.getMonth()+dureeMois);
      DB.personHabilitations.push({ id:"PH-"+String(Date.now()).slice(-6), personId:pid, habilitationId:hid, dateAttribution, dateExpiration:dExp.toISOString().slice(0,10), statut:"active",
        historique:[{date:dateAttribution, action:"Attribution", ancienneValeur:null, nouvelleValeur:"active", commentaire:""}] });
      saveDB(); closeModal(); toast("Habilitation attribuée"); render();
    });}
  });
}

function renewHabilitation(phId){
  const ph = findBy(DB.personHabilitations, phId);
  if(!ph) return;
  const hab = getHabilitation(ph.habilitationId);
  const today = new Date().toISOString().slice(0,10);
  const dExp = new Date(); dExp.setMonth(dExp.getMonth()+(hab?hab.dureeValiditeMois:12));
  const ancienneExp = ph.dateExpiration;
  ph.dateAttribution = today; ph.dateExpiration = dExp.toISOString().slice(0,10); ph.statut = "active";
  ph.historique.push({date:today, action:"Renouvellement", ancienneValeur:ancienneExp, nouvelleValeur:ph.dateExpiration, commentaire:""});
  saveDB(); toast("Habilitation renouvelée jusqu'au "+fmtDate(ph.dateExpiration)); render();
}

function openCompetenceReviewForm(personId){
  const person = getPerson(personId);
  const rows = personMatrix(personId);
  openModal({title:"Nouvelle revue de compétences", wide:true,
    bodyHtml:`
      <p class="text-sm mb-2"><strong>${esc(person.name)}</strong></p>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="rvf-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Évaluateur</label><input type="text" id="rvf-evaluateur" value="${esc(person.manager||"")}"></div>
      </div>
      <div class="field"><label>Compétences maîtrisées</label><textarea id="rvf-maitrisees" placeholder="Une par ligne">${rows.filter(r=>r.statut==="conforme").map(r=>r.competence.nom).join("\n")}</textarea></div>
      <div class="field"><label>Compétences à renforcer</label><textarea id="rvf-renforcer" placeholder="Une par ligne">${rows.filter(r=>r.statut==="a_renforcer").map(r=>r.competence.nom).join("\n")}</textarea></div>
      <div class="field"><label>Nouvelles compétences nécessaires</label><textarea id="rvf-nouvelles"></textarea></div>
      <div class="field-row">
        <div class="field"><label>Formations réalisées</label><input type="text" id="rvf-formations-real"></div>
        <div class="field"><label>Formations à prévoir</label><input type="text" id="rvf-formations-prevoir"></div>
      </div>
      <div class="field"><label>Habilitations à renouveler</label><input type="text" id="rvf-hab-renouveler"></div>
      <div class="field"><label>Évolution du poste envisagée</label><input type="text" id="rvf-evolution"></div>
      <div class="field"><label>Conclusion du manager</label><textarea id="rvf-conclusion"></textarea></div>
      <div class="field"><label>Prochaine date de revue</label><input type="date" id="rvf-prochaine"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="rvf-submit">Enregistrer la revue</button>`,
    onMount:(o)=>{ o.querySelector("#rvf-submit").addEventListener("click", ()=>{
      const date = o.querySelector("#rvf-date").value || new Date().toISOString().slice(0,10);
      DB.competenceReviews.push({ id:"CREV-"+String(Date.now()).slice(-6), personId, date, evaluateur:o.querySelector("#rvf-evaluateur").value.trim()||"Non renseigné",
        competencesMaitrisees:o.querySelector("#rvf-maitrisees").value.split("\n").map(s=>s.trim()).filter(Boolean),
        competencesARenforcer:o.querySelector("#rvf-renforcer").value.split("\n").map(s=>s.trim()).filter(Boolean),
        nouvellesCompetencesNecessaires:o.querySelector("#rvf-nouvelles").value.trim(), formationsRealisees:o.querySelector("#rvf-formations-real").value.trim(),
        formationsAPrevoir:o.querySelector("#rvf-formations-prevoir").value.trim(), habilitationsARenouveler:o.querySelector("#rvf-hab-renouveler").value.trim(),
        evolutionPoste:o.querySelector("#rvf-evolution").value.trim(), conclusion:o.querySelector("#rvf-conclusion").value.trim(), prochaineDateRevue:o.querySelector("#rvf-prochaine").value||"—" });
      person.derniereRevue = date;
      if(o.querySelector("#rvf-prochaine").value) person.prochaineRevue = o.querySelector("#rvf-prochaine").value;
      saveDB(); closeModal(); toast("Revue de compétences enregistrée"); render();
    });}
  });
}

/* ============================================================
   19bis-frn. FORMULAIRES — FOURNISSEURS
   ============================================================ */
function openFournisseurForm(id){
  const existing = id ? getFournisseur(id) : null;
  openModal({title: existing?"Modifier le fournisseur":"Nouveau fournisseur", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Raison sociale <span class="req">*</span></label><input type="text" id="ff-raison" value="${esc(existing?existing.raisonSociale:"")}"></div>
        <div class="field"><label>Nom commercial</label><input type="text" id="ff-nom" value="${esc(existing?existing.nomCommercial:"")}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Pays</label><input type="text" id="ff-pays" value="${esc(existing?existing.pays:"France")}"></div>
        <div class="field"><label>Référent interne</label><input type="text" id="ff-referent" value="${esc(existing?existing.referentInterne:"")}"></div>
      </div>
      <div class="field"><label>Catégories</label>
        <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${LABELS.fournisseurCategorieOptions.map(cat=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ff-cat-cb" value="${esc(cat)}" ${existing&&(existing.categories||[]).includes(cat)?"checked":""} style="width:auto;"> ${esc(cat)}</label>`).join("")}
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Criticité <span class="req">*</span></label><select id="ff-crit">${Object.entries(LABELS.fournisseurCriticite).map(([v,l])=>`<option value="${v}" ${existing&&existing.criticite===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
        <div class="field"><label>Statut</label><select id="ff-statut">${Object.entries(LABELS.fournisseurStatut).map(([v,l])=>`<option value="${v}" ${existing&&existing.statut===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Justification de la criticité</label><textarea id="ff-justif">${esc(existing?existing.criticiteJustification:"")}</textarea></div>
      <div class="field"><label>Processus concernés</label>
        <div style="max-height:110px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${DB.processes.map(p=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ff-proc-cb" value="${p.id}" ${existing&&(existing.processIds||[]).includes(p.id)?"checked":""} style="width:auto;"> ${esc(p.name)}</label>`).join("")}
        </div>
      </div>`,
    footHtml:`${existing?`<button class="btn btn-danger" id="ff-delete" style="margin-right:auto;">Supprimer</button>`:""}<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ff-submit">${existing?"Enregistrer":"Créer"}</button>`,
    onMount:(o)=>{
      o.querySelector("#ff-submit").addEventListener("click", ()=>{
        const raison = o.querySelector("#ff-raison").value.trim();
        if(!raison){ toast("Merci de saisir une raison sociale","⚠️"); return; }
        const payload = { raisonSociale:raison, nomCommercial:o.querySelector("#ff-nom").value.trim()||raison, pays:o.querySelector("#ff-pays").value.trim(),
          referentInterne:o.querySelector("#ff-referent").value.trim(), categories:[...o.querySelectorAll(".ff-cat-cb:checked")].map(c=>c.value),
          criticite:o.querySelector("#ff-crit").value, statut:o.querySelector("#ff-statut").value, criticiteJustification:o.querySelector("#ff-justif").value.trim(),
          processIds:[...o.querySelectorAll(".ff-proc-cb:checked")].map(c=>c.value) };
        if(existing){ Object.assign(existing, payload); }
        else{ DB.fournisseurs.push({ id:nextId("FRN", DB.fournisseurs), ...payload, siret:"—", tva:"—", siteWeb:"", adresse:"", contacts:[], dateEntree:new Date().toISOString().slice(0,10), produitsServices:[] }); }
        saveDB(); closeModal(); toast(existing?"Fournisseur mis à jour":"Fournisseur créé"); navigate(existing?`fournisseurs/liste/${existing.id}`:"fournisseurs/liste");
      });
      const delBtn = o.querySelector("#ff-delete");
      if(delBtn) delBtn.addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement ce fournisseur ?", ()=>{
          DB.fournisseurs = DB.fournisseurs.filter(f=>f.id!==existing.id);
          saveDB(); closeModal(); toast("Fournisseur supprimé"); navigate("fournisseurs/liste");
        });
      });
    }
  });
}

function openFournisseurDocForm(fournisseurId){
  openModal({title:"Ajouter un document fournisseur", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Type</label><select id="fdf-type">${Object.entries(LABELS.fournisseurDocType).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="fdf-titre"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="fdf-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Échéance</label><input type="date" id="fdf-echeance"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Version</label><input type="text" id="fdf-version" value="1.0"></div>
        <div class="field"><label>Responsable</label><input type="text" id="fdf-resp"></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="fdf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#fdf-submit").addEventListener("click", ()=>{
      const titre = o.querySelector("#fdf-titre").value.trim();
      if(!titre){ toast("Merci de saisir un titre","⚠️"); return; }
      DB.fournisseurDocuments.push({ id:"FDOC-"+String(Date.now()).slice(-6), fournisseurId, type:o.querySelector("#fdf-type").value, titre,
        date:o.querySelector("#fdf-date").value, version:o.querySelector("#fdf-version").value.trim()||"1.0", echeance:o.querySelector("#fdf-echeance").value||"—",
        responsable:o.querySelector("#fdf-resp").value.trim()||"Non assigné" });
      saveDB(); closeModal(); toast("Document ajouté"); render();
    });}
  });
}

function openFournisseurEvalForm(fournisseurId){
  const f = getFournisseur(fournisseurId);
  openModal({title:"Nouvelle évaluation — "+f.nomCommercial, wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Modèle de questionnaire</label><select id="fef-quest"><option value="">Critères libres</option>${DB.fournisseurQuestionnaires.map(q=>`<option value="${q.id}">${esc(q.nom)}</option>`).join("")}</select></div>
        <div class="field"><label>Périodicité</label><select id="fef-periode"><option value="annuelle">Annuelle</option><option value="semestrielle">Semestrielle</option><option value="trimestrielle">Trimestrielle</option><option value="personnalisee">Personnalisée</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="fef-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Évaluateur</label><input type="text" id="fef-eval" value="${esc(f.referentInterne)}"></div>
      </div>
      <div id="fef-criteres"></div>
      <button class="btn btn-secondary btn-sm mt-2" id="fef-add-critere">+ Ajouter un critère</button>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="fef-submit">Enregistrer l'évaluation</button>`,
    onMount:(o)=>{
      const critereRow = (nom,ponderation)=>`<div class="field-row fef-crit-row">
        <div class="field"><input type="text" class="fef-c-nom" placeholder="Critère" value="${esc(nom||"")}"></div>
        <div class="field" style="max-width:100px;"><input type="number" class="fef-c-pond" placeholder="Poids %" value="${ponderation||20}"></div>
        <div class="field" style="max-width:100px;"><input type="number" class="fef-c-note" placeholder="Note /10" min="0" max="10" value="7"></div>
        <button type="button" class="btn btn-ghost btn-sm fef-remove-crit">✕</button>
      </div>`;
      function renderCriteres(list){ o.querySelector("#fef-criteres").innerHTML = list.map(c=>critereRow(c.nom, c.ponderation)).join(""); bindRemove(); }
      function bindRemove(){ o.querySelectorAll(".fef-remove-crit").forEach(b=>b.addEventListener("click", ()=>{ b.closest(".fef-crit-row").remove(); })); }
      renderCriteres([{nom:"Qualité",ponderation:25},{nom:"Respect des délais",ponderation:25},{nom:"Support",ponderation:25},{nom:"Conformité réglementaire",ponderation:25}]);
      o.querySelector("#fef-quest").addEventListener("change", (e)=>{
        const q = DB.fournisseurQuestionnaires.find(x=>x.id===e.target.value);
        renderCriteres(q ? q.criteres : [{nom:"Qualité",ponderation:25},{nom:"Respect des délais",ponderation:25},{nom:"Support",ponderation:25},{nom:"Conformité réglementaire",ponderation:25}]);
      });
      o.querySelector("#fef-add-critere").addEventListener("click", ()=>{
        o.querySelector("#fef-criteres").insertAdjacentHTML("beforeend", critereRow("",20)); bindRemove();
      });
      o.querySelector("#fef-submit").addEventListener("click", ()=>{
        const rows = [...o.querySelectorAll(".fef-crit-row")];
        const criteres = rows.map(r=>({ nom:r.querySelector(".fef-c-nom").value.trim()||"Critère", ponderation:parseFloat(r.querySelector(".fef-c-pond").value)||0, note:parseFloat(r.querySelector(".fef-c-note").value)||0, commentaire:"", preuve:"" })).filter(c=>c.nom);
        if(!criteres.length){ toast("Ajoutez au moins un critère","⚠️"); return; }
        DB.fournisseurEvaluations.push({ id:"FEVAL-"+String(Date.now()).slice(-6), fournisseurId, date:o.querySelector("#fef-date").value||new Date().toISOString().slice(0,10),
          periode:o.querySelector("#fef-periode").value, evaluateur:o.querySelector("#fef-eval").value.trim()||"Non renseigné", questionnaireId:o.querySelector("#fef-quest").value||null, criteres });
        saveDB(); closeModal(); toast("Évaluation enregistrée"); render();
      });
    }
  });
}

function openFournisseurIncidentForm(fournisseurId){
  openModal({title:"Déclarer un incident fournisseur", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Type</label><select id="fif-type">${Object.entries(LABELS.incidentType).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
        <div class="field"><label>Gravité</label><select id="fif-gravite"><option value="mineure">Mineure</option><option value="majeure">Majeure</option><option value="critique">Critique</option></select></div>
      </div>
      <div class="field"><label>Description <span class="req">*</span></label><textarea id="fif-desc"></textarea></div>
      <div class="field"><label>Impact</label><input type="text" id="fif-impact"></div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="fif-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Processus impacté</label><select id="fif-process"><option value="">—</option>${DB.processes.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="fif-submit">Déclarer</button>`,
    onMount:(o)=>{ o.querySelector("#fif-submit").addEventListener("click", ()=>{
      const desc = o.querySelector("#fif-desc").value.trim();
      if(!desc){ toast("Merci de décrire l'incident","⚠️"); return; }
      DB.fournisseurIncidents.push({ id:"FINC-"+String(Date.now()).slice(-6), fournisseurId, date:o.querySelector("#fif-date").value||new Date().toISOString().slice(0,10),
        type:o.querySelector("#fif-type").value, description:desc, impact:o.querySelector("#fif-impact").value.trim(), gravite:o.querySelector("#fif-gravite").value,
        processId:o.querySelector("#fif-process").value||null, riskId:null, actionId:null, ncEventId:null });
      saveDB(); closeModal(); toast("Incident déclaré"); render();
    });}
  });
}

/* ============================================================
   19bis. FORMULAIRES — CONTEXTE & STRATÉGIE
   ============================================================ */
function openIssueForm(kind){
  const title = kind==="external" ? "Ajouter un enjeu externe" : "Ajouter un enjeu interne";
  const suggestions = kind==="external"
    ? ["Réglementation","Marché","Concurrence","Économie","Technologie","Cybersécurité","Évolution climatique","Attentes sociétales","Disponibilité des fournisseurs","Pénurie de main-d'œuvre"]
    : ["Compétences","Ressources humaines","Culture d'entreprise","Organisation","Système d'information","Outils","Finances","Infrastructures","Équipements"];
  openModal({title,
    bodyHtml:`
      <div class="field"><label>Enjeu <span class="req">*</span></label>
        <input type="text" id="qf-title" list="issue-suggestions" placeholder="Choisissez ou saisissez librement">
        <datalist id="issue-suggestions">${suggestions.map(s=>`<option value="${esc(s)}">`).join("")}</datalist>
      </div>
      <div class="field"><label>Description</label><textarea id="qf-desc" placeholder="En quoi cet enjeu concerne votre organisation ?"></textarea></div>
      <div class="field"><label>Impact potentiel</label><textarea id="qf-impact" placeholder="Quel impact cela peut-il avoir ?"></textarea></div>
      <div class="field"><label>Niveau d'importance</label><select id="qf-importance"><option value="haute">Haute</option><option value="moyenne" selected>Moyenne</option><option value="basse">Basse</option></select></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const t = o.querySelector("#qf-title").value.trim();
      if(!t){ toast("Merci de saisir un enjeu","⚠️"); return; }
      const arr = kind==="external" ? DB.contextExternal : DB.contextInternal;
      const id = nextId(kind==="external"?"ISS-EXT":"ISS-INT", arr);
      arr.push({ id, title:t, description:o.querySelector("#qf-desc").value.trim()||"—", impact:o.querySelector("#qf-impact").value.trim()||"—", importance:o.querySelector("#qf-importance").value });
      saveDB(); closeModal(); toast("Enjeu ajouté avec succès");
      showAutoSuggestions(t);
    });}
  });
}

function openStakeholderForm(){
  openModal({title:"Ajouter une partie intéressée",
    bodyHtml:`
      <div class="field"><label>Nom <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Clients, Autorités, Fournisseurs…"></div>
      <div class="field-row">
        <div class="field"><label>Catégorie</label><select id="qf-cat">${Object.entries(LABELS.stakeholderCat).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
        <div class="field"><label>Importance</label><select id="qf-importance"><option value="haute">Haute</option><option value="moyenne" selected>Moyenne</option><option value="basse">Basse</option></select></div>
      </div>
      <div class="field"><label>Niveau d'influence</label><select id="qf-influence"><option value="haute">Haute</option><option value="moyenne" selected>Moyenne</option><option value="basse">Basse</option></select></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const t = o.querySelector("#qf-title").value.trim();
      if(!t){ toast("Merci de saisir un nom","⚠️"); return; }
      const id = nextId("PI", DB.stakeholders);
      DB.stakeholders.push({ id, name:t, category:o.querySelector("#qf-cat").value, importance:o.querySelector("#qf-importance").value, influence:o.querySelector("#qf-influence").value, needs:[] });
      saveDB(); closeModal(); toast("Partie intéressée ajoutée"); navigate(`contexte/stakeholders/${id}`);
    });}
  });
}

function openNeedForm(stakeholderId){
  openModal({title:"Ajouter un besoin / une attente / une exigence",
    bodyHtml:`
      <div class="field"><label>Type</label><select id="qf-type"><option value="besoin">Besoin</option><option value="attente">Attente</option><option value="exigence">Exigence</option></select></div>
      <div class="field"><label>Description <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Respect des délais"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const t = o.querySelector("#qf-title").value.trim();
      if(!t){ toast("Merci de saisir une description","⚠️"); return; }
      const s = getStakeholder(stakeholderId);
      const id = "NB-"+String(Date.now()).slice(-5);
      s.needs.push({id, text:t, type:o.querySelector("#qf-type").value});
      saveDB(); closeModal(); toast("Ajouté avec succès"); render();
    });}
  });
}

function openNeedFormGlobal(){
  if(!DB.stakeholders.length){
    openModal({title:"Ajouter un besoin",
      bodyHtml:`<p class="text-sm">Ajoutez d'abord une partie intéressée avant de lui associer un besoin, une attente ou une exigence.</p>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Fermer</button><button class="btn btn-primary" id="qf-goto">+ Ajouter une partie intéressée</button>`,
      onMount:(o)=>{ o.querySelector("#qf-goto").addEventListener("click", ()=>{ closeModal(); openStakeholderForm(); }); }
    });
    return;
  }
  openModal({title:"Ajouter un besoin / une attente / une exigence",
    bodyHtml:`
      <div class="field"><label>Partie intéressée <span class="req">*</span></label>
        <select id="qf-stakeholder">${DB.stakeholders.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Type</label><select id="qf-type"><option value="besoin">Besoin</option><option value="attente">Attente</option><option value="exigence">Exigence</option></select></div>
      <div class="field"><label>Description <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Respect des délais"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const t = o.querySelector("#qf-title").value.trim();
      if(!t){ toast("Merci de saisir une description","⚠️"); return; }
      const s = getStakeholder(o.querySelector("#qf-stakeholder").value);
      const id = "NB-"+String(Date.now()).slice(-5);
      s.needs.push({id, text:t, type:o.querySelector("#qf-type").value});
      saveDB(); closeModal(); toast("Ajouté avec succès"); render();
    });}
  });
}

function openOrientationForm(){
  openModal({title:"Ajouter une orientation stratégique",
    bodyHtml:`
      <div class="field"><label>Orientation <span class="req">*</span></label>
        <input type="text" id="qf-title" list="ori-suggestions" placeholder="Choisissez ou saisissez librement">
        <datalist id="ori-suggestions">${["Croissance","Satisfaction client","Qualité","Rentabilité","Innovation","Développement durable","Digitalisation","Certification","Sécurité de l'information"].map(s=>`<option value="${esc(s)}">`).join("")}</datalist>
      </div>
      <div class="field"><label>Description</label><textarea id="qf-desc"></textarea></div>
      <div class="field-row">
        <div class="field"><label>Responsable</label><input type="text" id="qf-owner"></div>
        <div class="field"><label>Échéance</label><input type="date" id="qf-due"></div>
      </div>
      <div class="field"><label>Priorité</label><select id="qf-priority"><option value="haute">Haute</option><option value="moyenne" selected>Moyenne</option><option value="basse">Basse</option></select></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const t = o.querySelector("#qf-title").value.trim();
      if(!t){ toast("Merci de saisir une orientation","⚠️"); return; }
      const id = nextId("ORI", DB.orientations);
      DB.orientations.push({ id, title:t, description:o.querySelector("#qf-desc").value.trim()||"—", responsible:o.querySelector("#qf-owner").value.trim()||"Non assigné", due:o.querySelector("#qf-due").value||"—", priority:o.querySelector("#qf-priority").value });
      saveDB(); closeModal(); toast("Orientation ajoutée"); render();
    });}
  });
}

function showAutoSuggestions(text){
  const s = contextAssistantSuggest(text);
  openModal({title:"🧠 Suggestions automatiques", wide:true,
    bodyHtml:`<p class="text-sm mb-2">Qonnect a analysé « ${esc(text)} » et propose ces éléments pour votre système.</p>${renderAssistantSuggestion(text, s)}`,
    footHtml:`<button class="btn btn-primary" data-close-modal>Terminer</button>`,
  });
}

function acceptSuggestion(sugg){
  if(sugg.kind==="issue"){
    const id = nextId("ISS-EXT", DB.contextExternal);
    DB.contextExternal.push({id, title:sugg.label, description:"Enjeu identifié via l'assistant de construction.", impact:"À préciser.", importance:"moyenne"});
    saveDB(); toast("Enjeu ajouté au contexte"); return;
  }
  if(sugg.kind==="risk"){
    const id = nextId("RISK", DB.risks);
    DB.risks.push({ id, name:sugg.label, level:"eleve", processId:null, owner:"Non assigné", status:"ouvert", type:"risque",
      description:"Risque suggéré par l'assistant à partir de l'enjeu « "+sugg.source+" ».", probability:3, impact:3,
      sourceContext:{type:"enjeu", label:sugg.source} });
    saveDB(); toast("Risque créé et rattaché à l'enjeu"); return;
  }
  if(sugg.kind==="opportunity"){
    const id = nextId("OPP", DB.risks);
    DB.risks.push({ id, name:sugg.label, level:"opportunite", processId:null, owner:"Non assigné", status:"ouvert", type:"opportunite",
      description:"Opportunité suggérée par l'assistant à partir de l'enjeu « "+sugg.source+" ».", probability:3, impact:3,
      sourceContext:{type:"enjeu", label:sugg.source} });
    saveDB(); toast("Opportunité créée et rattachée à l'enjeu"); return;
  }
  if(sugg.kind==="objective"){
    const id = nextId("OBJ", DB.objectives);
    DB.objectives.push({ id, title:sugg.label, target:"À définir", progress:0, status:"en_cours", processId:null, indicatorIds:[],
      sourceContext:{type:"enjeu", label:sugg.source} });
    saveDB(); toast("Objectif créé et rattaché à l'enjeu"); return;
  }
  if(sugg.kind==="action"){
    const id = nextId("ACT", DB.actions);
    DB.actions.push({ id, title:sugg.label, owner:"Non assigné", due:new Date(Date.now()+30*86400000).toISOString().slice(0,10),
      priority:"moyenne", status:"a_faire", origin:"objectif", originId:null, processId:null,
      sourceContext:{type:"enjeu", label:sugg.source} });
    saveDB(); toast("Action créée et rattachée à l'enjeu"); return;
  }
}

/* ============================================================
   19ter. FORMULAIRES — REVUE DE DIRECTION
   ============================================================ */
function openReviewForm(){
  const latest = getLatestReview();
  openModal({title:"Préparer la revue de direction",
    bodyHtml:`
      <div class="field"><label>Période à analyser</label>
        <select id="qf-period">
          <option value="trimestre">Dernier trimestre</option>
          <option value="semestre" selected>Dernier semestre</option>
          <option value="annee">Dernière année</option>
          <option value="custom">Période personnalisée</option>
        </select>
      </div>
      <div class="field-row" id="qf-custom-dates" style="display:none;">
        <div class="field"><label>Début</label><input type="date" id="qf-start"></div>
        <div class="field"><label>Fin</label><input type="date" id="qf-end"></div>
      </div>
      <p class="text-sm">Qonnect va analyser automatiquement les processus, indicateurs, audits, non-conformités, risques, actions et changements disponibles pour préparer cette revue.</p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Préparer la revue</button>`,
    onMount:(o)=>{
      o.querySelector("#qf-period").addEventListener("change", (e)=> o.querySelector("#qf-custom-dates").style.display = e.target.value==="custom" ? "flex" : "none");
      o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const period = o.querySelector("#qf-period").value;
        const today = new Date();
        let start, end = today.toISOString().slice(0,10);
        if(period==="custom"){ start = o.querySelector("#qf-start").value; end = o.querySelector("#qf-end").value || end; if(!start){ toast("Merci de renseigner une date de début","⚠️"); return; } }
        else{
          const months = period==="trimestre"?3:period==="annee"?12:6;
          const d = new Date(today); d.setMonth(d.getMonth()-months);
          start = d.toISOString().slice(0,10);
        }
        const id = "RD-"+String(Date.now()).slice(-6);
        DB.managementReviews.push({
          id, periodLabel:"Revue du "+fmtDate(start)+" au "+fmtDate(end), periodStart:start, periodEnd:end,
          reviewDate:"", nextReviewDate:"", status:"preparation", previousReviewId: latest?latest.id:null,
          contextChanges:[], decisions:[], conclusion:{smq:"",performance:"",ressources:"",amelioration:"",commentaire:""},
        });
        saveDB(); closeModal(); toast("Revue de direction préparée à partir des données disponibles");
        navigate(`revue-direction/${id}`);
      });
    }
  });
}

function openDecisionForm(reviewId, existing){
  const review = getReview(reviewId);
  openModal({title: existing ? "Modifier la décision" : "Nouvelle décision", wide:true,
    bodyHtml:`
      <div class="field"><label>Décision <span class="req">*</span></label><input type="text" id="qf-decision" value="${esc(existing?.decision||"")}" placeholder="Ex : Renforcer le suivi du processus X"></div>
      <div class="field"><label>Contexte / constat</label><textarea id="qf-contexte">${esc(existing?.contexte||"")}</textarea></div>
      <div class="field"><label>Justification</label><textarea id="qf-justification">${esc(existing?.justification||"")}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Responsable</label><input type="text" id="qf-responsable" value="${esc(existing?.responsable||"")}"></div>
        <div class="field"><label>Échéance</label><input type="date" id="qf-echeance" value="${existing?.echeance||""}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Priorité</label><select id="qf-priorite">${["critique","haute","moyenne","basse"].map(p=>`<option value="${p}" ${existing?.priorite===p?"selected":""}>${LABELS.priority[p].l}</option>`).join("")}</select></div>
        <div class="field"><label>Indicateur associé</label><select id="qf-indicator"><option value="">—</option>${DB.indicators.map(i=>`<option value="${i.id}" ${existing?.indicatorId===i.id?"selected":""}>${esc(i.name)}</option>`).join("")}</select></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">${existing?"Enregistrer":"Ajouter la décision"}</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const decisionText = o.querySelector("#qf-decision").value.trim();
      if(!decisionText){ toast("Merci de saisir une décision","⚠️"); return; }
      const payload = {
        decision:decisionText, contexte:o.querySelector("#qf-contexte").value.trim()||"—",
        justification:o.querySelector("#qf-justification").value.trim()||"—", responsable:o.querySelector("#qf-responsable").value.trim()||"Non assigné",
        echeance:o.querySelector("#qf-echeance").value||"—", priorite:o.querySelector("#qf-priorite").value,
        indicatorId:o.querySelector("#qf-indicator").value||null,
      };
      if(existing){ Object.assign(existing, payload); }
      else{ review.decisions.push({ id:"RDDEC-"+String(Date.now()).slice(-6), ...payload, actionId:null, statut:"a_faire", preuve:"" }); }
      saveDB(); closeModal(); toast(existing?"Décision mise à jour":"Décision ajoutée"); render();
    });}
  });
}

function openDecisionEditForm(reviewId, decisionId){
  const review = getReview(reviewId);
  const d = getDecision(review, decisionId);
  if(!d) return;
  openModal({title:"Mettre à jour la décision",
    bodyHtml:`
      <p class="text-sm mb-2"><strong>${esc(d.decision)}</strong></p>
      <div class="field"><label>Statut</label><select id="qf-statut">${Object.entries(LABELS.decisionStatus).map(([v,l])=>`<option value="${v}" ${d.statut===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
      <div class="field"><label>Preuve associée</label><textarea id="qf-preuve" placeholder="Élément de preuve démontrant la réalisation">${esc(d.preuve)}</textarea></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Enregistrer</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      d.statut = o.querySelector("#qf-statut").value;
      d.preuve = o.querySelector("#qf-preuve").value.trim();
      saveDB(); closeModal(); toast("Décision mise à jour"); render();
    });}
  });
}

function openContextChangeForm(reviewId){
  const review = getReview(reviewId);
  openModal({title:"Ajouter un changement de contexte",
    bodyHtml:`
      <div class="field"><label>Description <span class="req">*</span></label><textarea id="qf-text" placeholder="Ex : Nouvelle réglementation applicable au secteur"></textarea></div>
      <div class="field"><label>Source</label><select id="qf-source"><option value="externe">Contexte externe</option><option value="interne">Contexte interne</option><option value="changement">Changement</option></select></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const t = o.querySelector("#qf-text").value.trim();
      if(!t){ toast("Merci de décrire le changement","⚠️"); return; }
      review.contextChanges.push({id:"CTX-"+String(Date.now()).slice(-6), text:t, source:o.querySelector("#qf-source").value, confirmed:true});
      saveDB(); closeModal(); toast("Changement de contexte ajouté"); render();
    });}
  });
}

function generateReviewReport(review){
  const score = reviewScoreComponents();
  const lines = [];
  lines.push(`Compte-rendu de la Revue de Direction — ${review.periodLabel}`);
  lines.push(`Période analysée : du ${fmtDate(review.periodStart)} au ${fmtDate(review.periodEnd)}. Date de revue : ${fmtDate(review.reviewDate)||"—"}.`);
  lines.push(`Niveau global du système de management : ${score.global} %.`);
  lines.push("");
  lines.push("Résultats analysés : "+DB.objectives.filter(o=>o.status==="atteint").length+"/"+DB.objectives.length+" objectifs atteints, "
    +DB.actions.filter(a=>a.status==="retard").length+" action(s) en retard, "
    +DB.risks.filter(r=>r.type==="risque"&&r.level==="critique"&&r.status==="ouvert").length+" risque(s) critique(s) ouvert(s), "
    +DB.audits.length+" audit(s) réalisés ou planifiés.");
  lines.push("");
  lines.push("Décisions de la Direction :");
  review.decisions.forEach(d=> lines.push("- "+d.decision+" (responsable : "+d.responsable+", échéance : "+fmtDate(d.echeance)+", statut : "+(LABELS.decisionStatus[d.statut]?.l||d.statut)+")"));
  lines.push("");
  const c = review.conclusion;
  lines.push("Conclusion de la Direction :");
  lines.push("- Système de management : "+(LABELS.conclusionSmq[c.smq]||"non renseigné"));
  lines.push("- Performance : "+(LABELS.conclusionPerf[c.performance]||"non renseignée"));
  lines.push("- Ressources : "+(LABELS.conclusionRessources[c.ressources]||"non renseignées"));
  lines.push("- Amélioration : "+(LABELS.conclusionAmelioration[c.amelioration]||"non renseignée"));
  if(c.commentaire) lines.push("- Commentaires : "+c.commentaire);
  return lines.join("\n");
}

/* ============================================================
   20. DÉLÉGATION D'ÉVÉNEMENTS GLOBALE
   ============================================================ */
function initGlobalEvents(){
  document.addEventListener("click", (e)=>{
    const editExigenceEl = e.target.closest("[data-edit-exigence]");
    if(editExigenceEl){
      e.preventDefault();
      const payload = JSON.parse(editExigenceEl.getAttribute("data-edit-exigence"));
      openExigenceEditForm(payload.refId, payload.exigenceId);
      return;
    }
    const routeEl = e.target.closest("[data-route]");
    if(routeEl){
      e.preventDefault();
      closePanel();
      const sr = document.getElementById("search-results");
      if(sr){ sr.classList.remove("open"); }
      const si = document.getElementById("global-search");
      if(si && routeEl.hasAttribute("data-close-search")){ si.value=""; }
      document.getElementById("sidebar").classList.remove("mobile-open");
      document.getElementById("sidebar-scrim").classList.remove("open");
      navigate(routeEl.getAttribute("data-route"));
      return;
    }
    const tabEl = e.target.closest("[data-tab]");
    if(tabEl){
      const parts = parseHash();
      navigate(`${parts[0]}/${parts[1]}/${tabEl.getAttribute("data-tab")}`);
      return;
    }
    const quickEl = e.target.closest("[data-open-quick]");
    if(quickEl){
      openQuickForm(quickEl.getAttribute("data-open-quick"), {
        processId: quickEl.getAttribute("data-preset-process")||null,
        originType: quickEl.getAttribute("data-preset-origin-type")||null,
        originId: quickEl.getAttribute("data-preset-origin-id")||null,
        auditId: quickEl.getAttribute("data-preset-audit")||null,
        templateId: quickEl.getAttribute("data-preset-template")||null,
      });
      return;
    }
    const issueFormEl = e.target.closest("[data-open-issue-form]");
    if(issueFormEl){ openIssueForm(issueFormEl.getAttribute("data-open-issue-form")); return; }
    if(e.target.closest("[data-open-stakeholder-form]")){ openStakeholderForm(); return; }
    const needFormEl = e.target.closest("[data-open-need-form]");
    if(needFormEl){ openNeedForm(needFormEl.getAttribute("data-open-need-form")); return; }
    if(e.target.closest("[data-open-need-global]")){ openNeedFormGlobal(); return; }
    if(e.target.closest("[data-open-orientation-form]")){ openOrientationForm(); return; }
    const fillEl = e.target.closest("[data-ai-suggest-fill]");
    if(fillEl){
      const input = document.getElementById("ctx-assist-input");
      if(input) input.value = fillEl.getAttribute("data-ai-suggest-fill");
      return;
    }
    const suggestIssueEl = e.target.closest("[data-open-contexte-suggest]");
    if(suggestIssueEl){
      const iss = getContextIssue(suggestIssueEl.getAttribute("data-open-contexte-suggest"));
      navigate("contexte/assistant");
      setTimeout(()=>{
        const input = document.getElementById("ctx-assist-input");
        if(input && iss){ input.value = iss.title; document.getElementById("ctx-assist-run")?.click(); }
      }, 0);
      return;
    }
    if(e.target.id==="ctx-assist-run"){
      const val = document.getElementById("ctx-assist-input").value.trim();
      if(!val){ toast("Décrivez d'abord une difficulté","⚠️"); return; }
      const s = contextAssistantSuggest(val);
      document.getElementById("ctx-assist-result").innerHTML = renderAssistantSuggestion(val, s);
      return;
    }
    const acceptEl = e.target.closest("[data-accept-suggestion]");
    if(acceptEl){
      const sugg = JSON.parse(acceptEl.getAttribute("data-accept-suggestion"));
      acceptSuggestion(sugg);
      acceptEl.disabled = true;
      acceptEl.textContent = "✓ Ajouté";
      return;
    }
    if(e.target.id==="save-climate-btn"){
      const c = DB.climate;
      ["q1","q2","q3","q4","q5"].forEach(k=>{ c[k] = document.getElementById("climate-"+k).value==="true"; });
      const trueCount = ["q1","q2","q3","q4","q5"].filter(k=>c[k]).length;
      c.criticality = trueCount>=4 ? "haute" : trueCount>=2 ? "moyenne" : "basse";
      saveDB(); toast("Enjeux climatiques enregistrés"); render();
      return;
    }
    if(e.target.closest("#collapse-btn")){
      const sb = document.getElementById("sidebar");
      sb.classList.toggle("collapsed");
      document.getElementById("collapse-icon").textContent = sb.classList.contains("collapsed")?"»":"«";
      document.getElementById("collapse-text").textContent = sb.classList.contains("collapsed")?"":"Réduire";
      return;
    }
    if(e.target.closest("#mobile-menu-btn")){
      document.getElementById("sidebar").classList.add("mobile-open");
      document.getElementById("sidebar-scrim").classList.add("open");
      return;
    }
    if(e.target.id==="sidebar-scrim"){
      document.getElementById("sidebar").classList.remove("mobile-open");
      document.getElementById("sidebar-scrim").classList.remove("open");
      return;
    }
    if(e.target.closest(".nav-item")){
      document.getElementById("sidebar").classList.remove("mobile-open");
      document.getElementById("sidebar-scrim").classList.remove("open");
    }

    if(e.target.closest("[data-advance-nc]")){
      const id = e.target.closest("[data-advance-nc]").getAttribute("data-advance-nc");
      const ev = getEvent(id);
      if(ev.step < QONNECT_SEED.ncSteps.length-1){ ev.step++; if(ev.step===QONNECT_SEED.ncSteps.length-1) ev.status="cloture"; saveDB(); toast("Étape mise à jour : "+QONNECT_SEED.ncSteps[ev.step]); render(); }
      return;
    }
    if(e.target.closest("[data-rewind-nc]")){
      const id = e.target.closest("[data-rewind-nc]").getAttribute("data-rewind-nc");
      const ev = getEvent(id);
      if(ev.step>0){ ev.step--; ev.status="ouvert"; saveDB(); toast("Retour à l'étape : "+QONNECT_SEED.ncSteps[ev.step]); render(); }
      return;
    }
    if(e.target.closest("[data-advance-change]")){
      const id = e.target.closest("[data-advance-change]").getAttribute("data-advance-change");
      const c = getChange(id);
      if(c.step < QONNECT_SEED.changeSteps.length-1){ c.step++; saveDB(); toast("Étape mise à jour : "+QONNECT_SEED.changeSteps[c.step]); render(); }
      return;
    }
    if(e.target.closest("[data-complete-action]")){
      const id = e.target.closest("[data-complete-action]").getAttribute("data-complete-action");
      const a = getAction(id); a.status="termine"; saveDB(); toast("Action marquée terminée"); applyActionFilters();
      return;
    }
    if(e.target.closest("[data-update-risk-status]")){
      const id = e.target.closest("[data-update-risk-status]").getAttribute("data-update-risk-status");
      const r = getRisk(id); r.status = document.getElementById("risk-status-select").value; saveDB(); toast("Statut du risque mis à jour"); render();
      return;
    }
    if(e.target.closest("[data-archive-doc]")){
      const id = e.target.closest("[data-archive-doc]").getAttribute("data-archive-doc");
      confirmDialog("Archiver ce document ? Il apparaîtra dans les documents obsolètes.", ()=>{
        const d = getDocument(id); d.status="obsolete"; saveDB(); toast("Document archivé"); navigate("documents/obsolete");
      });
      return;
    }
    const trainFormEl = e.target.closest("[data-open-training-form]");
    if(trainFormEl){ openTrainingForm(trainFormEl.getAttribute("data-open-training-form")); return; }
    const markReadEl = e.target.closest("[data-mark-training-read]");
    if(markReadEl){
      const t = findBy(DB.trainings, markReadEl.getAttribute("data-mark-training-read"));
      const remaining = t.audience.filter(n=>!t.completedBy.includes(n));
      if(remaining.length){ t.completedBy.push(remaining[0]); saveDB(); toast(remaining[0]+" a validé sa lecture"); render(); }
      return;
    }

    /* ---- Audits ---- */
    const auditWizEl = e.target.closest("[data-open-audit-wizard]");
    if(auditWizEl){ openAuditWizard({ processId: auditWizEl.getAttribute("data-preset-process")||null }); return; }
    const advAuditEl = e.target.closest("[data-advance-audit]");
    if(advAuditEl){
      const a = getAudit(advAuditEl.getAttribute("data-advance-audit"));
      const idx = AUDIT_WORKFLOW_STEPS.indexOf(a.status);
      if(idx < AUDIT_WORKFLOW_STEPS.length-1){
        a.status = AUDIT_WORKFLOW_STEPS[idx+1];
        saveDB(); toast("Audit passé à l'étape : "+AUDIT_WORKFLOW_LABELS[idx+1]); render();
      }
      return;
    }
    const saveQEl = e.target.closest("[data-save-question]");
    if(saveQEl){
      const payload = JSON.parse(saveQEl.getAttribute("data-save-question"));
      const a = getAudit(payload.auditId);
      const q = findBy(a.questions, payload.questionId);
      q.statut = document.getElementById("q-statut").value;
      q.commentaire = document.getElementById("q-comment").value.trim();
      q.preuveIds = [...document.querySelectorAll(".q-preuve-cb:checked")].map(c=>c.value);
      saveDB(); toast("Réponse enregistrée"); navigate(`audits/${payload.auditId}/grille/${payload.qIdx}`);
      return;
    }
    const genQEl = e.target.closest("[data-generate-questions]");
    if(genQEl){
      const a = getAudit(genQEl.getAttribute("data-generate-questions"));
      const existingTexts = new Set(a.questions.map(q=>q.question));
      const fresh = generateAuditQuestions(a.processIds&&a.processIds.length?a.processIds:[a.processId], a.referentielIds).filter(q=>!existingTexts.has(q.question));
      a.questions.push(...fresh);
      saveDB(); toast(fresh.length+" question(s) générée(s)"); render();
      return;
    }
    const addQEl = e.target.closest("[data-add-question]");
    if(addQEl){ openQuestionAddForm(addQEl.getAttribute("data-add-question")); return; }
    const addPartyEl = e.target.closest("[data-add-party]");
    if(addPartyEl){ openPartyAddForm(addPartyEl.getAttribute("data-add-party")); return; }
    const relaunchEl = e.target.closest("[data-relaunch-party]");
    if(relaunchEl){
      const payload = JSON.parse(relaunchEl.getAttribute("data-relaunch-party"));
      const a = getAudit(payload.auditId);
      const pt = a.parties.find(p=>p.name===payload.partyName);
      if(pt && pt.status==="en_attente") pt.status = "en_cours";
      saveDB(); toast("Relance envoyée à "+payload.partyName+" (simulée)"); render();
      return;
    }
    const editPerimEl = e.target.closest("[data-edit-audit-perimeter]");
    if(editPerimEl){ openPerimeterEditForm(editPerimEl.getAttribute("data-edit-audit-perimeter")); return; }
    const createNcEl = e.target.closest("[data-create-nc-from-constat]");
    if(createNcEl){
      const payload = JSON.parse(createNcEl.getAttribute("data-create-nc-from-constat"));
      const a = getAudit(payload.auditId);
      const f = findBy(a.findings, payload.constatId);
      const id = nextId("EVT", DB.events);
      const graviteToPriority = {critique:"critique", majeure:"haute", mineure:"moyenne"};
      DB.events.push({ id, ref:"NC-"+new Date().getFullYear()+"-"+String(DB.events.length+20).padStart(3,"0"), type:"non_conformite",
        title: f.text.slice(0,80), processId: f.processId||a.processId, priority: graviteToPriority[f.gravite]||"moyenne", status:"ouvert",
        declaredBy: a.responsable||a.auditor||"Audit", date: new Date().toISOString().slice(0,10), step:0, description: f.text, relatedRiskId: f.riskId||null });
      f.ncEventId = id;
      saveDB(); toast("Non-conformité créée dans le module Événements"); render();
      return;
    }
    const createAuditActEl = e.target.closest("[data-create-action-from-constat]");
    if(createAuditActEl){
      const payload = JSON.parse(createAuditActEl.getAttribute("data-create-action-from-constat"));
      const a = getAudit(payload.auditId);
      const f = findBy(a.findings, payload.constatId);
      const id = nextId("ACT", DB.actions);
      DB.actions.push({ id, title:"Traiter le constat : "+f.text.slice(0,60), owner:a.responsable||a.auditor||"Non assigné",
        due:new Date(Date.now()+14*86400000).toISOString().slice(0,10), priority: f.gravite==="critique"?"critique":f.gravite==="majeure"?"haute":"moyenne",
        status:"a_faire", origin:"audit", originId:a.id, processId:f.processId||a.processId });
      f.actionId = id;
      saveDB(); toast("Action créée dans le module Actions"); render();
      return;
    }
    const genAuditReportEl = e.target.closest("[data-generate-audit-report]");
    if(genAuditReportEl){
      const a = getAudit(genAuditReportEl.getAttribute("data-generate-audit-report"));
      const id = nextId("DOC", DB.documents);
      DB.documents.push({ id, ref:"RAP-"+(a.ref||a.id), title:"Rapport d'audit — "+a.title, type:"enregistrement", version:"1.0",
        status:"en_vigueur", processId:a.processId, author:a.responsable||a.auditor||"Audit", approver:a.responsable||"—",
        date:new Date().toISOString().slice(0,10), nextReview:"—", body:generateAuditReportText(a),
        requirementIds:[], riskIds:[], auditIds:[a.id], indicatorIds:[], actionIds:[], crossDocIds:[], flowSteps:[], referentiels:(a.referentielIds||[]).map(rid=>{const r=getReferentiel(rid);return r?r.name:rid;}) });
      saveDB(); toast("Rapport d'audit généré"); navigate(`documents/enregistrement/${id}`);
      return;
    }

    /* ---- Compétences & Habilitations ---- */
    const compFormEl = e.target.closest("[data-open-competence-form]");
    if(compFormEl){ openCompetenceForm(compFormEl.getAttribute("data-open-competence-form")||null); return; }
    const posteFormEl = e.target.closest("[data-open-poste-form]");
    if(posteFormEl){ openPosteForm(posteFormEl.getAttribute("data-open-poste-form")||null); return; }
    const addPosteCompEl = e.target.closest("[data-add-poste-competence]");
    if(addPosteCompEl){ openAddPosteCompetenceForm(addPosteCompEl.getAttribute("data-add-poste-competence")); return; }
    const removePosteCompEl = e.target.closest("[data-remove-poste-competence]");
    if(removePosteCompEl){
      const payload = JSON.parse(removePosteCompEl.getAttribute("data-remove-poste-competence"));
      const poste = getPoste(payload.posteId);
      poste.competencesRequises = poste.competencesRequises.filter(r=>r.competenceId!==payload.competenceId);
      saveDB(); toast("Compétence retirée du poste"); render();
      return;
    }
    const habFormEl = e.target.closest("[data-open-habilitation-form]");
    if(habFormEl){ openHabilitationForm(habFormEl.getAttribute("data-open-habilitation-form")||null); return; }
    const personFormEl = e.target.closest("[data-open-person-form]");
    if(personFormEl){ openPersonForm(personFormEl.getAttribute("data-open-person-form")||null); return; }
    const evalFormEl = e.target.closest("[data-open-evaluation-form]");
    if(evalFormEl){ const payload = JSON.parse(evalFormEl.getAttribute("data-open-evaluation-form")); openEvaluationForm(payload.personId, payload.competenceId); return; }
    const preuveFormEl = e.target.closest("[data-open-preuve-form]");
    if(preuveFormEl){ openPreuveForm(preuveFormEl.getAttribute("data-open-preuve-form"), null); return; }
    const attribHabEl = e.target.closest("[data-attribute-habilitation]");
    if(attribHabEl){ openAttributeHabilitationForm(attribHabEl.getAttribute("data-attribute-habilitation"), null); return; }
    const attribHabForEl = e.target.closest("[data-attribute-habilitation-for]");
    if(attribHabForEl){ openAttributeHabilitationForm(null, attribHabForEl.getAttribute("data-attribute-habilitation-for")); return; }
    const renewHabEl = e.target.closest("[data-renew-habilitation]");
    if(renewHabEl){ renewHabilitation(renewHabEl.getAttribute("data-renew-habilitation")); return; }
    const suspendHabEl = e.target.closest("[data-suspend-habilitation]");
    if(suspendHabEl){
      const ph = findBy(DB.personHabilitations, suspendHabEl.getAttribute("data-suspend-habilitation"));
      const wasActive = ph.statut !== "suspendue";
      const today = new Date().toISOString().slice(0,10);
      ph.historique.push({date:today, action: wasActive?"Suspension":"Réactivation", ancienneValeur:ph.statut, nouvelleValeur: wasActive?"suspendue":"active", commentaire:""});
      ph.statut = wasActive ? "suspendue" : "active";
      saveDB(); toast(wasActive?"Habilitation suspendue":"Habilitation réactivée"); render();
      return;
    }
    const reviewFormEl = e.target.closest("[data-open-review-form]");
    if(reviewFormEl){ openCompetenceReviewForm(reviewFormEl.getAttribute("data-open-review-form")); return; }
    const devActionEl = e.target.closest("[data-create-dev-action]");
    if(devActionEl){
      const payload = JSON.parse(devActionEl.getAttribute("data-create-dev-action"));
      const person = getPerson(payload.personId), comp = getCompetence(payload.competenceId);
      const id = nextId("ACT", DB.actions);
      DB.actions.push({ id, title:"Développer la compétence "+comp.nom+" — "+person.name, owner:person.manager||person.name, due:new Date(Date.now()+30*86400000).toISOString().slice(0,10),
        priority: comp.criticite==="haute"?"haute":"moyenne", status:"a_faire", origin:"competence", originId:null, processId:person.processId,
        personId:person.id, competenceId:comp.id });
      saveDB(); toast("Action de développement créée"); render();
      return;
    }

    /* ---- Fournisseurs ---- */
    const frnFormEl = e.target.closest("[data-open-fournisseur-form]");
    if(frnFormEl){ openFournisseurForm(frnFormEl.getAttribute("data-open-fournisseur-form")||null); return; }
    const frnDocFormEl = e.target.closest("[data-open-fournisseur-doc-form]");
    if(frnDocFormEl){ openFournisseurDocForm(frnDocFormEl.getAttribute("data-open-fournisseur-doc-form")); return; }
    const frnEvalFormEl = e.target.closest("[data-open-fournisseur-eval-form]");
    if(frnEvalFormEl){ openFournisseurEvalForm(frnEvalFormEl.getAttribute("data-open-fournisseur-eval-form")); return; }
    const frnIncFormEl = e.target.closest("[data-open-fournisseur-incident-form]");
    if(frnIncFormEl){ openFournisseurIncidentForm(frnIncFormEl.getAttribute("data-open-fournisseur-incident-form")); return; }
    const createNcFromIncEl = e.target.closest("[data-create-nc-from-incident]");
    if(createNcFromIncEl){
      const inc = getFournisseurIncident(createNcFromIncEl.getAttribute("data-create-nc-from-incident"));
      const f = getFournisseur(inc.fournisseurId);
      const graviteToPriority = {critique:"critique", majeure:"haute", mineure:"moyenne"};
      const id = nextId("EVT", DB.events);
      DB.events.push({ id, ref:"NC-"+new Date().getFullYear()+"-"+String(DB.events.length+30).padStart(3,"0"), type:"non_conformite",
        title:"[Fournisseur "+f.nomCommercial+"] "+inc.description.slice(0,70), processId:inc.processId, priority:graviteToPriority[inc.gravite]||"moyenne", status:"ouvert",
        declaredBy:f.referentInterne||"Fournisseurs", date:new Date().toISOString().slice(0,10), step:0, description:inc.description, relatedRiskId:inc.riskId||null, fournisseurId:f.id });
      inc.ncEventId = id;
      saveDB(); toast("Non-conformité créée dans le module Événements"); render();
      return;
    }
    const createActFromIncEl = e.target.closest("[data-create-action-from-incident]");
    if(createActFromIncEl){
      const inc = getFournisseurIncident(createActFromIncEl.getAttribute("data-create-action-from-incident"));
      const f = getFournisseur(inc.fournisseurId);
      const id = nextId("ACT", DB.actions);
      DB.actions.push({ id, title:"Traiter l'incident fournisseur — "+f.nomCommercial+" : "+inc.description.slice(0,50), owner:f.referentInterne||"Non assigné",
        due:new Date(Date.now()+14*86400000).toISOString().slice(0,10), priority: inc.gravite==="critique"?"critique":inc.gravite==="majeure"?"haute":"moyenne",
        status:"a_faire", origin:"fournisseur", originId:inc.id, processId:inc.processId, fournisseurId:f.id });
      inc.actionId = id;
      saveDB(); toast("Action créée dans le module Actions"); render();
      return;
    }
    if(e.target.closest("[data-print]")){
      toast("Export PDF simulé pour cette démonstration", "🖨");
      return;
    }
    const editRefEl = e.target.closest("[data-edit-ref]");
    if(editRefEl){ openReferentielEditForm(editRefEl.getAttribute("data-edit-ref")); return; }
    const deleteRefEl = e.target.closest("[data-delete-ref]");
    if(deleteRefEl){ deleteReferentiel(deleteRefEl.getAttribute("data-delete-ref")); return; }
    if(e.target.closest("[data-select-ref]")){
      const id = e.target.closest("[data-select-ref]").getAttribute("data-select-ref");
      DB.referentiels.forEach(r=>r.active = (r.id===id));
      saveDB(); toast("Référentiel sélectionné"); render();
      return;
    }
    const impRefEl = e.target.closest("[data-open-referentiel-import]");
    if(impRefEl){
      openReferentielImportModal({
        refId: impRefEl.getAttribute("data-preset-ref")||null,
        newVersion: impRefEl.getAttribute("data-preset-newversion")==="1",
      });
      return;
    }
    const refAiSuggestEl = e.target.closest("[data-ref-ai-suggest]");
    if(refAiSuggestEl){ refAiSend(refAiSuggestEl.getAttribute("data-ref-id"), refAiSuggestEl.getAttribute("data-ref-ai-suggest")); return; }
    if(e.target.id==="ref-ai-send"){
      const refId = e.target.getAttribute("data-ref-id");
      const input = document.getElementById("ref-ai-input");
      refAiSend(refId, input.value); input.value="";
      return;
    }
    if(e.target.id==="reset-data-btn"){
      confirmDialog("Réinitialiser toutes les données de démonstration ? Cette action est irréversible.", ()=>{
        resetDB(); toast("Données réinitialisées"); render();
      });
      return;
    }

    /* ---- Revue de Direction ---- */
    if(e.target.closest("[data-open-review-form]")){ openReviewForm(); return; }
    const advRevEl = e.target.closest("[data-advance-review]");
    if(advRevEl){
      const rv = getReview(advRevEl.getAttribute("data-advance-review"));
      const idx = REVIEW_STEPS.indexOf(rv.status);
      if(idx < REVIEW_STEPS.length-1){
        rv.status = REVIEW_STEPS[idx+1];
        if(rv.status==="revue" && !rv.reviewDate) rv.reviewDate = new Date().toISOString().slice(0,10);
        if(rv.status==="cloturee" && !rv.nextReviewDate){
          const d = new Date(rv.periodEnd || Date.now()); d.setMonth(d.getMonth()+6);
          rv.nextReviewDate = d.toISOString().slice(0,10);
        }
        saveDB(); toast("Revue passée à l'étape : "+REVIEW_STEP_LABELS[idx+1]); render();
      }
      return;
    }
    const newVerEl = e.target.closest("[data-new-review-version]");
    if(newVerEl){
      confirmDialog("Créer une nouvelle version de cette revue de direction (nouvelle période, à partir de celle-ci) ?", ()=>{
        const old = getReview(newVerEl.getAttribute("data-new-review-version"));
        const id = "RD-"+String(Date.now()).slice(-6);
        DB.managementReviews.push({
          id, periodLabel:"Nouvelle période — suite de "+old.periodLabel, periodStart:old.periodEnd, periodEnd:"",
          reviewDate:"", nextReviewDate:"", status:"brouillon", previousReviewId:old.id,
          contextChanges:[], decisions:[], conclusion:{smq:"",performance:"",ressources:"",amelioration:"",commentaire:""},
        });
        saveDB(); toast("Nouvelle version créée"); navigate(`revue-direction/${id}`);
      });
      return;
    }
    const openDecEl = e.target.closest("[data-open-decision-form]");
    if(openDecEl){ openDecisionForm(openDecEl.getAttribute("data-open-decision-form"), null); return; }
    const editDecEl = e.target.closest("[data-edit-decision]");
    if(editDecEl){
      const payload = JSON.parse(editDecEl.getAttribute("data-edit-decision"));
      openDecisionEditForm(payload.reviewId, payload.decisionId);
      return;
    }
    const ctxFormEl = e.target.closest("[data-open-context-change-form]");
    if(ctxFormEl){ openContextChangeForm(ctxFormEl.getAttribute("data-open-context-change-form")); return; }
    const confirmCtxEl = e.target.closest("[data-confirm-context-change]");
    if(confirmCtxEl){
      const payload = JSON.parse(confirmCtxEl.getAttribute("data-confirm-context-change"));
      const rv = getReview(payload.reviewId);
      const chg = rv.contextChanges.find(c=>c.id===payload.changeId);
      if(chg){ chg.confirmed = true; saveDB(); toast("Changement confirmé"); render(); }
      return;
    }
    const convOppEl = e.target.closest("[data-convert-opportunity]");
    if(convOppEl){
      const payload = JSON.parse(convOppEl.getAttribute("data-convert-opportunity"));
      openDecisionForm(payload.reviewId, null);
      const o = document.getElementById("active-overlay");
      if(o){
        o.querySelector("#qf-decision").value = payload.proposal;
        o.querySelector("#qf-contexte").value = payload.source;
      }
      return;
    }
    const createActEl = e.target.closest("[data-create-action-from-decision]");
    if(createActEl){
      const payload = JSON.parse(createActEl.getAttribute("data-create-action-from-decision"));
      const rv = getReview(payload.reviewId);
      const d = getDecision(rv, payload.decisionId);
      const id = nextId("ACT", DB.actions);
      DB.actions.push({ id, title:d.decision, owner:d.responsable, due:d.echeance!=="—"?d.echeance:new Date().toISOString().slice(0,10),
        priority:d.priorite, status:"a_faire", origin:"revue_direction", originId:d.id, processId:null });
      d.actionId = id;
      saveDB(); toast("Action créée à partir de la décision"); render();
      return;
    }
    const saveConclEl = e.target.closest("[data-save-conclusion]");
    if(saveConclEl){
      const rv = getReview(saveConclEl.getAttribute("data-save-conclusion"));
      rv.conclusion = {
        smq: document.getElementById("concl-smq").value,
        performance: document.getElementById("concl-performance").value,
        ressources: document.getElementById("concl-ressources").value,
        amelioration: document.getElementById("concl-amelioration").value,
        commentaire: document.getElementById("concl-commentaire").value.trim(),
      };
      saveDB(); toast("Conclusion enregistrée"); render();
      return;
    }
    const genReportEl = e.target.closest("[data-generate-report]");
    if(genReportEl){
      const rv = getReview(genReportEl.getAttribute("data-generate-report"));
      const id = nextId("DOC", DB.documents);
      const ref = "CR-RD-"+rv.id;
      DB.documents.push({ id, ref, title:"Compte-rendu — Revue de Direction "+rv.periodLabel, type:"enregistrement", version:"1.0",
        status:"en_vigueur", processId:"PROC-001", author:"Direction", approver:"Direction", date:new Date().toISOString().slice(0,10),
        nextReview:"—", body:generateReviewReport(rv) });
      saveDB(); toast("Compte-rendu généré"); navigate(`documents/enregistrement/${id}`);
      return;
    }
    if(e.target.closest("[data-ai-suggest]")){
      const q = e.target.closest("[data-ai-suggest]").getAttribute("data-ai-suggest");
      aiSend(q);
      return;
    }
    if(e.target.id==="ai-send"){ aiSend(document.getElementById("ai-input").value); document.getElementById("ai-input").value=""; return; }

    // close search dropdown on outside click
    if(!e.target.closest(".header-search")){
      const box = document.getElementById("search-results");
      if(box) { box.classList.remove("open"); }
    }
  });

  document.addEventListener("keydown", (e)=>{
    if(e.key==="Escape"){ closeModal(); closePanel(); }
    if(e.key==="Enter" && document.activeElement && document.activeElement.id==="ai-input"){
      aiSend(document.activeElement.value); document.activeElement.value="";
    }
    if(e.key==="Enter" && document.activeElement && document.activeElement.id==="ref-ai-input"){
      const refId = document.getElementById("ref-ai-send")?.getAttribute("data-ref-id");
      refAiSend(refId, document.activeElement.value); document.activeElement.value="";
    }
  });

  document.addEventListener("input", (e)=>{
    if(e.target.id==="global-search"){ renderSearchResults(e.target.value); }
    if(e.target.matches("[data-filter]")){
      const zone = e.target.id.startsWith("f-risk") ? "risk" : e.target.id.startsWith("f-evt") ? "evt" : e.target.id.startsWith("f-act") ? "act" : e.target.id.startsWith("f-comp") ? "comp" : e.target.id.startsWith("f-frn") ? "frn" : null;
      if(zone==="risk") applyRiskFilters();
      if(zone==="evt") applyEventFilters();
      if(zone==="act") applyActionFilters();
      if(zone==="comp") applyCompetenceMatrixFilters();
      if(zone==="frn") applyFournisseurFilters();
    }
  });
  document.addEventListener("change", (e)=>{
    if(e.target.matches("[data-filter]")){
      const zone = e.target.id.startsWith("f-risk") ? "risk" : e.target.id.startsWith("f-evt") ? "evt" : e.target.id.startsWith("f-act") ? "act" : e.target.id.startsWith("f-comp") ? "comp" : e.target.id.startsWith("f-frn") ? "frn" : null;
      if(zone==="risk") applyRiskFilters();
      if(zone==="evt") applyEventFilters();
      if(zone==="act") applyActionFilters();
      if(zone==="comp") applyCompetenceMatrixFilters();
      if(zone==="frn") applyFournisseurFilters();
    }
    if(e.target.id==="review-picker"){ navigate("revue-direction/"+e.target.value); }
  });
}

/* ============================================================
   21. INITIALISATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", ()=>{
  buildShell();
  initGlobalEvents();
  render();
});
