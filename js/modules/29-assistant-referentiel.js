/* ============================================================
   ASSISTANT DU RÉFÉRENTIEL (local, sans envoi de données)
   Il ne « devine » pas : chaque réponse est construite à partir du texte importé
   et des preuves réellement enregistrées dans Qonnect (documents, audits, actions, risques).
   ============================================================ */
const REF_AI_CONTEXT = {};   // dernier chapitre évoqué, par référentiel (pour « et le suivant ? »)
const REF_AI_LEVEL_ORDER = { non_couvert:0, partiellement:1, a_renforcer:2, maitrise:3, optimise:4 };
const REF_AI_STOP = new Set(("dans pour avec sans cette cette ceux celle comme plus moins tout tous toute toutes quel quelle quels quelles quoi donc alors "+
  "etre avoir fait faire dois doit peux peut veux veut explique expliquer expliques parle parler resume resumer liste lister montre montrer donne donner "+
  "comment faire moi toi aide aider accompagne accompagner guide guider etape etapes demarche mise place mettre oeuvre concretement "+
  "referentiel norme exigence exigences chapitre chapitres couverte couvertes couvert couverts conforme conformes preuve preuves recommandation recommandations "+
  "responsabilite responsabilites audit audits prepare preparer quelles quelles sont est les des une aux sur par que qui").split(/\s+/));

