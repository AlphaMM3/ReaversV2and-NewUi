"""Dedicated loopback-only Academy demo. Never uses a hosting database."""
import json, os, pathlib, socket, subprocess, sys, time, urllib.request, webbrowser
ROOT = pathlib.Path(__file__).resolve().parents[1]
LOCAL = ROOT / 'local'
BIN = pathlib.Path(os.environ.get('ACADEMY_MARIADB_BIN', r'C:\Users\MOHSIN MAHMUD\Documents\Codex\2026-10-19\referenced-chatgpt-conversation-this-is-an\work\mariadb\mariadb-11.4.5-winx64\bin'))
FLAGS = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
def run(args, **kw):
    return subprocess.run(args, cwd=ROOT, check=True, creationflags=FLAGS, **kw)
def listening(port):
    with socket.socket() as s:
        return s.connect_ex(('127.0.0.1', port)) == 0
def identity():
    try:
        with urllib.request.urlopen('http://127.0.0.1:3020/__local__/identity', timeout=2) as r:
            return json.load(r)
    except Exception:
        return None
def main():
    os.chdir(ROOT)
    LOCAL.mkdir(exist_ok=True)
    if sys.argv[1:2] == ['stop']:
        run(['node', 'tools/local-runtime.mjs', 'stop'])
        print('Local Academy stopped. Demo data preserved.')
        return
    if listening(3020):
        config = json.loads((LOCAL / 'config.json').read_text()) if (LOCAL / 'config.json').exists() else {}
        if identity() != {'id': config.get('id')}:
            raise RuntimeError('Port 3020 belongs to another application; refusing to change it.')
    else:
        if not (BIN / 'mariadbd.exe').exists():
            raise RuntimeError('MariaDB missing. Set ACADEMY_MARIADB_BIN to its bin folder.')
        data = LOCAL / 'mysql'
        if not data.exists():
            if listening(33139):
                raise RuntimeError('Port 33139 is already occupied; refusing setup.')
            with (LOCAL / 'database-install.log').open('w') as log:
                run([str(BIN / 'mariadb-install-db.exe'), '--datadir=' + str(data), '--port=33139'], stdout=log, stderr=subprocess.STDOUT)
        if not listening(33139):
            log = (LOCAL / 'database.log').open('a')
            subprocess.Popen([str(BIN / 'mariadbd.exe'), '--no-defaults', '--datadir=' + str(data), '--port=33139', '--bind-address=127.0.0.1', '--console'], cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, creationflags=FLAGS)
            for _ in range(60):
                if listening(33139): break
                time.sleep(.5)
            else: raise RuntimeError('Database did not start. See local/database.log.')
        if not (ROOT / 'node_modules').exists():
            run(['cmd', '/c', 'npm', 'ci'])
        run(['cmd', '/c', 'npm', 'run', 'build'])
        run(['node', 'tools/local-runtime.mjs', 'setup'])
        log = (LOCAL / 'server.log').open('a')
        subprocess.Popen(['node', 'tools/local-runtime.mjs', 'serve'], cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, creationflags=FLAGS)
        for _ in range(60):
            if identity(): break
            time.sleep(.5)
        else: raise RuntimeError('App did not start. See local/server.log.')
    print('Local Academy: http://127.0.0.1:3020')
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        lan_ip = s.getsockname()[0]
        s.close()
        print('Mobile / LAN:  http://' + lan_ip + ':3020')
    except Exception:
        pass
    print('Login details: ' + str(LOCAL / 'LOCAL-LOGIN.txt'))
    if '--no-browser' not in sys.argv: webbrowser.open('http://127.0.0.1:3020')
if __name__ == '__main__':
    try: main()
    except Exception as e:
        print('Local start/stop failed:', str(e))
        sys.exit(1)
