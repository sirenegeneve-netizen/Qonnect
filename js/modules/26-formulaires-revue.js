/* ============================================================
   19ter. FORMULAIRES — REVUE DE DIRECTION
   ============================================================ */
function openReviewForm(){
  const latest = getLatestReview();
  openModal({title:"Préparer la revue de direction",
    bodyHtml:`
      <div class="field"><label>Période à analyser</label>
        <select id="qf-period">
          <option value="trimestre">Dernier trimestre</option>
          <option value="semestre" selected>Dernier semestre</option>
          <option value="annee">Dernière année</option>
          <option value="custom">Période personnalisée</option>
        </select>
      </div>
      <div class="field-row" id="qf-custom-dates" style="display:none;">
        <div class="field"><label>Début</label><input type="date" id="qf-start"></div>
        <div class="field"><label>Fin</label><input type="date" id="qf-end"></div>
      </div>
      <p class="text-sm">Qonnect va analyser automatiquement les processus, indicateurs, audits, non-conformités, risques, actions et changements disponibles pour préparer cette revue.</p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Préparer la revue</button>`,
    onMount:(o)=>{
      o.querySelector("#qf-period").addEventListener("change", (e)=> o.querySelector("#qf-custom-dates").style.display = e.target.value==="custom" ? "flex" : "none");
      o.querySelector("#qf-submit").addEventListener("click", ()=>{
        const period = o.querySelector("#qf-period").value;
        const today = new Date();
        let start, end = today.toISOString().slice(0,10);
        if(period==="custom"){ start = o.querySelector("#qf-start").value; end = o.querySelector("#qf-end").value || end; if(!start){ toast("Merci de renseigner une date de début","⚠️"); return; } }
        else{
          const months = period==="trimestre"?3:period==="annee"?12:6;
          const d = new Date(today); d.setMonth(d.getMonth()-months);
          start = d.toISOString().slice(0,10);
        }
        const id = "RD-"+String(Date.now()).slice(-6);
        DB.managementReviews.push({
          id, periodLabel:"Revue du "+fmtDate(start)+" au "+fmtDate(end), periodStart:start, periodEnd:end,
          reviewDate:"", nextReviewDate:"", status:"preparation", previousReviewId: latest?latest.id:null,
          contextChanges:[], decisions:[], conclusion:{smq:"",performance:"",ressources:"",amelioration:"",commentaire:""},
        });
        saveDB(); closeModal(); toast("Revue de direction préparée à partir des données disponibles");
        navigate(`revue-direction/${id}`);
      });
    }
  });
}

function openDecisionForm(reviewId, existing){
  const review = getReview(reviewId);
  openModal({title: existing ? "Modifier la décision" : "Nouvelle décision", wide:true,
    bodyHtml:`
      <div class="field"><label>Décision <span class="req">*</span></label><input type="text" id="qf-decision" value="${esc(existing?.decision||"")}" placeholder="Ex : Renforcer le suivi du processus X"></div>
      <div class="field"><label>Contexte / constat</label><textarea id="qf-contexte">${esc(existing?.contexte||"")}</textarea></div>
      <div class="field"><label>Justification</label><textarea id="qf-justification">${esc(existing?.justification||"")}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Responsable</label><input type="text" id="qf-responsable" value="${esc(existing?.responsable||"")}"></div>
        <div class="field"><label>Échéance</label><input type="date" id="qf-echeance" value="${existing?.echeance||""}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Priorité</label><select id="qf-priorite">${["critique","haute","moyenne","basse"].map(p=>`<option value="${p}" ${existing?.priorite===p?"selected":""}>${LABELS.priority[p].l}</option>`).join("")}</select></div>
        <div class="field"><label>Indicateur associé</label><select id="qf-indicator"><option value="">—</option>${DB.indicators.map(i=>`<option value="${i.id}" ${existing?.indicatorId===i.id?"selected":""}>${esc(i.name)}</option>`).join("")}</select></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">${existing?"Enregistrer":"Ajouter la décision"}</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const decisionText = o.querySelector("#qf-decision").value.trim();
      if(!decisionText){ toast("Merci de saisir une décision","⚠️"); return; }
      const payload = {
        decision:decisionText, contexte:o.querySelector("#qf-contexte").value.trim()||"—",
        justification:o.querySelector("#qf-justification").value.trim()||"—", responsable:o.querySelector("#qf-responsable").value.trim()||"Non assigné",
        echeance:o.querySelector("#qf-echeance").value||"—", priorite:o.querySelector("#qf-priorite").value,
        indicatorId:o.querySelector("#qf-indicator").value||null,
      };
      if(existing){ Object.assign(existing, payload); }
      else{ review.decisions.push({ id:"RDDEC-"+String(Date.now()).slice(-6), ...payload, actionId:null, statut:"a_faire", preuve:"" }); }
      saveDB(); closeModal(); toast(existing?"Décision mise à jour":"Décision ajoutée"); render();
    });}
  });
}

function openDecisionEditForm(reviewId, decisionId){
  const review = getReview(reviewId);
  const d = getDecision(review, decisionId);
  if(!d) return;
  openModal({title:"Mettre à jour la décision",
    bodyHtml:`
      <p class="text-sm mb-2"><strong>${esc(d.decision)}</strong></p>
      <div class="field"><label>Statut</label><select id="qf-statut">${Object.entries(LABELS.decisionStatus).map(([v,l])=>`<option value="${v}" ${d.statut===v?"selected":""}>${l.l}</option>`).join("")}</select></div>
      <div class="field"><label>Preuve associée</label><textarea id="qf-preuve" placeholder="Élément de preuve démontrant la réalisation">${esc(d.preuve)}</textarea></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Enregistrer</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      d.statut = o.querySelector("#qf-statut").value;
      d.preuve = o.querySelector("#qf-preuve").value.trim();
      saveDB(); closeModal(); toast("Décision mise à jour"); render();
    });}
  });
}

