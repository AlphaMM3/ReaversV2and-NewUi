"""New v0.2 backend tests: in-app report monitor; monthly attendance, scope guards."""
from datetime import datetime
from zoneinfo import ZoneInfo
from app.db import transaction, read_connection
from app.report_monitor import process_report_alerts, due_stages
from app.policy import report_due

BD=ZoneInfo('Asia/Dhaka')


def finish_class(classid,start='2026-10-31T22:50:00+06:00',end='2026-10-31T23:10:00+06:00'):
    with transaction() as c:
        c.execute("UPDATE class_sessions SET status='ended',held_verified=1,actual_start=?,actual_end=? WHERE id=?",
                  (start,end,classid))


def test_alert_idempotent_and_no_submitted_report(client,auth,seed):
    finish_class(seed['classid'])
    due=report_due('2026-10-31T22:50','2026-10-31T23:10')
    assert due.isoformat().startswith('2026-11-01T12:00')
    now=datetime(2026,11,1,12,5,tzinfo=BD)
    first=process_report_alerts(now)
    assert len(first)==1 and first[0]['stage']=='teacher'
    assert process_report_alerts(now)==[]
    with read_connection() as c:
        assert c.execute('SELECT COUNT(*) FROM report_alert_events').fetchone()[0]==1
    # Subsequent valid submission stops creation of future initial-submission alerts.
    with transaction() as c:
        c.execute('''INSERT INTO reports(class_id,author_id,body,status,first_submitted_at,current_submitted_at,updated_at)
                     VALUES (?,?,?,?,?,?,?)''',(seed['classid'],seed['teacher'],'Submitted','submitted',
                         '2026-11-01T12:30:00+06:00','2026-11-01T12:30:00+06:00','2026-11-01T12:30:00+06:00'))
    assert process_report_alerts(datetime(2026,11,1,14,0,tzinfo=BD))==[]
    rows=client.get('/api/report-monitor').json()
    assert len(rows)==1 and rows[0]['submission_outstanding'] is False
    events=client.get('/api/report-alerts').json()
    assert len(events)==1 and events[0]['delivery_status']=='in_app_queue'


def test_no_historic_catchup_or_unapproved_evening_schedule(client,auth,seed):
    finish_class(seed['classid'])
    assert process_report_alerts(datetime(2026,11,2,14,0,tzinfo=BD))==[]
    finish_class(seed['classid'], '2026-10-31T18:00+06:00','2026-10-31T18:50+06:00')
    assert due_stages(report_due('2026-10-31T18:00','2026-10-31T18:50'))==[]
    assert process_report_alerts(datetime(2026,10,31,23,59,tzinfo=BD))==[]


def test_noon_alert_stages_and_supervisor_unassigned(client,auth,seed):
    finish_class(seed['classid'])
    assert [r['stage'] for r in process_report_alerts(datetime(2026,11,1,14,0,tzinfo=BD))]==['zimmadar']
    a=process_report_alerts(datetime(2026,11,1,16,0,tzinfo=BD))
    assert a==[{'class_id':seed['classid'],'stage':'supervisor','delivery_status':'unassigned'}]
    assert [r['stage'] for r in process_report_alerts(datetime(2026,11,1,18,0,tzinfo=BD))]==['management']
    assert len(client.get('/api/report-alerts').json())==3


def test_attendance_per_enrollment_and_not_as_false_absence(client,auth,seed):
    finish_class(seed['classid'],'2026-10-31T18:00+06:00','2026-10-31T18:40+06:00')
    data=client.get('/api/attendance/monthly?month=2026-10').json()
    row=next(x for x in data if x['id']==seed['enr'])
    assert row['held_classes']==1 and row['unrecorded']==1
    assert row['absent']==0 and row['low_attendance_evaluable'] is False
    with transaction() as c:
        c.execute('INSERT INTO attendance(class_id,enrollment_id,status,verified_by,verified_at) VALUES (?,?,?,?,?)',
                 (seed['classid'],seed['enr'],'Absent',seed['teacher'],'2026-10-31T19:00:00+06:00'))
    row=next(x for x in client.get('/api/attendance/monthly?month=2026-10').json() if x['id']==seed['enr'])
    assert row['held_classes']==1 and row['absent']==1 and row['unrecorded']==0
    assert row['attendance_percent']==0 and not row['low_attendance_evaluable'] # min 3
    assert client.get('/api/attendance/monthly?month=2026-13').status_code==400


def test_guardian_cannot_view_staff_report_monitor(client,auth,seed):
    from fastapi.testclient import TestClient
    from app.main import app
    finish_class(seed['classid'])
    with TestClient(app) as guardian:
        r=guardian.post('/api/login',json={'email':'guardian@example.test','password':'GuardianPassword1234!'})
        assert r.status_code==200
        assert guardian.get('/api/report-monitor').status_code==403
        assert guardian.get('/api/report-alerts').status_code==403
        assert guardian.get('/api/attendance/monthly?month=2026-10').status_code==200
        assert guardian.post('/api/report-alerts/check-now',headers={'x-csrf-token':r.json()['csrf']}).status_code==403


def test_three_held_classes_threshold_and_enrollment_isolation(client,auth,seed):
    finish_class(seed['classid'],'2026-10-31T18:00+06:00','2026-10-31T18:40+06:00')
    with transaction() as c:
        c.execute('INSERT INTO attendance(class_id,enrollment_id,status,verified_by,verified_at) VALUES (?,?,?,?,?)',
                  (seed['classid'],seed['enr'],'Absent',seed['teacher'],'2026-10-31T19:00:00+06:00'))
        for day,attend in [(28,'Absent'),(29,'Present')]:
            cur=c.execute("""INSERT INTO class_sessions(batch_id,scheduled_start,scheduled_end,actual_start,actual_end,status,held_verified)
                VALUES (?,?,?,?,?,'ended',1)""",(seed['batch'],f'2026-10-{day}T18:00:00+06:00',
                f'2026-10-{day}T19:00:00+06:00',f'2026-10-{day}T18:00:00+06:00',f'2026-10-{day}T18:40:00+06:00'))
            c.execute('INSERT INTO attendance(class_id,enrollment_id,status,verified_by,verified_at) VALUES (?,?,?,?,?)',
                  (cur.lastrowid,seed['enr'],attend,seed['teacher'],f'2026-10-{day}T19:00:00+06:00'))
    r=client.get('/api/attendance/monthly?month=2026-10')
    assert r.status_code==200
    e=next(i for i in r.json() if i['id']==seed['enr'])
    assert e['held_classes']==3 and e['attendance_percent']==33.33
    assert e['low_attendance_evaluable'] and e['below_75_percent']
    assert e['warning_sent'] is False  # no leave policy / notification yet
