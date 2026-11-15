"""Read-only report monitoring plus durable, in-app *event records* (not external delivery).

Only approved noon-window escalation stages run. Old events are not fabricated
when the server restarts, because historic catch-up policy is pending.
"""
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo
from .db import read_connection, transaction
from .policy import report_due
from .security import iso

BD = ZoneInfo('Asia/Dhaka')
STAGES = (('teacher',time(12,5)), ('zimmadar',time(14,0)),
          ('supervisor',time(16,0)), ('management',time(18,0)))


def _rows(c):
    sql = """SELECT s.id class_id,s.actual_start,s.actual_end,s.actual_teacher_id,
             b.label batch_name,b.teacher_id,b.zimmadar_id,b.id batch_id,
             d.branch_id,d.name department,c.title course_title,
             r.id report_id,r.status report_status,r.first_submitted_at
          FROM class_sessions s JOIN batches b ON b.id=s.batch_id
          JOIN courses c ON c.id=b.course_id JOIN departments d ON d.id=c.department_id
          LEFT JOIN reports r ON r.class_id=s.id
          WHERE s.status='ended' AND s.actual_start IS NOT NULL AND s.actual_end IS NOT NULL
          ORDER BY s.actual_end DESC"""
    return [dict(r) for r in c.execute(sql).fetchall()]


def _can_see(item,user):
    role=user['role']
    if role=='central_admin':return True
    if role=='branch_admin':return item['branch_id']==user['branch_id']
    if role=='teacher':return user['id'] in (item['teacher_id'],item['actual_teacher_id'])
    if role=='zimmadar':return item['zimmadar_id']==user['id']
    return False


def due_stages(due):
    if due is None or due.time()!=time(12):return []
    return [(name,datetime.combine(due.date(),tm,tzinfo=BD)) for name,tm in STAGES]


def monitor_rows(user,now=None):
    now=now or datetime.now(BD)
    with read_connection() as c:
        result=[]
        for s in _rows(c):
            if not _can_see(s,user):continue
            due=report_due(s['actual_start'],s['actual_end'])
            if due is None:continue
            first=s['first_submitted_at']
            pending=first is None
            state='overdue' if pending and now>due else 'awaiting_submission' if pending else s['report_status'] or 'submitted'
            result.append({**s,'due_at':due.isoformat(),'obligation_status':state,
                           'submission_outstanding':pending,'overdue':bool(pending and now>due),
                           'noon_escalation_enabled':bool(due_stages(due)),
                           'eligible_stages':[{'stage':n,'at':t.isoformat()} for n,t in due_stages(due) if t<=now] if pending else []})
        return result


def process_report_alerts(now=None):
    """Log an in-app event only in its 5-minute window; never claim a message sent.

    Unique key prevents duplicate event records on retries/restarts. Missing
    Supervisor role in v0.1 is flagged unassigned, not treated as delivered.
    """
    now=now or datetime.now(BD)
    created=[]
    with transaction() as c:
        for s in _rows(c):
            if s['first_submitted_at'] is not None:continue
            due=report_due(s['actual_start'],s['actual_end'])
            if due is None or due.date()!=now.date():continue
            for stage,scheduled in due_stages(due):
                if not (scheduled<=now<scheduled+timedelta(minutes=5)):continue
                target=(s['actual_teacher_id'] or s['teacher_id']) if stage=='teacher' else s['zimmadar_id'] if stage=='zimmadar' else None
                status='in_app_queue' if stage=='management' or target is not None else 'unassigned'
                if stage=='supervisor':status='unassigned'
                res=c.execute("""INSERT OR IGNORE INTO report_alert_events
                    (class_id,due_at,stage,scheduled_at,created_at,target_user_id,delivery_status)
                    VALUES (?,?,?,?,?,?,?)""",(s['class_id'],due.isoformat(),stage,scheduled.isoformat(),iso(),target,status))
                if res.rowcount:
                    created.append({'class_id':s['class_id'],'stage':stage,'delivery_status':status})
    return created


def alert_history(user):
    with read_connection() as c:
        sql="""SELECT e.*,b.label batch_name,d.branch_id,b.teacher_id,b.zimmadar_id,s.actual_teacher_id
              FROM report_alert_events e JOIN class_sessions s ON s.id=e.class_id
              JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=b.course_id
              JOIN departments d ON d.id=c.department_id ORDER BY e.id DESC LIMIT 500"""
        return [v for r in c.execute(sql).fetchall() if _can_see(v:=dict(r),user)]
