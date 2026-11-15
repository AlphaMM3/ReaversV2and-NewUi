"""App-local authentication, CSRF and role/scope helpers."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

SESSION_COOKIE = 'academy_session'
USER_ROLES = {'central_admin','branch_admin','zimmadar','teacher','guardian_primary','guardian_secondary'}
STAFF_ROLES = {'central_admin','branch_admin','zimmadar','teacher'}
ADMIN_ROLES = {'central_admin','branch_admin'}

def utcnow():
    return datetime.now(timezone.utc)

def iso(dt=None):
    return (dt or utcnow()).isoformat(timespec='seconds')

def hash_password(password, salt=None):
    if not salt:
        salt=secrets.token_hex(16)
    if len(password)<12:
        raise ValueError('Passwords must contain at least 12 characters')
    digest=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),400_000).hex()
    return salt,digest

def verify_password(password, salt, password_hash):
    test=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),400_000).hex()
    return hmac.compare_digest(test,password_hash)

def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()

def create_session(c, uid):
    token=secrets.token_urlsafe(36)
    csrf=secrets.token_urlsafe(28)
    c.execute('INSERT INTO auth_sessions(token_hash,user_id,csrf,expires_at) VALUES (?,?,?,?)',
        (token_hash(token),uid,csrf,iso(utcnow()+timedelta(hours=12))))
    return token,csrf

def lookup_session(c, token):
    if not token:
        return None
    return c.execute('''SELECT u.*,s.csrf FROM auth_sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.active=1''',(token_hash(token),iso())).fetchone()

def require_role(user,*roles):
    if user['role'] not in roles:
        raise HTTPException(403,'Permission denied')

def branch_allowed(user, branch_id):
    return user['role']=='central_admin' or (user['role'] not in ('guardian_primary','guardian_secondary') and user['branch_id']==branch_id)

def check_branch(user,branch_id):
    if not branch_allowed(user,branch_id):
        raise HTTPException(403,'Outside your branch scope')
