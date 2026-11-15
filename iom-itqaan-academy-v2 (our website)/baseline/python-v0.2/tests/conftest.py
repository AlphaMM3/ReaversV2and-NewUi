import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

@pytest.fixture
def client(tmp_path,monkeypatch):
    # Dedicated database per test; refuse to touch any existing or production database.
    p=tmp_path/'test.sqlite3'
    monkeypatch.setenv('ACADEMY_DB_PATH',str(p))
    from app import db
    monkeypatch.setattr(db,'DB_PATH',p)
    db.init_db()
    from app.security import hash_password, iso
    salt,h=hash_password('This is a very strong test password 123!')
    with db.transaction() as c:
        c.execute('INSERT INTO branches(name) VALUES (?)',('Dhaka',))
        c.execute('''INSERT INTO users(email,name,role,password_salt,password_hash,created_at)
        VALUES (?,?,?,?,?,?)''',('admin@example.test','Admin','central_admin',salt,h,iso()))
    from app.main import app
    with TestClient(app) as tc:
        yield tc

@pytest.fixture
def auth(client):
    data=client.post('/api/login',json={'email':'admin@example.test','password':'This is a very strong test password 123!'}).json()
    assert data['ok']
    return {'x-csrf-token':data['csrf']}

@pytest.fixture
def seed(client,auth):
    def post(route,payload):
        r=client.post(route,json=payload,headers=auth)
        assert r.status_code==200,(route,r.status_code,r.text)
        return r.json()['id']
    teacher=post('/api/users',{'email':'teach@example.test','name':'Test Teacher','role':'teacher','branch_id':1,'password':'TeacherPassword123456!'})
    zimm=post('/api/users',{'email':'zimm@example.test','name':'Test Zimmadar','role':'zimmadar','branch_id':1,'password':'ZimmadarPassword1234!'})
    guardian=post('/api/users',{'email':'guardian@example.test','name':'Test Guardian','role':'guardian_primary','branch_id':1,'password':'GuardianPassword1234!'})
    fam=post('/api/families',{'name':'Test Family','branch_id':1,'guardian_user_id':guardian})
    student=post('/api/students',{'full_name':'Sample Child','family_id':fam})
    dep=post('/api/departments',{'branch_id':1,'name':'Nazera','category':'regular'})
    course=post('/api/courses',{'department_id':dep,'title':'Nazera Level One','duration_type':'continuous'})
    batch=post('/api/batches',{'course_id':course,'label':'Group A','delivery_mode':'group','teacher_id':teacher,'zimmadar_id':zimm})
    enr=post('/api/enrollments',{'student_id':student,'batch_id':batch,'start_date':'2026-01-01'})
    classid=post('/api/classes',{'batch_id':batch,'scheduled_start':'2026-10-31T18:00','scheduled_end':'2026-10-31T19:00'})
    return locals()
