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
  evenements:"Événements & non-conformités", actions:"Actions", audits:"Audits",
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
      case "documents": html = parts[2] ? pageDocumentFiche(parts[2]) : pageDocuments(parts[1]||"all"); break;
      case "risques": html = parts[1] ? pageRiskFiche(parts[1]) : pageRisks(); break;
      case "objectifs": html = pageObjectives(); break;
      case "evenements": html = parts[2] ? pageEventFiche(parts[2]) : pageEvents(parts[1]||"all"); break;
      case "actions": html = pageActions(); break;
      case "audits": html = parts[1] ? pageAuditFiche(parts[1]) : pageAudits(); break;
      case "changements": html = parts[1] ? pageChangeFiche(parts[1]) : pageChanges(); break;
      case "referentiels": html = pageReferentiels(); break;
      case "conformite": html = pageConformite(); break;
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
  const unfavorableAudits = DB.audits.filter(a=>a.findings.some(f=>f.type==="ecart") && a.status!=="cloture");
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
  const auditsOk = DB.audits.filter(a=>!a.findings.some(f=>f.type==="ecart")).length;
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
  DB.audits.filter(a=>a.findings.some(f=>f.type==="ecart")).forEach(a=>{
    opps.push({id:"OPP-AUD-"+a.id, source:"Écart d'audit : "+a.title, analysis:`${a.findings.filter(f=>f.type==="ecart").length} écart(s) relevé(s).`, proposal:`Vérifier l'efficacité des actions correctives associées.`});
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
  const nbEcarts = DB.audits.reduce((s,a)=>s+a.findings.filter(f=>f.type==="ecart").length,0);
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
      {label:"Écarts", render:a=>a.findings.filter(f=>f.type==="ecart").length}, {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
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
  <div class="mt-2"><button class="btn btn-secondary btn-sm" data-route="risques">Ouvrir le registre des risques →</button></div>`;
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
   7. DOCUMENTS
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

function pageDocuments(section){
  let docs;
  let title;
  if(section==="all"){ docs = DB.documents.filter(d=>d.status!=="obsolete"); title="Tous les documents"; }
  else if(section==="obsolete"){ docs = DB.documents.filter(d=>d.status==="obsolete"); title="Documents obsolètes"; }
  else { docs = DB.documents.filter(d=>d.type===section); title = DOC_SECTIONS.find(s=>s.key===section)?.label || "Documents"; }

  const chips = DOC_SECTIONS.map(s=>`<a class="chip ${s.key===section?'active':''}" data-route="documents/${s.key}">${esc(s.label)}</a>`).join("");

  const cards = docs.map(d=>{
    const p = getProcess(d.processId);
    return `<div class="card card-hover" data-route="documents/${d.type}/${d.id}">
      <div class="flex justify-between items-center">
        <span class="text-xs" style="font-weight:700;">${esc(d.ref)}</span>
        ${badge(LABELS.docStatus[d.status])}
      </div>
      <h3 class="mt-2">${esc(d.title)}</h3>
      <p class="text-sm mt-2">${esc(LABELS.docType[d.type]||d.type)} · Version ${esc(d.version)}</p>
      <p class="text-xs mt-2">Processus : ${p?esc(p.name):"—"} · Révision : ${fmtDate(d.nextReview)}</p>
    </div>`;
  }).join("");

  return `
  ${pageHeader("Documentation du SMQ", "Politique, charte, manuel, procédures, modes opératoires et enregistrements.",
    `<button class="btn btn-primary" data-open-quick="document">+ Nouveau document</button>`)}
  <div class="filters-bar">${chips}</div>
  <h2 class="mb-2" style="font-size:15px;color:var(--text-secondary);font-weight:650;">${esc(title)} (${docs.length})</h2>
  ${docs.length ? `<div class="grid grid-3">${cards}</div>` : `<div class="card">${emptyState("📭","Aucun document","Aucun document dans cette catégorie pour le moment.")}</div>`}`;
}

function pageDocumentFiche(id){
  const d = getDocument(id);
  if(!d) return emptyState("📄","Document introuvable","Ce document n'existe pas.");
  const p = getProcess(d.processId);
  const relatedRisks = DB.risks.filter(r=>d.type==="procedure" && r.processId===d.processId).slice(0,3);
  const relatedActions = DB.actions.filter(a=>a.processId===d.processId).slice(0,3);
  const relatedAudits = DB.audits.filter(a=>a.processId===d.processId).slice(0,2);
  const history = DB.documentHistory[d.id] || [{version:d.version, date:d.date, note:"Version en vigueur"}];

  return `
  ${breadcrumb([{label:"Documents",href:"#/documents/all"},{label:LABELS.docType[d.type]||d.type,href:"#/documents/"+d.type},{label:d.title}])}
  <div class="grid" style="grid-template-columns:2fr 1fr;gap:24px;">
    <div>
      <div class="card mb-2">
        <div class="flex justify-between items-center">
          <span class="badge badge-neutral">${esc(d.ref)}</span>
          ${badge(LABELS.docStatus[d.status])}
        </div>
        <h1 class="mt-2">${esc(d.title)}</h1>
        <p class="section-sub mt-2">${esc(LABELS.docType[d.type]||d.type)} · Version ${esc(d.version)}</p>
        <div class="grid grid-2 mt-4">
          <div><div class="text-xs">AUTEUR</div><div class="text-sm" style="color:var(--text-primary)">${esc(d.author)}</div></div>
          <div><div class="text-xs">APPROBATEUR</div><div class="text-sm" style="color:var(--text-primary)">${esc(d.approver)}</div></div>
          <div><div class="text-xs">DATE</div><div class="text-sm" style="color:var(--text-primary)">${fmtDate(d.date)}</div></div>
          <div><div class="text-xs">PROCHAINE RÉVISION</div><div class="text-sm" style="color:var(--text-primary)">${fmtDate(d.nextReview)}</div></div>
        </div>
      </div>
      <div class="card mb-2">
        <h3 class="mb-2">Contenu</h3>
        <p class="text-sm" style="color:var(--text-primary);line-height:1.7;">${esc(d.body)}</p>
      </div>
      <div class="card">
        <h3 class="mb-2">Historique</h3>
        ${history.map(h=>`<div class="rel-link"><span class="rel-name">Version ${esc(h.version)}</span><span class="text-sm">${fmtDate(h.date)}${h.note?" · "+esc(h.note):""}</span></div>`).join("")}
      </div>
    </div>
    <div>
      <div class="card mb-2">
        <h3 class="mb-2">Document associé à</h3>
        ${p?`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`:""}
        ${relatedRisks.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">⚠️ ${esc(r.name)}</span><span class="chev">›</span></div>`).join("")}
        ${relatedActions.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">✅ ${esc(a.title)}</span><span class="chev">›</span></div>`).join("")}
        ${relatedAudits.map(a=>`<div class="rel-link" data-route="audits/${a.id}"><span class="rel-name">🔍 ${esc(a.title)}</span><span class="chev">›</span></div>`).join("")}
        ${(!p && !relatedRisks.length && !relatedActions.length && !relatedAudits.length)?`<p class="text-sm">Aucune relation enregistrée.</p>`:""}
      </div>
      <div class="card">
        <h3 class="mb-2">Actions</h3>
        <button class="btn btn-secondary btn-block mb-2" data-print>🖨 Exporter en PDF (démo)</button>
        <button class="btn btn-danger btn-block" data-archive-doc="${d.id}">Archiver</button>
      </div>
    </div>
  </div>`;
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
   12. AUDITS
   ============================================================ */
function pageAudits(){
  return `
  ${pageHeader("Audits","Programme et suivi des audits internes.",
    `<button class="btn btn-primary" data-open-quick="audit">+ Créer un audit</button>`)}
  ${dataTable(
    [ {label:"Audit", render:a=>`<div class="cell-title">${esc(a.title)}</div>`},
      {label:"Processus", render:a=>{const p=getProcess(a.processId); return p?esc(p.name):"—";}},
      {label:"Auditeur", render:a=>esc(a.auditor)},
      {label:"Date", render:a=>fmtDate(a.date)},
      {label:"Constats", render:a=>a.findings.length},
      {label:"Statut", render:a=>badge(LABELS.auditStatus[a.status])} ],
    DB.audits, {rowRoute:a=>`audits/${a.id}`, emptyEmoji:"🔍", emptyTitle:"Aucun audit", emptyText:"Aucun audit n'est encore planifié."}
  )}`;
}
function pageAuditFiche(id){
  const a = getAudit(id);
  if(!a) return emptyState("🔍","Audit introuvable","Cet audit n'existe pas.");
  const p = getProcess(a.processId);
  return `
  ${breadcrumb([{label:"Audits",href:"#/audits"},{label:a.title}])}
  <div class="grid" style="grid-template-columns:2fr 1fr;gap:24px;">
    <div>
      <div class="card mb-2">
        <div class="flex justify-between items-center">${badge(LABELS.auditStatus[a.status])}</div>
        <h1 class="mt-2">${esc(a.title)}</h1>
        <p class="section-sub mt-2">Processus : ${p?esc(p.name):"—"} · Auditeur : ${esc(a.auditor)} · Date : ${fmtDate(a.date)}</p>
        <div class="grid grid-2 mt-4">
          <div><div class="text-xs">OBJECTIF</div><p class="text-sm mt-2" style="color:var(--text-primary)">${esc(a.objective)}</p></div>
          <div><div class="text-xs">PÉRIMÈTRE</div><p class="text-sm mt-2" style="color:var(--text-primary)">${esc(a.scope)}</p></div>
        </div>
      </div>
      <div class="card">
        <div class="flex justify-between items-center mb-2"><h3>Constats</h3>
          <button class="btn btn-secondary btn-sm" data-open-quick="finding" data-preset-audit="${a.id}">+ Ajouter un constat</button>
        </div>
        ${a.findings.length ? a.findings.map(f=>`
          <div class="rel-link" style="align-items:flex-start;">
            <div>
              ${f.type==="ecart"?badge(LABELS.priority.haute,"Écart"):badgeRaw("info","Point fort")}
              <p class="text-sm mt-2" style="color:var(--text-primary)">${esc(f.text)}</p>
            </div>
            ${f.actionId?`<span class="badge badge-neutral">Action générée</span>`:""}
          </div>`).join("") : `<p class="text-sm">Aucun constat enregistré pour cet audit.</p>`}
      </div>
    </div>
    <div class="card">
      <h3 class="mb-2">Relations</h3>
      ${p?`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`:""}
      ${a.findings.filter(f=>f.actionId).map(f=>`<div class="rel-link" data-route="actions"><span class="rel-name">✅ ${esc(getAction(f.actionId)?.title||"Action")}</span><span class="chev">›</span></div>`).join("")}
    </div>
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
   14. RÉFÉRENTIELS & CONFORMITÉ
   ============================================================ */
function pageReferentiels(){
  return `
  ${pageHeader("Référentiels","Sélectionnez le référentiel applicable à votre organisation.")}
  <div class="grid grid-3">
    ${DB.referentiels.map(r=>`
      <div class="card ${r.active?'':'card-hover'}" ${r.active?'':`data-select-ref="${r.id}"`} style="${r.active?'border-color:var(--primary);':''}">
        <div class="flex justify-between items-center">
          <h3>${esc(r.name)}</h3>
          ${r.active?badgeRaw("success","Actif"):""}
        </div>
        <p class="text-sm mt-2">${esc(r.desc)}</p>
        ${r.active?`<a class="btn btn-primary btn-sm mt-4" data-route="conformite">Voir la conformité</a>`:`<button class="btn btn-secondary btn-sm mt-4" data-select-ref="${r.id}">Sélectionner</button>`}
      </div>`).join("")}
  </div>`;
}
function pageConformite(){
  const reqs = DB.requirements;
  const total = reqs.length;
  const counts = {maitrise:0,a_renforcer:0,non_couvert:0};
  reqs.forEach(r=>counts[r.status]++);
  const pct = Math.round((counts.maitrise/total)*100);
  return `
  ${pageHeader("Conformité","Maîtrise des exigences ISO 9001:2026 (exigences simplifiées à des fins de démonstration).")}
  <div class="card mb-2">
    <div class="flex items-center gap-3" style="flex-wrap:wrap;">
      ${ringGauge(pct, "var(--primary)", 88)}
      <div>
        <div class="kpi"><div class="val">${pct} %</div><div class="lbl">Maîtrise du référentiel — ISO 9001:2026</div></div>
        <div class="flex gap-3 mt-2">
          ${badgeRaw("success", counts.maitrise+" maîtrisées")}
          ${badgeRaw("warning", counts.a_renforcer+" à renforcer")}
          ${badgeRaw("danger", counts.non_couvert+" non couvertes")}
        </div>
      </div>
    </div>
  </div>
  ${dataTable(
    [ {label:"Référence", render:r=>`<strong>${esc(r.ref)}</strong>`},
      {label:"Exigence", render:r=>esc(r.label)},
      {label:"Processus", render:r=>{const p=getProcess(r.processId); return p?esc(p.name):"—";}},
      {label:"Statut", render:r=>badge(LABELS.reqStatus[r.status])} ],
    reqs
  )}
  <p class="text-xs mt-2">Ce prototype ne reproduit pas le texte officiel de la norme ISO 9001. Les exigences affichées sont simplifiées à des fins de démonstration.</p>`;
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
    openModal({title:"Nouveau document", wide:true,
      bodyHtml:`
        <div class="field"><label>Type de document <span class="req">*</span></label>
          <select id="qf-type">
            <option value="politique">Politique qualité</option><option value="charte">Charte qualité</option>
            <option value="manuel">Manuel qualité</option><option value="procedure">Procédure</option>
            <option value="mode_operatoire">Mode opératoire</option><option value="instruction">Instruction</option>
            <option value="formulaire">Formulaire</option>
          </select></div>
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Gestion des non-conformités"></div>
        <div class="field-row">
          <div class="field"><label>Référence</label><input type="text" id="qf-ref" placeholder="Ex : PR-020"></div>
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
        </div>
        <div id="qf-procedure-template" class="field hidden">
          <label>Trame proposée pour une procédure</label>
          <div class="text-sm" style="line-height:1.9;color:var(--text-primary);">
            1. Objet · 2. Champ d'application · 3. Responsabilités · 4. Définitions · 5. Déroulement<br>
            6. Documents associés · 7. Enregistrements · 8. Indicateurs · 9. Risques · 10. Références
          </div>
        </div>
        <div class="field"><label>Contenu</label>
          <div class="editor-toolbar"><button type="button">B</button><button type="button"><i>I</i></button><button type="button">H1</button><button type="button">• Liste</button></div>
          <div class="editor-area" id="qf-body" contenteditable="true">Rédigez le contenu du document…</div>
        </div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Créer le document</button>`,
      onMount:(o)=>{
        const typeSel = o.querySelector("#qf-type");
        const toggleTpl = ()=> o.querySelector("#qf-procedure-template").classList.toggle("hidden", typeSel.value!=="procedure");
        typeSel.addEventListener("change", toggleTpl); toggleTpl();
        o.querySelector("#qf-submit").addEventListener("click", ()=>{
          const title = o.querySelector("#qf-title").value.trim();
          if(!title){ toast("Merci de saisir un titre","⚠️"); return; }
          const type = typeSel.value;
          const id = nextId("DOC", DB.documents);
          const ref = o.querySelector("#qf-ref").value.trim() || (type.slice(0,3).toUpperCase()+"-"+String(DB.documents.length+20).padStart(3,"0"));
          DB.documents.push({ id, ref, title, type, version:"1.0", status:"brouillon",
            processId:o.querySelector("#qf-process").value||presets.processId||null, author:"Vous", approver:"—",
            date:new Date().toISOString().slice(0,10), nextReview:"—", body:o.querySelector("#qf-body").innerText.trim() });
          saveDB(); closeModal(); toast("Document créé avec succès"); navigate(`documents/${type}/${id}`);
        });
      }
    });
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
    openModal({title:"Créer un audit",
      bodyHtml:`
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Audit interne Production"></div>
        <div class="field-row">
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
          <div class="field"><label>Date</label><input type="date" id="qf-date"></div>
        </div>
        <div class="field"><label>Auditeur</label><input type="text" id="qf-auditor" placeholder="Nom de l'auditeur"></div>
        <div class="field"><label>Objectif de l'audit</label><textarea id="qf-obj"></textarea></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Créer l'audit</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un titre","⚠️"); return; }
        const id = nextId("AUD", DB.audits);
        DB.audits.push({ id, title, processId:o.querySelector("#qf-process").value||presets.processId||null,
          objective:o.querySelector("#qf-obj").value.trim()||"—", scope:"—", auditor:o.querySelector("#qf-auditor").value.trim()||"Non assigné",
          date:o.querySelector("#qf-date").value||new Date().toISOString().slice(0,10), status:"planifie", findings:[] });
        saveDB(); closeModal(); toast("Audit créé avec succès"); navigate(`audits/${id}`);
      });}
    });
  }

  else if(kind==="finding"){
    openModal({title:"Ajouter un constat",
      bodyHtml:`
        <div class="field"><label>Type</label><select id="qf-type"><option value="ecart">Écart</option><option value="point_fort">Point fort</option></select></div>
        <div class="field"><label>Constat <span class="req">*</span></label><textarea id="qf-text"></textarea></div>
        <div class="field"><label><input type="checkbox" id="qf-gen-action" style="width:auto;margin-right:6px;">Générer automatiquement une action corrective</label></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const text = o.querySelector("#qf-text").value.trim();
        if(!text){ toast("Merci de décrire le constat","⚠️"); return; }
        const audit = getAudit(presets.auditId);
        const type = o.querySelector("#qf-type").value;
        const fid = "C-"+String(Date.now()).slice(-5);
        let actionId = null;
        if(o.querySelector("#qf-gen-action").checked && type==="ecart"){
          actionId = nextId("ACT", DB.actions);
          DB.actions.push({ id:actionId, title:"Traiter le constat : "+text.slice(0,60), owner:audit.auditor, due:new Date(Date.now()+14*86400000).toISOString().slice(0,10),
            priority:"moyenne", status:"a_faire", origin:"audit", originId:audit.id, processId:audit.processId });
        }
        audit.findings.push({id:fid, type, text, actionId});
        saveDB(); closeModal(); toast("Constat ajouté"+(actionId?" — action générée":"")); render();
      });}
    });
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
    if(e.target.closest("[data-print]")){
      toast("Export PDF simulé pour cette démonstration", "🖨");
      return;
    }
    if(e.target.closest("[data-select-ref]")){
      const id = e.target.closest("[data-select-ref]").getAttribute("data-select-ref");
      DB.referentiels.forEach(r=>r.active = (r.id===id));
      saveDB(); toast("Référentiel sélectionné"); render();
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
  });

  document.addEventListener("input", (e)=>{
    if(e.target.id==="global-search"){ renderSearchResults(e.target.value); }
    if(e.target.matches("[data-filter]")){
      const zone = e.target.id.startsWith("f-risk") ? "risk" : e.target.id.startsWith("f-evt") ? "evt" : e.target.id.startsWith("f-act") ? "act" : null;
      if(zone==="risk") applyRiskFilters();
      if(zone==="evt") applyEventFilters();
      if(zone==="act") applyActionFilters();
    }
  });
  document.addEventListener("change", (e)=>{
    if(e.target.matches("[data-filter]")){
      const zone = e.target.id.startsWith("f-risk") ? "risk" : e.target.id.startsWith("f-evt") ? "evt" : e.target.id.startsWith("f-act") ? "act" : null;
      if(zone==="risk") applyRiskFilters();
      if(zone==="evt") applyEventFilters();
      if(zone==="act") applyActionFilters();
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
