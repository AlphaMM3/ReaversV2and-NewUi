const $ = (s)=>document.querySelector(s);
const escapeHtml = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={me:null,nav:'dashboard',csrf:null,cache:{},renderVersion:0};
function toggleDrawer(force) {
  const sidebar = $('#sidebar') || $('.sidebar');
  const backdrop = $('#drawerBackdrop');
  if (!sidebar) return;
  const isOpen = force !== undefined ? Boolean(force) : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', isOpen);
  if (backdrop) backdrop.classList.toggle('hidden', !isOpen);
  const toggle = $('#menuToggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
}
function clearView(){state.renderVersion++;$('#content').replaceChildren();document.querySelectorAll('.modalback').forEach(el=>el.remove());$('#toast').classList.remove('show');toggleDrawer(false);}
if($('#menuToggle')) $('#menuToggle').onclick=()=>toggleDrawer();
if($('#sidebarClose')) $('#sidebarClose').onclick=()=>toggleDrawer(false);
if($('#drawerBackdrop')) $('#drawerBackdrop').onclick=()=>toggleDrawer(false);
function note(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4400)}
async function request(path,{method='GET',body}={}){
 const res=await fetch('/api'+path,{method,credentials:'same-origin',headers:{...(body?{'content-type':'application/json'}:{}),...(method!=='GET'?{'x-csrf-token':state.csrf||''}:{})},body:body?JSON.stringify(body):undefined});
 const payload=await res.json().catch(()=>({detail:'Server error'}));
 if(!res.ok)throw new Error(typeof payload.detail==='string'?payload.detail:JSON.stringify(payload.detail||payload));
 return payload;
}
async function initial(){if(location.hash.startsWith('#reset=')){clearView();$('#auth').classList.remove('hidden');$('#app').classList.add('hidden');return resetPasswordModal(new URLSearchParams(location.hash.slice(1)).get('reset'));}try{state.me=await request('/me');state.csrf=state.me.csrf;showApp()}catch{clearView();$('#auth').classList.remove('hidden');$('#app').classList.add('hidden')}}
$('#loginForm').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));try{const r=await request('/login',{method:'POST',body:d});state.csrf=r.csrf;state.me=await request('/me');showApp()}catch(err){note(err.message)}};
$('#logout').onclick=async()=>{clearView();$('#app').classList.add('hidden');try{await request('/logout',{method:'POST'})}catch{}state.me=null;state.csrf=null;$('#loginForm').reset();await initial()};
const admin=()=>['central_admin','branch_admin'].includes(state.me?.role);
const staff=()=>Boolean(state.me && !state.me.role?.startsWith('guardian'));

const navIcons = {
  dashboard: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  classes: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  routines: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  reports: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  'attendance-monthly': '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  'report-monitor': '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  homework: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="16" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/></svg>',
  assessments: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
  progress: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="2 6 12 2 22 6"/></svg>',
  resources: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  'attendance-workspace': '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
  admissions: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
  students: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  enrollments: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="9 14 11 16 15 12"/></svg>',
  branches: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><circle cx="12" cy="11" r="2"/></svg>',
  departments: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  courses: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
  batches: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  families: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  users: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  'academic-sessions': '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  payments: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  'packages-contracts': '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  invoices: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  'teacher-payables': '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  audit: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  announcements: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  account: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  default: '<svg class="nav-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg>'
};

function menus(){
  const role = state.me?.role || '';
  const isStaff = staff();
  const isAdmin = admin();
  const isCentral = role === 'central_admin';
  const isZimmadar = role === 'zimmadar';
  const isGuardian = role.startsWith('guardian');

  const list = [
    ['dashboard', 'Overview', 'Main', 'dashboard']
  ];

  // Academic Operations
  const acad = [];
  acad.push(['classes', 'Classes', 'Academic Operations', 'classes']);
  if (isAdmin || isZimmadar) acad.push(['routines', 'Weekly routine', 'Academic Operations', 'routines']);
  if (isStaff) acad.push(['reports', 'Reports', 'Academic Operations', 'reports']);
  acad.push(['attendance-monthly', 'Monthly Attendance', 'Academic Operations', 'attendance-monthly']);
  if (isStaff) acad.push(['report-monitor', 'Report Monitor', 'Academic Operations', 'report-monitor']);
  list.push(...acad);

  // Learning & Progress
  const learn = [];
  learn.push(['homework', 'Homework', 'Learning & Progress', 'homework']);
  if (isStaff) learn.push(['assessments', 'Assessments & Marks', 'Learning & Progress', 'assessments']);
  learn.push(['progress', 'Published Progress', 'Learning & Progress', 'progress']);
  learn.push(['resources', 'Course Resources', 'Learning & Progress', 'resources']);
  list.push(...learn);

  // Student Care & Admissions
  const care = [];
  care.push(['attendance-workspace', 'Attendance & care', 'Care & Admissions', 'attendance-workspace']);
  if (isAdmin || isGuardian) care.push(['admissions', 'Admissions', 'Care & Admissions', 'admissions']);
  care.push(['students', 'Students', 'Care & Admissions', 'students']);
  care.push(['enrollments', 'Enrollments', 'Care & Admissions', 'enrollments']);
  list.push(...care);

  // Academy Administration
  if (isAdmin) {
    const adm = [];
    if (isCentral) adm.push(['branches', 'Branches', 'Academy Administration', 'branches']);
    adm.push(['departments', 'Departments', 'Academy Administration', 'departments']);
    adm.push(['courses', 'Courses', 'Academy Administration', 'courses']);
    adm.push(['batches', 'Batches', 'Academy Administration', 'batches']);
    adm.push(['families', 'Families', 'Academy Administration', 'families']);
    adm.push(['users', 'Users', 'Academy Administration', 'users']);
    adm.push(['academic-sessions', 'Academic sessions', 'Academy Administration', 'academic-sessions']);
    adm.push(['payments', 'Payment References', 'Academy Administration', 'payments']);
    if (isCentral) adm.push(['audit', 'Audit Log', 'Academy Administration', 'audit']);
    list.push(...adm);
  }

  // Commercial 1:1 & Financial Ledger (AM-18, D-011, D-015, D-141, D-025)
  const fin = [];
  fin.push(['packages-contracts', '1:1 Packages & Ledger', 'Commercial & Finance', 'packages-contracts']);
  if (isAdmin || isGuardian) fin.push(['invoices', 'Tuition Invoices', 'Commercial & Finance', 'invoices']);
  if (isAdmin || isZimmadar || role === 'teacher') fin.push(['teacher-payables', 'Teacher Compensation', 'Commercial & Finance', 'teacher-payables']);
  list.push(...fin);

  // Communication & Account
  list.push(['announcements', 'Announcements', 'Communication & Account', 'announcements']);
  list.push(['account', 'Account', 'Communication & Account', 'account']);

  return list;
}

function renderNav(){
  const items = menus();
  const groups = new Map();
  for (const item of items) {
    const cat = item[2] || 'Main';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(item);
  }
  let html = '';
  for (const [category, list] of groups.entries()) {
    html += `<div class="nav-section"><div class="nav-section-title">${escapeHtml(category)}</div><div class="nav-section-items">` +
      list.map(([id, title, _c, iconKey]) =>
        `<button data-nav="${id}" class="nav-btn${state.nav === id ? ' active' : ''}" type="button">${navIcons[iconKey] || navIcons.default}<span class="nav-label">${escapeHtml(title)}</span></button>`
      ).join('') +
      `</div></div>`;
  }
  return html;
}

function renderBottomNav() {
  const active = state.nav;
  const items = [
    ['dashboard', 'Home', '<svg class="bottom-nav-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'],
    ['classes', 'Classes', '<svg class="bottom-nav-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'],
    ['homework', 'Tasks', '<svg class="bottom-nav-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'],
    ['attendance-workspace', 'Care', '<svg class="bottom-nav-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>'],
    ['more', 'Menu', '<svg class="bottom-nav-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>']
  ];
  return items.map(([id, label, icon]) => {
    const isAct = (id === 'more') ? false : (active === id);
    return `<button type="button" class="bottom-nav-btn${isAct ? ' active' : ''}" data-bottom-nav="${id}">${icon}<span>${escapeHtml(label)}</span></button>`;
  }).join('');
}

function showApp(){
  clearView();
  $('#auth').classList.add('hidden');
  $('#app').classList.remove('hidden');
  const roleName = (state.me?.role || '').replaceAll('_', ' ');
  const initials = (state.me?.name || 'User').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  $('#loggedUser').innerHTML = `<div class="user-chip"><div class="user-avatar">${escapeHtml(initials)}</div><div class="user-meta"><b class="user-name">${escapeHtml(state.me?.name || 'User')}</b><span class="user-role">${escapeHtml(roleName)}</span></div></div>`;
  $('#nav').innerHTML = renderNav();
  $('#nav').onclick = e => {
    const b = e.target.closest('[data-nav]');
    if (b) {
      toggleDrawer(false);
      navigate(b.dataset.nav);
    }
  };
  const bNav = $('#bottomNav');
  if (bNav) {
    bNav.innerHTML = renderBottomNav();
    bNav.onclick = e => {
      const b = e.target.closest('[data-bottom-nav]');
      if (!b) return;
      const target = b.dataset.bottomNav;
      if (target === 'more') {
        toggleDrawer(true);
      } else {
        toggleDrawer(false);
        navigate(target);
      }
    };
  }
  const closeBtn = $('#sidebarClose');
  if (closeBtn) closeBtn.onclick = () => toggleDrawer(false);
  const backdrop = $('#drawerBackdrop');
  if (backdrop) backdrop.onclick = () => toggleDrawer(false);
  navigate('dashboard');
}

