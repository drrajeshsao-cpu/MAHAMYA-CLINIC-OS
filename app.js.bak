
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DB_KEY='mahamayaClinicOS_v1';
const today=()=>new Date().toISOString().slice(0,10);
const nowISO=()=>new Date().toISOString();
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const uid=(p='ID')=>p+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const sum=(arr,fn)=>arr.reduce((a,x)=>a+Number(fn(x)||0),0);

const seed={
  settings:{
    clinicName:'Mahamaya Clinic',
    owner:'Dr Rajesh Sao',
    consultationRate:200,
    followupRate:100,
    currency:'INR'
  },
  services:[
    {id:'S1',group:'Consultation',name:'New Consultation',rate:200},
    {id:'S2',group:'Consultation',name:'Follow-up Consultation',rate:100},
    {id:'S3',group:'Consultation',name:'Online Consultation',rate:200},
    {id:'S4',group:'Consultation',name:'Home Visit',rate:500},
    {id:'S5',group:'Orthopedic/Spine',name:'Manual Therapy / Mobilisation',rate:500},
    {id:'S6',group:'Orthopedic/Spine',name:'Spinal Manipulation (document indication/safety)',rate:600},
    {id:'S7',group:'Orthopedic/Spine',name:'Rehabilitation / Exercise Session',rate:400},
    {id:'S8',group:'Plaster & Immobilisation',name:'POP Slab / Cast',rate:800},
    {id:'S9',group:'Plaster & Immobilisation',name:'Cast Removal / Adjustment',rate:300},
    {id:'S10',group:'Suturing & Wound Care',name:'Simple Suturing',rate:600},
    {id:'S11',group:'Suturing & Wound Care',name:'Dressing / Re-dressing',rate:250},
    {id:'S12',group:'Injection / IV',name:'Injection Service',rate:100},
    {id:'S13',group:'Injection / IV',name:'IV Cannulation / Drip Service',rate:350},
    {id:'S14',group:'Panchakarma',name:'Kati Basti',rate:700},
    {id:'S15',group:'Panchakarma',name:'Janu Basti',rate:700},
    {id:'S16',group:'Panchakarma',name:'Greeva Basti',rate:700},
    {id:'S17',group:'Panchakarma',name:'Matra Basti',rate:700},
    {id:'S18',group:'Panchakarma',name:'Abhyanga + Swedana',rate:1000},
    {id:'S19',group:'Panchakarma',name:'Nasya',rate:600},
    {id:'S20',group:'Panchakarma',name:'Shirodhara',rate:1200},
    {id:'S21',group:'Ayurvedic Procedures',name:'Agnikarma',rate:600},
    {id:'S22',group:'Ayurvedic Procedures',name:'Viddha Karma',rate:500},
    {id:'S23',group:'Ayurvedic Procedures',name:'Cauterization / Thermal Procedure',rate:600},
    {id:'S24',group:'Documents',name:'Medical Certificate',rate:200},
    {id:'S25',group:'Professional',name:'Training / Lecture / Camp Honorarium',rate:0}
  ],
  bills:[], incomes:[], expenses:[], inventory:[], vendors:[], staff:[],
  swarnaprashan:[], camps:[], assets:[], maintenance:[], closings:[],
  audit:[]
};
let db=load();

function load(){
  try{
    const raw=localStorage.getItem(DB_KEY);
    if(!raw) return structuredClone(seed);
    const d=JSON.parse(raw);
    for(const k of Object.keys(seed)) if(!(k in d)) d[k]=structuredClone(seed[k]);
    return d;
  }catch(e){return structuredClone(seed)}
}
function save(action='Updated data'){
  localStorage.setItem(DB_KEY,JSON.stringify(db));
  db.audit.unshift({id:uid('AUD'),ts:nowISO(),action});
  localStorage.setItem(DB_KEY,JSON.stringify(db));
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function modal(title,body,hint=''){
  $('#modalTitle').textContent=title; $('#modalHint').textContent=hint; $('#modalBody').innerHTML=body; $('#modal').classList.remove('hidden');
}
function closeModal(){ $('#modal').classList.add('hidden') }
$('#modalClose').onclick=closeModal;
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};

const pageMeta={
 dashboard:['Dashboard','Clinic finance, stock, staff and daily audit at a glance.'],
 billing:['Quick Billing','Fast patient billing with split payment support.'],
 income:['Income','Track every clinic and professional income source.'],
 expenses:['Expenses','Daily, recurring, medical, utility and other expenses.'],
 inventory:['Inventory','Separate Ayurveda, Allopathy and operational stock.'],
 vendors:['Vendors','Stockists, suppliers, printers, technicians and service parties.'],
 staff:['Staff & Salary','Doctors, nursing, reception, therapists, cleaning and support staff.'],
 swarnaprashan:['Swarnaprashan','Monthly Pushya-wise collection, stock use and staff accountability.'],
 camps:['Camps / Seva','Free, sponsored and paid camps with full cost tracking.'],
 assets:['Assets & Maintenance','Clinical equipment, furniture, interiors, repair, AMC and service history.'],
 closing:['Daily Closing','Cash, UPI, expenses and daily reconciliation.'],
 reports:['Reports','Operational summaries and management reports.'],
 settings:['Settings','Clinic defaults and data management.']
};
let currentView='dashboard';
let inventoryTab='Ayurveda Medicines';

$$('#nav button').forEach(b=>b.onclick=()=>{currentView=b.dataset.view;$$('#nav button').forEach(x=>x.classList.toggle('active',x===b));render()});
$('#quickAddBtn').onclick=quickEntry;
$('#backupBtn').onclick=backup;

