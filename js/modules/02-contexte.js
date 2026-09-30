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

