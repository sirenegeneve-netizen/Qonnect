/* ============================================================
   14. RÉFÉRENTIELS — moteur de conformité
   ============================================================ */

/* ---------- Bundles de preuves & scoring transparent ---------- */
function legacyRequirementBundle(r){
  const process = getProcess(r.processId);
  const docMap = new Map();
  DB.documents.forEach(d=>{ if(d.status==="obsolete") return; if((d.requirementIds||[]).includes(r.id) || (r.extraDocIds||[]).includes(d.id)) docMap.set(d.id,d); });
  const docs = [...docMap.values()];
  const auditMap = new Map();
  if(process) DB.audits.filter(a=>a.processId===process.id).forEach(a=>auditMap.set(a.id,a));
  (r.extraAuditIds||[]).forEach(id=>{ const a=getAudit(id); if(a) auditMap.set(a.id,a); });
  const audits = [...auditMap.values()];
  const actionMap = new Map();
  if(process) DB.actions.filter(a=>a.processId===process.id && a.status!=="termine").forEach(a=>actionMap.set(a.id,a));
  (r.extraActionIds||[]).forEach(id=>{ const a=getAction(id); if(a && a.status!=="termine") actionMap.set(a.id,a); });
  const actionsOpen = [...actionMap.values()];
  const actionsLate = actionsOpen.filter(a=>a.status==="retard");
  const riskMap = new Map();
  if(process) DB.risks.filter(rk=>rk.processId===process.id && rk.type==="risque" && rk.status==="ouvert" && (rk.level==="critique"||rk.level==="eleve")).forEach(rk=>riskMap.set(rk.id,rk));
  (r.extraRiskIds||[]).forEach(id=>{ const rk=getRisk(id); if(rk && rk.status==="ouvert") riskMap.set(rk.id,rk); });
  const risksOpen = [...riskMap.values()];
  const indicatorsBad = process ? DB.indicators.filter(i=>i.processId===process.id && i.status!=="vert") : [];
  const auditEcarts = audits.some(a=>a.findings.some(f=>isAuditEcart(f)) && a.status!=="cloture");
  return {docs, audits, actionsOpen, actionsLate, risksOpen, indicatorsBad, auditEcarts, process, processes:process?[process]:[]};
}
function customExigenceBundle(e){
  const processes = (e.processIds||[]).map(getProcess).filter(Boolean);
  const docs = (e.docIds||[]).map(getDocument).filter(Boolean).filter(d=>d.status!=="obsolete");
  const audits = (e.auditIds||[]).map(getAudit).filter(Boolean);
  processes.forEach(p=>{ DB.audits.filter(a=>a.processId===p.id).forEach(a=>{ if(!audits.find(x=>x.id===a.id)) audits.push(a); }); });
  let actionsOpen = (e.actionIds||[]).map(getAction).filter(Boolean).filter(a=>a.status!=="termine");
  processes.forEach(p=>{ DB.actions.filter(a=>a.processId===p.id && a.status!=="termine").forEach(a=>{ if(!actionsOpen.find(x=>x.id===a.id)) actionsOpen.push(a); }); });
  const actionsLate = actionsOpen.filter(a=>a.status==="retard");
  let risksOpen = (e.riskIds||[]).map(getRisk).filter(Boolean).filter(r=>r.status==="ouvert");
  processes.forEach(p=>{ DB.risks.filter(r=>r.processId===p.id && r.type==="risque" && r.status==="ouvert" && (r.level==="critique"||r.level==="eleve")).forEach(r=>{ if(!risksOpen.find(x=>x.id===r.id)) risksOpen.push(r); }); });
  const indicatorsBad = processes.flatMap(p=> DB.indicators.filter(i=>i.processId===p.id && i.status!=="vert"));
  const auditEcarts = audits.some(a=>a.findings.some(f=>isAuditEcart(f)) && a.status!=="cloture");
  return {docs, audits, actionsOpen, actionsLate, risksOpen, indicatorsBad, auditEcarts, process:processes[0]||null, processes};
}
function scoreCoverage(bundle){
  if(!bundle.docs.length) return "non_couvert";
  let score = 1;
  score += bundle.audits.length ? 1 : 0;
  score += bundle.auditEcarts ? -1 : 1;
  score += bundle.actionsLate.length===0 ? 1 : -1;
  score += bundle.risksOpen.length===0 ? 1 : -1;
  score += bundle.indicatorsBad.length===0 ? 1 : 0;
  if(score<=1) return "partiellement";
  if(score<=3) return "a_renforcer";
  if(score<=5) return "maitrise";
  return "optimise";
}
function coverageReasons(bundle){
  const reasons = [];
  reasons.push(bundle.docs.length ? `${bundle.docs.length} document(s) associé(s)` : "Aucun document associé — condition bloquante pour la couverture");
  reasons.push(bundle.audits.length ? `${bundle.audits.length} audit(s) existant(s)`+(bundle.auditEcarts?" avec écart(s) non clôturé(s)":", sans écart ouvert") : "Aucun audit associé");
  reasons.push(bundle.actionsLate.length ? `${bundle.actionsLate.length} action(s) en retard` : (bundle.actionsOpen.length? `${bundle.actionsOpen.length} action(s) en cours, aucune en retard` : "Aucune action ouverte"));
  reasons.push(bundle.risksOpen.length ? `${bundle.risksOpen.length} risque(s) élevé(s) ou critique(s) ouvert(s)` : "Aucun risque élevé ouvert");
  if(bundle.indicatorsBad.length) reasons.push(`${bundle.indicatorsBad.length} indicateur(s) hors cible`);
  return reasons;
}
function getReferentielExigenceViews(refId){
  if(refId==="ISO9001"){
    return DB.requirements.map(r=>{
      const bundle = legacyRequirementBundle(r);
      const level = scoreCoverage(bundle);
      return { id:r.id, ref:r.ref, title:r.label, description:"", sourceText:"", type:"exigence", legacy:true, bundle, level, process:bundle.process,
        updatedAt: bundle.docs.reduce((max,d)=> d.date>max?d.date:max, "") };
    });
  }
  return DB.customExigences.filter(e=>e.referentielId===refId).map(e=>{
    const bundle = customExigenceBundle(e);
    const level = scoreCoverage(bundle);
    return { id:e.id, ref:e.ref, title:e.title, description:e.description, sourceText:e.sourceText, type:e.type, legacy:false, bundle, level, process:bundle.process,
      updatedAt: bundle.docs.reduce((max,d)=> d.date>max?d.date:max, "") };
  });
}
function referentielScore(refId){
  const views = getReferentielExigenceViews(refId);
  const total = views.length;
  const counts = {non_couvert:0, partiellement:0, a_renforcer:0, maitrise:0, optimise:0};
  views.forEach(v=> counts[v.level]++);
  const pct = total ? Math.round(((counts.maitrise+counts.optimise)/total)*100) : 0;
  return {views, total, counts, pct};
}

