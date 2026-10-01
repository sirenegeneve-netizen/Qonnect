/* ============================================================
   ASSISTANT DU RÉFÉRENTIEL (local, sans envoi de données)
   Il ne « devine » pas : chaque réponse est construite à partir du texte importé
   et des preuves réellement enregistrées dans Qonnect (documents, audits, actions, risques).
   ============================================================ */
const REF_AI_CONTEXT = {};   // dernier chapitre évoqué, par référentiel (pour « et le suivant ? »)
const REF_AI_LEVEL_ORDER = { non_couvert:0, partiellement:1, a_renforcer:2, maitrise:3, optimise:4 };
const REF_AI_STOP = new Set(("dans pour avec sans cette cette ceux celle comme plus moins tout tous toute toutes quel quelle quels quelles quoi donc alors "+
  "etre avoir fait faire dois doit peux peut veux veut explique expliquer expliques parle parler resume resumer liste lister montre montrer donne donner "+
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

function refAIGenerateReply(ref, score, q){
  const views = score.views;
  const n = refAiNorm(q);
  const ctx = REF_AI_CONTEXT[ref.id] = REF_AI_CONTEXT[ref.id] || {};
  if(!views.length) return `Ce référentiel ne contient encore aucune exigence. Importez un texte depuis l'onglet « Versions ».`;

  let chapter = refAiChapterOf(views, q);
  /* Suites de conversation : « et le suivant ? », « plus de détails », « pourquoi ? » */
  if(!chapter && ctx.lastChapter){
    const tops = [...new Set(views.map(v=>refAiTop(v.ref)))].sort(refAiCmpRef);
    const i = tops.indexOf(refAiTop(ctx.lastChapter));
    if(/suivant|apres/.test(n) && i>=0 && tops[i+1]) chapter = tops[i+1];
    else if(/precedent|avant/.test(n) && i>0) chapter = tops[i-1];
    else if(/detail|plus|ce chapitre|celui|et pour|pourquoi|comment|explique|audit|non couvert/.test(n) && n.length<60 && !/chapitres? \d/.test(n)) chapter = ctx.lastChapter;
  }

  if(/audit/.test(n)) { if(chapter) ctx.lastChapter = chapter; return refAiReplyAudit(ref, views, chapter); }
  if(chapter){ ctx.lastChapter = chapter; return refAiReplyChapter(ref, views, chapter, q, n); }

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