function navigate(id){
  if (id === 'audit' && state.nav !== 'audit') { state.auditBefore = null; state.auditHistory = []; }
  state.nav = id;
  clearView();
  toggleDrawer(false);
  $('#content').innerHTML = '<div class="panel" role="status">Loading…</div>';
  for (const b of document.querySelectorAll('[data-nav]')) b.classList.toggle('active', b.dataset.nav === id);
  for (const b of document.querySelectorAll('[data-bottom-nav]')) b.classList.toggle('active', b.dataset.bottomNav === id);
  const activeItem = menus().find(x => x[0] === id);
  $('#pageTitle').textContent = activeItem ? activeItem[1] : id;
  const topEyebrow = document.querySelector('.topbar .eyebrow');
  if (topEyebrow && activeItem && activeItem[2]) {
    const roleScope = state.me?.role === 'teacher'
      ? 'TEACHER WORKSPACE'
      : state.me?.role === 'zimmadar'
        ? 'ZIMMADAR DESK'
        : state.me?.role?.startsWith('guardian')
          ? 'GUARDIAN PORTAL'
          : 'ACADEMY MANAGEMENT';
    topEyebrow.textContent = activeItem[2].toUpperCase() + ' · ' + roleScope;
  }
  const version = state.renderVersion;
  render().catch(err => {
    if (state.renderVersion === version + 1) {
      $('#content').textContent = 'Could not load this view. Select it again to retry.';
      note(err.message);
    }
  });
}
function table(headers,rows,tableId=null){
  if(!rows.length)return '<div class="empty">No records yet.</div>';
  const idAttr=tableId?` id="${escapeHtml(tableId)}" class="filterable-table responsive-data-table"`:' class="responsive-data-table"';
  const labeledRows=rows.map(rowStr=>{
    let colIndex=0;
    return rowStr.replace(/<td\b([^>]*)>/gi,(match,attrs)=>{
      const headerLabel=headers[colIndex]||'';
      colIndex++;
      if(attrs.includes('data-label='))return match;
      return `<td data-label="${escapeHtml(headerLabel)}"${attrs}>`;
    });
  });
  return `<div class="table-wrap"><table${idAttr}><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${labeledRows.join('')}</tbody></table><div class="table-no-results hidden">No matching records found.</div></div>`;
}
function tableSearchToolbar(tableId,placeholder,filterOpts=null){
  let filterHtml='';
  if(filterOpts&&filterOpts.length){
    filterHtml=`<div class="table-toolbar-filter"><select class="table-filter-select" data-table-filter="${escapeHtml(tableId)}">${filterOpts.map(([val,label])=>`<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`).join('')}</select></div>`;
  }
  return `<div class="table-toolbar"><div class="table-toolbar-search"><svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" class="table-search-input" data-table-search="${escapeHtml(tableId)}" placeholder="${escapeHtml(placeholder)}" aria-label="Search records"><button type="button" class="search-clear-btn hidden" aria-label="Clear search">&times;</button></div>${filterHtml}<div class="table-count-badge" id="${escapeHtml(tableId)}-count"></div></div>`;
}
function initTableFilterListeners(){
  const content=$('#content');
  if(!content||typeof content.addEventListener!=='function'||content._hasFilterListeners)return;
  content._hasFilterListeners=true;
  content.addEventListener('input',e=>{const input=e.target?.closest?.('[data-table-search]');if(input)applyTableFilter(input.dataset.tableSearch);});
  content.addEventListener('change',e=>{const select=e.target?.closest?.('[data-table-filter]');if(select)applyTableFilter(select.dataset.tableFilter);});
  content.addEventListener('click',e=>{
    const clearBtn=e.target?.closest?.('.search-clear-btn');
    if(!clearBtn)return;
    const searchBox=clearBtn.closest?.('.table-toolbar-search');
    const input=searchBox?.querySelector?.('[data-table-search]');
    if(input){input.value='';clearBtn.classList.add('hidden');applyTableFilter(input.dataset.tableSearch);input.focus?.();}
  });
}
function applyTableFilter(tableId){
  if(typeof document==='undefined'||typeof document.getElementById!=='function')return;
  const tbl=document.getElementById(tableId);if(!tbl||typeof tbl.querySelectorAll!=='function')return;
  const searchInput=document.querySelector?document.querySelector(`[data-table-search="${tableId}"]`):null;
  const filterSelect=document.querySelector?document.querySelector(`[data-table-filter="${tableId}"]`):null;
  const countBadge=document.getElementById(`${tableId}-count`);
  const noResults=tbl.closest?.('.table-wrap')?.querySelector?.('.table-no-results');
  const clearBtn=searchInput?.closest?.('.table-toolbar-search')?.querySelector?.('.search-clear-btn');
  const query=(searchInput?.value||'').trim().toLowerCase();
  const filterVal=(filterSelect?.value||'').trim().toLowerCase();
  if(clearBtn&&clearBtn.classList)clearBtn.classList.toggle('hidden',query.length===0);
  const rows=tbl.querySelectorAll('tbody tr');
  let visibleCount=0;
  rows.forEach(row=>{
    const text=(row.textContent||'').toLowerCase();
    const matchesQuery=!query||text.includes(query);
    const matchesFilter=!filterVal||(filterVal==='open slot'?text.includes('open slot'):text.includes(filterVal));
    const show=matchesQuery&&matchesFilter;
    if(row.classList)row.classList.toggle('hidden-row',!show);
    if(show)visibleCount++;
  });
  if(countBadge){countBadge.textContent=(query||filterVal)?`${visibleCount} of ${rows.length} records`:`${rows.length} total`;}
  if(noResults&&noResults.classList){noResults.classList.toggle('hidden',visibleCount>0);}
}
function item(v){return `<td>${escapeHtml(v??'—')}</td>`}function tag(v){let k=['returned','Absent','cancelled'].includes(v)?'danger':['submitted','Late','in_progress'].includes(v)?'warn':'';return `<span class="pill ${k}">${escapeHtml(v)}</span>`}
function btn(text,action,id){return `<button class="btn sm" data-action="${escapeHtml(action)}" data-id="${escapeHtml(id)}">${escapeHtml(text)}</button>`}
function kpiCard({ label, badge, value, sub, alert = false }) {
  return `<div class="card kpi-card${alert ? ' kpi-alert' : ''}">
    <div class="kpi-header"><span class="kpi-label">${escapeHtml(label)}</span><span class="kpi-badge${alert ? ' alert' : ''}">${escapeHtml(badge)}</span></div>
    <div class="big">${escapeHtml(value)}</div>
    <div class="kpi-sub">${escapeHtml(sub)}</div>
  </div>`;
}

function actionItemCard({ kind, titleHtml, subHtml, buttonHtml }) {
  const iconSvg = kind === 'report'
    ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    : kind === 'verify'
      ? '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const iconClass = kind === 'report' ? 'report' : 'leave';
  return `<div class="action-item-card">
    <div class="action-item-top">
      <div class="action-item-icon ${iconClass}">${iconSvg}</div>
      <div class="action-item-content">
        <div class="action-item-title">${titleHtml}</div>
        <div class="action-item-sub">${subHtml}</div>
      </div>
    </div>
    <div class="action-item-btn">${buttonHtml}</div>
  </div>`;
}

function actionCenterSection(title, subtitle, pendingCount, items) {
  if (!items.length) return '';
  return `<div class="panel action-center-panel">
    <div class="panel-title">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <small class="muted">${escapeHtml(subtitle)}</small>
      </div>
      <span class="pill warn">${pendingCount} Tasks Pending</span>
    </div>
    <div class="action-items-list">
      ${items.slice(0, 6).map(actionItemCard).join('')}
    </div>
  </div>`;
}

