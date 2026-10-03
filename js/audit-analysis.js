/* ============================================================
   QONNECT — Analyse d'audit (AIDE À L'ÉVALUATION)
   ------------------------------------------------------------
   Rôle : mettre en regard, pour une question d'audit, l'exigence applicable (ses « attendus »),
   la pratique décrite par l'audité et les preuves référencées, puis produire une analyse
   explicable et une PROPOSITION de statut.

   Principes
   - L'analyse n'est jamais une décision : le statut final est celui de l'auditeur (q.decision / q.statut).
   - Le moteur est interchangeable. Il reçoit une entrée JSON (buildAnalysisInput) et renvoie une
     sortie JSON de forme fixe (voir normalizeAnalysisResult). Un moteur IA se branche avec
     registerAnalysisEngine() sans toucher à l'interface.
   - Le moteur fourni (« local_rules ») est un moteur à RÈGLES, provisoire : il rapproche des racines
     de mots (attendus ↔ pratique ↔ métadonnées des preuves). Il ne comprend pas le sens des textes,
     et l'interface le dit explicitement. Ce n'est PAS une IA.
   - Section 1 (pure, sans accès à DB) : types de preuves, moteur, validation de sortie.
     Section 2 : accès aux données Qonnect (résolution des preuves, entrée d'analyse, index inverse).
   ============================================================ */

/* ============ 1. PUR — types de preuves, normalisation, moteur ============ */

/* Les 14 types de preuves. source : "qonnect" = objet existant référencé ; "manuel" = saisie libre. */
const AUDIT_EVIDENCE_TYPES = [
  { id:"document_qonnect",  label:"Document Qonnect",            icon:"📄", source:"qonnect" },
  { id:"procedure_processus", label:"Procédure / processus",     icon:"🧩", source:"qonnect" },
  { id:"enregistrement",    label:"Enregistrement",              icon:"🗂️", source:"qonnect", manualAllowed:true },
  { id:"indicateur",        label:"Indicateur",                  icon:"📈", source:"qonnect" },
  { id:"action",            label:"Action",                      icon:"✅", source:"qonnect" },
  { id:"risque",            label:"Risque",                      icon:"⚠️", source:"qonnect" },
  { id:"reunion",           label:"Réunion / compte rendu",      icon:"📅", source:"qonnect" },
  { id:"decision",          label:"Décision",                    icon:"⚖️", source:"qonnect" },
  { id:"formation",         label:"Formation / compétence",      icon:"🎓", source:"qonnect" },
  { id:"observation",       label:"Observation terrain",         icon:"👁️", source:"manuel" },
  { id:"entretien",         label:"Entretien",                   icon:"💬", source:"manuel" },
  { id:"lien_externe",      label:"Lien externe",                icon:"🔗", source:"manuel", needs:"url" },
  { id:"capture",           label:"Capture d'écran",             icon:"🖼️", source:"manuel", needs:"file" },
  { id:"piece_jointe",      label:"Pièce jointe",                icon:"📎", source:"manuel", needs:"file" },
];
function getEvidenceType(id){ return AUDIT_EVIDENCE_TYPES.find(t=>t.id===id) || { id, label:id, icon:"•", source:"manuel" }; }

