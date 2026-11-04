/* ============================================================
   21. INITIALISATION
   Rien n'est affiché de l'application (ni lu) tant que l'utilisateur n'est pas connecté : voir js/auth.js.
   ============================================================ */
function startApp(){
  buildShell();
  initGlobalEvents();
  authAdminEvents();
  authStartIdleWatch();
  render();
}
document.addEventListener("DOMContentLoaded", ()=>{
  if(AUTH.status!=="unlocked"){ authShowGate(); return; }
  startApp();
});