function render(){
  const [t,s]=pageMeta[currentView]; $('#pageTitle').textContent=t; $('#pageSubtitle').textContent=s;
  const fn=views[currentView]; $('#view').innerHTML=fn?fn():'';
  bindView();
}

function monthPrefix(){return today().slice(0,7)}
function todays(arr){return arr.filter(x=>(x.date||'').slice(0,10)===today())}
function billReceived(b){return Number(b.cash||0)+Number(b.upi||0)+Number(b.card||0)+Number(b.bank||0)+Number(b.advance||0)}
function billDue(b){return Math.max(0,Number(b.total||0)-billReceived(b))}
function monthRows(arr){const p=monthPrefix();return arr.filter(x=>(x.date||'').slice(0,7)===p)}
function invValue(filter=null){
  const rows=filter?db.inventory.filter(x=>x.segment===filter):db.inventory;
  return sum(rows,x=>Number(x.qty||0)*Number(x.purchaseRate||0))
}
function dashboard(){
  const bills=todays(db.bills), inc=todays(db.incomes), exp=todays(db.expenses);
  const billed=sum(bills,x=>x.total), received=sum(bills,billReceived)+sum(inc,x=>x.amount);
  const expenses=sum(exp,x=>x.amount), due=sum(bills,billDue);
  const low=db.inventory.filter(x=>Number(x.qty||0)<=Number(x.reorderLevel||0)).length;
  const pendingVendor=sum(db.vendors,x=>x.outstanding);
  const sw=monthRows(db.swarnaprashan);
  const swReceived=sum(sw,x=>x.received);
  return `
  <div class="hero">
    <div>
      <span class="badge green">Integrated Clinic Operations</span>
      <h3>${esc(db.settings.clinicName)}</h3>
      <p>One entry updates billing, payment mode, outstanding, staff accountability and management reports. Inventory and finance remain clearly separated by Ayurveda, Allopathy and operational categories.</p>
      <div class="actions" style="margin-top:14px">
        <button class="primary" data-action="bill">+ New Bill</button>
        <button data-action="expense">+ Expense</button>
        <button data-action="inventory">+ Stock Item</button>
      </div>
    </div>
    <div class="hero-side"><div><small class="muted">Today Received</small><b>${money(received)}</b><small class="muted">Expenses ${money(expenses)}</small></div></div>
  </div>
  <div class="kpis">
    <div class="kpi"><span>Today Billing</span><b>${money(billed)}</b><small>${bills.length} bills</small></div>
    <div class="kpi"><span>Today Received</span><b>${money(received)}</b><small>Bill + other income</small></div>
    <div class="kpi"><span>Today Expenses</span><b>${money(expenses)}</b><small>All expense heads</small></div>
    <div class="kpi"><span>Patient Due</span><b>${money(due)}</b><small>Today bills</small></div>
  </div>
  <div class="grid2">
    <div class="card">
      <div class="section-title"><h3>Inventory Control</h3><button class="small" data-viewjump="inventory">Open</button></div>
      <div class="inventory-cards">
        <div class="inv-card"><span class="muted">Ayurveda</span><b>${money(invValue('Ayurveda Medicines'))}</b></div>
        <div class="inv-card"><span class="muted">Allopathy</span><b>${money(invValue('Allopathic Medicines'))}</b></div>
        <div class="inv-card"><span class="muted">Low Stock</span><b>${low}</b></div>
        <div class="inv-card"><span class="muted">Total Stock Value</span><b>${money(invValue())}</b></div>
      </div>
    </div>
    <div class="card">
      <h3>What Needs Attention?</h3>
      <div class="alert-list">
        <div class="alert ${low?'red':''}">${low} low/out-of-stock item(s)</div>
        <div class="alert">${money(pendingVendor)} vendor outstanding</div>
        <div class="alert">${money(swReceived)} Swarnaprashan received this month</div>
        <div class="alert">${db.maintenance.filter(x=>x.status==='Due'||x.status==='Overdue').length} maintenance item(s) due/overdue</div>
      </div>
    </div>
  </div>
  <div class="grid2" style="margin-top:14px">
    <div class="card">
      <h3>This Month by Vertical</h3>
      ${verticalSummary()}
    </div>
    <div class="card">
      <h3>Recent Audit Activity</h3>
      <div class="list-cards">${db.audit.slice(0,6).map(a=>`<div class="item-row"><div><b>${esc(a.action)}</b><br><small>${new Date(a.ts).toLocaleString()}</small></div></div>`).join('')||'<div class="empty">No activity yet.</div>'}</div>
    </div>
  </div>`;
}
function verticalSummary(){
  const rows=monthRows(db.bills);
  const groups={};
  rows.forEach(b=>(b.items||[]).forEach(i=>groups[i.group]=(groups[i.group]||0)+Number(i.amount||0)));
  const keys=['Consultation','Orthopedic/Spine','Panchakarma','Ayurvedic Procedures','Plaster & Immobilisation','Suturing & Wound Care','Injection / IV','Documents'];
  return `<div class="metric-list">${keys.map(k=>`<div class="metric-row"><span>${esc(k)}</span><b>${money(groups[k]||0)}</b></div>`).join('')}</div>`;
}
function billing(){
  const rows=[...db.bills].reverse();
  return `<div class="section-title"><h3>Patient Bills</h3><button class="primary" data-action="bill">+ New Bill</button></div>
  ${table(rows,['Date','Patient','Services','Total','Received','Due','Mode'],b=>[
    esc(b.date),esc(b.patient),esc((b.items||[]).map(i=>i.name).join(', ')),money(b.total),money(billReceived(b)),money(billDue(b)),esc(b.mode||'Split')
  ])}`;
}
function income(){
  return `<div class="section-title"><h3>Income Ledger</h3><button class="primary" data-action="income">+ Add Income</button></div>
  ${table([...db.incomes].reverse(),['Date','Source','Category','Amount','Mode','Handled By'],x=>[esc(x.date),esc(x.source),esc(x.category),money(x.amount),esc(x.mode),esc(x.handledBy||'-')])}`;
}
function expenses(){
  return `<div class="section-title"><h3>Expense Ledger</h3><button class="primary" data-action="expense">+ Add Expense</button></div>
  ${table([...db.expenses].reverse(),['Date','Expense','Category','Amount','Mode','Paid To','Handled By'],x=>[esc(x.date),esc(x.name),esc(x.category),money(x.amount),esc(x.mode),esc(x.paidTo||'-'),esc(x.handledBy||'-')])}`;
}
const invTabs=['Ayurveda Medicines','Allopathic Medicines','Injection/IV & Procedure','Dressing/Suturing/POP','Panchakarma Materials','Orthopedic Supports','Printing & Stationery','General Consumables'];
function inventory(){
  const rows=db.inventory.filter(x=>x.segment===inventoryTab);
  return `<div class="module-tabs">${invTabs.map(t=>`<button data-invtab="${esc(t)}" class="${t===inventoryTab?'active':''}">${esc(t)}</button>`).join('')}</div>
  <div class="section-title"><div><h3>${esc(inventoryTab)}</h3><div class="muted">${rows.length} items • Stock value ${money(sum(rows,x=>Number(x.qty)*Number(x.purchaseRate)))}</div></div><button class="primary" data-action="inventory">+ Add Stock Item</button></div>
  ${table(rows,['Item','Brand/Generic','Qty','Purchase','MRP/Sale','Vendor','Batch/Expiry','Status'],x=>[
    esc(x.name),esc([x.generic,x.brand].filter(Boolean).join(' • ')||'-'),esc(x.qty),money(x.purchaseRate),money(x.saleRate||x.mrp),esc(x.vendor||'-'),esc([x.batch,x.expiry].filter(Boolean).join(' • ')||'-'),Number(x.qty)<=Number(x.reorderLevel)?'<span class="badge red">Low Stock</span>':'<span class="badge green">OK</span>'
  ])}`;
}
function vendors(){
  return `<div class="section-title"><h3>Vendor / Party Master</h3><button class="primary" data-action="vendor">+ Add Vendor</button></div>
  ${table(db.vendors,['Party','Type','Contact','Total Purchase','Paid','Outstanding','Actions'],x=>[
    esc(x.name),esc(x.type),esc(x.phone||'-'),money(x.totalPurchase),money(x.paid),money(x.outstanding),
    `<a href="${x.phone?'tel:'+esc(x.phone):'#'}">Call</a> ${x.phone?`• <a href="https://wa.me/91${esc(x.phone.replace(/\D/g,''))}" target="_blank">WhatsApp</a>`:''}`
  ])}`;
}
function staff(){
  return `<div class="section-title"><h3>Staff & Payroll</h3><button class="primary" data-action="staff">+ Add Staff</button></div>
  ${table(db.staff,['Name','Role','Salary Type','Rate/Salary','Advance','Paid','Pending','Contact'],x=>[
    esc(x.name),esc(x.role),esc(x.salaryType),money(x.salary),money(x.advance),money(x.paid),money(Math.max(0,Number(x.salary)-Number(x.advance)-Number(x.paid))),esc(x.phone||'-')
  ])}`;
}
function swarnaprashan(){
  const rows=[...db.swarnaprashan].reverse(), m=monthRows(db.swarnaprashan);
  return `<div class="kpis">
    <div class="kpi"><span>Children / Entries</span><b>${m.length}</b><small>This month</small></div>
    <div class="kpi"><span>Billing</span><b>${money(sum(m,x=>x.billed))}</b></div>
    <div class="kpi"><span>Received</span><b>${money(sum(m,x=>x.received))}</b></div>
    <div class="kpi"><span>Pending</span><b>${money(sum(m,x=>Number(x.billed)-Number(x.received)))}</b></div>
  </div>
  <div class="section-title"><h3>Monthly Swarnaprashan Ledger</h3><button class="primary" data-action="swarnaprashan">+ Add Entry</button></div>
  ${table(rows,['Date','Child / Event','Clinic Dose','Home Use','Billing','Received','Mode','Administered By','Payment By'],x=>[
    esc(x.date),esc(x.child),esc(x.clinicDose),esc(x.homeUse),money(x.billed),money(x.received),esc(x.mode),esc(x.administeredBy||'-'),esc(x.paymentBy||'-')
  ])}`;
}
function camps(){
  return `<div class="section-title"><h3>Camp / Seva Cost Centres</h3><button class="primary" data-action="camp">+ Add Camp</button></div>
  ${table(db.camps,['Date','Camp','Type','Patients','Expense','Donation/Sponsor','Net Clinic Contribution','Location'],x=>[
    esc(x.date),esc(x.name),esc(x.type),esc(x.patients),money(x.expense),money(x.support),money(Math.max(0,Number(x.expense)-Number(x.support))),esc(x.location||'-')
  ])}`;
}
function assets(){
  return `<div class="grid2">
    <div class="card">
      <div class="section-title"><h3>Assets / Equipment</h3><button class="primary small" data-action="asset">+ Add Asset</button></div>
      ${table(db.assets,['Asset','Segment','Location','Cost','Status','Next Service'],x=>[esc(x.name),esc(x.segment),esc(x.location||'-'),money(x.cost),esc(x.status),esc(x.nextService||'-')])}
    </div>
    <div class="card">
      <div class="section-title"><h3>Repair / Maintenance / AMC</h3><button class="primary small" data-action="maintenance">+ Add Maintenance</button></div>
      ${table(db.maintenance,['Date','Asset / Work','Category','Vendor','Cost','Status','Next Due'],x=>[esc(x.date),esc(x.asset),esc(x.category),esc(x.vendor||'-'),money(x.cost),esc(x.status),esc(x.nextDue||'-')])}
    </div>
  </div>`;
}
function closing(){
  const d=today();
  const bills=todays(db.bills), inc=todays(db.incomes), exp=todays(db.expenses);
  const cashIn=sum(bills,x=>x.cash)+sum(inc,x=>x.mode==='Cash'?x.amount:0);
  const cashOut=sum(exp,x=>x.mode==='Cash'?x.amount:0);
  const upi=sum(bills,x=>x.upi)+sum(inc,x=>x.mode==='UPI'?x.amount:0);
  const expAll=sum(exp,x=>x.amount);
  const latest=db.closings.find(x=>x.date===d);
  return `<div class="grid2">
    <div class="card">
      <h3>Today's Reconciliation</h3>
      <div class="metric-list">
        <div class="metric-row"><span>Cash In</span><b>${money(cashIn)}</b></div>
        <div class="metric-row"><span>Cash Expense</span><b>${money(cashOut)}</b></div>
        <div class="metric-row"><span>Net Cash Movement</span><b>${money(cashIn-cashOut)}</b></div>
        <div class="metric-row"><span>UPI Received</span><b>${money(upi)}</b></div>
        <div class="metric-row"><span>Total Expenses</span><b>${money(expAll)}</b></div>
      </div>
    </div>
    <div class="card">
      <h3>Close Day</h3>
      ${latest?`<div class="alert"><b>Closed.</b> Expected ${money(latest.expected)} • Actual ${money(latest.actual)} • Difference ${money(latest.difference)}</div>`:
      `<div class="form-grid">
        <label>Opening Cash<input id="closeOpening" type="number" value="0"></label>
        <label>Actual Cash Count<input id="closeActual" type="number" value="0"></label>
        <label class="full">Difference Reason / Notes<textarea id="closeNotes"></textarea></label>
        <div class="full"><button class="primary" id="closeDayBtn">Close & Lock Day</button></div>
      </div>`}
    </div>
  </div>`;
}
function reports(){
  const mb=monthRows(db.bills), mi=monthRows(db.incomes), me=monthRows(db.expenses);
  const billed=sum(mb,x=>x.total), received=sum(mb,billReceived)+sum(mi,x=>x.amount), exp=sum(me,x=>x.amount);
  return `<div class="kpis">
    <div class="kpi"><span>Month Billing</span><b>${money(billed)}</b></div>
    <div class="kpi"><span>Month Received</span><b>${money(received)}</b></div>
    <div class="kpi"><span>Month Expenses</span><b>${money(exp)}</b></div>
    <div class="kpi"><span>Operational Surplus</span><b>${money(received-exp)}</b></div>
  </div>
  <div class="grid2">
    <div class="card"><h3>Payment Modes</h3>${paymentModeReport(mb)}</div>
    <div class="card"><h3>Expense Categories</h3>${categoryReport(me,'category','amount')}</div>
    <div class="card"><h3>Service Mix</h3>${serviceMix(mb)}</div>
    <div class="card"><h3>Stock Value</h3>${inventoryValueReport()}</div>
  </div>`;
}
function settings(){
  return `<div class="grid2">
    <div class="card">
      <h3>Clinic Settings</h3>
      <div class="form-grid">
        <label>Clinic Name<input id="setClinicName" value="${esc(db.settings.clinicName)}"></label>
        <label>Owner / Super Admin<input id="setOwner" value="${esc(db.settings.owner)}"></label>
        <label>Consultation Rate<input id="setConsult" type="number" value="${db.settings.consultationRate}"></label>
        <label>Follow-up Rate<input id="setFollow" type="number" value="${db.settings.followupRate}"></label>
        <div class="full"><button class="primary" id="saveSettingsBtn">Save Settings</button></div>
      </div>
    </div>
    <div class="card">
      <h3>Data Management</h3>
      <div class="actions">
        <button id="settingsBackupBtn">Download Backup</button>
        <button id="restoreBtn">Restore JSON</button>
        <button class="danger" id="resetBtn">Reset Local Data</button>
      </div>
      <p class="muted">This foundation stores data locally in the browser. Use Backup JSON regularly until cloud sync is added.</p>
    </div>
  </div>`;
}
const views={dashboard,billing,income,expenses,inventory,vendors,staff,swarnaprashan,camps,assets,closing,reports,settings};

