const $ = (s)=>document.querySelector(s);
const escapeHtml = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={me:null,nav:'dashboard',csrf:null,cache:{}};
function note(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4400)}
async function request(path,{method='GET',body}={}){
 const res=await fetch('/api'+path,{method,credentials:'same-origin',headers:{...(body?{'content-type':'application/json'}:{}),...(method!=='GET'?{'x-csrf-token':state.csrf||''}:{})},body:body?JSON.stringify(body):undefined});
 const payload=await res.json().catch(()=>({detail:'Server error'}));
 if(!res.ok)throw new Error(typeof payload.detail==='string'?payload.detail:JSON.stringify(payload.detail||payload));
 return payload;
}
async function initial(){try{state.me=await request('/me');state.csrf=state.me.csrf;showApp()}catch{$('#auth').classList.remove('hidden');$('#app').classList.add('hidden')}}
$('#loginForm').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));try{const r=await request('/login',{method:'POST',body:d});state.csrf=r.csrf;state.me=await request('/me');showApp()}catch(err){note(err.message)}};
$('#logout').onclick=async()=>{try{await request('/logout',{method:'POST'})}catch{}state.me=null;state.csrf=null;await initial()};
const admin=()=>['central_admin','branch_admin'].includes(state.me.role);
const staff=()=>!state.me.role.startsWith('guardian');
function menus(){const vals=[['dashboard','Overview'],['students','Students'],['enrollments','Enrollments'],['classes','Classes'],['reports','Reports'],['attendance-monthly','Monthly Attendance']];
 if(admin()) vals.splice(2,0,['families','Families'],['departments','Departments'],['courses','Courses'],['batches','Batches'],['users','Users']);
 if(staff())vals.push(['report-monitor','Report Monitor']);
 if(state.me.role==='central_admin')vals.push(['audit','Audit Log']);
 return vals;
}
function showApp(){ $('#auth').classList.add('hidden');$('#app').classList.remove('hidden');$('#loggedUser').textContent=state.me.name+' · '+state.me.role.replaceAll('_',' ');
 $('#nav').innerHTML=menus().map(([id,title])=>`<button data-nav="${id}">${escapeHtml(title)}</button>`).join('');
 $('#nav').onclick=e=>{const b=e.target.closest('[data-nav]');if(b)navigate(b.dataset.nav)};navigate('dashboard');}
function navigate(id){state.nav=id;for(const b of document.querySelectorAll('[data-nav]'))b.classList.toggle('active',b.dataset.nav===id);
 $('#pageTitle').textContent=menus().find(x=>x[0]===id)?.[1]||id;render().catch(err=>note(err.message));}
