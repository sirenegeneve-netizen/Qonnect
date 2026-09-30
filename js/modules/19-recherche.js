/* ============================================================
   18. RECHERCHE GLOBALE
   ============================================================ */
function globalSearch(q){
  q = q.trim().toLowerCase();
  if(!q) return {};
  const res = {};
  res["Processus"] = DB.processes.filter(p=>p.name.toLowerCase().includes(q)).map(p=>({label:p.name, route:`processus/${p.id}`}));
  res["Documents"] = DB.documents.filter(d=>d.title.toLowerCase().includes(q)||d.ref.toLowerCase().includes(q)).map(d=>({label:d.title, route:`documents/${d.type}/${d.id}`}));
  res["Risques"] = DB.risks.filter(r=>r.name.toLowerCase().includes(q)).map(r=>({label:r.name, route:`risques/${r.id}`}));
  res["Événements"] = DB.events.filter(e=>e.title.toLowerCase().includes(q)||e.ref.toLowerCase().includes(q)).map(e=>({label:e.title, route:`evenements/${e.type}/${e.id}`}));
  res["Actions"] = DB.actions.filter(a=>a.title.toLowerCase().includes(q)).map(a=>({label:a.title, route:`actions`}));
  res["Audits"] = DB.audits.filter(a=>a.title.toLowerCase().includes(q)).map(a=>({label:a.title, route:`audits/${a.id}`}));
  res["Indicateurs"] = DB.indicators.filter(i=>i.name.toLowerCase().includes(q)).map(i=>({label:i.name, route:`objectifs`}));
  Object.keys(res).forEach(k=>{ if(!res[k].length) delete res[k]; });
  return res;
}
function renderSearchResults(q){
  const box = document.getElementById("search-results");
  if(!q.trim()){ box.classList.remove("open"); box.innerHTML=""; return; }
  const groups = globalSearch(q);
  const keys = Object.keys(groups);
  if(!keys.length){
    box.innerHTML = `<div class="search-empty">Aucun résultat pour « ${esc(q)} »</div>`;
  } else {
    box.innerHTML = keys.map(k=>`
      <div class="search-cat">${esc(k)}</div>
      ${groups[k].slice(0,5).map(r=>`<div class="search-row" data-route="${r.route}" data-close-search><span class="n">${esc(r.label)}</span></div>`).join("")}
    `).join("");
  }
  box.classList.add("open");
}

