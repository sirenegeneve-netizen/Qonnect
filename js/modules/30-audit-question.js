/* ============================================================
   AUDITS — parcours d'une question d'audit
   Exigence → Pratique observée → Preuves → Analyse Qonnect → Proposition → Décision de l'auditeur
   (la logique d'analyse est dans js/audit-analysis.js ; ici : écrans, formulaires, actions)
   ============================================================ */

const AQ_STATUS_EMOJI = { conforme:"🟢", partiellement_conforme:"🟠", non_conforme:"🔴", non_applicable:"⚪", a_verifier:"🔵", non_evalue:"⚪" };
const AQ_DECISION_SOURCE = {
  proposition_acceptee:"Proposition Qonnect acceptée",
  aligne:"Statut retenu identique à la proposition Qonnect",
  modifie:"Évaluation modifiée par l'auditeur (différente de la proposition)",
  manuel:"Évaluation saisie par l'auditeur sans analyse Qonnect",
  historique:"Évaluation saisie avant l'introduction de l'analyse Qonnect",
};
const AQ_ANALYSIS_STATE_BADGE = {
  none:  { l:"À analyser", c:"neutral" },
  fresh: { l:"Analyse disponible", c:"info" },
  stale: { l:"Analyse à relancer", c:"warning" },
};

function aqStatusBadge(st, withEmoji){ return badge(LABELS.questionStatus[st]||LABELS.questionStatus.non_evalue, withEmoji?AQ_STATUS_EMOJI[st]:""); }
function aqFmtDateTime(iso){
  if(!iso) return "—";
  const d = new Date(iso); if(isNaN(d)) return iso;
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})+" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
}
function aqStepHead(n, title, rightHtml, cls){
  return `<div class="aq-step-head"><span class="aq-num">${n}</span><h3>${esc(title)}</h3>${rightHtml||""}</div>`;
}
function aqEvidenceCount(q){ return (q.preuves||[]).length; }
function aqFindingsOf(a, q){ return (a.findings||[]).filter(f=>f.questionId===q.id); }

/* ---------- Écran « Grille d'audit » ---------- */
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
  const answered = a.questions.filter(x=>x.statut && x.statut!=="non_evalue").length;
  const state = getAnalysisState(a, q);

  return `
  <div class="card mb-4">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:8px;"><span class="text-sm" style="font-weight:700;">${answered} / ${total} questions évaluées par l'auditeur</span>
      ${!isLocked?`<span class="flex gap-2"><button class="btn btn-secondary btn-sm" data-add-question="${a.id}">+ Ajouter une question</button><button class="btn btn-secondary btn-sm" data-generate-questions="${a.id}">🧠 Générer plus</button></span>`:""}
    </div>
    <div class="progress mt-2"><div style="width:${Math.round(answered/total*100)}%"></div></div>
    <details class="aq-details" open><summary>Questions de l'audit (${total})</summary>${aqSummaryTable(a, idx)}</details>
  </div>
  <div id="aq-root" data-audit="${esc(a.id)}" data-question="${esc(q.id)}" data-idx="${idx}">
    ${aqCardExigence(a, q, idx, total)}
    ${aqCardPratique(a, q, isLocked)}
    ${aqCardPreuves(a, q, isLocked)}
    ${aqCardAnalyse(a, q, state, isLocked)}
    ${aqCardProposition(a, q, state)}
    ${aqCardValidation(a, q, state, isLocked)}
    <div class="flex justify-between mt-4">
      <button class="btn btn-secondary" ${idx<=0?"disabled":""} data-route="audits/${a.id}/grille/${idx-1}">← Question précédente</button>
      <button class="btn btn-secondary" ${idx>=total-1?"disabled":""} data-route="audits/${a.id}/grille/${idx+1}">Question suivante →</button>
    </div>
  </div>`;
}

