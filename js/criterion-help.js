/* ============================================================
   QONNECT — Aide à la compréhension et à l'application d'un critère / d'une exigence
   ------------------------------------------------------------
   Génère, À PARTIR DE L'INTITULÉ du critère, une aide en langage courant :
   en clair · comment l'appliquer · preuves possibles · questions à se poser.

   Principes
   - Aide INDICATIVE, produite par des règles (mots-clés de l'intitulé) : ce n'est pas de l'IA, ce n'est pas le texte
     officiel du référentiel, et cela ne remplace ni le référentiel ni le jugement de l'auditeur. L'interface le dit.
   - Générique : aucun référentiel particulier n'est codé ici (HAS, ISO, interne… fonctionnent de la même façon).
   - Fonctions pures (testables sans navigateur), sauf criterionHelpHtml() qui construit du HTML.
   ============================================================ */

function chNorm(s){ return String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’‘`]/g,"'"); }

/* Qui est le sujet du critère ? Détermine la façon de le vérifier. */
const CRITERION_SUBJECTS = [
  { id:"personne", re:/^(?:la|les|le)\s+(?:personnes?|patients?|usagers?|r[ée]sidents?|b[ée]n[ée]ficiaires?|enfants?|jeunes?)\b/,
    plain:"Ce critère est vu du côté de la personne accompagnée : elle doit pouvoir constater, dans son quotidien, que c'est le cas.",
    how:["Entretien avec des personnes accompagnées ou leur entourage", "Observation de ce qui se passe réellement sur le terrain"] },
  { id:"professionnels", re:/^(?:les?|des)\s+(?:professionnels?|[ée]quipes?|intervenants?|salari[ée]s?|soignants?|personnels?|agents?)\b/,
    plain:"Ce critère porte sur les pratiques des professionnels : ce qu'ils font réellement, pas seulement ce qui est écrit.",
    how:["Entretien avec des professionnels", "Observation des pratiques", "Consultation des documents qu'ils utilisent"] },
  { id:"organisation", re:/^(?:l'|la|le)\s*(?:[ée]tablissement|service|structure|organisme|organisation|direction|gouvernance|gestionnaire)\b/,
    plain:"Ce critère porte sur l'organisation : ce que la structure met en place, décide et pilote.",
    how:["Documents de pilotage (politique, plan, procédures)", "Entretien avec la direction ou l'encadrement"] },
];

/* Thèmes reconnus dans l'intitulé : chaque thème apporte conseils, preuves et questions. */
const CRITERION_THEMES = [
  { id:"information", re:/inform|expliqu|communiqu|transmet|connaissance|comprend|compr[ée]hension|livret|affich/,
    comprendre:"Il ne suffit pas que l'information existe : elle doit être donnée à la bonne personne, sous une forme adaptée, et sa compréhension doit être vérifiée.",
    appliquer:["Décrire qui informe, à quel moment et par quel moyen (oral, écrit, supports adaptés).","Prévoir comment on s'assure que l'information a été comprise.","Garder une trace de l'information donnée (dossier, fiche de remise, compte rendu)."],
    preuves:["Supports d'information remis (livret, fiche, affichage)","Trace dans le dossier de la personne","Entretien avec des personnes accompagnées"],
    questions:["Comment et à quel moment la personne est-elle informée ?","Comment vérifiez-vous qu'elle a compris ?","Où cette information est-elle tracée ?"] },
  { id:"expression", re:/exprim|avis|choix|souhait|attente|besoin|associ|particip|co-?construi|consult|enqu[eê]te|satisf|perception|vécu|preferenc|pr[ée]f[ée]renc/,
    comprendre:"L'avis des personnes doit être recueilli de façon régulière, pris en compte dans les décisions, et la personne doit savoir ce qu'il en a été fait.",
    appliquer:["Décrire comment l'avis est recueilli (outils, fréquence, qui le recueille).","Décrire comment il est examiné et pris en compte (instance, décision, plan d'action).","Prévoir un retour vers les personnes sur la suite donnée."],
    preuves:["Questionnaires, comptes rendus d'instances ou de réunions avec les personnes","Décisions ou plans d'actions issus de leurs avis","Entretien avec des personnes accompagnées"],
    questions:["Comment recueillez-vous l'avis des personnes, et à quelle fréquence ?","Pouvez-vous citer une décision qui a changé à la suite de leur avis ?","Comment leur faites-vous un retour ?"] },
  { id:"droits", re:/droit|libert|dignit|intimit|confidential|respect|priv[ée]|personne de confiance|consentement|directives|bientraitance|maltraitance/,
    comprendre:"Les droits et libertés doivent être connus, respectés et exercables concrètement ; les écarts doivent pouvoir être signalés et traités.",
    appliquer:["Décrire les règles ou chartes qui garantissent ces droits, et comment les professionnels les appliquent.","Décrire comment la personne peut exercer ses droits ou signaler un problème.","Prévoir le traitement des signalements et des réclamations."],
    preuves:["Charte, règlement, procédure ou protocole applicable","Registre des réclamations / signalements et leur traitement","Observation et entretien montrant la pratique réelle"],
    questions:["Comment ce droit est-il garanti concrètement au quotidien ?","Que se passe-t-il si une personne estime qu'il n'est pas respecté ?","Comment les professionnels connaissent-ils cette règle ?"] },
  { id:"competences", re:/sensibilis|form[ée]s?\b|formation|comp[ée]tence|habilit|qualifi|int[ée]gration/,
    comprendre:"Les professionnels doivent avoir les connaissances nécessaires, et l'organisation doit pouvoir le montrer.",
    appliquer:["Identifier les connaissances attendues pour ce sujet.","Planifier les formations ou sensibilisations, et les renouveler.","Conserver les preuves de participation et vérifier l'effet de la formation."],
    preuves:["Plan de formation, attestations, feuilles d'émargement","Matrice des compétences ou des habilitations","Entretien avec des professionnels"],
    questions:["Qui a été formé ou sensibilisé, et quand ?","Comment vérifiez-vous que la formation est utile en pratique ?","Comment les nouveaux arrivants sont-ils concernés ?"] },
  { id:"organisation", re:/r[eè]gle|r[eè]glement|fonctionnement|organis|proc[ée]dure|protocole|modalit|dispositif|cadre|planifi|coordin|pilot/,
    comprendre:"Le fonctionnement doit être défini (qui fait quoi, comment), connu des personnes concernées et réellement appliqué.",
    appliquer:["Formaliser la règle ou la procédure (qui, quoi, quand, comment).","S'assurer que les personnes concernées la connaissent et l'appliquent.","Revoir régulièrement la règle et conserver les versions en vigueur."],
    preuves:["Procédure, protocole ou règlement en vigueur","Enregistrements montrant son application","Compte rendu de revue ou de mise à jour"],
    questions:["Où cette règle est-elle formalisée, et qui la connaît ?","Pouvez-vous montrer un exemple récent d'application ?","Quand a-t-elle été revue pour la dernière fois ?"] },
  { id:"evaluation", re:/[ée]valu|am[ée]lior|analys|suivi|indicateur|r[ée]vis|mesur|tableau de bord/,
    comprendre:"Il faut mesurer ou examiner régulièrement ce qui est fait, en tirer des décisions et suivre leur mise en œuvre.",
    appliquer:["Définir ce qui est suivi (indicateurs, constats) et à quelle fréquence.","Analyser les résultats et décider des actions.","Suivre les actions jusqu'à leur clôture et vérifier leur efficacité."],
    preuves:["Indicateurs et tableau de bord","Comptes rendus d'analyse ou de revue","Plan d'actions et son suivi"],
    questions:["Qu'est-ce qui est suivi, et à quel rythme ?","Quelle décision a été prise grâce à ce suivi ?","Comment savez-vous que l'action a été efficace ?"] },
];

const CRITERION_DEFAULT = {
  comprendre:"Ce critère décrit une pratique attendue : l'organisation doit pouvoir expliquer ce qu'elle fait et le démontrer.",
  appliquer:["Décrire concrètement comment l'activité est réalisée (qui, quand, comment).","Rassembler les documents, enregistrements ou constats qui le démontrent.","Vérifier que la pratique décrite correspond à ce qui est vraiment fait."],
  preuves:["Procédure ou document de référence","Enregistrement montrant l'application","Entretien ou observation sur le terrain"],
  questions:["Comment cette exigence est-elle mise en œuvre ?","Comment pouvez-vous le démontrer ?","Que se passe-t-il quand ce n'est pas le cas ?"],
};

function chUnique(list, max){ const out=[]; list.forEach(x=>{ if(x && !out.includes(x)) out.push(x); }); return out.slice(0,max); }

/* Retourne { subject, plain, comprendre, appliquer[], preuves[], questions[], themes[] } pour un intitulé de critère. */
function buildCriterionHelp(text){
  const raw = String(text||"").replace(/\s+/g," ").trim();
  const n = chNorm(raw);
  const subject = CRITERION_SUBJECTS.find(s=>s.re.test(n)) || null;
  const themes = CRITERION_THEMES.filter(t=>t.re.test(n)).slice(0,2);
  const src = themes.length ? themes : [CRITERION_DEFAULT];
  const comprendre = src.map(t=>t.comprendre).join(" ");
  return {
    subject: subject ? subject.id : null,
    plain: subject ? subject.plain : "",
    comprendre,
    appliquer: chUnique(src.flatMap(t=>t.appliquer), 5),
    preuves: chUnique(src.flatMap(t=>t.preuves).concat(subject?subject.how:[]), 6),
    questions: chUnique(src.flatMap(t=>t.questions), 4),
    themes: themes.map(t=>t.id),
  };
}

/* Carte HTML « Aide à la compréhension et à l'application ». `open` : déplier par défaut. */
function criterionHelpHtml(text, opts){
  opts = opts || {};
  if(!String(text||"").trim()) return "";
  const h = buildCriterionHelp(text);
  const ul = (items)=>`<ul style="margin:6px 0 0 18px;padding:0;font-size:13px;">${items.map(x=>`<li style="margin:3px 0;">${esc(x)}</li>`).join("")}</ul>`;
  return `
  <details class="aq-details" ${opts.open?"open":""}>
    <summary>💡 Aide à la compréhension et à l'application</summary>
    <div class="mt-2">
      ${h.plain?`<p class="text-sm" style="color:var(--text-primary);">${esc(h.plain)}</p>`:""}
      <div class="aq-fact mt-2"><div class="k">À comprendre</div><div class="v">${esc(h.comprendre)}</div></div>
      <div class="aq-fact mt-2"><div class="k">Comment l'appliquer</div>${ul(h.appliquer)}</div>
      <div class="aq-fact mt-2"><div class="k">Preuves possibles</div>${ul(h.preuves)}</div>
      <div class="aq-fact mt-2"><div class="k">Questions à se poser</div>${ul(h.questions)}</div>
      <p class="text-xs mt-2">Aide indicative générée par des règles à partir de l'intitulé du critère : ce n'est ni de l'intelligence artificielle, ni le texte officiel du référentiel. Elle ne remplace pas le référentiel ni le jugement de l'auditeur.</p>
    </div>
  </details>`;
}
