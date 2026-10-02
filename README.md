# QONNECT

**Votre système de management, enfin connecté.**

Prototype fonctionnel de Qonnect, une application de gestion complète du système de management qualité (SMQ) : organisation, processus, documentation, risques, événements, actions, objectifs, indicateurs, audits, changements, référentiels et conformité — le tout relié par des identifiants communs.

## Démarrer

Aucune installation n'est nécessaire.

- **En local** : double-cliquez sur `index.html`, ou ouvrez-le dans votre navigateur.
- **Avec un petit serveur local** (recommandé pour éviter certaines restrictions de sécurité du navigateur sur les fichiers `file://`) :
  ```bash
  cd qonnect
  python3 -m http.server 8000
  # puis ouvrir http://localhost:8000
  ```
- **Sur GitHub Pages** : déposez le contenu de ce dossier à la racine d'un repository, activez GitHub Pages sur la branche correspondante, et l'application est en ligne.

## Stack technique

- HTML5 / CSS3 / JavaScript vanilla — **aucun framework, aucune API, aucun backend, aucune base de données**.
- Les données sont fictives, stockées dans `js/data.js`, et interconnectées par identifiants (`PROC-001`, `RISK-001`, `DOC-004`…).
- Les modifications faites dans l'interface (créer un événement, faire avancer un workflow, etc.) sont persistées dans le `localStorage` du navigateur, propre à chaque poste. Aucune donnée n'est envoyée à un serveur.
- Vous pouvez réinitialiser les données de démonstration à tout moment depuis **⚙ Administration → Réinitialiser les données de démonstration**.
- **Sauvegarde** : **⚙ Administration → Exporter mes données** télécharge un fichier JSON ; **Importer une sauvegarde** le restaure (la version précédente est conservée de côté dans le navigateur). À faire régulièrement, car les données disparaissent si le navigateur est vidé.

## Structure du projet

```
qonnect/
│
├── index.html          # Point d'entrée unique
│
├── css/
│   └── style.css        # Design system (couleurs, typographie, composants)
│
├── js/
│   ├── data.js           # Jeu de données fictif + accès/persistance (localStorage)
│   ├── ui.js              # Composants réutilisables (badges, modales, panneaux, toasts…)
│   └── modules/           # Routeur, pages et interactions, un fichier par module
│       ├── 00-shell.js    # Navigation, coquille de l'application, routeur
│       ├── 01-dashboard.js … 27-evenements-globaux.js
│       └── 28-init.js     # Initialisation (toujours chargé en dernier)
```

## Navigation

L'application est une SPA pilotée par le hash de l'URL (`#/module/id/onglet`), ce qui permet d'utiliser le bouton retour du navigateur et de partager un lien direct vers une fiche.

Principaux modules : Vue d'ensemble · **Contexte & Stratégie** · Processus · Risques & opportunités · Objectifs & indicateurs · Changements · Documentation du SMQ · Événements · Actions · Audits · Référentiels · Conformité · Qonnect AI · Administration.

### Contexte & Stratégie

Ce module est le point de départ du système : il permet de décrire les enjeux externes et internes de l'organisation, ses parties intéressées et leurs besoins/attentes/exigences, ses enjeux climatiques et ses orientations stratégiques.

La page d'accueil du module (« Notre organisation ») met en avant :
- l'**assistant stratégique**, en haut de page, pour décrire une difficulté en langage naturel et obtenir des suggestions d'enjeux, risques, opportunités, objectifs et actions ;
- un bloc **Impact sur votre système de management** avec des compteurs cliquables (risques, opportunités, objectifs, indicateurs, actions et changements générés depuis le contexte) ;
- un score de **maturité du contexte** avec les points restant à compléter ;
- la **carte stratégique**, directement visible et interactive (chaque nœud est cliquable) ;
- une **Vue Direction** dédiée, sans vocabulaire ISO, pour une synthèse en un coup d'œil.

Chaque élément accepté depuis une suggestion est créé dans le module correspondant et reste **tracé** jusqu'à l'enjeu d'origine (`sourceContext`), visible sur la fiche risque et sur la carte objectif. Ajouter un enjeu déclenche aussi automatiquement une proposition de suggestions.

### Revue de Direction

