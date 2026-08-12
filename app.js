
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
  reminders:[], audit:[]
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
 statement:['Statements','Bank-style clinic financial history for any selected period.'],
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
function formatDate(d){
  if(!d) return 'No date';
  try{return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}catch{return d}
}
function reminderState(r){
  if(r.done) return 'done';
  if(!r.dueDate) return 'open';
  return r.dueDate<today()?'overdue':r.dueDate===today()?'today':'upcoming';
}
function reminderPriorityClass(p='Medium'){
  return ({High:'red',Medium:'orange',Low:'green'})[p]||'orange';
}
function upcomingReminders(limit=6){
  return [...(db.reminders||[])]
    .filter(r=>!r.done)
    .sort((a,b)=>String(a.dueDate||'9999-99-99').localeCompare(String(b.dueDate||'9999-99-99')))
    .slice(0,limit);
}
function reminderCounts(){
  const rows=(db.reminders||[]).filter(r=>!r.done);
  return {
    total:rows.length,
    overdue:rows.filter(r=>reminderState(r)==='overdue').length,
    today:rows.filter(r=>reminderState(r)==='today').length,
    upcoming:rows.filter(r=>reminderState(r)==='upcoming').length
  };
}
function renderReminderList(rows){
  if(!rows.length) return '<div class="empty">No reminders yet. Add your first reminder for payments, stock, maintenance, seva or follow-up tasks.</div>';
  return `<div class="reminder-stack">${rows.map(r=>{
    const state=reminderState(r), pri=reminderPriorityClass(r.priority), stateLabel=state==='overdue'?'Overdue':state==='today'?'Today':state==='done'?'Done':'Upcoming';
    return `<div class="reminder-item ${state}"><div class="reminder-main"><div class="reminder-meta"><span class="badge ${pri}">${esc(r.priority||'Medium')}</span><span class="badge">${esc(r.category||'General')}</span><span class="reminder-date">${formatDate(r.dueDate)}</span></div><b>${esc(r.title||'Reminder')}</b><small>${esc(r.note||'')}${r.linkedView?` • Open in ${esc(pageMeta[r.linkedView]?.[0]||r.linkedView)}`:''}</small></div><div class="reminder-actions"><span class="reminder-state ${state}">${stateLabel}</span><button class="small" data-remdone="${esc(r.id)}">✓ Done</button><button class="small" data-remdelete="${esc(r.id)}">Delete</button></div></div>`;
  }).join('')}</div>`;
}
function dailyWisdom(){
  const msgs=[
    'सेवा, शुचिता और समयपालन से ही समृद्धि स्थिर होती है।',
    'कृष्ण कृपा, व्यवस्थित कार्य और शांत मन — यही सफल क्लिनिक की शक्ति है।',
    'रोगी सेवा + स्पष्ट लेखा + समय पर follow-up = संतोष और प्रगति।'
  ];
  return msgs[new Date().getDate()%msgs.length];
}

