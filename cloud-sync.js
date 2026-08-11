import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,onAuthStateChanged,signOut,sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore,collection,doc,getDoc,getDocs,setDoc,onSnapshot,serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { firebaseConfig,ADMIN_EMAIL } from "./firebase-config.js";

const DB_KEY="mahamayaClinicOS_v1";
const SECTIONS=["bills","incomes","expenses","inventory","vendors","staff","swarnaprashan","camps","assets","maintenance","closings","audit"];
const dot=document.getElementById("cloudDot"),label=document.getElementById("cloudLabel"),chip=document.getElementById("userChip"),cloudBtn=document.getElementById("cloudBtn");
const configured=firebaseConfig?.apiKey&&!String(firebaseConfig.apiKey).includes("PASTE_")&&firebaseConfig?.projectId&&!String(firebaseConfig.projectId).includes("PASTE_");
let applyingRemote=false,unsubs=[],auth=null,fs=null;

function status(type,text){
  if(dot)dot.className="dot "+type;
  if(label)label.textContent=text;
  if(cloudBtn){
    cloudBtn.dataset.cloudStatus=type;
    cloudBtn.textContent=type==="synced"?"☁ Synced":type==="error"?"☁ Cloud issue":text.includes("Syncing")||text.includes("Connecting")?"☁ Syncing…":"☁ Cloud";
  }
}
function localDb(){try{return JSON.parse(localStorage.getItem(DB_KEY)||"{}")||{}}catch{return {}}}
function saveLocal(d){applyingRemote=true;localStorage.setItem(DB_KEY,JSON.stringify(d));applyingRemote=false}
function stripMeta(x){const y={...x};delete y.__cloudUpdatedAt;return y}
function friendly(c=""){return ({"auth/invalid-credential":"Email or password is incorrect.","auth/too-many-requests":"Too many attempts. Please wait and try again.","auth/network-request-failed":"Network problem. Local data is still available.","auth/user-disabled":"This account is disabled."})[c]||String(c).replace("auth/","").replaceAll("-"," ")}
function notifyUpdate(){window.dispatchEvent(new Event("mahamaya-cloud-updated"))}

function showLogin(){
  document.querySelectorAll(".cloud-login-overlay").forEach(x=>x.remove());
  const w=document.createElement("div"); w.className="cloud-login-overlay";
  w.innerHTML=`<div class="cloud-login-card"><button id="cloudLoginClose" class="cloud-login-close" aria-label="Close">✕</button><div class="login-emblem">✦</div><h2>Mahamaya Clinic OS</h2><p class="login-blessing">श्री धन्वन्तरये नमः</p><p>Single Admin Cloud Login</p><label>Email<input id="cloudEmail" type="email" value="${ADMIN_EMAIL||""}" autocomplete="username"></label><label>Password<input id="cloudPassword" type="password" autocomplete="current-password"></label><button id="cloudLoginDo" class="primary">Sign In</button><button id="cloudResetDo">Forgot Password</button><button id="cloudUseLocal">Use Local Mode</button><div id="cloudLoginMsg"></div></div>`;
  document.body.appendChild(w);
  const m=w.querySelector("#cloudLoginMsg");
  const close=()=>w.remove();
  w.querySelector("#cloudLoginClose").onclick=close;
  w.querySelector("#cloudUseLocal").onclick=close;
  w.querySelector("#cloudLoginDo").onclick=async()=>{
    const email=w.querySelector("#cloudEmail").value.trim(),pass=w.querySelector("#cloudPassword").value;
    if(ADMIN_EMAIL&&email.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){m.textContent="This app is configured for the single admin account only.";return}
    m.textContent="Signing in…";
    try{await signInWithEmailAndPassword(auth,email,pass);close()}catch(e){m.textContent="Login failed: "+friendly(e.code)}
  };
  w.querySelector("#cloudResetDo").onclick=async()=>{
    const email=w.querySelector("#cloudEmail").value.trim()||ADMIN_EMAIL;
    if(!email){m.textContent="Enter admin email first.";return}
    try{await sendPasswordResetEmail(auth,email);m.textContent="Password reset email sent."}catch(e){m.textContent="Reset failed: "+friendly(e.code)}
  };
}