function refAiNorm(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’']/g,"'"); }
function refAiKeywords(q){
  return refAiNorm(q).split(/[^a-z0-9]+/).filter(w=>w.length>3 && !REF_AI_STOP.has(w)).map(w=>w.replace(/(?:s|x)$/,""));
}
function refAiCmpRef(a,b){
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for(let i=0;i<Math.max(pa.length,pb.length);i++){ const d=(pa[i]||0)-(pb[i]||0); if(d) return d; }
  return 0;
}
function refAiLevel(v){ return (LABELS.exigenceCoverage[v.level]||{}).l || v.level; }
function refAiTypeLabel(v){ return LABELS.exigenceType[v.type] || v.type; }
function refAiTop(ref){ return String(ref).split(".")[0]; }
function refAiViewsOf(views, chapter){ return views.filter(v=> v.ref===chapter || String(v.ref).startsWith(chapter+".")); }
function refAiChapterOf(views, q){
  /* Un nombre n'est un chapitre que s'il existe réellement dans le référentiel. */
  const tokens = String(q).match(/\b\d+(?:\.\d+){0,3}\b/g) || [];
  return tokens.find(t=> views.some(v=> v.ref===t || String(v.ref).startsWith(t+"."))) || null;
}
function refAiText(v, max){
  const t = (v.description||"").replace(/\s+/g," ").trim();
  if(!t) return "";
  return t.length>max ? t.slice(0,max-1).trimEnd()+"…" : t;
}
function refAiList(items){ return `<ul>${items.join("")}</ul>`; }
function refAiMore(total, shown){ return total>shown ? `<p class="text-xs mt-2">… et ${total-shown} autre(s). Précisez un chapitre pour voir le détail.</p>` : ""; }
function refAiFooter(){ return `<p class="text-xs mt-4">Réponse construite à partir du texte importé et de vos données Qonnect. Elle ne remplace pas la lecture de la norme.</p>`; }
function refAiBase(v){
  const t = refAiText(v, 220);
  return `<strong>${esc(exigenceLabel(v))}</strong> — ${esc(v.title)}${t?`<br><span class="text-sm">${esc(t)}</span>`:""}`;
}
function refAiByLevel(list){
  const c = {}; list.forEach(v=>{ c[v.level]=(c[v.level]||0)+1; });
  return Object.keys(REF_AI_LEVEL_ORDER).filter(k=>c[k]).map(k=>`${c[k]} ${LABELS.exigenceCoverage[k].l.toLowerCase()}`).join(", ");
}
function refAiPlural(label, n){
  label = label.toLowerCase();
  if(n<2) return label;
  return label.split(" ").map((w,i)=> (i===0 || /^(attendue|attendu)$/.test(w)) && !/s$/.test(w) ? w+"s" : w).join(" ");
}
function refAiByType(list){
  const c = {}; list.forEach(v=>{ c[v.type]=(c[v.type]||0)+1; });
  return Object.keys(c).map(k=>`${c[k]} ${refAiPlural(LABELS.exigenceType[k]||k, c[k])}`).join(", ");
}

/* ---------- Réponses ---------- */
function refAiReplyChapter(ref, views, chapter, q, n){
  const list = refAiViewsOf(views, chapter).sort((a,b)=>refAiCmpRef(a.ref,b.ref));
  const onlyGaps = /non couvert|pas couvert|manque|ecart|lacune/.test(n);
  const subs = [...new Set(list.map(v=>v.ref))];
  const head = list.find(v=>v.ref===chapter) || list[0];
  let html = `<strong>Chapitre ${esc(chapter)} — ${esc(head.title)}</strong><br>${list.length} élément(s) : ${esc(refAiByType(list))}. Couverture : ${esc(refAiByLevel(list))}.`;

  if(/combien/.test(n)) return html+refAiFooter();

  if(/pourquoi|calcul|niveau|couverture|conformite/.test(n) && !/explique/.test(n)){
    const gapsOnly = list.filter(v=>REF_AI_LEVEL_ORDER[v.level]<=1);
    const sel = (onlyGaps && gapsOnly.length ? gapsOnly : list).slice(0,5);
    if(onlyGaps && !gapsOnly.length) html += `<p class="mt-2">Aucun élément « non couvert » ici : voici leur niveau réel.</p>`;
    html += refAiList(sel.map(v=>`<li>${refAiBase(v)}<br><span class="text-sm">Niveau : <strong>${esc(refAiLevel(v))}</strong> — ${coverageReasons(v.bundle).map(esc).join(" ; ")}.</span></li>`));
    return html + refAiMore(list.length, sel.length) + refAiFooter();
  }

  if(subs.length>6 && !onlyGaps){
    /* Gros chapitre : on donne la carte des sous-chapitres plutôt qu'un mur de texte. */
    html += `<p class="mt-2">Ce chapitre se découpe en sous-chapitres :</p>` + refAiList(subs.slice(0,14).map(r=>{
      const sub = list.filter(v=>v.ref===r);
      return `<li><strong>${esc(r)}</strong> — ${esc(sub[0].title)} : ${sub.length} élément(s), ${esc(refAiByLevel(sub))}</li>`;
    }));
    html += refAiMore(subs.length, 14) + `<p class="text-sm">Demandez par exemple « explique-moi le chapitre ${esc(subs[0])} » pour le détail.</p>`;
    return html + refAiFooter();
  }

  const sel = (onlyGaps ? list.filter(v=>REF_AI_LEVEL_ORDER[v.level]<=1) : list).slice(0,8);
  if(onlyGaps && !sel.length) return html+`<p class="mt-2">Aucune exigence non couverte dans ce chapitre.</p>`+refAiFooter();
  html += `<p class="mt-2">${onlyGaps?"Points non couverts ou partiels :":"Ce que dit le texte importé :"}</p>` +
    refAiList(sel.map(v=>`<li>${refAiBase(v)}<br><span class="text-xs">${esc(refAiTypeLabel(v))} · ${esc(refAiLevel(v))}</span></li>`));
  html += refAiMore(list.length, sel.length);

  /* Aide à la mise en œuvre : uniquement à partir de ce qui existe dans Qonnect. */
  if(/explique|comprend|comment|que dois|quoi faire|mettre en|concretement|repondre/.test(n)){
    const docs = [...new Map(sel.flatMap(v=>v.bundle.docs).map(d=>[d.id,d])).values()];
    const procs = [...new Map(sel.flatMap(v=>v.bundle.processes||[]).map(p=>[p.id,p])).values()];
    const actions = [...new Map(sel.flatMap(v=>v.bundle.actionsOpen).map(a=>[a.id,a])).values()];
    html += `<p class="mt-2"><strong>Dans votre SMQ aujourd'hui</strong></p>` + refAiList([
      `<li>${docs.length ? "Documents reliés (rapprochement automatique par mots-clés, à vérifier) : "+docs.slice(0,4).map(d=>esc(d.title)).join(", ") : "Aucun document relié : c'est le premier manque à combler (procédure, enregistrement ou politique à rédiger ou à associer depuis « Documentation du SMQ »)."}</li>`,
      `<li>${procs.length ? "Processus concernés : "+procs.slice(0,4).map(p=>esc(p.name)).join(", ") : "Aucun processus relié : rattachez l'exigence au processus qui en est responsable (bouton ✏️ dans l'onglet Exigences)."}</li>`,
      `<li>${actions.length ? actions.length+" action(s) en cours liée(s)." : "Aucune action en cours liée."}</li>`
    ]);
    if(sel.some(v=>v.type==="preuve")) html += `<p class="text-sm">Certains éléments demandent des <strong>preuves</strong> : prévoyez des enregistrements datés et conservés.</p>`;
  } else {
    html += `<p class="text-sm mt-2">Demandez « explique-moi le chapitre ${esc(chapter)} » pour voir comment y répondre dans votre SMQ, ou « prépare un audit sur le chapitre ${esc(chapter)} ».</p>`;
  }
  return html + refAiFooter();
}

function refAiReplyType(views, type, label){
  const list = views.filter(v=>v.type===type);
  if(!list.length) return `Aucun élément de type « ${label} » n'a été détecté dans ce référentiel.`+refAiFooter();
  const sel = list.slice(0,10);
  return `<strong>${list.length} ${refAiPlural(label, list.length)}</strong>` + refAiList(sel.map(v=>`<li>${refAiBase(v)}<br><span class="text-xs">${esc(refAiLevel(v))}</span></li>`)) + refAiMore(list.length, sel.length) + refAiFooter();
}

function refAiReplySearch(views, kws){
  /* Les mots présents dans presque toutes les exigences (« système », « management »…) ne discriminent rien : on les écarte. */
  const hayOf = v => refAiNorm(v.title+" "+(v.description||""));
  const df = k => views.filter(v=>hayOf(v).includes(k)).length;
  const rare = kws.filter(k=> df(k) <= views.length*0.4);
  if(rare.length) kws = rare;
  const scored = views.map(v=>{
    const hay = refAiNorm(v.title+" "+(v.description||""));
    const hits = kws.filter(k=>hay.includes(k)).length;
    return { v, hits };
  }).filter(x=>x.hits>0).sort((a,b)=> b.hits-a.hits || refAiCmpRef(a.v.ref,b.v.ref));
  if(!scored.length) return null;
  const sel = scored.slice(0,8).map(x=>x.v);
  return `<strong>${scored.length} résultat(s) pour « ${esc(kws.join(", "))} »</strong>` +
    refAiList(sel.map(v=>`<li>${refAiBase(v)}<br><span class="text-xs">${esc(refAiTypeLabel(v))} · ${esc(refAiLevel(v))}</span></li>`)) +
    refAiMore(scored.length, sel.length) + refAiFooter();
}

function refAiReplySummary(ref, score){
  const views = score.views;
  const byChap = {};
  views.forEach(v=>{ (byChap[refAiTop(v.ref)] = byChap[refAiTop(v.ref)] || []).push(v); });
  const chaps = Object.keys(byChap).sort(refAiCmpRef);
  const gap = c => byChap[c].filter(v=>REF_AI_LEVEL_ORDER[v.level]<=1).length / byChap[c].length;
  const worst = chaps.filter(c=>gap(c)>0).sort((a,b)=>gap(b)-gap(a) || byChap[b].length-byChap[a].length).slice(0,4);
  let html = `<strong>${esc(ref.name)}</strong> — ${views.length} élément(s) : ${esc(refAiByType(views))}, répartis sur ${chaps.length} chapitre(s).` +
    `<br>Niveau global de maîtrise : <strong>${score.pct}%</strong> (${esc(refAiByLevel(views))}).`;
  if(worst.length) html += `<p class="mt-2">Chapitres les moins couverts :</p>` + refAiList(worst.map(c=>`<li><strong>Chapitre ${esc(c)}</strong> — ${esc(byChap[c][0].title)} : ${Math.round(gap(c)*100)}% non couvert ou partiel (${byChap[c].length} élément(s))</li>`));
  html += `<p class="text-sm">Pour avancer : « par où commencer ? », « explique-moi le chapitre ${esc(worst[0]||chaps[0]||"4")} », ou « prépare un audit ».</p>`;
  return html + refAiFooter();
}

function refAiReplyPriorities(views){
  const open = views.filter(v=>REF_AI_LEVEL_ORDER[v.level]<=1);
  if(!open.length) return `Aucune exigence non couverte ou partielle : concentrez-vous sur les points « à renforcer ».`+refAiFooter();
  const sorted = open.slice().sort((a,b)=> REF_AI_LEVEL_ORDER[a.level]-REF_AI_LEVEL_ORDER[b.level] || (a.type==="exigence"?0:1)-(b.type==="exigence"?0:1) || refAiCmpRef(a.ref,b.ref));
  const sel = sorted.slice(0,6);
  return `<strong>Par où commencer</strong><p class="text-sm">Je classe d'abord ce qui n'est couvert par aucun document, en privilégiant les exigences fermes (« doit ») sur les recommandations.</p>` +
    refAiList(sel.map(v=>`<li>${refAiBase(v)}<br><span class="text-xs">${esc(refAiLevel(v))} — ${coverageReasons(v.bundle).slice(0,2).map(esc).join(" ; ")}</span></li>`)) +
    `<p class="text-sm">${open.length} élément(s) au total à traiter. Une même procédure bien rédigée en couvre souvent plusieurs : regardez les chapitres qui reviennent.</p>` + refAiFooter();
}

function refAiReplyAudit(ref, views, chapter){
  const scope = chapter ? refAiViewsOf(views, chapter) : views;
  const weak = scope.filter(v=>REF_AI_LEVEL_ORDER[v.level]<=1).sort((a,b)=>refAiCmpRef(a.ref,b.ref));
  const pick = (weak.length ? weak : scope.filter(v=>v.level==="a_renforcer")).slice(0,8);
  if(!pick.length) return `Aucun point de vigilance dans ${chapter?"le chapitre "+esc(chapter):esc(ref.name)} : les exigences sont maîtrisées.`+refAiFooter();
  return `<strong>Questions d'audit — ${chapter?"chapitre "+esc(chapter):esc(ref.name)}</strong><p class="text-sm">Construites à partir des exigences non couvertes ou à renforcer.</p>` +
    refAiList(pick.map(v=>{
      const docs = v.bundle.docs.map(d=>d.title).slice(0,2);
      return `<li>${refAiBase(v)}<br><span class="text-sm">❓ Comment l'organisme démontre-t-il cette exigence ? Preuve à demander : ${docs.length?esc(docs.join(", ")):"<em>aucun document identifié — à demander à l'audité</em>"}.</span></li>`;
    })) + refAiMore(weak.length, pick.length) +
    `<p class="text-sm">Pour créer l'audit complet : module <strong>Audits → + Nouvel audit</strong>, il reprendra ces exigences.</p>` + refAiFooter();
}


/* ---------- Accompagnement pas à pas ---------- */
const REF_AI_VERBS = [
  { re:/d[ée]termin|identifi|d[ée]fin|[ée]tabli|fixe/i,
    produit:"formaliser le résultat dans un document (liste, tableau ou paragraphe du manuel qualité ou d'une politique)", preuve:"document daté, approuvé par la direction et versionné" },
  { re:/surveill|suiv|revo|r[ée]examin|[ée]valu|mesur|analys/i,
    produit:"mettre en place un suivi périodique avec une fréquence fixée (par exemple annuelle, ou à chaque revue de direction)", preuve:"comptes rendus ou enregistrements datés de chaque revue" },
  { re:/planifi|programm/i,
    produit:"un plan d'actions avec responsables et échéances", preuve:"plan à jour et actions suivies dans le module Actions" },
  { re:/conserv|document|enregistr|ma[îi]tris|archiv/i,
    produit:"des informations documentées maîtrisées (identification, version, approbation, durée de conservation)", preuve:"document ou enregistrement présent dans la Documentation du SMQ" },
  { re:/communiqu|diffus|inform|sensibilis/i,
    produit:"un support de communication et une trace de sa diffusion", preuve:"liste de diffusion ou accusés de lecture (campagne de lecture du module Documentation)" },
  { re:/d[ée]montr|assur|garanti|v[ée]rifi|contr[ôo]l/i,
    produit:"des éléments vérifiables qui prouvent l'application", preuve:"enregistrements de contrôle, résultats d'audit interne" },
  { re:/mettre en [œo]uvre|appliqu|r[ée]alis|respect|satisf|prendre en compte/i,
    produit:"une pratique décrite dans une procédure et réellement appliquée", preuve:"preuves d'application (enregistrements) vérifiées lors d'un audit interne" }
];
function refAiGuideFor(v){
  const text = (v.description||v.title||"");
  if(v.type==="responsabilite") return { produit:"désigner nommément la personne responsable (fiche de poste, fiche processus, organigramme)", preuve:"document qui nomme le responsable et son périmètre" };
  if(v.type==="recommandation") return { produit:"appliquer la recommandation si elle est pertinente, sinon noter la raison de ne pas le faire", preuve:"mention dans le document concerné ou décision consignée" };
  const hit = REF_AI_VERBS.find(x=>x.re.test(text));
  return hit || { produit:"une réponse formalisée dans votre SMQ", preuve:"un document ou un enregistrement associé à l'exigence" };
}
function refAiTopicChapter(views, q){
  /* Retrouve un chapitre à partir de son intitulé écrit en toutes lettres dans la question. */
  const qk = new Set(refAiNorm(q).split(/[^a-z0-9]+/).filter(w=>w.length>3).map(w=>w.replace(/(?:s|x)$/,"")));
  const seen = new Map();
  views.forEach(v=>{ if(!seen.has(v.ref)) seen.set(v.ref, v.title); });
  let best = null, bestScore = 0;
  seen.forEach((title, ref)=>{
    const tk = [...new Set(refAiNorm(title).split(/[^a-z0-9]+/).filter(w=>w.length>3).map(w=>w.replace(/(?:s|x)$/,"")))];
    if(tk.length<2) return;
    const score = tk.filter(w=>qk.has(w)).length / tk.length;
    if(score>bestScore){ bestScore = score; best = ref; }
  });
  return bestScore>=0.6 ? best : null;
}
function refAiButtons(ref, v){
  return `<span class="flex gap-2" style="flex-wrap:wrap;margin-top:6px;">
    <button class="btn btn-secondary btn-sm" data-ref-ai-newdoc="${esc(v.id)}" data-ref-id="${esc(ref.id)}">📄 Créer le document</button>
    <button class="btn btn-secondary btn-sm" data-ref-ai-linkdoc="${esc(v.id)}" data-ref-id="${esc(ref.id)}">🔗 Associer un document existant</button>
    <button class="btn btn-secondary btn-sm" data-ref-ai-newaction="${esc(v.id)}" data-ref-id="${esc(ref.id)}">✅ Créer une action</button></span>`;
}
function refAiReplyGuide(ref, views, chapter){
  const list = refAiViewsOf(views, chapter).sort((a,b)=>refAiCmpRef(a.ref,b.ref));
  const head = list.find(v=>v.ref===chapter) || list[0];
  /* D'abord ce qui n'est couvert par aucun document : c'est là que l'effort compte. */
  const ordered = list.slice().sort((a,b)=> (a.bundle.docs.length?1:0)-(b.bundle.docs.length?1:0) || refAiCmpRef(a.ref,b.ref)).slice(0,6);
  const missing = list.filter(v=>!v.bundle.docs.length).length;
  let html = `<strong>Mettre en place le chapitre ${esc(chapter)} — ${esc(head.title)}</strong><br>${list.length} élément(s) à traiter, dont ${missing} sans aucun document associé.` +
    `<p class="text-sm mt-2">Voici une démarche pas à pas. Les pistes sont <em>générales</em> (déduites du verbe de chaque exigence) : adaptez-les à votre organisation et au texte complet de la norme.</p><ol>`;
  ordered.forEach(v=>{
    const g = refAiGuideFor(v);
    const intro = /:\s*$/.test((v.description||"").trim());
    const docs = v.bundle.docs.slice(0,2).map(d=>d.title);
    html += `<li style="margin-bottom:12px;"><strong>${esc(exigenceLabel(v))}</strong> — <span class="text-sm">${esc(refAiText(v,260)||v.title)}</span>` +
      `<br><span class="text-sm">➜ <strong>À faire :</strong> ${esc(g.produit)}.</span>` +
      `<br><span class="text-sm">🧾 <strong>Preuve attendue :</strong> ${esc(g.preuve)}.</span>` +
      (intro ? `<br><span class="text-sm">ℹ️ Cette phrase introduit une liste (a, b, c…) : relisez le texte de la norme pour la liste complète.</span>` : "") +
      `<br><span class="text-xs">Dans Qonnect : ${esc(refAiLevel(v))} — ${docs.length ? "documents reliés (rapprochement automatique, à vérifier) : "+esc(docs.join(", ")) : "aucun document relié"}.</span>` +
      refAiButtons(ref, v) + `</li>`;
  });
  html += `</ol>`;
  if(list.length>ordered.length) html += `<p class="text-xs">… et ${list.length-ordered.length} autre(s) élément(s). Demandez « explique-moi le chapitre ${esc(chapter)} » pour la liste complète.</p>`;
  html += `<p class="text-sm"><strong>Ensuite :</strong> une même procédure peut répondre à plusieurs exigences du chapitre. Une fois le document rédigé ou associé, la couverture se met à jour automatiquement ; vous pourrez alors demander « prépare un audit sur le chapitre ${esc(chapter)} » pour vérifier.</p>`;
  return html + refAiFooter();
}
function refAiEntity(id){ return findBy(DB.requirements, id) || getCustomExigence(id); }
function refAiLinkDoc(exId, docId){
  const legacy = findBy(DB.requirements, exId);
  if(legacy){ legacy.extraDocIds = legacy.extraDocIds || []; if(!legacy.extraDocIds.includes(docId)) legacy.extraDocIds.push(docId); saveDB(); return true; }
  const c = getCustomExigence(exId);
  if(!c) return false;
  c.docIds = c.docIds || []; if(!c.docIds.includes(docId)) c.docIds.push(docId);
  saveDB(); return true;
}
function refAiPost(refId, html){
  (REF_AI_HISTORY[refId] = REF_AI_HISTORY[refId] || []).push({role:"bot", text:html});
}
function refAiTitleOf(exId){
  const v = refAiEntity(exId);
  if(!v) return { label:"", title:"" };
  const ref = v.ref, title = v.title || v.label || "";
  return { label:ref, title };
}

document.addEventListener("click", (e)=>{
  const newDoc = e.target.closest("[data-ref-ai-newdoc]");
  const linkDoc = e.target.closest("[data-ref-ai-linkdoc]");
  const newAct = e.target.closest("[data-ref-ai-newaction]");
  if(newDoc){
    const id = newDoc.getAttribute("data-ref-ai-newdoc"); const t = refAiTitleOf(id);
    openQuickForm("document", { title:t.title, linkExigenceId:id });
    return;
  }
  if(newAct){
    const id = newAct.getAttribute("data-ref-ai-newaction"); const t = refAiTitleOf(id);
    openQuickForm("action", { title:"Répondre à l'exigence "+t.label+" — "+t.title, originType:"exigence", originId:id });
    return;
  }
  if(linkDoc){
    const id = linkDoc.getAttribute("data-ref-ai-linkdoc"); const refId = linkDoc.getAttribute("data-ref-id");
    const docs = DB.documents.filter(d=>d.status!=="obsolete");
    const t = refAiTitleOf(id);
    openModal({ title:"Associer un document à l'exigence "+t.label,
      bodyHtml:`<p class="text-sm mb-2">${esc(t.title)}</p><div class="field"><label>Document existant</label><select id="ai-link-doc">${docs.map(d=>`<option value="${esc(d.id)}">${esc(d.ref||d.id)} — ${esc(d.title)}</option>`).join("")}</select></div>`,
      footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="ai-link-confirm">Associer</button>`,
      onMount:(o)=>{ o.querySelector("#ai-link-confirm").addEventListener("click", ()=>{
        const docId = o.querySelector("#ai-link-doc").value;
        if(!docId){ toast("Aucun document à associer","⚠️"); return; }
        const d = getDocument(docId);
        if(refAiLinkDoc(id, docId)){
          refAiPost(refId, `✅ Document « ${esc(d?d.title:docId)} » associé à l'exigence ${esc(t.label)}. Sa couverture est recalculée : redemandez-moi le chapitre pour voir le nouveau niveau.`);
          closeModal(); toast("Document associé à l'exigence"); render();
        } else toast("Exigence introuvable","⚠️");
      });}
    });
  }
});