/* ---------- Analyse & import d'un référentiel ---------- */
function parseReferentielText(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const chapterRe = /^(\d+(?:\.\d+){0,3})\s+(.{3,90})$/;
  const reqWordsRe = /\b(doit|doivent|shall|must|est tenu de|il convient de|est requis|obligatoire)\b/i;
  let currentRef = "", currentTitle = "";
  const exigences = [];
  lines.forEach(line=>{
    const m = line.match(chapterRe);
    if(m && !reqWordsRe.test(line)){ currentRef = m[1]; currentTitle = m[2]; return; }
    if(reqWordsRe.test(line)){
      line.split(/(?<=[.;])\s+/).forEach(sentence=>{
        if(reqWordsRe.test(sentence) && sentence.length>15){
          let type = "exigence";
          if(/preuve|enregistrement|trace|document[ée]/i.test(sentence)) type = "preuve";
          else if(/responsab/i.test(sentence)) type = "responsabilite";
          exigences.push({ ref: currentRef || "—", title: (currentTitle || sentence.slice(0,60)).slice(0,90), description: sentence.trim(), sourceText: sentence.trim(), type });
        }
      });
    }
  });
  const seen = new Set();
  const deduped = exigences.filter(e=>{ const k=e.ref+"|"+e.description.slice(0,40); if(seen.has(k)) return false; seen.add(k); return true; });
  return { chapters: [...new Set(deduped.map(e=>e.ref))], exigences: deduped.slice(0,80) };
}
function linkExigenceToSMQ(text){
  const low = text.toLowerCase();
  const words = low.split(/\s+/).filter(w=>w.length>5);
  const processIds = DB.processes.filter(p=> low.includes(p.name.toLowerCase())).map(p=>p.id);
  const docIds = DB.documents.filter(d=> d.status!=="obsolete" && words.some(w=>d.title.toLowerCase().includes(w))).slice(0,3).map(d=>d.id);
  const riskIds = DB.risks.filter(r=> words.some(w=>r.name.toLowerCase().includes(w))).slice(0,3).map(r=>r.id);
  return {processIds, docIds, riskIds, auditIds:[], indicatorIds:[], actionIds:[]};
}