function table(headers,rows){return rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:'<div class="empty">No records yet.</div>'}
function item(v){return `<td>${escapeHtml(v??'—')}</td>`}function tag(v){let k=['returned','Absent','cancelled'].includes(v)?'danger':['submitted','Late','in_progress'].includes(v)?'warn':'';return `<span class="pill ${k}">${escapeHtml(v)}</span>`}
function btn(text,action,id){return `<button class="btn sm" data-action="${escapeHtml(action)}" data-id="${escapeHtml(id)}">${escapeHtml(text)}</button>`}
async function render(){let html='';let rows=[]; const nav=state.nav;
 if(nav==='dashboard'){
  const s=await request('/summary');html=`<div class="cards">${[['Students',s.students,'◈'],['Enrollments',s.enrollments,'▤'],['Group enrollments',s.group_enrollments,'▦'],['One-to-one',s.one_to_one_enrollments,'◎']].map(([l,v,g])=>`<div class="card"><div class="glyph">${g}</div><div class="big">${v}</div><small>${l}</small></div>`).join('')}</div>`;
  const classes=await request('/classes');html+=`<div class="panel"><div class="panel-title"><h2>Recent Classes</h2>${admin()?btn('Schedule class','new','classes'):''}</div>${table(['ID','Course','Batch','Mode','Scheduled','Status','Actions'],classes.slice(0,12).map(c=>`<tr>${item(c.id)}${item(c.course_title)}${item(c.batch_name)}${item(c.delivery_mode)}${item(formatDate(c.scheduled_start))}<td>${tag(c.status)}</td><td>${classButtons(c)}</td></tr>`))}</div>`;
  html+='<div class="page-note">Development preview · Internal report deadline alerts are enabled for noon-based obligations. No Telegram, payment posting, or attendance follow-up alert delivery yet.</div>';
 }else if(nav==='students'){const data=await request('/students');html=wrap('Students',admin()?btn('Add student','new','students'):'',table(['ID','Student','Family','Branch'],data.map(r=>`<tr>${item(r.id)}${item(r.full_name)}${item(r.family_name)}${item(r.branch_id)}</tr>`)))}
 else if(nav==='users'){const data=await request('/users');html=wrap('Users',btn('Add user','new','users'),table(['ID','Name','Email','Role','Branch'],data.map(r=>`<tr>${item(r.id)}${item(r.name)}${item(r.email)}${item(r.role)}${item(r.branch_id)}</tr>`)))}
 else if(nav==='families'){const data=await request('/families');html=wrap('Families',btn('Add family','new','families'),table(['ID','Name','Branch'],data.map(r=>`<tr>${item(r.id)}${item(r.name)}${item(r.branch_id)}</tr>`)))}
 else if(nav==='departments'){const data=await request('/departments');html=wrap('Departments',btn('Add department','new','departments'),table(['ID','Name','Type','Branch'],data.map(r=>`<tr>${item(r.id)}${item(r.name)}${item(r.category)}${item(r.branch_id)}</tr>`)))}
 else if(nav==='courses'){const data=await request('/courses');html=wrap('Courses',btn('Add course','new','courses'),table(['ID','Course','Department','Duration'],data.map(r=>`<tr>${item(r.id)}${item(r.title)}${item(r.department)}${item(r.duration_type)}</tr>`)))}
 else if(nav==='batches'){const data=await request('/batches');html=wrap('Batches / 1:1',btn('Add batch / 1:1','new','batches'),table(['ID','Batch','Course','Mode','Teacher ID','Zimmadar ID'],data.map(r=>`<tr>${item(r.id)}${item(r.label)}${item(r.course_title)}<td>${tag(r.delivery_mode)}</td>${item(r.teacher_id)}${item(r.zimmadar_id)}</tr>`)))}
 else if(nav==='enrollments'){const data=await request('/enrollments');html=wrap('Student Enrollments',admin()?btn('Enroll student','new','enrollments'):'',table(['ID','Student','Course','Batch','Type','Start','Status'],data.map(r=>`<tr>${item(r.id)}${item(r.student_name)}${item(r.course_title)}${item(r.batch_name)}${item(r.delivery_mode)}${item(r.start_date)}<td>${tag(r.status)}</td></tr>`)))}
 else if(nav==='classes'){const data=await request('/classes');html=wrap('Class Sessions',admin()||state.me.role==='zimmadar'?btn('Schedule class','new','classes'):'',table(['ID','Course','Batch','Scheduled','Status','Held','Actions'],data.map(r=>`<tr>${item(r.id)}${item(r.course_title)}${item(r.batch_name)}${item(formatDate(r.scheduled_start))}<td>${tag(r.status)}</td>${item(r.held_verified?'Verified':'—')}<td>${classButtons(r)}</td></tr>`)))}
 else if(nav==='reports'){const data=await request('/reports');html=wrap('Class Reports',null,table(['ID','Class','Course','Status','Submitted','Due','Actions'],data.map(r=>`<tr>${item(r.id)}${item(r.class_id)}${item(r.course_title)}<td>${tag(r.status)}</td>${item(formatDate(r.first_submitted_at))}${item(formatDate(r.due_at))}<td>${state.me.role==='zimmadar'&&r.status==='submitted'?btn('Approve','approve',r.id)+btn('Return','return',r.id):''}</td></tr>`)))}
 else if(nav==='attendance-monthly'){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit'}).formatToParts(new Date());const ym=parts.find(x=>x.type==='year').value+'-'+parts.find(x=>x.type==='month').value;
  const data=await request('/attendance/monthly?month='+encodeURIComponent(ym));
  html=wrap('Monthly Attendance — '+ym,null,'<div class="page-note">D-84: (Present + Late) / Verified Held Classes. Missing attendance is shown separately. Low attendance warnings are not sent in this prototype.</div>'+
    table(['Student','Course','Held','Present','Late','Absent','Unrecorded','Rate'],data.map(r=>`<tr>${item(r.student_name)}${item(r.course_title)}${item(r.held_classes)}${item(r.present)}${item(r.late)}${item(r.absent)}${item(r.unrecorded)}<td>${r.attendance_percent===null?'—':tag(r.attendance_percent+'%'+(r.below_75_percent?' · Below 75%':''))}</td></tr>`)))
 }
 else if(nav==='report-monitor'){
  const [rows,alerts]=await Promise.all([request('/report-monitor'),request('/report-alerts')]);
  html=wrap('Report Deadline Monitor',state.me.role==='central_admin'?btn('Check current alert window','checkalerts',''):'',
   '<div class="page-note">In-app event logging only. Noon-deadline stages: 12:05 Teacher, 14:00 Zimmadar, 16:00 Supervisor (unassigned), 18:00 Management. No Telegram or external delivery.</div>'+
   table(['Class','Course / Batch','Submission state','Due (BD)','First submitted'],rows.map(r=>`<tr>${item(r.class_id)}${item(r.course_title+' / '+r.batch_name)}<td>${tag(r.obligation_status)}</td>${item(formatDate(r.due_at))}${item(formatDate(r.first_submitted_at))}</tr>`))+
   '<h3>In-app alert events</h3>'+table(['Class','Stage','Scheduled','Routing status'],alerts.map(r=>`<tr>${item(r.class_id)}${item(r.stage)}${item(formatDate(r.scheduled_at))}${item(r.delivery_status)}</tr>`)))
 }
 else if(nav==='audit'){const data=await request('/audit');html=wrap('Recent Audit Events',null,table(['At','Action','Entity','ID','Actor'],data.map(r=>`<tr>${item(formatDate(r.at))}${item(r.action)}${item(r.entity)}${item(r.entity_id)}${item(r.actor_id)}</tr>`)))}
 $('#content').innerHTML=html;$('#content').onclick=actionClick;
}
function formatDate(s){if(!s)return '—';try{return new Date(s).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dhaka'})}catch{return s}}
function wrap(title,action,body){return `<div class="panel"><div class="panel-title"><h2>${escapeHtml(title)}</h2>${action||''}</div>${body}</div>`}
function classButtons(c){let html='';if(state.me.role==='teacher'){
 if(c.status==='scheduled')html+=btn('Start','start',c.id);
 if(c.status==='in_progress')html+=btn('End','end',c.id);
 if(c.status==='ended'){html+=btn('Attendance','attend',c.id);html+=btn('Report','report',c.id)}
 }else if((state.me.role==='zimmadar'||state.me.role==='central_admin')&&c.status==='ended'&&!c.held_verified){html+=btn('Verify held','verify',c.id)}
 return html||'<span class="muted">—</span>';
}
async function actionClick(e){const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 try{if(a==='new')return createModal(id);
 if(a==='start'||a==='end'||a==='verify'){let out=await request(`/classes/${id}/${a==='verify'?'verify-held':a}`,{method:'POST'});note('Action completed');await render();if(a==='start'&&out.meeting_url&&confirm('Open Zoom / Meet link?'))window.open(out.meeting_url,'_blank','noopener,noreferrer');return;}
 if(a==='checkalerts'){const r=await request('/report-alerts/check-now',{method:'POST'});note(r.logged_events.length+' new in-app event(s)');return render();}
 if(a==='attend')return attendanceModal(id);
 if(a==='report')return reportModal(id);
 if(a==='approve'||a==='return'){
  const reason=a==='return'?prompt('Reason for return (required):'):undefined;if(a==='return'&&!reason)return;
  await request('/reports/'+id+'/review',{method:'POST',body:{action:a==='return'?'return_report':'approve',reason}});note('Review saved');return render();
 }}catch(err){note(err.message)}
}
function field(label,name,type='text',extra=''){return `<label>${escapeHtml(label)}<input name="${name}" type="${type}" ${extra} required></label>`}
function select(label,name,opts,required=true){return `<label>${escapeHtml(label)}<select name="${name}" ${required?'required':''}>${opts.map(([v,l])=>`<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join('')}</select></label>`}
function modal(title,fields,submit){let div=document.createElement('div');div.className='modalback';div.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modalhead"><h2>${escapeHtml(title)}</h2><button class="btn sm" data-close>Close</button></div><form class="edit-form"><div class="form-grid">${fields}</div><div class="form-footer"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary" type="submit">Save</button></div></form></div>`;
 document.body.appendChild(div);div.onclick=e=>{if(e.target===div||e.target.closest('[data-close]'))div.remove()};div.querySelector('form').onsubmit=async e=>{e.preventDefault();let data=Object.fromEntries(new FormData(e.target));for(const[k,v]of Object.entries(data))if(v==='')delete data[k];try{await submit(data);div.remove();note('Saved');await render()}catch(err){note(err.message)}};
}
async function createModal(type){try{let fields='',path='';const opts=async(url,label)=> (await request(url)).map(x=>[x.id,x[label]||x.name||x.title]);
 const branches=admin()?await opts('/branches','name'):[],users=admin()?await request('/users'):[];
 const roles=['central_admin','branch_admin','zimmadar','teacher','guardian_primary','guardian_secondary'];
 if(type==='users'){fields=field('Full name','name')+field('Email','email','email')+field('Password (min 12 chars)','password','password','minlength="12"')+select('Role','role',roles.filter(r=>state.me.role==='central_admin'||!['central_admin','branch_admin'].includes(r)).map(r=>[r,r]))+select('Branch','branch_id',[['','Select branch (for central admin omit)'],...branches],false);path='/users'}
 if(type==='families'){fields=field('Family label','name')+select('Branch','branch_id',branches)+select('Primary guardian (optional)','guardian_user_id',[['','—'],...users.filter(u=>u.role==='guardian_primary').map(u=>[u.id,u.name])],false);path='/families'}
 if(type==='students'){fields=field('Student name','full_name')+select('Family','family_id',await opts('/families','name'));path='/students'}
 if(type==='departments'){fields=field('Department','name')+select('Branch','branch_id',branches)+select('Type','category',[['regular','Regular'],['single_course','Single / short course'],['other','Other']]);path='/departments'}
 if(type==='courses'){fields=field('Course title','title')+select('Department','department_id',await opts('/departments','name'))+select('Duration','duration_type',[['fixed','Fixed'],['continuous','Continuous']]);path='/courses'}
 if(type==='batches'){fields=field('Batch / individual label','label')+select('Course','course_id',await opts('/courses','title'))+select('Delivery mode','delivery_mode',[['group','Group'],['one_to_one','One-to-One']])+select('Teacher','teacher_id',[['','Unassigned'],...users.filter(x=>x.role==='teacher').map(x=>[x.id,x.name])],false)+select('Zimmadar','zimmadar_id',[['','Unassigned'],...users.filter(x=>x.role==='zimmadar').map(x=>[x.id,x.name])],false);path='/batches'}
 if(type==='enrollments'){const st=await request('/students'),b=await request('/batches');fields=select('Student','student_id',st.map(x=>[x.id,x.full_name]))+select('Batch','batch_id',b.map(x=>[x.id,`${x.course_title} / ${x.label} (${x.delivery_mode})`]))+field('Start date','start_date','date')+'<label>End date (optional)<input name="end_date" type="date"></label>';path='/enrollments'}
 if(type==='classes'){fields=select('Batch','batch_id',await opts('/batches','label'))+field('Scheduled start (Bangladesh time)','scheduled_start','datetime-local')+field('Scheduled end (Bangladesh time)','scheduled_end','datetime-local')+'<label>Zoom / Meet URL (optional)<input type="url" name="meeting_url" placeholder="https://..."></label>';path='/classes'}
 modal('Add '+type,fields,async data=>{for(const k of ['branch_id','family_id','guardian_user_id','department_id','course_id','teacher_id','zimmadar_id','student_id','batch_id'])if(data[k])data[k]=Number(data[k]);
 if(type==='users'&&data.role==='central_admin')delete data.branch_id;
 return request(path,{method:'POST',body:data})});
 }catch(err){note(err.message)}}
async function attendanceModal(id){try{const classes=await request('/classes'),cl=classes.find(c=>c.id==id);const enrolls=(await request('/enrollments')).filter(e=>e.batch_id==cl.batch_id&&e.status==='active');if(!enrolls.length)return note('No active enrollments');
 const fields=select('Student / enrollment','enrollment_id',enrolls.map(e=>[e.id,`${e.student_name} — Enrollment ${e.id}`]))+select('Verified attendance','status',[['Present','Present'],['Absent','Absent'],['Late','Late']])+`<label class="wide">Join time (optional; auto-classifies Present/Late if supplied)<input name="join_time" type="datetime-local"></label><div class="wide help">Source D-55: more than 15 minutes late is Late. Exact 15 minutes is Present. Pilot uses actual recorded class start as the comparison anchor.</div>`;
 modal('Record class attendance #'+id,fields,async d=>{d.enrollment_id=Number(d.enrollment_id);await request(`/classes/${id}/attendance`,{method:'POST',body:d})})
 }catch(err){note(err.message)}}
function reportModal(id){const fields='<label class="wide">Class report / teaching summary<textarea name="body" required minlength="1" maxlength="10000" placeholder="Lesson covered, progress, homework..." ></textarea></label>'+select('Action','submit',[['false','Save draft'],['true','Submit to Zimmadar']]);
 modal('Class Report #'+id,fields,async d=>{d.submit=d.submit==='true';await request(`/classes/${id}/report`,{method:'POST',body:d})});}
initial();
