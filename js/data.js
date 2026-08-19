// Données fictives interconnectées pour le prototype Qonnect

const qData = {
  processus: [
    {
      id: "PROC-ACHATS",
      nom: "Achats",
      type: "Support",
      pilote: "Sophie Martin",
      finalite: "Garantir la disponibilité et la conformité des produits et services achetés.",
      risques: ["RISK-FRS-UNIQUE"],
      documents: ["DOC-PR-ACHATS"],
      indicateurs: ["IND-TPS-LIVRAISON"],
      evenements: ["EV-NC-LIV-ABC"],
      actions: ["ACT-ACHATS-01"],
      audits: ["AUD-ACHATS-2026"],
      changements: ["CHG-ACHATS-01"]
    }
  ],

  documents: [
    {
      id: "DOC-PR-ACHATS",
      ref: "PR-004",
      titre: "Gestion des non-conformités",
      type: "Procédure",
      version: "3.0",
      statut: "En vigueur",
      processus: "PROC-ACHATS",
      prochaineRevision: "2027-08-15"
    }
  ],

  risques: [
    {
      id: "RISK-FRS-UNIQUE",
      nom: "Dépendance à un fournisseur unique",
      processus: "PROC-ACHATS",
      niveau: "Critique",
      probabilite: 4,
      gravite: 4
    }
  ],

  evenements: [
    {
      id: "EV-NC-LIV-ABC",
      type: "Non-conformité",
      description: "Retard livraison fournisseur ABC",
      processus: "PROC-ACHATS",
      statut: "Ouvert"
    }
  ],

  actions: [
    {
      id: "ACT-ACHATS-01",
      titre: "Diversifier les fournisseurs critiques",
      responsable: "Sophie Martin",
      echeance: "2026-09-30",
      priorite: "Haute",
      statut: "En retard",
      origine: "RISK-FRS-UNIQUE"
    }
  ],

  indicateurs: [
    {
      id: "IND-TPS-LIVRAISON",
      nom: "Taux de livraisons dans les délais",
      valeur: 82,
      cible: 95,
      tendance: "stable",
      processus: "PROC-ACHATS"
    }
  ],

  audits: [
    {
      id: "AUD-ACHATS-2026",
      titre: "Audit processus Achats",
      date: "2026-06-12",
      statut: "Prévu",
      processus: "PROC-ACHATS"
    }
  ],

  changements: [
    {
      id: "CHG-ACHATS-01",
      titre: "Changement de politique fournisseurs",
      statut: "En cours",
      impacte: ["PROC-ACHATS", "DOC-PR-ACHATS", "RISK-FRS-UNIQUE"]
    }
  ],

  objectifs: [
    {
      id: "OBJ-RECLAMATIONS",
      titre: "Réduire les réclamations clients",
      cible: "-15%",
      progression: 72,
      statut: "En cours"
    }
  ],

  referentiels: [
    {
      id: "REF-ISO9001",
      nom: "ISO 9001:2026",
      maitrise: 82,
      maitriseOK: 74,
      aRenforcer: 12,
      nonCouvertes: 6
    }
  ]
};
