/* ============================================================
   17. ADMINISTRATION
   ============================================================ */
function pageAdmin(){
  return `
  ${pageHeader("Administration","Paramètres du prototype Qonnect.")}
  <div class="grid grid-2">
    <div class="card">
      <h3 class="mb-2">Organisation</h3>
      <p class="text-sm">Nom : Acme Industries</p>
      <p class="text-sm mt-2">Référentiel actif : ${DB.referentiels.find(r=>r.active)?.name || "—"}</p>
      <p class="text-sm mt-2">Utilisateurs : 12 (démonstration)</p>
    </div>
    ${typeof adminAnalysisEngineCard==="function" ? adminAnalysisEngineCard() : ""}
    <div class="card">
      <h3 class="mb-2">Données du prototype</h3>
      <p class="text-sm mb-2">Toutes les données sont stockées localement dans votre navigateur (localStorage). Aucune donnée n'est envoyée à un serveur.</p>
      <button class="btn btn-danger" id="reset-data-btn">Réinitialiser les données de démonstration</button>
    </div>
    <div class="card">
      <h3 class="mb-2">Sauvegarde et restauration</h3>
      <p class="text-sm mb-2">Vos données restent dans ce navigateur : elles disparaissent si vous videz les données du site ou changez de navigateur. Exportez régulièrement un fichier de sauvegarde et conservez-le dans un endroit sûr.</p>
      <div class="flex gap-2">
        <button class="btn btn-primary" id="export-data-btn">⬇ Exporter mes données</button>
        <button class="btn btn-secondary" id="import-data-btn">⬆ Importer une sauvegarde</button>
      </div>
      <input type="file" id="import-data-file" accept="application/json,.json" style="display:none">
      <p class="text-sm mt-2">L'import remplace les données actuelles ; la version précédente est conservée de côté dans le navigateur.</p>
    </div>
  </div>`;
}

