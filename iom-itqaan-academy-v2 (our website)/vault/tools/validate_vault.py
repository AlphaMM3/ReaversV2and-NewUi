#!/usr/bin/env python3
"""Vault integrity check: no dependencies; does NOT audit application code."""
from pathlib import Path
import csv, hashlib, re, sys
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'references/IOM-School-Maktab-Reference-v1.0.md'
TRACE=ROOT/'registries/201_DECISION_TRACEABILITY.csv'
REQUIRED=['README.md','ACADEMY_MASTER.md','AGENTS.md','CLAUDE.md','01_DECISIONS.md','DECISION_AMENDMENTS.md','02_PRD.md','03_WORKFLOW_MATRIX.md','04_RBAC.md','05_STATE.md','06_SCHEMA.md','07_INTEGRATION.md','08_STACK.md','09_PLAN.md','10_TESTING_QA.md','11_UI_SCREENS.md','12_TOKENS.md','OPEN_QUESTIONS.md','CHANGELOG.md']
issues=[]
for name in REQUIRED:
 if not (ROOT/name).exists():issues.append('Missing: '+name)
if not SOURCE.exists():issues.append('Missing original source')
else:
 src=SOURCE.read_text(encoding='utf-8')
 section=src.split('## A. Confirmed Decisions — 1–201',1)[1].split('## B. Proposed Enhancements',1)[0]
 source_entries={int(m.group(1)):m.group(2) for l in section.splitlines() if (m:=re.match(r'^\s*(\d{1,3})\.\s+(.*\S)\s*$',l))}
 if sorted(source_entries)!=list(range(1,202)):issues.append('Original source decision ID coverage invalid')
 expected_hash=re.search(r'`SHA256: ([a-f0-9]{64})`',(ROOT/'README.md').read_text(encoding='utf-8'))
 if expected_hash and hashlib.sha256(SOURCE.read_bytes()).hexdigest()!=expected_hash.group(1):issues.append('Source SHA256 mismatch: original reference altered')
 if TRACE.exists():
  with TRACE.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
  if len(rows)!=201:issues.append(f'Traceability row count must be 201, got {len(rows)}')
  ids=[r['decision_id'] for r in rows]
  if ids != [f'D-{i:03d}' for i in range(1,202)]:issues.append('Traceability decision IDs missing/duplicate/reordered')
  for row in rows:
   k=int(row['decision_id'][2:])
   if source_entries.get(k)!=row['source_text_verbatim']:issues.append('Modified source text in '+row['decision_id'])
 else:issues.append('Missing traceability CSV')
print('Vault structure/source/traceability:', 'PASS' if not issues else 'FAIL')
for issue in issues:print(' -',issue)
print('Note: this validator does not test code, permissions, business rule correctness, implementation or security.')
sys.exit(1 if issues else 0)
