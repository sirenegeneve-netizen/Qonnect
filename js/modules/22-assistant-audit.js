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
    const relevantInfo = state.processIds.length ? (state.referentielIds.length?state.referentielIds:["ISO9001"]).map(refId=>auditRelevantViews(refId, state.processIds)) : [];
    const relevantViews = relevantInfo.flatMap(r=>r.views);
    const anyUnlinked = relevantInfo.some(r=>r.unlinked);
    const relevantDocs = state.processIds.length ? DB.documents.filter(d=>d.status!=="obsolete" && state.processIds.includes(d.processId)) : [];
    return stepper()+`
    <div class="step-title">Étape 5/6 — Critères d'audit</div>
    <p class="text-sm mb-2">Qonnect propose les exigences pertinentes selon le périmètre sélectionné.</p>
    ${anyUnlinked?`<div class="aq-callout" style="margin-top:0;margin-bottom:12px;">Aucune exigence de ce référentiel n'est reliée aux processus choisis : toutes ses exigences sont proposées. Vous pouvez les relier à un processus depuis Référentiels (✏️) pour affiner.</div>`:""}
    <div class="field" style="max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
      ${relevantViews.length?relevantViews.map(v=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="wiz-req-cb" value="${v.id}" ${state.requirementIds.includes(v.id)?"checked":""} style="width:auto;"> ${esc(exigenceLabel(v))} — ${esc(v.title)}${exigenceExcerpt(v,90)?" : "+esc(exigenceExcerpt(v,90)):""} ${badge(LABELS.exigenceCoverage[v.level])}</label>`).join(""):`<p class="text-sm">Sélectionnez un processus et un référentiel pour voir les exigences suggérées.</p>`}
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

function openConstatForm(auditId, existing, presets){
  const audit = getAudit(auditId);
  /* base : valeurs initiales du formulaire — le constat existant, ou un préremplissage issu d'une question d'audit (modifiable). */
  const base = existing || presets || null;
  const reqIds = (audit.criteres&&audit.criteres.requirementIds||[]).slice();
  if(base && base.requirementId && !reqIds.includes(base.requirementId)) reqIds.push(base.requirementId);
  const preuveRefs = presets && presets.preuveRefs ? presets.preuveRefs : [];
  openModal({title: existing?"Modifier le constat":(presets?"Créer un constat à partir de la question":"Ajouter un constat"), wide:true,
    bodyHtml:`
      ${presets?`<div class="aq-callout" style="margin-top:0;margin-bottom:12px;">Constat prérempli à partir de l'analyse et de l'évaluation de l'auditeur. Modifiez librement avant de l'enregistrer : rien n'est créé tant que vous ne validez pas.</div>`:""}
      <div class="field"><label>Type de constat</label><select id="qf-type">${Object.entries(LABELS.constatType).map(([v,l])=>`<option value="${v}" ${base&&base.type===v?"selected":""}>${l.e} ${l.l}</option>`).join("")}</select></div>
      <div class="field"><label>Fait constaté <span class="req">*</span></label><textarea id="qf-text">${esc(base?base.text:"")}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Exigence concernée</label><select id="qf-req"><option value="">—</option>${reqIds.map(rid=>{const ex=resolveExigence(rid); return ex?`<option value="${rid}" ${base&&base.requirementId===rid?"selected":""}>${esc(ex.ref)} — ${esc(ex.label)}</option>`:"";}).join("")}</select></div>
        <div class="field" id="qf-gravite-wrap"><label>Niveau de gravité</label><select id="qf-gravite">${Object.entries(LABELS.constatGravite).map(([v,l])=>`<option value="${v}" ${base&&base.gravite===v?"selected":""}>${l}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Cause potentielle (si déjà identifiée)</label><textarea id="qf-cause" placeholder="L'analyse de cause approfondie se fait dans le module NC/CAPA">${esc(base?base.cause:"")}</textarea></div>
      <div class="field"><label>Risque associé</label><select id="qf-risk"><option value="">—</option>${DB.risks.map(r=>`<option value="${r.id}" ${existing&&existing.riskId===r.id?"selected":""}>${esc(r.name)}</option>`).join("")}</select></div>
      ${preuveRefs.length?`<div class="field"><label>Preuves associées (reprises de la question)</label><div class="aq-pick">${preuveRefs.map(p=>`<label><input type="checkbox" class="qf-ev-cb" value="${esc(p.evidenceId)}" checked><div><div class="cell-title">${esc(p.title)}</div><div class="text-xs">${esc(getEvidenceType(p.type).label)} · ${esc(p.evidenceId)}</div></div></label>`).join("")}</div><div class="hint">Les preuves sont référencées, pas copiées.</div></div>`:""}`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">${existing?"Enregistrer":(presets?"Créer le constat":"Ajouter")}</button>`,
    onMount:(o)=>{
      const typeSel = o.querySelector("#qf-type");
      const toggleGravite = ()=> o.querySelector("#qf-gravite-wrap").style.display = (typeSel.value==="ecart"||typeSel.value==="nc_majeure")?"block":"none";
      typeSel.addEventListener("change", toggleGravite); toggleGravite();
      o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const text = o.querySelector("#qf-text").value.trim();
        if(!text){ toast("Merci de décrire le constat","⚠️"); return; }
        const payload = { type:typeSel.value, text, requirementId:o.querySelector("#qf-req").value||null, cause:o.querySelector("#qf-cause").value.trim(), riskId:o.querySelector("#qf-risk").value||null, gravite:(typeSel.value==="ecart"||typeSel.value==="nc_majeure")?o.querySelector("#qf-gravite").value:null };
        if(existing){ Object.assign(existing, payload); }
        else{
          const keep = new Set([...o.querySelectorAll(".qf-ev-cb:checked")].map(c=>c.value));
          const link = presets ? { questionId:presets.questionId||null, source:"question_audit", analysisAt:presets.analysisAt||null, preuveRefs:preuveRefs.filter(p=>keep.has(p.evidenceId)) } : { questionId:null };
          const finding = { id:"C-"+String(Date.now()).slice(-6), ...payload, processId:audit.processId, ncEventId:null, actionId:null, ...link };
          audit.findings.push(finding);
          if(presets && presets.questionId){ const pq = findBy(audit.questions, presets.questionId); if(pq) logQuestionEvent(pq, "constat", "Constat créé : "+finding.id+" ("+(LABELS.constatType[finding.type]?LABELS.constatType[finding.type].l:finding.type)+")"); }
        }
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
      audit.questions.push(newAuditQuestion({ question, requirementId:null, processId:o.querySelector("#qf-process").value||audit.processId,
        critere:o.querySelector("#qf-critere").value.trim(), preuveAttendue:o.querySelector("#qf-preuve-attendue").value.trim(), responsableInterroge:o.querySelector("#qf-resp").value.trim() }));
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

