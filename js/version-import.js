/* ============================================================
   NOUVELLE VERSION D'UN RÉFÉRENTIEL IMPORTÉ — application non destructive (étape 2B)
   - Les exigences gardent leur identifiant : liens validés, audits, traductions et historique sont conservés.
   - Une exigence disparue est « retirée » (jamais supprimée) ; une exigence réapparue est réactivée.
   - Les cas douteux ne sont JAMAIS associés automatiquement : ils sont mis de côté dans ref.pendingMatches
     (« À résoudre plus tard ») ; les exigences concernées restent actives et inchangées jusqu'à décision.
   - Chaque mise à jour prend un instantané du référentiel (2 conservés) pour pouvoir l'annuler.
   ============================================================ */

function exigenceSourceText(e){ return e.sourceText || e.description || e.title || ""; }
function vimToday(){ return new Date().toISOString().slice(0,10); }
function vimCopy(o){ return JSON.parse(JSON.stringify(o)); }

/* Construit l'enregistrement d'une exigence importée (import initial, ajout ou résolution manuelle). */
function buildImportedExigence(e, refId, meta, method){
  const links = linkExigenceToSMQ(e.title+" "+e.description);
  const srcText = exigenceSourceText(e);
  return { id:newExigenceId(), referentielId:refId,
    status:"active", introducedIn:meta.version||null, lastSeenIn:meta.version||null, contentHash:vmHash(srcText), idV2:true,
    revisions:[{ version:meta.version||null, date:vimToday(), ref:e.ref, title:e.title, description:e.description, hash:vmHash(srcText), method:method||"import", by:"Vous" }],
    ref:e.ref, title:e.title, description:e.description, sourceText:e.sourceText, type:e.type, processIds:[], docIds:[], riskIds:[], auditIds:[], indicatorIds:[], actionIds:[], suggested:links, linksV2:true,
    ...(e.attendus ? { attendus:e.attendus } : {}), ...(e.criticite ? { criticite:e.criticite } : {}), ...(e.chapter ? { chapter:e.chapter } : {}), ...(e.chapterRef ? { chapterRef:e.chapterRef } : {}), ...(e.chapterTitle ? { chapterTitle:e.chapterTitle } : {}), ...(e.objectif ? { objectif:e.objectif } : {}), ...(e.original && e.lang==="fr" ? { original:e.original, lang:"fr", sourceLang:e.sourceLang||"en" } : {}) };
}

/* Rapprochement en lecture seule (aperçu avant import). */
function planVersionImport(refId, parsed){
  const olds = DB.customExigences.filter(e=>e.referentielId===refId).map(e=>({ id:e.id, ref:e.ref, text:exigenceSourceText(e), retired:e.status==="retired" }));
  const news = parsed.map(n=>({ ref:n.ref, text:exigenceSourceText(n) }));
  return matchExigenceVersions(olds, news);
}

/* Met à jour une exigence existante avec le contenu importé. La couche utilisateur (liens validés, linkMeta, synthèse,
   attendus, criticité) est conservée ; seul le contenu source est remplacé, et marqué « à revoir » s'il a changé. */
function applyImportedContent(old, n, meta, method){
  const textChanged = vmNorm(exigenceSourceText(old)) !== vmNorm(exigenceSourceText(n));
  const refChanged = old.ref !== n.ref;
  const wasRetired = old.status==="retired";
  if(wasRetired){ old.status = "active"; delete old.retiredIn; }
  old.lastSeenIn = meta.version||old.lastSeenIn||null;
  if(!old.revisions) old.revisions = [];
  const keepTranslation = old.lang==="fr" && !textChanged && n.lang!=="fr";
  if(textChanged || refChanged || wasRetired){
    const prev = { ref:old.ref, hash:old.contentHash };
    old.ref = n.ref;
    if(!keepTranslation){
      old.title = n.title; old.description = n.description;
      if(n.original && n.lang==="fr"){ old.original = n.original; old.lang = "fr"; old.sourceLang = n.sourceLang||"en"; }
      else { delete old.original; delete old.lang; delete old.sourceLang; }
      ["chapter","chapterRef","chapterTitle","objectif"].forEach(k=>{ if(n[k]) old[k] = n[k]; else delete old[k]; });
    } else {
      /* traduction conservée : seule la numérotation de chapitre suit la nouvelle version */
      if(n.chapterRef) old.chapterRef = n.chapterRef;
    }
    old.sourceText = n.sourceText; if(n.type) old.type = n.type;
    old.contentHash = vmHash(exigenceSourceText(n));
    old.revisions.push({ version:meta.version||null, date:vimToday(), ref:n.ref, title:old.title, description:old.description, hash:old.contentHash, method:method||"nouvelle_version", previousRef:prev.ref!==n.ref?prev.ref:undefined, by:"Vous" });
    if(textChanged) old.aRevoir = { version:meta.version||null, date:vimToday(), reason: wasRetired ? "Exigence réapparue avec un texte différent" : "Texte modifié dans la nouvelle version", previousRef: refChanged?prev.ref:undefined };
  }
  delete old.pendingMatchId;
  return { textChanged, refChanged, reactivated:wasRetired };
}
function retireExigence(e, meta, reason){
  if(e.status==="retired") return;
  e.status = "retired"; e.retiredIn = meta.version||null;
  if(!e.revisions) e.revisions = [];
  e.revisions.push({ version:meta.version||null, date:vimToday(), ref:e.ref, title:e.title, description:e.description, hash:e.contentHash, method:"retrait", note:reason||"Absente de la nouvelle version", by:"Vous" });
  delete e.pendingMatchId;
}

