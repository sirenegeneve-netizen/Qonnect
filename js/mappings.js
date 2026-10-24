/* ============================================================
   CORRESPONDANCES ENTRE EXIGENCES DE RÉFÉRENTIELS DIFFÉRENTS (étape 3)
   - Modèle durable : DB.exigenceMappings. Les extrémités sont les identifiants STABLES des exigences (étape 2), jamais leur code ni leur texte.
   - Une correspondance est un lien de LECTURE : elle ne modifie aucun score de maîtrise, aucun niveau de couverture, aucun audit.
   - La similarité n'est jamais une preuve d'équivalence : une correspondance « validée » est toujours une décision humaine.
   - Aucune suppression silencieuse : rejeter conserve la trace (et évitera de re-proposer la même paire) ; chaque changement est historisé.
   - Si une exigence liée change de contenu depuis la validation, la correspondance passe « à revoir » (elle n'est pas invalidée seule).
   - Cette étape ne contient AUCUNE suggestion automatique : les propositions (règles, puis IA locale) viennent à l'étape suivante
     et créeront des correspondances au statut « suggérée », à valider.
   ============================================================ */

const MAPPING_RELATIONS = {
  equivalente:   { label:"Équivalente",                 help:"Les deux exigences demandent la même chose." },
  partielle:     { label:"Partiellement équivalente",   help:"L'une ne couvre qu'une partie de l'autre." },
  complementaire:{ label:"Complémentaire",              help:"Exigences distinctes qu'il faut traiter ensemble." },
};
const MAPPING_STATUS = {
  suggested:{ l:"À valider", c:"warning" },
  validated:{ l:"Validée",   c:"success" },
  rejected: { l:"Rejetée",   c:"neutral" },
};
const MAPPING_ORIGINS = { manuel:"Manuelle", regles:"Règles", ia:"IA locale" };
const MAP_UI = { status:"all", other:[], openOther:false };   /* other : liste d'identifiants de référentiels (vide = tous) */

/* Sélecteur multiple de référentiels (cases à cocher dans un menu repliable). `selected` : tableau d'identifiants (vide = tous). */
function multiPickHtml(key, label, options, selected, open){
  const sel = new Set(selected||[]);
  const summary = !sel.size ? "Tous les référentiels" : sel.size===1 ? (options.find(o=>sel.has(o.id))||{name:"1 sélectionné"}).name : sel.size+" référentiels";
  return `<details class="multi-pick" data-multi-pick="${esc(key)}" ${open?"open":""}><summary aria-label="${esc(label)}">${esc(label)} : <strong>${esc(summary)}</strong></summary>
    <div class="multi-pick-body"><div class="multi-pick-bulk"><button type="button" class="btn btn-secondary btn-sm" data-multi-bulk="all">Tout cocher</button> <button type="button" class="btn btn-secondary btn-sm" data-multi-bulk="none">Effacer</button></div>
    ${options.map(o=>`<label class="multi-pick-opt"><input type="checkbox" data-multi-opt value="${esc(o.id)}" ${sel.has(o.id)?"checked":""}> <span>${esc(o.name)}${o.hint?` <span class="text-xs">${esc(o.hint)}</span>`:""}</span></label>`).join("")}</div></details>`;
}
function multiPickValues(container){ return [...container.querySelectorAll("[data-multi-opt]:checked")].map(c=>c.value); }

