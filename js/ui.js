// Composants UI réutilisables pour Qonnect

const ui = {
  card(title, content) {
    return `
      <div class="card">
        <h3>${title}</h3>
        ${content || ""}
      </div>
    `;
  },

  badge(status) {
    const map = {
      "En vigueur": { cls: "success", label: "🟢 En vigueur" },
      "À réviser": { cls: "warning", label: "🟠 À réviser" },
      "En retard": { cls: "danger", label: "🔴 En retard" }
    };
    const conf = map[status] || { cls: "info", label: status };
    return `<span class="badge ${conf.cls}">${conf.label}</span>`;
  },

  empty(message, actionLabel) {
    return `
      <div class="empty-state">
        <p>${message}</p>
        ${actionLabel ? `<button class="button primary">${actionLabel}</button>` : ""}
      </div>
    `;
  },

  dashboard(qData) {
    return `
      <section>
        <h2 class="section-title">Bonjour 👋</h2>
        <p>Voici ce qui mérite votre attention.</p>

        <div class="grid-3">
          ${ui.card("À traiter", `
            <ul>
              <li>🔴 ${qData.actions.filter(a => a.statut === "En retard").length} actions en retard</li>
              <li>🔴 ${qData.risques.filter(r => r.niveau === "Critique").length} risques critiques</li>
              <li>🔴 ${qData.evenements.filter(e => e.statut === "Ouvert").length} événements ouverts</li>
            </ul>
          `)}

          ${ui.card("À surveiller", `
            <ul>
              <li>🟠 ${qData.indicateurs.filter(i => i.valeur < i.cible).length} indicateurs hors cible</li>
              <li>🟠 ${qData.documents.length} documents à suivre</li>
            </ul>
          `)}

          ${ui.card("SMQ", `
            <ul>
              <li>94 % Actions dans les délais</li>
              <li>97 % Documents à jour</li>
              <li>89 % Objectifs suivis</li>
            </ul>
          `)}
        </div>
      </section>
    `;
  },

  processusList(qData) {
    if (!qData.processus.length) {
      return ui.empty("Aucun processus n'est encore enregistré.", "+ Créer un processus");
    }

    return `
      <section>
        <h2 class="section-title">Processus</h2>
        ${qData.processus.map(p => ui.card(p.nom, `
          <p>${p.type}</p>
          <p>Pilote : ${p.pilote}</p>
          <p>Risques : ${p.risques.length} · Documents : ${p.documents.length} · Indicateurs : ${p.indicateurs.length}</p>
        `)).join("")}
      </section>
    `;
  },

  documentsList(qData) {
    if (!qData.documents.length) {
      return ui.empty("Aucun document n'est encore enregistré.", "+ Créer un document");
    }

    return `
      <section>
        <h2 class="section-title">Documents</h2>
        ${qData.documents.map(d => ui.card(`${d.ref} — ${d.titre}`, `
          <p>${d.type}</p>
          <p>${ui.badge(d.statut)}</p>
          <p>Processus : ${d.processus}</p>
        `)).join("")}
      </section>
    `;
  },

  risquesList(qData) {
    if (!qData.risques.length) {
      return ui.empty("Aucun risque n'est encore enregistré.", "+ Identifier un risque");
    }

    return `
      <section>
        <h2 class="section-title">Risques</h2>
        ${qData.risques.map(r => ui.card(r.nom, `
          <p>Processus : ${r.processus}</p>
          <p>Niveau : ${r.niveau}</p>
        `)).join("")}
      </section>
    `;
  }
};