/* Instantanés : 2 derniers par référentiel. */
function takeVersionSnapshot(ref){
  if(!DB.referentielSnapshots) DB.referentielSnapshots = [];
  DB.referentielSnapshots.push({ id:"SNP-"+Date.now(), refId:ref.id, takenAt:new Date().toISOString(),
    ref:vimCopy(ref), exigences:vimCopy(DB.customExigences.filter(e=>e.referentielId===ref.id)) });
  const mine = DB.referentielSnapshots.filter(s=>s.refId===ref.id);
  while(mine.length>2){ const old = mine.shift(); DB.referentielSnapshots = DB.referentielSnapshots.filter(s=>s!==old); }
}
function lastVersionSnapshot(refId){
  const mine = (DB.referentielSnapshots||[]).filter(s=>s.refId===refId);
  return mine.length ? mine[mine.length-1] : null;
}
function restoreVersionSnapshot(refId){
  const snap = lastVersionSnapshot(refId);
  if(!snap) return false;
  DB.customExigences = DB.customExigences.filter(e=>e.referentielId!==refId).concat(vimCopy(snap.exigences));
  const ref = getReferentiel(refId);
  Object.keys(ref).forEach(k=>{ delete ref[k]; });
  Object.assign(ref, vimCopy(snap.ref));
  DB.referentielSnapshots = DB.referentielSnapshots.filter(s=>s!==snap);
  return true;
}
function undoLastVersionImport(refId){
  const snap = lastVersionSnapshot(refId);
  if(!snap){ toast("Aucune mise à jour à annuler","⚠️"); return; }
  const cur = getReferentiel(refId);
  const created = DB.customExigences.filter(e=>e.referentielId===refId && !snap.exigences.some(x=>x.id===e.id)).map(e=>e.id);
  const used = DB.audits.filter(a=>((a.criteres&&a.criteres.requirementIds)||[]).some(i=>created.includes(i)) || (a.questions||[]).some(q=>created.includes(q.requirementId)) || (a.findings||[]).some(f=>created.includes(f.requirementId))).length;
  confirmDialog(`Annuler la dernière mise à jour de « ${cur.name} » ? Le référentiel et ses exigences reviennent à l'état du ${fmtDate(snap.takenAt.slice(0,10))}.`
    + (used ? ` Attention : ${used} audit(s) créé(s) depuis référencent des exigences ajoutées par cette mise à jour.` : ""), ()=>{
    restoreVersionSnapshot(refId); saveDB(); toast("Mise à jour annulée","✅"); render();
  });
}

