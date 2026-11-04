/* ============================================================
   QONNECT — COMPTE, CONNEXION ET CHIFFREMENT DES DONNÉES (verrou local)
   ------------------------------------------------------------
   Qonnect fonctionne sans serveur : les données vivent dans ce navigateur. Un simple écran de connexion ne protégerait rien (il se contourne
   en lisant le stockage). La protection réelle est donc le CHIFFREMENT des données par le mot de passe :
     - les données sont chiffrées (XChaCha20-Poly1305, bibliothèque auditée @noble/ciphers) avec une clé de données aléatoire (DEK) ;
     - la DEK n'est jamais stockée en clair : elle est « enveloppée » deux fois, par une clé dérivée du mot de passe (PBKDF2-SHA256, 600 000 itérations)
       et par une clé dérivée de la CLÉ DE RÉCUPÉRATION (affichée une seule fois à la création) ;
     - changer de mot de passe ne rechiffre pas les données : seule l'enveloppe change ;
     - la DEK n'existe qu'en mémoire pendant la session ; verrouiller = effacer la clé et recharger la page ;
     - sans session déverrouillée, saveDB() refuse d'écrire : rien n'est jamais enregistré en clair.
   Ce que cela protège : les données au repos dans ce navigateur (disque, autre personne sur l'ordinateur). Ce que cela ne remplace pas : un serveur
   d'authentification pour un usage partagé entre plusieurs personnes.
   ============================================================ */

const AUTH_KEY = "qonnect_auth_v1";
const AUTH_TRY_KEY = "qonnect_auth_try";
const AUTH_PREFS_KEY = "qonnect_auth_prefs";
const AUTH_ITER_PW = 600000;
const AUTH_ITER_REC = 100000;
const AUTH_MIN_PASSWORD = 12;
const AUTH_AAD_DB = "qonnect:db:v1";
const AUTH_IDLE_CHOICES = [15, 30, 60, 120, 0];

function authRecord(){ try{ return JSON.parse(localStorage.getItem(AUTH_KEY)||"null"); }catch(e){ return null; } }
/* status : "setup" (aucun compte), "locked" (compte existant, non connecté), "unlocked". */
const AUTH = { dek:null, login:"", status: authRecord() ? "locked" : "setup", last:Date.now() };

/* ---------- Outils binaires ---------- */
const AUTH_ENC = new TextEncoder(), AUTH_DEC = new TextDecoder();
function authRand(n){ return crypto.getRandomValues(new Uint8Array(n)); }
function authToBin(u8){ let s = ""; for(let i=0;i<u8.length;i+=8192) s += String.fromCharCode.apply(null, u8.subarray(i, i+8192)); return s; }
function authFromBin(s){ const u = new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i] = s.charCodeAt(i); return u; }
function authB64(u8){ return btoa(authToBin(u8)); }
function authUnB64(b){ return authFromBin(atob(b)); }
function authAead(key, nonce, aad){ return NobleCiphers.xchacha20poly1305(key, nonce, AUTH_ENC.encode(aad)); }

/* ---------- Chiffrement des données (synchrone : saveDB reste synchrone) ---------- */
function authEncryptJson(obj, key){
  const k = key || AUTH.dek; if(!k) throw new Error("Application verrouillée.");
  const nonce = authRand(24);
  const ct = authAead(k, nonce, AUTH_AAD_DB).encrypt(AUTH_ENC.encode(JSON.stringify(obj)));
  const all = new Uint8Array(nonce.length + ct.length); all.set(nonce, 0); all.set(ct, nonce.length);
  return QONNECT_ENC_PREFIX + authToBin(all);
}
function authDecryptJson(str, key){
  const k = key || AUTH.dek; if(!k) throw new Error("Application verrouillée.");
  if(typeof str!=="string" || !str.startsWith(QONNECT_ENC_PREFIX)) throw new Error("Format de données inconnu.");
  const all = authFromBin(str.slice(QONNECT_ENC_PREFIX.length));
  if(all.length < 24+16) throw new Error("Données chiffrées tronquées.");
  const plain = authAead(k, all.subarray(0,24), AUTH_AAD_DB).decrypt(all.subarray(24));   /* lève une erreur si le contenu a été altéré */
  return JSON.parse(AUTH_DEC.decode(plain));
}