function openReferentielImportModal(presets){
  presets = presets || {};
  const existingRef = presets.refId ? getReferentiel(presets.refId) : null;
  const state = { text:"", parsed:null, meta:{ name: existingRef?existingRef.name:"", version:"", origin:"" } };

  function step1Html(){
    return `
      ${!existingRef?`<div class="field"><label>Nom du référentiel <span class="req">*</span></label><input type="text" id="imp-name" placeholder="Ex : Référentiel groupe qualité"></div>`:`<p class="text-sm mb-2">Référentiel : <strong>${esc(existingRef.name)}</strong></p>`}
      <div class="field-row">
        <div class="field"><label>Version</label><input type="text" id="imp-version" placeholder="Ex : 2026"></div>
        <div class="field"><label>Origine</label><input type="text" id="imp-origin" placeholder="Ex : Import PDF, procédure groupe…"></div>
      </div>
      <div class="field"><label>Fichier (.txt ou .html — lecture automatique)</label><input type="file" id="imp-file" accept=".txt,.html,.htm,.md"></div>
      <p class="text-xs">Les formats PDF et DOCX ne peuvent pas être extraits automatiquement dans ce prototype sans serveur : collez le texte ci-dessous, ou utilisez un export .txt.</p>
      <div class="field"><label>Texte du référentiel <span class="req">*</span></label><textarea id="imp-text" style="min-height:180px;" placeholder="Collez ici le texte du référentiel (chapitres, exigences…)">${esc(state.text)}</textarea></div>
    `;
  }
  function step1Foot(){ return `<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="imp-analyze">🧠 Analyser le document</button>`; }
  function step2Html(){
    const p = state.parsed;
    return `
      <div class="grid grid-3 mb-4">
        <div class="kpi"><div class="val">${p.chapters.length}</div><div class="lbl">Chapitres détectés</div></div>
        <div class="kpi"><div class="val">${p.exigences.length}</div><div class="lbl">Exigences détectées</div></div>
        <div class="kpi"><div class="val">${p.exigences.filter(e=>e.type==="preuve").length}</div><div class="lbl">Preuves attendues</div></div>
      </div>
      <div style="max-height:320px;overflow-y:auto;">
        ${p.exigences.slice(0,15).map(e=>`<div class="rel-link"><span class="rel-name">${esc(e.ref)} — ${esc(e.title)}</span>${badgeRaw("info", LABELS.exigenceType[e.type])}</div>`).join("")}
        ${p.exigences.length>15?`<p class="text-xs mt-2">… et ${p.exigences.length-15} autre(s).</p>`:""}
      </div>
      ${!p.exigences.length?`<p class="text-sm mt-2">⚠️ Aucune exigence détectée. Vérifiez que le texte contient des formulations comme « doit », « doivent » ou « shall ».</p>`:""}
    `;
  }
  function step2Foot(){ return `<button class="btn btn-secondary" id="imp-back">← Revenir</button><button class="btn btn-primary" id="imp-confirm" ${!state.parsed.exigences.length?"disabled":""}>Valider l'import</button>`; }

  function mountStep1(o){
    o.querySelector("#imp-file").addEventListener("change", (e)=>{
      const f = e.target.files[0];
      if(!f) return;
      if(!/\.(txt|html?|md)$/i.test(f.name)){ toast("Ce type de fichier ne peut pas être lu automatiquement — collez le texte","⚠️"); return; }
      const reader = new FileReader();
      reader.onload = ()=>{ o.querySelector("#imp-text").value = String(reader.result).replace(/<[^>]+>/g," "); toast("Fichier chargé"); };
      reader.readAsText(f);
    });
    o.querySelector("#imp-analyze").addEventListener("click", ()=>{
      const text = o.querySelector("#imp-text").value.trim();
      if(!text){ toast("Collez ou importez un texte à analyser","⚠️"); return; }
      state.text = text;
      state.meta.name = existingRef ? existingRef.name : (o.querySelector("#imp-name")?.value.trim() || "Référentiel importé");
      state.meta.version = o.querySelector("#imp-version").value.trim() || String(new Date().getFullYear());
      state.meta.origin = o.querySelector("#imp-origin").value.trim() || "Import texte";
      state.parsed = parseReferentielText(text);
      renderStep(o, 2);
    });
  }
  function mountStep2(o){
    o.querySelector("#imp-back").addEventListener("click", ()=> renderStep(o,1));
    const confirmBtn = o.querySelector("#imp-confirm");
    if(confirmBtn) confirmBtn.addEventListener("click", ()=>{
      let ref = existingRef;
      if(!ref){
        const id = "REF-"+String(Date.now()).slice(-6);
        ref = { id, name:state.meta.name, desc:"Référentiel importé dans Qonnect.", active:false, version:state.meta.version, importDate:new Date().toISOString().slice(0,10), author:"Vous", origin:state.meta.origin, versions:[] };
        DB.referentiels.push(ref);
      }
      const isNewVersion = presets.newVersion && ref.versions.length;
      let diffNote = "Import initial — "+state.parsed.exigences.length+" exigence(s) détectée(s).";
      let diffDetail = null;
      if(isNewVersion){
        const oldExigences = DB.customExigences.filter(e=>e.referentielId===ref.id);
        const keyOf = e => e.ref + "|" + (e.title||"").toLowerCase().slice(0,40);
        const oldMap = new Map(oldExigences.map(e=>[keyOf(e), e]));
        const newMap = new Map(state.parsed.exigences.map(e=>[keyOf(e), e]));
        const added = [...newMap.keys()].filter(k=>!oldMap.has(k)).map(k=>newMap.get(k));
        const removed = [...oldMap.keys()].filter(k=>!newMap.has(k)).map(k=>oldMap.get(k));
        const oldByChapter = {}; oldExigences.forEach(e=>{ (oldByChapter[e.ref]=oldByChapter[e.ref]||[]).push(e); });
        const newByChapter = {}; state.parsed.exigences.forEach(e=>{ (newByChapter[e.ref]=newByChapter[e.ref]||[]).push(e); });
        const modified = [];
        Object.keys(newByChapter).forEach(chRef=>{
          if(oldByChapter[chRef] && oldByChapter[chRef].length && newByChapter[chRef].length){
            const oldTexts = oldByChapter[chRef].map(e=>e.description).join(" ");
            const newTexts = newByChapter[chRef].map(e=>e.description).join(" ");
            if(oldTexts !== newTexts) modified.push("Chapitre "+chRef);
          }
        });
        diffNote = `Nouvelle version — ${added.length} exigence(s) ajoutée(s), ${removed.length} supprimée(s), ${modified.length} chapitre(s) modifié(s).`;
        diffDetail = { added: added.map(e=>e.ref+" — "+e.title), removed: removed.map(e=>e.ref+" — "+e.title), modified };
        DB.customExigences = DB.customExigences.filter(e=>e.referentielId!==ref.id);
      }
      state.parsed.exigences.forEach((e,i)=>{
        const links = linkExigenceToSMQ(e.title+" "+e.description);
        DB.customExigences.push({ id:"CEX-"+ref.id+"-"+i+"-"+String(Date.now()).slice(-4), referentielId:ref.id,
          ref:e.ref, title:e.title, description:e.description, sourceText:e.sourceText, type:e.type, ...links });
      });
      ref.version = state.meta.version; ref.importDate = new Date().toISOString().slice(0,10); ref.origin = state.meta.origin;
      ref.versions.push({version:state.meta.version, date:new Date().toISOString().slice(0,10), note:diffNote, diff:diffDetail});
      saveDB(); closeModal(); toast("Référentiel analysé et importé — "+state.parsed.exigences.length+" exigence(s)");
      navigate(`referentiels/${ref.id}`);
    });
  }
  function renderStep(o, step){
    o.querySelector(".modal-body").innerHTML = step===1?step1Html():step2Html();
    o.querySelector(".modal-foot").innerHTML = step===1?step1Foot():step2Foot();
    if(step===1) mountStep1(o); else mountStep2(o);
  }

  openModal({title: presets.newVersion?"Importer une nouvelle version":"Importer un référentiel", wide:true, bodyHtml:step1Html(), footHtml:step1Foot(), onMount:(o)=>mountStep1(o)});
}