/* Applique une nouvelle version. Retourne le résumé (compteurs). Lève une erreur si l'enregistrement échoue (état restauré). */
function applyVersionImport(ref, parsed, meta){
  takeVersionSnapshot(ref);   /* d'abord : toute erreur suivante permet de restaurer l'état exact d'avant */
  const plan = planVersionImport(ref.id, parsed);
  const existing = new Map(DB.customExigences.filter(e=>e.referentielId===ref.id).map(e=>[e.id,e]));
  const sum = { identical:0, modified:0, renumbered:0, reactivated:0, retired:0, added:0, pending:0 };
  /* Les cas encore en attente d'une version précédente sont remplacés par le nouveau rapprochement (historique conservé). */
  const pendingList = (ref.pendingMatches||[]);
  pendingList.forEach(p=>{ if(p.status==="pending"){ p.status = "superseded"; p.outcome = "Remplacé par la mise à jour "+(meta.version||""); } });
  existing.forEach(e=>{ delete e.pendingMatchId; });
  const pid = ()=> "PND-"+Math.random().toString(16).slice(2,8);
  plan.pairs.forEach(p=>{
    const old = existing.get(p.oldId), n = parsed[p.newIndex];
    if(p.confidence==="to_confirm"){
      const id = pid(); old.pendingMatchId = id;
      pendingList.push({ id, kind:"a_confirmer", status:"pending", createdIn:meta.version||null, date:vimToday(), oldIds:[old.id], items:[vimCopy(n)], score:p.score, method:p.method,
        reason: p.method==="texte_similaire_code_change" ? "Le code a changé et le texte aussi : même exigence ?" : "Même code, texte assez différent : même exigence modifiée ?" });
      sum.pending++; return;
    }
    const r = applyImportedContent(old, n, meta);
    if(r.reactivated) sum.reactivated++; else if(r.textChanged) sum.modified++; else if(r.refChanged) sum.renumbered++; else sum.identical++;
  });
  plan.pending.forEach(p=>{
    const id = pid(); p.oldIds.forEach(i=>{ if(existing.get(i)) existing.get(i).pendingMatchId = id; });
    pendingList.push({ id, kind:p.kind, status:"pending", createdIn:meta.version||null, date:vimToday(), oldIds:p.oldIds.slice(), items:p.newIndexes.map(i=>vimCopy(parsed[i])), score:p.score, reason:p.reason });
    sum.pending++;
  });
  plan.retired.forEach(i=>{ retireExigence(existing.get(i), meta); sum.retired++; });
  plan.added.forEach(i=>{ DB.customExigences.push(buildImportedExigence(parsed[i], ref.id, meta)); sum.added++; });
  ref.pendingMatches = pendingList;
  return { sum, plan };
}

function pendingMatchesOf(refId){ const r = getReferentiel(refId); return ((r&&r.pendingMatches)||[]).filter(p=>p.status==="pending"); }
function exigencesToReviewOf(refId){ return DB.customExigences.filter(e=>e.referentielId===refId && e.status!=="retired" && e.aRevoir); }

/* Décision manuelle sur un cas en attente. */
function resolvePendingMatch(refId, pendingId, action, param){
  const ref = getReferentiel(refId); if(!ref) return;
  const p = (ref.pendingMatches||[]).find(x=>x.id===pendingId && x.status==="pending"); if(!p) return;
  const meta = { version:p.createdIn };
  const olds = p.oldIds.map(i=>DB.customExigences.find(e=>e.id===i)).filter(Boolean);
  const addNew = n => DB.customExigences.push(buildImportedExigence(n, refId, meta, "resolution_manuelle"));
  let outcome = "";
  if(action==="same" && p.kind!=="scission" && p.kind!=="fusion"){
    applyImportedContent(olds[0], p.items[0], meta, "resolution_manuelle"); outcome = "Rapprochées : même exigence";
  } else if(action==="link" && p.kind==="scission"){
    const k = Number(param); p.items.forEach((n,i)=>{ if(i===k) applyImportedContent(olds[0], n, meta, "resolution_manuelle"); else addNew(n); });
    outcome = "Ancienne exigence rattachée au fragment "+(k+1)+" ; les autres sont de nouvelles exigences";
  } else if(action==="link" && p.kind==="fusion"){
    olds.forEach(o=>{ if(o.id===param) applyImportedContent(o, p.items[0], meta, "resolution_manuelle"); else retireExigence(o, meta, "Fusionnée dans une autre exigence"); });
    outcome = "Exigence conservée : "+(olds.find(o=>o.id===param)||{}).ref+" ; les autres sont retirées";
  } else if(action==="separate"){
    olds.forEach(o=>retireExigence(o, meta, "Remplacée dans la nouvelle version")); p.items.forEach(addNew);
    outcome = "Traitées comme des exigences distinctes : anciennes retirées, nouvelles ajoutées";
  } else return;
  olds.forEach(o=>{ delete o.pendingMatchId; });
  p.status = "resolved"; p.resolvedAt = new Date().toISOString(); p.outcome = outcome;
  saveDB(); toast("Décision enregistrée","✅"); render();
}
function markExigenceReviewed(exigenceId){
  const e = DB.customExigences.find(x=>x.id===exigenceId); if(!e) return;
  delete e.aRevoir; saveDB(); render();
}