function openContextChangeForm(reviewId){
  const review = getReview(reviewId);
  openModal({title:"Ajouter un changement de contexte",
    bodyHtml:`
      <div class="field"><label>Description <span class="req">*</span></label><textarea id="qf-text" placeholder="Ex : Nouvelle réglementation applicable au secteur"></textarea></div>
      <div class="field"><label>Source</label><select id="qf-source"><option value="externe">Contexte externe</option><option value="interne">Contexte interne</option><option value="changement">Changement</option></select></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="qf-submit">Ajouter</button>`,
    onMount:(o)=>{ o.querySelector("#qf-submit").addEventListener("click", ()=>{
      const t = o.querySelector("#qf-text").value.trim();
      if(!t){ toast("Merci de décrire le changement","⚠️"); return; }
      review.contextChanges.push({id:"CTX-"+String(Date.now()).slice(-6), text:t, source:o.querySelector("#qf-source").value, confirmed:true});
      saveDB(); closeModal(); toast("Changement de contexte ajouté"); render();
    });}
  });
}

function generateReviewReport(review){
  const score = reviewScoreComponents();
  const lines = [];
  lines.push(`Compte-rendu de la Revue de Direction — ${review.periodLabel}`);
  lines.push(`Période analysée : du ${fmtDate(review.periodStart)} au ${fmtDate(review.periodEnd)}. Date de revue : ${fmtDate(review.reviewDate)||"—"}.`);
  lines.push(`Niveau global du système de management : ${score.global} %.`);
  lines.push("");
  lines.push("Résultats analysés : "+DB.objectives.filter(o=>o.status==="atteint").length+"/"+DB.objectives.length+" objectifs atteints, "
    +DB.actions.filter(a=>a.status==="retard").length+" action(s) en retard, "
    +DB.risks.filter(r=>r.type==="risque"&&r.level==="critique"&&r.status==="ouvert").length+" risque(s) critique(s) ouvert(s), "
    +DB.audits.length+" audit(s) réalisés ou planifiés.");
  lines.push("");
  lines.push("Décisions de la Direction :");
  review.decisions.forEach(d=> lines.push("- "+d.decision+" (responsable : "+d.responsable+", échéance : "+fmtDate(d.echeance)+", statut : "+(LABELS.decisionStatus[d.statut]?.l||d.statut)+")"));
  lines.push("");
  const c = review.conclusion;
  lines.push("Conclusion de la Direction :");
  lines.push("- Système de management : "+(LABELS.conclusionSmq[c.smq]||"non renseigné"));
  lines.push("- Performance : "+(LABELS.conclusionPerf[c.performance]||"non renseignée"));
  lines.push("- Ressources : "+(LABELS.conclusionRessources[c.ressources]||"non renseignées"));
  lines.push("- Amélioration : "+(LABELS.conclusionAmelioration[c.amelioration]||"non renseignée"));
  if(c.commentaire) lines.push("- Commentaires : "+c.commentaire);
  return lines.join("\n");
}

