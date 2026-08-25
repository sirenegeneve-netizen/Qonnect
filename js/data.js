/* ============================================================
   QONNECT — Jeu de données fictif interconnecté
   Toutes les entités sont reliées par des identifiants.
   ============================================================ */

const QONNECT_SEED = {

  /* ---------- Contexte & Stratégie ---------- */
  contextExternal: [
    { id:"ISS-EXT-001", title:"Réglementation", description:"Évolution des exigences réglementaires applicables à notre secteur.", impact:"Peut imposer de nouvelles obligations de conformité.", importance:"haute" },
    { id:"ISS-EXT-002", title:"Disponibilité des fournisseurs", description:"Dépendance à certains fournisseurs stratégiques.", impact:"Risque de rupture d'approvisionnement.", importance:"haute" },
    { id:"ISS-EXT-003", title:"Pénurie de main-d'œuvre", description:"Difficulté à recruter des profils qualifiés sur certains métiers.", impact:"Risque de dégradation de la qualité et des délais.", importance:"haute" },
    { id:"ISS-EXT-004", title:"Cybersécurité", description:"Multiplication des cybermenaces visant les systèmes d'information.", impact:"Risque d'indisponibilité ou de perte de données.", importance:"moyenne" },
  ],
  contextInternal: [
    { id:"ISS-INT-001", title:"Compétences", description:"Certaines compétences critiques reposent sur un nombre limité de personnes.", impact:"Risque de perte de savoir-faire.", importance:"haute" },
    { id:"ISS-INT-002", title:"Système d'information", description:"Vieillissement de certains outils internes.", impact:"Peut freiner la performance et la sécurité.", importance:"moyenne" },
  ],
  stakeholders: [
    { id:"PI-001", name:"Clients", category:"client", importance:"haute", influence:"haute",
      needs:[ {id:"NB-001", text:"Qualité constante des produits/services", type:"besoin"}, {id:"NB-002", text:"Respect des délais", type:"attente"}, {id:"NB-003", text:"Support réactif", type:"attente"} ] },
    { id:"PI-002", name:"Collaborateurs", category:"collaborateur", importance:"haute", influence:"moyenne",
      needs:[ {id:"NB-004", text:"Conditions de travail adaptées", type:"attente"}, {id:"NB-005", text:"Outils adaptés", type:"besoin"} ] },
    { id:"PI-003", name:"Fournisseurs", category:"fournisseur", importance:"moyenne", influence:"moyenne", needs:[ {id:"NB-006", text:"Visibilité sur les volumes", type:"attente"} ] },
    { id:"PI-004", name:"Autorités", category:"autorite", importance:"haute", influence:"haute", needs:[ {id:"NB-007", text:"Conformité réglementaire", type:"exigence"} ] },
  ],
  climate: { q1:true, q2:false, q3:true, q4:false, q5:false, criticality:"moyenne", evaluated:true },
  orientations: [
    { id:"ORI-001", title:"Améliorer la satisfaction client", description:"Renforcer l'écoute client et réduire les réclamations.", responsible:"Nadia Amrani", due:"2027-01-01", priority:"haute" },
    { id:"ORI-002", title:"Sécuriser le système d'information", description:"Renforcer la sécurité et la disponibilité du SI.", responsible:"Karim Belkacem", due:"2027-06-01", priority:"haute" },
  ],

  processes: [
    { id:"PROC-001", name:"Direction",            group:"management",   pilot:"Claire Dubreuil", purpose:"Définir la stratégie, la politique qualité et les objectifs de l'organisation, et en assurer le pilotage.", icon:"🧭" },
    { id:"PROC-002", name:"Qualité & amélioration",group:"management",   pilot:"Marc Lenoir",     purpose:"Animer le système de management de la qualité et piloter l'amélioration continue.", icon:"✅" },
    { id:"PROC-003", name:"Commercial",            group:"operationnel", pilot:"Julie Farge",     purpose:"Développer le portefeuille clients et garantir la conformité des offres commerciales.", icon:"📈" },
    { id:"PROC-004", name:"Production",            group:"operationnel", pilot:"Thomas Petit",    purpose:"Fabriquer les produits conformément aux exigences clients et réglementaires.", icon:"⚙️" },
    { id:"PROC-005", name:"Relation client",       group:"operationnel", pilot:"Nadia Amrani",    purpose:"Assurer la satisfaction client et le traitement des réclamations.", icon:"💬" },
    { id:"PROC-006", name:"RH",                    group:"support",      pilot:"Paul Rousseau",   purpose:"Garantir les compétences, la formation et le bien-être des collaborateurs.", icon:"👥" },
    { id:"PROC-007", name:"Achats",                group:"support",      pilot:"Sophie Martin",   purpose:"Garantir la disponibilité et la conformité des produits et services achetés.", icon:"🛒" },
    { id:"PROC-008", name:"Informatique",          group:"support",      pilot:"Karim Belkacem",  purpose:"Garantir la disponibilité, la sécurité et la performance du système d'information.", icon:"💻" },
    { id:"PROC-009", name:"Finance",               group:"support",      pilot:"Elise Vasseur",   purpose:"Garantir la fiabilité des données financières et la maîtrise des coûts.", icon:"💰" },
  ],

  documents: [
    { id:"DOC-POL-001", ref:"POL-001", title:"Politique qualité", type:"politique", version:"2.0", status:"en_vigueur", processId:"PROC-001", author:"Claire Dubreuil", approver:"Direction générale", date:"2026-01-10", nextReview:"2027-01-10",
      body:"Notre organisation s'engage à satisfaire ses clients, à respecter les exigences réglementaires et à améliorer en continu son système de management de la qualité." },
    { id:"DOC-CHA-001", ref:"CHA-001", title:"Charte qualité", type:"charte", version:"1.0", status:"en_vigueur", processId:"PROC-001", author:"Claire Dubreuil", approver:"Direction générale", date:"2025-03-01", nextReview:"2028-03-01",
      body:"Nos valeurs : orientation client, rigueur, transparence, amélioration continue et implication de chacun dans la qualité." },
    { id:"DOC-MAN-001", ref:"MAN-001", title:"Manuel qualité", type:"manuel", version:"4.1", status:"en_vigueur", processId:"PROC-002", author:"Marc Lenoir", approver:"Direction générale", date:"2026-02-15", nextReview:"2027-02-15",
      body:"Ce manuel décrit l'organisation du système de management de la qualité, la cartographie des processus et leurs interactions." },

    { id:"DOC-PROC-ACH", ref:"PR-ACH-001", title:"Processus Achats", type:"processus", version:"2.0", status:"en_vigueur", processId:"PROC-007", author:"Sophie Martin", approver:"Marc Lenoir", date:"2025-09-01", nextReview:"2027-09-01", body:"Fiche descriptive du processus Achats : finalité, données d'entrée/sortie, indicateurs." },
    { id:"DOC-PROC-PRD", ref:"PR-PRD-001", title:"Processus Production", type:"processus", version:"3.2", status:"en_vigueur", processId:"PROC-004", author:"Thomas Petit", approver:"Marc Lenoir", date:"2026-01-20", nextReview:"2027-01-20", body:"Fiche descriptive du processus Production." },

    { id:"DOC-004", ref:"PR-004", title:"Gestion des non-conformités", type:"procedure", version:"3.0", status:"en_vigueur", processId:"PROC-002", author:"Marc Lenoir", approver:"Claire Dubreuil", date:"2026-08-15", nextReview:"2027-08-15",
      body:"Objet : décrire le traitement des non-conformités depuis la déclaration jusqu'à la clôture. Champ d'application : tous les processus.",
      requirementIds:["REQ-017","REQ-009"], riskIds:["RISK-001"], auditIds:["AUD-002"], indicatorIds:["IND-007"], actionIds:["ACT-002","ACT-013"], crossDocIds:["DOC-013","DOC-016"], flowSteps:["Déclaration","Qualification","Analyse","Action","Vérification","Clôture"] },
    { id:"DOC-005", ref:"PR-005", title:"Gestion des achats et évaluation fournisseurs", type:"procedure", version:"2.1", status:"en_vigueur", processId:"PROC-007", author:"Sophie Martin", approver:"Marc Lenoir", date:"2025-11-03", nextReview:"2026-11-03",
      body:"Objet : décrire le processus de sélection, d'évaluation et de suivi des fournisseurs.",
      requirementIds:["REQ-011","REQ-018"], riskIds:["RISK-001"], auditIds:["AUD-001"], indicatorIds:["IND-006"], actionIds:["ACT-001","ACT-011"], crossDocIds:["DOC-014","DOC-010"], flowSteps:[] },
    { id:"DOC-006", ref:"PR-006", title:"Gestion documentaire", type:"procedure", version:"1.4", status:"a_reviser", processId:"PROC-002", author:"Marc Lenoir", approver:"Claire Dubreuil", date:"2024-05-10", nextReview:"2026-09-05",
      body:"Objet : décrire les règles de création, validation, diffusion et archivage des documents du SMQ.",
      requirementIds:["REQ-009"], riskIds:[], auditIds:["AUD-002"], indicatorIds:["IND-004"], actionIds:["ACT-007"], crossDocIds:[], flowSteps:[] },
    { id:"DOC-007", ref:"PR-007", title:"Gestion des audits internes", type:"procedure", version:"2.0", status:"en_vigueur", processId:"PROC-002", author:"Marc Lenoir", approver:"Claire Dubreuil", date:"2026-03-01", nextReview:"2027-03-01",
      body:"Objet : planifier, réaliser et suivre les audits internes du système de management.",
      requirementIds:["REQ-015"], riskIds:[], auditIds:["AUD-001","AUD-002","AUD-003","AUD-004"], indicatorIds:[], actionIds:[], crossDocIds:["DOC-015"], flowSteps:[] },
    { id:"DOC-008", ref:"PR-008", title:"Gestion des compétences", type:"procedure", version:"1.2", status:"en_vigueur", processId:"PROC-006", author:"Paul Rousseau", approver:"Marc Lenoir", date:"2025-06-12", nextReview:"2026-06-12",
      body:"Objet : identifier, développer et maintenir les compétences nécessaires aux activités.",
      requirementIds:["REQ-008"], riskIds:["RISK-002"], auditIds:[], indicatorIds:[], actionIds:["ACT-005"], crossDocIds:[], flowSteps:[] },
    { id:"DOC-009", ref:"PR-009", title:"Gestion des changements", type:"procedure", version:"1.0", status:"en_vigueur", processId:"PROC-002", author:"Marc Lenoir", approver:"Claire Dubreuil", date:"2026-04-18", nextReview:"2027-04-18",
      body:"Objet : maîtriser les changements planifiés pouvant impacter le SMQ.",
      requirementIds:[], riskIds:[], auditIds:[], indicatorIds:[], actionIds:[], crossDocIds:[], flowSteps:["Déclaré","Analyse d'impact","Risques","Plan d'action","Mise en œuvre","Vérification","Clôturé"] },

    { id:"DOC-010", ref:"MO-010", title:"Contrôle réception fournisseur", type:"mode_operatoire", version:"1.3", status:"en_vigueur", processId:"PROC-007", author:"Sophie Martin", approver:"Thomas Petit", date:"2025-10-01", nextReview:"2026-10-01",
      body:"Décrit les étapes de contrôle qualité à réception des livraisons fournisseurs." },
    { id:"DOC-011", ref:"MO-011", title:"Réglage ligne de production A", type:"mode_operatoire", version:"2.0", status:"en_vigueur", processId:"PROC-004", author:"Thomas Petit", approver:"Thomas Petit", date:"2026-02-01", nextReview:"2027-02-01",
      body:"Décrit le paramétrage standard de la ligne de production A." },
    { id:"DOC-012", ref:"MO-012", title:"Traitement d'une réclamation client", type:"mode_operatoire", version:"1.1", status:"a_reviser", processId:"PROC-005", author:"Nadia Amrani", approver:"Marc Lenoir", date:"2024-11-20", nextReview:"2026-08-30",
      body:"Décrit les étapes de prise en charge d'une réclamation client, de l'accueil à la clôture." },

    { id:"DOC-013", ref:"FO-013", title:"Formulaire de déclaration d'événement", type:"formulaire", version:"1.0", status:"en_vigueur", processId:"PROC-002", author:"Marc Lenoir", approver:"Marc Lenoir", date:"2026-01-05", nextReview:"2028-01-05", body:"Support de saisie standard pour la déclaration d'un événement qualité." },
    { id:"DOC-014", ref:"FO-014", title:"Formulaire d'évaluation fournisseur", type:"formulaire", version:"2.0", status:"en_vigueur", processId:"PROC-007", author:"Sophie Martin", approver:"Marc Lenoir", date:"2025-09-15", nextReview:"2027-09-15", body:"Grille d'évaluation annuelle des fournisseurs référencés." },
    { id:"DOC-015", ref:"FO-015", title:"Formulaire de plan d'audit", type:"formulaire", version:"1.0", status:"en_vigueur", processId:"PROC-002", author:"Marc Lenoir", approver:"Marc Lenoir", date:"2026-03-01", nextReview:"2028-03-01", body:"Modèle de plan d'audit interne." },

    { id:"DOC-016", ref:"EN-016", title:"Registre des non-conformités 2026", type:"enregistrement", version:"—", status:"en_vigueur", processId:"PROC-002", author:"Marc Lenoir", approver:"—", date:"2026-01-01", nextReview:"—", body:"Enregistrement vivant recensant les non-conformités de l'année." },
    { id:"DOC-017", ref:"EN-017", title:"Compte-rendu revue de direction S1 2026", type:"enregistrement", version:"1.0", status:"en_vigueur", processId:"PROC-001", author:"Claire Dubreuil", approver:"Claire Dubreuil", date:"2026-06-30", nextReview:"—", body:"Compte-rendu de la revue de direction du premier semestre 2026." },

    { id:"DOC-018", ref:"PR-018", title:"Ancienne procédure de gestion des réclamations", type:"procedure", version:"1.0", status:"obsolete", processId:"PROC-005", author:"Nadia Amrani", approver:"Marc Lenoir", date:"2022-04-01", nextReview:"—", body:"Document remplacé par MO-012." },
  ],

  documentTemplates: [
    { id:"TPL-001", title:"Gestion documentaire", referentiel:"ISO 9001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Description du processus","Enregistrements associés","Risques associés","Indicateurs associés","Références normatives","Historique des versions"] },
    { id:"TPL-002", title:"Audit interne", referentiel:"ISO 9001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Programme et critères d'audit","Réalisation de l'audit","Constats et rapport","Suivi des actions","Enregistrements associés","Références normatives"] },
    { id:"TPL-003", title:"Gestion des non-conformités", referentiel:"ISO 9001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Déclaration et qualification","Analyse des causes","Traitement et vérification","Clôture","Enregistrements associés","Indicateurs associés"] },
    { id:"TPL-004", title:"Gestion des risques et opportunités", referentiel:"ISO 9001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Identification des risques","Évaluation et cotation","Plan de maîtrise","Suivi et revue","Enregistrements associés","Références normatives"] },
    { id:"TPL-005", title:"Revue de direction", referentiel:"ISO 9001", forType:"procedure", sections:["Objet","Domaine d'application","Responsabilités","Données d'entrée","Déroulement de la revue","Décisions et actions","Enregistrements associés","Références normatives"] },
    { id:"TPL-006", title:"Gestion des compétences", referentiel:"ISO 9001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Identification des besoins","Plan de formation","Évaluation de l'efficacité","Enregistrements associés"] },
    { id:"TPL-007", title:"Gestion des fournisseurs", referentiel:"ISO 9001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Sélection et qualification","Évaluation périodique","Traitement des non-conformités fournisseurs","Enregistrements associés"] },
    { id:"TPL-008", title:"CAPA", referentiel:"ISO 13485", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Ouverture de la CAPA","Analyse de cause racine","Plan d'action correctif/préventif","Vérification d'efficacité","Enregistrements associés"] },
    { id:"TPL-009", title:"Gestion des risques produit", referentiel:"ISO 13485", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Analyse de risque produit","Mesures de maîtrise","Revue post-production","Enregistrements associés"] },
    { id:"TPL-010", title:"Validation logicielle", referentiel:"ISO 13485", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Plan de validation","Protocoles de test","Rapport de validation","Enregistrements associés"] },
    { id:"TPL-011", title:"Vigilance / matériovigilance", referentiel:"ISO 13485", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Déclaration d'incident","Analyse et signalement","Actions correctives","Enregistrements associés"] },
    { id:"TPL-012", title:"Gestion des modifications", referentiel:"ISO 13485", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Analyse d'impact","Validation du changement","Mise en œuvre","Enregistrements associés"] },
    { id:"TPL-013", title:"Gestion des accès", referentiel:"ISO 27001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Attribution des droits","Revue périodique des accès","Révocation","Enregistrements associés"] },
    { id:"TPL-014", title:"Sauvegardes", referentiel:"ISO 27001", forType:"procedure", sections:["Objet","Domaine d'application","Responsabilités","Politique de sauvegarde","Fréquence et rétention","Tests de restauration","Enregistrements associés"] },
    { id:"TPL-015", title:"Gestion des incidents de sécurité", referentiel:"ISO 27001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Détection et déclaration","Analyse et confinement","Retour d'expérience","Enregistrements associés"] },
    { id:"TPL-016", title:"Sécurité des actifs", referentiel:"ISO 27001", forType:"procedure", sections:["Objet","Domaine d'application","Définitions","Responsabilités","Inventaire des actifs","Classification","Mesures de protection","Enregistrements associés"] },
  ],

  trainings: [
    { id:"TRN-001", documentId:"DOC-004", title:"Prise de connaissance — Gestion des non-conformités v3.0", audience:["Sophie Martin","Thomas Petit","Nadia Amrani","Marc Lenoir"], completedBy:["Marc Lenoir","Thomas Petit"], quiz:true, dueDate:"2026-09-15" },
    { id:"TRN-002", documentId:"DOC-005", title:"Prise de connaissance — Gestion des achats v2.1", audience:["Sophie Martin","Karim Belkacem"], completedBy:["Sophie Martin","Karim Belkacem"], quiz:false, dueDate:"2026-01-15" },
  ],

  documentHistory: {
    "DOC-004": [ {version:"3.0", date:"2026-08-15", note:"Ajout de l'étape de vérification d'efficacité"}, {version:"2.0", date:"2025-08-15", note:"Refonte du logigramme"}, {version:"1.0", date:"2023-02-10", note:"Création"} ],
    "DOC-006": [ {version:"1.4", date:"2024-05-10", note:"Mise à jour des rôles"}, {version:"1.0", date:"2022-01-05", note:"Création"} ],
  },

  risks: [
    { id:"RISK-001", name:"Dépendance à un fournisseur unique", level:"critique", processId:"PROC-007", owner:"Sophie Martin", status:"ouvert", type:"risque",
      description:"Un composant stratégique n'est disponible que chez un seul fournisseur, exposant l'organisation à une rupture d'approvisionnement.",
      probability:4, impact:5 },
    { id:"RISK-002", name:"Perte de compétence clé", level:"eleve", processId:"PROC-006", owner:"Paul Rousseau", status:"ouvert", type:"risque",
      description:"Le départ d'un expert technique pourrait fragiliser la continuité d'activité sur un procédé critique.",
      probability:3, impact:4 },
    { id:"RISK-003", name:"Retard ponctuel de livraison", level:"faible", processId:"PROC-004", owner:"Thomas Petit", status:"ouvert", type:"risque",
      description:"Aléas logistiques pouvant occasionner un retard mineur de livraison client.",
      probability:2, impact:2 },
    { id:"RISK-004", name:"Non-conformité réglementaire sur un nouveau marché", level:"eleve", processId:"PROC-003", owner:"Julie Farge", status:"ouvert", type:"risque",
      description:"L'ouverture à un nouveau marché expose à des exigences réglementaires non encore maîtrisées.",
      probability:3, impact:4 },
    { id:"RISK-005", name:"Cyberattaque sur le système d'information", level:"critique", processId:"PROC-008", owner:"Karim Belkacem", status:"ouvert", type:"risque",
      description:"Une intrusion informatique pourrait compromettre la disponibilité des données et des applications critiques.",
      probability:3, impact:5 },
    { id:"RISK-006", name:"Erreur de saisie comptable", level:"faible", processId:"PROC-009", owner:"Elise Vasseur", status:"maitrise", type:"risque",
      description:"Risque d'erreur lors de la saisie manuelle des écritures comptables.",
      probability:2, impact:2 },
    { id:"OPP-001", name:"Digitalisation du contrôle qualité", level:"opportunite", processId:"PROC-004", owner:"Thomas Petit", status:"ouvert", type:"opportunite",
      description:"L'automatisation des contrôles pourrait réduire les non-conformités et le temps de traitement.",
      probability:3, impact:3 },
  ],

  events: [
    { id:"EVT-001", ref:"NC-2026-014", type:"non_conformite", title:"Pièce non conforme détectée en contrôle réception", processId:"PROC-007", priority:"haute", status:"ouvert",
      declaredBy:"Sophie Martin", date:"2026-08-05", step:2,
      description:"Lot de 200 pièces réceptionné avec un défaut dimensionnel hors tolérance.", relatedRiskId:"RISK-001" },
    { id:"EVT-002", ref:"NC-2026-013", type:"non_conformite", title:"Écart de température constaté en production", processId:"PROC-004", priority:"critique", status:"ouvert",
      declaredBy:"Thomas Petit", date:"2026-08-10", step:3,
      description:"Dépassement de la plage de température autorisée sur la ligne A pendant 40 minutes." },
    { id:"EVT-003", ref:"NC-2026-012", type:"non_conformite", title:"Document périmé utilisé en atelier", processId:"PROC-004", priority:"moyenne", status:"cloture",
      declaredBy:"Thomas Petit", date:"2026-07-02", step:6,
      description:"Une version obsolète du mode opératoire MO-011 était affichée en poste de travail." },
    { id:"EVT-004", ref:"REC-2026-021", type:"reclamation", title:"Retard de livraison signalé par le client Orion SA", processId:"PROC-005", priority:"haute", status:"ouvert",
      declaredBy:"Nadia Amrani", date:"2026-08-12", step:2,
      description:"Le client Orion SA signale un retard de livraison de 5 jours sur la commande CMD-4521." },
    { id:"EVT-005", ref:"INC-2026-008", type:"incident", title:"Panne serveur applicatif", processId:"PROC-008", priority:"critique", status:"ouvert",
      declaredBy:"Karim Belkacem", date:"2026-08-14", step:1,
      description:"Indisponibilité de 45 minutes du serveur applicatif principal." },
    { id:"EVT-006", ref:"ANO-2026-005", type:"anomalie", title:"Écart d'inventaire constaté", processId:"PROC-007", priority:"basse", status:"ouvert",
      declaredBy:"Sophie Martin", date:"2026-08-01", step:1,
      description:"Écart de 3 unités constaté lors de l'inventaire tournant." },
    { id:"EVT-007", ref:"SUG-2026-011", type:"suggestion", title:"Proposition d'automatisation du contrôle visuel", processId:"PROC-004", priority:"basse", status:"ouvert",
      declaredBy:"Thomas Petit", date:"2026-07-20", step:1,
      description:"Suggestion d'intégrer une caméra de contrôle visuel automatisé en fin de ligne." },
    { id:"EVT-008", ref:"AME-2026-003", type:"amelioration", title:"Simplification du formulaire de réclamation", processId:"PROC-005", priority:"basse", status:"cloture",
      declaredBy:"Nadia Amrani", date:"2026-06-15", step:6,
      description:"Le formulaire de réclamation a été simplifié pour réduire le temps de saisie de 30%." },
  ],

  ncSteps: ["Déclaration","Qualification","Analyse","Action","Vérification","Clôture"],

  actions: [
    { id:"ACT-001", title:"Auditer le fournisseur unique et identifier une alternative", owner:"Sophie Martin", due:"2026-08-10", priority:"haute", status:"retard", origin:"risque", originId:"RISK-001", processId:"PROC-007" },
    { id:"ACT-002", title:"Trier et isoler le lot de pièces non conformes", owner:"Sophie Martin", due:"2026-08-22", priority:"haute", status:"en_cours", origin:"evenement", originId:"EVT-001", processId:"PROC-007" },
    { id:"ACT-003", title:"Vérifier l'étalonnage de la sonde de température", owner:"Thomas Petit", due:"2026-08-15", priority:"critique", status:"retard", origin:"evenement", originId:"EVT-002", processId:"PROC-004" },
    { id:"ACT-004", title:"Recontacter le client Orion SA avec un plan de rattrapage", owner:"Nadia Amrani", due:"2026-08-21", priority:"haute", status:"en_cours", origin:"evenement", originId:"EVT-004", processId:"PROC-005" },
    { id:"ACT-005", title:"Mettre en place un plan de succession sur le poste critique", owner:"Paul Rousseau", due:"2026-09-30", priority:"moyenne", status:"a_faire", origin:"risque", originId:"RISK-002", processId:"PROC-006" },
    { id:"ACT-006", title:"Déployer l'authentification multi-facteurs", owner:"Karim Belkacem", due:"2026-09-15", priority:"haute", status:"en_cours", origin:"risque", originId:"RISK-005", processId:"PROC-008" },
    { id:"ACT-007", title:"Réviser la procédure PR-006 Gestion documentaire", owner:"Marc Lenoir", due:"2026-09-05", priority:"moyenne", status:"a_faire", origin:"audit", originId:"AUD-002", processId:"PROC-002" },
    { id:"ACT-008", title:"Mettre à jour l'affichage des modes opératoires en atelier", owner:"Thomas Petit", due:"2026-07-10", priority:"basse", status:"termine", origin:"evenement", originId:"EVT-003", processId:"PROC-004" },
    { id:"ACT-009", title:"Former les équipes achats à la nouvelle grille fournisseurs", owner:"Sophie Martin", due:"2026-09-20", priority:"moyenne", status:"a_faire", origin:"objectif", originId:"OBJ-003", processId:"PROC-007" },
    { id:"ACT-010", title:"Analyser les causes racines de l'écart d'inventaire", owner:"Sophie Martin", due:"2026-08-25", priority:"basse", status:"a_faire", origin:"evenement", originId:"EVT-006", processId:"PROC-007" },
    { id:"ACT-011", title:"Qualifier un second fournisseur pour le composant stratégique", owner:"Sophie Martin", due:"2026-03-31", priority:"haute", status:"termine", origin:"revue_direction", originId:"RDDEC-001", processId:"PROC-007" },
    { id:"ACT-012", title:"Réaliser un audit de sécurité du système d'information", owner:"Karim Belkacem", due:"2026-05-31", priority:"critique", status:"retard", origin:"revue_direction", originId:"RDDEC-002", processId:"PROC-008" },
    { id:"ACT-013", title:"Renforcer le contrôle qualité en production", owner:"Thomas Petit", due:"2026-04-30", priority:"moyenne", status:"termine", origin:"revue_direction", originId:"RDDEC-003", processId:"PROC-004" },
    { id:"ACT-014", title:"Renforcer la compétence Audit interne de Marc Lenoir", owner:"Marc Lenoir", due:"2026-10-31", priority:"haute", status:"en_cours", origin:"competence", originId:"EVAL-004", processId:"PROC-002", personId:"P-002", competenceId:"COMP-004" },
    { id:"ACT-015", title:"Formaliser la cartographie des compétences critiques RH", owner:"Paul Rousseau", due:"2026-09-30", priority:"haute", status:"a_faire", origin:"competence", originId:"EVAL-006", processId:"PROC-006", personId:"P-006", competenceId:"COMP-010" },
    { id:"ACT-016", title:"Réaliser un renforcement cybersécurité pour Karim Belkacem", owner:"Karim Belkacem", due:"2026-10-15", priority:"critique", status:"a_faire", origin:"competence", originId:"EVAL-010", processId:"PROC-008", personId:"P-008", competenceId:"COMP-012" },
    { id:"ACT-017", title:"Rappel des consignes de sécurité au poste — Amina Cherif", owner:"Thomas Petit", due:"2026-06-15", priority:"haute", status:"termine", origin:"competence", originId:"EVAL-018", processId:"PROC-004", personId:"P-011", competenceId:"COMP-019", efficaciteVerifiee:true },
  ],

  objectives: [
    { id:"OBJ-001", title:"Réduire les réclamations clients", target:"-15 %", progress:72, status:"en_cours", processId:"PROC-005", indicatorIds:["IND-002"] },
    { id:"OBJ-002", title:"Maintenir la disponibilité du SI au-dessus de 99,5 %", target:"99,5 %", progress:88, status:"en_cours", processId:"PROC-008", indicatorIds:["IND-005"] },
    { id:"OBJ-003", title:"Sécuriser le panel fournisseurs stratégiques", target:"2 fournisseurs / famille critique", progress:40, status:"en_retard", processId:"PROC-007", indicatorIds:["IND-006"] },
    { id:"OBJ-004", title:"Maintenir la satisfaction client au-dessus de 90 %", target:"≥ 90 %", progress:94, status:"atteint", processId:"PROC-005", indicatorIds:["IND-001"] },
  ],

  indicators: [
    { id:"IND-001", name:"Satisfaction client", value:"94 %", trend:"+2", status:"vert", processId:"PROC-005", objectiveId:"OBJ-004" },
    { id:"IND-002", name:"Réclamations", value:"+8 %", trend:"+8", status:"rouge", processId:"PROC-005", objectiveId:"OBJ-001" },
    { id:"IND-003", name:"Actions dans les délais", value:"94 %", trend:"+1", status:"vert", processId:"PROC-002", objectiveId:null },
    { id:"IND-004", name:"Documents à jour", value:"97 %", trend:"0", status:"vert", processId:"PROC-002", objectiveId:null },
    { id:"IND-005", name:"Disponibilité du SI", value:"98,9 %", trend:"-0.4", status:"orange", processId:"PROC-008", objectiveId:"OBJ-002" },
    { id:"IND-006", name:"Fournisseurs à risque unique", value:"3", trend:"0", status:"orange", processId:"PROC-007", objectiveId:"OBJ-003" },
    { id:"IND-007", name:"Taux de non-conformités en production", value:"1,8 %", trend:"-0.3", status:"vert", processId:"PROC-004", objectiveId:null },
  ],

  audits: [
    { id:"AUD-001", ref:"AUD-2026-001", title:"Audit interne Achats", type:"interne", referentielIds:["ISO9001"],
      processId:"PROC-007", processIds:["PROC-007"], date:"2026-09-02", duration:"1 jour", responsable:"Marc Lenoir", auditeurs:["Marc Lenoir"], site:"Siège",
      objective:"Vérifier l'application de la procédure PR-005 et l'évaluation des fournisseurs.", scope:"Processus Achats — sélection et évaluation fournisseurs",
      auditor:"Marc Lenoir", status:"planifie",
      motifs:["programme_annuel","risque_identifie"],
      perimeter:{ processIds:["PROC-007"], activites:"Sélection et évaluation des fournisseurs", produits:"", periodeDebut:"2026-01-01", periodeFin:"2026-08-31", exclusions:"Achats hors production" },
      objectifs:["Vérifier l'application de la procédure PR-005", "Évaluer la maîtrise du risque fournisseur unique (RISK-001)"],
      criteres:{ referentielIds:["ISO9001"], requirementIds:["REQ-011","REQ-018"], documentIds:["DOC-005"] },
      questions:[
        { id:"AUD-001-Q1", question:"Comment les fournisseurs sont-ils sélectionnés et qualifiés ?", requirementId:"REQ-011", processId:"PROC-007", critere:"PR-005", preuveAttendue:"Grille de qualification fournisseurs", responsableInterroge:"Sophie Martin", statut:"non_evalue", commentaire:"", preuveIds:[] },
        { id:"AUD-001-Q2", question:"Comment la dépendance à un fournisseur unique est-elle maîtrisée ?", requirementId:"REQ-018", processId:"PROC-007", critere:"RISK-001", preuveAttendue:"Plan d'action de diversification", responsableInterroge:"Sophie Martin", statut:"non_evalue", commentaire:"", preuveIds:[] },
      ],
      parties:[ {name:"Sophie Martin", role:"Audité", questionIds:["AUD-001-Q1","AUD-001-Q2"], echeance:"2026-08-28", status:"en_attente"} ],
      findings:[] },
    { id:"AUD-002", ref:"AUD-2026-002", title:"Audit interne Système documentaire", type:"interne", referentielIds:["ISO9001"],
      processId:"PROC-002", processIds:["PROC-002"], date:"2026-06-10", duration:"0,5 jour", responsable:"Claire Dubreuil", auditeurs:["Claire Dubreuil"], site:"Siège",
      objective:"Vérifier la maîtrise documentaire et la mise à jour des procédures.", scope:"Gestion documentaire",
      auditor:"Claire Dubreuil", status:"valide",
      motifs:["programme_annuel"],
      perimeter:{ processIds:["PROC-002"], activites:"Gestion documentaire", produits:"", periodeDebut:"2025-12-01", periodeFin:"2026-06-01", exclusions:"" },
      objectifs:["Vérifier la maîtrise documentaire et la mise à jour des procédures"],
      criteres:{ referentielIds:["ISO9001"], requirementIds:["REQ-009"], documentIds:["DOC-006"] },
      questions:[
        { id:"AUD-002-Q1", question:"Les procédures sont-elles révisées dans les délais prévus ?", requirementId:"REQ-009", processId:"PROC-002", critere:"PR-006", preuveAttendue:"Registre de suivi des révisions", responsableInterroge:"Marc Lenoir", statut:"non_conforme", commentaire:"PR-006 est en retard de révision.", preuveIds:["DOC-006"] },
      ],
      parties:[ {name:"Marc Lenoir", role:"Audité", questionIds:["AUD-002-Q1"], echeance:"2026-06-08", status:"complete"} ],
      findings:[
        {id:"C-001", type:"ecart", text:"La procédure PR-006 n'a pas été révisée dans les délais prévus.", requirementId:"REQ-009", processId:"PROC-002", questionId:"AUD-002-Q1", gravite:"mineure", cause:"", riskId:null, ncEventId:null, actionId:"ACT-007"},
        {id:"C-002", type:"point_fort", text:"Bonne appropriation des règles de nommage documentaire par les équipes.", requirementId:null, processId:"PROC-002", questionId:null, gravite:null, cause:"", riskId:null, ncEventId:null, actionId:null},
      ] },
    { id:"AUD-003", ref:"AUD-2025-014", title:"Audit interne Production", type:"interne", referentielIds:["ISO9001"],
      processId:"PROC-004", processIds:["PROC-004"], date:"2026-04-14", duration:"1 jour", responsable:"Marc Lenoir", auditeurs:["Marc Lenoir"], site:"Site de production",
      objective:"Vérifier la maîtrise des paramètres critiques de production.", scope:"Ligne de production A",
      auditor:"Marc Lenoir", status:"valide",
      motifs:["programme_annuel","non_conformite"],
      perimeter:{ processIds:["PROC-004"], activites:"Réglage et suivi de la ligne A", produits:"Ligne A", periodeDebut:"2025-10-01", periodeFin:"2026-04-01", exclusions:"Ligne B" },
      objectifs:["Vérifier la maîtrise des paramètres critiques de production", "Vérifier l'efficacité de l'action corrective sur l'étalonnage"],
      criteres:{ referentielIds:["ISO9001"], requirementIds:["REQ-019"], documentIds:["DOC-011"] },
      questions:[
        { id:"AUD-003-Q1", question:"La sonde de température est-elle étalonnée et sa traçabilité assurée ?", requirementId:"REQ-019", processId:"PROC-004", critere:"MO-011", preuveAttendue:"Certificat d'étalonnage", responsableInterroge:"Thomas Petit", statut:"non_conforme", commentaire:"Absence de certificat sur une période.", preuveIds:[] },
      ],
      parties:[ {name:"Thomas Petit", role:"Audité", questionIds:["AUD-003-Q1"], echeance:"2026-04-12", status:"complete"} ],
      findings:[
        {id:"C-003", type:"ecart", text:"Absence de traçabilité de l'étalonnage de la sonde de température sur une période.", requirementId:"REQ-019", processId:"PROC-004", questionId:"AUD-003-Q1", gravite:"majeure", cause:"", riskId:"RISK-003", ncEventId:null, actionId:"ACT-003"},
      ] },
    { id:"AUD-004", ref:"AUD-2025-009", title:"Audit interne Informatique / sécurité", type:"interne", referentielIds:["ISO27001"],
      processId:"PROC-008", processIds:["PROC-008"], date:"2025-11-05", duration:"1 jour", responsable:"Sophie Martin", auditeurs:["Sophie Martin"], site:"Siège",
      objective:"Évaluer la maîtrise des accès et la sécurité applicative.", scope:"Système d'information",
      auditor:"Sophie Martin", status:"cloture",
      motifs:["programme_annuel"],
      perimeter:{ processIds:["PROC-008"], activites:"Sécurité du système d'information", produits:"", periodeDebut:"2025-06-01", periodeFin:"2025-11-01", exclusions:"" },
      objectifs:["Évaluer la maîtrise des accès et la sécurité applicative"],
      criteres:{ referentielIds:["ISO27001"], requirementIds:[], documentIds:[] },
      questions:[
        { id:"AUD-004-Q1", question:"La politique de sauvegarde est-elle appliquée et testée ?", requirementId:null, processId:"PROC-008", critere:"Politique de sauvegarde", preuveAttendue:"Rapport de test de restauration", responsableInterroge:"Karim Belkacem", statut:"conforme", commentaire:"Sauvegardes testées trimestriellement.", preuveIds:[] },
      ],
      parties:[ {name:"Karim Belkacem", role:"Audité", questionIds:["AUD-004-Q1"], echeance:"2025-11-03", status:"complete"} ],
      findings:[
        {id:"C-004", type:"point_fort", text:"Politique de sauvegarde conforme et testée régulièrement.", requirementId:null, processId:"PROC-008", questionId:"AUD-004-Q1", gravite:null, cause:"", riskId:null, ncEventId:null, actionId:null},
      ] },
    { id:"AUD-005", ref:"AUD-2026-005", title:"Audit interne RH", type:"interne", referentielIds:["ISO9001"],
      processId:"PROC-006", processIds:["PROC-006"], date:"2026-08-20", duration:"1 jour", responsable:"Marc Lenoir", auditeurs:["Marc Lenoir","Claire Dubreuil"], site:"Siège",
      objective:"Vérifier la gestion des compétences et l'efficacité du plan de formation.", scope:"Processus RH — gestion des compétences",
      auditor:"Marc Lenoir", status:"en_cours",
      motifs:["programme_annuel","risque_identifie"],
      perimeter:{ processIds:["PROC-006"], activites:"Gestion des compétences et des formations", produits:"", periodeDebut:"2026-01-01", periodeFin:"2026-08-01", exclusions:"Recrutement" },
      objectifs:["Vérifier l'identification des besoins de compétences", "Vérifier l'efficacité du plan de formation", "Évaluer la maîtrise du risque de perte de compétence clé (RISK-002)"],
      criteres:{ referentielIds:["ISO9001"], requirementIds:["REQ-008"], documentIds:["DOC-008"] },
      questions:[
        { id:"AUD-005-Q1", question:"Comment les besoins de formation sont-ils identifiés ?", requirementId:"REQ-008", processId:"PROC-006", critere:"PR-008", preuveAttendue:"Plan de formation annuel", responsableInterroge:"Paul Rousseau", statut:"conforme", commentaire:"Plan de formation formalisé et suivi.", preuveIds:["DOC-008"] },
        { id:"AUD-005-Q2", question:"Comment les compétences critiques sont-elles cartographiées ?", requirementId:"REQ-008", processId:"PROC-006", critere:"RISK-002", preuveAttendue:"Cartographie des compétences", responsableInterroge:"Paul Rousseau", statut:"non_conforme", commentaire:"Aucune cartographie formalisée des compétences critiques.", preuveIds:[] },
        { id:"AUD-005-Q3", question:"Comment l'efficacité des formations est-elle évaluée ?", requirementId:"REQ-008", processId:"PROC-006", critere:"PR-008", preuveAttendue:"Évaluations à chaud/à froid", responsableInterroge:"Paul Rousseau", statut:"a_verifier", commentaire:"", preuveIds:[] },
        { id:"AUD-005-Q4", question:"Les habilitations sont-elles suivies et à jour ?", requirementId:"REQ-008", processId:"PROC-006", critere:"PR-008", preuveAttendue:"Registre des habilitations", responsableInterroge:"Paul Rousseau", statut:"non_evalue", commentaire:"", preuveIds:[] },
      ],
      parties:[ {name:"Paul Rousseau", role:"Audité", questionIds:["AUD-005-Q1","AUD-005-Q2","AUD-005-Q3","AUD-005-Q4"], echeance:"2026-08-18", status:"en_cours"} ],
      findings:[
        {id:"C-005", type:"ecart", text:"Aucune cartographie formalisée des compétences critiques n'est disponible.", requirementId:"REQ-008", processId:"PROC-006", questionId:"AUD-005-Q2", gravite:"majeure", cause:"", riskId:"RISK-002", ncEventId:null, actionId:null},
      ] },
  ],

  changes: [
    { id:"CHG-001", title:"Migration vers un nouvel ERP", processId:"PROC-008", requestedBy:"Karim Belkacem", date:"2026-07-01", step:2,
      impacted:{processes:["PROC-008","PROC-009","PROC-007"], documents:["DOC-005"], risks:["RISK-005"], indicators:["IND-005"], skills:["Administration ERP"]},
      description:"Remplacement de l'ERP actuel par une solution plus moderne, incluant la reprise des données historiques." },
    { id:"CHG-002", title:"Changement de fournisseur composant stratégique", processId:"PROC-007", requestedBy:"Sophie Martin", date:"2026-08-01", step:1,
      impacted:{processes:["PROC-007","PROC-004"], documents:["DOC-005","DOC-010"], risks:["RISK-001"], indicators:["IND-006"], skills:[]},
      description:"Qualification d'un second fournisseur pour réduire la dépendance identifiée en RISK-001." },
    { id:"CHG-003", title:"Nouvelle ligne de production B", processId:"PROC-004", requestedBy:"Thomas Petit", date:"2026-03-01", step:6,
      impacted:{processes:["PROC-004"], documents:["DOC-011"], risks:["RISK-003"], indicators:["IND-007"], skills:["Conduite de ligne B"]},
      description:"Mise en service d'une nouvelle ligne de production pour augmenter la capacité." },
  ],

  changeSteps: ["Déclaré","Analyse d'impact","Risques","Plan d'action","Mise en œuvre","Vérification","Clôturé"],

  referentiels: [
    { id:"ISO9001", name:"ISO 9001:2026", desc:"Systèmes de management de la qualité — Exigences", active:true,
      version:"2026", importDate:"2026-01-05", author:"Claire Dubreuil", origin:"Import initial de la norme", versions:[{version:"2026", date:"2026-01-05", note:"Import initial — exigences simplifiées à des fins de démonstration."}] },
    { id:"ISO13485", name:"ISO 13485", desc:"Dispositifs médicaux — Systèmes de management de la qualité", active:false,
      version:null, importDate:null, author:null, origin:null, versions:[] },
    { id:"ISO14001", name:"ISO 14001", desc:"Systèmes de management environnemental", active:false,
      version:null, importDate:null, author:null, origin:null, versions:[] },
    { id:"ISO45001", name:"ISO 45001", desc:"Santé et sécurité au travail", active:false,
      version:null, importDate:null, author:null, origin:null, versions:[] },
    { id:"ISO27001", name:"ISO 27001", desc:"Sécurité de l'information", active:false,
      version:null, importDate:null, author:null, origin:null, versions:[] },
    { id:"INTERNE",  name:"Référentiel interne", desc:"Exigences propres à l'organisation", active:false,
      version:null, importDate:null, author:null, origin:null, versions:[] },
  ],

  customExigences: [],

  /* ---------- Compétences & Habilitations ---------- */
  competences: [
    { id:"COMP-001", nom:"ISO 9001", code:"C-ISO9001", description:"Connaissance et application des exigences de la norme ISO 9001.", domaine:"Qualité", type:"transversale", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-MAN-001"], habilitationIds:["HAB-002"] },
    { id:"COMP-002", nom:"Gestion des risques", code:"C-RISK", description:"Identification, évaluation et maîtrise des risques et opportunités.", domaine:"Qualité", type:"transversale", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-004"], habilitationIds:[] },
    { id:"COMP-003", nom:"NC / CAPA", code:"C-CAPA", description:"Traitement des non-conformités et des actions correctives.", domaine:"Qualité", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-004"], habilitationIds:[] },
    { id:"COMP-004", nom:"Audit interne", code:"C-AUDIT", description:"Planification et réalisation d'audits internes.", domaine:"Qualité", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-007"], habilitationIds:["HAB-002"] },
    { id:"COMP-005", nom:"Gestion documentaire", code:"C-DOC", description:"Maîtrise du système documentaire du SMQ.", domaine:"Qualité", type:"transversale", niveauRequisPossible:4, criticite:"moyenne", reglementaire:false, actif:true, documentIds:["DOC-006"], habilitationIds:[] },
    { id:"COMP-006", nom:"Gestion fournisseurs", code:"C-ACH", description:"Sélection, qualification et évaluation des fournisseurs.", domaine:"Achats", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-005"], habilitationIds:[] },
    { id:"COMP-007", nom:"Négociation", code:"C-NEGO", description:"Techniques de négociation commerciale et achats.", domaine:"Achats / Commercial", type:"métier", niveauRequisPossible:4, criticite:"moyenne", reglementaire:false, actif:true, documentIds:[], habilitationIds:[] },
    { id:"COMP-008", nom:"Pilotage de production", code:"C-PROD", description:"Pilotage et suivi de la performance de la production.", domaine:"Production", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-PROC-PRD"], habilitationIds:[] },
    { id:"COMP-009", nom:"Amélioration continue", code:"C-AMELIO", description:"Démarches d'amélioration continue et résolution de problèmes.", domaine:"Transversal", type:"transversale", niveauRequisPossible:4, criticite:"basse", reglementaire:false, actif:true, documentIds:[], habilitationIds:[] },
    { id:"COMP-010", nom:"Gestion des compétences", code:"C-RH-COMP", description:"Identification et suivi des compétences et des besoins de formation.", domaine:"RH", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-008"], habilitationIds:[] },
    { id:"COMP-011", nom:"Droit du travail", code:"C-DROIT", description:"Application de la réglementation du travail.", domaine:"RH", type:"réglementaire", niveauRequisPossible:4, criticite:"haute", reglementaire:true, actif:true, documentIds:[], habilitationIds:[] },
    { id:"COMP-012", nom:"Cybersécurité", code:"C-CYBER", description:"Protection du système d'information contre les menaces numériques.", domaine:"Informatique", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:[], habilitationIds:["HAB-001"] },
    { id:"COMP-013", nom:"ISO 27001", code:"C-ISO27001", description:"Connaissance et application de la norme de sécurité de l'information.", domaine:"Informatique", type:"réglementaire", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:[], habilitationIds:[] },
    { id:"COMP-014", nom:"Administration systèmes", code:"C-SYSADMIN", description:"Administration des systèmes et outils informatiques internes.", domaine:"Informatique", type:"métier", niveauRequisPossible:4, criticite:"moyenne", reglementaire:false, actif:true, documentIds:[], habilitationIds:["HAB-001"] },
    { id:"COMP-015", nom:"Contrôle de gestion", code:"C-FIN", description:"Suivi budgétaire et contrôle de gestion.", domaine:"Finance", type:"métier", niveauRequisPossible:4, criticite:"moyenne", reglementaire:false, actif:true, documentIds:[], habilitationIds:[] },
    { id:"COMP-016", nom:"Communication", code:"C-COM", description:"Communication interne et relationnelle.", domaine:"Transversal", type:"transversale", niveauRequisPossible:4, criticite:"basse", reglementaire:false, actif:true, documentIds:[], habilitationIds:[] },
    { id:"COMP-017", nom:"Conduite de ligne B", code:"C-LIGNEB", description:"Conduite et réglage de la ligne de production B.", domaine:"Production", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:true, actif:true, documentIds:["DOC-011"], habilitationIds:["HAB-004"] },
    { id:"COMP-018", nom:"Contrôle qualité", code:"C-CTRLQ", description:"Contrôle qualité en cours et fin de production.", domaine:"Production", type:"métier", niveauRequisPossible:4, criticite:"moyenne", reglementaire:false, actif:true, documentIds:["DOC-010"], habilitationIds:[] },
    { id:"COMP-019", nom:"Sécurité au poste", code:"C-SECU", description:"Respect des règles de sécurité sur le poste de travail.", domaine:"Production", type:"réglementaire", niveauRequisPossible:4, criticite:"haute", reglementaire:true, actif:true, documentIds:[], habilitationIds:["HAB-003"] },
    { id:"COMP-020", nom:"Satisfaction client", code:"C-SATCLI", description:"Suivi et amélioration de la satisfaction client.", domaine:"Commercial", type:"métier", niveauRequisPossible:4, criticite:"moyenne", reglementaire:false, actif:true, documentIds:[], habilitationIds:[] },
    { id:"COMP-021", nom:"Gestion des réclamations", code:"C-RECLAM", description:"Traitement des réclamations clients.", domaine:"Relation client", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:["DOC-012"], habilitationIds:[] },
    { id:"COMP-022", nom:"Leadership", code:"C-LEAD", description:"Capacité à fédérer et piloter l'organisation.", domaine:"Direction", type:"transversale", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:[], habilitationIds:["HAB-005"] },
    { id:"COMP-023", nom:"Revue de direction", code:"C-REVDIR", description:"Conduite et exploitation de la revue de direction.", domaine:"Direction", type:"métier", niveauRequisPossible:4, criticite:"haute", reglementaire:false, actif:true, documentIds:[], habilitationIds:["HAB-005"] },
  ],

  postes: [
    { id:"POSTE-001", intitule:"Responsable Qualité", code:"P-RQ", departement:"Qualité", description:"Pilote le système de management de la qualité.", responsable:"Claire Dubreuil", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-001", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-002", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-003", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-004", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-005", niveauRequis:2, obligatoire:true} ],
      habilitationsObligatoires:["HAB-002"] },
    { id:"POSTE-002", intitule:"Responsable Achats", code:"P-RA", departement:"Achats", description:"Pilote le processus achats et la relation fournisseurs.", responsable:"Claire Dubreuil", criticite:"moyenne", actif:true,
      competencesRequises:[ {competenceId:"COMP-006", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-007", niveauRequis:2, obligatoire:false}, {competenceId:"COMP-001", niveauRequis:2, obligatoire:true} ],
      habilitationsObligatoires:[] },
    { id:"POSTE-003", intitule:"Responsable Production", code:"P-RP", departement:"Production", description:"Pilote le processus de production.", responsable:"Claire Dubreuil", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-008", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-002", niveauRequis:2, obligatoire:true}, {competenceId:"COMP-009", niveauRequis:2, obligatoire:false} ],
      habilitationsObligatoires:[] },
    { id:"POSTE-004", intitule:"Responsable RH", code:"P-RH", departement:"RH", description:"Pilote la gestion des compétences et des ressources humaines.", responsable:"Claire Dubreuil", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-010", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-011", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-001", niveauRequis:2, obligatoire:false} ],
      habilitationsObligatoires:[] },
    { id:"POSTE-005", intitule:"Responsable Informatique", code:"P-RI", departement:"Informatique", description:"Pilote la sécurité et la performance du système d'information.", responsable:"Claire Dubreuil", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-012", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-013", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-014", niveauRequis:3, obligatoire:true} ],
      habilitationsObligatoires:["HAB-001"] },
    { id:"POSTE-006", intitule:"Responsable Finance", code:"P-RF", departement:"Finance", description:"Pilote la fiabilité des données financières.", responsable:"Claire Dubreuil", criticite:"moyenne", actif:true,
      competencesRequises:[ {competenceId:"COMP-015", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-001", niveauRequis:1, obligatoire:false} ],
      habilitationsObligatoires:[] },
    { id:"POSTE-007", intitule:"Auditeur interne", code:"P-AUD", departement:"Qualité", description:"Réalise les audits internes du SMQ.", responsable:"Marc Lenoir", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-004", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-001", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-016", niveauRequis:2, obligatoire:false} ],
      habilitationsObligatoires:["HAB-002"] },
    { id:"POSTE-008", intitule:"Opérateur Production", code:"P-OP", departement:"Production", description:"Conduit la ligne de production et applique les contrôles qualité.", responsable:"Thomas Petit", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-017", niveauRequis:2, obligatoire:true}, {competenceId:"COMP-018", niveauRequis:2, obligatoire:true}, {competenceId:"COMP-019", niveauRequis:3, obligatoire:true} ],
      habilitationsObligatoires:["HAB-003","HAB-004"] },
    { id:"POSTE-009", intitule:"Responsable Commercial", code:"P-RC", departement:"Commercial", description:"Pilote le développement commercial.", responsable:"Claire Dubreuil", criticite:"moyenne", actif:true,
      competencesRequises:[ {competenceId:"COMP-007", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-020", niveauRequis:2, obligatoire:false} ],
      habilitationsObligatoires:[] },
    { id:"POSTE-010", intitule:"Responsable Relation Client", code:"P-RRC", departement:"Relation client", description:"Pilote la satisfaction et les réclamations clients.", responsable:"Julie Farge", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-021", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-016", niveauRequis:2, obligatoire:true} ],
      habilitationsObligatoires:[] },
    { id:"POSTE-011", intitule:"Direction Générale", code:"P-DG", departement:"Direction", description:"Assure la direction générale et la revue du système de management.", responsable:"—", criticite:"haute", actif:true,
      competencesRequises:[ {competenceId:"COMP-022", niveauRequis:3, obligatoire:true}, {competenceId:"COMP-001", niveauRequis:2, obligatoire:true}, {competenceId:"COMP-023", niveauRequis:3, obligatoire:true} ],
      habilitationsObligatoires:["HAB-005"] },
  ],

  habilitations: [
    { id:"HAB-001", nom:"Administration Jira / outils IT", code:"H-JIRA", description:"Autorisation d'administrer les outils et systèmes internes.", activite:"Administration des systèmes internes", niveau:"Standard", prerequis:"", competencesNecessaires:["COMP-014"], formationObligatoire:true, evaluationObligatoire:false, autorite:"Karim Belkacem", dureeValiditeMois:12, renouvellement:true, documentsNecessaires:[], actif:true },
    { id:"HAB-002", nom:"Audit interne", code:"H-AUDIT", description:"Autorisation à conduire des audits internes du SMQ.", activite:"Réalisation d'audits internes", niveau:"Confirmé", prerequis:"Formation audit interne", competencesNecessaires:["COMP-004","COMP-001"], formationObligatoire:true, evaluationObligatoire:true, autorite:"Marc Lenoir", dureeValiditeMois:12, renouvellement:true, documentsNecessaires:["DOC-007"], actif:true },
    { id:"HAB-003", nom:"Accès production (zone sécurisée)", code:"H-ACCPROD", description:"Autorisation d'accès à la zone de production.", activite:"Accès à la ligne de production", niveau:"Standard", prerequis:"Formation sécurité", competencesNecessaires:["COMP-019"], formationObligatoire:true, evaluationObligatoire:false, autorite:"Thomas Petit", dureeValiditeMois:12, renouvellement:true, documentsNecessaires:[], actif:true },
    { id:"HAB-004", nom:"Conduite de ligne B", code:"H-LIGNEB", description:"Autorisation à conduire la ligne de production B.", activite:"Conduite de la ligne de production B", niveau:"Confirmé", prerequis:"Formation ligne B", competencesNecessaires:["COMP-017"], formationObligatoire:true, evaluationObligatoire:true, autorite:"Thomas Petit", dureeValiditeMois:24, renouvellement:true, documentsNecessaires:["DOC-011"], actif:true },
    { id:"HAB-005", nom:"Signature revue de direction", code:"H-REVDIR", description:"Autorisation à valider les décisions de revue de direction.", activite:"Validation des décisions de revue de direction", niveau:"Direction", prerequis:"", competencesNecessaires:["COMP-022","COMP-023"], formationObligatoire:false, evaluationObligatoire:false, autorite:"Claire Dubreuil", dureeValiditeMois:36, renouvellement:true, documentsNecessaires:[], actif:true },
  ],

  people: [
    { id:"P-001", name:"Claire Dubreuil", posteId:"POSTE-011", service:"Direction", manager:null, processId:"PROC-001", dateEntree:"2018-01-15", derniereRevue:"2026-01-15", prochaineRevue:"2027-01-15" },
    { id:"P-002", name:"Marc Lenoir", posteId:"POSTE-001", service:"Qualité", manager:"Claire Dubreuil", processId:"PROC-002", dateEntree:"2019-03-01", derniereRevue:"2025-06-01", prochaineRevue:"2026-12-01" },
    { id:"P-003", name:"Julie Farge", posteId:"POSTE-009", service:"Commercial", manager:"Claire Dubreuil", processId:"PROC-003", dateEntree:"2020-06-15", derniereRevue:"2025-09-01", prochaineRevue:"2026-09-01" },
    { id:"P-004", name:"Thomas Petit", posteId:"POSTE-003", service:"Production", manager:"Claire Dubreuil", processId:"PROC-004", dateEntree:"2017-09-01", derniereRevue:"2025-08-01", prochaineRevue:"2026-08-01" },
    { id:"P-005", name:"Nadia Amrani", posteId:"POSTE-010", service:"Relation client", manager:"Julie Farge", processId:"PROC-005", dateEntree:"2021-01-10", derniereRevue:"2025-10-01", prochaineRevue:"2026-10-01" },
    { id:"P-006", name:"Paul Rousseau", posteId:"POSTE-004", service:"RH", manager:"Claire Dubreuil", processId:"PROC-006", dateEntree:"2019-11-01", derniereRevue:null, prochaineRevue:"2026-06-01" },
    { id:"P-007", name:"Sophie Martin", posteId:"POSTE-002", service:"Achats", manager:"Claire Dubreuil", processId:"PROC-007", dateEntree:"2020-02-01", derniereRevue:"2025-11-01", prochaineRevue:"2026-11-01" },
    { id:"P-008", name:"Karim Belkacem", posteId:"POSTE-005", service:"Informatique", manager:"Claire Dubreuil", processId:"PROC-008", dateEntree:"2021-05-01", derniereRevue:"2026-01-15", prochaineRevue:"2027-01-15" },
    { id:"P-009", name:"Elise Vasseur", posteId:"POSTE-006", service:"Finance", manager:"Claire Dubreuil", processId:"PROC-009", dateEntree:"2018-08-01", derniereRevue:"2025-07-01", prochaineRevue:"2026-07-01" },
    { id:"P-010", name:"Lucas Bonnet", posteId:"POSTE-007", service:"Qualité", manager:"Marc Lenoir", processId:"PROC-002", dateEntree:"2023-01-09", derniereRevue:"2026-01-10", prochaineRevue:"2027-01-10" },
    { id:"P-011", name:"Amina Cherif", posteId:"POSTE-008", service:"Production", manager:"Thomas Petit", processId:"PROC-004", dateEntree:"2022-04-01", derniereRevue:"2025-05-01", prochaineRevue:"2026-05-01" },
  ],

  competenceEvaluations: [
    { id:"EVAL-001", personId:"P-002", competenceId:"COMP-001", niveauEvalue:3, date:"2025-06-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"Bonne maîtrise de la norme.", preuveIds:["PRV-001"], resultat:"Conforme", prochaineEvaluation:"2026-12-01" },
    { id:"EVAL-002", personId:"P-002", competenceId:"COMP-002", niveauEvalue:3, date:"2025-06-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-12-01" },
    { id:"EVAL-003", personId:"P-002", competenceId:"COMP-003", niveauEvalue:3, date:"2025-06-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-12-01" },
    { id:"EVAL-004", personId:"P-002", competenceId:"COMP-004", niveauEvalue:2, date:"2025-06-01", evaluateur:"Claire Dubreuil", methode:"Évaluation interne", commentaire:"Niveau insuffisant pour piloter seul un audit complexe.", preuveIds:["PRV-002"], resultat:"À renforcer", prochaineEvaluation:"2026-12-01" },
    { id:"EVAL-005", personId:"P-002", competenceId:"COMP-005", niveauEvalue:2, date:"2025-06-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-12-01" },
    { id:"EVAL-006", personId:"P-006", competenceId:"COMP-010", niveauEvalue:2, date:"2026-02-01", evaluateur:"Claire Dubreuil", methode:"Entretien", commentaire:"Aucune cartographie formalisée des compétences critiques.", preuveIds:["PRV-003"], resultat:"À renforcer", prochaineEvaluation:"2026-08-01" },
    { id:"EVAL-007", personId:"P-006", competenceId:"COMP-011", niveauEvalue:3, date:"2026-02-01", evaluateur:"Claire Dubreuil", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-02-01" },
    { id:"EVAL-008", personId:"P-007", competenceId:"COMP-006", niveauEvalue:3, date:"2025-11-01", evaluateur:"Marc Lenoir", methode:"Observation", commentaire:"", preuveIds:["PRV-005"], resultat:"Conforme", prochaineEvaluation:"2026-11-01" },
    { id:"EVAL-009", personId:"P-007", competenceId:"COMP-001", niveauEvalue:2, date:"2025-11-01", evaluateur:"Marc Lenoir", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-11-01" },
    { id:"EVAL-010", personId:"P-008", competenceId:"COMP-012", niveauEvalue:2, date:"2026-01-15", evaluateur:"Claire Dubreuil", methode:"Test technique", commentaire:"Renforcement nécessaire suite au risque cyber identifié.", preuveIds:["PRV-004"], resultat:"À renforcer", prochaineEvaluation:"2026-07-15" },
    { id:"EVAL-011", personId:"P-008", competenceId:"COMP-013", niveauEvalue:3, date:"2026-01-15", evaluateur:"Claire Dubreuil", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-01-15" },
    { id:"EVAL-012", personId:"P-008", competenceId:"COMP-014", niveauEvalue:3, date:"2026-01-15", evaluateur:"Claire Dubreuil", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-01-15" },
    { id:"EVAL-013", personId:"P-004", competenceId:"COMP-008", niveauEvalue:3, date:"2025-08-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-08-01" },
    { id:"EVAL-014", personId:"P-004", competenceId:"COMP-002", niveauEvalue:2, date:"2025-08-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-08-01" },
    { id:"EVAL-015", personId:"P-010", competenceId:"COMP-004", niveauEvalue:3, date:"2026-01-10", evaluateur:"Marc Lenoir", methode:"Évaluation interne", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-01-10" },
    { id:"EVAL-016", personId:"P-010", competenceId:"COMP-001", niveauEvalue:3, date:"2026-01-10", evaluateur:"Marc Lenoir", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-01-10" },
    { id:"EVAL-017", personId:"P-011", competenceId:"COMP-017", niveauEvalue:2, date:"2025-05-01", evaluateur:"Thomas Petit", methode:"Mise en situation", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-05-01" },
    { id:"EVAL-018", personId:"P-011", competenceId:"COMP-019", niveauEvalue:2, date:"2025-05-01", evaluateur:"Thomas Petit", methode:"Observation", commentaire:"Rappel des consignes de sécurité nécessaire.", preuveIds:["PRV-006"], resultat:"À renforcer", prochaineEvaluation:"2026-05-01" },
    { id:"EVAL-019", personId:"P-001", competenceId:"COMP-022", niveauEvalue:4, date:"2026-01-15", evaluateur:"Conseil d'administration", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-01-15" },
    { id:"EVAL-020", personId:"P-001", competenceId:"COMP-001", niveauEvalue:3, date:"2026-01-15", evaluateur:"Marc Lenoir", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-01-15" },
    { id:"EVAL-021", personId:"P-001", competenceId:"COMP-023", niveauEvalue:4, date:"2026-01-15", evaluateur:"Conseil d'administration", methode:"Entretien", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2027-01-15" },
    { id:"EVAL-022", personId:"P-003", competenceId:"COMP-007", niveauEvalue:3, date:"2025-09-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-09-01" },
    { id:"EVAL-023", personId:"P-005", competenceId:"COMP-021", niveauEvalue:3, date:"2025-10-01", evaluateur:"Julie Farge", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-10-01" },
    { id:"EVAL-024", personId:"P-005", competenceId:"COMP-016", niveauEvalue:2, date:"2025-10-01", evaluateur:"Julie Farge", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-10-01" },
    { id:"EVAL-025", personId:"P-009", competenceId:"COMP-015", niveauEvalue:3, date:"2025-07-01", evaluateur:"Claire Dubreuil", methode:"Entretien annuel", commentaire:"", preuveIds:[], resultat:"Conforme", prochaineEvaluation:"2026-07-01" },
  ],

  competencePreuves: [
    { id:"PRV-001", personId:"P-002", competenceId:"COMP-001", type:"certificat", label:"Certificat ISO 9001 Lead Implementer", date:"2025-06-01", evaluateur:"Claire Dubreuil", resultat:"Validé", documentId:null },
    { id:"PRV-002", personId:"P-002", competenceId:"COMP-004", type:"evaluation_interne", label:"Grille d'évaluation audit interne", date:"2025-06-01", evaluateur:"Claire Dubreuil", resultat:"À renforcer", documentId:null },
    { id:"PRV-003", personId:"P-006", competenceId:"COMP-010", type:"entretien", label:"Compte-rendu d'entretien annuel", date:"2026-02-01", evaluateur:"Claire Dubreuil", resultat:"À renforcer", documentId:null },
    { id:"PRV-004", personId:"P-008", competenceId:"COMP-012", type:"test", label:"Test technique cybersécurité", date:"2026-01-15", evaluateur:"Claire Dubreuil", resultat:"À renforcer", documentId:null },
    { id:"PRV-005", personId:"P-007", competenceId:"COMP-006", type:"attestation_formation", label:"Attestation formation évaluation fournisseurs", date:"2025-11-01", evaluateur:"Marc Lenoir", resultat:"Validé", documentId:"DOC-014" },
    { id:"PRV-006", personId:"P-011", competenceId:"COMP-019", type:"observation", label:"Fiche d'observation terrain", date:"2025-05-01", evaluateur:"Thomas Petit", resultat:"À renforcer", documentId:null },
  ],

  personHabilitations: [
    { id:"PH-001", personId:"P-002", habilitationId:"HAB-002", dateAttribution:"2025-09-05", dateExpiration:"2026-09-05", statut:"active", historique:[{date:"2025-09-05", action:"Attribution", ancienneValeur:null, nouvelleValeur:"active", commentaire:"Attribution initiale suite à évaluation."}] },
    { id:"PH-002", personId:"P-010", habilitationId:"HAB-002", dateAttribution:"2026-01-15", dateExpiration:"2027-01-15", statut:"active", historique:[{date:"2026-01-15", action:"Attribution", ancienneValeur:null, nouvelleValeur:"active", commentaire:""}] },
    { id:"PH-003", personId:"P-008", habilitationId:"HAB-001", dateAttribution:"2025-01-10", dateExpiration:"2026-01-10", statut:"active", historique:[{date:"2025-01-10", action:"Attribution", ancienneValeur:null, nouvelleValeur:"active", commentaire:""}] },
    { id:"PH-004", personId:"P-011", habilitationId:"HAB-004", dateAttribution:"2025-04-10", dateExpiration:"2027-04-10", statut:"active", historique:[{date:"2025-04-10", action:"Attribution", ancienneValeur:null, nouvelleValeur:"active", commentaire:""}] },
    { id:"PH-005", personId:"P-011", habilitationId:"HAB-003", dateAttribution:"2025-04-10", dateExpiration:"2026-04-10", statut:"active", historique:[{date:"2025-04-10", action:"Attribution", ancienneValeur:null, nouvelleValeur:"active", commentaire:""}] },
    { id:"PH-006", personId:"P-001", habilitationId:"HAB-005", dateAttribution:"2024-01-01", dateExpiration:"2027-01-01", statut:"active", historique:[{date:"2024-01-01", action:"Attribution", ancienneValeur:null, nouvelleValeur:"active", commentaire:""}] },
  ],

  competenceReviews: [
    { id:"CREV-001", personId:"P-002", date:"2025-06-01", evaluateur:"Claire Dubreuil",
      competencesMaitrisees:["ISO 9001","Gestion des risques","NC / CAPA","Gestion documentaire"], competencesARenforcer:["Audit interne"],
      nouvellesCompetencesNecessaires:"", formationsRealisees:"Formation ISO 9001 avancée", formationsAPrevoir:"Perfectionnement audit interne",
      habilitationsARenouveler:"Habilitation Audit interne à renouveler avant échéance", evolutionPoste:"Aucune évolution prévue à court terme.",
      conclusion:"Compétences globalement maîtrisées ; renforcement nécessaire sur l'audit interne.", prochaineDateRevue:"2026-12-01" },
  ],


  requirements: [
    { id:"REQ-001", ref:"4.1", label:"Compréhension de l'organisation et de son contexte", status:"maitrise", processId:"PROC-001" },
    { id:"REQ-002", ref:"4.2", label:"Besoins et attentes des parties intéressées", status:"maitrise", processId:"PROC-001" },
    { id:"REQ-003", ref:"5.1", label:"Leadership et engagement de la direction", status:"maitrise", processId:"PROC-001" },
    { id:"REQ-004", ref:"5.2", label:"Politique qualité", status:"maitrise", processId:"PROC-001" },
    { id:"REQ-005", ref:"6.1", label:"Actions face aux risques et opportunités", status:"a_renforcer", processId:"PROC-002" },
    { id:"REQ-006", ref:"6.2", label:"Objectifs qualité et planification", status:"maitrise", processId:"PROC-001" },
    { id:"REQ-007", ref:"7.1", label:"Ressources", status:"maitrise", processId:"PROC-009" },
    { id:"REQ-008", ref:"7.2", label:"Compétences", status:"a_renforcer", processId:"PROC-006" },
    { id:"REQ-009", ref:"7.5", label:"Informations documentées", status:"a_renforcer", processId:"PROC-002" },
    { id:"REQ-010", ref:"8.1", label:"Planification et maîtrise opérationnelles", status:"maitrise", processId:"PROC-004" },
    { id:"REQ-011", ref:"8.4", label:"Maîtrise des processus, produits et services fournis par des tiers", status:"non_couvert", processId:"PROC-007" },
    { id:"REQ-012", ref:"8.5", label:"Production et prestation de service", status:"maitrise", processId:"PROC-004" },
    { id:"REQ-013", ref:"8.7", label:"Maîtrise des éléments de sortie non conformes", status:"maitrise", processId:"PROC-004" },
    { id:"REQ-014", ref:"9.1", label:"Surveillance, mesure, analyse et évaluation", status:"maitrise", processId:"PROC-002" },
    { id:"REQ-015", ref:"9.2", label:"Audit interne", status:"maitrise", processId:"PROC-002" },
    { id:"REQ-016", ref:"9.3", label:"Revue de direction", status:"maitrise", processId:"PROC-001" },
    { id:"REQ-017", ref:"10.2", label:"Non-conformité et action corrective", status:"maitrise", processId:"PROC-002" },
    { id:"REQ-018", ref:"8.4.2", label:"Type et étendue de la maîtrise des prestataires externes", status:"non_couvert", processId:"PROC-007" },
    { id:"REQ-019", ref:"7.1.5", label:"Ressources pour la surveillance et la mesure", status:"a_renforcer", processId:"PROC-004" },
    { id:"REQ-020", ref:"8.2", label:"Exigences relatives aux produits et services", status:"maitrise", processId:"PROC-003" },
  ],

  /* ---------- Revue de Direction ---------- */
  managementReviews: [
    {
      id:"RD-2025-S2", periodLabel:"Semestre 2 2025", periodStart:"2025-07-01", periodEnd:"2025-12-31",
      reviewDate:"2026-01-15", nextReviewDate:"2026-07-15", status:"cloturee", previousReviewId:null,
      contextChanges:[
        {id:"CTX-001", text:"Ouverture à un nouveau marché nécessitant une conformité réglementaire spécifique.", source:"externe", confirmed:true},
        {id:"CTX-002", text:"Renforcement de la politique de cybersécurité suite à une hausse des tentatives d'intrusion.", source:"externe", confirmed:true},
      ],
      decisions:[
        { id:"RDDEC-001", decision:"Renforcer le suivi du processus Achats", contexte:"Objectif de sécurisation des fournisseurs partiellement atteint (40 %).", justification:"Réduire la dépendance à un fournisseur unique identifiée en RISK-001.", responsable:"Sophie Martin", echeance:"2026-03-31", priorite:"haute", indicatorId:"IND-006", actionId:"ACT-011", statut:"realisee", preuve:"Second fournisseur qualifié en mars 2026, cf. CHG-002." },
        { id:"RDDEC-002", decision:"Auditer la sécurité du système d'information", contexte:"Risque cyber (RISK-005) jugé critique.", justification:"Prévenir toute indisponibilité majeure du système d'information.", responsable:"Karim Belkacem", echeance:"2026-05-31", priorite:"critique", indicatorId:"IND-005", actionId:"ACT-012", statut:"en_retard", preuve:"" },
        { id:"RDDEC-003", decision:"Améliorer le taux de clôture des non-conformités en production", contexte:"Non-conformités récurrentes en production.", justification:"Réduire l'impact qualité et les retards associés.", responsable:"Thomas Petit", echeance:"2026-04-30", priorite:"moyenne", indicatorId:"IND-007", actionId:"ACT-013", statut:"realisee", preuve:"Contrôle qualité renforcé sur la ligne A depuis avril 2026." },
      ],
      conclusion:{ smq:"adapte", performance:"conforme", ressources:"a_renforcer", amelioration:"actions_amelioration",
        commentaire:"Le système reste globalement adapté aux besoins de l'organisation. Une vigilance particulière doit être maintenue sur la sécurité du système d'information et sur les compétences critiques identifiées." },
    },
    {
      id:"RD-2026-S1", periodLabel:"Semestre 1 2026", periodStart:"2026-01-01", periodEnd:"2026-06-30",
      reviewDate:"2026-07-15", nextReviewDate:"2027-01-15", status:"revue", previousReviewId:"RD-2025-S2",
      contextChanges:[
        {id:"CTX-003", text:"Migration vers un nouvel ERP en cours (CHG-001), impactant les processus Informatique, Finance et Achats.", source:"changement", confirmed:true},
        {id:"CTX-004", text:"Qualification d'un second fournisseur stratégique (CHG-002).", source:"changement", confirmed:true},
        {id:"CTX-005", text:"Évolution réglementaire sectorielle à anticiper sur le prochain semestre.", source:"externe", confirmed:false},
      ],
      decisions:[
        { id:"RDDEC-004", decision:"Lancer un plan de formation pour réduire la pénurie de compétences", contexte:"Risque RISK-002 (perte de compétence clé) toujours ouvert.", justification:"Sécuriser la continuité d'activité sur les postes critiques.", responsable:"Paul Rousseau", echeance:"2026-12-31", priorite:"haute", indicatorId:null, actionId:null, statut:"a_faire", preuve:"" },
        { id:"RDDEC-005", decision:"Réévaluer le fournisseur unique restant", contexte:"Risque RISK-001 toujours critique malgré la qualification d'un second fournisseur.", justification:"Poursuivre la sécurisation des approvisionnements stratégiques.", responsable:"Sophie Martin", echeance:"2026-11-30", priorite:"critique", indicatorId:"IND-006", actionId:null, statut:"a_faire", preuve:"" },
      ],
      conclusion:{ smq:"", performance:"", ressources:"", amelioration:"", commentaire:"" },
    },
  ],
};

/* Labels & couleurs partagés */
const LABELS = {
  processGroup:{ management:"Processus de management", operationnel:"Processus opérationnels", support:"Processus support" },
  docType:{ politique:"Politique", charte:"Charte", manuel:"Manuel", processus:"Fiche processus", procedure:"Procédure", mode_operatoire:"Mode opératoire", formulaire:"Formulaire", enregistrement:"Enregistrement", instruction:"Instruction" },
  docStatus:{ en_vigueur:{l:"En vigueur",c:"success"}, a_reviser:{l:"À réviser",c:"warning"}, obsolete:{l:"Obsolète",c:"neutral"}, brouillon:{l:"Brouillon",c:"info"} },
  docHealth:{ vert:{l:"Conforme",c:"success"}, orange:{l:"Vigilance",c:"warning"}, rouge:{l:"Action requise",c:"danger"} },
  riskLevel:{ critique:{l:"Critique",c:"danger"}, eleve:{l:"Élevé",c:"warning"}, faible:{l:"Faible",c:"success"}, opportunite:{l:"Opportunité",c:"info"} },
  riskStatus:{ ouvert:{l:"Ouvert",c:"warning"}, maitrise:{l:"Maîtrisé",c:"success"}, cloture:{l:"Clôturé",c:"neutral"} },
  eventType:{ non_conformite:"Non-conformité", incident:"Incident", reclamation:"Réclamation", anomalie:"Anomalie", suggestion:"Suggestion", amelioration:"Amélioration" },
  eventStatus:{ ouvert:{l:"Ouvert",c:"warning"}, cloture:{l:"Clôturé",c:"success"} },
  priority:{ critique:{l:"Critique",c:"danger"}, haute:{l:"Haute",c:"warning"}, moyenne:{l:"Moyenne",c:"info"}, basse:{l:"Basse",c:"neutral"} },
  actionStatus:{ retard:{l:"En retard",c:"danger"}, en_cours:{l:"En cours",c:"warning"}, a_faire:{l:"À faire",c:"info"}, termine:{l:"Terminée",c:"success"} },
  actionOrigin:{ evenement:"Événement", risque:"Risque", audit:"Audit", indicateur:"Indicateur", objectif:"Objectif", changement:"Changement", revue_direction:"Revue de direction", competence:"Compétence" },
  objStatus:{ en_cours:{l:"En cours",c:"warning"}, atteint:{l:"Atteint",c:"success"}, en_retard:{l:"En retard",c:"danger"} },
  indStatus:{ vert:{l:"Sur cible",c:"success"}, orange:{l:"À surveiller",c:"warning"}, rouge:{l:"Hors cible",c:"danger"} },
  auditStatus:{ planifie:{l:"Planifié",c:"info"}, preparation:{l:"Préparation",c:"info"}, en_cours:{l:"En cours",c:"warning"}, analyse:{l:"Analyse",c:"warning"}, synthese:{l:"Synthèse",c:"warning"}, a_valider:{l:"À valider",c:"warning"}, valide:{l:"Validé",c:"success"}, cloture:{l:"Clôturé",c:"success"}, realise:{l:"Validé",c:"success"} },
  auditType:{ interne:"Audit interne", externe:"Audit externe", certification:"Audit de certification", fournisseur:"Audit fournisseur", client:"Audit client", processus:"Audit processus", produit:"Audit produit / service", reglementaire:"Audit réglementaire", conformite:"Audit de conformité", suivi:"Audit de suivi", renouvellement:"Audit de renouvellement", cible:"Audit ciblé", autre:"Autre" },
  auditMotif:{ programme_annuel:"Programme annuel", exigence_reglementaire:"Exigence réglementaire", certification:"Certification", surveillance:"Surveillance", risque_identifie:"Risque identifié", non_conformite:"Non-conformité", action_corrective:"Action corrective", changement:"Changement important", incident:"Incident", demande_direction:"Demande de la Direction", fournisseur:"Fournisseur", client:"Client", autre:"Autre" },
  questionStatus:{ conforme:{l:"Conforme",c:"success"}, partiellement_conforme:{l:"Partiellement conforme",c:"warning"}, non_conforme:{l:"Non conforme",c:"danger"}, non_applicable:{l:"Non applicable",c:"neutral"}, a_verifier:{l:"À vérifier",c:"info"}, non_evalue:{l:"Non évalué",c:"neutral"} },
  constatType:{ point_fort:{l:"Point fort",c:"success",e:"🟢"}, conforme:{l:"Conforme",c:"info",e:"🔵"}, vigilance:{l:"Point de vigilance",c:"warning",e:"🟠"}, opportunite:{l:"Opportunité d'amélioration",c:"warning",e:"🟠"}, ecart:{l:"Écart",c:"danger",e:"🔴"}, nc_majeure:{l:"Non-conformité majeure",c:"danger",e:"🔴"} },
  constatGravite:{ mineure:"Mineure", majeure:"Majeure", critique:"Critique" },
  partyStatus:{ en_attente:{l:"En attente",c:"warning"}, en_cours:{l:"En cours",c:"info"}, complete:{l:"Complétée",c:"success"}, indisponible:{l:"Indisponible",c:"neutral"} },
  niveauCompetence:{ 0:"Non acquis", 1:"Notions", 2:"Autonome", 3:"Maîtrise", 4:"Référent / Expert" },
  competenceCriticite:{ haute:{l:"Haute",c:"danger"}, moyenne:{l:"Moyenne",c:"warning"}, basse:{l:"Basse",c:"neutral"} },
  ecartStatut:{ conforme:{l:"Conforme",c:"success"}, a_renforcer:{l:"À renforcer",c:"warning"}, non_evalue:{l:"Non évalué",c:"neutral"}, non_requise:{l:"Non requise",c:"neutral"} },
  preuveCompetenceType:{ certificat:"Certificat", attestation_formation:"Attestation de formation", diplome:"Diplôme", experience:"Expérience professionnelle", evaluation_interne:"Évaluation interne", entretien:"Entretien", observation:"Observation", test:"Test", validation_manager:"Validation manager", document:"Document", autre:"Autre" },
  habilitationStatut:{ active:{l:"Valide",c:"success"}, expire_bientot:{l:"Expire bientôt",c:"warning"}, expiree:{l:"Expirée",c:"danger"}, suspendue:{l:"Suspendue",c:"neutral"}, non_habilite:{l:"Non habilité",c:"neutral"} },
  reqStatus:{ maitrise:{l:"Maîtrisée",c:"success"}, a_renforcer:{l:"À renforcer",c:"warning"}, non_couvert:{l:"Non couverte",c:"danger"} },
  exigenceCoverage:{ non_couvert:{l:"Non couverte",c:"danger"}, partiellement:{l:"Partiellement couverte",c:"warning"}, a_renforcer:{l:"À renforcer",c:"warning"}, maitrise:{l:"Maîtrisée",c:"success"}, optimise:{l:"Optimisée",c:"success"} },
  exigenceType:{ exigence:"Exigence", preuve:"Preuve attendue", responsabilite:"Responsabilité" },
  importance:{ haute:{l:"Haute",c:"danger"}, moyenne:{l:"Moyenne",c:"warning"}, basse:{l:"Basse",c:"neutral"} },
  stakeholderCat:{ client:"Client", patient:"Patient", collaborateur:"Collaborateur", fournisseur:"Fournisseur", autorite:"Autorité", certificateur:"Organisme certificateur", actionnaire:"Actionnaire", partenaire:"Partenaire", soustraitant:"Sous-traitant", autre:"Autre" },
  needType:{ besoin:"Besoin", attente:"Attente", exigence:"Exigence" },
  reviewStatus:{ brouillon:{l:"Brouillon",c:"neutral"}, preparation:{l:"Préparation",c:"info"}, revue:{l:"En cours",c:"warning"}, validation:{l:"À valider",c:"warning"}, cloturee:{l:"Clôturée",c:"success"} },
  decisionStatus:{ a_faire:{l:"À faire",c:"info"}, en_cours:{l:"En cours",c:"warning"}, realisee:{l:"Réalisée",c:"success"}, en_retard:{l:"En retard",c:"danger"}, abandonnee:{l:"Abandonnée",c:"neutral"} },
  conclusionSmq:{ adapte:"Adapté", partiellement_adapte:"Partiellement adapté", a_revoir:"À revoir" },
  conclusionPerf:{ conforme:"Conforme aux objectifs", a_surveiller:"À surveiller", insuffisante:"Insuffisante" },
  conclusionRessources:{ suffisantes:"Suffisantes", a_renforcer:"À renforcer", insuffisantes:"Insuffisantes" },
  conclusionAmelioration:{ aucune_action_majeure:"Aucune action majeure", actions_amelioration:"Actions d'amélioration nécessaires", actions_prioritaires:"Actions prioritaires nécessaires" },
};
const AUDIT_WORKFLOW_STEPS = ["planifie","preparation","en_cours","analyse","synthese","a_valider","valide","cloture"];
const AUDIT_WORKFLOW_LABELS = ["Planifié","Préparation","En cours","Analyse","Synthèse","À valider","Validé","Clôturé"];
function isAuditEcart(f){ return f.type==="ecart" || f.type==="nc_majeure"; }

function normalizeDocuments(){
  DB.documents.forEach(d=>{
    d.requirementIds = d.requirementIds || [];
    d.riskIds = d.riskIds || [];
    d.auditIds = d.auditIds || [];
    d.indicatorIds = d.indicatorIds || [];
    d.actionIds = d.actionIds || [];
    d.crossDocIds = d.crossDocIds || [];
    d.flowSteps = d.flowSteps || [];
    d.referentiels = d.referentiels || ["ISO 9001"];
  });
  if(!DB.trainings) DB.trainings = [];
  if(!DB.documentTemplates) DB.documentTemplates = JSON.parse(JSON.stringify(QONNECT_SEED.documentTemplates));
  if(!DB.customExigences) DB.customExigences = [];
  if(!DB.competences) DB.competences = JSON.parse(JSON.stringify(QONNECT_SEED.competences));
  if(!DB.postes) DB.postes = JSON.parse(JSON.stringify(QONNECT_SEED.postes));
  if(!DB.habilitations) DB.habilitations = JSON.parse(JSON.stringify(QONNECT_SEED.habilitations));
  if(!DB.people) DB.people = JSON.parse(JSON.stringify(QONNECT_SEED.people));
  if(!DB.competenceEvaluations) DB.competenceEvaluations = JSON.parse(JSON.stringify(QONNECT_SEED.competenceEvaluations));
  if(!DB.competencePreuves) DB.competencePreuves = JSON.parse(JSON.stringify(QONNECT_SEED.competencePreuves));
  if(!DB.personHabilitations) DB.personHabilitations = JSON.parse(JSON.stringify(QONNECT_SEED.personHabilitations));
  if(!DB.competenceReviews) DB.competenceReviews = JSON.parse(JSON.stringify(QONNECT_SEED.competenceReviews));
  (DB.referentiels||[]).forEach(r=>{
    if(typeof r.version === "undefined") r.version = null;
    if(typeof r.importDate === "undefined") r.importDate = null;
    if(typeof r.author === "undefined") r.author = null;
    if(typeof r.origin === "undefined") r.origin = null;
    if(!r.versions) r.versions = [];
  });
  (DB.requirements||[]).forEach(r=>{
    r.extraDocIds = r.extraDocIds || [];
    r.extraRiskIds = r.extraRiskIds || [];
    r.extraAuditIds = r.extraAuditIds || [];
    r.extraActionIds = r.extraActionIds || [];
  });
  (DB.audits||[]).forEach(a=>{
    a.ref = a.ref || ("AUD-"+a.id);
    a.type = a.type || "interne";
    a.referentielIds = a.referentielIds || ["ISO9001"];
    a.processIds = a.processIds || (a.processId ? [a.processId] : []);
    a.duration = a.duration || "";
    a.responsable = a.responsable || a.auditor || "";
    a.auditeurs = a.auditeurs || (a.auditor ? [a.auditor] : []);
    a.site = a.site || "";
    a.motifs = a.motifs || [];
    a.perimeter = a.perimeter || { processIds:a.processIds||[], activites:"", produits:"", periodeDebut:"", periodeFin:"", exclusions:"" };
    a.objectifs = a.objectifs || (a.objective ? [a.objective] : []);
    a.criteres = a.criteres || { referentielIds:a.referentielIds||[], requirementIds:[], documentIds:[] };
    a.questions = a.questions || [];
    a.parties = a.parties || [];
    if(a.status==="realise") a.status = "valide";
    (a.findings||[]).forEach(f=>{
      if(typeof f.requirementId==="undefined") f.requirementId = null;
      if(typeof f.processId==="undefined") f.processId = a.processId||null;
      if(typeof f.questionId==="undefined") f.questionId = null;
      if(typeof f.gravite==="undefined") f.gravite = null;
      if(typeof f.cause==="undefined") f.cause = "";
      if(typeof f.riskId==="undefined") f.riskId = null;
      if(typeof f.ncEventId==="undefined") f.ncEventId = null;
    });
  });
}
function loadDB(){
  const seedCopy = JSON.parse(JSON.stringify(QONNECT_SEED));
  try{
    const raw = localStorage.getItem("qonnect_db_v1");
    if(raw){
      const cached = JSON.parse(raw);
      // Fusionne : conserve les données déjà enregistrées par l'utilisateur, mais
      // ajoute toute nouvelle section apparue dans une mise à jour de Qonnect
      // (ex : le module Contexte & Stratégie) qui serait absente d'un ancien cache.
      Object.keys(seedCopy).forEach(key=>{
        if(!(key in cached)) cached[key] = seedCopy[key];
      });
      if(cached.climate && typeof cached.climate.evaluated === "undefined") cached.climate.evaluated = true;
      return cached;
    }
  }catch(e){ console.error("Qonnect: cache local invalide, réinitialisation.", e); }
  return seedCopy;
}
function saveDB(){
  localStorage.setItem("qonnect_db_v1", JSON.stringify(DB));
}
function resetDB(){
  localStorage.removeItem("qonnect_db_v1");
  DB = JSON.parse(JSON.stringify(QONNECT_SEED));
  normalizeDocuments();
  saveDB();
}

let DB = loadDB();
normalizeDocuments();

/* ---------- helpers d'accès ---------- */
const findBy = (arr,id)=> arr.find(x=>x.id===id);
const getProcess = id => findBy(DB.processes,id);
const getDocument = id => findBy(DB.documents,id);
const getRisk = id => findBy(DB.risks,id);
const getEvent = id => findBy(DB.events,id);
const getAction = id => findBy(DB.actions,id);
const getObjective = id => findBy(DB.objectives,id);
const getIndicator = id => findBy(DB.indicators,id);
const getAudit = id => findBy(DB.audits,id);
const getChange = id => findBy(DB.changes,id);
const getContextIssue = id => findBy(DB.contextExternal,id) || findBy(DB.contextInternal,id);
const getStakeholder = id => findBy(DB.stakeholders,id);
const getOrientation = id => findBy(DB.orientations,id);
const getReview = id => findBy(DB.managementReviews,id);
const getLatestReview = ()=> DB.managementReviews[DB.managementReviews.length-1];
const getDecision = (review,id)=> review ? findBy(review.decisions,id) : null;
const getTemplate = id => findBy(DB.documentTemplates,id);
const getReferentiel = id => findBy(DB.referentiels,id);
const getCustomExigence = id => findBy(DB.customExigences,id);
const getCompetence = id => findBy(DB.competences,id);
const getPoste = id => findBy(DB.postes,id);
const getHabilitation = id => findBy(DB.habilitations,id);
const getPerson = id => findBy(DB.people,id);
const getPersonHabilitation = id => findBy(DB.personHabilitations,id);

function nextId(prefix, arr){
  let max = 0;
  arr.forEach(x=>{ const m = x.id.match(/(\d+)$/); if(m) max = Math.max(max, parseInt(m[1],10)); });
  return prefix + "-" + String(max+1).padStart(3,"0");
}
