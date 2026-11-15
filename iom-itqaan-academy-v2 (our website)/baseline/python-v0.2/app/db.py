"""SQLite implementation of the *development* core store (not production migration)."""
import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(os.environ.get('ACADEMY_DB_PATH', str(Path(__file__).resolve().parents[1] / 'local' / 'academy.sqlite3')))
SCHEMA = '''
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS branches (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('central_admin','branch_admin','zimmadar','teacher','guardian_primary','guardian_secondary')),
 branch_id INTEGER REFERENCES branches(id), password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf TEXT NOT NULL, expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS families (id INTEGER PRIMARY KEY, name TEXT NOT NULL, branch_id INTEGER NOT NULL REFERENCES branches(id));
CREATE TABLE IF NOT EXISTS family_guardians (
 family_id INTEGER NOT NULL REFERENCES families(id), user_id INTEGER NOT NULL REFERENCES users(id),
 PRIMARY KEY(family_id,user_id)
);
CREATE TABLE IF NOT EXISTS students (
 id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, branch_id INTEGER NOT NULL REFERENCES branches(id),
 family_id INTEGER NOT NULL REFERENCES families(id), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS departments (
 id INTEGER PRIMARY KEY, branch_id INTEGER NOT NULL REFERENCES branches(id), name TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('regular','single_course','other')),
 UNIQUE(branch_id,name)
);
CREATE TABLE IF NOT EXISTS courses (
 id INTEGER PRIMARY KEY, department_id INTEGER NOT NULL REFERENCES departments(id),
 title TEXT NOT NULL, duration_type TEXT NOT NULL CHECK(duration_type IN ('fixed','continuous')),
 UNIQUE(department_id,title)
);
CREATE TABLE IF NOT EXISTS batches (
 id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), label TEXT NOT NULL,
 delivery_mode TEXT NOT NULL CHECK(delivery_mode IN ('group','one_to_one')),
 zimmadar_id INTEGER REFERENCES users(id), teacher_id INTEGER REFERENCES users(id),
 UNIQUE(course_id,label)
);
CREATE TABLE IF NOT EXISTS enrollments (
 id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id),
 batch_id INTEGER NOT NULL REFERENCES batches(id), start_date TEXT NOT NULL, end_date TEXT,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','on_hold','withdrawn','completed','inactive')),
 UNIQUE(student_id,batch_id,start_date)
);
CREATE TABLE IF NOT EXISTS class_sessions (
 id INTEGER PRIMARY KEY, batch_id INTEGER NOT NULL REFERENCES batches(id),
 scheduled_start TEXT NOT NULL, scheduled_end TEXT NOT NULL,
 actual_start TEXT, actual_end TEXT,
 status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','ended','cancelled')),
 held_verified INTEGER NOT NULL DEFAULT 0 CHECK(held_verified IN (0,1)),
 actual_teacher_id INTEGER REFERENCES users(id), meeting_url TEXT
);
CREATE TABLE IF NOT EXISTS attendance (
 id INTEGER PRIMARY KEY, class_id INTEGER NOT NULL REFERENCES class_sessions(id),
 enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
 status TEXT NOT NULL CHECK(status IN ('Present','Absent','Late')),
 join_time TEXT, verified_by INTEGER NOT NULL REFERENCES users(id), verified_at TEXT NOT NULL,
 UNIQUE(class_id,enrollment_id)
);
CREATE TABLE IF NOT EXISTS reports (
 id INTEGER PRIMARY KEY, class_id INTEGER NOT NULL UNIQUE REFERENCES class_sessions(id),
 author_id INTEGER NOT NULL REFERENCES users(id),
 body TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft'
 CHECK(status IN ('draft','submitted','returned','approved')),
 first_submitted_at TEXT, current_submitted_at TEXT,
 review_reason TEXT, reviewer_id INTEGER REFERENCES users(id), reviewed_at TEXT,
 revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS report_revisions (
 id INTEGER PRIMARY KEY, report_id INTEGER NOT NULL REFERENCES reports(id),
 revision INTEGER NOT NULL, body TEXT NOT NULL, event TEXT NOT NULL,
 actor_id INTEGER NOT NULL REFERENCES users(id), at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_events (
 id INTEGER PRIMARY KEY, at TEXT NOT NULL, actor_id INTEGER REFERENCES users(id),
 action TEXT NOT NULL, entity TEXT NOT NULL, entity_id INTEGER NOT NULL,
 details TEXT NOT NULL DEFAULT '{}'
);
-- v0.2 additive-only, no existing table or row modification.
CREATE TABLE IF NOT EXISTS report_alert_events (
 id INTEGER PRIMARY KEY,
 class_id INTEGER NOT NULL REFERENCES class_sessions(id),
 due_at TEXT NOT NULL,
 stage TEXT NOT NULL CHECK(stage IN ('teacher','zimmadar','supervisor','management')),
 scheduled_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 target_user_id INTEGER REFERENCES users(id),
 delivery_status TEXT NOT NULL CHECK(delivery_status IN ('in_app_queue','unassigned')),
 UNIQUE(class_id,stage,due_at)
);
CREATE INDEX IF NOT EXISTS idx_report_alerts_class ON report_alert_events(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_batch ON class_sessions(batch_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_students_family ON students(family_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity, entity_id);
'''

def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB_PATH, timeout=10, isolation_level=None)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    c.execute('PRAGMA busy_timeout=8000')
    return c

@contextmanager
def transaction():
    c = connect()
    try:
        c.execute('BEGIN IMMEDIATE')
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()

@contextmanager
def read_connection():
    c=connect()
    try:
        yield c
    finally:
        c.close()

def init_db():
    with read_connection() as c:
        c.executescript(SCHEMA)