function pendingCardHtml(refId, p){
  const olds = p.oldIds.map(i=>DB.customExigences.find(e=>e.id===i)).filter(Boolean);
  const label = {a_confirmer:"À confirmer", ambigu:"Ambigu", scission:"Scission possible", fusion:"Fusion possible"}[p.kind]||p.kind;
  const ex = t => esc((t||"").slice(0,220));
  const side = (title, list)=>`<div style="flex:1;min-width:240px;"><div class="text-xs"><strong>${title}</strong></div>${list.join("")}</div>`;
  const oldBlocks = olds.map(o=>`<div class="text-sm mt-2"><code>${esc(o.ref)}</code> ${ex(o.description||o.title)}</div>`);
  const newBlocks = p.items.map((n,i)=>`<div class="text-sm mt-2">${p.items.length>1?`<strong>${i+1}.</strong> `:""}<code>${esc(n.ref)}</code> ${ex(n.description||n.title)}</div>`);
  const btn = (action, text, param, cls)=>`<button class="btn ${cls||"btn-secondary"} btn-sm" data-pending-resolve='${esc(JSON.stringify({refId, id:p.id, action, param}))}'>${text}</button>`;
  let actions = "";
  if(p.kind==="a_confirmer" || p.kind==="ambigu") actions = btn("same","C'est la même exigence (modifiée)",null,"btn-primary") + btn("separate","Ce sont deux exigences différentes");
  else if(p.kind==="scission") actions = p.items.map((n,i)=>btn("link","Rattacher l'ancienne au fragment "+(i+1),i)).join("") + btn("separate","Aucune : tout est nouveau");
  else if(p.kind==="fusion") actions = olds.map(o=>btn("link","Conserver "+esc(o.ref)+" (retirer les autres)",o.id)).join("") + btn("separate","Aucune : la nouvelle est distincte");
  return `<div class="card mb-2"><div class="flex justify-between items-center"><strong>${label}</strong>${typeof p.score==="number"?`<span class="text-xs">Similarité indicative : ${Math.round(p.score*100)} %</span>`:""}</div>
    <p class="text-xs mt-2">${esc(p.reason||"")} <em>La similarité n'est qu'un indice : elle ne prouve pas l'équivalence.</em></p>
    <div class="flex gap-3 mt-2" style="flex-wrap:wrap;">${side("Version précédente (reste active, inchangée)", oldBlocks)}${side("Nouvelle version (en attente)", newBlocks)}</div>
    <div class="flex gap-2 mt-2" style="flex-wrap:wrap;">${actions}</div></div>`;
}
function refTabResolve(ref){
  const pend = pendingMatchesOf(ref.id), review = exigencesToReviewOf(ref.id);
  const done = (ref.pendingMatches||[]).filter(p=>p.status==="resolved");
  return `
  <div class="aq-callout ${pend.length?"warn":""}" style="margin-bottom:12px;">${pend.length
    ? `⚠️ <strong>${pend.length} cas à résoudre</strong> : la version ${esc(ref.version||"")} n'est pas entièrement rapprochée. Les exigences concernées restent actives et inchangées ; rien n'a été associé ni supprimé automatiquement.`
    : `✅ Aucun cas en attente.`}</div>
  ${pend.map(p=>pendingCardHtml(ref.id,p)).join("")}
  <h3 class="mt-4 mb-2">Exigences modifiées à revoir (${review.length})</h3>
  ${review.length ? review.map(e=>`<div class="card mb-2"><div class="flex justify-between items-center" style="gap:8px;flex-wrap:wrap;"><div><code>${esc(e.ref)}</code> ${esc(e.title||"")}<div class="text-xs mt-2">${esc(e.aRevoir.reason)}${e.aRevoir.previousRef?" · ancien code "+esc(e.aRevoir.previousRef):""} · liens validés et audits conservés : à vérifier.</div></div><button class="btn btn-secondary btn-sm" data-exigence-reviewed="${esc(e.id)}">Marquer comme revue</button></div></div>`).join("") : `<p class="text-sm">Aucune.</p>`}
  ${done.length?`<h3 class="mt-4 mb-2">Décisions prises (${done.length})</h3>${done.map(p=>`<p class="text-xs">${fmtDate(p.resolvedAt.slice(0,10))} · ${esc(p.kind)} · ${esc(p.outcome||"")}</p>`).join("")}`:""}`;
}
