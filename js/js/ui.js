/* ============================================================
   QONNECT — Composants UI réutilisables
   ============================================================ */

function esc(str){
  if(str===undefined||str===null) return "";
  return String(str).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function fmtDate(iso){
  if(!iso || iso==="—") return "—";
  const d = new Date(iso+"T00:00:00");
  if(isNaN(d)) return iso;
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"});
}

function badge(labelObj, extra){
  if(!labelObj) return "";
  return `<span class="badge badge-${labelObj.c}">${extra?extra+" ":""}<span class="badge-dot"></span>${esc(labelObj.l)}</span>`;
}
function badgeRaw(colorClass, text){
  return `<span class="badge badge-${colorClass}"><span class="badge-dot"></span>${esc(text)}</span>`;
}

function jsonAttr(obj){
  // Safely embed a JS object as a single-quoted HTML attribute value: HTML-escaping
  // handles apostrophes/quotes inside free text so the attribute never breaks early.
  return esc(JSON.stringify(obj));
}

/* ---------- Toasts ---------- */
function toast(msg, icon){
  let stack = document.getElementById("toast-stack");
  if(!stack){
    stack = document.createElement("div");
    stack.id = "toast-stack";
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span>${icon||"✓"}</span><span>${esc(msg)}</span>`;
  stack.appendChild(t);
  setTimeout(()=>{ t.style.opacity="0"; t.style.transition="opacity .25s"; setTimeout(()=>t.remove(),250); }, 2600);
}

/* ---------- Modal ---------- */
function openModal({title, bodyHtml, footHtml, wide, onMount}){
  closeModal();
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "active-overlay";
  overlay.innerHTML = `
    <div class="modal ${wide?'wide':''}">
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <button class="modal-close" data-close-modal>✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footHtml?`<div class="modal-foot">${footHtml}</div>`:""}
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", e=>{ if(e.target===overlay) closeModal(); });
  overlay.querySelector("[data-close-modal]").addEventListener("click", closeModal);
  if(onMount) onMount(overlay);
}
function closeModal(){
  const o = document.getElementById("active-overlay");
  if(o) o.remove();
}

/* ---------- Side panel ---------- */
function openPanel({title, subtitle, bodyHtml, footHtml, onMount}){
  closePanel();
  const scrim = document.createElement("div");
  scrim.className = "panel-overlay";
  scrim.id = "active-panel-overlay";
  document.body.appendChild(scrim);
  scrim.addEventListener("click", closePanel);

  const panel = document.createElement("div");
  panel.className = "side-panel";
  panel.id = "active-panel";
  panel.innerHTML = `
    <div class="panel-head">
      <div>
        ${subtitle?`<div class="text-xs" style="text-transform:uppercase;font-weight:700;letter-spacing:.04em;">${esc(subtitle)}</div>`:""}
        <h3 style="margin-top:4px;">${esc(title)}</h3>
      </div>
      <button class="modal-close" data-close-panel>✕</button>
    </div>
    <div class="panel-body">${bodyHtml}</div>
    ${footHtml?`<div class="panel-foot">${footHtml}</div>`:""}
  `;
  document.body.appendChild(panel);
  panel.querySelector("[data-close-panel]").addEventListener("click", closePanel);
  if(onMount) onMount(panel);
}
function closePanel(){
  const p = document.getElementById("active-panel");
  const s = document.getElementById("active-panel-overlay");
  if(p) p.remove();
  if(s) s.remove();
}

/* ---------- Confirm dialog ---------- */
function confirmDialog(message, onConfirm){
  openModal({
    title:"Confirmation",
    bodyHtml:`<p>${esc(message)}</p>`,
    footHtml:`<button class="btn btn-secondary" data-close-modal>Annuler</button><button class="btn btn-primary" id="confirm-yes">Confirmer</button>`,
    onMount:(overlay)=>{
      overlay.querySelector("#confirm-yes").addEventListener("click", ()=>{ closeModal(); onConfirm(); });
    }
  });
}

/* ---------- Empty state ---------- */
function emptyState(emoji, title, text, ctaHtml){
  return `<div class="empty-state">
    <div class="emoji">${emoji}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${ctaHtml||""}
  </div>`;
}

/* ---------- Workflow stepper ---------- */
function workflowStepper(steps, currentIndex){
  return `<div class="workflow">${steps.map((s,i)=>{
    const cls = i < currentIndex ? "done" : (i===currentIndex ? "current" : "");
    const num = i < currentIndex ? "✓" : (i+1);
    return `${i>0?`<div class="wf-line ${i<=currentIndex?'done':''}"></div>`:""}<div class="wf-step ${cls}">
      <div class="wf-circle">${num}</div>
      <div class="wf-label">${esc(s)}</div>
    </div>`;
  }).join("")}</div>`;
}

/* ---------- Ring gauge (svg) ---------- */
function ringGauge(pct, colorVar, size){
  size = size||56;
  const r = (size-8)/2, c = 2*Math.PI*r;
  const offset = c - (pct/100)*c;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle class="ring-bg" cx="${size/2}" cy="${size/2}" r="${r}"></circle>
    <circle class="ring-fg" cx="${size/2}" cy="${size/2}" r="${r}" stroke="${colorVar}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
  </svg>`;
}

/* ---------- Tabs helper ----------
   containerSel: selector of element to render tabs into ('.tabs')
   tabs: [{id,label}], active id, onSelect(id) */
function renderTabs(tabs, activeId){
  return `<div class="tabs">${tabs.map(t=>`<button class="tab ${t.id===activeId?'active':''}" data-tab="${t.id}">${esc(t.label)}</button>`).join("")}</div>`;
}

/* ---------- Breadcrumb ---------- */
function breadcrumb(items){
  // items: [{label, href}] last one is current (no href)
  return `<div class="breadcrumb">${items.map((it,i)=>{
    const isLast = i===items.length-1;
    return `${i>0?'<span class="sep">/</span>':''}${isLast?`<span class="current">${esc(it.label)}</span>`:`<a href="${it.href}">${esc(it.label)}</a>`}`;
  }).join("")}</div>`;
}
