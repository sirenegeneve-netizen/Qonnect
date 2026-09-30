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

