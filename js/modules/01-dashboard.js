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

