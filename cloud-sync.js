import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,onAuthStateChanged,signOut,sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { initializeFirestore,persistentLocalCache,persistentMultipleTabManager,memoryLocalCache,collection,doc,getDoc,getDocs,setDoc,onSnapshot,serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { firebaseConfig,ADMIN_EMAIL } from "./firebase-config.js";

const DB_KEY="mahamayaClinicOS_v1";
const SECTIONS=["bills","incomes","expenses","inventory","vendors","staff","swarnaprashan","camps","assets","maintenance","closings","audit"];
const dot=document.getElementById("cloudDot"),label=document.getElementById("cloudLabel"),chip=document.getElementById("userChip"),cloudBtn=document.getElementById("cloudBtn");
const configured=firebaseConfig?.apiKey&&!String(firebaseConfig.apiKey).includes("PASTE_")&&firebaseConfig?.projectId&&!String(firebaseConfig.projectId).includes("PASTE_");
const isMobileBrowser=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
function status(type,text){if(dot)dot.className="dot "+type;if(label)label.textContent=text}
function localDb(){try{return JSON.parse(localStorage.getItem(DB_KEY)||"{}")}catch{return {}}}
function saveLocal(d){localStorage.setItem(DB_KEY,JSON.stringify(d))}
function friendly(c=""){return ({"auth/invalid-credential":"Email or password is incorrect.","auth/too-many-requests":"Too many attempts. Please wait and try again.","auth/network-request-failed":"Network problem. Local data is still available.","auth/user-disabled":"This account is disabled."})[c]||c.replace("auth/","").replaceAll("-"," ")}
function stripCloudMeta(x){const y={...x};delete y.__cloudUpdatedAt;return y}
function showLogin(auth){
  document.querySelectorAll(".cloud-login-overlay").forEach(x=>x.remove());
  const w=document.createElement("div");w.className="cloud-login-overlay";
  w.innerHTML=`<div class="cloud-login-card"><button id="cloudLoginClose" class="cloud-login-close" aria-label="Close">✕</button><div class="login-emblem">✦</div><h2>Mahamaya Clinic OS</h2><p class="login-blessing">श्री धन्वन्तरये नमः</p><p>Single Admin Cloud Login</p><label>Email<input id="cloudEmail" type="email" value="${ADMIN_EMAIL||""}" autocomplete="username"></label><label>Password<input id="cloudPassword" type="password" autocomplete="current-password"></label><button id="cloudLoginDo" class="primary">Sign In</button><button id="cloudResetDo">Forgot Password</button><button id="cloudUseLocal">Use Local Mode</button><div id="cloudLoginMsg"></div></div>`;
  document.body.appendChild(w);const m=w.querySelector("#cloudLoginMsg");
  const dismiss=()=>{w.remove();status("local","Local mode • Tap Cloud to sign in");};
  w.querySelector("#cloudUseLocal").onclick=dismiss;
  w.querySelector("#cloudLoginClose").onclick=dismiss;
  w.querySelector("#cloudLoginDo").onclick=async()=>{const e=w.querySelector("#cloudEmail").value.trim(),p=w.querySelector("#cloudPassword").value;if(ADMIN_EMAIL&&e.toLowerCase()!=ADMIN_EMAIL.toLowerCase()){m.textContent="This app is configured for the single admin account only.";return}m.textContent="Signing in…";try{await signInWithEmailAndPassword(auth,e,p);w.remove()}catch(x){m.textContent="Login failed: "+friendly(x.code)}};
  w.querySelector("#cloudResetDo").onclick=async()=>{const e=w.querySelector("#cloudEmail").value.trim()||ADMIN_EMAIL;if(!e){m.textContent="Enter admin email first.";return}try{await sendPasswordResetEmail(auth,e);m.textContent="Password reset email sent."}catch(x){m.textContent="Reset failed: "+friendly(x.code)}};
}

if(!configured){
  status("local","Local mode • Cloud not configured");
  if(cloudBtn)cloudBtn.onclick=()=>alert("Cloud is ready. Add your Firebase web configuration to firebase-config.js first.");
}else{
  try{
    const fb=initializeApp(firebaseConfig),auth=getAuth(fb);
    await setPersistence(auth,browserLocalPersistence);
    let fs;
    try{
      fs=initializeFirestore(fb,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
    }catch(cacheErr){
      console.warn("Persistent Firestore cache unavailable; falling back to memory cache.",cacheErr);
      fs=initializeFirestore(fb,{localCache:memoryLocalCache()});
    }
    let applying=false,unsubs=[];
    const rootRef=doc(fs,"clinicOS","root");
    const sectionRef=s=>collection(fs,"clinicOS","root",s);

    async function uploadAll(){
      const data=localDb(); status("local","Syncing…");
      await setDoc(rootRef,{settings:data.settings||{},schemaVersion:"1.1",updatedAt:serverTimestamp()},{merge:true});
      for(const s of SECTIONS){
        for(const row of (data[s]||[])){
          if(!row?.id) continue;
          await setDoc(doc(sectionRef(s),String(row.id)),{...row,__cloudUpdatedAt:serverTimestamp()},{merge:true});
        }
      }
      status("synced","Synced");
    }
    async function pullAll(){
      const local=localDb();
      const root=await getDoc(rootRef);
      if(root.exists()&&root.data().settings)local.settings=root.data().settings;
      for(const s of SECTIONS){
        const snap=await getDocs(sectionRef(s));
        const remote=snap.docs.map(d=>stripCloudMeta(d.data()));
        const map=new Map((local[s]||[]).map(x=>[String(x.id),x]));
        remote.forEach(x=>map.set(String(x.id),x));
        local[s]=[...map.values()];
      }
      applying=true; saveLocal(local); applying=false;
    }
    function listen(){
      unsubs.forEach(u=>u()); unsubs=[];
      unsubs.push(onSnapshot(rootRef,{includeMetadataChanges:true},snap=>{
        if(!snap.exists()||!snap.data().settings)return;
        const l=localDb();l.settings=snap.data().settings;applying=true;saveLocal(l);applying=false;
        status(snap.metadata.fromCache?"local":"synced",snap.metadata.fromCache?"Offline cache":"Synced");
      },()=>status("error","Cloud error • Local available")));
      for(const s of SECTIONS){
        unsubs.push(onSnapshot(sectionRef(s),{includeMetadataChanges:true},snap=>{
          const l=localDb(),map=new Map((l[s]||[]).map(x=>[String(x.id),x]));
          snap.docChanges().forEach(ch=>{if(ch.type!=="removed"){const x=stripCloudMeta(ch.doc.data());map.set(String(x.id||ch.doc.id),x)}});
          l[s]=[...map.values()];applying=true;saveLocal(l);applying=false;
          status(snap.metadata.fromCache?"local":"synced",snap.metadata.fromCache?"Offline cache":"Synced");
        },()=>status("error","Cloud error • Local available")));
      }
    }
    onAuthStateChanged(auth,async u=>{
      if(!u){
        status("local","Local mode • Tap Cloud to sign in");
        if(chip)chip.textContent="🔒 Single Admin";
        document.querySelectorAll(".cloud-login-overlay").forEach(x=>x.remove());
        return
      }
      if(ADMIN_EMAIL&&u.email?.toLowerCase()!=ADMIN_EMAIL.toLowerCase()){await signOut(auth);alert("This account is not the configured admin.");return}
      document.querySelectorAll(".cloud-login-overlay").forEach(x=>x.remove());
      if(chip)chip.textContent="✓ "+(u.email||"Admin");status("local","Connecting cloud…");
      try{await pullAll();await uploadAll();listen();status("synced","Synced");window.dispatchEvent(new Event('mahamaya-cloud-ready'))}catch(e){
        console.error("Cloud sync bootstrap failed:",e);
        const code=String(e?.code||"");
        status("error",code.includes("permission-denied")?"Cloud permission blocked • Local safe":"Cloud unavailable • Local safe")
      }
    });
    const old=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){old.call(this,k,v);if(k===DB_KEY&&auth.currentUser&&!applying){clearTimeout(window.__mcSyncTimer);window.__mcSyncTimer=setTimeout(()=>uploadAll().catch(()=>status("error","Cloud unavailable • Local safe")),900)}};
    if(cloudBtn)cloudBtn.onclick=async()=>{
      if(auth.currentUser){
        if(confirm("Cloud is connected. Sign out on this device?")) await signOut(auth);
      }else{
        showLogin(auth);
      }
    };
  }catch(e){console.error(e);status("error","Cloud setup error • Local safe")}
}


// V1.2.3 hard safety: app must never start behind a stale overlay.
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".cloud-login-overlay").forEach(x=>x.remove());
});
