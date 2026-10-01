/* ============================================================
   20. DÉLÉGATION D'ÉVÉNEMENTS GLOBALE
   ============================================================ */
function initGlobalEvents(){
  document.addEventListener("change", ev=>{
    if(ev.target.id!=="import-data-file") return;
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      let obj;
      try{ obj = JSON.parse(reader.result); }catch(err){ toast("Fichier illisible : ce n'est pas un JSON valide.","⚠️"); return; }
      const problem = validateBackup(obj);
      if(problem){ toast(problem,"⚠️"); return; }
      confirmDialog("Remplacer toutes les données actuelles par cette sauvegarde (du "+fmtDate((obj.exportedAt||"").slice(0,10))+") ?", ()=>{
        try{ restoreBackup(obj); toast("Sauvegarde restaurée","✅"); render(); }
        catch(err){ toast(err.message,"⚠️"); }
      });
    };
    reader.readAsText(file);
  });
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
    /* ---- Groupe / Établissements / Services ---- */
    if(e.target.closest("#scope-pill") || e.target.closest("[data-open-scope-selector]")){ openScopeSelector(); return; }
    const setScopeEl = e.target.closest("[data-set-scope]");
    if(setScopeEl){
      CURRENT_SCOPE = JSON.parse(setScopeEl.getAttribute("data-set-scope"));
      saveScope(); closeModal(); updateScopePill(); toast("Périmètre changé : "+scopeLabel()); render();
      return;
    }

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
    if(e.target.id==="export-data-btn"){
      const d = new Date().toISOString().slice(0,10);
      const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `qonnect-sauvegarde-${d}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
      toast("Sauvegarde exportée","💾");
      return;
    }
    if(e.target.id==="import-data-btn"){ document.getElementById("import-data-file").click(); return; }
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

