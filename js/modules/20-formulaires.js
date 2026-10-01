/* ============================================================
   19. FORMULAIRES MODAUX (actions rapides)
   ============================================================ */
function ctxSelect(id, options){
  return `<select id="${id}">${Object.keys(options).map(k=>`<option value="${k}" ${k==="nc"?"selected":""}>${esc(options[k])}</option>`).join("")}</select>`;
}
function openQuickForm(kind, presets, triggerEl){
  presets = presets || {};
  const processOptions = DB.processes.map(p=>`<option value="${p.id}" ${presets.processId===p.id?"selected":""}>${esc(p.name)}</option>`).join("");

  if(kind==="event"){
    openModal({title:"Déclarer un événement", wide:false,
      bodyHtml:`
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Pièce non conforme détectée">${privacyNote()}</div>
        <div class="field"><label>Type <span class="req">*</span></label>
          <select id="qf-type">
            <option value="non_conformite">Non-conformité</option><option value="incident">Incident</option>
            <option value="reclamation">Réclamation</option><option value="anomalie">Anomalie</option>
            <option value="suggestion">Suggestion</option><option value="amelioration">Amélioration</option>
          </select></div>
        <div class="field-row">
          <div class="field"><label>Processus concerné</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
          <div class="field"><label>Priorité</label><select id="qf-priority"><option value="moyenne">Moyenne</option><option value="haute">Haute</option><option value="critique">Critique</option><option value="basse">Basse</option></select></div>
        </div>
        <div class="field"><label>Description</label><textarea id="qf-desc" placeholder="Décrivez les faits sans identifier la personne…"></textarea>${privacyNote()}</div>
        <details class="ctx-block">
          <summary>Contexte de prise en charge (facultatif, non identifiant)</summary>
          <div class="field-row mt-2">
            <div class="field"><label>Tranche d'âge</label>${ctxSelect("qf-ctx-age", EVENT_CONTEXT.ageRange)}</div>
            <div class="field"><label>Sexe</label>${ctxSelect("qf-ctx-sex", EVENT_CONTEXT.sex)}</div>
          </div>
          <div class="field-row">
            <div class="field"><label>Type de prise en charge</label>${ctxSelect("qf-ctx-care", EVENT_CONTEXT.careType)}</div>
            <div class="field"><label>Moment</label>${ctxSelect("qf-ctx-moment", EVENT_CONTEXT.moment)}</div>
          </div>
          <div class="field"><label>Conséquence</label>${ctxSelect("qf-ctx-conseq", EVENT_CONTEXT.consequence)}</div>
        </details>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Déclarer l'événement</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un titre","⚠️"); return; }
        const descVal = o.querySelector("#qf-desc").value.trim();
        if(!checkSensitiveFields([title, descVal])) return;
        const type = o.querySelector("#qf-type").value;
        const id = nextId("EVT", DB.events);
        const prefixMap = {non_conformite:"NC",incident:"INC",reclamation:"REC",anomalie:"ANO",suggestion:"SUG",amelioration:"AME"};
        const now = new Date();
        const ref = nextEventRef(prefixMap[type], now.getFullYear());
        const val = sel=>o.querySelector(sel).value;
        DB.events.push({ id, ref, type, title, processId:o.querySelector("#qf-process").value||null,
          priority:o.querySelector("#qf-priority").value, status:"ouvert", declaredBy:"Vous", date:now.toISOString().slice(0,10), step:0,
          description:descVal||"—",
          context:{ ageRange:val("#qf-ctx-age"), sex:val("#qf-ctx-sex"), careType:val("#qf-ctx-care"), moment:val("#qf-ctx-moment"), consequence:val("#qf-ctx-conseq") } });
        saveDB(); closeModal(); toast("Événement déclaré avec succès");
        navigate(`evenements/${type}/${id}`);
      });}
    });
  }

  else if(kind==="action"){
    openModal({title:"Créer une action",
      bodyHtml:`
        <div class="field"><label>Intitulé <span class="req">*</span></label><input type="text" id="qf-title" value="${esc(presets.title||"")}" placeholder="Ex : Vérifier l'étalonnage de la sonde"></div>
        <div class="field-row">
          <div class="field"><label>Responsable</label><input type="text" id="qf-owner" placeholder="Nom du responsable"></div>
          <div class="field"><label>Échéance</label><input type="date" id="qf-due"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Priorité</label><select id="qf-priority"><option value="moyenne">Moyenne</option><option value="haute">Haute</option><option value="critique">Critique</option><option value="basse">Basse</option></select></div>
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
        </div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Créer l'action</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un intitulé","⚠️"); return; }
        const id = nextId("ACT", DB.actions);
        DB.actions.push({ id, title, owner:o.querySelector("#qf-owner").value.trim()||"Non assigné",
          due:o.querySelector("#qf-due").value || new Date().toISOString().slice(0,10),
          priority:o.querySelector("#qf-priority").value, status:"a_faire",
          origin:presets.originType||"objectif", originId:presets.originId||null, processId:o.querySelector("#qf-process").value||presets.processId||null });
        saveDB(); closeModal(); toast("Action créée avec succès"); render();
      });}
    });
  }

  else if(kind==="risk"){
    openModal({title:"Identifier un risque",
      bodyHtml:`
        <div class="field"><label>Nom du risque <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Dépendance à un fournisseur unique"></div>
        <div class="field-row">
          <div class="field"><label>Type</label><select id="qf-type"><option value="risque">Risque</option><option value="opportunite">Opportunité</option></select></div>
          <div class="field"><label>Niveau</label><select id="qf-level"><option value="faible">Faible</option><option value="eleve">Élevé</option><option value="critique">Critique</option></select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
          <div class="field"><label>Responsable</label><input type="text" id="qf-owner" placeholder="Nom du responsable"></div>
        </div>
        <div class="field"><label>Description</label><textarea id="qf-desc"></textarea></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Enregistrer</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un nom","⚠️"); return; }
        const isOpp = o.querySelector("#qf-type").value==="opportunite";
        const id = nextId(isOpp?"OPP":"RISK", DB.risks);
        DB.risks.push({ id, name:title, level:isOpp?"opportunite":o.querySelector("#qf-level").value,
          processId:o.querySelector("#qf-process").value||presets.processId||null, owner:o.querySelector("#qf-owner").value.trim()||"Non assigné",
          status:"ouvert", type:isOpp?"opportunite":"risque", description:o.querySelector("#qf-desc").value.trim()||"—", probability:3, impact:3 });
        saveDB(); closeModal(); toast("Risque enregistré avec succès"); navigate(`risques/${id}`);
      });}
    });
  }

  else if(kind==="document"){
    openDocumentWizard(presets);
  }

  else if(kind==="objective"){
    openModal({title:"Créer un objectif",
      bodyHtml:`
        <div class="field"><label>Intitulé <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Réduire les délais de traitement"></div>
        <div class="field-row">
          <div class="field"><label>Cible</label><input type="text" id="qf-target" placeholder="Ex : -10 %"></div>
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
        </div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Créer l'objectif</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un intitulé","⚠️"); return; }
        const id = nextId("OBJ", DB.objectives);
        DB.objectives.push({ id, title, target:o.querySelector("#qf-target").value.trim()||"—", progress:0, status:"en_cours",
          processId:o.querySelector("#qf-process").value||null, indicatorIds:[] });
        saveDB(); closeModal(); toast("Objectif créé avec succès"); navigate("objectifs");
      });}
    });
  }

  else if(kind==="audit"){
    openAuditWizard(presets);
  }

  else if(kind==="finding"){
    openConstatForm(presets.auditId, null);
  }

  else if(kind==="change"){
    openModal({title:"Déclarer un changement",
      bodyHtml:`
        <div class="field"><label>Titre <span class="req">*</span></label><input type="text" id="qf-title" placeholder="Ex : Changement de fournisseur"></div>
        <div class="field-row">
          <div class="field"><label>Processus</label><select id="qf-process"><option value="">—</option>${processOptions}</select></div>
          <div class="field"><label>Demandeur</label><input type="text" id="qf-owner" placeholder="Votre nom"></div>
        </div>
        <div class="field"><label>Description</label><textarea id="qf-desc"></textarea></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Déclarer</button>`,
      onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const title = o.querySelector("#qf-title").value.trim();
        if(!title){ toast("Merci de saisir un titre","⚠️"); return; }
        const id = nextId("CHG", DB.changes);
        DB.changes.push({ id, title, processId:o.querySelector("#qf-process").value||presets.processId||null, requestedBy:o.querySelector("#qf-owner").value.trim()||"Vous",
          date:new Date().toISOString().slice(0,10), step:0, impacted:{processes:[],documents:[],risks:[],indicators:[],skills:[]}, description:o.querySelector("#qf-desc").value.trim()||"—" });
        saveDB(); closeModal(); toast("Changement déclaré avec succès"); navigate(`changements/${id}`);
      });}
    });
  }
}

