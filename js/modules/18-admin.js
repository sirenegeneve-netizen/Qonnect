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
    <div class="card">
      <h3 class="mb-2">Données du prototype</h3>
      <p class="text-sm mb-2">Toutes les données sont stockées localement dans votre navigateur (localStorage). Aucune donnée n'est envoyée à un serveur.</p>
      <button class="btn btn-danger" id="reset-data-btn">Réinitialiser les données de démonstration</button>
    </div>
  </div>`;
}