Le cockpit de pilotage du système de management (`#/revue-direction`). Il ne duplique aucune donnée : chaque onglet lit en direct les processus, risques, objectifs, indicateurs, audits, non-conformités, actions et changements déjà saisis ailleurs dans Qonnect.

- **En-tête** : période, statut, workflow en 5 étapes (Brouillon → Préparation → Revue → Validation → Clôture), taux de décisions précédentes clôturées, actions en retard, niveau global de performance, nombre de points d'attention.
- **15 onglets** : Synthèse, Décisions précédentes, Contexte, Performance, Satisfaction, Processus, NC/CAPA, Audits, Ressources, Risques, Changements, Amélioration, Décisions, Actions, Conclusion — navigation identique au pattern déjà utilisé pour la fiche processus.
- **Alertes intelligentes** et **score global** (composantes détaillées, jamais un chiffre opaque) calculés à partir des données réelles.
- **Analyse proposée par Qonnect** : synthèse textuelle générée à partir des données, toujours accompagnée de la mention *« Validation par la Direction requise »* — l'outil ne décide jamais à la place de la Direction.
- **Détection automatique d'opportunités d'amélioration** (indicateur dégradé, NC récurrente, risque élevé, objectif non atteint, écart d'audit), transformables en décision en un clic.
- **Décisions de la Direction** : création, suivi de statut, preuve associée, et génération d'une action dans le module Actions (origine `Revue de direction`) sans ressaisie.
- **Workflow de validation** avec verrouillage en écriture une fois la revue clôturée, et fonction « Créer une nouvelle version » pour la traçabilité.
- **Sorties** : génération d'un compte-rendu (créé comme un vrai document dans la Documentation du SMQ), accès direct au plan d'actions, et une page **Synthèse Direction** courte (5 chiffres clés, points forts, points de vigilance, décisions majeures, actions prioritaires).

### Documentation du SMQ — système documentaire intelligent

Chaque document n'est plus un fichier isolé : il est relié en direct aux processus, risques, audits, indicateurs, actions, changements et exigences qu'il impacte.

- **Assistant de création** (`+ Nouveau document`) : formulaire progressif en 4 étapes (type → processus → référentiels → structure), qui génère automatiquement la trame standard d'une procédure (Objet, Domaine d'application, Responsabilités, Description, Enregistrements, Risques, Indicateurs, Références…) et suggère les exigences ISO 9001 déjà associées au processus choisi.
- **Bibliothèque de modèles** (`#/documents/modeles`) : 16 modèles prêts à l'emploi pour ISO 9001, ISO 13485 et ISO 27001.
- **Fiche document repensée** avec 7 onglets : Contenu (avec 4 vues — Direction / Responsable / Opérationnelle / Auditeur, et logigramme automatique pour les procédures qui décrivent des étapes), Relations, Exigences, Impact, Historique, Formation, Santé documentaire.
- **Analyse d'impact** : en un coup d'œil, combien de processus, risques, audits, actions, formations et autres documents seraient concernés par une modification.
- **Santé documentaire** (`#/documents/sante`) : moteur de cohérence détectant documents à réviser en retard, références brisées, doublons potentiels — classés 🟢 Conforme / 🟠 Vigilance / 🔴 Action requise.
- **Cartographie normative** (`#/documents/cartographie`) : quelle exigence est couverte par quel document, et inversement.
- **Assistant documentaire** (`#/documents/assistant`) : détecte les processus sans procédure, les exigences non couvertes et les documents qui se recoupent — toujours basé sur les données réelles, jamais inventé.
- **Formation et prise de connaissance** : lancer une campagne de lecture depuis un document, suivre qui a validé.

### Référentiels — le moteur de conformité

Le module ne se contente plus d'afficher une checklist statique : il **calcule** automatiquement le niveau de maîtrise de chaque exigence à partir des preuves réellement enregistrées ailleurs dans Qonnect — jamais saisi manuellement, jamais déclaré sans preuve.

