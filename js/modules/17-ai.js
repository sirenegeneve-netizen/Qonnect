/* ============================================================
   16. QONNECT AI (simulée)
   ============================================================ */
let AI_HISTORY = [
  {role:"bot", text:"Bonjour, je suis Qonnect AI. Je peux vous aider à piloter votre système de management à partir de vos données. Que souhaitez-vous savoir ?"}
];
const AI_SUGGESTIONS = [
  "Quels sont mes principaux risques ?",
  "Prépare mon audit Achats.",
  "Quelles procédures doivent être révisées ?",
  "Que dois-je traiter aujourd'hui ?",
  "Prépare ma revue de direction.",
];

function pageAI(){
  return `
  ${pageHeader("Qonnect AI","Posez une question sur votre système de management — les réponses s'appuient sur vos données locales.")}
  <div class="card" style="padding:0;">
    <div class="ai-shell" style="padding:20px;">
      <div class="ai-messages" id="ai-messages">
        ${AI_HISTORY.map(aiMsgHtml).join("")}
      </div>
      <div class="ai-suggestions">
        ${AI_SUGGESTIONS.map(s=>`<button class="chip" data-ai-suggest="${esc(s)}">${esc(s)}</button>`).join("")}
      </div>
      <div class="ai-input-row">
        <input type="text" id="ai-input" placeholder="Écrivez votre question…" autocomplete="off">
        <button class="btn btn-primary" id="ai-send">Envoyer</button>
      </div>
    </div>
  </div>`;
}
function aiMsgHtml(m){
  return `<div class="ai-msg ${m.role==='user'?'user':'bot'}">
    <div class="ai-avatar">${m.role==='user'?'🙂':'🤖'}</div>
    <div class="ai-bubble">${m.text}</div>
  </div>`;
}
function aiScrollBottom(){
  const el = document.getElementById("ai-messages");
  if(el) el.scrollTop = el.scrollHeight;
}
function aiSend(text){
  text = text.trim();
  if(!text) return;
  AI_HISTORY.push({role:"user", text:esc(text)});
  const reply = aiGenerateReply(text);
  AI_HISTORY.push({role:"bot", text:reply});
  const zone = document.getElementById("ai-messages");
  if(zone){
    zone.innerHTML = AI_HISTORY.map(aiMsgHtml).join("");
    aiScrollBottom();
  }
}
function aiGenerateReply(q){
  const low = q.toLowerCase();
  if(low.includes("risque")){
    const top = DB.risks.filter(r=>r.type==="risque" && r.status==="ouvert").sort((a,b)=>(b.probability*b.impact)-(a.probability*a.impact)).slice(0,3);
    return `Voici vos principaux risques ouverts, triés par criticité :<ul>${top.map(r=>{const p=getProcess(r.processId);return `<li><strong>${esc(r.name)}</strong> (${LABELS.riskLevel[r.level].l}) — processus ${p?esc(p.name):"—"}</li>`;}).join("")}</ul>Je vous recommande de prioriser le risque le plus critique et de vérifier que des actions sont en place.`;
  }
  if(low.includes("audit") && low.includes("achat")){
    const a = DB.audits.find(a=>a.processId==="PROC-007");
    const risks = DB.risks.filter(r=>r.processId==="PROC-007");
    const nc = DB.events.filter(e=>e.processId==="PROC-007" && e.type==="non_conformite");
    return `Voici les éléments à considérer pour préparer l'audit Achats${a?` du ${fmtDate(a.date)}`:""} :<ul>
      <li>${risks.length} risque(s) sur ce processus, dont ${risks.filter(r=>r.level==='critique').length} critique(s)</li>
      <li>${nc.length} non-conformité(s) récente(s) à examiner</li>
      <li>Procédure de référence : PR-005 — Gestion des achats et évaluation fournisseurs</li>
    </ul>Souhaitez-vous que j'ouvre la fiche du processus Achats ?`;
  }
  if(low.includes("procédure") && (low.includes("révis")||low.includes("reviser")||low.includes("revoir"))){
    const docs = DB.documents.filter(d=>d.status==="a_reviser");
    return docs.length ? `Ces documents doivent être révisés prochainement :<ul>${docs.map(d=>`<li><strong>${esc(d.title)}</strong> (${esc(d.ref)}) — révision prévue le ${fmtDate(d.nextReview)}</li>`).join("")}</ul>` : `Aucun document n'est actuellement en attente de révision. 👍`;
  }
  if(low.includes("aujourd") || low.includes("traiter")){
    const retard = DB.actions.filter(a=>a.status==="retard");
    const nc = DB.events.filter(e=>e.type==="non_conformite" && e.status==="ouvert");
    return `Voici ce qui mérite votre attention aujourd'hui :<ul>
      <li>${retard.length} action(s) en retard</li>
      <li>${nc.length} non-conformité(s) ouverte(s)</li>
      <li>${DB.audits.filter(a=>a.status==='planifie').length} audit(s) à préparer</li>
    </ul>Je vous conseille de commencer par les actions en retard.`;
  }
  if(low.includes("revue de direction")){
    const nc = DB.events.filter(e=>e.type==="non_conformite");
    const obj = DB.objectives;
    return `Éléments suggérés pour votre revue de direction :<ul>
      <li>${nc.length} non-conformité(s) sur la période, dont ${nc.filter(e=>e.status==='ouvert').length} ouverte(s)</li>
      <li>${obj.filter(o=>o.status==='atteint').length}/${obj.length} objectifs atteints</li>
      <li>${DB.audits.filter(a=>a.status!=='planifie').length} audit(s) réalisé(s)</li>
      <li>${DB.risks.filter(r=>r.level==='critique'&&r.status==='ouvert').length} risque(s) critique(s) ouvert(s)</li>
    </ul>Je peux vous aider à structurer le compte-rendu si vous le souhaitez.`;
  }
  return `Je n'ai pas encore de réponse préparée pour cette question dans ce prototype, mais je peux vous renseigner sur vos risques, vos audits, vos documents à réviser, vos actions du jour ou votre revue de direction.`;
}

