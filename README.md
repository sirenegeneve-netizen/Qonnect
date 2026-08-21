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
│   └── app.js             # Routeur, pages, interactions
│
└── assets/
    └── icons/
```

## Navigation

L'application est une SPA pilotée par le hash de l'URL (`#/module/id/onglet`), ce qui permet d'utiliser le bouton retour du navigateur et de partager un lien direct vers une fiche.

Principaux modules : Vue d'ensemble · **Contexte & Stratégie** · Processus · Risques & opportunités · Objectifs & indicateurs · Changements · Documentation du SMQ · Événements · Actions · Audits · Référentiels · Conformité · Qonnect AI · Administration.

### Contexte & Stratégie

Ce module est le point de départ du système : il permet de décrire les enjeux externes et internes de l'organisation, ses parties intéressées et leurs besoins/attentes/exigences, ses enjeux climatiques et ses orientations stratégiques.

Un **assistant de construction** (`#/contexte/assistant`) permet de décrire une difficulté en langage naturel ; Qonnect suggère alors un enjeu, des parties intéressées concernées, des risques, des opportunités, des objectifs et des actions. Chaque élément accepté est créé dans le module correspondant et reste **tracé** jusqu'à l'enjeu d'origine (`sourceContext`), visible sur la fiche risque et sur la carte objectif.

La **carte stratégique** (`#/contexte/carte`) donne une vue d'ensemble du flux Contexte → Risques/Opportunités → Objectifs → Actions → Indicateurs → Résultats.

## Limites du prototype

- Les exigences du référentiel ISO 9001:2026 affichées sont **simplifiées à des fins de démonstration** et ne reproduisent pas le texte officiel de la norme.
- Qonnect AI simule des réponses à partir des données locales : il ne s'agit pas d'un véritable modèle d'IA connecté à une API.
- Il n'y a pas d'authentification réelle ni de gestion multi-utilisateurs : les données sont locales au navigateur.