/* Boutons de suggestion intégrés à une réponse (traités comme les puces de suggestion de l'onglet). */
function refAiGuideButtons(ref, items){
  return `<div class="ai-suggestions" style="margin-top:10px;">${items.map(([label,cmd])=>`<button class="chip" data-ref-ai-suggest="${esc(cmd)}" data-ref-id="${esc(ref.id)}">${esc(label)}</button>`).join("")}</div>`;
}

/* ---------- Définitions des termes courants du management de la qualité ---------- */
/* Explications en langage simple, rédigées pour aider à comprendre : elles ne reproduisent pas le texte des normes.
   Pour la définition officielle, se reporter à l'ISO 9000 (vocabulaire). */
const REF_AI_GLOSSARY = [
  { re:/enjeux?/, name:"Enjeux internes et externes", search:["enjeu"],
    def:"Ce sont les éléments, extérieurs ou propres à l'organisme, qui peuvent aider ou gêner l'atteinte des résultats attendus du système de management.",
    ex:["<strong>Externes</strong> : réglementation, concurrence, marché et économie, évolutions techniques, attentes de la société, contexte local.","<strong>Internes</strong> : culture et valeurs, organisation, ressources et compétences, connaissances, performance actuelle, outils et locaux."],
    tip:"Concrètement : une courte analyse (par exemple type SWOT ou PESTEL) à mettre à jour au moins une fois par an. Le module <strong>Contexte & Stratégie</strong> de Qonnect sert à les enregistrer." },
  { re:/parties? interess/, name:"Parties intéressées", search:["partie interess","interess"],
    def:"Les personnes ou organismes qui peuvent influencer l'organisme, être touchés par ses décisions ou ses activités, ou simplement s'en sentir concernés.",
    ex:["Clients et patients, personnel, fournisseurs et prestataires, autorités et organismes de contrôle, financeurs, partenaires."],
    tip:"On les liste avec leurs besoins et attentes, puis on décide lesquels sont pertinents pour le système. Module <strong>Contexte & Stratégie</strong>." },
  { re:/domaine d'application|perimetre/, name:"Domaine d'application (périmètre)", search:["domaine d'application"],
    def:"Les limites du système de management : quels sites, activités, produits ou services il couvre, et ce qui est volontairement exclu avec la justification.",
    ex:["Exemple : « consultations et hospitalisation du site A, hors activité de recherche »."], tip:"Il doit être écrit, tenu à jour et accessible : c'est un document à part entière." },
  { re:/systeme de management|\bsmq\b/, name:"Système de management de la qualité (SMQ)", search:["systeme de management"],
    def:"L'ensemble organisé des règles, processus, responsabilités et documents grâce auquel l'organisme pilote la qualité de ce qu'il fournit et s'améliore.",
    ex:["Politique, objectifs, processus, procédures, enregistrements, audits, revue de direction."], tip:"Qonnect est précisément l'outil qui relie ces éléments entre eux." },
  { re:/processus/, name:"Processus", search:["processus"],
    def:"Un ensemble d'activités liées qui transforment des éléments d'entrée (une demande, une matière, une information) en éléments de sortie (un service rendu, un produit, un résultat).",
    ex:["Exemples : accueil du patient, achats, maintenance, recrutement."], tip:"Chaque processus a un pilote, des entrées, des sorties, des risques et des indicateurs : module <strong>Processus</strong>." },
  { re:/informations? documentee|documents? et enregistrement|enregistrement/, name:"Informations documentées", search:["informations documentees","documentee"],
    def:"Tout ce que l'organisme doit écrire et maîtriser. On distingue les <strong>documents</strong> (ce qu'il faut faire : politique, procédure, mode opératoire) et les <strong>enregistrements</strong> (ce qui a été fait : compte rendu, résultat de contrôle, feuille de présence).",
    ex:["Un document se met à jour et se versionne ; un enregistrement se conserve tel quel, daté et signé."], tip:"Module <strong>Documentation du SMQ</strong>." },
  { re:/risques? (et|ou) opportunite|opportunite|\brisques?\b/, name:"Risques et opportunités", search:["risque","opportunite"],
    def:"Un <strong>risque</strong> est l'effet de l'incertitude sur un résultat attendu : ce qui pourrait mal tourner. Une <strong>opportunité</strong> est l'effet favorable : ce qui pourrait aider à mieux faire.",
    ex:["Risque : dépendance à un fournisseur unique. Opportunité : un nouvel outil qui réduit les délais."], tip:"On les évalue (gravité, probabilité), on décide d'agir ou non, et on suit les actions : module <strong>Risques</strong>." },
  { re:/non[- ]?conformite/, name:"Non-conformité", search:["non-conformite","non conformite"],
    def:"Une exigence qui n'est pas respectée : écart par rapport à une procédure, à une norme, à une réglementation ou à une attente du client.",
    ex:["Un contrôle non réalisé, un produit hors tolérance, un document périmé encore utilisé."], tip:"On traite d'abord l'effet immédiat (correction), puis on cherche la cause pour l'éviter (action corrective) : module <strong>Événements</strong>." },
  { re:/action corrective|correction/, name:"Correction et action corrective", search:["action corrective","corrective"],
    def:"La <strong>correction</strong> traite l'effet visible tout de suite (on trie, on refait, on répare). L'<strong>action corrective</strong> supprime la <em>cause</em> de l'écart pour qu'il ne se reproduise pas.",
    ex:["Correction : remplacer le lot défectueux. Action corrective : revoir la méthode de contrôle à la réception."], tip:"Module <strong>Actions</strong>, avec l'événement d'origine rattaché." },
  { re:/audit interne|\baudit\b/, name:"Audit interne", search:["audit"],
    def:"Une vérification méthodique, indépendante et documentée, qui compare ce qui est fait aux règles fixées, à partir de preuves, pour juger si le système fonctionne et s'améliore.",
    ex:["Un auditeur n'audite pas son propre travail ; il conclut par des constats : points forts, écarts, pistes de progrès."], tip:"Module <strong>Audits</strong>." },
  { re:/revue de direction/, name:"Revue de direction", search:["revue de direction","direction"],
    def:"Le moment où la direction examine à intervalles planifiés si le système est adapté, efficace et aligné avec la stratégie, puis décide des actions et des moyens.",
    ex:["Entrées : résultats d'audits, indicateurs, réclamations, risques, état des actions. Sorties : décisions et ressources."], tip:"Module <strong>Revue de Direction</strong> de Qonnect." },
  { re:/politique qualite|politique/, name:"Politique qualité", search:["politique"],
    def:"Les intentions et orientations de l'organisme en matière de qualité, exprimées officiellement par sa direction.",
    ex:["Un texte court, communiqué au personnel et accessible aux parties intéressées pertinentes."], tip:"Elle sert de cadre pour fixer les objectifs." },
  { re:/objectifs? qualite|objectif/, name:"Objectifs qualité", search:["objectif"],
    def:"Les résultats précis à atteindre, cohérents avec la politique, mesurables, avec un responsable et une échéance.",
    ex:["Exemple : « réduire de 10 % les délais de traitement d'ici fin d'année »."], tip:"Module <strong>Objectifs & indicateurs</strong>." },
  { re:/indicateur|performance/, name:"Indicateur de performance", search:["indicateur","performance"],
    def:"Une mesure régulière (valeur, cible, seuil d'alerte) qui montre si un processus ou un objectif se comporte comme prévu.",
    ex:["Taux de satisfaction, délai moyen, nombre de non-conformités par mois."], tip:"Module <strong>Objectifs & indicateurs</strong>." },
  { re:/amelioration continue|amelioration/, name:"Amélioration continue", search:["amelioration"],
    def:"La démarche permanente qui consiste à repérer ce qui peut être mieux fait, à agir, puis à vérifier le résultat (le cycle « planifier, faire, vérifier, agir »).",
    ex:["Source d'idées : audits, réclamations, indicateurs, suggestions du personnel."], tip:"Modules <strong>Actions</strong> et <strong>Événements</strong> (suggestions)." },
  { re:/satisfaction/, name:"Satisfaction du client", search:["satisfaction"],
    def:"La perception qu'a le client (ou le patient) de la mesure dans laquelle ses attentes ont été remplies.",
    ex:["Enquêtes, réclamations, remerciements, taux de retour."], tip:"On en suit des indicateurs et on les passe en revue." },
  { re:/prestataires? externes?|fournisseur|sous[- ]trait/, name:"Fournisseurs et prestataires externes", search:["fournisseur","prestataire","externe"],
    def:"Toute entité extérieure dont les produits ou services entrent dans ce que fournit l'organisme. L'organisme reste responsable de ce qu'il en fait.",
    ex:["On définit des critères de choix, on évalue, on suit les incidents, on garde les preuves."], tip:"Module <strong>Fournisseurs</strong>." },
  { re:/competence/, name:"Compétence", search:["competence"],
    def:"L'aptitude à appliquer des connaissances et un savoir-faire pour obtenir un résultat attendu. On vérifie qu'elle existe (formation, expérience, évaluation) et on la prouve.",
    ex:["Diplôme, habilitation, évaluation par le responsable, formation suivie."], tip:"Module <strong>Compétences & Habilitations</strong>." },
  { re:/tracabilite/, name:"Traçabilité", search:["tracabilite"],
    def:"La capacité de retrouver l'historique, l'utilisation ou l'origine de ce qui a été fait ou fourni.",
    ex:["Savoir quel lot, quel opérateur, quelle version de procédure."], tip:"Elle repose sur des enregistrements fiables et datés." },
  { re:/changement/, name:"Gestion du changement", search:["changement","modification"],
    def:"Faire évoluer l'organisation, un processus ou un équipement de façon maîtrisée : évaluer l'impact avant, décider, informer, vérifier après.",
    ex:["Changer de fournisseur, de logiciel ou de méthode de travail."], tip:"Module <strong>Changements</strong>." },
  { re:/exigence/, name:"Exigence", search:["exigence"],
    def:"Un besoin ou une attente énoncé, imposé ou implicite. Dans une norme, « <em>doit</em> » indique une exigence à respecter ; « <em>il convient de</em> » une recommandation.",
    ex:["Les exigences peuvent venir de la norme, de la loi, des clients ou de l'organisme lui-même."], tip:"" }
];
function refAiIsDefinitionQuestion(n){
  return /c'est quoi|cest quoi|qu'est[- ]ce (que|qu')|que (signifie|veut dire|sont|represente)|definition|definis|que doit[- ]on entendre|c'est a dire|ca veut dire/.test(n);
}
function refAiReplyDefinition(ref, views, q, n){
  const entry = REF_AI_GLOSSARY.find(e=>e.re.test(n));
  if(!entry) return null;
  /* Où le référentiel en parle : on cherche les mots clés du terme dans le texte importé. */
  const found = views.map(v=>{ const hay = refAiNorm(v.title+" "+(v.description||"")); return { v, hits: entry.search.filter(k=>hay.includes(k)).length }; })
    .filter(x=>x.hits>0).sort((a,b)=>b.hits-a.hits || refAiCmpRef(a.v.ref,b.v.ref));
  let html = `<strong>${entry.name}</strong><p>${entry.def}</p>`;
  if(entry.ex && entry.ex.length) html += refAiList(entry.ex.map(e=>`<li>${e}</li>`));
  if(entry.tip) html += `<p class="text-sm">${entry.tip}</p>`;
  if(found.length){
    const sel = found.slice(0,3).map(x=>x.v);
    html += `<p class="mt-2"><strong>Dans ${esc(ref.name)} :</strong> ${found.length} passage(s), notamment</p>` +
      refAiList(sel.map(v=>`<li>${refAiBase(v)}</li>`));
    const top = refAiTop(sel[0].ref);
    html += refAiGuideButtons(ref, [["Accompagne-moi sur le chapitre "+top, "Accompagne-moi sur le chapitre "+top], ["Voir tous les passages", "Où parle-t-on de "+entry.search[0]+" ?"]]);
  }
  html += `<p class="text-xs mt-2">Explication en langage courant, rédigée pour aider à comprendre ; la définition officielle se trouve dans l'ISO 9000 (vocabulaire).</p>`;
  return html;
}

function refAIGenerateReply(ref, score, q){
  const views = score.views;
  const n = refAiNorm(q);
  const ctx = REF_AI_CONTEXT[ref.id] = REF_AI_CONTEXT[ref.id] || {};
  if(!views.length) return `Ce référentiel ne contient encore aucune exigence. Importez un texte depuis l'onglet « Versions ».`;

  let chapter = refAiChapterOf(views, q) || refAiTopicChapter(views, q);
  const howTo = /comment|faire|mettre en|mise en place|concretement|que dois|accompagne|guide|aide|etape|demarche|par quoi/.test(n);
  /* Suites de conversation : « et le suivant ? », « plus de détails », « pourquoi ? » */
  if(!chapter && ctx.lastChapter){
    const tops = [...new Set(views.map(v=>refAiTop(v.ref)))].sort(refAiCmpRef);
    const i = tops.indexOf(refAiTop(ctx.lastChapter));
    if(/suivant|apres/.test(n) && i>=0 && tops[i+1]) chapter = tops[i+1];
    else if(/precedent|avant/.test(n) && i>0) chapter = tops[i-1];
    else if(/detail|plus|ce chapitre|celui|et pour|pourquoi|comment|explique|audit|non couvert/.test(n) && n.length<60 && !/chapitres? \d/.test(n)) chapter = ctx.lastChapter;
  }

  if(/audit/.test(n)) { if(chapter) ctx.lastChapter = chapter; return refAiReplyAudit(ref, views, chapter); }
  if(chapter && howTo && !/pourquoi|calcul/.test(n)){ ctx.lastChapter = chapter; return refAiReplyGuide(ref, views, chapter); }
  if(chapter){ ctx.lastChapter = chapter; return refAiReplyChapter(ref, views, chapter, q, n); }

  if(refAiIsDefinitionQuestion(n)){ const def = refAiReplyDefinition(ref, views, q, n); if(def) return def; }
  if(/recommandation/.test(n)) return refAiReplyType(views, "recommandation", "recommandation");
  if(/preuve|enregistrement/.test(n)) return refAiReplyType(views, "preuve", "preuve attendue");
  if(/responsabilite/.test(n)) return refAiReplyType(views, "responsabilite", "responsabilité");
  if(/combien/.test(n)) return `${esc(ref.name)} contient ${views.length} élément(s) : ${esc(refAiByType(views))}.`+refAiFooter();
  if(/priorit|par ou|commenc|que faire|a traiter|urgent/.test(n)) return refAiReplyPriorities(views);
  if(/non couvert|pas couvert|ecart|manque|lacune/.test(n)){
    const list = views.filter(v=>v.level==="non_couvert").sort((a,b)=>refAiCmpRef(a.ref,b.ref));
    if(!list.length) return "Toutes les exigences disposent d'au moins un élément de preuve associé.";
    const sel = list.slice(0,8);
    return `<strong>${list.length} exigence(s) non couverte(s)</strong>` + refAiList(sel.map(v=>`<li>${refAiBase(v)}</li>`)) + refAiMore(list.length, sel.length) + refAiFooter();
  }
  if(/revue de direction/.test(n)){
    const gaps = views.filter(v=>REF_AI_LEVEL_ORDER[v.level]<=1);
    return `<strong>À intégrer à la revue de direction — ${esc(ref.name)}</strong>` + refAiList([
      `<li>Niveau de maîtrise : ${score.pct}% (${esc(refAiByLevel(views))})</li>`,
      `<li>${gaps.length} exigence(s) non couvertes ou partielles${gaps.length?", dont les premières : "+gaps.slice(0,3).map(v=>esc(exigenceLabel(v))).join(", "):""}</li>`,
      `<li>Risques et actions en retard liés aux processus concernés (voir Revue de Direction)</li>`
    ]) + refAiFooter();
  }
  if(/pourquoi|calcul|niveau de conformite|comment.*conform/.test(n)){
    return `La couverture d'une exigence est calculée à partir des preuves réellement enregistrées dans Qonnect (documents, audits, actions, risques, indicateurs) — jamais déclarée sans preuve. Sans aucun document relié, une exigence reste « non couverte ». Indiquez un chapitre (par exemple « pourquoi le chapitre ${esc(views[0].ref)} est à ce niveau ? ») pour voir le détail.`;
  }
  if(/r[ée]sum|synthese|bilan|etat des lieux|vue d'ensemble/.test(n) || /^(bonjour|salut|hello)/.test(n)) return refAiReplySummary(ref, score);

  /* Dernier recours : recherche par mots-clés dans le texte des exigences. */
  const kws = refAiKeywords(q);
  if(kws.length){
    const found = refAiReplySearch(views, kws);
    if(found) return found;
    return `Je n'ai trouvé aucune exigence qui mentionne « ${esc(kws.join(", "))} » dans ${esc(ref.name)}. Essayez un autre mot, ou indiquez un numéro de chapitre.`;
  }
  const ex = refAiTop(views[Math.floor(views.length/2)].ref);
  return `Je peux répondre à partir du texte importé et de vos données. Par exemple :<ul>
    <li>« Résume ce référentiel »</li>
    <li>« Explique-moi le chapitre ${esc(ex)} » ou « et le suivant ? »</li>
    <li>« Où parle-t-on des risques ? » (recherche dans le texte)</li>
    <li>« Quelles sont les recommandations ? », « les preuves attendues ? »</li>
    <li>« Par où commencer ? »</li>
    <li>« Prépare un audit sur le chapitre ${esc(ex)} »</li></ul>`;
}
