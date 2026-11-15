import pytest
from datetime import datetime
from app.policy import report_due,late_from_join,absence_streak, correction_cutoff


def test_policy_late_boundary():
    assert not late_from_join('2026-10-31T18:00','2026-10-31T18:15')
    assert late_from_join('2026-10-31T18:00','2026-10-31T18:15:01')


def test_report_deadlines_bd():
    assert report_due('2026-10-31T18:00','2026-10-31T22:59').isoformat().startswith('2026-10-31T23:59')
    assert report_due('2026-10-31T22:30','2026-10-31T23:00').isoformat().startswith('2026-11-01T12:00')
    assert report_due('2026-10-31T23:00','2026-11-01T00:30').isoformat().startswith('2026-11-01T12:00')
    assert correction_cutoff('2026-10-31T18:00').isoformat().startswith('2026-11-07T23:59')


def test_absence_streak_helper():
    rows=[{'status':'Absent','unauthorized':True} for _ in range(7)]
    assert absence_streak(rows)==7
    rows.append({'status':'Late','unauthorized':False})
    assert absence_streak(rows)==0


def test_csrf_and_admin_scoping(client,auth,seed):
    assert client.post('/api/students',json={'full_name':'Another Kid','family_id':seed['fam']}).status_code==403
    assert client.get('/api/students').status_code==200
    assert client.post('/api/students',json={'full_name':'Another Kid','family_id':seed['fam']},headers=auth).status_code==200


def test_guardian_access_is_family_scoped(client,auth,seed):
    from app.db import transaction
    from app.security import hash_password,iso
    with transaction() as c:
        salt,h=hash_password('AnotherParentPass123!')
        c.execute('''INSERT INTO users(email,name,role,branch_id,password_salt,password_hash,created_at)
              VALUES (?,?,?,?,?,?,?)''',('another@example.test','Other Guardian','guardian_primary',1,salt,h,iso()))
        c.execute('INSERT INTO families(name,branch_id) VALUES (?,?)',('Other Family',1))
        fid=c.execute('SELECT last_insert_rowid()').fetchone()[0]
        c.execute('INSERT INTO family_guardians(family_id,user_id) VALUES (?,?)',(fid,5))
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as tc:
        r=tc.post('/api/login',json={'email':'another@example.test','password':'AnotherParentPass123!'})
        assert r.status_code==200
        assert tc.get('/api/students').json()==[]
        assert tc.get('/api/enrollments').json()==[]
        assert tc.get('/api/classes').json()==[]


def test_teacher_attendance_report_and_zimmadar_approval(client,auth,seed):
    from app.db import transaction
    from app.security import iso
    from datetime import datetime
    # Actual start/end are authoritative records for this test; no external provider data is fabricated.
    with transaction() as c:
        c.execute('''UPDATE class_sessions SET status='ended',actual_start=?,actual_end=? WHERE id=?''',
            ('2026-10-31T18:00:00+06:00','2026-10-31T18:50:00+06:00',seed['classid']))
    z=client.post('/api/login',json={'email':'zimm@example.test','password':'ZimmadarPassword1234!'})
    zh={'x-csrf-token':z.json()['csrf']}
    r=client.post(f'/api/classes/{seed["classid"]}/verify-held',json={},headers=zh)
    assert r.status_code==200,r.text
    t=client.post('/api/login',json={'email':'teach@example.test','password':'TeacherPassword123456!'})
    th={'x-csrf-token':t.json()['csrf']}
    a=client.post(f'/api/classes/{seed["classid"]}/attendance',json={'enrollment_id':seed['enr'],'status':'Present','join_time':'2026-10-31T18:15'},headers=th)
    assert a.status_code==200,a.text
    assert a.json()['status']=='Present'
    # 15:01 must classify Late, but correction outside 7-day class cutoff is intentionally blocked at current clock.
    report=client.post(f'/api/classes/{seed["classid"]}/report',json={'body':'Completed lesson one','submit':True},headers=th)
    assert report.status_code==200,report.text
    rid=report.json()['id']
    assert client.post(f'/api/reports/{rid}/review',json={'action':'approve'},headers=th).status_code==403
    z=client.post('/api/login',json={'email':'zimm@example.test','password':'ZimmadarPassword1234!'})
    zh={'x-csrf-token':z.json()['csrf']}
    approved=client.post(f'/api/reports/{rid}/review',json={'action':'approve'},headers=zh)
    assert approved.status_code==200,approved.text
    assert approved.json()['status']=='approved'
    assert client.post(f'/api/reports/{rid}/review',json={'action':'approve'},headers=zh).status_code==409


def test_one_to_one_same_student_may_have_group_enrollment(client,auth,seed):
    # Same student may enroll in both without duplicated person or global attendance aggregation.
    def p(route,data):
        r=client.post(route,headers=auth,json=data)
        assert r.status_code==200,r.text
        return r.json()['id']
    batch=p('/api/batches',{'course_id':seed['course'],'label':'Individual Class','delivery_mode':'one_to_one',
                           'teacher_id':seed['teacher'],'zimmadar_id':seed['zimm']})
    eid=p('/api/enrollments',{'student_id':seed['student'],'batch_id':batch,'start_date':'2026-01-01'})
    assert eid!=seed['enr']
    rows=client.get('/api/enrollments').json()
    assert len([r for r in rows if r['student_id']==seed['student']])==2
    r=client.post('/api/enrollments',headers=auth,json={'student_id':seed['student'],'batch_id':batch,'start_date':'2026-02-01'})
    assert r.status_code==409


