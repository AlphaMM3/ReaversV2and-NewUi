"""Deterministically capture the unchanged Python v0.2 policy, not hand-written expected values."""
from pathlib import Path
from datetime import datetime,timedelta,timezone
import importlib.util,json,random
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('baseline_policy',root/'baseline/python-v0.2/app/policy.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
rng=random.Random(201)
cases=[]
for i in range(220):
    start=datetime(2026,10,25,tzinfo=timezone(timedelta(hours=6)))+timedelta(minutes=rng.randrange(14000))
    end=start+timedelta(minutes=rng.choice([-1,0,15,60,90,720,1440,1441]))
    a,b=start.isoformat(),end.isoformat()
    if i%3==0:a,b=a[:-6],b[:-6]
    elif i%3==1:a,b=start.astimezone(timezone.utc).isoformat(),end.astimezone(timezone.utc).isoformat()
    due=p.report_due(a,b)
    cases.append({'start':a,'end':b,'due':due.isoformat() if due else None,'cutoff':p.correction_cutoff(a).isoformat()})
(root/'tests/fixtures').mkdir(exist_ok=True)
(root/'tests/fixtures/policy-v02.json').write_text(json.dumps(cases,indent=2),encoding='utf-8')
print('Captured',len(cases),'original Python policy cases')
