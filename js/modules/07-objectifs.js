/* ============================================================
   9. OBJECTIFS & INDICATEURS
   ============================================================ */
function pageObjectives(){
  return `
  ${pageHeader("Objectifs & indicateurs","Pilotage de la performance du système de management.",
    `<button class="btn btn-primary" data-open-quick="objective">+ Créer un objectif</button>`)}
  <div class="section">
    <div class="section-head"><h2>Objectifs</h2></div>
    <div class="grid grid-2">
      ${DB.objectives.map(o=>{
        const p = getProcess(o.processId);
        return `<div class="card">
          <div class="flex justify-between items-center">
            <h3>${esc(o.title)}</h3>${badge(LABELS.objStatus[o.status])}
          </div>
          ${o.sourceContext?`<p class="text-xs mt-2">🧭 Issu de l'enjeu « ${esc(o.sourceContext.label)} »</p>`:""}
          <p class="text-sm mt-2">Cible : ${esc(o.target)} · Processus : ${p?esc(p.name):"—"}</p>
          <div class="flex justify-between items-center mt-4"><span class="text-sm">Progression</span><span class="text-sm" style="font-weight:700;color:var(--text-primary)">${o.progress}%</span></div>
          <div class="progress mt-2"><div style="width:${o.progress}%"></div></div>
          <div class="mt-4">
            ${(o.indicatorIds||[]).map(iid=>{const i=getIndicator(iid); if(!i) return ""; return `<div class="rel-link"><span class="rel-name">${esc(i.name)}</span>${badge(LABELS.indStatus[i.status])}</div>`;}).join("")}
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
  <div class="section">
    <div class="section-head"><h2>Indicateurs</h2></div>
    <div class="grid grid-3">
      ${DB.indicators.map(i=>{
        const p = getProcess(i.processId);
        const color = i.status==="vert"?"var(--success)":i.status==="orange"?"var(--warning)":"var(--danger)";
        return `<div class="card">
          <div class="flex justify-between items-center"><h3>${esc(i.name)}</h3>${badge(LABELS.indStatus[i.status])}</div>
          <div class="kpi mt-2"><div class="val" style="color:${color}">${esc(i.value)}</div><div class="lbl">${p?esc(p.name):"—"} · tendance ${i.trend>=0?"+":""}${i.trend}</div></div>
        </div>`;
      }).join("")}
    </div>
  </div>`;
}