/* ---------- Dérivation de clés et enveloppes ---------- */
async function authDerive(secret, salt, iterations){
  const base = await crypto.subtle.importKey("raw", AUTH_ENC.encode(String(secret).normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name:"PBKDF2", hash:"SHA-256", salt, iterations }, base, 256));
}
const authLoginNorm = l => String(l||"").trim().toLowerCase();
const authPwSecret = (login, password) => authLoginNorm(login)+"\u0000"+password;   /* l'identifiant fait partie du secret : un mauvais identifiant échoue comme un mauvais mot de passe */
function authWrap(kek, dek, aad){ const nonce = authRand(24); return { n:authB64(nonce), c:authB64(authAead(kek, nonce, aad).encrypt(dek)) }; }
function authUnwrap(kek, w, aad){ return authAead(kek, authUnB64(w.n), aad).decrypt(authUnB64(w.c)); }   /* lève une erreur si la clé est fausse */

/* Clé de récupération : 160 bits aléatoires, écrits en base 32 (XXXX-XXXX-…). */
const AUTH_B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function authNewRecoveryKey(){
  const b = authRand(20); let bits = "", out = "";
  b.forEach(x=>{ bits += x.toString(2).padStart(8,"0"); });
  for(let i=0;i<bits.length;i+=5) out += AUTH_B32[parseInt(bits.slice(i,i+5),2)];
  return out.match(/.{1,4}/g).join("-");
}
const authRecNorm = k => String(k||"").toUpperCase().replace(/[^A-Z2-7]/g,"");

/* ---------- Mot de passe : règles ---------- */
function authPasswordIssue(login, password){
  if(!authLoginNorm(login)) return "Saisissez un identifiant.";
  if(String(password||"").length < AUTH_MIN_PASSWORD) return "Le mot de passe doit contenir au moins "+AUTH_MIN_PASSWORD+" caractères (une phrase de passe est idéale).";
  if(authLoginNorm(password)===authLoginNorm(login)) return "Le mot de passe ne doit pas être identique à l'identifiant.";
  if(/^(.)\1+$/.test(password)) return "Le mot de passe ne doit pas répéter un seul caractère.";
  return "";
}

/* ---------- Limitation des essais (par navigateur : freine l'essai à la main, sans prétendre remplacer un serveur) ---------- */
function authTries(){ try{ return JSON.parse(localStorage.getItem(AUTH_TRY_KEY)||"null") || { n:0, until:0 }; }catch(e){ return { n:0, until:0 }; } }
function authTryWait(){ return Math.max(0, authTries().until - Date.now()); }
function authTryFail(){ const t = authTries(); t.n++; t.until = t.n>=3 ? Date.now() + Math.min(60, Math.pow(2, t.n-3))*1000 : 0; try{ localStorage.setItem(AUTH_TRY_KEY, JSON.stringify(t)); }catch(e){} }
function authTryReset(){ try{ localStorage.removeItem(AUTH_TRY_KEY); }catch(e){} }

/* ---------- Création du compte ---------- */
/* Prépare tout en mémoire (rien n'est enregistré) : l'utilisateur doit d'abord voir et confirmer avoir conservé sa clé de récupération. */
async function authPrepareAccount(login, password){
  const issue = authPasswordIssue(login, password); if(issue) throw new Error(issue);
  const ln = authLoginNorm(login);
  const dek = authRand(32), saltPw = authRand(16), saltRec = authRand(16), recoveryKey = authNewRecoveryKey();
  const kekPw = await authDerive(authPwSecret(ln, password), saltPw, AUTH_ITER_PW);
  const kekRec = await authDerive(authRecNorm(recoveryKey), saltRec, AUTH_ITER_REC);
  const record = { v:1, login:ln, created:new Date().toISOString(),
    pw:{ salt:authB64(saltPw), iter:AUTH_ITER_PW, wrap:authWrap(kekPw, dek, "qonnect:wrap:pw:"+ln) },
    rec:{ salt:authB64(saltRec), iter:AUTH_ITER_REC, wrap:authWrap(kekRec, dek, "qonnect:wrap:rec:"+ln) } };
  return { record, dek, recoveryKey };
}
/* Enregistre le compte et chiffre les données actuelles. Les copies en clair (copies de sécurité automatiques) sont supprimées ;
   un éventuel stockage chiffré orphelin (compte absent) ou illisible est conservé à part, jamais écrasé sans trace. */
