"""Approved, explicitly scoped academic rules; unresolved rules NOT implemented."""
from datetime import datetime, date, time, timedelta
from zoneinfo import ZoneInfo

BD=ZoneInfo('Asia/Dhaka')

def parse_local(value):
    """ISO input local Bangladeshi wall time; system stores as offset-aware ISO string."""
    dt=datetime.fromisoformat(value)
    return (dt.replace(tzinfo=BD) if dt.tzinfo is None else dt.astimezone(BD))

def report_due(actual_start, actual_end):
    """D-34, AM-04/07: returns BD deadline; ambiguous intervals return None."""
    start=parse_local(actual_start)
    end=parse_local(actual_end)
    if end<=start or (end-start)>timedelta(hours=24):
        return None
    if end.date()>start.date():
        # Midnight crossover: only short crossing into early day confidently resolved.
        if end.time()<=time(11,59,59):
            return datetime.combine(end.date(),time(12,0),tzinfo=BD)
        return None
    if end.time()>=time(23,0):
        return datetime.combine(end.date()+timedelta(days=1),time(12,0),tzinfo=BD)
    return datetime.combine(end.date(),time(23,59),tzinfo=BD)

def late_from_join(actual_start, join_time):
    """D-055: >15 minutes late; exactly 15 minutes is Present. Anchor is actual teacher start as a *technical pilot assumption*."""
    start=parse_local(actual_start)
    join=parse_local(join_time)
    return (join-start).total_seconds()>15*60

def correction_cutoff(session_start):
    """AM-16-C1: class BD date +7 days 23:59 (minute-boundary precision pending)."""
    d=parse_local(session_start).date()+timedelta(days=7)
    return datetime.combine(d,time(23,59),tzinfo=BD)

def absence_streak(records):
    """Pure helper for eligible consecutive held attendance; FOLLOWUP_COMPLETION/LEAVE handled by later workflow.

    records chronological with status in {'Present','Late','Absent'} and unauthorized flag.
    Prevents inventing more complex stage-2 algorithm before AFQ-06 resolution.
    """
    count=0
    for r in records:
        if r['status']=='Absent' and r.get('unauthorized',False):
            count+=1
        else:
            count=0
    return count
