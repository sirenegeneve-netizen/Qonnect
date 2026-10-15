/* ============================================================
   INTÉGRATION AU SYSTÈME DE MANAGEMENT VIA LES CORRESPONDANCES (étape 6) — lecture + reprise explicite en « suggestion ».
   Idée : si l'exigence X (référentiel A) correspond à l'exigence Y (référentiel B) et que Y a des éléments du SMQ validés comme preuve
   (documents, processus, risques), ces éléments sont PEUT-ÊTRE aussi pertinents pour X. Qonnect le MONTRE ; la décision reste humaine.
   Règles :
   - Seules les correspondances VALIDÉES et À JOUR comptent ; une seule étape (aucune transitivité : A↔B↔C n'implique pas A↔C).
   - Rien n'est ajouté aux preuves, aux scores ni aux audits. Le bouton « Proposer comme lien à valider » ajoute seulement une
     suggestion au mécanisme existant (qui ne compte pas tant qu'elle n'est pas validée), avec sa provenance.
   - Les exigences ISO 9001 historiques n'ont pas de suggestions de liens : on peut les consulter comme SOURCE, pas les alimenter ici.
   ============================================================ */

/* Éléments du SMQ VALIDÉS pour une exigence (documents non obsolètes, processus, risques). */
function validatedElementsOfExigence(id){
  const legacy = findBy(DB.requirements, id);
  if(legacy){
    return { docIds: DB.documents.filter(d=>(d.requirementIds||[]).includes(id) && d.status!=="obsolete").map(d=>d.id),
      processIds: legacy.processId ? [legacy.processId] : [], riskIds: [] };
  }
  const e = getCustomExigence(id);
  if(!e) return { docIds:[], processIds:[], riskIds:[] };
  return { docIds:(e.docIds||[]).filter(i=>{ const d = getDocument(i); return d && d.status!=="obsolete"; }),
    processIds:(e.processIds||[]).filter(i=>getProcess(i)), riskIds:(e.riskIds||[]).filter(i=>getRisk(i)) };
}
/* Correspondances utilisables : validées, à jour, une seule étape. */
function usableMappingsOf(exigenceId){
  return mappingsOfExigence(exigenceId).filter(m=>m.status==="validated" && mappingState(m)==="ok")
    .map(m=>({ m, otherId: m.exigenceAId===exigenceId ? m.exigenceBId : m.exigenceAId }));
}
/* Pour une exigence : éléments du SMQ validés sur ses exigences correspondantes et pas encore reliés à elle.
   Retour : [{ kind, id, name, via:[{ otherId, mappingId, relation }], state:"nouveau"|"suggere" }] */
function smqViaMappings(exigenceId){
  const own = validatedElementsOfExigence(exigenceId);
  const e = getCustomExigence(exigenceId);
  const sg = (e && e.suggested) || {};
  const acc = new Map();
  usableMappingsOf(exigenceId).forEach(({m, otherId})=>{
    const el = validatedElementsOfExigence(otherId);
    Object.keys(LINK_KINDS).forEach(kind=> (el[kind]||[]).forEach(id=>{
      if((own[kind]||[]).includes(id)) return;                       /* déjà validé pour cette exigence */
      const key = kind+":"+id;
      if(!acc.has(key)) acc.set(key, { kind, id, name:LINK_KINDS[kind].name(id), via:[], state: (sg[kind]||[]).includes(id) ? "suggere" : "nouveau" });
      acc.get(key).via.push({ otherId, mappingId:m.id, relation:m.relation });
    }));
  });
  return [...acc.values()].filter(x=>x.name);
}
/* Pour un document : exigences correspondantes à celles qu'il démontre déjà, où il n'est pas encore relié. */
function smqViaMappingsForDocument(docId){
  const direct = [...(DB.requirements||[]).filter(r=>(getDocument(docId)||{}).requirementIds && getDocument(docId).requirementIds.includes(r.id)).map(r=>r.id),
    ...DB.customExigences.filter(e=>(e.docIds||[]).includes(docId) && e.status!=="retired").map(e=>e.id)];
  const acc = new Map();
  direct.forEach(xId=> usableMappingsOf(xId).forEach(({m, otherId})=>{
    const z = mappingEndpoint(otherId); if(!z || z.retired) return;
    if(validatedElementsOfExigence(otherId).docIds.includes(docId)) return;     /* déjà validé */
    if(!acc.has(otherId)){ const e = getCustomExigence(otherId); acc.set(otherId, { exigenceId:otherId, ep:z, legacy:z.legacy, via:[], state: e && ((e.suggested||{}).docIds||[]).includes(docId) ? "suggere" : "nouveau" }); }
    acc.get(otherId).via.push({ ownId:xId, mappingId:m.id, relation:m.relation });
  }));
  return [...acc.values()];
}

