from pathlib import Path
import hashlib,json,subprocess,sys
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'provenance.json').read_text(encoding='utf-8'))
bad=[name for name,digest in manifest['files'].items() if not (root/name).is_file() or hashlib.sha256((root/name).read_bytes()).hexdigest()!=digest]
if bad:
    print('Baseline mismatch:',bad);sys.exit(1)
print('Baseline SHA256:',len(manifest['files']),'files PASS')
sys.exit(subprocess.run([sys.executable,str(root/'vault/tools/validate_vault.py')]).returncode)