- **Import d'un référentiel** (`+ Importer un référentiel`) : collez le texte (ou chargez un `.txt`/`.html`) d'une norme, d'une procédure groupe ou d'un cahier des charges client. Les fichiers **PDF**, **Word (.docx)**, `.txt` et `.html` sont lus directement dans le navigateur (bibliothèques pdf.js et mammoth dans `js/vendor/`, chargées à la demande) : le fichier n'est envoyé nulle part. *Limites : les PDF scannés (images sans texte) ne sont pas lisibles, car il n'y a pas de reconnaissance de caractères ; l'ancien format `.doc` n'est pas pris en charge.*
- L'analyse recompose les phrases coupées par les retours à la ligne du PDF, ignore les phrases qui expliquent le vocabulaire de la norme (« doit » indique une exigence…) et classe « il convient de » comme **recommandation**.
- **Analyse intelligente** : un moteur à base de règles détecte automatiquement les chapitres (`4.1`, `5.2`…) et les phrases porteuses d'obligation (« doit », « doivent », « shall », « est tenu de »…), puis les relie automatiquement aux processus, documents et risques existants par recoupement de mots-clés.
- **Calcul automatique de la conformité** : chaque exigence obtient un niveau (Non couverte / Partiellement couverte / À renforcer / Maîtrisée / Optimisée) calculé à partir de l'existence de documents, d'audits, d'actions en retard, de risques ouverts et d'indicateurs — avec le détail du « pourquoi » toujours visible sur la fiche de l'exigence.
- **Vue conformité temps réel** : tableau dynamique exigence → niveau → preuves → risques → actions → responsable → dernière mise à jour.
- **Cartographie** exigence ↔ SMQ, et une **Vue d'ensemble** par référentiel (score global, exigences critiques, actions prioritaires, dernières modifications).
- **Gestion des versions** avec comparaison automatique (exigences ajoutées/supprimées) entre deux imports.
- **Assistant spécialisé** par référentiel (local, sans envoi de données) : résumer, expliquer un chapitre à partir du texte importé (« explique-moi le chapitre 4 », « et le suivant ? »), chercher un sujet (« où parle-t-on des risques ? »), lister recommandations / preuves / responsabilités, indiquer par où commencer, préparer des questions d'audit. « Comment mettre en place le chapitre X ? » ou « accompagne-moi sur… » (le chapitre peut être cité par son numéro ou par son titre) donne une démarche pas à pas avec, pour chaque point, ce qu'il faut produire, la preuve attendue et des boutons pour créer le document, l'associer à l'exigence ou créer une action. Les questions de vocabulaire (« c'est quoi les enjeux internes et externes ? », « qu'est-ce qu'une action corrective ? ») reçoivent une explication en langage courant, suivie des passages du référentiel qui en parlent, puis d'une proposition de document à produire (nom, contenu conseillé, fréquence, responsable) avec un bouton pour partir d'un modèle de la bibliothèque ou créer le document. Dans la démarche pas à pas, chaque point indique aussi un format conseillé. Les **questions de suite sur une méthode** (« si je fais la méthode PESTEL : comment je dois compléter ? », SWOT/AFOM, 5 pourquoi, Ishikawa, matrice de criticité) reçoivent un pas-à-pas, un exemple générique en tableau, l'endroit où reporter le résultat dans Qonnect et un bouton de création du document. Les réponses citent le texte importé et les preuves enregistrées ; ce n'est pas un modèle d'IA générative.
- Le module **Conformité** du menu affiche désormais directement le référentiel actif via ce même moteur.
- **Modifier / supprimer** : chaque référentiel (bouton ✏️/🗑 sur sa fiche et sur sa carte du hub) et chaque exigence (bouton ✏️ dans le tableau des exigences, avec re-liaison manuelle aux documents/risques/audits et suppression) peuvent être édités ou retirés à tout moment — y compris les exigences ISO 9001 fournies par défaut.
- **Multi-référentiel réel** : l'onglet Exigences d'un document liste désormais toutes les exigences qu'il couvre, groupées par référentiel — une même preuve peut répondre à ISO 9001, un référentiel importé, etc. sans être ressaisie.
- **Analyse d'impact** sur chaque exigence : si elle évolue, Qonnect affiche immédiatement combien de processus, documents, audits et actions seraient concernés.
- **Comparaison de versions structurée** : au-delà du résumé, chaque nouvelle version détaille précisément les exigences ajoutées, supprimées et les chapitres modifiés.
- **Synthèse enrichie** par référentiel (Vue d'ensemble) : documents attendus, indicateurs et audits recommandés, et recommandation d'inscription à la prochaine revue de direction — toujours dérivée des données réelles.

### Audits — un processus complet, pas un formulaire

Le module Audits est devenu un véritable parcours guidé, du "pourquoi audite-t-on ?" jusqu'aux actions correctives, sans jamais dupliquer une donnée qui existe déjà ailleurs.

- **Assistant de création en 6 étapes** (`+ Nouvel audit`) : identification (type, référentiel(s), responsable, auditeurs, processus), contexte (pourquoi cet audit ?), périmètre (activités, période, exclusions), objectifs (suggérés selon le type), critères d'audit (exigences suggérées automatiquement selon le périmètre, via le moteur de conformité), puis génération automatique d'un plan de questions à partir des exigences, des risques du processus et des non-conformités précédentes.
- **Fiche audit à 9 onglets** : Résumé (taux de conformité, points forts/vigilance), Périmètre & objectifs, **Grille d'audit** (mode conduite question par question avec navigation Précédent/Suivant et barre de progression), Constats (6 types : point fort, conforme, vigilance, opportunité, écart, non-conformité majeure — avec qualification de gravité et cause potentielle), Parties prenantes (contributions et relances simulées), Analyse (comparaison avec les audits précédents du même processus, distinguant toujours *fait constaté* et *analyse proposée*), Traçabilité (question → exigence → preuve → constat → action/NC), Rapport, Validation (workflow en 8 étapes : Planifié → Préparation → En cours → Analyse → Synthèse → À valider → Validé → Clôturé).
- **Non-duplication stricte** : un constat « écart » peut créer une non-conformité directement dans le module Événements (jamais une base séparée), une action dans le module Actions (origine « Audit »), et se relier à un risque existant du registre.
- **Tableau de bord Audits** : à venir / en cours / en retard / clôturés, écarts issus des audits, actions en cours, taux de conformité moyen.
- **Programme d'audit** (`#/audits/programme`) : priorités suggérées par processus selon la criticité du risque, l'historique des écarts et l'ancienneté du dernier audit.
- Chaque audit alimente automatiquement le **moteur de conformité des Référentiels** et la **Revue de Direction** — aucune ressaisie.

### Compétences & Habilitations

Formalise ce qui existait jusque-là de façon dispersée (pilotes de processus, formations liées aux documents) en un véritable module RH connecté au reste du SMQ.

- **4 référentiels** : compétences (23 démo, niveaux 0 « Non acquis » à 4 « Référent / Expert »), postes/fonctions (avec compétences requises et niveau minimum), habilitations (durée de validité, autorité, prérequis), collaborateurs (11 démo, réutilisant les pilotes de processus déjà présents dans Qonnect).
- **Matrice individuelle par collaborateur** avec **calcul automatique de l'écart** (niveau requis vs dernier niveau évalué) — jamais saisi manuellement.
- **Historique d'évaluations append-only** : chaque évaluation s'ajoute à l'historique, rien n'est jamais écrasé.
- **Preuves de compétence** (certificat, attestation, entretien, observation, test…) pouvant pointer vers un document Qonnect déjà existant plutôt que d'en recréer un.
- **Écart → action de développement** créée directement dans le module Actions (origine « Compétence »), pas de seconde base.
- **Référentiel des habilitations séparé**, avec attribution, renouvellement et **statuts calculés automatiquement** (🟢 Valide / 🟠 Expire bientôt / 🔴 Expirée / ⏸ Suspendue) et historique de traçabilité complet (attribution, suspension, renouvellement).
- **Revues de compétences périodiques** conservées avec historique.
- **Matrice globale** personnes × compétences avec filtres (service, poste, compétence).
- **Dashboard dédié** (effectif, % conformes, écarts, formations à réaliser, habilitations actives/expirant/expirées, revues à réaliser) et une **Vue Auditeur** répondant directement aux 9 questions type d'un audit RH — la donnée de démonstration est volontairement câblée sur l'audit RH déjà présent (AUD-005) pour que le lien soit immédiatement visible.

### Fournisseurs

Le trou fonctionnel le plus visible du prototype, comblé sans réinventer ce qui existait déjà : les risques, audits, actions et non-conformités fournisseurs vivent dans les registres existants (Risques, Audits, Actions, Événements) via un simple champ `fournisseurId` — aucune seconde base créée.

- **8 fournisseurs de démonstration** réalistes (Microsoft, OVHcloud, Orange Business, Bureau Veritas, Docaposte, Transport Express, MaintenancePro, Composants Précis SARL — ce dernier étant le fournisseur unique déjà identifié dans `RISK-001`, pour que le lien soit visible dès l'ouverture).
- **Fiche fournisseur à 9 onglets** : Identification, Produits & services, Documents (avec échéances calculées automatiquement — 🟢 Valide / 🟠 À renouveler / 🔴 Expiré), Évaluations, Incidents, Risques, Audits, Actions, Performance.
- **Moteur d'évaluation** avec critères pondérés et modèles de questionnaires réutilisables (fournisseur informatique, fournisseur critique, hébergeur HDS, sous-traitant DM, prestataire qualité) — niveau calculé automatiquement (Excellent → Critique).
- **Incidents fournisseurs**, distincts des non-conformités par principe, mais pouvant créer une NC ou une action en un clic — sans dupliquer.
- **Score de performance composite transparent** (évaluation, incidents, écarts d'audit, risques ouverts, actions en retard).
- **Vue Fournisseurs critiques** dédiée aux Achats, à la Qualité et à la Direction.
- **Deux intégrations transversales concrètes** : l'exigence ISO 9001 §8.4 (« Maîtrise des processus, produits et services fournis par des tiers ») affiche désormais automatiquement les fournisseurs concernés par processus ; la Revue de Direction affiche une section « Performance des fournisseurs » avec les fournisseurs à surveiller.

### Groupe / Établissements / Services — architecture multi-site

Qonnect reste un SMQ générique unique, désormais capable de représenter un groupe multi-établissements sans créer de second système : chaque établissement et service est une dimension transversale posée sur les registres existants (Risques, Actions, Événements, Fournisseurs, Audits, Documents), jamais une copie de ceux-ci.

- **Hiérarchie Groupe → Établissements → Services**, avec un établissement et un service de démonstration supplémentaires (Site Sud / Ligne Sud) illustrant un second site de production.
- **Sélecteur de périmètre** dans l'en-tête (pastille 🏢) : bascule instantanément entre la vision Groupe, un établissement ou un service précis — le choix est mémorisé (`localStorage`) et relu au rechargement.
- **Migration à zéro perte de données** : aucune donnée existante n'a été retaguée à la main. Tout enregistrement sans `etablissementId` est automatiquement rattaché à l'établissement par défaut (Siège) via `entity.etablissementId || DEFAULT_ETABLISSEMENT_ID` — rien ne casse, rien n'est dupliqué.
- **Élément transversal explicite** : un enregistrement peut porter `etablissementId:"GROUPE"` pour rester visible à tous les périmètres (ex. le risque Cyberattaque, par nature transverse) ; un fournisseur peut lister plusieurs établissements clients (`etablissementIds`) sans être dupliqué (ex. MaintenancePro, partagé entre le Siège et le Site Sud).
- **Filtrage par périmètre appliqué aux listes** : Risques, Actions, Événements/Non-conformités, Fournisseurs, Audits (tableau de bord et liste) et la vue « Tous les documents » se filtrent selon le périmètre actif, sans dupliquer aucune logique métier.
- **Vision Groupe** (nouvelle page) : KPI consolidés (établissements, services, risques élevés, audits, incidents fournisseurs) et un tableau de comparaison par établissement (services, risques ouverts, actions en retard, écarts d'audit) avec accès direct « Voir ce périmètre → ».
- **Restent volontairement transversaux**, quel que soit le périmètre choisi : la Revue de Direction et les Référentiels — un SMQ ne se pilote pas établissement par établissement sur ces deux points, conformément à l'esprit ISO 9001.

## Limites du prototype

- Les exigences du référentiel ISO 9001:2026 affichées sont **simplifiées à des fins de démonstration** et ne reproduisent pas le texte officiel de la norme.
- Qonnect AI simule des réponses à partir des données locales : il ne s'agit pas d'un véritable modèle d'IA connecté à une API.
- Il n'y a pas d'authentification réelle ni de gestion multi-utilisateurs : les données sont locales au navigateur.