/* Reprise EXPLICITE en suggestion (jamais automatique). Les relations « complémentaire » ne sont pas reprises : un lien moins direct ne se propage pas. */
function proposeSmqLink(exigenceId, kind, id, via){
  const e = getCustomExigence(exigenceId);
  if(!e || !LINK_KINDS[kind]) return { ok:false, error:"Cette exigence ne peut pas recevoir de suggestion de lien." };
  if(!(via||[]).some(v=>v.relation==="equivalente"||v.relation==="partielle")) return { ok:false, error:"Seules les correspondances équivalentes ou partielles peuvent être reprises." };
  if((e[kind]||[]).includes(id)) return { ok:false, error:"Cet élément est déjà validé pour cette exigence." };
  e.suggested = e.suggested || {}; e.suggested[kind] = e.suggested[kind] || [];
  if(!e.suggested[kind].includes(id)) e.suggested[kind].push(id);
  e.suggestedVia = e.suggestedVia || {};
  e.suggestedVia[kind+":"+id] = { date:new Date().toISOString().slice(0,10), by:"Vous", origin:"correspondance", via:(via||[]).map(v=>({ exigenceId:v.otherId||v.ownId, mappingId:v.mappingId, relation:v.relation })) };
  return { ok:true };
}
function provenanceLabel(entry){
  if(!entry || entry.origin!=="correspondance") return "";
  const names = (entry.via||[]).map(v=>{ const ep = mappingEndpoint(v.exigenceId); const rf = ep && getReferentiel(ep.referentielId); return ep ? ep.ref+(rf?" ("+rf.name+")":"") : "exigence introuvable"; });
  return "Proposé d'après la correspondance avec "+names.join(", ");
}

/* ---------- Interface ---------- */
function viaBadges(via){ return via.map(v=>{ const ep = mappingEndpoint(v.otherId||v.ownId); const rf = ep && getReferentiel(ep.referentielId);
  return `<span class="text-xs">${esc(ep?ep.ref:"?")}${rf?" ("+esc(rf.name)+")":""} · ${esc(MAPPING_RELATIONS[v.relation].label.toLowerCase())}</span>`; }).join(" · "); }
const CAN_PROPOSE = via => via.some(v=>v.relation==="equivalente"||v.relation==="partielle");

function exigenceSmqViaMappingsHtml(exigenceId){
  const items = smqViaMappings(exigenceId);
  if(!items.length) return "";
  const isLegacy = !!findBy(DB.requirements, exigenceId);
  const rows = items.map(it=>{
    const btn = (!isLegacy && it.state==="nouveau" && CAN_PROPOSE(it.via)) ? `<button class="btn btn-secondary btn-sm" data-smq-propose='${jsonAttr({exigenceId, kind:it.kind, id:it.id, via:it.via})}'>Proposer comme lien à valider</button>`
      : it.state==="suggere" ? `<span class="text-xs">Déjà proposé — à valider ci-dessus</span>` : "";
    return `<div class="rel-link"><span class="rel-name"><span class="text-xs" style="display:block;font-weight:400;">${LINK_KINDS[it.kind].label} · lié à ${viaBadges(it.via)}</span>${esc(it.name)}</span>${btn}</div>`; }).join("");
  return `<div class="card mb-2"><h3 class="mb-2">Éléments du SMQ reliés aux exigences correspondantes</h3>
    <p class="text-xs mb-2">Ces éléments sont validés comme preuve pour une exigence <strong>correspondante</strong> d'un autre référentiel. <strong>Ils ne comptent pas</strong> dans le niveau de maîtrise de cette exigence : un élément qui démontre l'une ne démontre pas forcément l'autre.${isLegacy?" ISO 9001 historique : consultation uniquement.":" Vous pouvez en proposer comme lien : il rejoindra les « rapprochements suggérés » et ne comptera qu'une fois validé par vous."}</p>${rows}</div>`;
}
function documentSmqViaMappingsHtml(docId){
  const items = smqViaMappingsForDocument(docId);
  if(!items.length) return "";
  const rows = items.map(it=>{
    const btn = (!it.legacy && it.state==="nouveau" && CAN_PROPOSE(it.via)) ? `<button class="btn btn-secondary btn-sm" data-smq-propose='${jsonAttr({exigenceId:it.exigenceId, kind:"docIds", id:docId, via:it.via})}'>Proposer comme lien à valider</button>`
      : it.state==="suggere" ? `<span class="text-xs">Déjà proposé</span>` : "";
    const rf = getReferentiel(it.ep.referentielId);
    return `<div class="rel-link"><span class="rel-name"><span class="text-xs" style="display:block;font-weight:400;">${esc(rf?rf.name:"")} · via ${viaBadges(it.via)}</span>${esc(it.ep.ref)} — ${esc((it.ep.title||it.ep.text).slice(0,90))}</span>${btn}</div>`; }).join("");
  return `<div class="card mb-2"><h3 class="mb-2">Exigences correspondantes (indicatif)</h3>
    <p class="text-xs mb-2">Ce document est validé comme preuve d'exigences qui ont une correspondance validée dans un autre référentiel. Ces exigences correspondantes <strong>ne sont pas comptées</strong> comme couvertes par ce document : à vous d'apprécier s'il les démontre aussi.</p>${rows}</div>`;
}
function smqPropose(p){
  const r = proposeSmqLink(p.exigenceId, p.kind, p.id, p.via);
  if(!r.ok){ toast(r.error,"⚠️"); return; }
  try{ saveDB(); }catch(e){ toast("Enregistrement impossible (stockage plein ?)","⚠️"); return; }
  toast("Proposé comme lien à valider — rien n'est compté tant que vous ne l'avez pas validé","✅"); render();
}
