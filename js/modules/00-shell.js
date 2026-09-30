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
  { title:"Groupe", items:[
      {route:"groupe", icon:"🏢", label:"Vision Groupe"},
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
  evenements:"Événements & non-conformités", actions:"Actions", audits:"Audits", competences:"Compétences & Habilitations", fournisseurs:"Fournisseurs", groupe:"Vision Groupe",
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
      <button class="chip" id="scope-pill" style="white-space:nowrap;">🏢 <span id="scope-label"></span></button>
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
  updateScopePill();
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
      case "groupe": html = pageGroupe(); break;
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