function todayScheduleSection({ title, subtitle, todayFormatted, todayClasses, actionsHtml = '', emptyText = 'Review upcoming batches or check your class calendar.', emptyActionsHtml = '' }) {
  let html = `<div class="panel today-schedule-panel">
    <div class="panel-title">
      <div>
        <h2>${escapeHtml(title)} (${escapeHtml(todayFormatted)})</h2>
        <small class="muted">${escapeHtml(subtitle)}</small>
      </div>
      <div class="inline-actions">${actionsHtml}</div>
    </div>`;
  if (todayClasses.length === 0) {
    html += `<div class="empty-schedule-box">
      <div class="empty-icon"><svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.8" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
      <p><b>No classes scheduled for today (${escapeHtml(todayFormatted)})</b></p>
      <small class="muted">${escapeHtml(emptyText)}</small>
      ${emptyActionsHtml ? `<div class="mt-sm">${emptyActionsHtml}</div>` : ''}
    </div>`;
  } else {
    html += `<div class="schedule-cards-grid">
      ${todayClasses.map(c => {
        const startT = formatTimeOnly(c.scheduled_start);
        const endT = c.scheduled_end ? formatTimeOnly(c.scheduled_end) : '';
        const timeStr = startT !== '—' ? (endT && endT !== '—' ? `${startT} – ${endT}` : startT) : '';
        return `<div class="schedule-card">
          <div class="schedule-time-badge">
            <span class="schedule-time">${escapeHtml(timeStr || 'Time TBD')}</span>
            <span class="pill sm ${c.delivery_mode === 'one_to_one' ? 'accent' : ''}">${escapeHtml(c.delivery_mode === 'one_to_one' ? '1:1 Slot' : 'Group')}</span>
          </div>
          <div class="schedule-details">
            <div class="schedule-course">${escapeHtml(c.course_title)}</div>
            <div class="schedule-batch">${escapeHtml(c.batch_name)}</div>
          </div>
          <div class="schedule-status-col">${tag(c.status)}</div>
          <div class="schedule-actions-col">${classButtons(c)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }
  return html + `</div>`;
}

function recentClassesSection({ title, subtitle, classes, actionsHtml = '' }) {
  return `<div class="panel">
    <div class="panel-title">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <small class="muted">${escapeHtml(subtitle)}</small>
      </div>
      <div class="inline-actions">${actionsHtml}</div>
    </div>
    ${table(
      ['ID', 'Course & Batch', 'Mode', 'Scheduled Time', 'Status', 'Held Verified', 'Actions'],
      classes.slice(0, 10).map(c => `<tr>
        <td><b>#CLS-${String(c.id).padStart(4, '0')}</b></td>
        <td><b>${escapeHtml(c.course_title)}</b><br><small class="muted">${escapeHtml(c.batch_name)}</small></td>
        <td>${tag(c.delivery_mode)}</td>
        <td>${item(formatDate(c.scheduled_start)).replace('<td>', '').replace('</td>', '')}</td>
        <td>${tag(c.status)}</td>
        <td>${c.held_verified ? '<span class="pill primary">Verified</span>' : '—'}</td>
        <td>${classButtons(c)}</td>
      </tr>`)
    )}
  </div>`;
}

async function safeFetch(path, fallback, label, loadErrors) {
  try {
    return await request(path);
  } catch {
    loadErrors.push(label);
    return fallback;
  }
}

function degradedNotice(loadErrors) {
  if (!loadErrors.length) return '';
  return `<div class="page-note danger mb-md" role="alert">Some dashboard metrics could not be loaded (${escapeHtml(loadErrors.join(', '))}). Displayed counts may be incomplete.</div>`;
}

function todayWindowQuery(todayStr) {
  const base = new Date(todayStr + 'T12:00:00Z');
  const prev = new Date(base.getTime() - 86400000).toISOString().slice(0, 10);
  const next = new Date(base.getTime() + 86400000).toISOString().slice(0, 10);
  return `/classes?from=${prev}&until=${next}T23:59:59Z&limit=200`;
}

async function teacherDashboard(todayStr, todayFormatted) {
  const loadErrors = [];
  const [s, todayRaw, recentRaw, reportsRaw, monitorRaw, homeworkRaw, followupsRaw] = await Promise.all([
    safeFetch('/summary', { students: 0, enrollments: 0, classes: 0, group_enrollments: 0, one_to_one_enrollments: 0 }, 'Summary', loadErrors),
    safeFetch(todayWindowQuery(todayStr), [], "Today's Classes", loadErrors),
    safeFetch('/classes?limit=10', [], 'Recent Classes', loadErrors),
    safeFetch('/reports', [], 'Reports', loadErrors),
    safeFetch('/report-monitor', [], 'Report Monitor', loadErrors),
    safeFetch('/homework', [], 'Homework', loadErrors),
    safeFetch('/followups?status=pending', { items: [] }, 'Follow-ups', loadErrors)
  ]);
  const todayCandidates = Array.isArray(todayRaw) ? todayRaw : [];
  const classes = Array.isArray(recentRaw) ? recentRaw : [];
  const reports = Array.isArray(reportsRaw) ? reportsRaw : [];
  const monitor = Array.isArray(monitorRaw) ? monitorRaw : [];
  const homework = Array.isArray(homeworkRaw) ? homeworkRaw : [];
  const pendingFollowups = Array.isArray(followupsRaw?.items) ? followupsRaw.items : [];
  const followupsLabel = followupsRaw?.next_before ? `${pendingFollowups.length}+` : String(pendingFollowups.length);

  const todayClasses = todayCandidates.filter(c => c.scheduled_start && formatDayKey(c.scheduled_start) === todayStr);
  const todayCompleted = todayClasses.filter(c => c.status === 'ended').length;
  const todayUpcoming = todayClasses.filter(c => c.status === 'scheduled' || c.status === 'in_progress').length;

  const returnedReports = reports.filter(r => r.status === 'returned');
  const draftReports = reports.filter(r => r.status === 'draft');
  const reportClassIds = new Set(reports.map(r => Number(r.class_id)));
  const missingReportClasses = monitor.filter(m => m.submission_outstanding && !reportClassIds.has(Number(m.class_id)));
  const pendingReportsTotal = returnedReports.length + draftReports.length + missingReportClasses.length;

  const teacherActions = [
    ...returnedReports.map(r => ({
      kind: 'report',
      titleHtml: `<b>Class Report #${escapeHtml(r.class_id)}</b> · ${escapeHtml(r.course_title)} (${escapeHtml(r.batch_name)})`,
      subHtml: `<span class="pill sm danger">Needs Revision (Returned)</span> ${escapeHtml(r.review_reason || 'Update and resubmit')}`,
      buttonHtml: btn('Revise Report', 'report', r.class_id)
    })),
    ...draftReports.map(r => ({
      kind: 'report',
      titleHtml: `<b>Draft Report #${escapeHtml(r.class_id)}</b> · ${escapeHtml(r.course_title)} (${escapeHtml(r.batch_name)})`,
      subHtml: `<span class="pill sm warn">Draft Saved</span> Complete and submit to Zimmadar`,
      buttonHtml: btn('Submit Report', 'report', r.class_id)
    })),
    ...missingReportClasses.map(m => ({
      kind: 'report',
      titleHtml: `<b>Report Due · Class #${escapeHtml(m.class_id)}</b> · ${escapeHtml(m.course_title)} (${escapeHtml(m.batch_name)})`,
      subHtml: `<span class="pill sm ${m.overdue ? 'danger' : 'warn'}">${m.overdue ? 'Overdue' : 'Due'}</span> Deadline: ${escapeHtml(formatDate(m.due_at))}`,
      buttonHtml: btn('Write Report', 'report', m.class_id)
    })),
    ...pendingFollowups.map(f => ({
      kind: 'leave',
      titleHtml: `<b>Student Follow-up: ${escapeHtml(f.student_name)}</b> (${escapeHtml(f.course_title)})`,
      subHtml: `<span class="pill sm warn">Assigned to You</span> ${escapeHtml(f.reason || f.trigger_type || 'Follow-up required')}`,
      buttonHtml: `<button class="btn sm" data-nav="attendance-workspace">Open in Care</button>`
    }))
  ];

  let html = degradedNotice(loadErrors) + `<div class="dashboard-kpi-grid">
    ${kpiCard({ label: "My Today's Classes", badge: todayFormatted, value: todayClasses.length, sub: `${todayCompleted} Completed · ${todayUpcoming} Upcoming` })}
    ${kpiCard({ label: 'Reports To Submit', badge: `${pendingReportsTotal} Pending`, value: pendingReportsTotal, sub: `${returnedReports.length} Returned · ${draftReports.length + missingReportClasses.length} Draft / Due`, alert: pendingReportsTotal > 0 })}
    ${kpiCard({ label: 'My Assigned Students', badge: `${s.enrollments} Slots`, value: s.students, sub: `${s.group_enrollments} Group · ${s.one_to_one_enrollments} 1:1 Slots` })}
    ${kpiCard({ label: 'Homework & Follow-ups', badge: `${followupsLabel} Care`, value: homework.length, sub: `${homework.length} Homework · ${followupsLabel} Follow-ups`, alert: pendingFollowups.length > 0 })}
  </div>`;

  html += actionCenterSection(
    'My Teaching Tasks',
    'Reports to submit or revise and student follow-ups assigned to you',
    teacherActions.length,
    teacherActions
  );

  html += todayScheduleSection({
    title: "My Today's Classes",
    subtitle: 'Start, end, mark attendance, and submit reports for your classes',
    todayFormatted,
    todayClasses,
    actionsHtml: `<button class="btn sm ghost" data-nav="homework">My Homework</button><button class="btn sm ghost" data-nav="classes">All Classes →</button>`,
    emptyText: 'No classes assigned for today. Review your upcoming schedule or homework.'
  });

  html += recentClassesSection({
    title: 'My Recent Classes',
    subtitle: 'Latest classes assigned to you',
    classes,
    actionsHtml: `<button class="btn sm ghost" data-nav="reports">My Reports</button><button class="btn sm ghost" data-nav="classes">View All Classes →</button>`
  });

  html += '<div class="page-note">Teacher Workspace · Report deadlines use Asia/Dhaka time (23:59 same day, or 12:00 noon next day for classes ending at/after 23:00).</div>';
  return html;
}

async function zimmadarDashboard(todayStr, todayFormatted) {
  const loadErrors = [];
  const [s, todayRaw, endedRaw, recentRaw, reportsRaw, leavesRaw, followupsRaw] = await Promise.all([
    safeFetch('/summary', { students: 0, enrollments: 0, classes: 0, group_enrollments: 0, one_to_one_enrollments: 0 }, 'Summary', loadErrors),
    safeFetch(todayWindowQuery(todayStr), [], "Today's Classes", loadErrors),
    safeFetch('/classes?status=ended&limit=200', [], 'Ended Classes', loadErrors),
    safeFetch('/classes?limit=10', [], 'Recent Classes', loadErrors),
    safeFetch('/reports', [], 'Reports', loadErrors),
    safeFetch('/leaves?status=pending', [], 'Leaves', loadErrors),
    safeFetch('/followups?status=pending', { items: [] }, 'Follow-ups', loadErrors)
  ]);
  const todayCandidates = Array.isArray(todayRaw) ? todayRaw : [];
  const endedClasses = Array.isArray(endedRaw) ? endedRaw : [];
  const classes = Array.isArray(recentRaw) ? recentRaw : [];
  const reports = Array.isArray(reportsRaw) ? reportsRaw : [];
  const leaves = Array.isArray(leavesRaw) ? leavesRaw : [];
  const pendingFollowups = Array.isArray(followupsRaw?.items) ? followupsRaw.items : [];
  const followupsLabel = followupsRaw?.next_before ? `${pendingFollowups.length}+` : String(pendingFollowups.length);

  const todayClasses = todayCandidates.filter(c => c.scheduled_start && formatDayKey(c.scheduled_start) === todayStr);
  const todayCompleted = todayClasses.filter(c => c.status === 'ended').length;
  const todayUpcoming = todayClasses.filter(c => c.status === 'scheduled' || c.status === 'in_progress').length;

  const submittedReports = reports.filter(r => r.status === 'submitted');
  const unverifiedEnded = endedClasses.filter(c => c.status === 'ended' && !c.held_verified);
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const careTotal = pendingLeaves.length + pendingFollowups.length;
  const careTotalLabel = followupsRaw?.next_before ? `${careTotal}+` : String(careTotal);
  const totalActions = submittedReports.length + unverifiedEnded.length + careTotal;

  const zimmadarActions = [
    ...submittedReports.map(r => ({
      kind: 'report',
      titleHtml: `<b>Class Report #${escapeHtml(r.class_id)}</b> · ${escapeHtml(r.course_title)} (${escapeHtml(r.batch_name)})`,
      subHtml: `<span class="pill sm warn">Awaiting Your Review</span> Submitted: ${escapeHtml(formatDate(r.first_submitted_at || r.updated_at))}`,
      buttonHtml: btn('Review Report', 'report', r.class_id)
    })),
    ...unverifiedEnded.map(c => ({
      kind: 'verify',
      titleHtml: `<b>Verify Held Class #${escapeHtml(c.id)}</b> · ${escapeHtml(c.course_title)} (${escapeHtml(c.batch_name)})`,
      subHtml: `<span class="pill sm warn">Ended · Unverified</span> Scheduled: ${escapeHtml(formatDate(c.scheduled_start))}`,
      buttonHtml: btn('Verify held', 'verify', c.id)
    })),
    ...pendingLeaves.map(l => ({
      kind: 'leave',
      titleHtml: `<b>Student Leave Request: ${escapeHtml(l.student_name)}</b> (${escapeHtml(l.course_title)})`,
      subHtml: `<span class="pill sm warn">Pending Approval</span> Dates: ${escapeHtml(l.start_date)} to ${escapeHtml(l.end_date)} · Reason: ${escapeHtml(l.reason)}`,
      buttonHtml: `<button class="btn sm" data-nav="attendance-workspace">Review in Care</button>`
    })),
    ...pendingFollowups.map(f => ({
      kind: 'leave',
      titleHtml: `<b>Care Follow-up: ${escapeHtml(f.student_name)}</b> (${escapeHtml(f.course_title)})`,
      subHtml: `<span class="pill sm warn">Pending Follow-up</span> ${escapeHtml(f.reason || f.trigger_type || 'Requires care action')}`,
      buttonHtml: `<button class="btn sm" data-nav="attendance-workspace">Open Follow-ups</button>`
    }))
  ];

  let html = degradedNotice(loadErrors) + `<div class="dashboard-kpi-grid">
    ${kpiCard({ label: 'Reports To Review', badge: `${submittedReports.length} Submitted`, value: submittedReports.length, sub: 'Awaiting Zimmadar approval or return', alert: submittedReports.length > 0 })}
    ${kpiCard({ label: 'Held Verification', badge: `${unverifiedEnded.length} Ended`, value: unverifiedEnded.length, sub: 'Ended classes needing held check', alert: unverifiedEnded.length > 0 })}
    ${kpiCard({ label: 'Care & Leave Queue', badge: `${careTotalLabel} Pending`, value: careTotalLabel, sub: `${pendingLeaves.length} Leaves · ${followupsLabel} Follow-ups`, alert: careTotal > 0 })}
    ${kpiCard({ label: "Today's Supervised Classes", badge: todayFormatted, value: todayClasses.length, sub: `${todayCompleted} Completed · ${todayUpcoming} Upcoming · ${s.students} Learners` })}
  </div>`;

  html += actionCenterSection(
    'Zimmadar Review & Care Queue',
    'Teacher reports, held-class verifications, leave approvals, and student follow-ups',
    totalActions,
    zimmadarActions
  );

  html += todayScheduleSection({
    title: "Today's Supervised Sessions",
    subtitle: 'Live and upcoming sessions in your assigned batches',
    todayFormatted,
    todayClasses,
    actionsHtml: `${btn('+ Schedule Class', 'new', 'classes')}${btn('Publish Progress', 'publish-progress', '')}<button class="btn sm ghost" data-nav="routines">View Weekly Routine</button>`,
    emptyText: 'Review weekly routines or schedule a new class for your batches.',
    emptyActionsHtml: btn('+ Schedule Class', 'new', 'classes')
  });

  html += recentClassesSection({
    title: 'Supervised Sessions History',
    subtitle: 'Latest sessions across your assigned batches',
    classes,
    actionsHtml: `<button class="btn sm ghost" data-nav="report-monitor">Report Monitor</button><button class="btn sm ghost" data-nav="classes">View All Classes →</button>`
  });

  html += '<div class="page-note">Zimmadar Academic & Care Desk · Batch report review, held-class verification, leave decisions, and student follow-ups.</div>';
  return html;
}

async function adminDashboard(todayStr, todayFormatted) {
  const loadErrors = [];
  const [s, todayRaw, recentRaw, reportsRaw, leavesRaw, followupsRaw] = await Promise.all([
    safeFetch('/summary', { students: 0, enrollments: 0, classes: 0, group_enrollments: 0, one_to_one_enrollments: 0 }, 'Summary', loadErrors),
    safeFetch(todayWindowQuery(todayStr), [], "Today's Classes", loadErrors),
    safeFetch('/classes?limit=10', [], 'Recent Classes', loadErrors),
    safeFetch('/reports', [], 'Reports', loadErrors),
    safeFetch('/leaves?status=pending', [], 'Leaves', loadErrors),
    safeFetch('/followups?status=pending', { items: [] }, 'Follow-ups', loadErrors)
  ]);
  const todayCandidates = Array.isArray(todayRaw) ? todayRaw : [];
  const classes = Array.isArray(recentRaw) ? recentRaw : [];
  const reports = Array.isArray(reportsRaw) ? reportsRaw : [];
  const leaves = Array.isArray(leavesRaw) ? leavesRaw : [];
  const pendingFollowups = Array.isArray(followupsRaw?.items) ? followupsRaw.items : [];
  const followupsLabel = followupsRaw?.next_before ? `${pendingFollowups.length}+` : String(pendingFollowups.length);

  const todayClasses = todayCandidates.filter(c => c.scheduled_start && formatDayKey(c.scheduled_start) === todayStr);
  const todayCompleted = todayClasses.filter(c => c.status === 'ended').length;
  const todayUpcoming = todayClasses.filter(c => c.status === 'scheduled' || c.status === 'in_progress').length;

  const pendingReports = reports.filter(r => r.status === 'returned' || r.status === 'submitted');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const pendingTotal = pendingReports.length + pendingLeaves.length + pendingFollowups.length;
  const pendingTotalLabel = followupsRaw?.next_before ? `${pendingTotal}+` : String(pendingTotal);

  const adminActions = [
    ...pendingReports.map(r => {
      const isReturn = r.status === 'returned';
      return {
        kind: 'report',
        titleHtml: `<b>Class Report #${escapeHtml(r.class_id)}</b> · ${escapeHtml(r.course_title)} (${escapeHtml(r.batch_name)})`,
        subHtml: `<span class="pill sm ${isReturn ? 'danger' : 'warn'}">${isReturn ? 'Needs Revision (Returned)' : 'Awaiting Zimmadar Review'}</span> Submitted: ${escapeHtml(formatDate(r.first_submitted_at || r.updated_at))}`,
        buttonHtml: btn('Open Report', 'report', r.class_id)
      };
    }),
    ...pendingLeaves.map(l => ({
      kind: 'leave',
      titleHtml: `<b>Student Leave Request: ${escapeHtml(l.student_name)}</b> (${escapeHtml(l.course_title)})`,
      subHtml: `<span class="pill sm warn">Pending Approval</span> Dates: ${escapeHtml(l.start_date)} to ${escapeHtml(l.end_date)} · Reason: ${escapeHtml(l.reason)}`,
      buttonHtml: `<button class="btn sm" data-nav="attendance-workspace">Review in Care</button>`
    })),
    ...pendingFollowups.map(f => ({
      kind: 'leave',
      titleHtml: `<b>Student Follow-up: ${escapeHtml(f.student_name)}</b> (${escapeHtml(f.course_title)})`,
      subHtml: `<span class="pill sm warn">Pending Follow-up</span> ${escapeHtml(f.reason || f.trigger_type || 'Requires attention')}`,
      buttonHtml: `<button class="btn sm" data-nav="attendance-workspace">Open in Care</button>`
    }))
  ];

  let html = degradedNotice(loadErrors) + `<div class="dashboard-kpi-grid">
    ${kpiCard({ label: 'Active Learners', badge: 'Enrolled', value: s.students, sub: 'Verified enrolled students' })}
    ${kpiCard({ label: 'Course Enrollments', badge: `${s.enrollments} Total`, value: s.enrollments, sub: `${s.group_enrollments} Group · ${s.one_to_one_enrollments} 1:1 Slots` })}
    ${kpiCard({ label: "Today's Schedule", badge: todayFormatted, value: todayClasses.length, sub: `${todayCompleted} Completed · ${todayUpcoming} Upcoming` })}
    ${kpiCard({ label: 'Action Center', badge: `${pendingTotalLabel} Pending`, value: pendingTotalLabel, sub: `${pendingReports.length} Reports · ${pendingLeaves.length} Leaves · ${followupsLabel} Care`, alert: pendingTotal > 0 })}
  </div>`;

  html += actionCenterSection(
    'Academic Action Center',
    'Academy-wide items awaiting review, approval, or follow-up',
    pendingTotal,
    adminActions
  );

  html += todayScheduleSection({
    title: "Today's Sessions",
    subtitle: 'Live and upcoming classes across branches and departments',
    todayFormatted,
    todayClasses,
    actionsHtml: `${admin() ? btn('+ Schedule Class', 'new', 'classes') : ''}<button class="btn sm ghost" data-nav="routines">View Weekly Routine</button>`,
    emptyText: 'Review upcoming batches or schedule a new academic session.',
    emptyActionsHtml: admin() ? btn('+ Schedule Class', 'new', 'classes') : ''
  });

  html += recentClassesSection({
    title: 'Academic Sessions History',
    subtitle: 'Latest conducted and upcoming scheduled sessions',
    classes,
    actionsHtml: `${admin() ? '<a class="btn sm" href="/api/exports/classes.csv">Export CSV</a>' : ''}<button class="btn sm ghost" data-nav="classes">View All Classes →</button>`
  });

  html += '<div class="page-note">Development preview · Internal report deadline alerts are enabled for noon-based obligations. Operational governance verified.</div>';
  return html;
}

async function staffDashboard() {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
  const todayFormatted = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  if (state.me?.role === 'teacher') return teacherDashboard(todayStr, todayFormatted);
  if (state.me?.role === 'zimmadar') return zimmadarDashboard(todayStr, todayFormatted);
  return adminDashboard(todayStr, todayFormatted);
}

async function render(){const version=++state.renderVersion;let html='';let rows=[]; const nav=state.nav;
 if(nav==='attendance-workspace'){html=await attendanceWorkspace();
 }else if(nav==='admissions'){html=await admissionsPanel();
 }else if(nav==='academic-sessions'){html=await sessionsPanel();
 }else if(nav==='routines'){html=await routinesPanel();
 }else if(nav==='homework'){html=await homeworkPanel();
 }else if(nav==='assessments'){html=await assessmentsPanel();
 }else if(nav==='resources'){html=await resourcesPanel();
 }else if(nav==='announcements'){html=await announcementsPanel();
 }else if(nav==='payments'){html=await paymentsPanel();
 }else if(nav==='packages-contracts'){html=await packagesContractsPanel();
 }else if(nav==='invoices'){html=await invoicesPanel();
 }else if(nav==='teacher-payables'){html=await teacherPayablesPanel();
 }else if(nav==='account'){html=await accountPanel();
 }else if(nav==='dashboard'&&!staff()){html=await guardianOverview();
 }else if(nav==='progress'){const data=await request('/progress');html=wrap('Published Progress',state.me.role==='zimmadar'?btn('Publish update','publish-progress',''):'',publicationCards(data))+'<p class="help">Latest 200 publications. These summaries are separate from internal class reports.</p>';
 }else if(nav==='dashboard'){
  html=await staffDashboard();
 }else if(nav==='students'){
    const raw=await request('/students');
    const data=Array.isArray(raw)?raw:[];
    const familiesCount = new Set(data.map(s => s.family_name).filter(Boolean)).size;
    const branchesCount = new Set(data.map(s => s.branch_id).filter(Boolean)).size;
    const summaryStrip = `
      <div class="deck-kpi-strip">
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${data.length}</span>
          <span class="deck-kpi-label">Registered Students</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${familiesCount}</span>
          <span class="deck-kpi-label">Associated Families</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${branchesCount}</span>
          <span class="deck-kpi-label">Branches</span>
        </div>
      </div>
    `;
    html=wrap('Students',admin()?'<div class="inline-actions">'+btn('Add student','new','students')+'<a class="btn sm" href="/api/exports/students.csv">Export CSV</a></div>':'',summaryStrip+tableSearchToolbar('students-tbl','Search by student or family...')+table(['ID','Student','Family','Branch'],data.map(r=>`<tr>${item(r.id)}${item(r.full_name)}${item(r.family_name)}${item(r.branch_id)}</tr>`),'students-tbl'))
  }
  else if(nav==='users'){
    const raw=await request('/users?include_inactive=1');
    const data=Array.isArray(raw)?raw:[];
    const activeCount = data.filter(u => u.active).length;
    const teachersCount = data.filter(u => u.role === 'teacher').length;
    const guardiansCount = data.filter(u => u.role && u.role.startsWith('guardian')).length;
    const summaryStrip = `
      <div class="deck-kpi-strip">
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${data.length}</span>
          <span class="deck-kpi-label">Total Accounts</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num ok">${activeCount}</span>
          <span class="deck-kpi-label">Active Users</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${teachersCount}</span>
          <span class="deck-kpi-label">Teachers</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${guardiansCount}</span>
          <span class="deck-kpi-label">Guardians</span>
        </div>
      </div>
    `;
    html=wrap('Users',btn('Add user','new','users'),summaryStrip+tableSearchToolbar('users-tbl','Search by name or email...',[['','All Roles'],['central_admin','Central Admin'],['branch_admin','Branch Admin'],['zimmadar','Zimmadar'],['teacher','Teacher'],['guardian','Guardian']])+table(['Name','Email','Role','Status','Actions'],data.map(r=>`<tr>${item(r.name)}${item(r.email)}${item(r.role)}${item(r.active?'Active':'Inactive')}<td>${r.id!==state.me.id&&(state.me.role==='central_admin'||!['central_admin','branch_admin'].includes(r.role))?btn(r.active?'Deactivate':'Activate','account-status',r.id+':'+r.active)+(r.active?btn('Reset password','reset-link',r.id):''):''}${state.me.role==='central_admin'&&!r.role.startsWith('guardian')?btn('Roles','roles',r.id):''}</td></tr>`),'users-tbl'))
  }
  else if(nav==='branches'){const data=await request('/branches');html=wrap('Branches',state.me.role==='central_admin'?btn('Add branch','new','branches'):'',tableSearchToolbar('branches-tbl','Search branches...')+table(['ID','Branch'],data.map(r=>`<tr>${item(r.id)}${item(r.name)}</tr>`),'branches-tbl'))}
  else if(nav==='families'){
    const raw=await request('/families');
    const data=Array.isArray(raw)?raw:[];
    const branchesCount = new Set(data.map(f => f.branch_id).filter(Boolean)).size;
    const summaryStrip = `
      <div class="deck-kpi-strip">
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${data.length}</span>
          <span class="deck-kpi-label">Registered Families</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${branchesCount}</span>
          <span class="deck-kpi-label">Branches</span>
        </div>
      </div>
    `;
    html=wrap('Families',admin()?btn('Add family','new','families'):'',summaryStrip+tableSearchToolbar('families-tbl','Search families...')+table(['ID','Name','Branch','Guardians'],data.map(r=>`<tr>${item(r.id)}${item(r.name)}${item(r.branch_id)}<td>${admin()?btn('View / link guardians','family-guardians',r.id):'—'}</td></tr>`),'families-tbl'))
  }
  else if(nav==='departments'){const data=await request('/departments');html=wrap('Departments',btn('Add department','new','departments'),tableSearchToolbar('departments-tbl','Search departments...')+table(['ID','Name','Type','Branch'],data.map(r=>`<tr>${item(r.id)}${item(r.name)}${item(r.category)}${item(r.branch_id)}</tr>`),'departments-tbl'))}
  else if(nav==='courses'){
    const raw=await request('/courses');
    const data=Array.isArray(raw)?raw:[];
    const deptsCount = new Set(data.map(c => c.department).filter(Boolean)).size;
    const summaryStrip = `
      <div class="deck-kpi-strip">
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${data.length}</span>
          <span class="deck-kpi-label">Available Courses</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${deptsCount}</span>
          <span class="deck-kpi-label">Academic Departments</span>
        </div>
      </div>
    `;
    html=wrap('Courses',btn('Add course','new','courses'),summaryStrip+tableSearchToolbar('courses-tbl','Search courses...')+table(['ID','Course','Department','Duration','Actions'],data.map(r=>`<tr>${item(r.id)}${item(r.title)}${item(r.department)}${item(r.duration_type)}<td>${btn('Dates','ops-course-dates',r.id)+btn('Report form','ops-template',r.id)}</td></tr>`),'courses-tbl'))
  }
  else if(nav==='batches'){
    const raw=await request('/batches');
    const data=Array.isArray(raw)?raw:[];
    const groupCount = data.filter(b => b.delivery_mode === 'group').length;
    const oneToOneCount = data.filter(b => b.delivery_mode === 'one_to_one').length;
    const openSlotsCount = data.filter(b => b.delivery_mode === 'one_to_one' && !b.one_to_one_student_name).length;
    const summaryStrip = `
      <div class="deck-kpi-strip">
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${data.length}</span>
          <span class="deck-kpi-label">Total Batches & Slots</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${groupCount}</span>
          <span class="deck-kpi-label">Group Batches</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${oneToOneCount}</span>
          <span class="deck-kpi-label">1:1 Slots</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num${openSlotsCount > 0 ? ' warn' : ''}">${openSlotsCount}</span>
          <span class="deck-kpi-label">Open 1:1 Slots</span>
        </div>
      </div>
    `;
    html=wrap('Batches / 1:1 Slots',btn('Add batch / 1:1','new','batches'),summaryStrip+tableSearchToolbar('batches-tbl','Search batch, course, teacher, student...',[['','All Modes'],['group','Group Batches'],['one_to_one','1:1 Slots'],['open slot','Open 1:1 Slots']])+table(['ID','Batch / Slot','Course','Mode','1:1 Learner','Teacher','Zimmadar','Actions'],data.map(r=>`<tr>${item(r.id)}${item(r.label)}${item(r.course_title)}<td>${tag(r.delivery_mode)}</td><td>${r.delivery_mode==='one_to_one'?(r.one_to_one_student_name?tag(r.one_to_one_student_name):'<span class="pill warn">Open slot</span>'):'—'}</td>${item(r.teacher_name||(r.teacher_id?'ID: '+r.teacher_id:'—'))}${item(r.zimmadar_name||(r.zimmadar_id?'ID: '+r.zimmadar_id:'—'))}<td>${btn('Dates','ops-batch-dates',r.id)+btn('Assignments','ops-assign',r.id)}</td></tr>`),'batches-tbl'))
  }
  else if(nav==='enrollments'){
    const raw=await request('/enrollments');
    const data=Array.isArray(raw)?raw:[];
    const activeCount = data.filter(e => e.status === 'active').length;
    const completedCount = data.filter(e => e.status === 'completed').length;
    const onHoldCount = data.filter(e => e.status === 'on_hold').length;
    const oneToOneCount = data.filter(e => e.delivery_mode === 'one_to_one').length;
    const summaryStrip = `
      <div class="deck-kpi-strip">
        <div class="deck-kpi-item">
          <span class="deck-kpi-num ok">${activeCount}</span>
          <span class="deck-kpi-label">Active Learners</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${oneToOneCount}</span>
          <span class="deck-kpi-label">1:1 Solo Slots</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${completedCount}</span>
          <span class="deck-kpi-label">Completed</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num${onHoldCount > 0 ? ' warn' : ''}">${onHoldCount}</span>
          <span class="deck-kpi-label">On Hold</span>
        </div>
      </div>
    `;
    html=wrap('Student Enrollments',admin()?btn('Enroll student','new','enrollments'):'',summaryStrip+tableSearchToolbar('enrollments-tbl','Search student, course, batch...',[['','All Statuses'],['active','Active'],['completed','Completed'],['on_hold','On Hold'],['withdrawn','Withdrawn'],['inactive','Inactive']])+table(['ID','Student','Course','Batch','Type','Start','Status','Actions'],data.map(r=>`<tr>${item(r.id)}${item(r.student_name)}${item(r.course_title)}${item(r.batch_name)}${item(r.delivery_mode)}${item(r.start_date)}<td>${tag(r.status)}</td><td>${admin()?btn('Status','ops-status',r.id):''}</td></tr>`),'enrollments-tbl'))
  }
 else if(nav==='classes'){html=await classesCalendarPanel();}
 else if(nav==='reports'){html=await reportsReviewPanel();}
 else if(nav==='attendance-monthly'){html=await attendanceMonthlyPanel();}
 else if(nav==='report-monitor'){html=await reportMonitorPanel();}
 else if(nav==='audit'){const page=await request('/audit/page'+(state.auditBefore?'?before='+state.auditBefore:''));html=wrap('Audit',null,table(['At','Action','Entity','ID','Actor',''],page.items.map(r=>`<tr>${item(formatDate(r.at))}${item(r.action)}${item(r.entity)}${item(r.entity_id)}${item(r.actor_id)}<td>${btn('View','audit-detail',r.id)}</td></tr>`))+'<div class="inline-actions">'+(state.auditHistory?.length?btn('Previous','audit-prev',''):'')+(page.next_before?btn('Next','audit-next',page.next_before):'')+'</div>')}
 if(version!==state.renderVersion)return;$('#content').innerHTML=html;$('#content').onclick=actionClick;
 if(typeof initTableFilterListeners==='function')initTableFilterListeners();
 if(typeof document!=='undefined'&&typeof document.querySelectorAll==='function'){
   document.querySelectorAll('[data-table-search]').forEach(input => {
     if(input.dataset?.tableSearch)applyTableFilter(input.dataset.tableSearch);
   });
 }
 $('#content').onsubmit=async e=>{if(e.target.id==='followupFilters'){e.preventDefault();state.followupStatus=String(new FormData(e.target).get('status')||'');state.followupBefore=null;return render();}if(e.target.id==='attendanceMonthFilter'){e.preventDefault();state.attendanceMonth=String(new FormData(e.target).get('month')||'');return render();}if(e.target.id!=='guardianFilters')return;e.preventDefault();const d=new FormData(e.target);state.guardianChild=String(d.get('child')||'');state.guardianMonth=String(d.get('month')||currentBdMonth());navigate('dashboard');};
}
function formatDate(s){if(!s)return '—';try{return new Date(s).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'})}catch{return s}}
function formatTimeOnly(s){if(!s)return '—';try{return new Date(s).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dhaka'})}catch{return s}}
function formatDayKey(s){if(!s)return 'unknown';try{const d=new Date(s);return d.toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'});}catch{return 'unknown'}}
function formatDayLabel(isoDate){
  try{
    const d=new Date(isoDate+'T00:00:00+06:00');
    const dow=d.toLocaleDateString('en-US',{weekday:'long'});
    const dm=d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    return {dow,dm};
  }catch{return{dow:'',dm:isoDate}}
}
function getWeekBounds(offsetWeeks){
  // Returns Mon–Sun bounds in Asia/Dhaka, shifted by offsetWeeks
  const now=new Date();
  const bdNow=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Dhaka'}));
  const dow=bdNow.getDay(); // 0=Sun
  const mon=new Date(bdNow);
  mon.setDate(bdNow.getDate() - (dow===0?6:dow-1) + offsetWeeks*7);
  mon.setHours(0,0,0,0);
  const sun=new Date(mon);
  sun.setDate(mon.getDate()+6);
  sun.setHours(23,59,59,999);
  const pad=n=>String(n).padStart(2,'0');
  const fmtLocal=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  return{from:fmtLocal(mon),until:fmtLocal(sun),mon,sun};
}
function todayBdKey(){
  return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'});
}
async function classesCalendarPanel(){
  if(!state.calWeekOffset)state.calWeekOffset=0;
  if(!state.calView)state.calView='agenda'; // 'agenda' | 'week'
  if(!state.calStatusFilter)state.calStatusFilter='';

  const{from,until,mon,sun}=getWeekBounds(state.calWeekOffset);
  const raw=await request('/classes');
  const data=Array.isArray(raw)?raw:[];
  const pad=n=>String(n).padStart(2,'0');
  const fromStr=`${mon.getFullYear()}-${pad(mon.getMonth()+1)}-${pad(mon.getDate())}`;
  const untilStr=`${sun.getFullYear()}-${pad(sun.getMonth()+1)}-${pad(sun.getDate())}`;
  const weekClasses=data.filter(c=>{
    const dk=formatDayKey(c.scheduled_start);
    return dk>=fromStr && dk<=untilStr;
  });
  const filtered=state.calStatusFilter?weekClasses.filter(c=>c.status===state.calStatusFilter):weekClasses;

  // Week label
  const mo=mon.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  const su=sun.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  const weekLabel=`${mo} — ${su}`;

  // Nav bar
  const schedBtn=(admin()||state.me.role==='zimmadar')?btn('+ Schedule','new','classes'):'';
  const navBar=`<div class="cal-nav">
    <button class="btn sm" data-action="cal-prev-week" data-id="">&#8592; Prev</button>
    <span class="cal-nav-label">${escapeHtml(weekLabel)}</span>
    <button class="btn sm" data-action="cal-today" data-id="">Today</button>
    <button class="btn sm" data-action="cal-next-week" data-id="">Next &#8594;</button>
    <div class="cal-view-toggle">
      <button class="btn sm${state.calView==='agenda'?' active':''}" data-action="cal-view" data-id="agenda">Agenda</button>
      <button class="btn sm${state.calView==='week'?' active':''}" data-action="cal-view" data-id="week">Week</button>
    </div>
    ${schedBtn}
  </div>`;

  // Status filter chips
  const chips=[['','All'],['scheduled','Scheduled'],['in_progress','In Progress'],['ended','Ended'],['cancelled','Cancelled']];
  const statusBar=`<div class="cal-status-filter">
    <label>Filter:</label>
    ${chips.map(([v,l])=>`<button class="cal-status-chip${state.calStatusFilter===v?' active':''}" data-action="cal-status-filter" data-id="${escapeHtml(v)}">${escapeHtml(l)}</button>`).join('')}
  </div>`;

  let body='';
  if(state.calView==='agenda'){
    // Group by day key
    const byDay=new Map();
    filtered.forEach(c=>{
      const dk=formatDayKey(c.scheduled_start);
      if(!byDay.has(dk))byDay.set(dk,[]);
      byDay.get(dk).push(c);
    });
    // Sort days
    const days=[...byDay.keys()].sort();
    if(days.length===0){
      body=`<div class="cal-empty"><div class="cal-empty-icon">📅</div>No classes scheduled for this week.</div>`;
    }else{
      const today=todayBdKey();
      body=days.map(dk=>{
        const{dow,dm}=formatDayLabel(dk);
        const isToday=dk===today;
        const todayBadge=isToday?`<span class="day-today-badge">Today</span>`:'';
        const cards=byDay.get(dk).map(c=>classSlotCard(c)).join('');
        return `<div class="cal-day-group">
          <div class="cal-day-label">${todayBadge}<span class="day-dow">${escapeHtml(dow)}</span><span>${escapeHtml(dm)}</span></div>
          ${cards}
        </div>`;
      }).join('');
    }
  }else{
    // Week grid view — 7 columns Mon–Sun
    const days=[];
    for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d);}
    const today=todayBdKey();
    const pad=n=>String(n).padStart(2,'0');
    body=`<div class="cal-week-grid">${days.map(d=>{
      const dk=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const isToday=dk===today;
      const dowShort=d.toLocaleDateString('en-US',{weekday:'short'});
      const dayNum=d.getDate();
      const slots=filtered.filter(c=>formatDayKey(c.scheduled_start)===dk);
      const slotsHtml=slots.length?slots.map(c=>`<div class="cal-mini-slot status-${escapeHtml(c.status)}" data-action="cal-expand" data-id="${escapeHtml(String(c.id))}" title="${escapeHtml(c.course_title+' '+formatTimeOnly(c.scheduled_start))}">${escapeHtml(formatTimeOnly(c.scheduled_start))} ${escapeHtml(c.course_title||'')}</div>`).join(''):`<div class="cal-empty-slot">—</div>`;
      return `<div class="cal-week-col${isToday?' today':''}">
        <div class="cal-week-col-header">${escapeHtml(dowShort)}<br><strong>${dayNum}</strong></div>
        <div class="cal-week-col-body">${slotsHtml}</div>
      </div>`;
    }).join('')}</div>`;
  }

  return wrap('Class Sessions','',navBar+statusBar+body);
}

async function reportsReviewPanel(){
  const raw = await request('/reports');
  const data = Array.isArray(raw) ? raw : [];
  
  const submitted = data.filter(r => r.status === 'submitted');
  const returned = data.filter(r => r.status === 'returned');
  const approved = data.filter(r => r.status === 'approved');
  const draft = data.filter(r => r.status === 'draft');

  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${submitted.length}</span>
        <span class="deck-kpi-label">Pending Review</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${returned.length}</span>
        <span class="deck-kpi-label">Returned</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${approved.length}</span>
        <span class="deck-kpi-label">Approved</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${draft.length}</span>
        <span class="deck-kpi-label">Drafts</span>
      </div>
    </div>
  `;

  const toolbar = tableSearchToolbar('reports-tbl', 'Search class ID, course...', [
    ['', 'All Statuses'],
    ['submitted', 'Submitted (' + submitted.length + ')'],
    ['returned', 'Returned (' + returned.length + ')'],
    ['approved', 'Approved (' + approved.length + ')'],
    ['draft', 'Draft (' + draft.length + ')']
  ]);

  const tblHtml = table(
    ['ID', 'Class', 'Course', 'Status', 'Submitted', 'Due', 'Actions'],
    data.map(r => `<tr>${item(r.id)}${item(r.class_id)}${item(r.course_title)}<td>${tag(r.status)}</td>${item(formatDate(r.first_submitted_at))}${item(formatDate(r.due_at))}<td>${btn(r.status==='submitted'?'Review report':'Open report','report',r.class_id)}</td></tr>`),
    'reports-tbl'
  );

  return wrap(
    'Class Reports & Reviews',
    null,
    '<p class="help">Read the report before reviewing. Returned reports keep their original submission time and revision history. Internal reports are private to authorized staff.</p>' +
    summaryStrip +
    toolbar +
    tblHtml
  );
}

async function attendanceMonthlyPanel(){
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const ym = state.attendanceMonth || parts.find(x => x.type === 'year').value + '-' + parts.find(x => x.type === 'month').value;
  const raw = await request('/attendance/monthly?month=' + encodeURIComponent(ym));
  const data = Array.isArray(raw) ? raw : [];

  const totalStudents = data.length;
  const below75Count = data.filter(r => r.below_75_percent).length;
  const rates = data.filter(r => r.attendance_percent !== null).map(r => Number(r.attendance_percent));
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;

  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${avgRate !== null ? avgRate + '%' : '—'}</span>
        <span class="deck-kpi-label">Average Attendance</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${totalStudents}</span>
        <span class="deck-kpi-label">Tracked Students</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${below75Count > 0 ? ' danger' : ''}">${below75Count}</span>
        <span class="deck-kpi-label">Below 75% Alert</span>
      </div>
    </div>
  `;

  const filterForm = `
    <form id="attendanceMonthFilter" class="guardian-filters mb-sm">
      <label><b>Select Academic Month</b>
        <input name="month" type="month" required value="${escapeHtml(ym)}">
      </label>
      <button class="btn primary sm" type="submit">Filter Month</button>
    </form>
  `;

  const note = '<div class="page-note">D-84: (Present + Late) / Verified Held Classes. Missing attendance is shown separately. Low attendance warnings are highlighted below.</div>';

  const toolbar = tableSearchToolbar('att-month-tbl', 'Search student name, course...');

  const tblHtml = table(
    ['Student', 'Course', 'Held', 'Present', 'Late', 'Absent', 'Unrecorded', 'Rate'],
    data.map(r => {
      const isWarn = Boolean(r.below_75_percent);
      const rateText = r.attendance_percent === null ? '—' : `${r.attendance_percent}%` + (isWarn ? ' · Below 75%' : '');
      const ratePill = r.attendance_percent === null ? '—' : `<span class="pill ${isWarn ? 'danger' : ''}">${escapeHtml(rateText)}</span>`;
      return `<tr>${item(r.student_name)}${item(r.course_title)}${item(r.held_classes)}${item(r.present)}${item(r.late)}${item(r.absent)}${item(r.unrecorded)}<td>${ratePill}</td></tr>`;
    }),
    'att-month-tbl'
  );

  return wrap('Monthly Attendance — ' + ym, null, filterForm + summaryStrip + note + toolbar + tblHtml);
}

async function reportMonitorPanel(){
  const [rowsRaw, alertsRaw] = await Promise.all([request('/report-monitor'), request('/report-alerts')]);
  const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
  const alerts = Array.isArray(alertsRaw) ? alertsRaw : [];

  const stageTimeline = `
    <div class="sla-stages-bar">
      <div class="sla-stage-chip">
        <span class="sla-stage-time">12:05 BD</span>
        <span class="sla-stage-role">Teacher Window</span>
      </div>
      <div class="sla-stage-chip">
        <span class="sla-stage-time">14:00 BD</span>
        <span class="sla-stage-role">Zimmadar Escalation</span>
      </div>
      <div class="sla-stage-chip">
        <span class="sla-stage-time">16:00 BD</span>
        <span class="sla-stage-role">Supervisor Escalation</span>
      </div>
      <div class="sla-stage-chip">
        <span class="sla-stage-time">18:00 BD</span>
        <span class="sla-stage-role">Management Escalation</span>
      </div>
    </div>
  `;

  const checkBtn = state.me.role === 'central_admin' ? btn('Check current alert window', 'checkalerts', '') : '';
  const note = '<div class="page-note">In-app event logging only. Noon-deadline stages: 12:05 Teacher, 14:00 Zimmadar, 16:00 Supervisor (unassigned), 18:00 Management. Operational audit log records all triggers.</div>';

  const rowsToolbar = tableSearchToolbar('monitor-rows-tbl', 'Search class ID, course, batch...');
  const rowsTable = table(
    ['Class', 'Course / Batch', 'Submission state', 'Due (BD)', 'First submitted'],
    rows.map(r => `<tr>${item(r.class_id)}${item(r.course_title + ' / ' + r.batch_name)}<td>${tag(r.obligation_status)}</td>${item(formatDate(r.due_at))}${item(formatDate(r.first_submitted_at))}</tr>`),
    'monitor-rows-tbl'
  );

  const alertsToolbar = tableSearchToolbar('monitor-alerts-tbl', 'Search alert class, stage, status...');
  const alertsTable = table(
    ['Class', 'Stage', 'Scheduled Time', 'Routing status'],
    alerts.map(r => `<tr>${item(r.class_id)}${item(r.stage)}${item(formatDate(r.scheduled_at))}${item(r.delivery_status)}</tr>`),
    'monitor-alerts-tbl'
  );

  return wrap(
    'Report Deadline Monitor',
    checkBtn,
    stageTimeline + note + '<h3 class="mt-md">Active Report Obligations</h3>' + rowsToolbar + rowsTable + '<h3 class="mt-lg">In-app Alert Events</h3>' + alertsToolbar + alertsTable
  );
}

function classSlotCard(c){
  const timeStr=formatTimeOnly(c.scheduled_start)+(c.scheduled_end?' – '+formatTimeOnly(c.scheduled_end):'');
  const mode=c.delivery_mode?`<span class="pill">${escapeHtml(c.delivery_mode)}</span>`:'';
  const verBadge=c.held_verified?`<span class="pill">Verified</span>`:'';
  const btns=classButtons(c);
  return `<div class="class-slot-card status-${escapeHtml(c.status)}" id="slot-${escapeHtml(String(c.id))}">
    <div class="class-slot-bar"></div>
    <div class="class-slot-body">
      <div class="class-slot-title">${escapeHtml(c.course_title||'Class #'+c.id)}</div>
      <div class="class-slot-meta">
        <span class="class-slot-time">${escapeHtml(timeStr)}</span>
        ${mode}
        ${c.batch_name?`<span>${escapeHtml(c.batch_name)}</span>`:''}
        <span class="pill${c.status==='scheduled'?' ':c.status==='in_progress'?' warn':c.status==='ended'?' ':' danger'}">${escapeHtml(c.status.replace('_',' '))}</span>
        ${verBadge}
      </div>
    </div>
    <div class="class-slot-actions">${btns||''}</div>
  </div>`;
}
function wrap(title,action,body){return `<div class="panel"><div class="panel-title"><h2>${escapeHtml(title)}</h2>${action||''}</div>${body}</div>`}
function classButtons(c){let html='';if(state.me.role==='teacher'){
 if(c.status==='scheduled')html+=btn('Start','start',c.id);
 if(c.status==='in_progress')html+=btn('End','end',c.id);
 if(c.status==='ended'){html+=btn('Attendance','attend',c.id);html+=btn('Report','report',c.id)}
 }else if((state.me.role==='zimmadar'||state.me.role==='central_admin')&&c.status==='ended'&&!c.held_verified){html+=btn('Verify held','verify',c.id)}
 html+=classPlanButtons(c);
 return html||'<span class="muted">—</span>';
}
async function actionClick(e){const navBtn=e.target.closest('[data-nav]');if(navBtn&&navBtn.dataset.nav)return navigate(navBtn.dataset.nav);const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 try{if(a.startsWith('care-'))return await careAction(a,id);
 if(a.startsWith('ops-'))return await academicAction(a,id);
 if(a==='new')return createModal(id);
 if(a==='audit-next'){(state.auditHistory||=[]).push(state.auditBefore);state.auditBefore=id;return await render();}
 if(a==='audit-prev'){state.auditBefore=state.auditHistory.pop();return await render();}
 if(['password','signout-all','switch-role','account-status','reset-link','roles','revoke-role'].includes(a))return await accountAction(a,id);
 if(a==='audit-detail'){const actor=state.me,v=state.renderVersion,row=await request('/audit/events/'+id);if(state.me!==actor||state.renderVersion!==v)return;return modal('Audit event','<div class="wide report-text">'+escapeHtml(row.details)+'</div>',null);}
 if(a==='publish-progress')return await progressPublishModal();
 if(a==='family-guardians')return await familyGuardiansModal(id);
 if(a==='start'||a==='end'||a==='verify'){let out=await request(`/classes/${id}/${a==='verify'?'verify-held':a}`,{method:'POST'});note('Action completed');await render();if(a==='start'&&out.meeting_url&&/^https?:\/\//i.test(out.meeting_url)){const safeUrl=escapeHtml(out.meeting_url);modal('Class Started',`<p class="help mb-md">The live class session is now active.</p><p class="help mb-lg"><a class="btn primary" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open Meeting Link</a></p><div class="actions"><button type="button" class="btn" id="closeStartModal">Done</button></div>`);$('#closeStartModal')?.addEventListener('click',()=>document.querySelector('.modal-bg')?.remove());}if(a==='end')await reportModal(id);return;}
 if(a==='checkalerts'){const r=await request('/report-alerts/check-now',{method:'POST'});note(r.logged_events.length+' new in-app event(s)');return render();}
 if(a==='attend')return attendanceModal(id);
 if(a==='report')return await reportModal(id);
 if(a==='approve'||a==='return'){
  if(a==='return')return modal('Return report #'+id,'<label class="wide">Reason for return<textarea name="reason" required minlength="1" maxlength="10000"></textarea></label>',async d=>{const reason=d.reason.trim();if(!reason)throw new Error('A reason is required');await request('/reports/'+id+'/review',{method:'POST',body:{action:'return_report',reason}})});
  await request('/reports/'+id+'/review',{method:'POST',body:{action:'approve'}});note('Review saved');return render();
 }
  if(a==='cal-prev-week'){state.calWeekOffset=(state.calWeekOffset||0)-1;return render();}
  if(a==='cal-next-week'){state.calWeekOffset=(state.calWeekOffset||0)+1;return render();}
  if(a==='cal-today'){state.calWeekOffset=0;return render();}
  if(a==='cal-view'){state.calView=id;return render();}
  if(a==='cal-status-filter'){state.calStatusFilter=id;return render();}
  if(a==='cal-expand'){state.calView='agenda';return render();}
  }catch(err){note(err.message)}
}
function field(label,name,type='text',extra=''){return `<label>${escapeHtml(label)}<input name="${name}" type="${type}" ${extra} required></label>`}
function select(label,name,opts,required=true){return `<label>${escapeHtml(label)}<select name="${name}" ${required?'required':''}>${opts.map(([v,l])=>`<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join('')}</select></label>`}
function modal(title, fields, submit, submitLabel = "Save") {
  let div = document.createElement("div");
  div.className = "modalback";
  div.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="modalhead"><h2>${escapeHtml(title)}</h2><button class="btn sm" data-close>Close</button></div><form class="edit-form"><div class="form-grid">${fields}</div><div class="form-footer"><button type="button" class="btn" data-close>${submit ? "Cancel" : "Close"}</button>${submit ? `<button class="btn primary" type="submit">${escapeHtml(submitLabel)}</button>` : ""}</div></form></div>`;
  const previousFocus = document.activeElement;
  document.body.appendChild(div);
  const close = () => {
    div.remove();
    previousFocus?.focus?.();
  };
  div.onclick = (e) => {
    if(e.target.closest('[data-action]')){e.preventDefault();void actionClick(e);return;}
    if (e.target === div || e.target.closest("[data-close]")) close();
  };
  div.onkeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const focusable = [
        ...div.querySelectorAll(
          'button,input,select,textarea,a[href],summary,[tabindex="0"]',
        ),
      ].filter((el) => !el.disabled && el.offsetParent !== null);
      const first = focusable[0],
        last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };
  (div.querySelector("form input:not([type=hidden]),form select,form textarea") || div.querySelector("button")).focus();
  div.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    if (!submit) return;
    const button = e.target.querySelector('[type="submit"]');
    if (button.disabled) return;
    button.disabled = true;
    let data = Object.fromEntries(new FormData(e.target));
    for (const [k, v] of Object.entries(data)) if (v === "") delete data[k];
    try {
      const result=await submit(data);
      close();
      if(result?.sign_in_required){clearView();state.me=null;state.csrf=null;return await initial();}
      note(result?.pending_approval?"Sent for approval":"Saved");
      await render();
    } catch (err) {
      note(err.message);
    } finally {
      button.disabled = false;
    }
  };
}
async function createModal(type){try{let fields='',path='';const opts=async(url,label)=> (await request(url)).map(x=>[x.id,x[label]||x.name||x.title]);
 const branches=admin()?await opts('/branches','name'):[],users=admin()?await request('/users'):[];
 const roles=['central_admin','branch_admin','zimmadar','teacher','department_supervisor','guardian_primary','guardian_secondary'];
 if(type==='branches'){fields=field('Branch name','name');path='/branches'}
 if(type==='users'){fields=field('Name','name')+field('Email','email','email')+field('Password','password','password','minlength="12"')+select('Role','role',roles.filter(r=>state.me.role==='central_admin'||!['central_admin','branch_admin'].includes(r)).map(r=>[r,r.replaceAll('_',' ')]))+select('Branch','branch_id',[['','—'],...branches],false)+select('Department','department_id',[['','—'],...await opts('/departments','name')],false);path='/users'}
 if(type==='families'){fields=field('Family label','name')+select('Branch','branch_id',branches)+select('Guardian (optional)','guardian_user_id',[['','—'],...users.filter(u=>u.role.startsWith('guardian')).map(u=>[u.id,u.name+' · '+u.role])],false);path='/families'}
 if(type==='students'){fields=field('Student name','full_name')+select('Family','family_id',await opts('/families','name'));path='/students'}
 if(type==='departments'){fields=field('Department','name')+select('Branch','branch_id',branches)+select('Type','category',[['regular','Regular'],['single_course','Single / short course'],['other','Other']]);path='/departments'}
 if(type==='courses'){fields=field('Course title','title')+select('Department','department_id',await opts('/departments','name'))+select('Duration','duration_type',[['fixed','Fixed'],['continuous','Continuous']]);path='/courses'}
 if(type==='batches'){fields=field('Batch / individual label','label')+select('Course','course_id',await opts('/courses','title'))+select('Delivery mode','delivery_mode',[['group','Group'],['one_to_one','One-to-One']])+select('Teacher','teacher_id',[['','Unassigned'],...users.filter(x=>x.role==='teacher'||String(x.assigned_roles||'').split(',').includes('teacher')).map(x=>[x.id,x.name])],false)+select('Zimmadar','zimmadar_id',[['','Unassigned'],...users.filter(x=>x.role==='zimmadar'||String(x.assigned_roles||'').split(',').includes('zimmadar')).map(x=>[x.id,x.name])],false);path='/batches'}
 if(type==='enrollments'){const st=await request('/students'),b=await request('/batches');fields=select('Student','student_id',st.map(x=>[x.id,x.full_name]))+select('Batch','batch_id',b.map(x=>[x.id,`${x.course_title} / ${x.label} (${x.delivery_mode})`]))+field('Start date','start_date','date')+'<label>End date (optional)<input name="end_date" type="date"></label>';path='/enrollments'}
 if(type==='classes'){fields=select('Batch','batch_id',await opts('/batches','label'))+field('Scheduled start (Bangladesh time)','scheduled_start','datetime-local')+field('Scheduled end (Bangladesh time)','scheduled_end','datetime-local')+'<label>Zoom / Meet URL (optional)<input type="url" name="meeting_url" placeholder="https://..."></label>';path='/classes'}
 modal('Add '+type,fields,async data=>{for(const k of ['branch_id','family_id','guardian_user_id','department_id','course_id','teacher_id','zimmadar_id','student_id','batch_id'])if(data[k])data[k]=Number(data[k]);
 if(type==='users'&&data.role==='central_admin')delete data.branch_id;
 return request(path,{method:'POST',body:data})});
 }catch(err){note(err.message)}}
async function familyGuardiansModal(id) {
  const actor = state.me,
    version = state.renderVersion;
  const [families, users, linked] = await Promise.all([
    request("/families"),
    request("/users"),
    request(`/families/${id}/guardians`),
  ]);
  if (state.me !== actor || state.renderVersion !== version) return;
  const family = families.find((f) => f.id == id);
  if (!family) throw new Error("Family is no longer available");
  const options = users.filter(
    (u) =>
      u.role.startsWith("guardian") &&
      u.branch_id === family.branch_id &&
      !linked.some((g) => g.id === u.id),
  );
  const fields =
    '<section class="wide"><h3>Linked guardians</h3>' +
    (linked.length
      ? '<ul class="guardian-links">' +
        linked
          .map(
            (g) =>
              `<li><strong>${escapeHtml(g.name)}</strong><span>${escapeHtml(g.role.replaceAll("_", " "))} · ${g.active ? "Active" : "Inactive"}</span></li>`,
          )
          .join("") +
        "</ul>"
      : '<p class="help">No guardians linked yet.</p>') +
    "</section>" +
    (options.length
      ? select(
          "Link an existing Guardian account",
          "guardian_user_id",
          options.map((u) => [
            u.id,
            u.name + " · " + u.role.replaceAll("_", " "),
          ]),
        )
      : '<p class="wide help">No other active Guardian accounts in this branch. Create a Guardian in Users first.</p>');
  modal(
    "Guardians — " + family.name,
    fields,
    options.length
      ? async (d) => {
          if (state.me !== actor || state.renderVersion !== version)
            throw new Error("Account or view changed. Reopen the family.");
          await request(`/families/${id}/guardians`, {
            method: "POST",
            body: { guardian_user_id: Number(d.guardian_user_id) },
          });
        }
      : null,
    "Link guardian",
  );
}
async function attendanceModal(id){try{return await attendanceWorkspaceModal(id)}catch(e){note(e.message)}}
async function reportModal(id) {
  const actor = state.me,
    version = state.renderVersion,
    sequence = (state.reportRequestVersion =
      (state.reportRequestVersion || 0) + 1);
  const data = await request(`/classes/${id}/report`);
  if (
    state.me !== actor ||
    state.renderVersion !== version ||
    state.reportRequestVersion !== sequence
  )
    return;
  const rep = data.report,
    editable =
      actor.role === "teacher" &&
      (!rep || ["draft", "returned"].includes(rep.status));
  const reviewable = actor.role === "zimmadar" && rep?.status === "submitted";
  const guard = () => {
    if (state.me !== actor || state.renderVersion !== version)
      throw new Error("Account or view changed. Reopen the report.");
  };
  const history =
    '<section class="wide report-history"><h3>Revision history</h3>' +
    (data.history.length
      ? data.history
          .map(
            (h) =>
              `<details><summary>Revision ${escapeHtml(h.revision)} · ${escapeHtml(h.event)} · ${escapeHtml(formatDate(h.at))} · Staff #${escapeHtml(h.actor_id)}</summary><div class="report-text">${escapeHtml(h.body)}</div></details>`,
          )
          .join("")
      : '<p class="help">No saved revisions yet.</p>') +
    (data.history_truncated
      ? '<p class="help">Showing the latest 200 events. Older history remains stored.</p>'
      : "") +
    "</section>";
  let fields =
    '<div class="wide help">Internal class report · ' +
    (rep
      ? tag(rep.status) +
        " · Revision " +
        escapeHtml(rep.revision) +
        "<br>First submitted: " +
        escapeHtml(formatDate(rep.first_submitted_at))
      : "No report saved yet.") +
    "</div>";
  if (rep?.review_reason)
    fields +=
      '<section class="wide report-return"><h3>Reason for return</h3><div class="report-text">' +
      escapeHtml(rep.review_reason) +
      "</div></section>";
  if (editable)
    fields +=
      '<label class="wide">Class report / teaching summary<textarea name="body" required minlength="1" maxlength="10000" placeholder="Lesson covered, progress, homework...">' +
      escapeHtml(rep?.body || data.template?.prompt || "") +
      "</textarea></label>" +
      select("Action", "submit", [
        ["false", "Save draft"],
        ["true", "Submit to Zimmadar"],
      ]);
  else
    fields +=
      '<section class="wide"><h3>Teaching summary</h3><div class="report-text">' +
      escapeHtml(rep?.body || "No report saved yet.") +
      "</div></section>";
  if (reviewable)
    fields +=
      select("Review decision", "action", [
        ["approve", "Approve"],
        ["return_report", "Return for correction"],
      ]) +
      '<label class="wide">Reason (required when returning)<textarea name="reason" maxlength="10000"></textarea></label>';
  fields += history;
  const save = editable
    ? async (d) => {
        guard();
        await request(`/classes/${id}/report`, {
          method: "POST",
          body: {
            body: d.body,
            submit: d.submit === "true",
            expected_history_id: data.latest_history_id,
          },
        });
      }
    : reviewable
      ? async (d) => {
          guard();
          const reason = (d.reason || "").trim();
          if (d.action === "return_report" && !reason)
            throw new Error("A reason is required");
          await request("/reports/" + rep.id + "/review", {
            method: "POST",
            body: {
              action: d.action,
              reason: reason || null,
              expected_history_id: data.latest_history_id,
            },
          });
        }
      : null;
  modal(
    "Class report — Class #" + id,
    fields,
    save,
    reviewable ? "Save review" : "Save report",
  );
}
globalThis.onhashchange=()=>{void initial();};
initial();
