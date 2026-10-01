/* ============================================================
   EXTRACTION DE TEXTE DEPUIS UN FICHIER (PDF, DOCX, TXT, HTML)
   Tout se passe dans le navigateur : le fichier n'est jamais envoyé nulle part.
   Les bibliothèques (pdf.js, mammoth) sont chargées uniquement à la demande.
   ============================================================ */
const _scriptsLoaded = {};
function loadScriptOnce(src){
  if(_scriptsLoaded[src]) return _scriptsLoaded[src];
  _scriptsLoaded[src] = new Promise((resolve,reject)=>{
    const s = document.createElement("script");
    s.src = src; s.onload = resolve;
    s.onerror = ()=>{ delete _scriptsLoaded[src]; reject(new Error("Impossible de charger "+src)); };
    document.head.appendChild(s);
  });
  return _scriptsLoaded[src];
}
function readFileAs(file, mode){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=>resolve(r.result);
    r.onerror = ()=>reject(new Error("Lecture du fichier impossible."));
    mode==="buffer" ? r.readAsArrayBuffer(file) : r.readAsText(file);
  });
}

/* Reconstitue des lignes à partir des fragments de texte d'une page PDF (regroupés par position verticale). */
function pdfItemsToLines(items){
  const rows = [];
  items.forEach(it=>{
    if(!it.str || !it.str.trim()) return;
    const y = it.transform[5], x = it.transform[4];
    let row = rows.find(r=>Math.abs(r.y-y) <= 2.5);
    if(!row){ row = { y, parts:[] }; rows.push(row); }
    row.parts.push({ x, str:it.str });
  });
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=> r.parts.sort((a,b)=>a.x-b.x).map(p=>p.str).join(" ").replace(/\s+/g," ").trim());
}

async function extractPdfText(file, onProgress){
  await loadScriptOnce("js/vendor/pdf.min.js");
  /* Le fichier « worker » est chargé comme un script normal : cela fonctionne aussi en ouvrant index.html directement (file://). */
  await loadScriptOnce("js/vendor/pdf.worker.min.js");
  const data = new Uint8Array(await readFileAs(file,"buffer"));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for(let n=1; n<=pdf.numPages; n++){
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    pages.push(pdfItemsToLines(content.items).join("\n"));
    if(onProgress) onProgress(n, pdf.numPages);
  }
  const text = pages.join("\n\n").trim();
  if(text.replace(/\s/g,"").length < 40){
    throw new Error("Ce PDF ne contient pas de texte exploitable (document scanné ?). La reconnaissance de texte sur image n'est pas prise en charge : utilisez une version texte du document.");
  }
  return text;
}

async function extractDocxText(file){
  await loadScriptOnce("js/vendor/mammoth.browser.min.js");
  const res = await mammoth.extractRawText({ arrayBuffer: await readFileAs(file,"buffer") });
  const text = (res.value||"").trim();
  if(!text) throw new Error("Aucun texte trouvé dans ce document Word.");
  return text;
}

/* Point d'entrée : retourne le texte du fichier, ou lève une erreur au message lisible. */
async function extractTextFromFile(file, onProgress){
  const name = file.name.toLowerCase();
  if(name.endsWith(".pdf")) return extractPdfText(file, onProgress);
  if(name.endsWith(".docx")) return extractDocxText(file);
  if(name.endsWith(".doc")) throw new Error("L'ancien format .doc n'est pas pris en charge : enregistrez le document en .docx.");
  if(/\.(txt|md)$/.test(name)) return (await readFileAs(file,"text")).trim();
  if(/\.html?$/.test(name)) return String(await readFileAs(file,"text")).replace(/<[^>]+>/g," ").replace(/[ \t]+/g," ").trim();
  throw new Error("Format non pris en charge. Formats acceptés : PDF, DOCX, TXT, HTML.");
}
