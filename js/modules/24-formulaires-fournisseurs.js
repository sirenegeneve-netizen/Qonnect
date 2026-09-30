/* ============================================================
   19bis-frn. FORMULAIRES — FOURNISSEURS
   ============================================================ */
function openFournisseurForm(id){
  const existing = id ? getFournisseur(id) : null;
  openModal({title: existing?"Modifier le fournisseur":"Nouveau fournisseur", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Raison sociale <span class="req">*</span></label><input type="text" id="ff-raison" value="${esc(existing?existing.raisonSociale:"")}"></div>
        <div class="field"><label>Nom commercial</label><input type="text" id="ff-nom" value="${esc(existing?existing.nomCommercial:"")}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Pays</label><input type="text" id="ff-pays" value="${esc(existing?existing.pays:"France")}"></div>
        <div class="field"><label>Référent interne</label><input type="text" id="ff-referent" value="${esc(existing?existing.referentInterne:"")}"></div>
      </div>
      <div class="field"><label>Catégories</label>
        <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${LABELS.fournisseurCategorieOptions.map(cat=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ff-cat-cb" value="${esc(cat)}" ${existing&&(existing.categories||[]).includes(cat)?"checked":""} style="width:auto;"> ${esc(cat)}</label>`).join("")}
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Criticité <span class="req">*</span></label><select id="ff-crit">${Object.entries(LABELS.fournisseurCriticite).map(([v,l])=>`<option value="${v}" ${existing&&existing.criticite===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
        <div class="field"><label>Statut</label><select id="ff-statut">${Object.entries(LABELS.fournisseurStatut).map(([v,l])=>`<option value="${v}" ${existing&&existing.statut===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Justification de la criticité</label><textarea id="ff-justif">${esc(existing?existing.criticiteJustification:"")}</textarea></div>
      <div class="field"><label>Processus concernés</label>
        <div style="max-height:110px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${DB.processes.map(p=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ff-proc-cb" value="${p.id}" ${existing&&(existing.processIds||[]).includes(p.id)?"checked":""} style="width:auto;"> ${esc(p.name)}</label>`).join("")}
        </div>
      </div>`,
    footHtml:`${existing?`<button class="btn btn-danger" id="ff-delete" style="margin-right:auto;">Supprimer</button>`:""}<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ff-submit">${existing?"Enregistrer":"Créer"}</button>`,
    onMount:(o)=>{
      o.querySelector("#ff-submit").addEventListener("click", ()=>{
        const raison = o.querySelector("#ff-raison").value.trim();
        if(!raison){ toast("Merci de saisir une raison sociale","⚠️"); return; }
        const payload = { raisonSociale:raison, nomCommercial:o.querySelector("#ff-nom").value.trim()||raison, pays:o.querySelector("#ff-pays").value.trim(),
          referentInterne:o.querySelector("#ff-referent").value.trim(), categories:[...o.querySelectorAll(".ff-cat-cb:checked")].map(c=>c.value),
          criticite:o.querySelector("#ff-crit").value, statut:o.querySelector("#ff-statut").value, criticiteJustification:o.querySelector("#ff-justif").value.trim(),
          processIds:[...o.querySelectorAll(".ff-proc-cb:checked")].map(c=>c.value) };
        if(existing){ Object.assign(existing, payload); }
        else{ DB.fournisseurs.push({ id:nextId("FRN", DB.fournisseurs), ...payload, siret:"—", tva:"—", siteWeb:"", adresse:"", contacts:[], dateEntree:new Date().toISOString().slice(0,10), produitsServices:[] }); }
        saveDB(); closeModal(); toast(existing?"Fournisseur mis à jour":"Fournisseur créé"); navigate(existing?`fournisseurs/liste/${existing.id}`:"fournisseurs/liste");
      });
      const delBtn = o.querySelector("#ff-delete");
      if(delBtn) delBtn.addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement ce fournisseur ?", ()=>{
          DB.fournisseurs = DB.fournisseurs.filter(f=>f.id!==existing.id);
          saveDB(); closeModal(); toast("Fournisseur supprimé"); navigate("fournisseurs/liste");
        });
      });
    }
  });
}

function openFournisseurDocForm(fournisseurId){
  openModal({title:"Ajouter un document fournisseur", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Type</label><select id="fdf-type">${Object.entries(LABELS.fournisseurDocType).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="fdf-titre"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="fdf-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Échéance</label><input type="date" id="fdf-echeance"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Version</label><input type="text" id="fdf-version" value="1.0"></div>
        <div class="field"><label>Responsable</label><input type="text" id="fdf-resp"></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="fdf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#fdf-submit").addEventListener("click", ()=>{
      const titre = o.querySelector("#fdf-titre").value.trim();
      if(!titre){ toast("Merci de saisir un titre","⚠️"); return; }
      DB.fournisseurDocuments.push({ id:"FDOC-"+String(Date.now()).slice(-6), fournisseurId, type:o.querySelector("#fdf-type").value, titre,
        date:o.querySelector("#fdf-date").value, version:o.querySelector("#fdf-version").value.trim()||"1.0", echeance:o.querySelector("#fdf-echeance").value||"—",
        responsable:o.querySelector("#fdf-resp").value.trim()||"Non assigné" });
      saveDB(); closeModal(); toast("Document ajouté"); render();
    });}
  });
}