def test_guardian_sees_own_child_both_modes_not_other_children(client,auth,seed):
    from fastapi.testclient import TestClient
    from app.main import app
    def post(route,payload):
        r=client.post(route,json=payload,headers=auth)
        assert r.status_code==200,r.text
        return r.json()['id']
    b2=post('/api/batches',{'course_id':seed['course'],'label':'One-to-one sample','delivery_mode':'one_to_one',
                             'teacher_id':seed['teacher'],'zimmadar_id':seed['zimm']})
    post('/api/enrollments',{'student_id':seed['student'],'batch_id':b2,'start_date':'2026-01-01'})
    other_f=post('/api/families',{'name':'Unlinked Family','branch_id':1})
    post('/api/students',{'full_name':'Not linked child','family_id':other_f})
    with TestClient(app) as guardian:
        login=guardian.post('/api/login',json={'email':'guardian@example.test','password':'GuardianPassword1234!'})
        assert login.status_code==200
        students=guardian.get('/api/students').json()
        assert [s['full_name'] for s in students]==['Sample Child']
        enr=guardian.get('/api/enrollments').json()
        assert len(enr)==2 and {e['delivery_mode'] for e in enr}=={'group','one_to_one'}
        assert guardian.get('/api/reports').json()==[]  # Publication contract not approved
        assert guardian.post('/api/students',json={'full_name':'New Kid','family_id':other_f}).status_code==403


def test_branch_scope_rejects_cross_branch_student_creation(client,auth,seed):
    from fastapi.testclient import TestClient
    from app.main import app
    b=client.post('/api/branches',json={'name':'London'},headers=auth)
    assert b.status_code==200
    bid=b.json()['id']
    with TestClient(app) as branch:
        # Admin bootstrap is central; new branch admin scoped to London.
        r=client.post('/api/users',headers=auth,json={'email':'london@example.test','name':'London Manager',
            'role':'branch_admin','branch_id':bid,'password':'BrAdmin12345!Secure'})
        assert r.status_code==200,r.text
        l=branch.post('/api/login',json={'email':'london@example.test','password':'BrAdmin12345!Secure'})
        assert l.status_code==200
        csrf={'x-csrf-token':l.json()['csrf']}
        r=branch.post('/api/students',json={'full_name':'Other Branch Kid','family_id':seed['fam']},headers=csrf)
        assert r.status_code==403
        assert branch.get('/api/students').json()==[]
        r=branch.post('/api/users',headers=csrf,json={'email':'central2@example.test','name':'Cross Branch Admin',
            'role':'central_admin','password':'StrongStrongStrong1!'})
        assert r.status_code==403


def test_report_return_requires_reason_and_preserves_submission(client,auth,seed):
    from app.db import transaction,read_connection
    from fastapi.testclient import TestClient
    from app.main import app
    with transaction() as c:
        c.execute('''UPDATE class_sessions SET status='ended',actual_start=?,actual_end=? WHERE id=?''',
           ('2026-10-31T23:00:00+06:00','2026-11-01T00:25:00+06:00',seed['classid']))
    with TestClient(app) as teacher, TestClient(app) as zimm:
        t=teacher.post('/api/login',json={'email':'teach@example.test','password':'TeacherPassword123456!'})
        z=zimm.post('/api/login',json={'email':'zimm@example.test','password':'ZimmadarPassword1234!'})
        th={'x-csrf-token':t.json()['csrf']};zh={'x-csrf-token':z.json()['csrf']}
        r=teacher.post(f'/api/classes/{seed["classid"]}/report',json={'body':'Lessons and homework','submit':True},headers=th)
        assert r.status_code==200,r.text
        rid=r.json()['id']
        assert r.json()['due_at'].startswith('2026-11-01T12:00')
        assert zimm.post(f'/api/reports/{rid}/review',json={'action':'return_report'},headers=zh).status_code==400
        returned=zimm.post(f'/api/reports/{rid}/review',json={'action':'return_report','reason':'Missing lesson detail'},headers=zh)
        assert returned.status_code==200
        draft=teacher.post(f'/api/classes/{seed["classid"]}/report',json={'body':'Corrected details','submit':False},headers=th)
        assert draft.status_code==200
        submitted=teacher.post(f'/api/classes/{seed["classid"]}/report',json={'body':'Final details','submit':True},headers=th)
        assert submitted.status_code==200
        with read_connection() as c:
            rep=c.execute('SELECT * FROM reports WHERE id=?',(rid,)).fetchone()
            assert rep['revision']==2 and rep['first_submitted_at'] is not None
            events=c.execute('SELECT event FROM report_revisions WHERE report_id=?',(rid,)).fetchall()
            assert [e['event'] for e in events]==['submit','return_report','draft','submit']