/* Tableau de synthèse : # · Référence · Question · Preuves · Analyse · Statut. Aucun pourcentage de conformité. */
function aqSummaryTable(a, idx){
  const rows = a.questions.map((qq,i)=>{
    const ex = resolveExigenceFull(qq.requirementId);
    const st = getAnalysisState(a, qq);
    const proposal = qq.analyse && qq.analyse.result ? qq.analyse.result.proposedStatus : null;
    const final = qq.statut || "non_evalue";
    const title = ex ? ex.title : qq.question;
    return `<tr class="clickable" data-route="audits/${a.id}/grille/${i}" style="${i===idx?'background:var(--primary-soft);':''}">
      <td data-label="#">${i+1}</td>
      <td data-label="Référence">${esc(ex?ex.ref:(qq.critere||"—"))}${ex?`<div class="cell-sub">${esc(ex.referentielName)}</div>`:""}</td>
      <td data-label="Question"><div class="cell-title">${esc(title)}</div>${ex?`<div class="cell-sub">${esc(qq.question.length>90?qq.question.slice(0,89)+"…":qq.question)}</div>`:""}</td>
      <td data-label="Preuves">${aqEvidenceCount(qq)}</td>
      <td data-label="Analyse">${badge(AQ_ANALYSIS_STATE_BADGE[st])}</td>
      <td data-label="Statut">${aqStatusBadge(final, true)}${final==="non_evalue" && proposal && st!=="none" ? `<div class="cell-sub">Proposition : ${esc(LABELS.questionStatus[proposal].l)}</div>`:""}</td>
    </tr>`;
  }).join("");
  return `<div class="table-wrap mt-2"><table class="dt"><thead><tr><th>#</th><th>Référence</th><th>Question</th><th>Preuves</th><th>Analyse</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---------- Étape 1 — Exigence et question ---------- */
function aqCardExigence(a, q, idx, total){
  const ex = resolveExigenceFull(q.requirementId);
  const proc = getProcess(q.processId);
  const input = buildAnalysisInput(a, q);
  const attendus = input.exigence.attendus;
  const attendusNote = input.exigence.attendusSource==="exigence" ? ""
    : input.exigence.attendusSource==="preuve_attendue" ? `Aucun attendu n'est défini sur cette exigence : Qonnect s'appuie sur la « preuve attendue » indiquée dans la question.`
    : `Aucun attendu n'est défini pour cette exigence : l'analyse ne pourra pas mettre les éléments en regard (vous pouvez renseigner les attendus dans Référentiels).`;
  return `
  <div class="card aq-step">
    ${aqStepHead(1, "Exigence et question", `<span class="text-sm">Question ${idx+1} / ${total}</span>`)}
    <div class="flex gap-2" style="flex-wrap:wrap;">
      ${ex?badgeRaw("info", ex.referentielName)+badgeRaw("neutral", ex.ref):badgeRaw("neutral", q.critere||"Hors référentiel")}
      ${aqStatusBadge(q.statut||"non_evalue", true)}
    </div>
    ${ex?`<div class="cell-title mt-2" style="font-size:16px;">${esc(ex.title)}</div>`:""}
    <p class="aq-question">« ${esc(q.question)} »</p>
    <div class="aq-facts">
      <div class="aq-fact"><div class="k">Référentiel</div><div class="v">${ex?esc(ex.referentielName):"—"}</div></div>
      <div class="aq-fact"><div class="k">Référence</div><div class="v">${esc(ex?ex.ref:(q.critere||"—"))}</div></div>
      <div class="aq-fact"><div class="k">Processus</div><div class="v">${proc?esc(proc.name):"—"}</div></div>
      <div class="aq-fact"><div class="k">Responsable interrogé</div><div class="v">${esc(q.responsableInterroge||"—")}</div></div>
      ${q.critere && ex && q.critere!==ex.ref ? `<div class="aq-fact"><div class="k">Critère</div><div class="v">${esc(q.critere)}</div></div>`:""}
      <div class="aq-fact"><div class="k">Preuve attendue</div><div class="v">${esc(q.preuveAttendue||"—")}</div></div>
    </div>
    ${ex&&ex.summary?`<div class="mt-4"><div class="aq-fact"><div class="k">Résumé de l'attendu</div><div class="v">${esc(ex.summary)}</div></div></div>`:""}
    ${attendus.length && input.exigence.attendusSource==="exigence" ? `<details class="aq-details"><summary>Éléments à pouvoir démontrer (${attendus.length})</summary><ul style="margin:8px 0 0 18px;padding:0;font-size:13px;">${attendus.map(x=>`<li>${esc(x.label)}</li>`).join("")}</ul><p class="text-xs mt-2">Synthèse interne rédigée par Qonnect — pas un extrait de la norme.</p></details>`:""}
    ${attendusNote?`<div class="aq-callout warn">${esc(attendusNote)}</div>`:""}
  </div>`;
}

/* ---------- Étape 2 — Pratique observée ---------- */
function aqCardPratique(a, q, locked){
  const done = (q.pratique||"").trim().length>0;
  return `
  <div class="card aq-step ${done?'is-done':''}">
    ${aqStepHead(2, "Pratique observée / réponse", done?badgeRaw("success","Décrite"):badgeRaw("neutral","À décrire"))}
    <p class="cell-title" style="font-size:15px;">Comment l'organisation fait-elle concrètement ?</p>
    <p class="aq-help mt-2">Décrivez la manière dont l'activité est réellement réalisée : pratiques, étapes, responsabilités, contrôles, critères, outils, enregistrements, indicateurs, etc. Cette description est une donnée essentielle de l'analyse Qonnect.</p>
    ${locked
      ? `<p class="text-sm" style="color:var(--text-primary);white-space:pre-wrap;">${esc(q.pratique||"—")}</p>`
      : `<textarea class="aq-textarea" id="aq-pratique" placeholder="Ex : La production est planifiée à partir des commandes validées. Les paramètres critiques sont définis dans les instructions de fabrication…">${esc(q.pratique||"")}</textarea>
         <div class="aq-actions"><button class="btn btn-primary" data-aq-action="save-pratique">Enregistrer la description</button></div>`}
  </div>`;
}

/* ---------- Étape 3 — Éléments de preuve ---------- */
function aqEvidenceItemHtml(a, q, ev, locked){
  const t = getEvidenceType(ev.type);
  const r = resolveEvidence(ev);
  const usages = ev.refKind ? getEvidenceUsages(ev.refKind, ev.refId).filter(u=>!(u.auditId===a.id && u.questionId===q.id)) : [];
  const titleHtml = r.route ? `<span data-route="${esc(r.route)}">${esc(r.title)}</span>` : esc(r.title);
  return `<div class="aq-ev" data-ev="${esc(ev.id)}">
    <div class="aq-ev-icon">${t.icon}</div>
    <div class="aq-ev-main">
      <div class="aq-ev-title">${titleHtml}</div>
      <div class="aq-ev-meta">${esc(t.label)}${r.subtitle?" · "+esc(r.subtitle):""}${ev.date?" · "+esc(fmtDate(ev.date)):""}</div>
      ${ev.description?`<div class="aq-ev-meta" style="color:var(--text-primary);">${esc(ev.description)}</div>`:""}
      ${ev.url?`<div class="aq-ev-meta"><a href="${esc(ev.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary);">${esc(ev.url)}</a></div>`:""}
      ${ev.fileName?`<div class="aq-ev-meta">📁 ${esc(ev.fileName)}${ev.fileSize?" ("+Math.max(1,Math.round(ev.fileSize/1024))+" Ko)":""} — référence du fichier uniquement, le contenu n'est pas stocké dans Qonnect</div>`:""}
      <div class="aq-chips">
        <span class="badge badge-neutral">${esc(ev.id)}</span>
        ${r.missing?badgeRaw("danger","Élément introuvable"):""}
        ${usages.length?`<span class="badge badge-info" title="${esc(usages.map(u=>u.auditRef+" · "+u.requirementRef).join("\n"))}"><span class="badge-dot"></span>Aussi utilisée dans ${usages.length} autre(s) question(s)</span>`:""}
      </div>
    </div>
    ${!locked?`<button class="btn btn-ghost btn-sm" data-aq-action="remove-preuve" data-ev-id="${esc(ev.id)}" title="Retirer cette preuve de la question (l'objet Qonnect n'est pas supprimé)">✕</button>`:""}
  </div>`;
}
function aqCardPreuves(a, q, locked){
  const list = q.preuves||[];
  return `
  <div class="card aq-step ${list.length?'is-done':''}">
    ${aqStepHead(3, "Éléments de preuve", `<span class="badge badge-neutral">${list.length} preuve(s)</span>`)}
    <p class="aq-help">Démontrez ce que vous venez de décrire. Ajoutez plusieurs preuves : un objet déjà présent dans Qonnect (référencé, jamais dupliqué) ou une preuve externe.</p>
    ${list.length ? list.map(ev=>aqEvidenceItemHtml(a,q,ev,locked)).join("") : `<p class="text-sm">Aucune preuve n'est encore référencée pour cette question.</p>`}
    ${!locked?`<div class="aq-actions"><button class="btn btn-secondary" data-aq-action="add-preuve">+ Ajouter une preuve</button></div>`:""}
  </div>`;
}

/* ---------- Étape 4 — Analyse Qonnect ---------- */
function aqEngineBadge(engine){
  return engine.isAI ? badgeRaw("info", engine.local ? "IA locale — aucune donnée envoyée" : "Analyse par IA — "+engine.label) : badgeRaw("warning","Moteur à règles — provisoire");
}
function aqCardAnalyse(a, q, state, locked){
  const engine = q.analyse ? q.analyse.engine : getActiveAnalysisEngine();
  const canRun = (q.pratique||"").trim() || aqEvidenceCount(q)>0;
  let body = "";
  if(state==="none"){
    body = `<p class="text-sm">Après l'enregistrement de la pratique et des preuves, Qonnect met vos éléments en regard de l'exigence : ce qui est démontré, ce qui manque, et pourquoi. Cette analyse est une <strong>aide à l'évaluation</strong> ; elle n'a aucune valeur de décision.</p>
      ${!locked?`<div class="aq-actions"><button class="btn btn-primary" data-aq-action="analyse" ${canRun?"":"disabled"}>🔎 Analyser les éléments</button></div>${engine.local && typeof LOCAL_LLM_STATE!=="undefined" && LOCAL_LLM_STATE.status!=="ready" ? `<p class="text-xs mt-2">L'IA locale n'est pas encore chargée : le premier lancement télécharge le modèle (voir Administration → Moteur d'analyse des audits).</p>`:""}${canRun?"":`<p class="text-xs mt-2">Décrivez la pratique ou ajoutez au moins une preuve pour lancer l'analyse.</p>`}`:""}
      <div class="aq-callout warn">${esc(engine.disclaimer||"")}</div>`;
  } else {
    const an = q.analyse, r = an.result;
    const covered = r.coveredElements, missing = r.missingElements;
    body = `
      ${state==="stale"?`<div class="aq-callout warn" style="margin-top:0;margin-bottom:12px;"><strong>Cette analyse n'est plus à jour.</strong> La pratique, les preuves ou les attendus ont changé depuis l'analyse du ${esc(aqFmtDateTime(an.analyzedAt))}. Relancez l'analyse avant de vous y référer.</div>`:""}
      <p class="text-xs">Analyse réalisée le ${esc(aqFmtDateTime(an.analyzedAt))} par ${esc(an.engine.label)} (v${esc(an.engine.version)})</p>
      <details class="aq-details" open><summary>Éléments identifiés</summary>
        <div class="mt-2">
          ${covered.map(c=>`<div class="aq-line"><span class="aq-mark ok">✓</span><div><div class="cell-title">${esc(c.label)}</div><div class="text-sm">Preuve : ${c.evidence.map(h=>esc(h.title)).join(" ; ")}</div><div class="text-xs">Rapprochement : ${c.evidence.map(h=>esc(h.via)+(h.terms&&h.terms.length?" (« "+esc(h.terms.join(", "))+" »)":"")).join(" ; ")}</div>${c.reason?`<div class="text-xs">Raisonnement du modèle : ${esc(c.reason)}</div>`:""}</div></div>`).join("")}
          ${missing.map(m=>`<div class="aq-line"><span class="aq-mark ko">⚠</span><div><div class="cell-title">Élément à compléter — ${esc(m.label)}</div><div class="text-sm">${esc(m.reason)}</div></div></div>`).join("")}
          ${!covered.length && !missing.length ? `<p class="text-sm">Aucun attendu n'a pu être évalué.</p>`:""}
        </div>
      </details>
      <div class="mt-4"><div class="aq-fact"><div class="k">Synthèse de l'analyse</div><div class="v">${esc(r.analysisSummary)}</div></div></div>
      ${r.narrative?`<div class="mt-2"><div class="aq-fact"><div class="k">Commentaire du modèle (à relire)</div><div class="v">${esc(r.narrative)}</div></div></div>`:""}
      ${r.coverage && r.coverage.total ? `<p class="text-xs mt-2">Information secondaire : ${r.coverage.covered} attendu(s) sur ${r.coverage.total} rapproché(s) d'au moins une preuve. Ce n'est pas un taux de conformité ; la justification ci-dessus fait foi.</p>`:""}
      ${r.evidenceAssessment.length?`<details class="aq-details"><summary>Évaluation des preuves (${r.evidenceAssessment.length})</summary><div class="mt-2">
        ${r.evidenceAssessment.map(e=>`<div class="aq-line"><span class="aq-mark ${e.relevance==="pertinente"?"ok":"ko"}">${e.relevance==="pertinente"?"✓":"?"}</span><div><div class="cell-title">${esc(e.title)}</div><div class="text-sm">${esc(e.note)}</div>${(e.warnings||[]).map(w=>`<div class="text-xs" style="color:#8a5a05;">⚠ ${esc(w)}</div>`).join("")}</div></div>`).join("")}
      </div></details>`:""}
      ${r.additionalEvidenceSuggested.length?`<details class="aq-details"><summary>Preuves complémentaires suggérées (${r.additionalEvidenceSuggested.length})</summary><ul style="margin:8px 0 0 18px;padding:0;font-size:13px;">${r.additionalEvidenceSuggested.map(s=>`<li><strong>${esc(s.label)}</strong> — ${esc(s.suggestion)}</li>`).join("")}</ul></details>`:""}
      ${(r.limits||[]).length?`<div class="aq-callout warn">${r.limits.map(esc).join("<br><br>")}</div>`:""}
      ${!locked?`<div class="aq-actions"><button class="btn ${state==="stale"?"btn-primary":"btn-secondary"}" data-aq-action="analyse" ${canRun?"":"disabled"}>🔄 ${state==="stale"?"Relancer l'analyse":"Réanalyser"}</button></div>`:""}`;
  }
  return `
  <div class="card aq-step ${state==="fresh"?'is-done':(state==="stale"?'is-warn':'')}">
    ${aqStepHead(4, "Analyse Qonnect", aqEngineBadge(engine))}
    ${body}
  </div>`;
}

/* ---------- Étape 5 — Proposition Qonnect ---------- */
function aqCardProposition(a, q, state){
  if(state==="none"){
    return `<div class="card aq-step">${aqStepHead(5, "Proposition Qonnect", badgeRaw("neutral","En attente d'analyse"))}<p class="text-sm">La proposition apparaîtra ici après l'analyse. Elle restera une proposition : la décision revient à l'auditeur.</p></div>`;
  }
  const r = q.analyse.result;
  const used = (r.evidenceAssessment||[]).filter(e=>e.relevance==="pertinente");
  const proposalText = {
    conforme:"Les éléments fournis démontrent l'ensemble des attendus identifiés. Il reste à l'auditeur d'apprécier leur qualité et leur contenu réel.",
    partiellement_conforme:"Les éléments fournis démontrent une mise en œuvre partielle de l'exigence. Un élément complémentaire est nécessaire pour démontrer complètement sa maîtrise.",
    a_verifier:"Les éléments fournis ne permettent pas de se prononcer. Une vérification complémentaire est nécessaire avant toute évaluation.",
  }[r.proposedStatus] || "";
  return `
  <div class="card aq-step ${state==="stale"?'is-warn':''}">
    ${aqStepHead(5, "Proposition Qonnect", state==="stale"?badgeRaw("warning","Obsolète — relancer l'analyse"):badgeRaw("neutral","Proposition — pas une décision"))}
    <div class="aq-proposal" style="${state==="stale"?"opacity:.65;":""}">
      <span style="font-size:20px;">${AQ_STATUS_EMOJI[r.proposedStatus]||""}</span>
      <div style="flex:1;min-width:200px;"><div class="k text-xs" style="font-weight:600;text-transform:uppercase;">Statut proposé</div><div style="font-size:16px;font-weight:700;">${esc((LABELS.questionStatus[r.proposedStatus]||{l:r.proposedStatus}).l)}</div></div>
    </div>
    ${proposalText?`<p class="text-sm mt-2" style="color:var(--text-primary);">${esc(proposalText)}</p>`:""}
    <div class="mt-4"><div class="aq-fact"><div class="k">Pourquoi ?</div></div>
      <ul style="margin:6px 0 0 18px;padding:0;font-size:13px;">${(r.justificationPoints&&r.justificationPoints.length?r.justificationPoints:[r.justification]).filter(Boolean).map(p=>`<li style="margin:4px 0;">${esc(p)}</li>`).join("")}</ul>
    </div>
    <div class="mt-4"><div class="aq-fact"><div class="k">Preuves prises en compte</div></div>
      ${used.length ? `<div class="aq-chips">${used.map(e=>`<span class="badge badge-neutral" title="${esc(e.note)}">${esc(e.evidenceId)} · ${esc(e.title)}</span>`).join("")}</div>`
                    : `<p class="text-sm mt-2">Aucune preuve n'a pu être rapprochée d'un attendu.</p>`}
    </div>
  </div>`;
}

/* ---------- Étape 6 — Évaluation finale de l'auditeur ---------- */
function aqCardValidation(a, q, state, locked){
  const final = q.statut || "non_evalue";
  const d = q.decision;
  const proposal = q.analyse && q.analyse.result ? q.analyse.result.proposedStatus : null;
  const findings = aqFindingsOf(a, q);
  const needsConstat = (final==="partiellement_conforme" || final==="non_conforme");
  const diverges = d && d.proposedStatus && d.status!==d.proposedStatus;
  const options = Object.entries(LABELS.questionStatus).map(([v,l])=>`<option value="${v}" ${final===v?"selected":""}>${AQ_STATUS_EMOJI[v]} ${esc(l.l)}</option>`).join("");
  const hist = (q.historique||[]).slice().reverse();
  return `
  <div class="card aq-step ${final!=="non_evalue"?'is-done':''}">
    ${aqStepHead(6, "Évaluation finale de l'auditeur", `<span class="text-sm">La décision finale reste celle de l'auditeur</span>`)}
    <div class="aq-compare">
      <div><div class="text-xs" style="font-weight:600;text-transform:uppercase;">Proposition Qonnect</div><div class="mt-2">${proposal?aqStatusBadge(proposal,true):"—"} ${state==="stale"&&proposal?badgeRaw("warning","obsolète"):""}</div></div>
      <div><div class="text-xs" style="font-weight:600;text-transform:uppercase;">Statut retenu par l'auditeur</div><div class="mt-2">${aqStatusBadge(final,true)}</div></div>
    </div>
    ${d ? `<p class="text-sm">${esc(AQ_DECISION_SOURCE[d.source]||d.source)}${d.decidedAt?` · ${esc(aqFmtDateTime(d.decidedAt))}`:""}${d.decidedBy?` · ${esc(d.decidedBy)}`:""}</p>
      ${diverges?`<div class="aq-callout warn">Écart tracé : Qonnect proposait « ${esc(LABELS.questionStatus[d.proposedStatus].l)} », l'auditeur a retenu « ${esc(LABELS.questionStatus[d.status].l)} ».${d.proposalStale?" (La proposition était obsolète au moment de la décision.)":""}</div>`:""}
      ${d.comment?`<p class="text-sm mt-2" style="color:var(--text-primary);"><strong>Commentaire :</strong> ${esc(d.comment)}</p>`:""}`
      : `<p class="text-sm">Aucune évaluation n'a encore été enregistrée par l'auditeur. Le statut reste « Non évalué » tant que vous ne validez pas.</p>`}
    ${!locked?`
    <div class="field mt-4"><label for="aq-statut">Évaluation de l'auditeur</label><select id="aq-statut">${options}</select></div>
    <div class="field"><label for="aq-comment">Commentaire de l'auditeur</label><textarea id="aq-comment" placeholder="Justifiez votre évaluation, notamment si elle diffère de la proposition Qonnect.">${esc(d?d.comment:"")}</textarea>
      <div class="hint">${proposal?"Obligatoire si le statut retenu diffère de la proposition Qonnect.":"Facultatif."}</div></div>
    <div class="aq-actions">
      ${proposal && state==="fresh" ? `<button class="btn btn-primary" data-aq-action="accept-proposal">Accepter la proposition (${esc(LABELS.questionStatus[proposal].l)})</button>` : ""}
      <button class="btn ${proposal && state==="fresh"?"btn-secondary":"btn-primary"}" data-aq-action="save-decision">${proposal && state==="fresh"?"Modifier l'évaluation":"Enregistrer l'évaluation"}</button>
    </div>
    ${proposal && state==="stale"?`<p class="text-xs mt-2">La proposition est obsolète : relancez l'analyse pour pouvoir l'accepter. Vous pouvez néanmoins enregistrer votre propre évaluation.</p>`:""}
    `:""}
    ${findings.length||needsConstat||final==="conforme" ? `<div class="mt-4"><div class="aq-fact"><div class="k">Constats liés</div></div>
      ${findings.map(f=>{ const ct = LABELS.constatType[f.type]||{l:f.type,c:"neutral"}; return `<div class="aq-line"><div style="flex:1;">${badge(ct)} <span class="text-sm" style="color:var(--text-primary);">${esc(f.text.length>140?f.text.slice(0,139)+"…":f.text)}</span>
        <div class="aq-chips">${f.actionId?`<span class="badge badge-neutral" data-route="actions" style="cursor:pointer;">Action liée →</span>`:""}${f.ncEventId?`<span class="badge badge-neutral" data-route="evenements/non_conformite/${esc(f.ncEventId)}" style="cursor:pointer;">NC liée →</span>`:""}</div></div></div>`; }).join("")}
      ${!locked && !findings.length && needsConstat ? `<div class="aq-actions"><button class="btn btn-primary" data-aq-action="create-constat">Créer un constat</button></div><p class="text-xs mt-2">Le constat sera prérempli à partir de l'analyse ; vous pouvez le modifier avant création.</p>`:""}
      ${!locked && final==="conforme" ? `<div class="aq-actions"><button class="btn btn-secondary" data-aq-action="create-opportunite">Ajouter une opportunité d'amélioration</button></div><p class="text-xs mt-2">Rien n'est créé automatiquement : le formulaire s'ouvre vide de toute décision.</p>`:""}
    </div>`:""}
    <details class="aq-details"><summary>Historique de la question (${hist.length})</summary>
      ${hist.length?`<ul class="aq-hist" style="margin:8px 0 0 18px;padding:0;">${hist.map(h=>`<li>${esc(aqFmtDateTime(h.at))} — ${esc(h.by||"—")} — ${esc(h.detail||h.action)}</li>`).join("")}</ul>`:`<p class="text-sm mt-2">Aucun événement enregistré.</p>`}
    </details>
  </div>`;
}

/* ---------- Actions ---------- */
function aqCtxFrom(el){
  const root = el.closest("#aq-root");
  if(!root) return null;
  const a = getAudit(root.getAttribute("data-audit"));
  const q = a && findBy(a.questions, root.getAttribute("data-question"));
  return a && q ? { a, q, idx:parseInt(root.getAttribute("data-idx"),10) } : null;
}
/* Enregistre la description si elle a été modifiée (appelé avant toute autre action pour ne rien perdre). */
function aqCapturePratique(a, q){
  const ta = document.getElementById("aq-pratique");
  if(!ta) return true;
  const v = ta.value.trim();
  if(v===(q.pratique||"").trim()) return true;
  if(!checkSensitiveFields([v])) return false;
  q.pratique = v; q.commentaire = v;
  logQuestionEvent(q, "pratique", "Pratique décrite mise à jour");
  saveDB();
  return true;
}
function aqSaveDecision(a, q, status, comment, accepted){
  const an = q.analyse;
  const proposal = an && an.result ? an.result.proposedStatus : null;
  const stale = an ? getAnalysisState(a,q)==="stale" : false;
  comment = (comment||"").trim();
  if(proposal && status!=="non_evalue" && status!==proposal && !comment){
    toast("Merci de justifier en commentaire l'écart avec la proposition Qonnect","⚠️"); return false;
  }
  if(!checkSensitiveFields([comment])) return false;
  if(status==="non_evalue"){
    q.statut = "non_evalue"; q.decision = null;
    logQuestionEvent(q, "decision", "Évaluation réinitialisée (Non évalué)");
  } else {
    const source = accepted ? "proposition_acceptee" : (proposal ? (status===proposal?"aligne":"modifie") : "manuel");
    q.statut = status;
    q.decision = { status, source, proposedStatus:proposal, proposalStale:stale, analysisAt:an?an.analyzedAt:null, comment, decidedAt:new Date().toISOString(), decidedBy:currentActor() };
    logQuestionEvent(q, "decision", "Évaluation de l'auditeur : "+LABELS.questionStatus[status].l+" — "+AQ_DECISION_SOURCE[source]+(proposal&&status!==proposal?" (proposition Qonnect : "+LABELS.questionStatus[proposal].l+")":""));
  }
  saveDB();
  return true;
}

/* Préremplissage d'un constat à partir de l'analyse et de la décision (modifiable avant création). */
function aqBuildConstatPreset(a, q, kind){
  const ex = resolveExigenceFull(q.requirementId);
  const head = ex ? `${ex.referentielName} — ${ex.ref} ${ex.title}` : (q.critere || q.question);
  const preuveRefs = (q.preuves||[]).map(ev=>({ evidenceId:ev.id, type:ev.type, refKind:ev.refKind||null, refId:ev.refId||null, title:resolveEvidence(ev).title }));
  if(kind==="opportunite"){
    return { type:"opportunite", text:head+" : ", requirementId:q.requirementId||null, gravite:null, cause:"", questionId:q.id, preuveRefs, analysisAt:q.analyse?q.analyse.analyzedAt:null };
  }
  const r = q.analyse && q.analyse.result;
  const missing = r ? r.missingElements.map(m=>m.label) : [];
  const comment = q.decision && q.decision.comment ? q.decision.comment : "";
  let text;
  if(missing.length) text = `${head} : les éléments fournis ne démontrent pas suffisamment — ${missing.join(" ; ")}.`;
  else text = `${head} : ${comment || "la mise en œuvre n'est pas démontrée de façon satisfaisante."}`;
  if(missing.length && comment) text += " Commentaire de l'auditeur : "+comment;
  return { type:"ecart", text, requirementId:q.requirementId||null, gravite:q.statut==="non_conforme"?"majeure":"mineure", cause:"", questionId:q.id, preuveRefs, analysisAt:q.analyse?q.analyse.analyzedAt:null };
}

/* ---------- Fenêtre « Ajouter une preuve » ---------- */
function openEvidencePicker(auditId, questionId, onDone){
  const a = getAudit(auditId); const q = findBy(a.questions, questionId);
  const already = new Set((q.preuves||[]).filter(e=>e.refKind).map(e=>e.refKind+"|"+e.refId));
  const state = { typeId:"document_qonnect", search:"", selected:new Set() };
  const qonnectTypes = AUDIT_EVIDENCE_TYPES.filter(t=>t.source==="qonnect"), manualTypes = AUDIT_EVIDENCE_TYPES.filter(t=>t.source==="manuel");
  const typeOptions = `<optgroup label="Objets déjà présents dans Qonnect">${qonnectTypes.map(t=>`<option value="${t.id}">${t.icon} ${esc(t.label)}</option>`).join("")}</optgroup>
    <optgroup label="Preuves terrain / externes">${manualTypes.map(t=>`<option value="${t.id}">${t.icon} ${esc(t.label)}</option>`).join("")}</optgroup>`;
  openModal({ title:"Ajouter un élément de preuve", wide:true,
    bodyHtml:`<div class="field"><label for="ev-type">Type de preuve</label><select id="ev-type">${typeOptions}</select></div><div id="ev-dyn"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ev-submit">Ajouter</button>`,
    onMount:(o)=>{
      const dyn = o.querySelector("#ev-dyn");
      const renderList = ()=>{
        const list = getEvidenceCandidates(state.typeId).filter(c=>!already.has(c.refKind+"|"+c.refId));
        const s = qnorm(state.search);
        const shown = list.filter(c=>!s || qnorm(c.title+" "+c.subtitle).indexOf(s)>=0);
        const box = o.querySelector("#ev-list"); if(!box) return;
        box.innerHTML = shown.length ? shown.map(c=>{
          const key = c.refKind+"|"+c.refId; const n = getEvidenceUsages(c.refKind,c.refId).length;
          return `<label><input type="checkbox" value="${esc(key)}" ${state.selected.has(key)?"checked":""}><div><div class="cell-title">${esc(c.title)}</div><div class="text-xs">${esc(c.subtitle)}${n?` · déjà utilisée dans ${n} question(s)`:""}</div></div></label>`;
        }).join("") : `<div style="padding:12px;" class="text-sm">${list.length?"Aucun résultat pour cette recherche.":"Aucun élément disponible de ce type dans Qonnect (ou déjà ajouté à cette question)."}</div>`;
        box.querySelectorAll("input").forEach(cb=>cb.addEventListener("change",()=>{ cb.checked?state.selected.add(cb.value):state.selected.delete(cb.value); }));
      };
      const renderDyn = ()=>{
        const t = getEvidenceType(state.typeId);
        state.selected = new Set();
        if(t.source==="qonnect"){
          dyn.innerHTML = `
            <div class="field"><label for="ev-search">Rechercher dans Qonnect</label><input type="text" id="ev-search" placeholder="Titre, référence…" autocomplete="off"></div>
            <div class="aq-pick" id="ev-list"></div>
            <div class="field mt-4"><label for="ev-note">Précision (facultatif)</label><textarea id="ev-note" placeholder="En quoi cette preuve démontre-t-elle la pratique décrite ?"></textarea></div>
            ${t.manualAllowed?`<details class="aq-details"><summary>L'enregistrement n'existe pas dans Qonnect : le décrire</summary>
              <div class="field mt-2"><label for="ev-m-title">Intitulé</label><input type="text" id="ev-m-title" placeholder="Ex : Fiche de contrôle de production"></div>
              <div class="field"><label for="ev-m-desc">Description</label><textarea id="ev-m-desc"></textarea></div></details>`:""}`;
          o.querySelector("#ev-search").addEventListener("input", e=>{ state.search = e.target.value; renderList(); });
          renderList();
        } else {
          const ph = { observation:"Ex : Vérification du réglage de la ligne observée sur site", entretien:"Ex : Entretien avec le responsable de production", lien_externe:"Ex : Tableau de bord qualité en ligne", capture:"Ex : Capture de l'écran de planification", piece_jointe:"Ex : Certificat d'étalonnage fournisseur" }[t.id] || "";
          dyn.innerHTML = `
            <div class="field"><label for="ev-m-title">Intitulé <span class="req">*</span></label><input type="text" id="ev-m-title" placeholder="${esc(ph)}"></div>
            <div class="field"><label for="ev-m-desc">Description</label><textarea id="ev-m-desc" placeholder="Ce qui a été observé, dit ou montré — sans nom de personne ni donnée identifiante."></textarea></div>
            ${t.id==="observation"||t.id==="entretien"?`<div class="field"><label for="ev-m-date">Date</label><input type="date" id="ev-m-date"></div>`:""}
            ${t.needs==="url"?`<div class="field"><label for="ev-m-url">Adresse (URL) <span class="req">*</span></label><input type="text" id="ev-m-url" placeholder="https://…"></div>`:""}
            ${t.needs==="file"?`<div class="field"><label for="ev-m-file">Fichier</label><input type="file" id="ev-m-file" ${t.id==="capture"?'accept="image/*"':""}><div class="hint">Qonnect conserve la référence du fichier (nom, taille), pas son contenu : gardez l'original dans votre GED.</div></div>`:""}`;
        }
      };
      o.querySelector("#ev-type").addEventListener("change", e=>{ state.typeId = e.target.value; state.search=""; renderDyn(); });
      renderDyn();
      o.querySelector("#ev-submit").addEventListener("click", ()=>{
        const t = getEvidenceType(state.typeId);
        const add = [];
        if(t.source==="qonnect"){
          const note = (o.querySelector("#ev-note").value||"").trim();
          const cands = getEvidenceCandidates(state.typeId);
          if(!checkSensitiveFields([note, (o.querySelector("#ev-m-title")||{}).value||"", (o.querySelector("#ev-m-desc")||{}).value||""])) return;
          state.selected.forEach(key=>{
            const [refKind, ...rest] = key.split("|"); const refId = rest.join("|");
            const c = cands.find(x=>x.refKind===refKind && x.refId===refId);
            if(c) add.push(makeEvidence({ type:state.typeId, refKind, refId, title:c.title, description:note }));
          });
          const mt = ((o.querySelector("#ev-m-title")||{}).value||"").trim();
          if(mt) add.push(makeEvidence({ type:state.typeId, title:mt, description:((o.querySelector("#ev-m-desc")||{}).value||"").trim() }));
          if(!add.length){ toast("Sélectionnez au moins un élément","⚠️"); return; }
        } else {
          const title = o.querySelector("#ev-m-title").value.trim();
          const desc = o.querySelector("#ev-m-desc").value.trim();
          if(!title){ toast("Merci de saisir un intitulé","⚠️"); return; }
          if(!checkSensitiveFields([title, desc])) return;
          const fields = { type:state.typeId, title, description:desc };
          const dEl = o.querySelector("#ev-m-date"); if(dEl && dEl.value) fields.date = dEl.value;
          if(t.needs==="url"){
            const url = o.querySelector("#ev-m-url").value.trim();
            if(!/^https?:\/\/\S+$/i.test(url)){ toast("Saisissez une adresse commençant par http:// ou https://","⚠️"); return; }
            fields.url = url;
          }
          if(t.needs==="file"){
            const f = o.querySelector("#ev-m-file").files[0];
            if(f){ fields.fileName = f.name; fields.fileSize = f.size; }
            else if(!desc){ toast("Joignez un fichier ou décrivez la preuve","⚠️"); return; }
          }
          add.push(makeEvidence(fields));
        }
        add.forEach(ev=>{ q.preuves.push(ev); logQuestionEvent(q, "preuve_ajoutee", "Preuve ajoutée : "+ev.id+" — "+getEvidenceType(ev.type).label+" — "+ev.title); });
        syncQuestionPreuveIds(q);
        saveDB(); closeModal(); toast(add.length+" preuve(s) ajoutée(s)");
        if(onDone) onDone();
      });
    }
  });
}

/* ---------- Gestion des clics (délégation) ---------- */
document.addEventListener("click", async e=>{
  const btn = e.target.closest("[data-aq-action]");
  if(!btn) return;
  const ctx = aqCtxFrom(btn);
  if(!ctx) return;
  const { a, q } = ctx;
  if(a.status==="cloture") return;
  const action = btn.getAttribute("data-aq-action");
  e.stopPropagation();

  if(action==="save-pratique"){
    if(aqCapturePratique(a,q)){ toast("Description enregistrée"); render(); }
    return;
  }
  if(action==="add-preuve"){
    if(!aqCapturePratique(a,q)) return;
    openEvidencePicker(a.id, q.id, ()=>render());
    return;
  }
  if(action==="remove-preuve"){
    if(!aqCapturePratique(a,q)) return;
    const evId = btn.getAttribute("data-ev-id");
    const ev = findBy(q.preuves, evId);
    if(!ev) return;
    q.preuves = q.preuves.filter(x=>x.id!==evId);
    syncQuestionPreuveIds(q);
    logQuestionEvent(q, "preuve_retiree", "Preuve retirée : "+ev.id+" — "+ev.title);
    saveDB(); toast("Preuve retirée de la question"); render();
    return;
  }
  if(action==="analyse"){
    if(!aqCapturePratique(a,q)) return;
    btn.disabled = true; btn.textContent = "Analyse en cours…";
    const onProgress = (st)=>{
      if(!btn.isConnected) return;
      btn.textContent = st.status==="analyzing" ? "Analyse en cours…"
        : "Chargement du modèle… "+Math.round((st.progress||0)*100)+" %";
    };
    try{ await runQuestionAnalysis(a.id, q.id, { onProgress }); toast("Analyse terminée — proposition à valider par l'auditeur"); }
    catch(err){ console.error(err); toast("L'analyse a échoué : "+(err&&err.message?err.message:"erreur inconnue"),"⚠️"); }
    render();
    return;
  }
  if(action==="accept-proposal" || action==="save-decision"){
    if(!aqCapturePratique(a,q)) return;
    const comment = document.getElementById("aq-comment").value;
    let status;
    if(action==="accept-proposal"){
      if(getAnalysisState(a,q)!=="fresh"){ toast("La proposition est obsolète : relancez l'analyse","⚠️"); return; }
      status = q.analyse.result.proposedStatus;
    } else status = document.getElementById("aq-statut").value;
    if(aqSaveDecision(a, q, status, comment, action==="accept-proposal")){ toast("Évaluation de l'auditeur enregistrée"); render(); }
    return;
  }
  if(action==="create-constat" || action==="create-opportunite"){
    if(!aqCapturePratique(a,q)) return;
    openConstatForm(a.id, null, aqBuildConstatPreset(a, q, action==="create-opportunite"?"opportunite":"ecart"));
    return;
  }
}, true);