function authCommitAccount(prep){
  const dbRaw = localStorage.getItem("qonnect_db_v1");
  if(dbRaw){
    let usable = false;
    if(!dbRaw.startsWith(QONNECT_ENC_PREFIX)){ try{ JSON.parse(dbRaw); usable = true; }catch(e){} }
    if(!usable){ try{ localStorage.setItem("qonnect_db_v1_orphelin", dbRaw); }catch(e){} }
  }
  AUTH.dek = prep.dek; AUTH.login = prep.record.login;
  try{
    localStorage.setItem(AUTH_KEY, JSON.stringify(prep.record));
    saveDB();                                         /* chiffre et remplace le stockage */
  }catch(e){
    try{ localStorage.removeItem(AUTH_KEY); }catch(_){}
    AUTH.dek = null; AUTH.login = ""; throw new Error("Enregistrement impossible (stockage du navigateur plein ?) : le compte n'a pas été créé.");
  }
  QONNECT_BACKUP_KEYS.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  AUTH.status = "unlocked"; AUTH.last = Date.now(); authTryReset();
}

/* ---------- Connexion ---------- */
function authLoadDecrypted(){
  const raw = localStorage.getItem("qonnect_db_v1");
  if(!raw) return mergeLoadedDB(JSON.parse(JSON.stringify(QONNECT_SEED)));
  if(raw.startsWith(QONNECT_ENC_PREFIX)) return mergeLoadedDB(authDecryptJson(raw));
  return mergeLoadedDB(JSON.parse(raw));              /* copie en clair d'avant la création du compte : lue puis rechiffrée à l'enregistrement suivant */
}
async function authUnlock(login, password){
  const wait = authTryWait(); if(wait>0) throw new Error("Trop d'essais. Réessayez dans "+Math.ceil(wait/1000)+" s.");
  const rec = authRecord(); if(!rec) throw new Error("Aucun compte n'existe sur ce navigateur.");
  const ln = authLoginNorm(login);
  let dek;
  try{
    const kek = await authDerive(authPwSecret(ln, password), authUnB64(rec.pw.salt), rec.pw.iter);
    dek = authUnwrap(kek, rec.pw.wrap, "qonnect:wrap:pw:"+rec.login);
  }catch(e){ authTryFail(); throw new Error("Identifiant ou mot de passe incorrect."); }
  AUTH.dek = dek; AUTH.login = rec.login;
  let data;
  try{ data = authLoadDecrypted(); }
  catch(e){
    /* Données illisibles ou altérées : on les garde telles quelles à part et on repart d'une base vide plutôt que d'écraser. */
    try{ const raw = localStorage.getItem("qonnect_db_v1"); if(raw) localStorage.setItem("qonnect_db_v1_illisible", raw); }catch(_){}
    data = mergeLoadedDB(JSON.parse(JSON.stringify(QONNECT_SEED))); AUTH.corrupted = true;
  }
  DB = data; normalizeDocuments();
  AUTH.status = "unlocked"; AUTH.last = Date.now(); authTryReset();
  if(!AUTH.corrupted){ try{ saveDB(); }catch(e){} }    /* rechiffre une éventuelle copie en clair héritée */
  return { corrupted: !!AUTH.corrupted };
}
/* Verrouiller = effacer la clé et recharger la page : toute donnée déchiffrée disparaît de la mémoire. */
function authLock(){
  if(AUTH.dek) AUTH.dek.fill(0);
  AUTH.dek = null; AUTH.status = "locked";
  location.reload();
}

