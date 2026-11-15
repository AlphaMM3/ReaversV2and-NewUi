"""IOM School Maktab core v0.1: isolated DEVELOPMENT implementation, not live deployment."""
import json
import asyncio
import os
import re
import secrets
from datetime import date
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .db import connect, read_connection, transaction, init_db
from .security import (
    ADMIN_ROLES, STAFF_ROLES, SESSION_COOKIE, check_branch, create_session,
    hash_password, iso, lookup_session, require_role, token_hash, utcnow,
    verify_password,
)
from .policy import parse_local, report_due, late_from_join, correction_cutoff
from .report_monitor import monitor_rows, alert_history, process_report_alerts
from .attendance_summary import monthly_summary

@asynccontextmanager
async def lifespan(app):
    init_db()
    async def worker():
        while True:
            try:
                await asyncio.to_thread(process_report_alerts)
            except Exception:
                import logging
                logging.exception('In-app report alert worker error')
            await asyncio.sleep(60)
    task=asyncio.create_task(worker())
    try:
        yield
    finally:
        task.cancel()
        try:await task
        except asyncio.CancelledError:pass

app = FastAPI(title='IOM School Maktab — Core v0.2', docs_url='/api/docs', redoc_url=None, lifespan=lifespan)
APP_ROOT=Path(__file__).resolve().parent
app.mount('/static', StaticFiles(directory=APP_ROOT/'static'), name='static')

@app.get('/')
def home():
    return FileResponse(APP_ROOT/'static'/'index.html')

@app.get('/health')
def health():
    return {'status':'ok', 'version':'0.2.0', 'environment':'local-prototype'}

def rowdict(row):
    return dict(row) if row else None

def audit(c,user,action,entity,entity_id,details=None):
    c.execute('INSERT INTO audit_events(at,actor_id,action,entity,entity_id,details) VALUES (?,?,?,?,?,?)',
        (iso(),user['id'] if user else None,action,entity,entity_id,json.dumps(details or {},ensure_ascii=False)))

def me(request:Request):
    with read_connection() as c:
        u=lookup_session(c,request.cookies.get(SESSION_COOKIE))
    if not u:
        raise HTTPException(401,'Please sign in')
    return dict(u)

def require_csrf(request:Request,user=Depends(me)):
    if not secrets.compare_digest(request.headers.get('x-csrf-token',''),user['csrf']):
        raise HTTPException(403,'Invalid CSRF token')
    return user

def fetchone(c,sql,args=()):
    return rowdict(c.execute(sql,args).fetchone())

def fetchall(c,sql,args=()):
    return [dict(r) for r in c.execute(sql,args).fetchall()]

def obj(c,table,item_id):
    if table not in {'branches','users','families','students','departments','courses','batches','enrollments','class_sessions','reports'}:
        raise RuntimeError('untrusted table')
    res=fetchone(c,f'SELECT * FROM {table} WHERE id=?',(item_id,))
    if not res:raise HTTPException(404,f'{table} not found')
    return res

def batch_scope(c,batch_id,user,mode='read'):
    b=fetchone(c,'''SELECT b.*,d.branch_id,c.title course_title FROM batches b JOIN courses c ON b.course_id=c.id
    JOIN departments d ON c.department_id=d.id WHERE b.id=?''',(batch_id,))
    if not b:raise HTTPException(404,'Batch not found')
    if user['role']=='central_admin':return b
    if user['branch_id']!=b['branch_id'] and user['role'] in STAFF_ROLES:
        raise HTTPException(403,'Out of branch')
    if mode=='admin' and user['role'] in ADMIN_ROLES:return b
    if mode=='manage' and (user['role'] in ADMIN_ROLES or (user['role']=='zimmadar' and b['zimmadar_id']==user['id'])):
        return b
    if mode=='teach' and user['role']=='teacher' and b['teacher_id']==user['id']:return b
    if mode=='read':
        if user['role'] in ADMIN_ROLES:return b
        if user['role']=='zimmadar' and b['zimmadar_id']==user['id']:return b
        if user['role']=='teacher' and b['teacher_id']==user['id']:return b
        if user['role'].startswith('guardian') and c.execute('''SELECT 1 FROM enrollments e JOIN students s ON s.id=e.student_id
        JOIN family_guardians fg ON fg.family_id=s.family_id WHERE e.batch_id=? AND fg.user_id=? LIMIT 1''',
          (batch_id,user['id'])).fetchone():return b
    raise HTTPException(403,'No batch access')