function openReferentielEditForm(refId){
  const ref = getReferentiel(refId);
  if(!ref) return;
  openModal({title:"Modifier le référentiel",
    bodyHtml:`
      <div class="field"><label>Nom <span class="req">*</span></label><input type="text" id="ref-name" value="${esc(ref.name)}"></div>
      <div class="field"><label>Description</label><textarea id="ref-desc">${esc(ref.desc)}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Version</label><input type="text" id="ref-version" value="${esc(ref.version||"")}"></div>
        <div class="field"><label>Origine</label><input type="text" id="ref-origin" value="${esc(ref.origin||"")}"></div>
      </div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ref-save">Enregistrer</button>`,
    onMount:(o)=>{ o.querySelector("#ref-save").addEventListener("click", ()=>{
      const name = o.querySelector("#ref-name").value.trim();
      if(!name){ toast("Merci de saisir un nom","⚠️"); return; }
      ref.name = name; ref.desc = o.querySelector("#ref-desc").value.trim();
      ref.version = o.querySelector("#ref-version").value.trim()||null;
      ref.origin = o.querySelector("#ref-origin").value.trim()||null;
      saveDB(); closeModal(); toast("Référentiel mis à jour"); render();
    });}
  });
}

function deleteReferentiel(refId){
  const ref = getReferentiel(refId);
  if(!ref) return;
  const nbExigences = DB.customExigences.filter(e=>e.referentielId===refId).length + (refId==="ISO9001"?DB.requirements.length:0);
  confirmDialog(`Supprimer définitivement le référentiel « ${ref.name} » et ${nbExigences} exigence(s) associée(s) ? Cette action est irréversible.`, ()=>{
    const wasActive = ref.active;
    DB.referentiels = DB.referentiels.filter(r=>r.id!==refId);
    DB.customExigences = DB.customExigences.filter(e=>e.referentielId!==refId);
    if(refId==="ISO9001") DB.requirements = [];
    if(wasActive && DB.referentiels.length) DB.referentiels[0].active = true;
    saveDB(); toast("Référentiel supprimé"); navigate("referentiels");
  });
}