function newMappingId(){
  const a = new Uint8Array(6); (self.crypto||window.crypto).getRandomValues(a);
  return "MAP-"+Array.from(a).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function mapNow(){ return new Date().toISOString(); }

/* ---------- Résolution d'une extrémité (ISO 9001 historique ou exigence importée) ---------- */
function mappingEndpoint(id){
  const legacy = findBy(DB.requirements, id);
  if(legacy) return { id, referentielId:"ISO9001", ref:legacy.ref, title:legacy.label, text:legacy.label, retired:false, legacy:true,
    stamp:vmHash(legacy.label), toReview:false };
  const c = getCustomExigence(id);
  if(!c) return null;
  const text = c.description || c.title || "";
  return { id, referentielId:c.referentielId, ref:c.ref, title:c.title||"", text, sourceText:c.sourceText||"", retired:c.status==="retired", legacy:false,
    stamp:vmHash(text+"|"+(c.sourceText||"")), toReview:!!c.aRevoir };
}
/* Exigences proposables d'un référentiel (actives uniquement). */
function listExigencesOfReferentiel(refId){
  if(refId==="ISO9001") return DB.requirements.map(r=>({ id:r.id, ref:r.ref, title:r.label, text:r.label }));
  return DB.customExigences.filter(e=>e.referentielId===refId && e.status!=="retired").map(e=>({ id:e.id, ref:e.ref, title:e.title||"", text:e.description||e.title||"", chapterTitle:e.chapterTitle||"" }));
}
function mappableReferentiels(){
  return DB.referentiels.filter(r=> r.id==="ISO9001" ? DB.requirements.length : DB.customExigences.some(e=>e.referentielId===r.id));
}

/* ---------- Accès ---------- */
function mappingPairKey(idA, idB){ return [idA,idB].sort().join("|"); }
function findMapping(idA, idB){ const k = mappingPairKey(idA,idB); return (DB.exigenceMappings||[]).find(m=>mappingPairKey(m.exigenceAId,m.exigenceBId)===k) || null; }
function mappingsOfReferentiel(refId){ return (DB.exigenceMappings||[]).filter(m=>m.refA===refId || m.refB===refId); }
function mappingsOfExigence(id){ return (DB.exigenceMappings||[]).filter(m=>m.exigenceAId===id || m.exigenceBId===id); }
function mappingById(id){ return (DB.exigenceMappings||[]).find(m=>m.id===id) || null; }

/* État d'une correspondance : "ok" | "a_revoir" (contenu modifié depuis la validation) | "retiree" (une extrémité est retirée) | "introuvable". */
function mappingState(m){
  const a = mappingEndpoint(m.exigenceAId), b = mappingEndpoint(m.exigenceBId);
  if(!a || !b) return "introuvable";
  if(a.retired || b.retired) return "retiree";
  if(m.status==="validated" && (a.stamp!==m.stampA || b.stamp!==m.stampB || a.toReview || b.toReview)) return "a_revoir";
  return "ok";
}
function mapHistory(m, action, extra){
  if(!m.history) m.history = [];
  m.history.push(Object.assign({ date:mapNow(), by:"Vous", action }, extra||{}));
}

/* ---------- Création et décisions ---------- */
/* opts : { relation, comment, origin, status, confidence, basis }. Retourne { ok:true, mapping } ou { ok:false, error }. */
function createMapping(idX, idY, opts){
  opts = opts || {};
  if(!DB.exigenceMappings) DB.exigenceMappings = [];
  const x = mappingEndpoint(idX), y = mappingEndpoint(idY);
  if(!x || !y) return { ok:false, error:"Une des deux exigences est introuvable." };
  if(idX===idY) return { ok:false, error:"Une exigence ne peut pas être mise en correspondance avec elle-même." };
  if(x.referentielId===y.referentielId) return { ok:false, error:"Les deux exigences appartiennent au même référentiel : une correspondance relie deux référentiels différents." };
  if(!MAPPING_RELATIONS[opts.relation]) return { ok:false, error:"Choisissez le type de correspondance." };
  const existing = findMapping(idX, idY);
  if(existing) return { ok:false, error:"Cette paire a déjà une correspondance ("+MAPPING_STATUS[existing.status].l.toLowerCase()+").", existing };
  const [aId, bId] = [idX,idY].sort();
  const a = aId===idX ? x : y, b = aId===idX ? y : x;
  const status = opts.status || "validated";
  const origin = opts.origin || "manuel";
  const m = { id:newMappingId(), exigenceAId:aId, exigenceBId:bId, refA:a.referentielId, refB:b.referentielId, stampA:a.stamp, stampB:b.stamp,
    relation:opts.relation, status, origin, confidence: typeof opts.confidence==="number" ? opts.confidence : null, basis: opts.basis||[],
    comment:(opts.comment||"").trim(), createdAt:mapNow(), createdBy:"Vous", history:[] };
  mapHistory(m, "creation", { to:status, relation:opts.relation, origin, comment:m.comment||undefined });
  DB.exigenceMappings.push(m);
  return { ok:true, mapping:m };
}
function setMappingStatus(id, status, comment){
  const m = mappingById(id); if(!m || !MAPPING_STATUS[status] || m.status===status) return false;
  const from = m.status; m.status = status;
  if(status==="validated"){   /* la décision porte sur le contenu actuel des deux exigences */
    const a = mappingEndpoint(m.exigenceAId), b = mappingEndpoint(m.exigenceBId);
    if(a) m.stampA = a.stamp; if(b) m.stampB = b.stamp;
  }
  mapHistory(m, status==="validated"?"validation":status==="rejected"?"rejet":"reouverture", { from, to:status, comment:(comment||"").trim()||undefined });
  return true;
}
function updateMapping(id, patch){
  const m = mappingById(id); if(!m) return false;
  let changed = false;
  if(patch.relation && patch.relation!==m.relation && MAPPING_RELATIONS[patch.relation]){ mapHistory(m, "modification", { field:"relation", from:m.relation, to:patch.relation }); m.relation = patch.relation; changed = true; }
  if(typeof patch.comment==="string" && patch.comment.trim()!==(m.comment||"")){ mapHistory(m, "modification", { field:"commentaire", from:m.comment||"", to:patch.comment.trim() }); m.comment = patch.comment.trim(); changed = true; }
  return changed;
}
/* « Je confirme que la correspondance reste valable » après modification du contenu d'une exigence. */
function confirmMappingStillValid(id){
  const m = mappingById(id); if(!m) return false;
  const a = mappingEndpoint(m.exigenceAId), b = mappingEndpoint(m.exigenceBId); if(!a||!b) return false;
  m.stampA = a.stamp; m.stampB = b.stamp;
  mapHistory(m, "revue", { comment:"Correspondance revue après modification du contenu : toujours valable" });
  return true;
}
function deleteMapping(id){ DB.exigenceMappings = (DB.exigenceMappings||[]).filter(m=>m.id!==id); }

/* ---------- Interface : onglet « Correspondances » d'un référentiel ---------- */
function exigenceChip(ep, fallbackId){
  if(!ep) return `<span class="text-xs">Exigence introuvable <code>${esc(fallbackId)}</code></span>`;
  const rf = getReferentiel(ep.referentielId);
  const ex = typeof crossExcerpt==="function" ? crossExcerpt(ep, 130) : "";
  const code = typeof crossCode==="function" ? crossCode(ep.id, ep.ref) : ep.ref;
  return `<div class="cell-title">${esc(code)} — ${esc(ep.title||ep.text.slice(0,80))}</div>${ex?`<div class="text-xs" style="font-weight:400;">${esc(ex)}</div>`:""}<div class="text-xs">${esc(rf?rf.name:ep.referentielId)}${ep.retired?" · <strong>retirée de la version courante</strong>":""}</div>`;
}
function mappingStateBadge(m){
  const s = mappingState(m);
  if(s==="a_revoir") return badgeRaw("warning","À revoir : contenu modifié");
  if(s==="retiree") return badgeRaw("neutral","Exigence retirée");
  if(s==="introuvable") return badgeRaw("danger","Exigence introuvable");
  return "";
}
function mappingActionsHtml(m, refId){
  const b = (action, label, cls)=>`<button class="btn ${cls||"btn-secondary"} btn-sm" data-map-act='${jsonAttr({action, id:m.id, refId})}'>${label}</button>`;
  const out = [];
  const st = mappingState(m);
  if(m.status==="suggested") out.push(b("validate","Valider","btn-primary"), b("reject","Rejeter"));
  if(m.status==="validated"){ if(st==="a_revoir") out.push(b("review","Toujours valable","btn-primary")); out.push(b("reject","Invalider")); }
  if(m.status==="rejected") out.push(b("validate","Valider"));
  out.push(b("edit","✏️"), b("history","🕒"), b("delete","🗑"));
  return `<div class="flex gap-2" style="flex-wrap:wrap;">${out.join("")}</div>`;
}
function refTabMappings(ref){
  const all = mappingsOfReferentiel(ref.id);
  const side = m => m.refA===ref.id ? { own:m.exigenceAId, other:m.exigenceBId, otherRef:m.refB } : { own:m.exigenceBId, other:m.exigenceAId, otherRef:m.refA };
  const countWith = rid => all.filter(m=>side(m).otherRef===rid).length;
  const otherOpts = mappableReferentiels().filter(r=>r.id!==ref.id).map(r=>({ id:r.id, name:r.name, hint: countWith(r.id) ? "("+countWith(r.id)+")" : "" }));
  const chosen = MAP_UI.other.filter(id=>otherOpts.some(o=>o.id===id));
  const rows = all.filter(m=>{
    if(MAP_UI.status==="a_revoir"){ if(mappingState(m)!=="a_revoir") return false; }
    else if(MAP_UI.status!=="all" && m.status!==MAP_UI.status) return false;
    if(chosen.length && !chosen.includes(side(m).otherRef)) return false;
    return true;
  });
  const count = s => all.filter(m=>m.status===s).length;
  const nRev = all.filter(m=>mappingState(m)==="a_revoir").length;
  const opt = (v,l,cur)=>`<option value="${esc(v)}" ${cur===v?"selected":""}>${esc(l)}</option>`;
  return `
  <div class="aq-callout" style="margin-bottom:12px;">Une correspondance est un <strong>lien de lecture entre deux référentiels</strong> : elle n'influence ni les niveaux de maîtrise ni les audits. Elle ne devient « validée » que par votre décision — une ressemblance de texte n'est jamais une preuve d'équivalence.</div>
  <div class="flex justify-between items-center mb-2" style="gap:8px;flex-wrap:wrap;">
    <div class="filters-bar" style="margin:0;">
      <select data-map-filter="status" aria-label="Statut">${opt("all","Tous les statuts",MAP_UI.status)}${opt("validated","Validées ("+count("validated")+")",MAP_UI.status)}${opt("suggested","À valider ("+count("suggested")+")",MAP_UI.status)}${opt("rejected","Rejetées ("+count("rejected")+")",MAP_UI.status)}${opt("a_revoir","À revoir ("+nRev+")",MAP_UI.status)}</select>
      ${multiPickHtml("map-other","Référentiels liés",otherOpts,chosen,MAP_UI.openOther)}
    </div>
    <div class="flex gap-2"><button class="btn btn-secondary btn-sm" data-map-suggest='${jsonAttr({refId:ref.id})}'>✨ Suggérer des correspondances</button>${all.some(m=>m.status==="suggested")?`<button class="btn btn-secondary btn-sm" data-map-trim='${jsonAttr({refId:ref.id})}' title="Retirer les suggestions les moins sûres, avant de les valider">Réduire les suggestions</button>`:""}
    <button class="btn btn-primary btn-sm" data-map-add='${jsonAttr({refId:ref.id})}'>+ Ajouter une correspondance</button></div>
  </div>
  ${dataTable([
    {label:"Exigence de ce référentiel", render:m=>exigenceChip(mappingEndpoint(side(m).own), side(m).own)},
    {label:"Relation", render:m=>esc(MAPPING_RELATIONS[m.relation].label)+(m.status==="suggested"?`<div class="text-xs">proposée, à confirmer</div>`:"")},
    {label:"Exigence liée", render:m=>exigenceChip(mappingEndpoint(side(m).other), side(m).other)},
    {label:"Statut", render:m=>badge(MAPPING_STATUS[m.status])+(mappingStateBadge(m)?"<div class='mt-2'>"+mappingStateBadge(m)+"</div>":"")+(m.status==="suggested"?mappingBasisHtml(m):"")+`<div class="text-xs mt-2">${esc(MAPPING_ORIGINS[m.origin]||m.origin)}${typeof m.confidence==="number"?" · indice "+Math.round(m.confidence*100)+" %":""}${m.comment?" · "+esc(m.comment.length>60?m.comment.slice(0,59)+"…":m.comment):""}</div>`},
    {label:"", render:m=>mappingActionsHtml(m, ref.id)} ],
    rows, {emptyEmoji:"🔗", emptyTitle: all.length?"Aucune correspondance pour ce filtre":"Aucune correspondance", emptyText: all.length?"Modifiez les filtres.":"Reliez une exigence de ce référentiel à l'exigence équivalente d'un autre référentiel (par exemple ISO 9001)."})}`;
}
/* Motifs d'une suggestion : toujours visibles, pour que la décision soit éclairée. */
function mappingBasisHtml(m){ return (m.basis&&m.basis.length) ? `<details class="mt-2"><summary class="text-xs">Pourquoi cette suggestion ?</summary><ul>${m.basis.map(b=>`<li class="text-xs">${esc(b)}</li>`).join("")}</ul><p class="text-xs">Un indice n'est pas une preuve d'équivalence.</p></details>` : ""; }
/* Carte « Correspondances » sur la fiche d'une exigence. */
function exigenceMappingsCardHtml(refId, exigenceId){
  const list = mappingsOfExigence(exigenceId).filter(m=>m.status!=="rejected");
  const rows = list.map(m=>{ const otherId = m.exigenceAId===exigenceId ? m.exigenceBId : m.exigenceAId; const ep = mappingEndpoint(otherId);
    return `<div class="rel-link" data-route="referentiels/${ep?ep.referentielId:refId}/correspondances"><span class="rel-name">🔗 ${esc(ep?(typeof crossCode==="function"?crossCode(ep.id,ep.ref):ep.ref)+" — "+(ep.title||""):"Exigence introuvable")} <span class="text-xs">(${esc(ep&&getReferentiel(ep.referentielId)?getReferentiel(ep.referentielId).name:"")} · ${esc(MAPPING_RELATIONS[m.relation].label.toLowerCase())} · ${esc(MAPPING_STATUS[m.status].l.toLowerCase())})</span></span><span class="chev">›</span></div>`; }).join("");
  return `<div class="card mb-2"><div class="flex justify-between items-center"><h3>Correspondances avec d'autres référentiels</h3><button class="btn btn-secondary btn-sm" data-map-add='${jsonAttr({refId, exigenceId})}'>+ Ajouter</button></div>
    ${rows || `<p class="text-sm mt-2">Aucune correspondance enregistrée.</p>`}</div>`;
}

/* ---------- Formulaire d'ajout ---------- */
function openMappingForm(refId, presetExigenceId){
  const ref = getReferentiel(refId); if(!ref) return;
  const others = mappableReferentiels().filter(r=>r.id!==refId);
  if(!others.length){ toast("Aucun autre référentiel avec des exigences : importez-en un d'abord.","⚠️"); return; }
  const mine = listExigencesOfReferentiel(refId);
  const S = { own:presetExigenceId||null, other:null, otherRef:others[0].id };
  const label = e=>e.ref+" — "+(e.title||e.text).slice(0,90);
  const optionsHtml = (list, q, sel)=>{
    const n = vmNorm(q||""); const f = n ? list.filter(e=>vmNorm(e.ref+" "+e.title+" "+e.text).includes(n)) : list;
    return f.slice(0,200).map(e=>`<option value="${esc(e.id)}" ${e.id===sel?"selected":""}>${esc(label(e))}</option>`).join("") + (f.length>200?`<option disabled>… ${f.length-200} de plus : affinez la recherche</option>`:"") + (f.length?"":`<option disabled>Aucun résultat</option>`);
  };
  openModal({ title:"Ajouter une correspondance", wide:true,
    bodyHtml:`<p class="text-xs mb-2">Reliez une exigence de « ${esc(ref.name)} » à l'exigence correspondante d'un autre référentiel. La correspondance est enregistrée comme <strong>validée</strong> (décision manuelle) et n'a aucun effet sur les niveaux de maîtrise.</p>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px;">
        <div><div class="field"><label>Exigence de ${esc(ref.name)}</label><input type="text" id="map-own-q" placeholder="Rechercher (code, mots du texte)…"></div>
          <select id="map-own" size="7" style="width:100%;">${optionsHtml(mine,"",S.own)}</select></div>
        <div><div class="field"><label>Référentiel lié</label><select id="map-other-ref">${others.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("")}</select></div>
          <div class="field"><input type="text" id="map-other-q" placeholder="Rechercher (code, mots du texte)…"></div>
          <select id="map-other" size="7" style="width:100%;">${optionsHtml(listExigencesOfReferentiel(S.otherRef),"",null)}</select></div>
      </div>
      <div id="map-preview" class="grid mt-2" style="grid-template-columns:1fr 1fr;gap:16px;"><div class="text-xs"></div><div class="text-xs"></div></div>
      <div class="grid mt-2" style="grid-template-columns:1fr 2fr;gap:16px;">
        <div class="field"><label>Type de correspondance <span class="req">*</span></label><select id="map-rel"><option value="">— Choisir —</option>${Object.keys(MAPPING_RELATIONS).map(k=>`<option value="${k}">${esc(MAPPING_RELATIONS[k].label)}</option>`).join("")}</select><div class="text-xs mt-2" id="map-rel-help"></div></div>
        <div class="field"><label>Commentaire (facultatif)</label><textarea id="map-comment" rows="2" placeholder="Justification, périmètre de l'équivalence…"></textarea></div>
      </div><p class="text-xs" id="map-err" style="color:var(--danger,#c0392b);"></p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="map-save">Enregistrer</button>`,
    onMount:(o)=>{
      const $ = s=>o.querySelector(s);
      const preview = ()=>{
        const cells = $("#map-preview").children;
        [[S.own,0],[S.other,1]].forEach(([id,i])=>{ const ep = id?mappingEndpoint(id):null; cells[i].innerHTML = ep ? `<strong>${esc(ep.ref)}</strong> ${esc(ep.text.length>400?ep.text.slice(0,399)+"…":ep.text)}` : ""; });
      };
      $("#map-own-q").addEventListener("input", e=>{ $("#map-own").innerHTML = optionsHtml(mine, e.target.value, S.own); });
      $("#map-other-q").addEventListener("input", e=>{ $("#map-other").innerHTML = optionsHtml(listExigencesOfReferentiel(S.otherRef), e.target.value, S.other); });
      $("#map-other-ref").addEventListener("change", e=>{ S.otherRef = e.target.value; S.other = null; $("#map-other-q").value = ""; $("#map-other").innerHTML = optionsHtml(listExigencesOfReferentiel(S.otherRef),"",null); preview(); });
      $("#map-own").addEventListener("change", e=>{ S.own = e.target.value; preview(); });
      $("#map-other").addEventListener("change", e=>{ S.other = e.target.value; preview(); });
      $("#map-rel").addEventListener("change", e=>{ $("#map-rel-help").textContent = (MAPPING_RELATIONS[e.target.value]||{}).help||""; });
      preview();
      $("#map-save").addEventListener("click", ()=>{
        const err = $("#map-err");
        if(!S.own || !S.other){ err.textContent = "Sélectionnez une exigence de chaque côté."; return; }
        const r = createMapping(S.own, S.other, { relation:$("#map-rel").value, comment:$("#map-comment").value, origin:"manuel", status:"validated" });
        if(!r.ok){ err.textContent = r.error; return; }
        try{ saveDB(); }catch(e){ deleteMapping(r.mapping.id); err.textContent = "Enregistrement impossible (stockage plein ?) : rien n'a été modifié."; return; }
        closeModal(); toast("Correspondance enregistrée","✅"); render();
      });
    } });
}
function openMappingEditForm(id){
  const m = mappingById(id); if(!m) return;
  openModal({ title:"Modifier la correspondance",
    bodyHtml:`<div class="field"><label>Type de correspondance</label><select id="mapx-rel">${Object.keys(MAPPING_RELATIONS).map(k=>`<option value="${k}" ${k===m.relation?"selected":""}>${esc(MAPPING_RELATIONS[k].label)}</option>`).join("")}</select></div>
      <div class="field"><label>Commentaire</label><textarea id="mapx-comment" rows="3">${esc(m.comment||"")}</textarea></div>
      <p class="text-xs">Le changement est ajouté à l'historique ; l'ancienne valeur n'est pas perdue.</p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="mapx-save">Enregistrer</button>`,
    onMount:(o)=>{ o.querySelector("#mapx-save").addEventListener("click", ()=>{
      const changed = updateMapping(id, { relation:o.querySelector("#mapx-rel").value, comment:o.querySelector("#mapx-comment").value });
      if(changed) saveDB(); closeModal(); render(); }); } });
}
function openMappingHistory(id){
  const m = mappingById(id); if(!m) return;
  const A = { creation:"Création", validation:"Validation", rejet:"Rejet", reouverture:"Réouverture", modification:"Modification", revue:"Revue" };
  const line = h=>`<div class="card mb-2"><div class="flex justify-between"><strong>${esc(A[h.action]||h.action)}</strong><span class="text-xs">${esc((h.date||"").replace("T"," ").slice(0,16))} · ${esc(h.by||"")}</span></div>
    <div class="text-xs mt-2">${h.field?esc(h.field)+" : « "+esc(h.from||"")+" » → « "+esc(h.to||"")+" »":(h.from&&h.to?esc((MAPPING_STATUS[h.from]||{}).l||h.from)+" → "+esc((MAPPING_STATUS[h.to]||{}).l||h.to):(h.to?esc((MAPPING_STATUS[h.to]||{}).l||h.to)+(h.origin?" · origine : "+esc(MAPPING_ORIGINS[h.origin]||h.origin):""):""))}${h.comment?" — "+esc(h.comment):""}</div></div>`;
  openModal({ title:"Historique de la correspondance", bodyHtml:(m.history||[]).slice().reverse().map(line).join("")||"<p>Aucun événement.</p>", footHtml:`<button class="btn btn-secondary" data-close-modal>Fermer</button>` });
}
function mappingAction(p){
  const m = mappingById(p.id); if(!m) return;
  const done = msg=>{ try{ saveDB(); }catch(e){ toast("Enregistrement impossible (stockage plein ?)","⚠️"); return; } if(msg) toast(msg,"✅"); render(); };
  if(p.action==="validate") openMappingValidateForm(m.id);
  else if(p.action==="reject"){ setMappingStatus(m.id,"rejected"); done("Correspondance mise de côté (rejetée) — la trace est conservée"); }
  else if(p.action==="review"){ confirmMappingStillValid(m.id); done("Correspondance confirmée"); }
  else if(p.action==="edit") openMappingEditForm(m.id);
  else if(p.action==="history") openMappingHistory(m.id);
  else if(p.action==="delete") confirmDialog("Supprimer définitivement cette correspondance et son historique ? Pour seulement l'écarter en gardant la trace, utilisez « Rejeter ».", ()=>{ deleteMapping(m.id); done("Correspondance supprimée"); });
}

/* Validation d'une suggestion : la relation est confirmée ou corrigée par la personne, jamais validée « telle quelle » sans choix. */
function openMappingValidateForm(id){
  const m = mappingById(id); if(!m) return;
  const a = mappingEndpoint(m.exigenceAId), b = mappingEndpoint(m.exigenceBId);
  const box = ep => ep ? `<div class="card"><strong>${esc(typeof crossCode==="function"?crossCode(ep.id,ep.ref):ep.ref)}</strong> <span class="text-xs">${esc((getReferentiel(ep.referentielId)||{}).name||"")}</span><p class="text-sm mt-2">${esc(ep.text.length>500?ep.text.slice(0,499)+"…":ep.text)}</p></div>` : `<div class="card text-xs">Exigence introuvable</div>`;
  openModal({ title:"Valider la correspondance", wide:true,
    bodyHtml:`<div class="grid" style="grid-template-columns:1fr 1fr;gap:16px;">${box(a)}${box(b)}</div>
      ${m.basis&&m.basis.length?`<p class="text-xs mt-2"><strong>Motifs de la suggestion :</strong> ${esc(m.basis.join(" · "))}</p>`:""}
      <div class="grid mt-2" style="grid-template-columns:1fr 2fr;gap:16px;"><div class="field"><label>Type de correspondance <span class="req">*</span></label><select id="mapv-rel">${m.status==="suggested"&&m.origin!=="manuel"?`<option value="">— Choisir —</option>`:""}${Object.keys(MAPPING_RELATIONS).map(k=>`<option value="${k}" ${k===m.relation&&m.origin==="manuel"?"selected":""}>${esc(MAPPING_RELATIONS[k].label)}${k===m.relation&&m.origin!=="manuel"?" (proposé)":""}</option>`).join("")}</select></div>
      <div class="field"><label>Commentaire (facultatif)</label><textarea id="mapv-comment" rows="2">${esc(m.comment||"")}</textarea></div></div><p class="text-xs" id="mapv-err" style="color:var(--danger,#c0392b);"></p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="mapv-ok">Valider</button>`,
    onMount:(o)=>{ o.querySelector("#mapv-ok").addEventListener("click", ()=>{
      const rel = o.querySelector("#mapv-rel").value;
      if(!MAPPING_RELATIONS[rel]){ o.querySelector("#mapv-err").textContent = "Choisissez le type de correspondance : la relation proposée doit être confirmée par vous."; return; }
      updateMapping(id, { relation:rel, comment:o.querySelector("#mapv-comment").value });
      setMappingStatus(id, "validated");
      try{ saveDB(); }catch(e){ toast("Enregistrement impossible (stockage plein ?)","⚠️"); return; }
      closeModal(); toast("Correspondance validée","✅"); render(); }); } });
}

/* ---------- Suggestions par règles : aperçu, puis enregistrement « à valider » ---------- */
/* Compare les exigences de refId à celles d'un ou de plusieurs autres référentiels. Retourne { list, skipped, warnings }. */
function computeSuggestionsFor(refId, targetIds, level){
  const mine = listExigencesOfReferentiel(refId);
  const l1 = msGuessLang(mine.map(e=>e.text));
  let list = [], skipped = 0; const warnings = [];
  targetIds.forEach(tid=>{
    const theirs = listExigencesOfReferentiel(tid);
    const l2 = msGuessLang(theirs.map(e=>e.text));
    if(l1!=="?" && l2!=="?" && l1!==l2) warnings.push({ target:(getReferentiel(tid)||{}).name||tid, l1, l2 });
    const raw = suggestMappings(mine, theirs, level);
    raw.forEach(c=>{ if(findMapping(c.aId,c.bId)) skipped++; else list.push(Object.assign(c,{ targetId:tid })); });
  });
  list.sort((p,q)=>q.score-p.score);
  return { list, skipped, warnings };
}
function openMappingSuggestForm(refId){
  const ref = getReferentiel(refId); if(!ref) return;
  const others = mappableReferentiels().filter(r=>r.id!==refId);
  if(!others.length){ toast("Aucun autre référentiel avec des exigences : importez-en un d'abord.","⚠️"); return; }
  const S = { targets:others.map(r=>r.id), level:"standard", list:[], skipped:0, off:new Set() };
  const txt = id => { const ep = mappingEndpoint(id); return ep ? ep.ref+" — "+(ep.title||ep.text).slice(0,70) : id; };
  openModal({ title:"Suggérer des correspondances", wide:true,
    bodyHtml:`<p class="text-xs mb-2">Qonnect compare les exigences de « ${esc(ref.name)} » à celles d'un ou de plusieurs autres référentiels (mots-clés, texte, codes, chapitres). Les propositions sont enregistrées <strong>« à valider »</strong> : rien n'est validé ni compté dans les niveaux de maîtrise tant que vous ne l'avez pas décidé. Les paires déjà traitées (validées, rejetées, à valider) ne sont pas reproposées.</p>
      <div class="flex gap-2" style="flex-wrap:wrap;align-items:flex-end;">
        <div id="mapsg-pick">${multiPickHtml("mapsg-targets","Comparer avec",others.map(r=>({id:r.id,name:r.name})),S.targets,true)}</div>
        <div class="field" style="margin:0;"><label>Niveau de prudence</label><select id="mapsg-lvl">${Object.keys(MAPPING_SUGGEST_LEVELS).map(k=>`<option value="${k}" ${k==="standard"?"selected":""}>${esc(MAPPING_SUGGEST_LEVELS[k].label)}</option>`).join("")}</select></div>
        <button class="btn btn-secondary" id="mapsg-run">Analyser</button></div>
      <div id="mapsg-out" class="mt-2"></div>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Fermer</button><button class="btn btn-primary" id="mapsg-save" disabled>Enregistrer les suggestions</button>`,
    onMount:(o)=>{
      const out = o.querySelector("#mapsg-out"), save = o.querySelector("#mapsg-save"), pick = o.querySelector("[data-multi-pick]");
      const draw = ()=>{
        const n = S.list.length - S.off.size;
        save.disabled = n<=0 || !!S.busy; save.title = S.busy ? "Disponible une fois l'analyse par l'IA locale terminée." : "";
        const runB = o.querySelector("#mapsg-run"), lvl = o.querySelector("#mapsg-lvl"); if(runB) runB.disabled = !!S.busy; if(lvl) lvl.disabled = !!S.busy; if(pick) pick.style.pointerEvents = S.busy ? "none" : "";
        save.textContent = n>0 ? "Enregistrer "+n+" suggestion(s) « à valider »" : "Enregistrer les suggestions";
        out.querySelectorAll("[data-mapsg-i]").forEach(cb=>{ cb.checked = !S.off.has(Number(cb.getAttribute("data-mapsg-i"))); cb.disabled = !!S.busy; });
      };
      const multi = ()=>S.targets.length>1;
      const AIREL = { equivalente:"équivalente", partielle:"partielle", complementaire:"complémentaire", aucune:"aucune" };
      const renderList = (warnings)=>{
        const warn = S.warnHtml || "";
        const aiBar = `<div class="flex gap-2 mb-2" style="align-items:center;flex-wrap:wrap;"><button class="btn btn-secondary btn-sm" id="mapsg-ai">🤖 Affiner avec l'IA locale</button><span class="text-xs" id="mapsg-ai-status">Facultatif : un petit modèle exécuté sur ce poste donne son avis sur chaque paire cochée. Il ne valide rien et peut se tromper.</span><button class="btn btn-secondary btn-sm" id="mapsg-ai-stop" style="display:none;">Arrêter</button></div>`;
        out.innerHTML = warn+`<p class="text-sm mb-2"><strong>${S.list.length}</strong> suggestion(s)${S.skipped?" · "+S.skipped+" déjà traitée(s), ignorée(s)":""}. Décochez celles qui ne vous semblent pas pertinentes.</p>${aiBar}
          <div style="max-height:340px;overflow:auto;">${S.list.slice(0,150).map((c,i)=>{ const v = S.ai[i];
            const aiLine = !v ? "" : v.error ? `<div class="text-xs mt-2">🤖 Avis indisponible (${esc(v.error)}) : proposition par règles conservée.</div>`
              : v.relation==="aucune" ? `<div class="text-xs mt-2">🤖 <strong>Écartée par l'IA locale</strong> (décochée, vous pouvez la recocher) — ${esc(v.reason)}</div>`
              : `<div class="text-xs mt-2">🤖 IA locale : <strong>${esc(AIREL[v.relation])}</strong>${v.relation!==c.relation?" (les règles proposaient « "+esc(AIREL[c.relation]||c.relation)+" »)":""} — ${esc(v.reason)}</div>`;
            return `<label class="card mb-2" style="display:block;cursor:pointer;"><div class="flex" style="gap:10px;align-items:flex-start;"><input type="checkbox" data-mapsg-i="${i}" ${S.off.has(i)?"":"checked"}>
            <div style="flex:1;"><div class="text-sm"><strong>${esc(txt(c.aId))}</strong><br>↔ <strong>${esc(txt(c.bId))}</strong>${multi()?` <span class="text-xs">(${esc((getReferentiel(c.targetId)||{}).name||"")})</span>`:""}</div><div class="text-xs mt-2">Indice ${Math.round(c.score*100)} % · ${esc(c.basis.join(" · "))}</div>${aiLine}</div></div></label>`; }).join("")}${S.list.length>150?`<p class="text-xs">… ${S.list.length-150} autre(s) non affichée(s) : toutes seront enregistrées si vous ne les décochez pas ; relevez le niveau de prudence pour en voir moins.</p>`:""}</div>`;
        out.querySelectorAll("[data-mapsg-i]").forEach(cb=>cb.addEventListener("change", ()=>{ const i = Number(cb.getAttribute("data-mapsg-i")); if(cb.checked) S.off.delete(i); else S.off.add(i); draw(); }));
        const aiBtn = out.querySelector("#mapsg-ai"), stopBtn = out.querySelector("#mapsg-ai-stop"), st = out.querySelector("#mapsg-ai-status");
        aiBtn.addEventListener("click", async ()=>{
          const idx = []; S.list.forEach((c,i)=>{ if(i<150 && !S.off.has(i)) idx.push(i); });
          if(!idx.length){ st.textContent = "Aucune paire cochée à analyser."; return; }
          S.ctl = { cancelled:false }; S.busy = true; aiBtn.disabled = true; stopBtn.style.display = ""; draw(); stopBtn.onclick = ()=>{ S.ctl.cancelled = true; stopBtn.disabled = true; };
          try{
            const res = await maAiQualify(idx.map(i=>S.list[i]), { ctl:S.ctl,
              onProgress:s=>{ st.textContent = s.status==="loading" ? (s.text||"Chargement du modèle…")+(typeof s.progress==="number"?" "+Math.round(s.progress*100)+" %":"") : (s.text||""); },
              onStep:(k,n)=>{ if(!document.body.contains(out)) S.ctl.cancelled = true; st.textContent = "Analyse par l'IA locale… "+k+" / "+n; } });
            S.busy = false;
            let done = 0, dropped = 0;
            res.forEach((v,k)=>{ if(!v) return; S.ai[idx[k]] = v; done++; if(!v.error && v.relation==="aucune"){ S.off.add(idx[k]); dropped++; } });
            const keep = S.ctl.cancelled;
            renderList(); const st2 = out.querySelector("#mapsg-ai-status");
            if(st2) st2.textContent = (keep?"Interrompu : ":"")+done+" paire(s) analysée(s) par l'IA locale, "+dropped+" écartée(s). Relisez : l'avis d'un petit modèle n'est pas une preuve.";
          }catch(e){ S.busy = false; draw(); st.textContent = "IA locale indisponible : "+((e&&e.message)||e)+" Les propositions par règles restent utilisables."; aiBtn.disabled = false; stopBtn.style.display = "none"; }
        });
        draw();
      };
      o.querySelector("#mapsg-run").addEventListener("click", ()=>{
        pick.removeAttribute("open");
        S.targets = multiPickValues(pick); S.level = o.querySelector("#mapsg-lvl").value; S.off = new Set();
        if(!S.targets.length){ out.innerHTML = `<p class="text-sm">Cochez au moins un référentiel à comparer.</p>`; S.list = []; draw(); return; }
        const r = computeSuggestionsFor(refId, S.targets, S.level);
        S.list = r.list; S.skipped = r.skipped; S.ai = {}; S.warnings = r.warnings;
        const warn = r.warnings.length ? `<div class="aq-callout warn">⚠️ Langue différente pour : ${r.warnings.map(w=>esc(w.target)+" ("+w.l1.toUpperCase()+" / "+w.l2.toUpperCase()+")").join(", ")}. Les mots-clés ne se recoupent pas : les suggestions seront rares ou absentes pour ces référentiels. Traduisez d'abord le référentiel importé en anglais (traduction par IA locale à l'import).</div>` : "";
        S.warnHtml = warn;
        if(!S.list.length){ out.innerHTML = warn+`<p class="text-sm">Aucune nouvelle suggestion à ce niveau${S.skipped?" ("+S.skipped+" déjà traitée(s))":""}. Essayez un niveau plus large.</p>`; draw(); return; }
        S.ai = {}; renderList(r.warnings);
      });
      save.addEventListener("click", ()=>{
        const before = DB.exigenceMappings.length; let n = 0;
        S.list.forEach((c,i)=>{ if(S.off.has(i)) return;
          const r = createMapping(c.aId, c.bId, maAiMappingOpts(c, S.ai && S.ai[i]));
          if(r.ok) n++; });
        const finish = ()=>{ closeModal(); MAP_UI.status = "suggested"; MAP_UI.other = []; toast(n+" suggestion(s) enregistrée(s) — à valider","✅"); render(); };
        try{ saveDB(); }catch(e){
          const added = DB.exigenceMappings.splice(before);   /* annule en mémoire : rien n'est conservé tant que l'enregistrement échoue */
          toast("Enregistrement impossible : stockage plein. Rien n'a été enregistré.","⚠️");
          storageFullHelp(()=>{ DB.exigenceMappings.push(...added); try{ saveDB(); finish(); }catch(e2){ DB.exigenceMappings.splice(before); toast("Toujours impossible : stockage plein. Rien n'a été enregistré.","⚠️"); storageFullHelp(null); } });
          return; }
        finish();
      });
    } });
}

/* Changement dans un sélecteur multiple : sur la page, on mémorise le filtre et on redessine (le menu reste ouvert) ; dans la fenêtre de suggestions, rien à faire (lu au clic sur « Analyser »). */
function multiPickChanged(box){
  if(!box) return;
  const key = box.getAttribute("data-multi-pick"), values = multiPickValues(box);
  if(key==="map-other"){ MAP_UI.other = values; MAP_UI.openOther = true; render(); }
  else if(key==="cross-to"){ CROSS_UI.tos = values; CROSS_UI.openTo = true; render(); }
  else { const s = box.querySelector("summary strong"); if(s) s.textContent = !values.length ? "aucun" : values.length+" sélectionné(s)"; }
}

/* ---------- Réduire les suggestions : revenir d'une analyse large à une plus prudente ---------- */
/* Suggestions retirables : « à valider », issues des règles ou de l'IA, jamais retouchées (pas d'historique au-delà de la création) et dont l'indice
   est sous le seuil choisi. Jamais touché : correspondances validées, rejetées, saisies à la main, ou modifiées. */
function trimmableSuggestions(refId, levelKey){
  const min = (MAPPING_SUGGEST_LEVELS[levelKey]||{}).min;
  if(typeof min!=="number") return [];
  return mappingsOfReferentiel(refId).filter(m=>m.status==="suggested" && (m.origin==="regles"||m.origin==="ia") && typeof m.confidence==="number" && m.confidence<min && (m.history||[]).length<=1);
}
function openMappingTrimForm(refId){
  const ref = getReferentiel(refId); if(!ref) return;
  const total = mappingsOfReferentiel(refId).filter(m=>m.status==="suggested").length;
  openModal({ title:"Réduire les suggestions",
    bodyHtml:`<p class="text-sm mb-2">« ${esc(ref.name)} » compte <strong>${total}</strong> suggestion(s) « à valider ». Retirez les moins sûres pour ne garder que celles d'un niveau de prudence plus strict.</p>
      <div class="field"><label>Garder seulement les suggestions de niveau</label><select id="mtrim-lvl"><option value="standard">Standard (indice d'au moins ${Math.round(MAPPING_SUGGEST_LEVELS.standard.min*100)} %)</option><option value="prudent">Prudent (indice d'au moins ${Math.round(MAPPING_SUGGEST_LEVELS.prudent.min*100)} %)</option></select></div>
      <p class="text-sm" id="mtrim-count"></p>
      <p class="text-xs mt-2">Seules sont retirées les suggestions « à valider » proposées par les règles ou l'IA que vous n'avez pas retouchées. Vos correspondances validées, rejetées, saisies à la main ou modifiées ne sont jamais touchées. Les paires retirées pourront être reproposées par une nouvelle analyse.</p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="mtrim-ok" disabled>Retirer</button>`,
    onMount:(o)=>{
      const sel = o.querySelector("#mtrim-lvl"), cnt = o.querySelector("#mtrim-count"), ok = o.querySelector("#mtrim-ok");
      const upd = ()=>{ const n = trimmableSuggestions(refId, sel.value).length; cnt.innerHTML = n ? `<strong>${n}</strong> suggestion(s) seront retirées, <strong>${total-n}</strong> conservée(s).` : "Aucune suggestion à retirer à ce niveau."; ok.disabled = !n; ok.textContent = n ? "Retirer "+n+" suggestion(s)" : "Retirer"; };
      sel.addEventListener("change", upd); upd();
      ok.addEventListener("click", ()=>{
        const ids = new Set(trimmableSuggestions(refId, sel.value).map(m=>m.id)); if(!ids.size) return;
        const before = DB.exigenceMappings.slice();
        DB.exigenceMappings = DB.exigenceMappings.filter(m=>!ids.has(m.id));
        try{ saveDB(); }catch(e){ DB.exigenceMappings = before; toast("Enregistrement impossible : rien n'a été retiré.","⚠️"); return; }
        closeModal(); toast(ids.size+" suggestion(s) retirée(s)","✅"); render();
      });
    } });
}