def class_scope(c,class_id,user,mode='read'):
    cl=obj(c,'class_sessions',class_id)
    b=batch_scope(c,cl['batch_id'],user,'read' if mode=='read' else 'manage' if mode=='manage' else 'read')
    if mode=='teach' and not (user['role']=='teacher' and (cl['actual_teacher_id'] or b['teacher_id'])==user['id']):
        raise HTTPException(403,'Assigned teacher only')
    return cl,b

class Login(BaseModel):
    email:str
    password:str

@app.post('/api/login')
def login(payload:Login, response:Response):
    with transaction() as c:
        u=fetchone(c,'SELECT * FROM users WHERE email=? AND active=1',(payload.email.strip(),))
        if not u or not verify_password(payload.password,u['password_salt'],u['password_hash']):
            raise HTTPException(401,'Invalid login')
        token,csrf=create_session(c,u['id'])
    response.set_cookie(SESSION_COOKIE,token,httponly=True,samesite='strict',
        secure=os.getenv('ACADEMY_SECURE_COOKIES')=='1',max_age=12*3600)
    return {'ok':True,'csrf':csrf,'user':{'id':u['id'],'name':u['name'],'role':u['role']}}

@app.post('/api/logout')
def logout(response:Response,request:Request,user=Depends(require_csrf)):
    with transaction() as c:
        c.execute('DELETE FROM auth_sessions WHERE token_hash=?',(token_hash(request.cookies.get(SESSION_COOKIE,'')),))
    response.delete_cookie(SESSION_COOKIE)
    return {'ok':True}

@app.get('/api/me')
def session_info(user=Depends(me)):
    return {k:user[k] for k in ('id','name','email','role','branch_id','csrf')}

class ChangePasswordIn(BaseModel):
    current_password:str
    new_password:str=Field(min_length=6,max_length=256)

@app.post('/api/auth/change-password')
def change_password(data:ChangePasswordIn, user=Depends(require_csrf)):
    with transaction() as c:
        u = fetchone(c, 'SELECT * FROM users WHERE id=?', (user['id'],))
        if not u or not verify_password(data.current_password, u['password_salt'], u['password_hash']):
            raise HTTPException(400, 'Current password incorrect')
        salt, hash_ = hash_password(data.new_password)
        c.execute('UPDATE users SET password_salt=?, password_hash=? WHERE id=?', (salt, hash_, user['id']))
        audit(c, user, 'update', 'password', user['id'])
        return {'ok': True, 'message': 'Password updated successfully'}

class UserIn(BaseModel):
    email:str
    name:str=Field(min_length=2,max_length=150)
    role:Literal['central_admin','branch_admin','zimmadar','teacher','guardian_primary','guardian_secondary']
    branch_id:int|None=None
    password:str=Field(min_length=12,max_length=256)

@app.post('/api/users')
def make_user(data:UserIn,user=Depends(require_csrf)):
    require_role(user,*ADMIN_ROLES)
    if user['role']=='branch_admin':
        if data.role in ('central_admin','branch_admin') or data.branch_id!=user['branch_id']:
            raise HTTPException(403,'Branch admin cannot create privileged/cross-branch users')
    if data.role!='central_admin' and not data.branch_id:
        raise HTTPException(400,'Branch required')
    salt,hash_=hash_password(data.password)
    with transaction() as c:
        if data.branch_id:obj(c,'branches',data.branch_id)
        try:
            cur=c.execute('''INSERT INTO users(email,name,role,branch_id,password_salt,password_hash,created_at)
            VALUES (?,?,?,?,?,?,?)''',(data.email.strip().lower(),data.name,data.role,data.branch_id,salt,hash_,iso()))
        except __import__('sqlite3').IntegrityError:
            raise HTTPException(409,'User already exists')
        audit(c,user,'create','user',cur.lastrowid,{'role':data.role})
        return {'id':cur.lastrowid}

