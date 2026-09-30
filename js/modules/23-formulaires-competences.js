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

