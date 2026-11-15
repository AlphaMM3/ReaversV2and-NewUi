function currentBdMonth(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit'}).formatToParts(new Date());return p.find(x=>x.type==='year').value+'-'+p.find(x=>x.type==='month').value;}
function publicationCards(data){return data.length?data.map(p=>`<article class="publication"><div class="panel-title"><h3>${escapeHtml(p.title)}</h3><time>${escapeHtml(formatDate(p.published_at))}</time></div><p class="muted">${escapeHtml(p.student_name)} · ${escapeHtml(p.course_title)} · ${escapeHtml(p.batch_name)} (${escapeHtml(p.delivery_mode)})</p><h4>Progress</h4><p class="summary-text">${escapeHtml(p.progress_summary)}</p>${p.homework_summary?`<h4>Homework</h4><p class="summary-text">${escapeHtml(p.homework_summary)}</p>`:''}</article>`).join(''):'<p class="empty">No published progress updates yet.</p>';}
async function guardianOverview(){
 const month=state.guardianMonth||currentBdMonth();
 const loadErrors=[];
 const optFetch=async(path,fallback,label)=>{try{return await request(path);}catch{loadErrors.push(label);return fallback;}};
 const [children,enrollments,monthly,history,publications,announcements,supportInfo,payments,allHomework]=await Promise.all([
  request('/students'),
  request('/enrollments'),
  request('/attendance/monthly?month='+encodeURIComponent(month)),
  request('/guardian/attendance?month='+encodeURIComponent(month)),
  request('/progress'),
  optFetch('/announcements',[],'Announcements'),
  optFetch('/support/info',null,'Support info'),
  optFetch('/guardian/payments',[],'Payments'),
  optFetch('/homework',[],'Homework')
 ]);
 const selected=children.some(c=>String(c.id)===state.guardianChild)?state.guardianChild:'';
 const chosen=selected?children.filter(c=>String(c.id)===selected):children;
 const filter=`<form id="guardianFilters" class="guardian-filters"><label>Child<select name="child"><option value="">All linked children</option>${children.map(c=>`<option value="${escapeHtml(c.id)}" ${String(c.id)===selected?'selected':''}>${escapeHtml(c.full_name)}</option>`).join('')}</select></label><label>Attendance month<input type="month" name="month" value="${escapeHtml(month)}" required></label><button class="btn" type="submit">View</button></form>`;
 
 let announcementsHtml='';
 if(Array.isArray(announcements)&&announcements.length){
  announcementsHtml=`<div class="panel"><div class="panel-title"><h2>Academy Announcements</h2></div>${announcements.map(a=>`<article class="publication"><div class="panel-title"><h3>${escapeHtml(a.title)}</h3>${a.priority==='urgent'?'<span class="pill danger">Urgent</span>':''}</div><p class="summary-text">${escapeHtml(a.body||a.message||'')}</p><time>${a.expires_at?'Expires: '+escapeHtml(formatDate(a.expires_at)):''}</time></article>`).join('')}</div>`;
 }

 let supportHtml='';
 if(supportInfo){
  supportHtml=`<div class="panel"><h2>Official Support & Contact</h2><p class="help">External payment confirmations, leave inquiries and course support:</p><div class="cards"><div class="card"><small>Helpline</small><div class="big support-val">${escapeHtml(supportInfo.helpline||'—')}</div></div><div class="card"><small>WhatsApp</small><div class="big support-val">${escapeHtml(supportInfo.whatsapp||'—')}</div></div><div class="card"><small>Email</small><div class="big support-val-sm">${escapeHtml(supportInfo.email||'—')}</div></div><div class="card"><small>Office Hours</small><div class="big support-val-xs">${escapeHtml(supportInfo.office_hours||'Sat–Thu 10am–6pm')}</div></div></div></div>`;
 }

 if(!chosen.length)return announcementsHtml+filter+'<div class="panel"><h2>Your children</h2><p>No linked children yet. Please contact the Academy administrator.</p></div>'+supportHtml;

 const childrenPanels=await Promise.all(chosen.map(async child=>{
  const en=enrollments.filter(e=>e.student_id===child.id),attendance=monthly.filter(e=>e.student_id===child.id),updates=publications.filter(p=>p.student_id===child.id),held=history.filter(r=>r.student_id===child.id);
  const childHw=(Array.isArray(allHomework)?allHomework:[]).filter(h=>h.student_id===child.id);
  const childPayments=(Array.isArray(payments)?payments:[]).filter(p=>p.student_id===child.id);
  
  let progressSummary=null;
  try{progressSummary=await request('/guardian/learners/'+child.id+'/progress-summary');}catch{loadErrors.push('Progress summary ('+(child.full_name||'learner')+')');}
  
  let unifiedProgressHtml='';
  if(progressSummary&&Array.isArray(progressSummary.enrollments)&&progressSummary.enrollments.length){
   unifiedProgressHtml='<h3>Learning & Assessment Progress</h3>'+progressSummary.enrollments.map(pe=>{
    const hwAssigned=pe.homework?.total_assigned||0,hwCompleted=pe.homework?.completed||0;
    const attRate=pe.attendance?.attendance_rate!==null&&pe.attendance?.attendance_rate!==undefined?pe.attendance.attendance_rate+'%':'—';
    const attNote=(pe.attendance?.unrecorded>0)?`${pe.attendance?.total_held||0} held · ${pe.attendance.unrecorded} unrecorded`:`${pe.attendance?.total_held||0} held classes`;
    let examsHtml='';
    if(Array.isArray(pe.assessments)&&pe.assessments.length){
     examsHtml='<h4>Published Examination Results</h4>'+table(['Exam','Type','Date','Marks','Feedback'],pe.assessments.map(a=>`<tr>${item(a.title)}${item(a.assessment_type)}${item(a.assessment_date)}<td><b>${escapeHtml(a.obtained_marks)} / ${escapeHtml(a.max_marks)}</b></td>${item(a.guardian_feedback||'—')}</tr>`));
    }
    return `<div class="card mb-sm"><div class="panel-title"><b>${escapeHtml(pe.course_title)} · ${escapeHtml(pe.batch_name)} (${escapeHtml(pe.delivery_mode)})</b>${tag(pe.status)}</div><div class="cards my-sm"><div class="card"><small>All-time Verified Attendance</small><div class="big">${attRate}</div><small>${escapeHtml(attNote)}</small></div><div class="card"><small>Homework Completed</small><div class="big">${hwCompleted} / ${hwAssigned}</div><small>${pe.homework?.pending||0} pending</small></div></div>${examsHtml}</div>`;
   }).join('');
  }

  let hwTableHtml='';
  if(childHw.length){
   hwTableHtml='<h3>Assigned Homework</h3>'+table(['Assignment','Course / Batch','Due Date','Status','Teacher Feedback'],childHw.map(h=>`<tr>${item(h.title)}${item(h.course_title+' / '+h.batch_name)}${item(h.due_date)}<td>${tag(h.status)}</td>${item(h.teacher_feedback||'—')}</tr>`));
  }

  let paymentsTableHtml='';
  if(childPayments.length){
   paymentsTableHtml='<h3>External Payment References</h3>'+table(['Course / Batch','Billing Month','Reference Code','Status','Recorded At'],childPayments.map(p=>`<tr>${item(p.course_title+' / '+p.batch_name)}${item(p.billing_month)}${item(p.reference_code)}<td>${tag(p.payment_status)}</td>${item(formatDate(p.recorded_at))}</tr>`))+'<p class="help">Payment collection and verification are processed via the external Payment Portal. Verified references recorded by administration are displayed above.</p>';
  }

  return `<section class="panel guardian-child"><h2>${escapeHtml(child.full_name)}</h2><h3>Enrollments</h3>${table(['Course','Batch','Mode','Start','Status'],en.map(e=>`<tr>${item(e.course_title)}${item(e.batch_name)}${item(e.delivery_mode)}${item(e.start_date)}<td>${tag(e.status)}</td></tr>`))}${unifiedProgressHtml}${hwTableHtml}<h3>Attendance · ${escapeHtml(month)}</h3><p class="help">Verified held classes only. Unrecorded attendance is separate from absence. A dash means no verified held classes. Rates with unrecorded attendance are provisional.</p>${table(['Course / batch','Held','Present','Late','Absent','Unrecorded','Rate'],attendance.map(a=>`<tr>${item(a.course_title+' / '+a.batch_name)}${item(a.held_classes)}${item(a.present)}${item(a.late)}${item(a.absent)}${item(a.unrecorded)}${item(a.attendance_percent===null?'—':a.attendance_percent+'%'+(a.unrecorded?' (provisional)':''))}</tr>`))}<div class="inline-actions">${btn('View leave','care-open-leave','')}</div><h3>Class attendance history</h3>${table(['Class date (Bangladesh)','Course / batch','Attendance'],held.map(r=>`<tr>${item(formatDate(r.scheduled_start))}${item(r.course_title+' / '+r.batch_name)}${item(r.attendance_status||'Unrecorded')}</tr>`))}<h3>Published progress & homework</h3>${publicationCards(updates)}${paymentsTableHtml}</section>`;
 }));

 const warnBanner=loadErrors.length?`<div class="page-note danger mb-md" role="alert">Some sections could not be loaded (${escapeHtml(loadErrors.join(', '))}).</div>`:'';
 return warnBanner+announcementsHtml+filter+childrenPanels.join('')+'<p class="help">Progress: latest 200 publications across linked children. Class history: latest 200 verified held enrollment/class records for the selected month.</p>'+supportHtml;
}
async function progressPublishModal(){
 try{const owner=state.me.id;const en=await request('/enrollments');if(state.me?.id!==owner)return;if(!en.length)return note('No assigned enrollments to publish for.');
 const requestId=crypto.randomUUID();
 const fields=select('Learner / enrollment','enrollment_id',en.map(e=>[e.id,`${e.student_name} — ${e.course_title} / ${e.batch_name} (${e.delivery_mode})`]))+field('Update title','title','text','maxlength="150"')+'<label class="wide">Progress summary<textarea name="progress_summary" required maxlength="5000"></textarea></label><label class="wide">Homework summary (optional)<textarea name="homework_summary" maxlength="5000"></textarea></label><p class="wide help">Publish makes this learner-specific summary visible to linked Guardians immediately. Write a separate family-facing summary. Do not copy internal reports or private follow-up notes.</p>';
 modal('Publish learner progress',fields,async d=>{d.enrollment_id=Number(d.enrollment_id);d.request_id=requestId;await request('/progress',{method:'POST',body:d})},'Publish to Guardian');
 }catch(e){note(e.message)}
}