/* ---------- Récupération et changement de mot de passe ---------- */
async function authOpenWithRecovery(recoveryKey){
  const rec = authRecord(); if(!rec) throw new Error("Aucun compte n'existe sur ce navigateur.");
  try{
    const kek = await authDerive(authRecNorm(recoveryKey), authUnB64(rec.rec.salt), rec.rec.iter);
    return { rec, dek: authUnwrap(kek, rec.rec.wrap, "qonnect:wrap:rec:"+rec.login) };
  }catch(e){ throw new Error("Clé de récupération incorrecte."); }
}
async function authRewrap(rec, dek, newPassword, newRecoveryKey){
  const issue = authPasswordIssue(rec.login, newPassword); if(issue) throw new Error(issue);
  const saltPw = authRand(16);
  const kekPw = await authDerive(authPwSecret(rec.login, newPassword), saltPw, AUTH_ITER_PW);
  const next = JSON.parse(JSON.stringify(rec));
  next.pw = { salt:authB64(saltPw), iter:AUTH_ITER_PW, wrap:authWrap(kekPw, dek, "qonnect:wrap:pw:"+rec.login) };
  if(newRecoveryKey){
    const saltRec = authRand(16), kekRec = await authDerive(authRecNorm(newRecoveryKey), saltRec, AUTH_ITER_REC);
    next.rec = { salt:authB64(saltRec), iter:AUTH_ITER_REC, wrap:authWrap(kekRec, dek, "qonnect:wrap:rec:"+rec.login) };
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(next));
}
/* Mot de passe oublié : la clé de récupération ouvre la clé de données ; un nouveau mot de passe ET une nouvelle clé de récupération sont posés. */
async function authRecover(recoveryKey, newPassword){
  const { rec, dek } = await authOpenWithRecovery(recoveryKey);
  const newKey = authNewRecoveryKey();
  await authRewrap(rec, dek, newPassword, newKey);
  authTryReset();
  return { recoveryKey:newKey };
}
async function authChangePassword(currentPassword, newPassword){
  const rec = authRecord(); if(!rec || !AUTH.dek) throw new Error("Session non ouverte.");
  try{ const kek = await authDerive(authPwSecret(rec.login, currentPassword), authUnB64(rec.pw.salt), rec.pw.iter); authUnwrap(kek, rec.pw.wrap, "qonnect:wrap:pw:"+rec.login); }
  catch(e){ throw new Error("Mot de passe actuel incorrect."); }
  await authRewrap(rec, AUTH.dek, newPassword, null);
}
async function authRenewRecoveryKey(currentPassword){
  const rec = authRecord(); if(!rec || !AUTH.dek) throw new Error("Session non ouverte.");
  try{ const kek = await authDerive(authPwSecret(rec.login, currentPassword), authUnB64(rec.pw.salt), rec.pw.iter); authUnwrap(kek, rec.pw.wrap, "qonnect:wrap:pw:"+rec.login); }
  catch(e){ throw new Error("Mot de passe actuel incorrect."); }
  const key = authNewRecoveryKey();
  await authRewrap(rec, AUTH.dek, currentPassword, key);
  return { recoveryKey:key };
}

/* ---------- Verrouillage automatique ---------- */
function authPrefs(){ try{ const p = JSON.parse(localStorage.getItem(AUTH_PREFS_KEY)||"null"); if(p && AUTH_IDLE_CHOICES.includes(p.idle)) return p; }catch(e){} return { idle:30 }; }
function authSetIdle(min){ if(AUTH_IDLE_CHOICES.includes(min)) try{ localStorage.setItem(AUTH_PREFS_KEY, JSON.stringify({ idle:min })); }catch(e){} }
let AUTH_WATCHING = false;
function authStartIdleWatch(){
  if(AUTH_WATCHING) return; AUTH_WATCHING = true;
  const bump = ()=>{ AUTH.last = Date.now(); };
  ["click","keydown","touchstart","scroll"].forEach(ev=>document.addEventListener(ev, bump, { passive:true, capture:true }));
  let lastMove = 0; document.addEventListener("mousemove", ()=>{ const n = Date.now(); if(n-lastMove>5000){ lastMove = n; bump(); } }, { passive:true });
  setInterval(()=>{ const m = authPrefs().idle; if(AUTH.status==="unlocked" && m>0 && Date.now()-AUTH.last > m*60000) authLock(); }, 15000);
}
function authInitials(){ return (AUTH.login||"?").replace(/[^\p{L}\p{N}]/gu,"").slice(0,2).toUpperCase() || "?"; }

