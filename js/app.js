// Logique principale de navigation et rendu

const root = document.getElementById("app-root");
const pageTitle = document.getElementById("page-title");
const menuItems = document.querySelectorAll(".sidebar nav .item");
const searchInput = document.getElementById("global-search");

function render(view) {
  switch (view) {
    case "dashboard":
      pageTitle.textContent = "Vue d'ensemble";
      root.innerHTML = ui.dashboard(qData);
      break;

    case "processus":
      pageTitle.textContent = "Processus";
      root.innerHTML = ui.processusList(qData);
      break;

    case "documents":
      pageTitle.textContent = "Documents";
      root.innerHTML = ui.documentsList(qData);
      break;

    case "risques":
      pageTitle.textContent = "Risques & opportunités";
      root.innerHTML = ui.risquesList(qData);
      break;

    default:
      pageTitle.textContent = "Vue d'ensemble";
      root.innerHTML = ui.dashboard(qData);
  }
}

menuItems.forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const view = item.getAttribute("data-view");
    render(view);
  });
});

searchInput.addEventListener("input", e => {
  const term = e.target.value.toLowerCase().trim();
  if (!term) return;

  const results = [];

  qData.processus.forEach(p => {
    if (p.nom.toLowerCase().includes(term)) results.push(`Processus : ${p.nom}`);
  });

  qData.documents.forEach(d => {
    if (d.titre.toLowerCase().includes(term) || d.ref.toLowerCase().includes(term)) {
      results.push(`Document : ${d.ref} — ${d.titre}`);
    }
  });

  qData.risques.forEach(r => {
    if (r.nom.toLowerCase().includes(term)) results.push(`Risque : ${r.nom}`);
  });

  root.innerHTML = `
    <section>
      <h2 class="section-title">Résultats de recherche</h2>
      ${results.length
        ? results.map(r => `<div class="card"><p>${r}</p></div>`).join("")
        : ui.empty("Aucun résultat pour cette recherche.")}
    </section>
  `;
});

// rendu initial
render("dashboard");
