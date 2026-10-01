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
  const state = { step:1, type:null, processId:presets.processId||"", referentiels:[], templateId:null, title:presets.title||"" };
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
      if(presets.linkExigenceId && typeof refAiLinkDoc==="function") refAiLinkDoc(presets.linkExigenceId, id);
      saveDB(); closeModal(); toast("Document créé — structure générée automatiquement"+(presets.linkExigenceId?" et associé à l'exigence":""));
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