/* ============================================================
   INTERFACE : écrans d'accueil (création, connexion, récupération) et carte Administration
   ============================================================ */
function authShell(inner){
  document.getElementById("root").innerHTML = `<div class="auth-screen"><div class="auth-card">
    <div class="auth-brand"><div class="brand-mark">Q</div><div class="brand-name">QONNECT</div></div>${inner}</div></div>`;
}
function authErr(msg){ const e = document.getElementById("auth-err"); if(e){ e.textContent = msg||""; } }
function authBusy(on, label){ const b = document.getElementById("auth-submit"); if(b){ b.disabled = !!on; if(label!==undefined) b.textContent = on ? "Un instant…" : label; } }
function authCopyBtns(key){
  return `<div class="auth-reckey" id="auth-reckey">${esc(key)}</div>
    <div class="flex gap-2 mt-2"><button type="button" class="btn btn-secondary btn-sm" id="auth-copy">Copier</button><button type="button" class="btn btn-secondary btn-sm" id="auth-dl">Télécharger (.txt)</button></div>`;
}
function authBindCopy(key){
  const c = document.getElementById("auth-copy"), d = document.getElementById("auth-dl");
  if(c) c.addEventListener("click", ()=>{ try{ navigator.clipboard.writeText(key); c.textContent = "Copié"; }catch(e){ c.textContent = "Copie impossible : recopiez à la main"; } });
  if(d) d.addEventListener("click", ()=>{ const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["Clé de récupération Qonnect\n\n"+key+"\n\nConservez-la hors de l'application (gestionnaire de mots de passe, coffre). Elle permet de redéfinir le mot de passe sans perdre les données.\n"],{type:"text/plain"})); a.download = "qonnect-cle-de-recuperation.txt"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); });
}