function table(rows,heads,rowfn){
  if(!rows.length)return '<div class="empty">No records yet.</div>';
  return `<div class="table-wrap"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${rowfn(r).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function categoryReport(rows,key,val){
  const m={};rows.forEach(x=>m[x[key]||'Other']=(m[x[key]||'Other']||0)+Number(x[val]||0));
  return `<div class="metric-list">${Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="metric-row"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')||'<div class="empty">No data.</div>'}</div>`;
}
function paymentModeReport(rows){
  const m={Cash:0,UPI:0,Card:0,Bank:0,Advance:0};
  rows.forEach(x=>Object.keys(m).forEach(k=>m[k]+=Number(x[k.toLowerCase()]||0)));
  return `<div class="metric-list">${Object.entries(m).map(([k,v])=>`<div class="metric-row"><span>${k}</span><b>${money(v)}</b></div>`).join('')}</div>`;
}
function serviceMix(rows){
  const m={}; rows.forEach(b=>(b.items||[]).forEach(i=>m[i.group]=(m[i.group]||0)+Number(i.amount||0)));
  return `<div class="metric-list">${Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="metric-row"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')||'<div class="empty">No data.</div>'}</div>`;
}
function inventoryValueReport(){
  const m={};db.inventory.forEach(x=>m[x.segment]=(m[x.segment]||0)+Number(x.qty||0)*Number(x.purchaseRate||0));
  return `<div class="metric-list">${Object.entries(m).map(([k,v])=>`<div class="metric-row"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('')||'<div class="empty">No data.</div>'}</div>`;
}

function quickEntry(){
  modal('Quick Entry',`<div class="grid2">
    <button class="primary" data-action="bill">🧾 Patient Bill</button>
    <button data-action="income">₹ Other Income</button>
    <button data-action="expense">💸 Expense</button>
    <button data-action="inventory">📦 Stock Item</button>
    <button data-action="vendor">🏢 Vendor</button>
    <button data-action="swarnaprashan">🧒 Swarnaprashan</button>
  </div>`,'Choose the transaction you want to enter.');
  bindModalActions();
}
function billModal(){
  const opts=db.services.map(s=>`<option value="${s.id}">${esc(s.group)} — ${esc(s.name)} (${money(s.rate)})</option>`).join('');
  modal('New Patient Bill',`<div class="form-grid">
    <label>Date<input id="bDate" type="date" value="${today()}"></label>
    <label>Patient Name<input id="bPatient" placeholder="Patient name"></label>
    <label class="full">Service<select id="bService">${opts}</select></label>
    <label>Qty<input id="bQty" type="number" value="1" min="1"></label>
    <label>Custom Rate<input id="bRate" type="number" value="${db.services[0].rate}"></label>
    <label>Cash<input id="bCash" type="number" value="0"></label>
    <label>UPI<input id="bUpi" type="number" value="0"></label>
    <label>Card<input id="bCard" type="number" value="0"></label>
    <label>Bank<input id="bBank" type="number" value="0"></label>
    <label>Advance Adjusted<input id="bAdvance" type="number" value="0"></label>
    <label>Service / Procedure By<input id="bBy" placeholder="Dr / Staff"></label>
    <label>Payment Received By<input id="bPayBy" placeholder="Staff"></label>
    <label class="full">Notes<textarea id="bNotes"></textarea></label>
    <div class="full"><button class="primary" id="saveBillBtn">Save Bill</button></div>
  </div>`,'Use custom rate only when needed. Split payment is supported.');
  const sync=()=>{const s=db.services.find(x=>x.id===$('#bService').value);if(s)$('#bRate').value=s.rate};
  $('#bService').onchange=sync;
  $('#saveBillBtn').onclick=()=>{
    const s=db.services.find(x=>x.id===$('#bService').value), qty=Number($('#bQty').value||1), rate=Number($('#bRate').value||0), amount=qty*rate;
    const b={id:uid('BILL'),date:$('#bDate').value,patient:$('#bPatient').value||'Walk-in',items:[{serviceId:s.id,group:s.group,name:s.name,qty,rate,amount}],total:amount,cash:Number($('#bCash').value||0),upi:Number($('#bUpi').value||0),card:Number($('#bCard').value||0),bank:Number($('#bBank').value||0),advance:Number($('#bAdvance').value||0),serviceBy:$('#bBy').value,paymentBy:$('#bPayBy').value,notes:$('#bNotes').value};
    db.bills.push(b); save(`Bill ${b.id} created for ${b.patient}`); closeModal();render();toast('Bill saved');
  };
}
function incomeModal(){
  modal('Add Income',`<div class="form-grid">
    <label>Date<input id="iDate" type="date" value="${today()}"></label>
    <label>Source<input id="iSource" placeholder="Camp / training / donation / other"></label>
    <label>Category<select id="iCategory"><option>Professional Income</option><option>Donation</option><option>Camp/Sponsorship</option><option>Medical Certificate</option><option>Other Income</option></select></label>
    <label>Amount<input id="iAmount" type="number"></label>
    <label>Mode<select id="iMode"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank</option><option>Other</option></select></label>
    <label>Handled By<input id="iBy"></label>
    <label class="full">Notes<textarea id="iNotes"></textarea></label>
    <div class="full"><button class="primary" id="saveIncomeBtn">Save Income</button></div>
  </div>`);
  $('#saveIncomeBtn').onclick=()=>{const x={id:uid('INC'),date:$('#iDate').value,source:$('#iSource').value,category:$('#iCategory').value,amount:Number($('#iAmount').value||0),mode:$('#iMode').value,handledBy:$('#iBy').value,notes:$('#iNotes').value};db.incomes.push(x);save(`Income ${x.id} added`);closeModal();render();toast('Income saved')};
}
function expenseModal(){
  const cats=['Medicine Purchase - Ayurveda','Medicine Purchase - Allopathic','Procedure Consumables','Panchakarma Materials','Staff Salary','Electricity','Water','Newspaper','Cleaning','Printing/Stationery','Repair & Maintenance','AMC/Calibration','Furniture/Interior','Painting/Wallpaper/Civil Work','Rent','Internet/Phone','Camp Expense','Donation','Equipment Purchase','Other'];
  modal('Add Expense',`<div class="form-grid">
    <label>Date<input id="eDate" type="date" value="${today()}"></label>
    <label>Expense<input id="eName" placeholder="Electricity bill / medicine purchase"></label>
    <label>Category<select id="eCat">${cats.map(c=>`<option>${c}</option>`).join('')}</select></label>
    <label>Amount<input id="eAmount" type="number"></label>
    <label>Mode<select id="eMode"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank</option><option>Credit/Udhari</option><option>Advance</option></select></label>
    <label>Paid To<input id="eTo" placeholder="Vendor / person"></label>
    <label>Handled By<input id="eBy"></label>
    <label>Payment Status<select id="eStatus"><option>Paid</option><option>Part Paid</option><option>Pending</option></select></label>
    <label class="full">Notes<textarea id="eNotes"></textarea></label>
    <div class="full"><button class="primary" id="saveExpenseBtn">Save Expense</button></div>
  </div>`);
  $('#saveExpenseBtn').onclick=()=>{const x={id:uid('EXP'),date:$('#eDate').value,name:$('#eName').value,category:$('#eCat').value,amount:Number($('#eAmount').value||0),mode:$('#eMode').value,paidTo:$('#eTo').value,handledBy:$('#eBy').value,status:$('#eStatus').value,notes:$('#eNotes').value};db.expenses.push(x);save(`Expense ${x.id} added`);closeModal();render();toast('Expense saved')};
}
function inventoryModal(){
  modal('Add Inventory Item',`<div class="form-grid">
    <label>Segment<select id="vSegment">${invTabs.map(x=>`<option ${x===inventoryTab?'selected':''}>${x}</option>`).join('')}</select></label>
    <label>Item Name<input id="vName"></label>
    <label>Generic / Type<input id="vGeneric"></label>
    <label>Brand / Manufacturer<input id="vBrand"></label>
    <label>Qty<input id="vQty" type="number" value="0"></label>
    <label>Reorder Level<input id="vReorder" type="number" value="0"></label>
    <label>Purchase Rate<input id="vPurchase" type="number" value="0"></label>
    <label>MRP / Selling Rate<input id="vSale" type="number" value="0"></label>
    <label>Vendor<input id="vVendor"></label>
    <label>Batch<input id="vBatch"></label>
    <label>Expiry<input id="vExpiry" type="month"></label>
    <label>Location<input id="vLocation" placeholder="Store / OPD / Panchakarma"></label>
    <div class="full"><button class="primary" id="saveInventoryBtn">Save Stock Item</button></div>
  </div>`);
  $('#saveInventoryBtn').onclick=()=>{const x={id:uid('STK'),segment:$('#vSegment').value,name:$('#vName').value,generic:$('#vGeneric').value,brand:$('#vBrand').value,qty:Number($('#vQty').value||0),reorderLevel:Number($('#vReorder').value||0),purchaseRate:Number($('#vPurchase').value||0),saleRate:Number($('#vSale').value||0),vendor:$('#vVendor').value,batch:$('#vBatch').value,expiry:$('#vExpiry').value,location:$('#vLocation').value};db.inventory.push(x);inventoryTab=x.segment;save(`Inventory item ${x.name} added`);closeModal();currentView='inventory';render();toast('Stock item saved')};
}
function vendorModal(){
  const types=['Ayurvedic Supplier','Allopathic Supplier','Both Medicines','Procedure Consumables','Panchakarma Supplier','Printing Vendor','Equipment Vendor','Repair Technician','Furniture/Interior Vendor','Other'];
  modal('Add Vendor / Party',`<div class="form-grid">
    <label>Party Name<input id="vdName"></label>
    <label>Type<select id="vdType">${types.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <label>Owner / Contact Person<input id="vdOwner"></label>
    <label>Sales / Delivery Person<input id="vdSales"></label>
    <label>Phone<input id="vdPhone"></label>
    <label>Address<input id="vdAddress"></label>
    <label>UPI ID<input id="vdUpi"></label>
    <label>Credit Days<input id="vdCredit" type="number" value="0"></label>
    <label>Total Purchase<input id="vdPurchase" type="number" value="0"></label>
    <label>Paid<input id="vdPaid" type="number" value="0"></label>
    <div class="full"><button class="primary" id="saveVendorBtn">Save Vendor</button></div>
  </div>`);
  $('#saveVendorBtn').onclick=()=>{const total=Number($('#vdPurchase').value||0),paid=Number($('#vdPaid').value||0);const x={id:uid('VEN'),name:$('#vdName').value,type:$('#vdType').value,owner:$('#vdOwner').value,sales:$('#vdSales').value,phone:$('#vdPhone').value,address:$('#vdAddress').value,upi:$('#vdUpi').value,creditDays:Number($('#vdCredit').value||0),totalPurchase:total,paid,outstanding:Math.max(0,total-paid)};db.vendors.push(x);save(`Vendor ${x.name} added`);closeModal();render();toast('Vendor saved')};
}
function staffModal(){
  const roles=['Doctor','Visiting Doctor','Nursing Staff','Dresser','Receptionist','Pharmacy Staff','Panchakarma Therapist','Aaya / Patient Care','Cleaning / Housekeeping','Accountant / Billing','Helper / Attendant','Other'];
  modal('Add Staff',`<div class="form-grid">
    <label>Name<input id="stName"></label>
    <label>Role<select id="stRole">${roles.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <label>Phone<input id="stPhone"></label>
    <label>Joining Date<input id="stJoin" type="date" value="${today()}"></label>
    <label>Salary Type<select id="stType"><option>Monthly Fixed</option><option>Daily Wage</option><option>Per Shift</option><option>Per Visit</option><option>Per Procedure</option><option>Honorarium</option></select></label>
    <label>Rate / Salary<input id="stSalary" type="number" value="0"></label>
    <label>Advance<input id="stAdvance" type="number" value="0"></label>
    <label>Paid This Month<input id="stPaid" type="number" value="0"></label>
    <label class="full">Address / Notes<textarea id="stNotes"></textarea></label>
    <div class="full"><button class="primary" id="saveStaffBtn">Save Staff</button></div>
  </div>`);
  $('#saveStaffBtn').onclick=()=>{const x={id:uid('STF'),name:$('#stName').value,role:$('#stRole').value,phone:$('#stPhone').value,joining:$('#stJoin').value,salaryType:$('#stType').value,salary:Number($('#stSalary').value||0),advance:Number($('#stAdvance').value||0),paid:Number($('#stPaid').value||0),notes:$('#stNotes').value};db.staff.push(x);save(`Staff ${x.name} added`);closeModal();render();toast('Staff saved')};
}
function swarnaModal(){
  modal('Add Swarnaprashan Entry',`<div class="form-grid">
    <label>Date<input id="swDate" type="date" value="${today()}"></label>
    <label>Child / Event<input id="swChild" placeholder="Child name or Pushya event"></label>
    <label>Clinic Dose Qty<input id="swClinic" type="number" value="1"></label>
    <label>Home Use Qty<input id="swHome" type="number" value="0"></label>
    <label>Billing<input id="swBill" type="number" value="250"></label>
    <label>Received<input id="swReceived" type="number" value="250"></label>
    <label>Mode<select id="swMode"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank</option><option>Credit/Udhari</option><option>Complimentary</option></select></label>
    <label>Administered By<input id="swAdmin"></label>
    <label>Payment By<input id="swPay"></label>
    <label>Material Cost<input id="swCost" type="number" value="0"></label>
    <div class="full"><button class="primary" id="saveSwarnaBtn">Save Entry</button></div>
  </div>`);
  $('#saveSwarnaBtn').onclick=()=>{const x={id:uid('SW'),date:$('#swDate').value,child:$('#swChild').value,clinicDose:Number($('#swClinic').value||0),homeUse:Number($('#swHome').value||0),billed:Number($('#swBill').value||0),received:Number($('#swReceived').value||0),mode:$('#swMode').value,administeredBy:$('#swAdmin').value,paymentBy:$('#swPay').value,materialCost:Number($('#swCost').value||0)};db.swarnaprashan.push(x);save(`Swarnaprashan entry ${x.id} added`);closeModal();render();toast('Swarnaprashan entry saved')};
}
function campModal(){
  modal('Add Camp / Seva Event',`<div class="form-grid">
    <label>Date<input id="cpDate" type="date" value="${today()}"></label>
    <label>Camp Name<input id="cpName"></label>
    <label>Type<select id="cpType"><option>Free Medical Camp</option><option>Sponsored Camp</option><option>Partially Paid Camp</option><option>Paid Camp</option></select></label>
    <label>Location<input id="cpLocation"></label>
    <label>Patients Seen<input id="cpPatients" type="number" value="0"></label>
    <label>Total Expense<input id="cpExpense" type="number" value="0"></label>
    <label>Donation / Sponsor Support<input id="cpSupport" type="number" value="0"></label>
    <label>Free Medicine Value<input id="cpMed" type="number" value="0"></label>
    <label class="full">Notes<textarea id="cpNotes" placeholder="Transport, printing, food, staff, medicines, procedures..."></textarea></label>
    <div class="full"><button class="primary" id="saveCampBtn">Save Camp</button></div>
  </div>`);
  $('#saveCampBtn').onclick=()=>{const x={id:uid('CAMP'),date:$('#cpDate').value,name:$('#cpName').value,type:$('#cpType').value,location:$('#cpLocation').value,patients:Number($('#cpPatients').value||0),expense:Number($('#cpExpense').value||0),support:Number($('#cpSupport').value||0),freeMedicineValue:Number($('#cpMed').value||0),notes:$('#cpNotes').value};db.camps.push(x);save(`Camp ${x.name} added`);closeModal();render();toast('Camp saved')};
}
function assetModal(){
  const seg=['Ayurvedic Clinical Equipment','Modern/Allopathic Clinical Equipment','Reusable Instruments','IT & Electronics','Furniture & Fixtures','Interior / Decorative','Signage / Branding Asset','Electrical / Utility Asset','Other'];
  modal('Add Asset / Equipment',`<div class="form-grid">
    <label>Asset Name<input id="asName"></label>
    <label>Segment<select id="asSeg">${seg.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <label>Brand / Model<input id="asBrand"></label>
    <label>Serial / Asset ID<input id="asSerial"></label>
    <label>Purchase Date<input id="asDate" type="date" value="${today()}"></label>
    <label>Purchase Cost<input id="asCost" type="number" value="0"></label>
    <label>Vendor<input id="asVendor"></label>
    <label>Location<input id="asLocation" placeholder="OPD / Panchakarma / Procedure Room"></label>
    <label>Status<select id="asStatus"><option>Active</option><option>Backup</option><option>Under Repair</option><option>Maintenance Due</option><option>Condemned</option></select></label>
    <label>Next Service<input id="asService" type="date"></label>
    <div class="full"><button class="primary" id="saveAssetBtn">Save Asset</button></div>
  </div>`);
  $('#saveAssetBtn').onclick=()=>{const x={id:uid('AST'),name:$('#asName').value,segment:$('#asSeg').value,brand:$('#asBrand').value,serial:$('#asSerial').value,purchaseDate:$('#asDate').value,cost:Number($('#asCost').value||0),vendor:$('#asVendor').value,location:$('#asLocation').value,status:$('#asStatus').value,nextService:$('#asService').value};db.assets.push(x);save(`Asset ${x.name} added`);closeModal();render();toast('Asset saved')};
}
function maintenanceModal(){
  const cats=['Clinical Equipment Repair','Ayurveda Equipment Repair','IT Repair','Electrical Maintenance','Plumbing / Water','Furniture Repair','Painting / Wall / Wallpaper','Civil Work','Signage / Branding Repair','AMC','Calibration','Interior Repair','Other'];
  modal('Add Repair / Maintenance',`<div class="form-grid">
    <label>Date<input id="mtDate" type="date" value="${today()}"></label>
    <label>Asset / Work<input id="mtAsset" placeholder="Autoclave / wall painting / AC"></label>
    <label>Category<select id="mtCat">${cats.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <label>Vendor / Technician<input id="mtVendor"></label>
    <label>Cost<input id="mtCost" type="number" value="0"></label>
    <label>Status<select id="mtStatus"><option>Completed</option><option>Due</option><option>Overdue</option><option>Under Repair</option></select></label>
    <label>Next Due<input id="mtDue" type="date"></label>
    <label>Paid / Pending<select id="mtPay"><option>Paid</option><option>Part Paid</option><option>Pending</option></select></label>
    <label class="full">Problem / Work Done<textarea id="mtNotes"></textarea></label>
    <div class="full"><button class="primary" id="saveMaintenanceBtn">Save Maintenance</button></div>
  </div>`);
  $('#saveMaintenanceBtn').onclick=()=>{const x={id:uid('MNT'),date:$('#mtDate').value,asset:$('#mtAsset').value,category:$('#mtCat').value,vendor:$('#mtVendor').value,cost:Number($('#mtCost').value||0),status:$('#mtStatus').value,nextDue:$('#mtDue').value,paymentStatus:$('#mtPay').value,notes:$('#mtNotes').value};db.maintenance.push(x);save(`Maintenance ${x.asset} added`);closeModal();render();toast('Maintenance saved')};
}

function bindModalActions(){
  $$('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
}
function action(a){
  const map={bill:billModal,income:incomeModal,expense:expenseModal,inventory:inventoryModal,vendor:vendorModal,staff:staffModal,swarnaprashan:swarnaModal,camp:campModal,asset:assetModal,maintenance:maintenanceModal};
  if(map[a]){closeModal();map[a]()}
}
function bindView(){
  $$('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
  $$('[data-viewjump]').forEach(b=>b.onclick=()=>{currentView=b.dataset.viewjump;render()});
  $$('[data-invtab]').forEach(b=>b.onclick=()=>{inventoryTab=b.dataset.invtab;render()});
  if($('#closeDayBtn')) $('#closeDayBtn').onclick=closeDay;
  if($('#saveSettingsBtn')) $('#saveSettingsBtn').onclick=()=>{db.settings.clinicName=$('#setClinicName').value;db.settings.owner=$('#setOwner').value;db.settings.consultationRate=Number($('#setConsult').value||0);db.settings.followupRate=Number($('#setFollow').value||0);save('Clinic settings updated');render();toast('Settings saved')};
  if($('#settingsBackupBtn')) $('#settingsBackupBtn').onclick=backup;
  if($('#restoreBtn')) $('#restoreBtn').onclick=restorePrompt;
  if($('#resetBtn')) $('#resetBtn').onclick=()=>{if(confirm('Reset ALL local app data? This cannot be undone without a backup.')){db=structuredClone(seed);save('Local data reset');render();toast('Local data reset')}};
}
function closeDay(){
  const opening=Number($('#closeOpening').value||0), actual=Number($('#closeActual').value||0);
  const bills=todays(db.bills), inc=todays(db.incomes), exp=todays(db.expenses);
  const cashIn=sum(bills,x=>x.cash)+sum(inc,x=>x.mode==='Cash'?x.amount:0);
  const cashOut=sum(exp,x=>x.mode==='Cash'?x.amount:0);
  const expected=opening+cashIn-cashOut, difference=actual-expected;
  db.closings.push({id:uid('CLS'),date:today(),opening,cashIn,cashOut,expected,actual,difference,notes:$('#closeNotes').value,closedAt:nowISO()});
  save(`Day ${today()} closed with difference ${difference}`);render();toast('Day closed');
}
function backup(){
  const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Mahamaya-Clinic-OS-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast('Backup downloaded');
}
function restorePrompt(){
  const i=document.createElement('input');i.type='file';i.accept='.json,application/json';
  i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.settings||!d.bills)throw new Error('Invalid');db=d;save('Backup restored');render();toast('Backup restored')}catch(e){alert('Invalid backup file')}};r.readAsText(f)};i.click();
}
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});


// V1.3 stable viewport + cloud UI refresh
function forceViewportLeft(){
  try{
    document.documentElement.scrollLeft=0;
    document.body.scrollLeft=0;
    if(window.scrollX!==0)window.scrollTo(0,window.scrollY||0);
  }catch(e){}
}
window.addEventListener('pageshow',()=>setTimeout(forceViewportLeft,0));
window.addEventListener('resize',()=>setTimeout(forceViewportLeft,0));
window.addEventListener('orientationchange',()=>setTimeout(forceViewportLeft,120));
window.addEventListener('mahamaya-cloud-updated',()=>{db=load();render();setTimeout(forceViewportLeft,0)});
window.addEventListener('mahamaya-cloud-ready',()=>{db=load();render();setTimeout(forceViewportLeft,0)});
setTimeout(forceViewportLeft,0);