function openFournisseurEvalForm(fournisseurId){
  const f = getFournisseur(fournisseurId);
  openModal({title:"Nouvelle évaluation — "+f.nomCommercial, wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Modèle de questionnaire</label><select id="fef-quest"><option value="">Critères libres</option>${DB.fournisseurQuestionnaires.map(q=>`<option value="${q.id}">${esc(q.nom)}</option>`).join("")}</select></div>
        <div class="field"><label>Périodicité</label><select id="fef-periode"><option value="annuelle">Annuelle</option><option value="semestrielle">Semestrielle</option><option value="trimestrielle">Trimestrielle</option><option value="personnalisee">Personnalisée</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="fef-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Évaluateur</label><input type="text" id="fef-eval" value="${esc(f.referentInterne)}"></div>
      </div>
      <div id="fef-criteres"></div>
      <button class="btn btn-secondary btn-sm mt-2" id="fef-add-critere">+ Ajouter un critère</button>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="fef-submit">Enregistrer l'évaluation</button>`,
    onMount:(o)=>{
      const critereRow = (nom,ponderation)=>`<div class="field-row fef-crit-row">
        <div class="field"><input type="text" class="fef-c-nom" placeholder="Critère" value="${esc(nom||"")}"></div>
        <div class="field" style="max-width:100px;"><input type="number" class="fef-c-pond" placeholder="Poids %" value="${ponderation||20}"></div>
        <div class="field" style="max-width:100px;"><input type="number" class="fef-c-note" placeholder="Note /10" min="0" max="10" value="7"></div>
        <button type="button" class="btn btn-ghost btn-sm fef-remove-crit">✕</button>
      </div>`;
      function renderCriteres(list){ o.querySelector("#fef-criteres").innerHTML = list.map(c=>critereRow(c.nom, c.ponderation)).join(""); bindRemove(); }
      function bindRemove(){ o.querySelectorAll(".fef-remove-crit").forEach(b=>b.addEventListener("click", ()=>{ b.closest(".fef-crit-row").remove(); })); }
      renderCriteres([{nom:"Qualité",ponderation:25},{nom:"Respect des délais",ponderation:25},{nom:"Support",ponderation:25},{nom:"Conformité réglementaire",ponderation:25}]);
      o.querySelector("#fef-quest").addEventListener("change", (e)=>{
        const q = DB.fournisseurQuestionnaires.find(x=>x.id===e.target.value);
        renderCriteres(q ? q.criteres : [{nom:"Qualité",ponderation:25},{nom:"Respect des délais",ponderation:25},{nom:"Support",ponderation:25},{nom:"Conformité réglementaire",ponderation:25}]);
      });
      o.querySelector("#fef-add-critere").addEventListener("click", ()=>{
        o.querySelector("#fef-criteres").insertAdjacentHTML("beforeend", critereRow("",20)); bindRemove();
      });
      o.querySelector("#fef-submit").addEventListener("click", ()=>{
        const rows = [...o.querySelectorAll(".fef-crit-row")];
        const criteres = rows.map(r=>({ nom:r.querySelector(".fef-c-nom").value.trim()||"Critère", ponderation:parseFloat(r.querySelector(".fef-c-pond").value)||0, note:parseFloat(r.querySelector(".fef-c-note").value)||0, commentaire:"", preuve:"" })).filter(c=>c.nom);
        if(!criteres.length){ toast("Ajoutez au moins un critère","⚠️"); return; }
        DB.fournisseurEvaluations.push({ id:"FEVAL-"+String(Date.now()).slice(-6), fournisseurId, date:o.querySelector("#fef-date").value||new Date().toISOString().slice(0,10),
          periode:o.querySelector("#fef-periode").value, evaluateur:o.querySelector("#fef-eval").value.trim()||"Non renseigné", questionnaireId:o.querySelector("#fef-quest").value||null, criteres });
        saveDB(); closeModal(); toast("Évaluation enregistrée"); render();
      });
    }
  });
}

function openFournisseurIncidentForm(fournisseurId){
  openModal({title:"Déclarer un incident fournisseur", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Type</label><select id="fif-type">${Object.entries(LABELS.incidentType).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
        <div class="field"><label>Gravité</label><select id="fif-gravite"><option value="mineure">Mineure</option><option value="majeure">Majeure</option><option value="critique">Critique</option></select></div>
      </div>
      <div class="field"><label>Description <span class="req">*</span></label><textarea id="fif-desc"></textarea></div>
      <div class="field"><label>Impact</label><input type="text" id="fif-impact"></div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="fif-date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Processus impacté</label><select id="fif-process"><option value="">—</option>${DB.processes.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="fif-submit">Déclarer</button>`,
    onMount:(o)=>{ o.querySelector("#fif-submit").addEventListener("click", ()=>{
      const desc = o.querySelector("#fif-desc").value.trim();
      if(!desc){ toast("Merci de décrire l'incident","⚠️"); return; }
      DB.fournisseurIncidents.push({ id:"FINC-"+String(Date.now()).slice(-6), fournisseurId, date:o.querySelector("#fif-date").value||new Date().toISOString().slice(0,10),
        type:o.querySelector("#fif-type").value, description:desc, impact:o.querySelector("#fif-impact").value.trim(), gravite:o.querySelector("#fif-gravite").value,
        processId:o.querySelector("#fif-process").value||null, riskId:null, actionId:null, ncEventId:null });
      saveDB(); closeModal(); toast("Incident déclaré"); render();
    });}
  });
}