/* --- Création du compte (premier lancement ou données existantes) --- */
function authScreenSetup(){
  const legacy = !!localStorage.getItem("qonnect_db_v1") && !localStorage.getItem("qonnect_db_v1").startsWith(QONNECT_ENC_PREFIX);
  const orphan = (localStorage.getItem("qonnect_db_v1")||"").startsWith(QONNECT_ENC_PREFIX);
  authShell(`<h1 class="auth-title">Créer votre compte</h1>
    <p class="text-sm mb-2">${legacy?"Vos données existantes seront <strong>chiffrées</strong> avec votre mot de passe.":"Vos données seront <strong>chiffrées</strong> avec votre mot de passe."} Elles restent sur cet ordinateur ; rien n'est envoyé à un serveur.</p>
    ${orphan?`<div class="aq-callout warn">Des données chiffrées existent déjà sur ce navigateur mais leur compte est introuvable. Elles seront conservées à part (sans être effacées) ; vous pouvez les restaurer avec une sauvegarde exportée.</div>`:""}
    <form id="auth-form" autocomplete="on" novalidate>
      <div class="field"><label for="auth-login">Identifiant</label><input type="text" id="auth-login" name="username" autocomplete="username" required></div>
      <div class="field"><label for="auth-pw">Mot de passe <span class="text-xs">(${AUTH_MIN_PASSWORD} caractères minimum)</span></label><input type="password" id="auth-pw" name="password" autocomplete="new-password" required></div>
      <div class="field"><label for="auth-pw2">Confirmer le mot de passe</label><input type="password" id="auth-pw2" name="password2" autocomplete="new-password" required></div>
      <p class="text-xs mb-2">Si vous oubliez ce mot de passe, <strong>personne ne pourra lire vos données sans la clé de récupération</strong> qui vous sera donnée à l'étape suivante.</p>
      <p class="text-sm" id="auth-err" role="alert" style="color:var(--danger,#c0392b);min-height:1.3em;"></p>
      <button type="submit" class="btn btn-primary" id="auth-submit" style="width:100%;">Continuer</button>
    </form>`);
  document.getElementById("auth-form").addEventListener("submit", async ev=>{
    ev.preventDefault(); authErr("");
    const login = document.getElementById("auth-login").value, pw = document.getElementById("auth-pw").value, pw2 = document.getElementById("auth-pw2").value;
    if(pw!==pw2){ authErr("Les deux mots de passe ne sont pas identiques."); return; }
    const issue = authPasswordIssue(login, pw); if(issue){ authErr(issue); return; }
    authBusy(true);
    try{ const prep = await authPrepareAccount(login, pw); authScreenRecoveryKey(prep); }
    catch(e){ authErr(e.message||String(e)); authBusy(false,"Continuer"); }
  });
}
function authScreenRecoveryKey(prep){
  authShell(`<h1 class="auth-title">Conservez votre clé de récupération</h1>
    <p class="text-sm mb-2">C'est le <strong>seul moyen</strong> de retrouver vos données si vous oubliez votre mot de passe. Elle ne sera <strong>plus affichée</strong>. Enregistrez-la hors de l'application (gestionnaire de mots de passe, coffre, papier).</p>
    ${authCopyBtns(prep.recoveryKey)}
    <label class="flex items-center gap-2 mt-2" style="align-items:flex-start;"><input type="checkbox" id="auth-saved" style="width:auto;margin-top:3px;"> <span class="text-sm">J'ai conservé cette clé en lieu sûr.</span></label>
    <p class="text-sm" id="auth-err" role="alert" style="color:var(--danger,#c0392b);min-height:1.3em;"></p>
    <button type="button" class="btn btn-primary" id="auth-submit" style="width:100%;" disabled>Créer le compte et chiffrer mes données</button>`);
  authBindCopy(prep.recoveryKey);
  const chk = document.getElementById("auth-saved"), btn = document.getElementById("auth-submit");
  chk.addEventListener("change", ()=>{ btn.disabled = !chk.checked; });
  btn.addEventListener("click", ()=>{
    try{ authCommitAccount(prep); }catch(e){ authErr(e.message||String(e)); return; }
    authEnterApp();
  });
}