function openExigenceEditForm(refId, exigenceId){
  const isLegacy = refId==="ISO9001";
  const entity = isLegacy ? findBy(DB.requirements, exigenceId) : getCustomExigence(exigenceId);
  if(!entity) return;
  const currentProcessId = isLegacy ? (entity.processId||"") : ((entity.processIds&&entity.processIds[0])||"");
  const currentDocIds = isLegacy ? (entity.extraDocIds||[]) : (entity.docIds||[]);
  const currentRiskIds = isLegacy ? (entity.extraRiskIds||[]) : (entity.riskIds||[]);
  const currentAuditIds = isLegacy ? (entity.extraAuditIds||[]) : (entity.auditIds||[]);

  openModal({title:"Modifier l'exigence", wide:true,
    bodyHtml:`
      <div class="field-row">
        <div class="field"><label>Référence</label><input type="text" id="ex-ref" value="${esc(entity.ref)}"></div>
        <div class="field"><label>Processus principal</label><select id="ex-process"><option value="">—</option>${DB.processes.map(p=>`<option value="${p.id}" ${currentProcessId===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Intitulé <span class="req">*</span></label><input type="text" id="ex-title" value="${esc(isLegacy?entity.label:entity.title)}"></div>
      ${!isLegacy?`<div class="field"><label>Description</label><textarea id="ex-desc">${esc(entity.description||"")}</textarea></div>`:""}
      <div class="field"><label>Documents associés (preuves)</label><div style="max-height:130px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
        ${DB.documents.filter(d=>d.status!=="obsolete").map(d=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ex-doc-cb" value="${d.id}" ${currentDocIds.includes(d.id)?"checked":""} style="width:auto;"> ${esc(d.title)}</label>`).join("")}
      </div></div>
      <div class="field-row">
        <div class="field"><label>Risques associés</label><div style="max-height:110px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${DB.risks.map(r=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ex-risk-cb" value="${r.id}" ${currentRiskIds.includes(r.id)?"checked":""} style="width:auto;"> ${esc(r.name)}</label>`).join("")}
        </div></div>
        <div class="field"><label>Audits associés</label><div style="max-height:110px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
          ${DB.audits.map(a=>`<label class="flex items-center gap-2 mt-2"><input type="checkbox" class="ex-audit-cb" value="${a.id}" ${currentAuditIds.includes(a.id)?"checked":""} style="width:auto;"> ${esc(a.title)}</label>`).join("")}
        </div></div>
      </div>`,
    footHtml:`<button class="btn btn-danger" id="ex-delete" style="margin-right:auto;">Supprimer</button><button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ex-save">Enregistrer</button>`,
    onMount:(o)=>{
      o.querySelector("#ex-save").addEventListener("click", ()=>{
        const refTxt = o.querySelector("#ex-ref").value.trim() || entity.ref;
        const title = o.querySelector("#ex-title").value.trim();
        if(!title){ toast("Merci de saisir un intitulé","⚠️"); return; }
        const processId = o.querySelector("#ex-process").value || null;
        const docIds = [...o.querySelectorAll(".ex-doc-cb:checked")].map(c=>c.value);
        const riskIds = [...o.querySelectorAll(".ex-risk-cb:checked")].map(c=>c.value);
        const auditIds = [...o.querySelectorAll(".ex-audit-cb:checked")].map(c=>c.value);
        if(isLegacy){
          entity.ref = refTxt; entity.label = title; entity.processId = processId;
          entity.extraDocIds = docIds; entity.extraRiskIds = riskIds; entity.extraAuditIds = auditIds;
        } else {
          entity.ref = refTxt; entity.title = title; entity.description = o.querySelector("#ex-desc").value.trim();
          entity.processIds = processId ? [processId] : []; entity.docIds = docIds; entity.riskIds = riskIds; entity.auditIds = auditIds;
        }
        saveDB(); closeModal(); toast("Exigence mise à jour"); navigate(`referentiels/${refId}/exigences`);
      });
      o.querySelector("#ex-delete").addEventListener("click", ()=>{
        confirmDialog("Supprimer définitivement cette exigence ?", ()=>{
          if(isLegacy) DB.requirements = DB.requirements.filter(r=>r.id!==exigenceId);
          else DB.customExigences = DB.customExigences.filter(e=>e.id!==exigenceId);
          saveDB(); closeModal(); toast("Exigence supprimée"); navigate(`referentiels/${refId}/exigences`);
        });
      });
    }
  });
}

/* ---------- Assistant IA spécialisé Référentiels ---------- */
const REF_AI_HISTORY = {};
function refAIGenerateReply(ref, score, q){
  const low = q.toLowerCase();
  if(/r[ée]sum/.test(low)){
    return `${esc(ref.name)} comporte ${score.total} exigence(s) identifiée(s). Niveau global de maîtrise : <strong>${score.pct}%</strong>. ${score.counts.non_couvert} exigence(s) ne sont couvertes par aucun élément du SMQ à ce jour.<p class="text-xs mt-4">Analyse générée à partir des données disponibles dans Qonnect.</p>`;
  }
  if(/non couvert|pas couvert|[ée]cart|manque/.test(low)){
    const list = score.views.filter(v=>v.level==="non_couvert").slice(0,8);
    return list.length? `Exigences non couvertes :<ul>${list.map(v=>`<li>${esc(v.ref)} — ${esc(v.title)}</li>`).join("")}</ul>` : "Toutes les exigences disposent d'au moins un élément de preuve associé.";
  }
  if(/audit/.test(low)){
    const weak = score.views.filter(v=>v.level==="non_couvert"||v.level==="partiellement").slice(0,6);
    return weak.length? `Pour préparer un audit sur ${esc(ref.name)}, concentrez-vous en priorité sur :<ul>${weak.map(v=>`<li>${esc(v.ref)} — ${esc(v.title)}</li>`).join("")}</ul>` : "Aucun point de vigilance majeur identifié actuellement pour cet audit.";
  }
  if(/revue de direction/.test(low)){
    return `Éléments à intégrer à la revue de direction pour ${esc(ref.name)} : niveau de maîtrise (${score.pct}%), ${score.counts.non_couvert} exigence(s) non couvertes, et les risques réglementaires associés aux processus concernés.`;
  }
  if(/pourquoi|conforme|non conforme/.test(low)){
    return `La conformité d'une exigence est calculée à partir des preuves réellement enregistrées dans Qonnect (documents, audits, actions, risques, indicateurs) — jamais déclarée sans preuve. Ouvrez une exigence dans l'onglet « Exigences » pour voir le détail du calcul.`;
  }
  return `Je peux résumer ce référentiel, lister les exigences non couvertes, préparer un audit ou une revue de direction, ou expliquer le calcul de conformité d'une exigence. Que souhaitez-vous savoir sur ${esc(ref.name)} ?`;
}

/* ---------- Pages ---------- */
function pageReferentiels(){
  return `
  ${pageHeader("Référentiels","Le moteur de conformité de Qonnect — importez un référentiel, Qonnect en analyse la structure et calcule automatiquement votre niveau de maîtrise.",
    `<button class="btn btn-primary" data-open-referentiel-import>+ Importer un référentiel</button>`)}
  <div class="grid grid-3">
    ${DB.referentiels.map(r=>{
      const views = getReferentielExigenceViews(r.id);
      const score = views.length ? referentielScore(r.id) : null;
      return `<div class="card ${r.active?'':'card-hover'}" ${r.active?'':`data-select-ref="${r.id}"`} style="${r.active?'border-color:var(--primary);':''}">
        <div class="flex justify-between items-center">
          <h3>${esc(r.name)}</h3>
          ${r.active?badgeRaw("success","Actif"):""}
        </div>
        <p class="text-sm mt-2">${esc(r.desc)}</p>
        ${score?`<div class="flex items-center gap-2 mt-4"><span class="text-sm" style="font-weight:700;color:var(--primary);">${score.pct}%</span><span class="text-xs">de maîtrise · ${score.total} exigence(s)</span></div>`:`<p class="text-xs mt-4">Aucune exigence importée pour le moment.</p>`}
        <div class="flex gap-2 mt-4" style="flex-wrap:wrap;">
          ${views.length?`<a class="btn btn-primary btn-sm" data-route="referentiels/${r.id}">Voir le détail</a>`:""}
          ${r.active?"":`<button class="btn btn-secondary btn-sm" data-select-ref="${r.id}">Sélectionner</button>`}
          <button class="btn btn-secondary btn-sm" data-edit-ref="${r.id}">✏️ Modifier</button>
          <button class="btn btn-danger btn-sm" data-delete-ref="${r.id}">🗑 Supprimer</button>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function referentielTabsHtml(ref, active){
  const tabs = [{id:"vue",label:"Vue d'ensemble"},{id:"exigences",label:"Exigences"},{id:"cartographie",label:"Cartographie"},{id:"versions",label:"Versions"},{id:"assistant",label:"Assistant IA"}];
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===active?'active':''}" data-route="referentiels/${ref.id}/${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}

function pageReferentielDetail(id, tab, subId){
  const ref = getReferentiel(id);
  if(!ref) return emptyState("🛡️","Référentiel introuvable","Ce référentiel n'existe pas.");
  tab = tab || "vue";
  const score = referentielScore(id);

  const header = `
  ${breadcrumb([{label:"Référentiels",href:"#/referentiels"},{label:ref.name}])}
  <div class="card mb-2">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px;">
      <div>
        <h1>${esc(ref.name)}</h1>
        <p class="section-sub mt-2">${esc(ref.desc)}${ref.version?" · Version "+esc(ref.version):""}${ref.importDate?" · Importé le "+fmtDate(ref.importDate):""}</p>
      </div>
      ${ref.active?badgeRaw("success","Actif"):`<button class="btn btn-secondary btn-sm" data-select-ref="${ref.id}">Activer</button>`}
    </div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-secondary btn-sm" data-edit-ref="${ref.id}">✏️ Modifier</button>
      <button class="btn btn-danger btn-sm" data-delete-ref="${ref.id}">🗑 Supprimer le référentiel</button>
    </div>
    ${score.total?`
    <div class="flex items-center gap-3 mt-4" style="flex-wrap:wrap;">
      ${ringGauge(score.pct, "var(--primary)", 72)}
      <div class="kpi"><div class="val">${score.pct} %</div><div class="lbl">Niveau global de maîtrise</div></div>
      <div class="grid grid-4" style="flex:1;gap:10px;min-width:280px;">
        <div class="kpi"><div class="val" style="color:var(--success)">${score.counts.maitrise+score.counts.optimise}</div><div class="lbl">Maîtrisées</div></div>
        <div class="kpi"><div class="val" style="color:var(--warning)">${score.counts.a_renforcer}</div><div class="lbl">À renforcer</div></div>
        <div class="kpi"><div class="val" style="color:var(--warning)">${score.counts.partiellement}</div><div class="lbl">Partielles</div></div>
        <div class="kpi"><div class="val" style="color:var(--danger)">${score.counts.non_couvert}</div><div class="lbl">Non couvertes</div></div>
      </div>
    </div>` : `<div class="mt-4">${emptyState("📥","Aucune exigence importée","Importez ce référentiel pour que Qonnect en analyse automatiquement la structure.", `<button class="btn btn-primary" data-open-referentiel-import data-preset-ref="${ref.id}">+ Importer ce référentiel</button>`)}</div>`}
  </div>
  ${score.total?referentielTabsHtml(ref, tab):""}`;

  if(!score.total) return header;
  if(tab==="exigences" && subId){
    const v = score.views.find(x=>x.id===subId);
    return header + (v ? refExigenceDetail(ref, v) : emptyState("📐","Exigence introuvable","Cette exigence n'existe pas."));
  }
  let body = "";
  if(tab==="vue") body = refTabVue(ref, score);
  else if(tab==="exigences") body = refTabExigences(ref, score);
  else if(tab==="cartographie") body = refTabCartographie(ref, score);
  else if(tab==="versions") body = refTabVersions(ref);
  else if(tab==="assistant") body = refTabAssistant(ref, score);
  return header + body;
}

function versionDiffHtml(v){
  if(!v.diff) return "";
  const parts = [];
  if(v.diff.added.length) parts.push(`<p class="text-xs mt-2">➕ Ajoutées : ${v.diff.added.map(esc).join(", ")}</p>`);
  if(v.diff.removed.length) parts.push(`<p class="text-xs mt-2">➖ Supprimées : ${v.diff.removed.map(esc).join(", ")}</p>`);
  if(v.diff.modified.length) parts.push(`<p class="text-xs mt-2">✏️ Modifiées : ${v.diff.modified.map(esc).join(", ")}</p>`);
  return parts.join("");
}
function refSynthesisExtras(ref, score){
  const nonCouvertes = score.views.filter(v=>v.level==="non_couvert");
  const competences = [...new Set(nonCouvertes.map(v=>v.process?v.process.name:null).filter(Boolean))];
  const indicateursRecommandes = [...new Set(nonCouvertes.filter(v=>v.process && !DB.indicators.some(i=>i.processId===v.process.id)).map(v=>v.process.name))];
  const auditsRecommandes = [...new Set(nonCouvertes.filter(v=>v.process && !DB.audits.some(a=>a.processId===v.process.id)).map(v=>v.process.name))];
  return `
  <div class="card mt-4">
    <h3 class="mb-2">🧠 Synthèse — ce que ce référentiel exige</h3>
    <p class="text-sm">${score.total} exigence(s) identifiée(s), dont <strong>${nonCouvertes.length}</strong> sans preuve actuellement disponible.</p>
    ${competences.length?`<p class="text-sm mt-2"><strong>Processus à mobiliser (compétences) :</strong> ${competences.map(esc).join(", ")}.</p>`:""}
    <p class="text-sm mt-2"><strong>Documents attendus :</strong> ${nonCouvertes.length} document(s) à créer ou renforcer pour couvrir les exigences non couvertes.</p>
    ${indicateursRecommandes.length?`<p class="text-sm mt-2"><strong>Indicateurs recommandés :</strong> sur ${indicateursRecommandes.map(esc).join(", ")} — aucun indicateur de suivi actuellement.</p>`:""}
    ${auditsRecommandes.length?`<p class="text-sm mt-2"><strong>Audits recommandés :</strong> sur ${auditsRecommandes.map(esc).join(", ")} — non encore audité(s).</p>`:""}
    <p class="text-sm mt-2"><strong>Revue de direction :</strong> ${nonCouvertes.length? "à intégrer à la prochaine revue de direction au vu du nombre d'exigences non couvertes." : "aucun point bloquant à remonter à ce stade."}</p>
    <p class="text-xs mt-4">Synthèse générée à partir des données réelles de Qonnect — jamais inventée.</p>
  </div>`;
}
function refTabVue(ref, score){
  const critiques = score.views.filter(v=>v.level==="non_couvert").slice(0,6);
  const actionsPrioritaires = [...new Map(score.views.flatMap(v=>v.bundle.actionsLate).map(a=>[a.id,a])).values()].slice(0,6);
  return `
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">⚠️ Risques réglementaires</h3>
      ${critiques.length? critiques.map(v=>`<div class="rel-link" data-route="referentiels/${ref.id}/exigences/${v.id}"><span class="rel-name">${esc(v.ref)} — ${esc(v.title)}</span>${badge(LABELS.exigenceCoverage[v.level])}</div>`).join("") : `<p class="text-sm">Aucune exigence critique non couverte.</p>`}
    </div>
    <div class="card">
      <h3 class="mb-2">✅ Actions prioritaires</h3>
      ${actionsPrioritaires.length? actionsPrioritaires.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">${esc(a.title)}</span>${badge(LABELS.priority[a.priority])}</div>`).join("") : `<p class="text-sm">Aucune action en retard liée à ce référentiel.</p>`}
    </div>
  </div>
  <div class="card mt-4">
    <h3 class="mb-2">Dernières modifications</h3>
    ${ref.versions.length? ref.versions.slice().reverse().map(v=>`<div class="mb-2" style="border-bottom:1px solid var(--border);padding-bottom:8px;"><div class="rel-link" style="border:none;padding-bottom:0;"><span class="rel-name">Version ${esc(v.version)}</span><span class="text-sm">${fmtDate(v.date)}${v.note?" · "+esc(v.note):""}</span></div>${versionDiffHtml(v)}</div>`).join("") : `<p class="text-sm">Aucun historique.</p>`}
  </div>
  ${refSynthesisExtras(ref, score)}`;
}

function refTabExigences(ref, score){
  return dataTable(
    [ {label:"Exigence", render:v=>`<div class="cell-title">${esc(v.ref)} — ${esc(v.title)}</div>`},
      {label:"Niveau", render:v=>badge(LABELS.exigenceCoverage[v.level])},
      {label:"Preuves", render:v=>v.bundle.docs.length+" doc(s)"},
      {label:"Risques", render:v=>v.bundle.risksOpen.length},
      {label:"Actions", render:v=>v.bundle.actionsOpen.length+(v.bundle.actionsLate.length?" ("+v.bundle.actionsLate.length+" en retard)":"")},
      {label:"Responsable", render:v=>v.process?esc(v.process.pilot):"—"},
      {label:"Dernière MàJ", render:v=>v.updatedAt?fmtDate(v.updatedAt):"—"},
      {label:"", render:v=>`<button class="btn btn-secondary btn-sm" data-edit-exigence='${jsonAttr({refId:ref.id, exigenceId:v.id})}'>✏️</button>`} ],
    score.views, {rowRoute:v=>`referentiels/${ref.id}/exigences/${v.id}`}
  );
}

function refExigenceDetail(ref, v){
  const reasons = coverageReasons(v.bundle);
  const fournisseursConcernes = v.bundle.processes.length ? DB.fournisseurs.filter(f=>(f.processIds||[]).some(pid=>v.bundle.processes.some(p=>p.id===pid))) : [];
  return `
  ${breadcrumb([{label:"Référentiels",href:"#/referentiels"},{label:ref.name,href:"#/referentiels/"+ref.id},{label:v.ref}])}
  <div class="grid" style="grid-template-columns:2fr 1fr;gap:24px;">
    <div>
      <div class="card mb-2">
        <div class="flex justify-between items-center">${badge(LABELS.exigenceCoverage[v.level])}${badgeRaw("neutral", LABELS.exigenceType[v.type]||v.type)}</div>
        <h1 class="mt-2">${esc(v.ref)} — ${esc(v.title)}</h1>
        ${v.sourceText?`<p class="text-sm mt-4" style="color:var(--text-primary);line-height:1.7;">« ${esc(v.sourceText)} »</p>`:""}
      </div>
      <div class="card mb-2">
        <h3 class="mb-2">Pourquoi ce niveau ?</h3>
        <ul>${reasons.map(r=>`<li class="text-sm mt-2">${esc(r)}</li>`).join("")}</ul>
        <p class="text-xs mt-4">Calcul basé sur les preuves réellement enregistrées dans Qonnect — jamais déclaré sans preuve.</p>
      </div>
      ${fournisseursConcernes.length?`<div class="card mb-2">
        <h3 class="mb-2">Fournisseurs concernés</h3>
        <p class="text-xs mb-2">Prestataires externes rattachés aux processus couverts par cette exigence (ISO 9001 §8.4 — maîtrise des processus, produits et services fournis par des tiers).</p>
        ${fournisseursConcernes.map(f=>{const perf=fournisseurPerformanceScore(f.id); return `<div class="rel-link" data-route="fournisseurs/liste/${f.id}"><span class="rel-name">🏭 ${esc(f.nomCommercial)}</span>${badge(LABELS.fournisseurCriticite[f.criticite])}<span class="text-sm">${perf.score}/100</span></div>`;}).join("")}
      </div>`:""}
      <div class="card">
        <h3 class="mb-2">Analyse d'impact — si cette exigence évolue</h3>
        <p class="text-xs mb-2">En cas de modification de cette exigence (ou de sa source normative), Qonnect identifie automatiquement ce qui serait à revoir :</p>
        <div class="grid grid-4">
          <div class="kpi"><div class="val">${v.bundle.processes.length}</div><div class="lbl">Processus</div></div>
          <div class="kpi"><div class="val">${v.bundle.docs.length}</div><div class="lbl">Documents</div></div>
          <div class="kpi"><div class="val">${v.bundle.audits.length}</div><div class="lbl">Audits</div></div>
          <div class="kpi"><div class="val">${v.bundle.actionsOpen.length}</div><div class="lbl">Actions à ouvrir/suivre</div></div>
        </div>
      </div>
    </div>
    <div>
      <div class="card">
        <h3 class="mb-2">Éléments reliés</h3>
        ${v.bundle.processes.map(p=>`<div class="rel-link" data-route="processus/${p.id}"><span class="rel-name">🧩 ${esc(p.name)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.docs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.audits.map(a=>`<div class="rel-link" data-route="audits/${a.id}"><span class="rel-name">🔍 ${esc(a.title)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.risksOpen.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">⚠️ ${esc(r.name)}</span><span class="chev">›</span></div>`).join("")}
        ${v.bundle.actionsOpen.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">✅ ${esc(a.title)}</span><span class="chev">›</span></div>`).join("")}
        ${(!v.bundle.processes.length && !v.bundle.docs.length && !v.bundle.audits.length && !v.bundle.risksOpen.length && !v.bundle.actionsOpen.length)?`<p class="text-sm">Aucun élément relié pour le moment.</p>`:""}
      </div>
    </div>
  </div>`;
}

function refTabCartographie(ref, score){
  return score.views.map(v=>`
    <div class="card mb-2">
      <div class="flex justify-between items-center"><h3 style="font-size:14.5px;">${esc(v.ref)} — ${esc(v.title)}</h3>${badge(LABELS.exigenceCoverage[v.level])}</div>
      <div class="grid grid-2 mt-2">
        <div>
          ${v.bundle.docs.length?`<div class="text-xs mb-2">DOCUMENTS</div>${v.bundle.docs.map(d=>`<div class="rel-link" data-route="documents/${d.type}/${d.id}"><span class="rel-name">📄 ${esc(d.title)}</span></div>`).join("")}`:""}
          ${v.bundle.audits.length?`<div class="text-xs mb-2 mt-2">AUDITS</div>${v.bundle.audits.map(a=>`<div class="rel-link" data-route="audits/${a.id}"><span class="rel-name">🔍 ${esc(a.title)}</span></div>`).join("")}`:""}
        </div>
        <div>
          ${v.bundle.risksOpen.length?`<div class="text-xs mb-2">RISQUES</div>${v.bundle.risksOpen.map(r=>`<div class="rel-link" data-route="risques/${r.id}"><span class="rel-name">⚠️ ${esc(r.name)}</span></div>`).join("")}`:""}
          ${v.bundle.actionsOpen.length?`<div class="text-xs mb-2 mt-2">ACTIONS</div>${v.bundle.actionsOpen.map(a=>`<div class="rel-link" data-route="actions"><span class="rel-name">✅ ${esc(a.title)}</span></div>`).join("")}`:""}
        </div>
      </div>
      ${(!v.bundle.docs.length && !v.bundle.audits.length && !v.bundle.risksOpen.length && !v.bundle.actionsOpen.length)?`<p class="text-sm mt-2">Aucun élément relié.</p>`:""}
    </div>`).join("");
}

function refTabVersions(ref){
  return `
  <div class="flex justify-between items-center mb-2"><span></span><button class="btn btn-primary btn-sm" data-open-referentiel-import data-preset-ref="${ref.id}" data-preset-newversion="1">+ Nouvelle version</button></div>
  ${ref.versions.length? ref.versions.slice().reverse().map(v=>`<div class="card mb-2"><div class="flex justify-between items-center"><h3>Version ${esc(v.version)}</h3><span class="text-sm">${fmtDate(v.date)}</span></div>${v.note?`<p class="text-sm mt-2">${esc(v.note)}</p>`:""}${versionDiffHtml(v)}</div>`).join("") : `<div class="card">${emptyState("🕒","Aucune version","Aucun historique de version n'est disponible.")}</div>`}`;
}

function refTabAssistant(ref, score){
  if(!REF_AI_HISTORY[ref.id]) REF_AI_HISTORY[ref.id] = [{role:"bot", text:"Bonjour, je suis l'assistant spécialisé "+esc(ref.name)+". Je peux résumer ce référentiel, identifier les preuves attendues, préparer un audit ou expliquer un niveau de conformité — toujours à partir de vos données réelles."}];
  const suggestions = ["Résume ce référentiel","Quelles exigences ne sont pas couvertes ?","Prépare un audit sur ce référentiel","Pourquoi une exigence peut être non conforme ?"];
  return `
  <div class="card" style="padding:0;">
    <div class="ai-shell" style="padding:20px;height:auto;max-height:560px;">
      <div class="ai-messages" id="ref-ai-messages">${REF_AI_HISTORY[ref.id].map(aiMsgHtml).join("")}</div>
      <div class="ai-suggestions">${suggestions.map(s=>`<button class="chip" data-ref-ai-suggest="${esc(s)}" data-ref-id="${ref.id}">${esc(s)}</button>`).join("")}</div>
      <div class="ai-input-row"><input type="text" id="ref-ai-input" placeholder="Posez une question sur ${esc(ref.name)}…"><button class="btn btn-primary" id="ref-ai-send" data-ref-id="${ref.id}">Envoyer</button></div>
    </div>
  </div>`;
}
function refAiSend(refId, text){
  text = (text||"").trim();
  if(!text) return;
  const ref = getReferentiel(refId);
  const score = referentielScore(refId);
  if(!REF_AI_HISTORY[refId]) REF_AI_HISTORY[refId] = [];
  REF_AI_HISTORY[refId].push({role:"user", text:esc(text)});
  REF_AI_HISTORY[refId].push({role:"bot", text:refAIGenerateReply(ref, score, text)});
  const zone = document.getElementById("ref-ai-messages");
  if(zone){ zone.innerHTML = REF_AI_HISTORY[refId].map(aiMsgHtml).join(""); zone.scrollTop = zone.scrollHeight; }
}

function pageConformite(tab){
  const active = DB.referentiels.find(r=>r.active);
  if(!active) return emptyState("🛡️","Aucun référentiel actif","Sélectionnez un référentiel dans le module Référentiels.", `<button class="btn btn-primary" data-route="referentiels">Aller aux référentiels</button>`);
  return pageReferentielDetail(active.id, tab||"vue");
}