/* Minuscules, sans accents, apostrophes uniformisées : base de tout rapprochement textuel. */
function qnorm(s){
  return String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’‘`]/g,"'");
}
const ANALYSIS_STOPWORDS = ["dans","pour","avec","sans","leur","leurs","cette","ainsi","entre","comme","selon","etre","sont","elle","elles","nous","vous","plus","tout","tous"];
/* Racines de mots utilisées quand une exigence n'a pas d'attendus propres (déduites de la « preuve attendue »). */
function keywordStems(text){
  const out = [];
  qnorm(text).split(/[^a-z0-9]+/).forEach(w=>{
    if(w.length<5 || ANALYSIS_STOPWORDS.includes(w)) return;
    const stem = w.slice(0, 7);
    if(!out.includes(stem)) out.push(stem);
  });
  return out;
}
function matchTerms(normText, keywords){
  return (keywords||[]).filter(k=> k && normText.indexOf(qnorm(k))>=0);
}
/* Signature simple (djb2) : sert à détecter qu'une analyse n'est plus à jour. */
function analysisSignature(input){
  const basis = JSON.stringify({
    p:input.pratique||"",
    e:(input.preuves||[]).map(p=>[p.id,p.title,p.description,p.url,p.fileName]),
    a:(input.exigence&&input.exigence.attendus||[]).map(a=>a.id+":"+a.label),
  });
  let h = 5381;
  for(let i=0;i<basis.length;i++) h = ((h<<5)+h + basis.charCodeAt(i)) | 0;
  return "sig"+(h>>>0).toString(36);
}

/* Statuts qu'un moteur a le droit de PROPOSER. « non_conforme » et « non_applicable » restent un jugement d'auditeur. */
const ANALYSIS_ALLOWED_PROPOSALS = ["conforme","partiellement_conforme","a_verifier"];
const ANALYSIS_ALL_STATUSES = ["conforme","partiellement_conforme","non_conforme","non_applicable","a_verifier","non_evalue"];

/* Valide et normalise la sortie d'un moteur (le moteur local comme un futur moteur IA). Lève une Error si invalide. */
function normalizeAnalysisResult(raw){
  if(!raw || typeof raw!=="object") throw new Error("Résultat d'analyse vide ou non structuré.");
  const arr = (v,name)=>{ if(v==null) return []; if(!Array.isArray(v)) throw new Error("Champ « "+name+" » invalide (liste attendue)."); return v; };
  const str = (v,name)=>{ if(v==null) return ""; if(typeof v!=="string") throw new Error("Champ « "+name+" » invalide (texte attendu)."); return v; };
  const proposed = str(raw.proposedStatus,"proposedStatus");
  if(!ANALYSIS_ALL_STATUSES.includes(proposed)) throw new Error("Statut proposé inconnu : « "+proposed+" ».");
  return {
    coveredElements: arr(raw.coveredElements,"coveredElements"),
    missingElements: arr(raw.missingElements,"missingElements"),
    evidenceAssessment: arr(raw.evidenceAssessment,"evidenceAssessment"),
    analysisSummary: str(raw.analysisSummary,"analysisSummary"),
    proposedStatus: proposed,
    justification: str(raw.justification,"justification"),
    additionalEvidenceSuggested: arr(raw.additionalEvidenceSuggested,"additionalEvidenceSuggested"),
    justificationPoints: arr(raw.justificationPoints,"justificationPoints"),
    limits: arr(raw.limits,"limits"),
    coverage: raw.coverage && typeof raw.coverage==="object" ? { covered:+raw.coverage.covered||0, total:+raw.coverage.total||0 } : null,
  };
}

/* ---- Moteur local à règles (provisoire) ---- */
const LOCAL_RULES_ENGINE = {
  id:"local_rules",
  label:"Analyse locale par règles (provisoire)",
  kind:"rules",
  isAI:false,
  version:"1.0",
  disclaimer:"Ce n'est pas une analyse par intelligence artificielle. Qonnect rapproche des mots-clés entre les attendus de l'exigence, la pratique décrite et le titre, la description et le type des preuves. Il ne lit pas le sens des documents : toute conclusion doit être relue par l'auditeur.",
  analyze(input){
    const ex = input.exigence || {};
    const attendus = ex.attendus || [];
    const practice = qnorm(input.pratique);
    const preuves = input.preuves || [];
    const qProcess = input.question && input.question.processId;
    const ev = preuves.map(p=>{
      const meta = p.meta || {};
      return { p, meta,
        fields:{ titre:qnorm(p.title), description:qnorm(p.description), contenu:qnorm(meta.bodyExcerpt), type:qnorm((meta.docTypeLabel||"")+" "+(p.typeLabel||"")) } };
    });

    const covered = [], missing = [], suggestions = [];
    const matchedByEvidence = {};
    attendus.forEach(att=>{
      const hits = [];
      ev.forEach(e=>{
        const terms = [];
        let field = null;
        ["titre","description","contenu"].forEach(f=>{
          const t = matchTerms(e.fields[f], att.keywords);
          if(t.length){ t.forEach(x=>{ if(!terms.includes(x)) terms.push(x); }); if(!field) field = f; }
        });
        if(terms.length){ hits.push({ evidenceId:e.p.id, title:e.p.title, via:"mot-clé", terms, field }); return; }
        const typeOk = (att.evidenceTypes||[]).includes(e.meta.docType) && (!qProcess || !e.meta.processId || e.meta.processId===qProcess);
        if(typeOk) hits.push({ evidenceId:e.p.id, title:e.p.title, via:"type de document", terms:[e.meta.docTypeLabel||e.meta.docType], field:"type" });
      });
      const declaredTerms = matchTerms(practice, att.keywords);
      if(hits.length){
        covered.push({ id:att.id, label:att.label, evidence:hits, declaredInPractice:declaredTerms.length>0 });
        hits.forEach(h=>{ (matchedByEvidence[h.evidenceId] = matchedByEvidence[h.evidenceId]||[]).push(att); });
      } else {
        missing.push({ id:att.id, label:att.label, declaredInPractice:declaredTerms.length>0,
          reason: declaredTerms.length ? "Mentionné dans la pratique décrite, mais aucune preuve sélectionnée ne le démontre."
                                       : "Ni la pratique décrite ni les preuves sélectionnées ne l'abordent." });
        if(att.suggestion) suggestions.push({ elementId:att.id, label:att.label, suggestion:att.suggestion });
      }
    });

    const evidenceAssessment = ev.map(e=>{
      const hits = matchedByEvidence[e.p.id] || [];
      const warnings = [];
      if(e.meta.docStatus==="a_reviser") warnings.push("Document marqué « à réviser » dans Qonnect.");
      if(e.meta.docStatus==="obsolete") warnings.push("Document obsolète dans Qonnect.");
      if(e.meta.source==="manuel" && !(e.p.description||"").trim() && !e.p.url && !e.p.fileName) warnings.push("Preuve sans description : elle ne peut pas être rapprochée des attendus.");
      return { evidenceId:e.p.id, title:e.p.title, type:e.p.type, typeLabel:e.p.typeLabel,
        relevance: hits.length ? "pertinente" : "non_determinee",
        matchedElements: hits.map(a=>({ id:a.id, label:a.label })),
        note: hits.length ? "Rapprochée de : "+hits.map(a=>a.label).join(" ; ")+"."
                          : "Aucun lien avec les attendus n'a pu être établi automatiquement (le moteur local ne lit pas le contenu en profondeur).",
        warnings };
    });

    const total = attendus.length;
    const label = ex.ref ? ("l'exigence "+ex.ref) : "la question";
    const limits = [ this.disclaimer ];
    let proposed, summary, points = [];
    if(!total){
      proposed = "a_verifier";
      summary = "Aucun attendu n'est défini pour "+label+" : Qonnect ne peut pas mettre les éléments fournis en regard de l'exigence.";
      points.push("Aucun attendu n'est renseigné sur l'exigence ni de « preuve attendue » sur la question.");
    } else if(!practice.trim() && !preuves.length){
      proposed = "a_verifier";
      summary = "Aucun élément (ni pratique décrite, ni preuve) n'a été fourni pour "+label+".";
      points.push("La pratique n'est pas décrite et aucune preuve n'est référencée.");
    } else if(covered.length===total){
      proposed = "conforme";
      summary = "Les éléments fournis démontrent l'ensemble des attendus identifiés pour "+label+" ("+covered.map(c=>c.label.toLowerCase()).join(", ")+").";
    } else if(covered.length>0){
      proposed = "partiellement_conforme";
      summary = "Les éléments fournis démontrent "+covered.length+" attendu(s) sur "+total+" pour "+label+" : "+covered.map(c=>c.label.toLowerCase()).join(" ; ")+". "
              + missing.length+" élément(s) reste(nt) insuffisamment démontré(s) : "+missing.map(m=>m.label.toLowerCase()).join(" ; ")+".";
    } else {
      proposed = "a_verifier";
      summary = "Aucun des "+total+" attendus de "+label+" n'est démontré par les éléments fournis. Cela ne vaut pas constat de non-conformité : les preuves peuvent exister sans avoir été référencées.";
    }
    covered.forEach(c=> points.push("Démontré — "+c.label+" (preuve : "+c.evidence.map(h=>h.title).join(", ")+")."));
    missing.forEach(m=> points.push("Non démontré — "+m.label+" : "+m.reason));
    if(input.exigence && input.exigence.attendusSource==="preuve_attendue") limits.push("Aucun attendu n'est défini sur l'exigence : l'analyse repose sur la « preuve attendue » indiquée dans la question.");
    if(proposed==="conforme") limits.push("Une proposition « Conforme » signifie que chaque attendu est rapproché d'au moins une preuve ; elle ne vérifie pas la qualité ni le contenu réel des preuves.");

    return {
      coveredElements:covered, missingElements:missing, evidenceAssessment,
      analysisSummary:summary, proposedStatus:proposed,
      justification:points.join(" "), justificationPoints:points,
      additionalEvidenceSuggested:suggestions, limits,
      coverage:{ covered:covered.length, total },
    };
  }
};

/* ---- Registre des moteurs (point d'extension pour une vraie IA) ---- */
const ANALYSIS_ENGINES = { local_rules: LOCAL_RULES_ENGINE };
let ACTIVE_ANALYSIS_ENGINE_ID = "local_rules";
/* Un moteur = { id, label, kind:"rules"|"ai", isAI, version, disclaimer, analyze(input) → résultat | Promise<résultat> }.
   Le résultat doit respecter normalizeAnalysisResult(). Exemple de branchement futur :
   registerAnalysisEngine({ id:"claude", label:"Analyse IA", kind:"ai", isAI:true, version:"1", analyze: async (input)=>fetch(...) }); setActiveAnalysisEngine("claude"); */
function registerAnalysisEngine(engine){
  if(!engine || !engine.id || typeof engine.analyze!=="function") throw new Error("Moteur d'analyse invalide.");
  ANALYSIS_ENGINES[engine.id] = engine;
}
function setActiveAnalysisEngine(id){
  if(!ANALYSIS_ENGINES[id]) throw new Error("Moteur d'analyse inconnu : "+id);
  ACTIVE_ANALYSIS_ENGINE_ID = id;
}
function getActiveAnalysisEngine(){ return ANALYSIS_ENGINES[ACTIVE_ANALYSIS_ENGINE_ID] || LOCAL_RULES_ENGINE; }

/* ============ 2. DONNÉES QONNECT — résolution des preuves, entrée d'analyse, index inverse ============ */

function currentActor(){ return "Vous"; } /* pas d'authentification dans le prototype — même convention que les autres formulaires */

/* Candidats sélectionnables pour un type de preuve (objets Qonnect existants, jamais copiés). */
function getEvidenceCandidates(typeId){
  const docs = (types)=> DB.documents.filter(d=>d.status!=="obsolete" && (!types || types.includes(d.type)))
    .map(d=>({ refKind:"document", refId:d.id, title:d.title, subtitle:(LABELS.docType[d.type]||d.type)+" · "+d.ref }));
  switch(typeId){
    case "document_qonnect": return docs();
    case "procedure_processus":
      return docs(["procedure","processus","mode_operatoire","instruction"])
        .concat(DB.processes.map(p=>({ refKind:"process", refId:p.id, title:"Processus — "+p.name, subtitle:"Pilote : "+p.pilot })));
    case "enregistrement": return docs(["enregistrement","formulaire"]);
    case "indicateur": return DB.indicators.map(i=>({ refKind:"indicator", refId:i.id, title:i.name, subtitle:"Valeur : "+i.value }));
    case "action": return DB.actions.map(a=>({ refKind:"action", refId:a.id, title:a.title, subtitle:"Responsable : "+a.owner }));
    case "risque": return DB.risks.map(r=>({ refKind:"risk", refId:r.id, title:r.name, subtitle:r.type==="opportunite"?"Opportunité":"Risque" }));
    case "reunion": return (DB.managementReviews||[]).map(r=>({ refKind:"review", refId:r.id, title:"Revue de direction — "+r.periodLabel, subtitle:"Réunion du "+fmtDate(r.reviewDate) }));
    case "decision": return (DB.managementReviews||[]).flatMap(r=>(r.decisions||[]).map(d=>({ refKind:"decision", refId:r.id+"/"+d.id, title:d.decision, subtitle:"Revue — "+r.periodLabel })));
    case "formation":
      return (DB.trainings||[]).map(t=>({ refKind:"training", refId:t.id, title:t.title, subtitle:"Formation / prise de connaissance" }))
        .concat((DB.competences||[]).map(c=>({ refKind:"competence", refId:c.id, title:"Compétence — "+c.nom, subtitle:c.domaine||"" })));
    default: return [];
  }
}

/* Résout une preuve stockée en { title, subtitle, route, missing, meta } à partir de l'objet Qonnect vivant. */
function resolveEvidence(ev){
  const t = getEvidenceType(ev.type);
  const base = { title:ev.title||"(sans titre)", subtitle:"", route:null, missing:false, meta:{ source: ev.refKind ? "qonnect" : "manuel" } };
  if(!ev.refKind) return Object.assign(base, { subtitle: ev.url || ev.fileName || "" });
  let obj = null;
  switch(ev.refKind){
    case "document": obj = getDocument(ev.refId);
      if(obj) return { title:obj.title, subtitle:(LABELS.docType[obj.type]||obj.type)+" · "+obj.ref+" · v"+obj.version, route:`documents/${obj.type}/${obj.id}`, missing:false,
        meta:{ source:"qonnect", docType:obj.type, docTypeLabel:LABELS.docType[obj.type]||obj.type, docStatus:obj.status, processId:obj.processId, date:obj.date, bodyExcerpt:String(obj.body||"").slice(0,400) } };
      break;
    case "process": obj = getProcess(ev.refId);
      if(obj) return { title:"Processus — "+obj.name, subtitle:"Pilote : "+obj.pilot, route:`processus/${obj.id}`, missing:false, meta:{ source:"qonnect", docTypeLabel:"Processus", processId:obj.id, bodyExcerpt:String(obj.purpose||"").slice(0,400) } };
      break;
    case "indicator": obj = getIndicator(ev.refId);
      if(obj) return { title:obj.name, subtitle:"Valeur : "+obj.value, route:"objectifs", missing:false, meta:{ source:"qonnect", docTypeLabel:"Indicateur", processId:obj.processId } };
      break;
    case "action": obj = getAction(ev.refId);
      if(obj) return { title:obj.title, subtitle:"Responsable : "+obj.owner, route:"actions", missing:false, meta:{ source:"qonnect", docTypeLabel:"Action", processId:obj.processId } };
      break;
    case "risk": obj = getRisk(ev.refId);
      if(obj) return { title:obj.name, subtitle:obj.type==="opportunite"?"Opportunité":"Risque", route:`risques/${obj.id}`, missing:false, meta:{ source:"qonnect", docTypeLabel:"Risque", processId:obj.processId, bodyExcerpt:String(obj.description||"").slice(0,400) } };
      break;
    case "review": obj = getReview(ev.refId);
      if(obj) return { title:"Revue de direction — "+obj.periodLabel, subtitle:"Réunion du "+fmtDate(obj.reviewDate), route:`revue-direction/${obj.id}`, missing:false, meta:{ source:"qonnect", docTypeLabel:"Réunion compte rendu revue de direction" } };
      break;
    case "decision": {
      const [rid, did] = String(ev.refId).split("/"); const rv = getReview(rid); obj = rv && (rv.decisions||[]).find(d=>d.id===did);
      if(obj) return { title:obj.decision, subtitle:"Revue — "+rv.periodLabel, route:`revue-direction/${rv.id}`, missing:false, meta:{ source:"qonnect", docTypeLabel:"Décision", bodyExcerpt:String((obj.contexte||"")+" "+(obj.justification||"")).slice(0,400) } };
      break; }
    case "training": obj = (DB.trainings||[]).find(x=>x.id===ev.refId);
      if(obj) return { title:obj.title, subtitle:"Formation / prise de connaissance", route:null, missing:false, meta:{ source:"qonnect", docTypeLabel:"Formation" } };
      break;
    case "competence": obj = getCompetence(ev.refId);
      if(obj) return { title:"Compétence — "+obj.nom, subtitle:obj.domaine||"", route:`competences/referentiel/${obj.id}`, missing:false, meta:{ source:"qonnect", docTypeLabel:"Compétence formation", bodyExcerpt:String(obj.description||"").slice(0,400) } };
      break;
  }
  /* L'objet référencé n'existe plus : on garde le titre mémorisé pour ne pas perdre la trace. */
  return Object.assign(base, { missing:true, subtitle:"Élément introuvable dans Qonnect (supprimé ou renommé)", meta:{ source:"qonnect" } });
}

/* Exigence enrichie : référentiel, synthèse, attendus. Générique : ne dépend d'aucun référentiel particulier. */
function resolveExigenceFull(requirementId){
  const base = resolveExigence(requirementId);
  if(!base) return null;
  const ref = getReferentiel(base.referentielId);
  const legacy = findBy(DB.requirements, requirementId);
  const custom = legacy ? null : getCustomExigence(requirementId);
  const src = legacy || custom || {};
  return { id:requirementId, ref:base.ref, title:legacy ? legacy.label : (custom ? custom.title : base.label), label:base.label,
    referentielId:base.referentielId, referentielName: ref ? ref.name : base.referentielId,
    summary: src.synthese || "", attendus: Array.isArray(src.attendus) ? src.attendus : [] };
}

/* Entrée complète de l'analyse (cf. cahier des charges, §10). */
function buildAnalysisInput(audit, q){
  const exF = q.requirementId ? resolveExigenceFull(q.requirementId) : null;
  const proc = getProcess(q.processId);
  let attendus = exF ? exF.attendus : [];
  let source = attendus.length ? "exigence" : "aucun";
  if(!attendus.length && (q.preuveAttendue||"").trim()){
    attendus = [{ id:"PA", label:q.preuveAttendue.trim(), keywords:keywordStems(q.preuveAttendue), evidenceTypes:[], suggestion:q.preuveAttendue.trim() }];
    source = "preuve_attendue";
  }
  return {
    schemaVersion:1,
    referentiel: exF ? { id:exF.referentielId, name:exF.referentielName } : null,
    exigence: { id:exF?exF.id:null, ref:exF?exF.ref:(q.critere||""), title:exF?exF.title:"", summary:exF?exF.summary:"", attendus, attendusSource:source },
    question: { id:q.id, text:q.question, processId:q.processId||null, processName:proc?proc.name:"", critere:q.critere||"", preuveAttendue:q.preuveAttendue||"", responsableInterroge:q.responsableInterroge||"" },
    pratique: q.pratique||"",
    preuves: (q.preuves||[]).map(ev=>{ const r = resolveEvidence(ev);
      return { id:ev.id, type:ev.type, typeLabel:getEvidenceType(ev.type).label, refKind:ev.refKind||null, refId:ev.refId||null,
        title:r.title, description:ev.description||"", url:ev.url||"", fileName:ev.fileName||"", meta:r.meta }; }),
    context: { auditId:audit.id, auditRef:audit.ref||audit.id, auditTitle:audit.title, auditDate:audit.date },
  };
}

/* État de l'analyse d'une question : "none" | "fresh" | "stale" (éléments modifiés depuis l'analyse). */
function getAnalysisState(audit, q){
  if(!q.analyse) return "none";
  return q.analyse.signature === analysisSignature(buildAnalysisInput(audit, q)) ? "fresh" : "stale";
}

/* Journal de traçabilité de la question. */
function logQuestionEvent(q, action, detail){
  q.historique = q.historique || [];
  q.historique.push({ at:new Date().toISOString(), by:currentActor(), action, detail:detail||"" });
}

/* Lance l'analyse (asynchrone pour accepter un moteur IA). Enregistre le résultat sur la question, sans toucher au statut final. */
async function runQuestionAnalysis(auditId, questionId){
  const audit = getAudit(auditId);
  const q = audit && findBy(audit.questions, questionId);
  if(!q) throw new Error("Question introuvable.");
  const engine = getActiveAnalysisEngine();
  const input = buildAnalysisInput(audit, q);
  const raw = await engine.analyze(input);
  const result = normalizeAnalysisResult(raw);
  if(engine.kind==="rules" && !ANALYSIS_ALLOWED_PROPOSALS.includes(result.proposedStatus))
    throw new Error("Le moteur à règles ne peut proposer que : conforme, partiellement conforme ou à vérifier.");
  q.analyse = {
    engine:{ id:engine.id, label:engine.label, kind:engine.kind, isAI:!!engine.isAI, version:engine.version, disclaimer:engine.disclaimer||"" },
    analyzedAt:new Date().toISOString(), analyzedBy:currentActor(),
    signature:analysisSignature(input),
    evidenceIds:(q.preuves||[]).map(p=>p.id),
    result,
  };
  logQuestionEvent(q, "analyse", "Analyse "+engine.label+" — proposition : "+(LABELS.questionStatus[result.proposedStatus]||{l:result.proposedStatus}).l);
  saveDB();
  return q.analyse;
}

/* Index inverse : où une même preuve Qonnect est-elle utilisée ? (réutilisation sans duplication + traçabilité globale) */
function getEvidenceUsages(refKind, refId){
  const out = [];
  DB.audits.forEach(a=>{
    (a.questions||[]).forEach((q,i)=>{
      (q.preuves||[]).forEach(ev=>{
        if(ev.refKind===refKind && ev.refId===refId){
          const ex = q.requirementId ? resolveExigence(q.requirementId) : null;
          out.push({ auditId:a.id, auditTitle:a.title, auditRef:a.ref||a.id, questionId:q.id, questionIndex:i, requirementRef:ex?ex.ref:(q.critere||""), requirementLabel:ex?ex.label:"" });
        }
      });
    });
  });
  return out;
}

/* Fabrique une preuve (référence ou saisie libre). L'identifiant est unique au sein de la question. */
function makeEvidence(fields){
  return Object.assign({ id:"EV-"+Math.random().toString(36).slice(2,8), type:"document_qonnect", refKind:null, refId:null, title:"", description:"", url:"", fileName:"", fileSize:null,
    addedAt:new Date().toISOString(), addedBy:currentActor() }, fields);
}
/* Maintient preuveIds (compatibilité) = documents Qonnect référencés. */
function syncQuestionPreuveIds(q){
  q.preuveIds = (q.preuves||[]).filter(e=>e.refKind==="document").map(e=>e.refId).filter((v,i,a)=>a.indexOf(v)===i);
}

/* Fabrique une question d'audit complète (nouveau parcours). Toutes les créations de question passent par ici. */
function newAuditQuestion(fields){
  return Object.assign({ id:"Q-"+Math.random().toString(36).slice(2,8), question:"", requirementId:null, processId:null, critere:"", preuveAttendue:"", responsableInterroge:"",
    statut:"non_evalue", commentaire:"", pratique:"", preuveIds:[], preuves:[], analyse:null, decision:null, historique:[] }, fields);
}