/* --- Connexion --- */
function authScreenLogin(msg){
  const rec = authRecord();
  authShell(`<h1 class="auth-title">Connexion</h1>
    ${msg?`<div class="aq-callout">${esc(msg)}</div>`:""}
    <form id="auth-form" autocomplete="on" novalidate>
      <div class="field"><label for="auth-login">Identifiant</label><input type="text" id="auth-login" name="username" autocomplete="username" value="${esc(rec?rec.login:"")}" required></div>
      <div class="field"><label for="auth-pw">Mot de passe</label><input type="password" id="auth-pw" name="password" autocomplete="current-password" required></div>
      <p class="text-sm" id="auth-err" role="alert" style="color:var(--danger,#c0392b);min-height:1.3em;"></p>
      <button type="submit" class="btn btn-primary" id="auth-submit" style="width:100%;">Se connecter</button>
    </form>
    <p class="text-xs mt-2" style="text-align:center;"><a href="#" id="auth-forgot">Mot de passe oublié ? Utiliser la clé de récupération</a></p>`);
  const pw = document.getElementById("auth-pw"); (rec && rec.login ? pw : document.getElementById("auth-login")).focus();
  const tick = ()=>{ const w = authTryWait(); if(w>0){ authErr("Trop d'essais. Réessayez dans "+Math.ceil(w/1000)+" s."); setTimeout(tick, 500); } else if(document.getElementById("auth-err") && /Trop d'essais/.test(document.getElementById("auth-err").textContent)) authErr(""); };
  tick();
  document.getElementById("auth-forgot").addEventListener("click", ev=>{ ev.preventDefault(); authScreenRecover(); });
  document.getElementById("auth-form").addEventListener("submit", async ev=>{
    ev.preventDefault(); authErr(""); authBusy(true);
    try{ const r = await authUnlock(document.getElementById("auth-login").value, pw.value); pw.value = ""; authEnterApp(r.corrupted ? "Vos données chiffrées n'ont pas pu être lues (altérées ?). Elles ont été conservées à part ; Qonnect démarre sans elles. Vous pouvez restaurer une sauvegarde exportée dans Administration." : ""); }
    catch(e){ authErr(e.message||String(e)); authBusy(false,"Se connecter"); pw.value = ""; pw.focus(); const w = authTryWait(); if(w>0) tick(); }
  });
}

/* --- Mot de passe oublié --- */
function authScreenRecover(){
  authShell(`<h1 class="auth-title">Clé de récupération</h1>
    <p class="text-sm mb-2">Saisissez la clé de récupération donnée à la création du compte, puis choisissez un nouveau mot de passe. Vos données ne sont pas perdues.</p>
    <form id="auth-form" autocomplete="off" novalidate>
      <div class="field"><label for="auth-rec">Clé de récupération</label><input type="text" id="auth-rec" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-…" required></div>
      <div class="field"><label for="auth-pw">Nouveau mot de passe <span class="text-xs">(${AUTH_MIN_PASSWORD} caractères minimum)</span></label><input type="password" id="auth-pw" autocomplete="new-password" required></div>
      <div class="field"><label for="auth-pw2">Confirmer</label><input type="password" id="auth-pw2" autocomplete="new-password" required></div>
      <p class="text-sm" id="auth-err" role="alert" style="color:var(--danger,#c0392b);min-height:1.3em;"></p>
      <button type="submit" class="btn btn-primary" id="auth-submit" style="width:100%;">Redéfinir le mot de passe</button>
    </form>
    <p class="text-xs mt-2" style="text-align:center;"><a href="#" id="auth-back">← Retour à la connexion</a></p>`);
  document.getElementById("auth-back").addEventListener("click", ev=>{ ev.preventDefault(); authScreenLogin(); });
  document.getElementById("auth-form").addEventListener("submit", async ev=>{
    ev.preventDefault(); authErr("");
    const k = document.getElementById("auth-rec").value, pw = document.getElementById("auth-pw").value, pw2 = document.getElementById("auth-pw2").value;
    if(pw!==pw2){ authErr("Les deux mots de passe ne sont pas identiques."); return; }
    authBusy(true);
    try{ const r = await authRecover(k, pw); authScreenNewKey(r.recoveryKey); }
    catch(e){ authErr(e.message||String(e)); authBusy(false,"Redéfinir le mot de passe"); }
  });
}
function authScreenNewKey(key){
  authShell(`<h1 class="auth-title">Mot de passe redéfini</h1>
    <p class="text-sm mb-2">Votre ancienne clé de récupération n'est plus valable. Voici la <strong>nouvelle</strong> : conservez-la hors de l'application, elle ne sera plus affichée.</p>
    ${authCopyBtns(key)}
    <label class="flex items-center gap-2 mt-2" style="align-items:flex-start;"><input type="checkbox" id="auth-saved" style="width:auto;margin-top:3px;"> <span class="text-sm">J'ai conservé cette clé en lieu sûr.</span></label>
    <button type="button" class="btn btn-primary mt-2" id="auth-submit" style="width:100%;" disabled>Aller à la connexion</button>`);
  authBindCopy(key);
  const chk = document.getElementById("auth-saved"), btn = document.getElementById("auth-submit");
  chk.addEventListener("change", ()=>{ btn.disabled = !chk.checked; });
  btn.addEventListener("click", ()=>authScreenLogin("Mot de passe redéfini. Connectez-vous avec le nouveau."));
}

/* --- Entrée dans l'application une fois connecté --- */
function authEnterApp(notice){
  startApp();
  if(notice) toast(notice,"⚠️");
}
function authShowGate(){
  if(AUTH.status==="setup") authScreenSetup(); else authScreenLogin();
}

/* --- Carte Administration --- */
function authCardHtml(){
  const idle = authPrefs().idle;
  return `<div class="card">
    <h3 class="mb-2">Compte et sécurité</h3>
    <p class="text-sm mb-2">Connecté en tant que <strong>${esc(AUTH.login)}</strong>. Vos données sont chiffrées dans ce navigateur ; elles ne sont lisibles qu'avec votre mot de passe (ou la clé de récupération).</p>
    <div class="flex gap-2" style="align-items:flex-end;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" id="auth-lock-now">🔒 Se déconnecter</button>
      <div class="field" style="margin:0;"><label for="auth-idle">Verrouillage automatique</label><select id="auth-idle">${AUTH_IDLE_CHOICES.map(m=>`<option value="${m}" ${m===idle?"selected":""}>${m?"après "+m+" min d'inactivité":"jamais"}</option>`).join("")}</select></div>
    </div>
    <h4 class="mt-2 mb-2" style="font-size:14px;">Changer le mot de passe</h4>
    <form id="auth-chg" autocomplete="off" novalidate>
      <div class="field"><label for="auth-cur">Mot de passe actuel</label><input type="password" id="auth-cur" autocomplete="current-password"></div>
      <div class="field"><label for="auth-new">Nouveau mot de passe <span class="text-xs">(${AUTH_MIN_PASSWORD} caractères minimum)</span></label><input type="password" id="auth-new" autocomplete="new-password"></div>
      <div class="field"><label for="auth-new2">Confirmer le nouveau mot de passe</label><input type="password" id="auth-new2" autocomplete="new-password"></div>
      <p class="text-sm" id="auth-chg-err" role="alert" style="color:var(--danger,#c0392b);min-height:1.3em;"></p>
      <div class="flex gap-2"><button type="submit" class="btn btn-primary btn-sm">Changer le mot de passe</button><button type="button" class="btn btn-secondary btn-sm" id="auth-renew-rec">Générer une nouvelle clé de récupération</button></div>
    </form>
    <p class="text-xs mt-2">Les sauvegardes exportées depuis « Sauvegarde et restauration » ne sont <strong>pas chiffrées</strong> : conservez-les en lieu sûr.</p>
  </div>`;
}
function authAdminEvents(){
  document.addEventListener("click", async ev=>{
    const t = ev.target;
    if(t && t.id==="auth-lock-now"){ authLock(); return; }
    if(t && t.id==="auth-lock-btn"){ authLock(); return; }
    if(t && t.id==="auth-renew-rec"){
      const cur = document.getElementById("auth-cur"), er = document.getElementById("auth-chg-err");
      if(!cur.value){ er.textContent = "Saisissez votre mot de passe actuel pour générer une nouvelle clé."; return; }
      t.disabled = true;
      try{ const r = await authRenewRecoveryKey(cur.value); cur.value = ""; er.textContent = "";
        openModal({ title:"Nouvelle clé de récupération", bodyHtml:`<p class="text-sm mb-2">L'ancienne clé n'est plus valable. Conservez celle-ci hors de l'application : elle ne sera plus affichée.</p>${authCopyBtns(r.recoveryKey)}`, footHtml:`<button class="btn btn-primary" data-close-modal>J'ai conservé la clé</button>`, onMount:()=>authBindCopy(r.recoveryKey) });
      }catch(e){ er.textContent = e.message||String(e); }
      t.disabled = false;
    }
  });
  document.addEventListener("change", ev=>{ if(ev.target && ev.target.id==="auth-idle"){ authSetIdle(Number(ev.target.value)); toast("Verrouillage automatique mis à jour","✅"); } });
  document.addEventListener("submit", async ev=>{
    if(!ev.target || ev.target.id!=="auth-chg") return; ev.preventDefault();
    const er = document.getElementById("auth-chg-err"), cur = document.getElementById("auth-cur"), n1 = document.getElementById("auth-new"), n2 = document.getElementById("auth-new2");
    er.textContent = "";
    if(n1.value!==n2.value){ er.textContent = "Les deux nouveaux mots de passe ne sont pas identiques."; return; }
    try{ await authChangePassword(cur.value, n1.value); cur.value = n1.value = n2.value = ""; toast("Mot de passe modifié","✅"); }
    catch(e){ er.textContent = e.message||String(e); }
  });
}
