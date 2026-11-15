"""D-84, D-95/96, Q4: per-enrollment, Bangladesh-calendar attendance summaries.

Only verified held sessions are in the denominator; unknown attendance never
silently becomes 'Absent'. Warnings/guardian messages intentionally NOT sent.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from .db import read_connection

BD=ZoneInfo('Asia/Dhaka')


def monthly_summary(user,month=None):
    month=month or datetime.now(BD).strftime('%Y-%m')
    try:
        year,mon=map(int,month.split('-'))
        if f'{year:04d}-{mon:02d}'!=month or not (1900<=year<=2200 and 1<=mon<=12):raise ValueError
    except Exception:raise ValueError('Month must be YYYY-MM')
    with read_connection() as c:
        sql="""SELECT e.id,e.start_date,e.end_date,e.status enrollment_status,
           s.full_name student_name,s.family_id,s.branch_id,
           b.id batch_id,b.label batch_name,b.teacher_id,b.zimmadar_id,
           b.delivery_mode,c.title course_title
           FROM enrollments e JOIN students s ON s.id=e.student_id
           JOIN batches b ON b.id=e.batch_id JOIN courses c ON c.id=b.course_id"""
        result=[]
        for row in c.execute(sql).fetchall():
            e=dict(row);role=user['role']
            if role=='central_admin':pass
            elif role=='branch_admin' and e['branch_id']==user['branch_id']:pass
            elif role=='teacher' and e['teacher_id']==user['id']:pass
            elif role=='zimmadar' and e['zimmadar_id']==user['id']:pass
            elif role.startswith('guardian') and c.execute('SELECT 1 FROM family_guardians WHERE family_id=? AND user_id=?',
                      (e['family_id'],user['id'])).fetchone():pass
            else:continue
            # Class dates are stored as Bangladesh-offset ISO. Dates outside enrollment are excluded.
            session_sql="""SELECT ss.id,ss.scheduled_start,a.status
                FROM class_sessions ss LEFT JOIN attendance a
                ON a.class_id=ss.id AND a.enrollment_id=?
                WHERE ss.batch_id=? AND ss.status='ended' AND ss.held_verified=1
                  AND substr(ss.scheduled_start,1,7)=?
                  AND substr(ss.scheduled_start,1,10)>=?
                  AND (? IS NULL OR substr(ss.scheduled_start,1,10)<=?)"""
            records=[dict(r) for r in c.execute(session_sql,(e['id'],e['batch_id'],month,
                      e['start_date'],e['end_date'],e['end_date'])).fetchall()]
            n=len(records)
            present=sum(r['status']=='Present' for r in records)
            late=sum(r['status']=='Late' for r in records)
            absent=sum(r['status']=='Absent' for r in records)
            unrecorded=n-present-late-absent
            rate=round(100*(present+late)/n,2) if n else None
            result.append({**e,'month':month,'held_classes':n,'present':present,
                 'late':late,'absent':absent,'unrecorded':unrecorded,
                 'attendance_percent':rate,
                 'low_attendance_evaluable':bool(n>=3 and unrecorded==0),
                 'below_75_percent':bool(n>=3 and unrecorded==0 and rate<75),
                 'warning_sent':False})
        return result