@app.get('/api/users')
def get_users(user=Depends(me)):
    require_role(user,*STAFF_ROLES)
    with read_connection() as c:
        if user['role']=='central_admin':
            return fetchall(c,'SELECT id,name,email,role,branch_id FROM users WHERE active=1 ORDER BY id DESC')
        if user['role']=='teacher':
            return [{'id':user['id'],'name':user['name'],'email':user['email'],'role':user['role'],'branch_id':user['branch_id']}]
        return fetchall(c,'SELECT id,name,email,role,branch_id FROM users WHERE active=1 AND branch_id=?',(user['branch_id'],))

class BranchIn(BaseModel):
    name:str=Field(min_length=2,max_length=100)

@app.post('/api/branches')
def make_branch(data:BranchIn,user=Depends(require_csrf)):
    require_role(user,'central_admin')
    with transaction() as c:
        try:cur=c.execute('INSERT INTO branches(name) VALUES (?)',(data.name,))
        except __import__('sqlite3').IntegrityError:raise HTTPException(409,'Duplicate branch')
        audit(c,user,'create','branch',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/branches')
def branches(user=Depends(me)):
    require_role(user,*STAFF_ROLES)
    with read_connection() as c:
        return fetchall(c,'SELECT * FROM branches') if user['role']=='central_admin' else fetchall(c,'SELECT * FROM branches WHERE id=?',(user['branch_id'],))

class FamilyIn(BaseModel):
    name:str=Field(min_length=1,max_length=150)
    branch_id:int
    guardian_user_id:int|None=None

@app.post('/api/families')
def make_family(data:FamilyIn,user=Depends(require_csrf)):
    require_role(user,*ADMIN_ROLES)
    check_branch(user,data.branch_id)
    with transaction() as c:
        obj(c,'branches',data.branch_id)
        if data.guardian_user_id:
            g=obj(c,'users',data.guardian_user_id)
            if not g['role'].startswith('guardian') or g['branch_id']!=data.branch_id:
                raise HTTPException(400,'Guardian role / branch mismatch')
        cur=c.execute('INSERT INTO families(name,branch_id) VALUES (?,?)',(data.name,data.branch_id))
        if data.guardian_user_id:
            c.execute('INSERT INTO family_guardians(family_id,user_id) VALUES (?,?)',(cur.lastrowid,data.guardian_user_id))
        audit(c,user,'create','family',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/families')
def families(user=Depends(me)):
    with read_connection() as c:
        if user['role']=='central_admin':return fetchall(c,'SELECT * FROM families ORDER BY id DESC')
        if user['role'] in ADMIN_ROLES:return fetchall(c,'SELECT * FROM families WHERE branch_id=?',(user['branch_id'],))
        if user['role'].startswith('guardian'):
            return fetchall(c,'SELECT f.* FROM families f JOIN family_guardians fg ON fg.family_id=f.id WHERE fg.user_id=?',(user['id'],))
        raise HTTPException(403,'Family list restricted')

class StudentIn(BaseModel):
    full_name:str=Field(min_length=2,max_length=160)
    family_id:int

@app.post('/api/students')
def create_student(data:StudentIn,user=Depends(require_csrf)):
    require_role(user,*ADMIN_ROLES)
    with transaction() as c:
        fam=obj(c,'families',data.family_id)
        check_branch(user,fam['branch_id'])
        cur=c.execute('INSERT INTO students(full_name,branch_id,family_id,created_at) VALUES (?,?,?,?)',
           (data.full_name,fam['branch_id'],data.family_id,iso()))
        audit(c,user,'create','student',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/students')
def list_students(user=Depends(me)):
    with read_connection() as c:
        base='''SELECT s.id,s.full_name,s.family_id,s.branch_id,f.name family_name FROM students s
        JOIN families f ON f.id=s.family_id'''
        if user['role']=='central_admin':return fetchall(c,base+' ORDER BY s.id DESC')
        if user['role'] in ADMIN_ROLES:return fetchall(c,base+' WHERE s.branch_id=? ORDER BY s.id DESC',(user['branch_id'],))
        if user['role'].startswith('guardian'):
            return fetchall(c,base+' JOIN family_guardians fg ON fg.family_id=s.family_id WHERE fg.user_id=? ORDER BY s.id DESC',(user['id'],))
        if user['role']=='teacher':
            return fetchall(c,base+''' JOIN enrollments e ON e.student_id=s.id
                JOIN batches b ON b.id=e.batch_id WHERE b.teacher_id=? GROUP BY s.id ORDER BY s.id DESC''',(user['id'],))
        if user['role']=='zimmadar':
            return fetchall(c,base+''' JOIN enrollments e ON e.student_id=s.id
                JOIN batches b ON b.id=e.batch_id WHERE b.zimmadar_id=? GROUP BY s.id ORDER BY s.id DESC''',(user['id'],))
        return []

class DepartmentIn(BaseModel):
    branch_id:int
    name:str=Field(min_length=2,max_length=150)
    category:Literal['regular','single_course','other']='regular'

@app.post('/api/departments')
def create_department(data:DepartmentIn,user=Depends(require_csrf)):
    require_role(user,*ADMIN_ROLES)
    check_branch(user,data.branch_id)
    with transaction() as c:
        cur=c.execute('INSERT INTO departments(branch_id,name,category) VALUES (?,?,?)',(data.branch_id,data.name,data.category))
        audit(c,user,'create','department',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/departments')
def list_departments(user=Depends(me)):
    with read_connection() as c:
        if user['role']=='central_admin':return fetchall(c,'SELECT * FROM departments')
        if user['role'] in STAFF_ROLES:return fetchall(c,'SELECT * FROM departments WHERE branch_id=?',(user['branch_id'],))
        return []

class CourseIn(BaseModel):
    department_id:int
    title:str=Field(min_length=2,max_length=150)
    duration_type:Literal['fixed','continuous']='fixed'

@app.post('/api/courses')
def make_course(data:CourseIn,user=Depends(require_csrf)):
    require_role(user,*ADMIN_ROLES)
    with transaction() as c:
        d=obj(c,'departments',data.department_id)
        check_branch(user,d['branch_id'])
        cur=c.execute('INSERT INTO courses(department_id,title,duration_type) VALUES (?,?,?)',(data.department_id,data.title,data.duration_type))
        audit(c,user,'create','course',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/courses')
def list_courses(user=Depends(me)):
    with read_connection() as c:
        base='SELECT c.*,d.name department,d.branch_id,d.category FROM courses c JOIN departments d ON d.id=c.department_id'
        if user['role']=='central_admin':return fetchall(c,base)
        if user['role'] in STAFF_ROLES:return fetchall(c,base+' WHERE d.branch_id=?',(user['branch_id'],))
        return []

class BatchIn(BaseModel):
    course_id:int
    label:str=Field(min_length=2,max_length=150)
    delivery_mode:Literal['group','one_to_one']='group'
    teacher_id:int|None=None
    zimmadar_id:int|None=None

@app.post('/api/batches')
def make_batch(data:BatchIn,user=Depends(require_csrf)):
    require_role(user,*ADMIN_ROLES)
    with transaction() as c:
        course=obj(c,'courses',data.course_id)
        dep=obj(c,'departments',course['department_id'])
        check_branch(user,dep['branch_id'])
        for uid, role in ((data.teacher_id,'teacher'),(data.zimmadar_id,'zimmadar')):
            if uid:
                u=obj(c,'users',uid)
                if u['role']!=role or u['branch_id']!=dep['branch_id']:
                    raise HTTPException(400,f'Assigned {role} has wrong role or branch')
        cur=c.execute('INSERT INTO batches(course_id,label,delivery_mode,teacher_id,zimmadar_id) VALUES (?,?,?,?,?)',
            (data.course_id,data.label,data.delivery_mode,data.teacher_id,data.zimmadar_id))
        audit(c,user,'create','batch',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/batches')
def list_batches(user=Depends(me)):
    with read_connection() as c:
        base='''SELECT b.*,c.title course_title,d.branch_id,d.name department FROM batches b
        JOIN courses c ON c.id=b.course_id JOIN departments d ON d.id=c.department_id'''
        if user['role']=='central_admin':return fetchall(c,base+' ORDER BY b.id DESC')
        if user['role']=='branch_admin':return fetchall(c,base+' WHERE d.branch_id=? ORDER BY b.id DESC',(user['branch_id'],))
        if user['role']=='teacher':return fetchall(c,base+' WHERE b.teacher_id=?',(user['id'],))
        if user['role']=='zimmadar':return fetchall(c,base+' WHERE b.zimmadar_id=?',(user['id'],))
        return fetchall(c,base+''' JOIN enrollments e ON e.batch_id=b.id JOIN students s ON s.id=e.student_id
        JOIN family_guardians fg ON fg.family_id=s.family_id WHERE fg.user_id=? GROUP BY b.id''',(user['id'],))

class EnrollIn(BaseModel):
    student_id:int
    batch_id:int
    start_date:date
    end_date:date|None=None

@app.post('/api/enrollments')
def make_enrollment(data:EnrollIn,user=Depends(require_csrf)):
    require_role(user,*ADMIN_ROLES)
    with transaction() as c:
        student=obj(c,'students',data.student_id)
        batch=batch_scope(c,data.batch_id,user,'admin')
        if student['branch_id']!=batch['branch_id']:
            raise HTTPException(400,'Cannot enroll across branches without approved transfer')
        if data.end_date and data.end_date<data.start_date:raise HTTPException(400,'End before start')
        # 1:1 exactly one concurrently active student per batch, so contract operations are not mixed.
        if batch['delivery_mode']=='one_to_one' and c.execute('''SELECT 1 FROM enrollments
          WHERE batch_id=? AND status='active' AND (end_date IS NULL OR end_date>=?) LIMIT 1''',
          (data.batch_id,str(data.start_date))).fetchone():
            raise HTTPException(409,'One-to-one slot already assigned')
        cur=c.execute('INSERT INTO enrollments(student_id,batch_id,start_date,end_date) VALUES (?,?,?,?)',
            (data.student_id,data.batch_id,str(data.start_date),str(data.end_date) if data.end_date else None))
        audit(c,user,'enroll','enrollment',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/enrollments')
def list_enrollments(user=Depends(me)):
    with read_connection() as c:
        base='''SELECT e.*,s.full_name student_name,s.family_id,s.branch_id,b.label batch_name,b.delivery_mode,
        c.title course_title FROM enrollments e JOIN students s ON s.id=e.student_id
        JOIN batches b ON b.id=e.batch_id JOIN courses c ON c.id=b.course_id'''
        if user['role']=='central_admin':return fetchall(c,base+' ORDER BY e.id DESC')
        if user['role']=='branch_admin':return fetchall(c,base+' WHERE s.branch_id=? ORDER BY e.id DESC',(user['branch_id'],))
        if user['role']=='teacher':return fetchall(c,base+' WHERE b.teacher_id=?',(user['id'],))
        if user['role']=='zimmadar':return fetchall(c,base+' WHERE b.zimmadar_id=?',(user['id'],))
        return fetchall(c,base+''' JOIN family_guardians fg ON fg.family_id=s.family_id
            WHERE fg.user_id=? ORDER BY e.id DESC''',(user['id'],))

class SessionIn(BaseModel):
    batch_id:int
    scheduled_start:str
    scheduled_end:str
    meeting_url:str|None=None

@app.post('/api/classes')
def make_class(data:SessionIn,user=Depends(require_csrf)):
    with transaction() as c:
        b=batch_scope(c,data.batch_id,user,'manage')
        st=parse_local(data.scheduled_start);ed=parse_local(data.scheduled_end)
        if ed<=st:raise HTTPException(400,'End before start')
        if data.meeting_url and not re.match(r'^https://',data.meeting_url):
            raise HTTPException(400,'Meeting URL must use https')
        cur=c.execute('''INSERT INTO class_sessions(batch_id,scheduled_start,scheduled_end,meeting_url,actual_teacher_id)
        VALUES (?,?,?,?,?)''',(data.batch_id,st.isoformat(),ed.isoformat(),data.meeting_url,b['teacher_id']))
        audit(c,user,'schedule','class_session',cur.lastrowid)
        return {'id':cur.lastrowid}

@app.get('/api/classes')
def list_classes(user=Depends(me)):
    with read_connection() as c:
        base='''SELECT s.*,b.label batch_name,b.delivery_mode,c.title course_title,d.branch_id,
            b.teacher_id,b.zimmadar_id FROM class_sessions s JOIN batches b ON b.id=s.batch_id
            JOIN courses c ON c.id=b.course_id JOIN departments d ON d.id=c.department_id'''
        if user['role']=='central_admin':return fetchall(c,base+' ORDER BY s.scheduled_start DESC LIMIT 200')
        if user['role']=='branch_admin':return fetchall(c,base+' WHERE d.branch_id=? ORDER BY s.scheduled_start DESC LIMIT 200',(user['branch_id'],))
        if user['role']=='teacher':return fetchall(c,base+' WHERE s.actual_teacher_id=? ORDER BY s.scheduled_start DESC LIMIT 200',(user['id'],))
        if user['role']=='zimmadar':return fetchall(c,base+' WHERE b.zimmadar_id=? ORDER BY s.scheduled_start DESC LIMIT 200',(user['id'],))
        return fetchall(c,base+''' JOIN enrollments e ON e.batch_id=b.id JOIN students st ON st.id=e.student_id
        JOIN family_guardians fg ON fg.family_id=st.family_id WHERE fg.user_id=?
        GROUP BY s.id ORDER BY s.scheduled_start DESC LIMIT 200''',(user['id'],))

@app.post('/api/classes/{class_id}/start')
def start_class(class_id:int,user=Depends(require_csrf)):
    with transaction() as c:
        s,b=class_scope(c,class_id,user,'teach')
        if s['status']!='scheduled':raise HTTPException(409,'Already started or not scheduled')
        c.execute('UPDATE class_sessions SET actual_start=?,status=? WHERE id=?',(iso(),'in_progress',class_id))
        audit(c,user,'start','class_session',class_id)
        return {'ok':True,'meeting_url':s['meeting_url']}

@app.post('/api/classes/{class_id}/end')
def end_class(class_id:int,user=Depends(require_csrf)):
    with transaction() as c:
        s,b=class_scope(c,class_id,user,'teach')
        if s['status']!='in_progress':raise HTTPException(409,'Class not in progress')
        c.execute('UPDATE class_sessions SET actual_end=?,status=? WHERE id=?',(iso(),'ended',class_id))
        audit(c,user,'end','class_session',class_id)
        return {'ok':True,'next':'Write class report'}

@app.post('/api/classes/{class_id}/verify-held')
def verify_held(class_id:int,user=Depends(require_csrf)):
    with transaction() as c:
        s,b=class_scope(c,class_id,user,'manage')
        if not (user['role']=='zimmadar' and b['zimmadar_id']==user['id']):
            raise HTTPException(403,'Assigned Batch Zimmadar only')
        if s['status']!='ended' or not s['actual_start'] or not s['actual_end']:
            raise HTTPException(409,'Ended session with actual times required')
        if s['held_verified']:
            return {'ok':True,'already_verified':True}
        c.execute('UPDATE class_sessions SET held_verified=1 WHERE id=?',(class_id,))
        audit(c,user,'verify_held','class_session',class_id)
        return {'ok':True}

class AttendIn(BaseModel):
    enrollment_id:int
    status:Literal['Present','Absent','Late']
    join_time:str|None=None

@app.post('/api/classes/{class_id}/attendance')
def record_attendance(class_id:int,data:AttendIn,user=Depends(require_csrf)):
    with transaction() as c:
        s,b=class_scope(c,class_id,user,'teach')
        if s['status']!='ended' or s['held_verified']!=1:
            raise HTTPException(409,'Class must be ended and verified held')
        e=obj(c,'enrollments',data.enrollment_id)
        if e['batch_id']!=s['batch_id'] or e['status']!='active':raise HTTPException(403,'Invalid enrollment for class')
        class_date=parse_local(s['scheduled_start']).date()
        if class_date<date.fromisoformat(e['start_date']) or (e['end_date'] and class_date>date.fromisoformat(e['end_date'])):
            raise HTTPException(409,'Enrollment not effective on this class date')
        status=data.status
        join_time=None
        if data.join_time:
            join_time=parse_local(data.join_time).isoformat()
            if not s['actual_start'] or parse_local(join_time)<parse_local(s['actual_start']):
                raise HTTPException(400,'Join time before actual start or start unavailable')
            status='Late' if late_from_join(s['actual_start'],join_time) else 'Present'
        elif status=='Late':
            # D-053 allows teacher-verified manual evidence; no made-up timestamp.
            status='Late'
        prior=fetchone(c,'SELECT * FROM attendance WHERE class_id=? AND enrollment_id=?',(class_id,data.enrollment_id))
        if prior and parse_local(iso())>correction_cutoff(s['scheduled_start']):
            raise HTTPException(409,'Past seven-day direct-correction window; Batch Zimmadar approval required (not implemented)')
        if prior:
            c.execute('UPDATE attendance SET status=?,join_time=?,verified_by=?,verified_at=? WHERE id=?',
               (status,join_time,user['id'],iso(),prior['id']))
            audit(c,user,'correct_attendance','attendance',prior['id'],{'old':prior['status'],'new':status})
            return {'id':prior['id'],'status':status,'corrected':True}
        cur=c.execute('''INSERT INTO attendance(class_id,enrollment_id,status,join_time,verified_by,verified_at)
            VALUES (?,?,?,?,?,?)''',(class_id,data.enrollment_id,status,join_time,user['id'],iso()))
        audit(c,user,'record_attendance','attendance',cur.lastrowid,{'status':status})
        return {'id':cur.lastrowid,'status':status}

@app.get('/api/classes/{class_id}/attendance')
def class_attendance(class_id:int,user=Depends(me)):
    with read_connection() as c:
        s,b=class_scope(c,class_id,user)
        base='''SELECT a.id,a.class_id,a.enrollment_id,a.status,a.join_time,st.full_name
        FROM attendance a JOIN enrollments e ON e.id=a.enrollment_id JOIN students st ON st.id=e.student_id
        WHERE a.class_id=?'''
        if user['role'].startswith('guardian'):
            base+=' AND EXISTS (SELECT 1 FROM family_guardians fg WHERE fg.family_id=st.family_id AND fg.user_id=?)'
            return fetchall(c,base,(class_id,user['id']))
        return fetchall(c,base,(class_id,))

class ReportIn(BaseModel):
    body:str=Field(min_length=1,max_length=10000)
    submit:bool=False

@app.post('/api/classes/{class_id}/report')
def save_report(class_id:int,data:ReportIn,user=Depends(require_csrf)):
    with transaction() as c:
        s,b=class_scope(c,class_id,user,'teach')
        if s['status']!='ended':raise HTTPException(409,'Report requires ended class')
        now=iso()
        existing=fetchone(c,'SELECT * FROM reports WHERE class_id=?',(class_id,))
        if existing and existing['status'] in ('submitted','approved'):
            raise HTTPException(409,'Report submitted/approved; direct overwrite forbidden')
        if existing:
            rev=existing['revision']+(1 if existing['status']=='returned' else 0)
            status='submitted' if data.submit else 'draft'
            first=existing['first_submitted_at'] or (now if data.submit else None)
            c.execute('''UPDATE reports SET body=?,status=?,first_submitted_at=?,current_submitted_at=?,revision=?,
                review_reason=NULL,reviewer_id=NULL,reviewed_at=NULL,updated_at=? WHERE id=?''',
              (data.body,status,first,now if data.submit else None,rev,now,existing['id']))
            rid=existing['id']
        else:
            status='submitted' if data.submit else 'draft';rev=1
            cur=c.execute('''INSERT INTO reports(class_id,author_id,body,status,first_submitted_at,current_submitted_at,updated_at)
                 VALUES (?,?,?,?,?,?,?)''',(class_id,user['id'],data.body,status,now if data.submit else None,now if data.submit else None,now))
            rid=cur.lastrowid
        event='submit' if data.submit else 'draft'
        c.execute('''INSERT INTO report_revisions(report_id,revision,body,event,actor_id,at) VALUES (?,?,?,?,?,?)''',
           (rid,rev,data.body,event,user['id'],now))
        audit(c,user,'report_'+event,'report',rid,{'revision':rev})
        due=report_due(s['actual_start'],s['actual_end']) if s['actual_start'] and s['actual_end'] else None
        return {'id':rid,'status':status,'revision':rev,'due_at':due.isoformat() if due else None,
                'submission_compliance':'pending' if not data.submit else ('on_time' if due and parse_local(now)<=due else 'late' if due else 'unresolved')}

class ReviewIn(BaseModel):
    action:Literal['approve','return_report']
    reason:str|None=None

@app.post('/api/reports/{report_id}/review')
def review_report(report_id:int,data:ReviewIn,user=Depends(require_csrf)):
    with transaction() as c:
        r=obj(c,'reports',report_id)
        s,b=class_scope(c,r['class_id'],user,'manage')
        if not (user['role']=='zimmadar' and b['zimmadar_id']==user['id']):
            raise HTTPException(403,'Batch Zimmadar review required')
        if user['id']==r['author_id']:
            raise HTTPException(409,'Self-approval conflict; alternate reviewer policy pending')
        if r['status']!='submitted':raise HTTPException(409,'Report not awaiting review')
        if data.action=='return_report' and not (data.reason and data.reason.strip()):
            raise HTTPException(400,'Return reason required')
        status='approved' if data.action=='approve' else 'returned'
        c.execute('UPDATE reports SET status=?,review_reason=?,reviewer_id=?,reviewed_at=?,updated_at=? WHERE id=?',
            (status,data.reason if status=='returned' else None,user['id'],iso(),iso(),report_id))
        c.execute('''INSERT INTO report_revisions(report_id,revision,body,event,actor_id,at) VALUES (?,?,?,?,?,?)''',
           (report_id,r['revision'],r['body'],data.action,user['id'],iso()))
        audit(c,user,'review_'+status,'report',report_id,{'reason':data.reason if status=='returned' else None})
        return {'status':status}

@app.get('/api/reports')
def list_reports(user=Depends(me)):
    with read_connection() as c:
        base='''SELECT r.id,r.class_id,r.author_id,r.status,r.revision,r.first_submitted_at,r.review_reason,
          r.updated_at,b.label batch_name,c.title course_title,b.zimmadar_id,b.teacher_id,d.branch_id,
          s.actual_start,s.actual_end FROM reports r JOIN class_sessions s ON s.id=r.class_id
          JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=b.course_id
          JOIN departments d ON d.id=c.department_id'''
        if user['role']=='central_admin':rows=fetchall(c,base+' ORDER BY r.updated_at DESC')
        elif user['role']=='branch_admin':rows=fetchall(c,base+' WHERE d.branch_id=? ORDER BY r.updated_at DESC',(user['branch_id'],))
        elif user['role']=='zimmadar':rows=fetchall(c,base+' WHERE b.zimmadar_id=? ORDER BY r.updated_at DESC',(user['id'],))
        elif user['role']=='teacher':rows=fetchall(c,base+' WHERE r.author_id=? ORDER BY r.updated_at DESC',(user['id'],))
        else:
            # Guardian visibility/publishing contract not approved. Never show drafts/teacher notes.
            return []
        for r in rows:
            due=report_due(r['actual_start'],r['actual_end']) if r['actual_start'] and r['actual_end'] else None
            r['due_at']=due.isoformat() if due else None
            r['submission_status']='pending' if not r['first_submitted_at'] else ('on_time' if due and parse_local(r['first_submitted_at'])<=due else 'late' if due else 'unresolved')
        return rows

@app.get('/api/audit')
def list_audit(user=Depends(me)):
    require_role(user,'central_admin')
    with read_connection() as c:
        return fetchall(c,'SELECT * FROM audit_events ORDER BY id DESC LIMIT 100')

@app.get('/api/summary')
def summary(user=Depends(me)):
    with read_connection() as c:
        students=list_students(user)
        enrollments=list_enrollments(user)
        classes=list_classes(user)
        return {'students':len(students),'enrollments':len(enrollments),'classes':len(classes),
                'group_enrollments':sum(1 for e in enrollments if e['delivery_mode']=='group'),
                'one_to_one_enrollments':sum(1 for e in enrollments if e['delivery_mode']=='one_to_one')}


@app.get('/api/report-monitor')
def report_monitor(user=Depends(me)):
    require_role(user,*STAFF_ROLES)
    return monitor_rows(user)

@app.get('/api/report-alerts')
def report_alerts(user=Depends(me)):
    require_role(user,*STAFF_ROLES)
    return alert_history(user)

@app.post('/api/report-alerts/check-now')
def check_report_alerts(user=Depends(require_csrf)):
    require_role(user,'central_admin')
    return {'logged_events':process_report_alerts(),'channel':'in_app_only'}

@app.get('/api/attendance/monthly')
def get_monthly_attendance(month:str|None=None,user=Depends(me)):
    try:return monthly_summary(user,month)
    except (ValueError,TypeError):raise HTTPException(400,'Month must be YYYY-MM')