function dashboard(){
  const bills=todays(db.bills), inc=todays(db.incomes), exp=todays(db.expenses);
  const billed=sum(bills,x=>x.total), received=sum(bills,billReceived)+sum(inc,x=>x.amount);
  const expenses=sum(exp,x=>x.amount), due=sum(bills,billDue);
  const low=db.inventory.filter(x=>Number(x.qty||0)<=Number(x.reorderLevel||0)).length;
  const pendingVendor=sum(db.vendors,x=>x.outstanding);
  const sw=monthRows(db.swarnaprashan);
  const swReceived=sum(sw,x=>x.received);
  const counts=reminderCounts();
  const monthBills=monthRows(db.bills), monthIncomes=monthRows(db.incomes), monthExpenses=monthRows(db.expenses);
  const monthReceived=sum(monthBills,billReceived)+sum(monthIncomes,x=>x.amount);
  const monthSpent=sum(monthExpenses,x=>x.amount);
  const monthSurplus=monthReceived-monthSpent;
  const nextMaintenance=[...db.maintenance].filter(x=>x.nextDue||x.status==='Due'||x.status==='Overdue').sort((a,b)=>String(a.nextDue||'9999-99-99').localeCompare(String(b.nextDue||'9999-99-99'))).slice(0,3);
  const recentIncome=[...db.incomes].reverse().slice(0,4);
  const dueBills=[...db.bills].filter(b=>billDue(b)>0).sort((a,b)=>billDue(b)-billDue(a)).slice(0,4);
  return `
  <div class="hero dashboard-hero">
    <div>
      <span class="badge green">Ayurvedic Prosperity Dashboard</span>
      <h3>${esc(db.settings.clinicName)}</h3>
      <p>Welcome, ${esc(db.settings.owner||'Doctor')}. This dashboard is designed to feel calm, sacred and practical — keeping finance, stock, reminders and clinic priorities together in one soothing Ayurveda-inspired space.</p>
      <div class="actions" style="margin-top:14px">
        <button class="primary" data-action="bill">+ New Bill</button>
        <button data-action="income">+ Add Income</button>
        <button data-action="expense">+ Expense</button>
        <button data-action="reminder">⏰ Reminder</button>
      </div>
      <div class="dashboard-wisdom">🙏 ${dailyWisdom()}</div>
    </div>
    <div class="hero-side dashboard-side">
      <div>
        <small class="muted">Today Received</small>
        <b>${money(received)}</b>
        <small class="muted">Expenses ${money(expenses)} • Due ${money(due)}</small>
        <div class="prosperity-pill ${monthSurplus>=0?'good':'watch'}">This month ${monthSurplus>=0?'surplus':'balance'} ${money(monthSurplus)}</div>
      </div>
    </div>
  </div>

  <div class="dashboard-shortcuts">
    <button data-viewjump="statement"><span>📑</span><b>Financial Statement</b><small>1 day → 1 year • PDF • Share</small></button>
    <button data-viewjump="reports"><span>📊</span><b>Reports</b><small>Monthly operational summary</small></button>
    <button data-action="bill"><span>🧾</span><b>Quick Bill</b><small>Fast patient billing</small></button>
    <button data-action="reminder"><span>⏰</span><b>Reminder</b><small>Payments • stock • tasks</small></button>
  </div>

  <div class="kpis">
    <div class="kpi"><span>Today Billing</span><b>${money(billed)}</b><small>${bills.length} bills</small></div>
    <div class="kpi"><span>Today Received</span><b>${money(received)}</b><small>Bill + other income</small></div>
    <div class="kpi"><span>Active Reminders</span><b>${counts.total}</b><small>${counts.overdue} overdue • ${counts.today} today</small></div>
    <div class="kpi"><span>Patient Due</span><b>${money(due)}</b><small>Today bills</small></div>
  </div>

  <div class="grid2">
    <div class="card">
      <div class="section-title"><div><h3>Main Operational Snapshot</h3><div class="muted">Everything important at one glance</div></div><button class="small" data-action="reminder">+ Add Reminder</button></div>
      <div class="focus-grid">
        <div class="focus-tile"><span>Low Stock</span><b>${low}</b><small>items need review</small></div>
        <div class="focus-tile"><span>Vendor Outstanding</span><b>${money(pendingVendor)}</b><small>payables</small></div>
        <div class="focus-tile"><span>Swarnaprashan</span><b>${money(swReceived)}</b><small>received this month</small></div>
        <div class="focus-tile"><span>Maintenance Due</span><b>${db.maintenance.filter(x=>x.status==='Due'||x.status==='Overdue').length}</b><small>asset/service tasks</small></div>
      </div>
    </div>
    <div class="card prayer-card">
      <h3>Clinic Dharma & Prosperity</h3>
      <div class="metric-list">
        <div class="metric-row"><span>Owner / Admin</span><b>${esc(db.settings.owner||'-')}</b></div>
        <div class="metric-row"><span>Cloud Status</span><b>${esc(document.getElementById('cloudLabel')?.textContent||'Local mode')}</b></div>
        <div class="metric-row"><span>Monthly Received</span><b>${money(monthReceived)}</b></div>
        <div class="metric-row"><span>Monthly Expenses</span><b>${money(monthSpent)}</b></div>
        <div class="metric-row"><span>Operational Balance</span><b>${money(monthSurplus)}</b></div>
      </div>
      <div class="prayer-note">श्रीकृष्ण कृपा से सेवा, सद्भाव और सुव्यवस्थित कार्य निरंतर बढ़ते रहें।</div>
    </div>
  </div>

  <div class="grid2" style="margin-top:14px">
    <div class="card">
      <div class="section-title"><div><h3>Important Reminders</h3><div class="muted">Overdue, today and upcoming reminders</div></div><button class="small" data-action="reminder">+ New</button></div>
      ${renderReminderList(upcomingReminders(6))}
    </div>
    <div class="card">
      <div class="section-title"><div><h3>What Needs Attention?</h3><div class="muted">Immediate actionable items</div></div><div class="actions"><button class="small" data-viewjump="statement">📑 Statement</button><button class="small" data-viewjump="reports">Reports</button></div></div>
      <div class="alert-list">
        <div class="alert ${low?'red':''}">${low} low/out-of-stock item(s)</div>
        <div class="alert ${counts.overdue?'red':''}">${counts.overdue} reminder(s) overdue</div>
        <div class="alert ${dueBills.length?'red':''}">${dueBills.length} bill(s) still having due amount</div>
        <div class="alert">${money(pendingVendor)} vendor outstanding</div>
      </div>
      <h4>Due Bills</h4>
      <div class="list-cards">${dueBills.map(b=>`<div class="item-row"><div><b>${esc(b.patient||'Patient')}</b><br><small>${formatDate(b.date)} • Due ${money(billDue(b))}</small></div></div>`).join('')||'<div class="empty">No due bills.</div>'}</div>
    </div>
  </div>

  <div class="grid2" style="margin-top:14px">
    <div class="card">
      <div class="section-title"><div><h3>Inventory & Service Overview</h3><div class="muted">Stock health and vertical contribution</div></div><button class="small" data-viewjump="inventory">Open Inventory</button></div>
      <div class="inventory-cards">
        <div class="inv-card"><span class="muted">Ayurveda</span><b>${money(invValue('Ayurveda Medicines'))}</b></div>
        <div class="inv-card"><span class="muted">Allopathy</span><b>${money(invValue('Allopathic Medicines'))}</b></div>
        <div class="inv-card"><span class="muted">Low Stock</span><b>${low}</b></div>
        <div class="inv-card"><span class="muted">Total Stock Value</span><b>${money(invValue())}</b></div>
      </div>
      <h4 style="margin-top:16px">This Month by Vertical</h4>
      ${verticalSummary()}
    </div>
    <div class="card">
      <div class="section-title"><div><h3>Recent Income & Maintenance</h3><div class="muted">Fresh activity snapshot</div></div><button class="small" data-viewjump="closing">Daily Closing</button></div>
      <h4>Recent Income</h4>
      <div class="list-cards">${recentIncome.map(x=>`<div class="item-row"><div><b>${esc(x.source||'Income')}</b><br><small>${formatDate(x.date)} • ${esc(x.mode||'-')}</small></div><b>${money(x.amount)}</b></div>`).join('')||'<div class="empty">No recent income.</div>'}</div>
      <h4>Upcoming Maintenance / AMC</h4>
      <div class="list-cards">${nextMaintenance.map(x=>`<div class="item-row"><div><b>${esc(x.asset||'Maintenance')}</b><br><small>${esc(x.category||'-')} • ${formatDate(x.nextDue||x.date)}</small></div><span class="badge ${x.status==='Overdue'?'red':x.status==='Due'?'orange':'green'}">${esc(x.status||'Planned')}</span></div>`).join('')||'<div class="empty">No maintenance schedules.</div>'}</div>
    </div>
  </div>

  <div class="grid2" style="margin-top:14px">
    <div class="card">
      <h3>Recent Audit Activity</h3>
      <div class="list-cards">${db.audit.slice(0,6).map(a=>`<div class="item-row"><div><b>${esc(a.action)}</b><br><small>${new Date(a.ts).toLocaleString()}</small></div></div>`).join('')||'<div class="empty">No activity yet.</div>'}</div>
    </div>
    <div class="card">
      <h3>Quick Remembrance</h3>
      <div class="dashboard-mantra">“कर्मण्येवाधिकारस्ते” — stay focused on service, accuracy and compassionate care.</div>
      <p class="muted">Use reminders for due payments, stock purchase, maintenance, staff salary, Swarnaprashan events, camp planning and daily closing follow-up.</p>
      <div class="actions"><button data-action="reminder">Set Reminder</button><button data-viewjump="settings">Open Settings</button></div>
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
  return `<div class="section-title"><div><h3>Patient Bills</h3><div class="muted">Fast billing, collections and due tracking</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary" data-action="bill">+ New Bill</button></div></div>
  ${table(rows,['Date','Patient','Services','Total','Received','Due','Mode'],b=>[
    esc(b.date),esc(b.patient),esc((b.items||[]).map(i=>i.name).join(', ')),money(b.total),money(billReceived(b)),money(billDue(b)),esc(b.mode||'Split')
  ])}`;
}
function income(){
  return `<div class="section-title"><div><h3>Income Ledger</h3><div class="muted">Track every clinic and professional income source</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary" data-action="income">+ Add Income</button></div></div>
  ${table([...db.incomes].reverse(),['Date','Source','Category','Amount','Mode','Handled By'],x=>[esc(x.date),esc(x.source),esc(x.category),money(x.amount),esc(x.mode),esc(x.handledBy||'-')])}`;
}
function expenses(){
  return `<div class="section-title"><div><h3>Expense Ledger</h3><div class="muted">Expenses, payables and operational cost control</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary" data-action="expense">+ Add Expense</button></div></div>
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
  return `<div class="section-title"><div><h3>Vendor / Party Master</h3><div class="muted">Suppliers, purchase history and outstanding management</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary" data-action="vendor">+ Add Vendor</button></div></div>
  ${table(db.vendors,['Party','Type','Contact','Total Purchase','Paid','Outstanding','Actions'],x=>[
    esc(x.name),esc(x.type),esc(x.phone||'-'),money(x.totalPurchase),money(x.paid),money(x.outstanding),
    `<a href="${x.phone?'tel:'+esc(x.phone):'#'}">Call</a> ${x.phone?`• <a href="https://wa.me/91${esc(x.phone.replace(/\D/g,''))}" target="_blank">WhatsApp</a>`:''}`
  ])}`;
}
function staff(){
  return `<div class="section-title"><div><h3>Staff & Payroll</h3><div class="muted">Team details, salary and pending accountability</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary" data-action="staff">+ Add Staff</button></div></div>
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
  <div class="section-title"><div><h3>Monthly Swarnaprashan Ledger</h3><div class="muted">Pushya-wise activity, billing and administration tracking</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary" data-action="swarnaprashan">+ Add Entry</button></div></div>
  ${table(rows,['Date','Child / Event','Clinic Dose','Home Use','Billing','Received','Mode','Administered By','Payment By'],x=>[
    esc(x.date),esc(x.child),esc(x.clinicDose),esc(x.homeUse),money(x.billed),money(x.received),esc(x.mode),esc(x.administeredBy||'-'),esc(x.paymentBy||'-')
  ])}`;
}
function camps(){
  return `<div class="section-title"><div><h3>Camp / Seva Cost Centres</h3><div class="muted">Events, seva and sponsor-backed outreach management</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary" data-action="camp">+ Add Camp</button></div></div>
  ${table(db.camps,['Date','Camp','Type','Patients','Expense','Donation/Sponsor','Net Clinic Contribution','Location'],x=>[
    esc(x.date),esc(x.name),esc(x.type),esc(x.patients),money(x.expense),money(x.support),money(Math.max(0,Number(x.expense)-Number(x.support))),esc(x.location||'-')
  ])}`;
}
function assets(){
  return `<div class="grid2">
    <div class="card">
      <div class="section-title"><div><h3>Assets / Equipment</h3><div class="muted">Clinical and non-clinical asset overview</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary small" data-action="asset">+ Add Asset</button></div></div>
      ${table(db.assets,['Asset','Segment','Location','Cost','Status','Next Service'],x=>[esc(x.name),esc(x.segment),esc(x.location||'-'),money(x.cost),esc(x.status),esc(x.nextService||'-')])}
    </div>
    <div class="card">
      <div class="section-title"><div><h3>Repair / Maintenance / AMC</h3><div class="muted">Schedule service, due dates and repair follow-up</div></div><div class="actions"><button data-action="reminder">⏰ Reminder</button><button class="primary small" data-action="maintenance">+ Add Maintenance</button></div></div>
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
let statementPresetDays=30;
function dateShift(days){
  const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}
function selectedStatementRange(){
  const from=$('#stmtFrom')?.value||dateShift(-(statementPresetDays-1));
  const to=$('#stmtTo')?.value||today();
  return {from,to};
}
function inRange(x,from,to){
  const d=String(x.date||'').slice(0,10);
  return d && d>=from && d<=to;
}
function statementTransactions(from,to){
  const rows=[];
  db.bills.filter(x=>inRange(x,from,to)).forEach(b=>{
    const received=billReceived(b), due=billDue(b);
    rows.push({date:b.date,type:'Patient Bill',ref:b.id,party:b.patient||'Patient',category:(b.items||[]).map(i=>i.group).filter(Boolean).join(', ')||'Clinical Service',inflow:received,outflow:0,due,note:b.notes||'',mode:['Cash','UPI','Card','Bank','Advance'].filter(k=>Number(b[k.toLowerCase()]||0)>0).join(' + ')});
  });
  db.incomes.filter(x=>inRange(x,from,to)).forEach(x=>{
    rows.push({date:x.date,type:'Other Income',ref:x.id,party:x.source||'Income',category:x.category||'Other Income',inflow:Number(x.amount||0),outflow:0,due:0,note:x.notes||'',mode:x.mode||''});
  });
  db.expenses.filter(x=>inRange(x,from,to)).forEach(x=>{
    rows.push({date:x.date,type:'Expense',ref:x.id,party:x.paidTo||x.name||'Expense',category:x.category||'Expense',inflow:0,outflow:Number(x.amount||0),due:x.status==='Pending'?Number(x.amount||0):0,note:x.notes||'',mode:x.mode||''});
  });
  return rows.sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.type).localeCompare(String(b.type)));
}
function stmtPeriodLabel(days){
  return ({1:'1 Day',7:'1 Week',14:'2 Weeks',21:'3 Weeks',30:'1 Month',60:'2 Months',90:'3 Months',180:'6 Months',270:'9 Months',365:'1 Year'})[days]||`${days} Days`;
}
function statement(){
  const to=today(), from=dateShift(-(statementPresetDays-1));
  return `
  <div class="statement-hero card">
    <div>
      <span class="badge green">Financial History & Audit</span>
      <h3>Clinic Financial Statement</h3>
      <p class="muted">Bank-statement style view of patient receipts, other income and expenses. Select a period, review the ledger, then print/save PDF or share a summary.</p>
    </div>
    <div class="statement-version">Mahamaya Clinic OS • V1.6</div>
  </div>

  <div class="card statement-controls">
    <div class="section-title"><div><h3>Select Period</h3><div class="muted">Quick intervals or custom From–To dates</div></div><span class="badge orange" id="stmtPeriodBadge">${stmtPeriodLabel(statementPresetDays)}</span></div>
    <div class="statement-presets">
      ${[1,7,14,21,30,60,90,180,270,365].map(d=>`<button class="small ${d===statementPresetDays?'active':''}" data-stmtdays="${d}">${stmtPeriodLabel(d)}</button>`).join('')}
    </div>
    <div class="form-grid statement-date-grid">
      <label>From<input id="stmtFrom" type="date" value="${from}"></label>
      <label>To<input id="stmtTo" type="date" value="${to}"></label>
      <div class="full actions">
        <button class="primary" id="stmtGenerateBtn">Generate Statement</button>
        <button id="stmtPrintBtn">🖨 Print / Save PDF</button>
        <button id="stmtCsvBtn">⬇ CSV</button>
        <button id="stmtShareBtn">🟢 WhatsApp / Share</button>
      </div>
    </div>
  </div>
  <div id="statementOutput">${statementOutput(from,to)}</div>`;
}
function statementOutput(from,to){
  const rows=statementTransactions(from,to);
  const inflow=sum(rows,x=>x.inflow), outflow=sum(rows,x=>x.outflow), due=sum(rows,x=>x.due), net=inflow-outflow;
  const bills=db.bills.filter(x=>inRange(x,from,to));
  const expenses=db.expenses.filter(x=>inRange(x,from,to));
  const modes={Cash:0,UPI:0,Card:0,Bank:0,Advance:0};
  bills.forEach(x=>Object.keys(modes).forEach(k=>modes[k]+=Number(x[k.toLowerCase()]||0)));
  db.incomes.filter(x=>inRange(x,from,to)).forEach(x=>{if(modes[x.mode]!=null)modes[x.mode]+=Number(x.amount||0)});
  return `
    <div class="statement-print-head">
      <div><b>${esc(db.settings.clinicName)}</b><br><small>${esc(db.settings.owner||'')}</small></div>
      <div><b>Financial Statement</b><br><small>${formatDate(from)} → ${formatDate(to)}</small></div>
    </div>
    <div class="kpis statement-kpis">
      <div class="kpi"><span>Total Received</span><b>${money(inflow)}</b><small>${bills.length} patient bill(s) + other income</small></div>
      <div class="kpi"><span>Total Expenses</span><b>${money(outflow)}</b><small>${expenses.length} expense entry/entries</small></div>
      <div class="kpi"><span>Net Operational</span><b>${money(net)}</b><small>${net>=0?'Surplus':'Deficit'} in selected period</small></div>
      <div class="kpi"><span>Recorded Due</span><b>${money(due)}</b><small>Patient/pending amount context</small></div>
    </div>
    <div class="grid2 statement-summary-grid">
      <div class="card"><h3>Collection Modes</h3><div class="metric-list">${Object.entries(modes).map(([k,v])=>`<div class="metric-row"><span>${k}</span><b>${money(v)}</b></div>`).join('')}</div></div>
      <div class="card"><h3>Period Snapshot</h3><div class="metric-list">
        <div class="metric-row"><span>From</span><b>${formatDate(from)}</b></div>
        <div class="metric-row"><span>To</span><b>${formatDate(to)}</b></div>
        <div class="metric-row"><span>Transactions</span><b>${rows.length}</b></div>
        <div class="metric-row"><span>Generated</span><b>${new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</b></div>
      </div></div>
    </div>
    <div class="card statement-ledger-card">
      <div class="section-title"><div><h3>Date-wise Ledger</h3><div class="muted">Chronological receipts and expenses</div></div><span class="badge">${rows.length} entries</span></div>
      ${rows.length?`<div class="table-wrap statement-table"><table><thead><tr><th>Date</th><th>Type / Ref</th><th>Party / Patient</th><th>Category</th><th>Mode</th><th>Received</th><th>Expense</th><th>Due</th><th>Note</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${formatDate(r.date)}</td><td><b>${esc(r.type)}</b><br><small>${esc(r.ref||'')}</small></td><td>${esc(r.party)}</td><td>${esc(r.category)}</td><td>${esc(r.mode||'-')}</td><td class="money-in">${r.inflow?money(r.inflow):'-'}</td><td class="money-out">${r.outflow?money(r.outflow):'-'}</td><td>${r.due?money(r.due):'-'}</td><td>${esc(r.note||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No transactions in this period.</div>'}
    </div>`;
}
function refreshStatement(){
  const {from,to}=selectedStatementRange();
  if(from>to){alert('From date cannot be after To date.');return}
  $('#statementOutput').innerHTML=statementOutput(from,to);
  $('#stmtPeriodBadge').textContent=`${formatDate(from)} → ${formatDate(to)}`;
}
function statementShareText(){
  const {from,to}=selectedStatementRange(), rows=statementTransactions(from,to);
  const inflow=sum(rows,x=>x.inflow), outflow=sum(rows,x=>x.outflow), due=sum(rows,x=>x.due), net=inflow-outflow;
  return `${db.settings.clinicName} — Financial Statement
Period: ${formatDate(from)} to ${formatDate(to)}
Total received: ${money(inflow)}
Total expenses: ${money(outflow)}
Net operational: ${money(net)}
Recorded due: ${money(due)}
Transactions: ${rows.length}
Generated from Mahamaya Clinic OS V1.6`;
}
function shareStatement(){
  const text=statementShareText();
  if(navigator.share){navigator.share({title:'Mahamaya Clinic Financial Statement',text}).catch(()=>{});return}
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}
function csvEscape(v){return `"${String(v??'').replaceAll('"','""')}"`}
function downloadStatementCSV(){
  const {from,to}=selectedStatementRange(), rows=statementTransactions(from,to);
  const data=[['Date','Type','Reference','Party/Patient','Category','Mode','Received','Expense','Due','Note'],...rows.map(r=>[r.date,r.type,r.ref,r.party,r.category,r.mode,r.inflow,r.outflow,r.due,r.note])];
  const blob=new Blob([data.map(row=>row.map(csvEscape).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Mahamaya-Clinic-Statement-${from}-to-${to}.csv`;a.click();URL.revokeObjectURL(a.href);toast('Statement CSV downloaded');
}
function printStatement(){
  document.body.classList.add('statement-printing');
  setTimeout(()=>{window.print();setTimeout(()=>document.body.classList.remove('statement-printing'),400)},40);
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
      <p class="muted">Local-first safety remains active. Cloud sync/login configuration is preserved. Keep regular JSON backups for independent recovery.</p>
    </div>
  </div>`;
}
const views={dashboard,billing,income,expenses,inventory,vendors,staff,swarnaprashan,camps,assets,closing,reports,statement,settings};

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
    <button data-action="maintenance">🛠 Maintenance</button>
    <button data-action="reminder">⏰ Reminder</button>
  </div>`,'Choose the transaction or reminder you want to enter.');
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

function reminderModal(prefill={}){
  const linked=Object.entries(pageMeta).map(([k,v])=>`<option value="${k}" ${String(prefill.linkedView||currentView)===k?'selected':''}>${esc(v[0])}</option>`).join('');
  modal('Add Reminder',`<div class="form-grid">
    <label>Reminder Title<input id="rTitle" value="${esc(prefill.title||'')}" placeholder="Vendor payment / stock reorder / salary / follow-up"></label>
    <label>Category<select id="rCategory"><option ${prefill.category==='Payment'?'selected':''}>Payment</option><option ${prefill.category==='Stock'?'selected':''}>Stock</option><option ${prefill.category==='Maintenance'?'selected':''}>Maintenance</option><option ${prefill.category==='Staff'?'selected':''}>Staff</option><option ${prefill.category==='Swarnaprashan'?'selected':''}>Swarnaprashan</option><option ${prefill.category==='Camp'?'selected':''}>Camp</option><option ${prefill.category==='Personal'?'selected':''}>Personal</option><option ${!prefill.category||prefill.category==='General'?'selected':''}>General</option></select></label>
    <label>Due Date<input id="rDueDate" type="date" value="${esc(prefill.dueDate||today())}"></label>
    <label>Priority<select id="rPriority"><option ${prefill.priority==='High'?'selected':''}>High</option><option ${!prefill.priority||prefill.priority==='Medium'?'selected':''}>Medium</option><option ${prefill.priority==='Low'?'selected':''}>Low</option></select></label>
    <label>Open With Page<select id="rLinked">${linked}</select></label>
    <label>Status<select id="rStatus"><option>Open</option><option>Planned</option></select></label>
    <label class="full">Notes<textarea id="rNote" placeholder="What exactly should be remembered? amount, contact, follow-up, stock name etc.">${esc(prefill.note||'')}</textarea></label>
    <div class="full"><button class="primary" id="saveReminderBtn">Save Reminder</button></div>
  </div>`,'Create reminders for finance, stock, maintenance, salary, seva, follow-up or any important clinic work.');
  $('#saveReminderBtn').onclick=()=>{
    const x={id:uid('REM'),title:$('#rTitle').value||'Reminder',category:$('#rCategory').value,dueDate:$('#rDueDate').value,priority:$('#rPriority').value,linkedView:$('#rLinked').value,status:$('#rStatus').value,note:$('#rNote').value,done:false,createdAt:nowISO()};
    db.reminders=(db.reminders||[]);
    db.reminders.push(x);
    save(`Reminder ${x.title} added`);
    closeModal();render();toast('Reminder saved');
  };
}

function bindModalActions(){
  $$('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
}
function action(a){
  const map={bill:billModal,income:incomeModal,expense:expenseModal,inventory:inventoryModal,vendor:vendorModal,staff:staffModal,swarnaprashan:swarnaModal,camp:campModal,asset:assetModal,maintenance:maintenanceModal,reminder:()=>reminderModal({linkedView:currentView,category: currentView==='expenses'||currentView==='vendors'?'Payment':currentView==='inventory'?'Stock':currentView==='assets'?'Maintenance':currentView==='staff'?'Staff':currentView==='swarnaprashan'?'Swarnaprashan':currentView==='camps'?'Camp':'General'})};
  if(map[a]){closeModal();map[a]()}
}
function bindView(){
  $$('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
  $$('[data-viewjump]').forEach(b=>b.onclick=()=>{currentView=b.dataset.viewjump;render()});
  $('[data-invtab]').forEach(b=>b.onclick=()=>{inventoryTab=b.dataset.invtab;render()});
  $('[data-remdone]').forEach(b=>b.onclick=()=>{const id=b.dataset.remdone; const r=(db.reminders||[]).find(x=>x.id===id); if(r){r.done=true;r.doneAt=nowISO();save(`Reminder ${r.title} completed`);render();toast('Reminder marked done')}});
  $('[data-remdelete]').forEach(b=>b.onclick=()=>{const id=b.dataset.remdelete; const r=(db.reminders||[]).find(x=>x.id===id); if(confirm('Delete this reminder?')){db.reminders=(db.reminders||[]).filter(x=>x.id!==id);save(`Reminder ${r?.title||id} deleted`);render();toast('Reminder deleted')}});
  $$('[data-stmtdays]').forEach(b=>b.onclick=()=>{
    statementPresetDays=Number(b.dataset.stmtdays||30);
    const to=today(),from=dateShift(-(statementPresetDays-1));
    $('#stmtFrom').value=from;$('#stmtTo').value=to;
    $$('[data-stmtdays]').forEach(x=>x.classList.toggle('active',x===b));
    refreshStatement();
  });
  if($('#stmtGenerateBtn')) $('#stmtGenerateBtn').onclick=refreshStatement;
  if($('#stmtPrintBtn')) $('#stmtPrintBtn').onclick=printStatement;
  if($('#stmtCsvBtn')) $('#stmtCsvBtn').onclick=downloadStatementCSV;
  if($('#stmtShareBtn')) $('#stmtShareBtn').onclick=shareStatement;
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