if(!configured){
  status("local","Local mode • Cloud not configured");
  if(cloudBtn)cloudBtn.onclick=()=>alert("Cloud is not configured yet.");
}else{
  try{
    const fb=initializeApp(firebaseConfig);
    auth=getAuth(fb);
    await setPersistence(auth,browserLocalPersistence);
    fs=getFirestore(fb); // Deliberately simple: localStorage provides offline safety; Firestore handles network sync.

    const rootRef=doc(fs,"clinicOS","root");
    const sectionRef=s=>collection(fs,"clinicOS","root",s);

    async function pullAll(){
      const l=localDb();
      const root=await getDoc(rootRef);
      if(root.exists()&&root.data().settings)l.settings=root.data().settings;
      for(const s of SECTIONS){
        const snap=await getDocs(sectionRef(s));
        const map=new Map((l[s]||[]).filter(x=>x?.id).map(x=>[String(x.id),x]));
        snap.docs.forEach(d=>{const x=stripMeta(d.data());map.set(String(x.id||d.id),x)});
        l[s]=[...map.values()];
      }
      saveLocal(l); notifyUpdate();
    }

    async function uploadAll(){
      const data=localDb(); status("local","Syncing…");
      await setDoc(rootRef,{settings:data.settings||{},schemaVersion:"1.3",updatedAt:serverTimestamp()},{merge:true});
      for(const s of SECTIONS){
        for(const row of (data[s]||[])){
          if(!row?.id)continue;
          await setDoc(doc(sectionRef(s),String(row.id)),{...row,__cloudUpdatedAt:serverTimestamp()},{merge:true});
        }
      }
      status("synced","Synced");
    }

    function listen(){
      unsubs.forEach(u=>u());unsubs=[];
      unsubs.push(onSnapshot(rootRef,snap=>{
        if(!snap.exists()||!snap.data().settings)return;
        const l=localDb();l.settings=snap.data().settings;saveLocal(l);status("synced","Synced");notifyUpdate();
      },e=>{console.error(e);status("error","Cloud unavailable • Local safe")}));
      for(const s of SECTIONS){
        unsubs.push(onSnapshot(sectionRef(s),snap=>{
          const l=localDb(),map=new Map((l[s]||[]).filter(x=>x?.id).map(x=>[String(x.id),x]));
          snap.docChanges().forEach(ch=>{
            if(ch.type==="removed")map.delete(String(ch.doc.id));
            else{const x=stripMeta(ch.doc.data());map.set(String(x.id||ch.doc.id),x)}
          });
          l[s]=[...map.values()];saveLocal(l);status("synced","Synced");notifyUpdate();
        },e=>{console.error(e);status("error","Cloud unavailable • Local safe")}));
      }
    }

    onAuthStateChanged(auth,async u=>{
      document.querySelectorAll(".cloud-login-overlay").forEach(x=>x.remove());
      if(!u){status("local","Local mode • Tap Cloud to sign in");if(chip)chip.textContent="🔒 Single Admin";return}
      if(ADMIN_EMAIL&&u.email?.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){await signOut(auth);alert("This account is not the configured admin.");return}
      if(chip)chip.textContent="✓ "+(u.email||"Admin");status("local","Connecting cloud…");
      try{await pullAll();await uploadAll();listen();status("synced","Synced");window.dispatchEvent(new Event("mahamaya-cloud-ready"))}
      catch(e){console.error("Cloud bootstrap failed",e);status("error",String(e?.code||"").includes("permission-denied")?"Cloud permission blocked • Local safe":"Cloud unavailable • Local safe")}
    });

    const nativeSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){
      nativeSet.call(this,k,v);
      if(k===DB_KEY&&auth.currentUser&&!applyingRemote){
        clearTimeout(window.__mcSyncTimer);
        window.__mcSyncTimer=setTimeout(()=>uploadAll().catch(e=>{console.error(e);status("error","Cloud unavailable • Local safe")}),650);
      }
    };

    if(cloudBtn)cloudBtn.onclick=async()=>{
      if(auth.currentUser){if(confirm("Cloud is connected. Sign out on this device?"))await signOut(auth)}
      else showLogin();
    };
  }catch(e){console.error(e);status("error","Cloud setup error • Local safe")}
}

// No automatic blocking login overlay. The app always opens first.
document.querySelectorAll(".cloud-login-overlay").forEach(x=>x.remove());

window.addEventListener("online",()=>{if(auth?.currentUser)status("local","Connecting cloud…")});
window.addEventListener("offline",()=>status("local","Offline • Local data safe"));
