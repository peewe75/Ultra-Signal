import os
import json
import time
import uuid
import threading
import urllib.parse
import urllib.request
import re
from pathlib import Path

APP_NAME = "🚀 SoftiBridge Automation CLIENT"
VERSION = "1.0.2"

# ----------------------------
# Paths
# ----------------------------

def common_files_dir() -> Path:
    # Windows typical
    base = Path(os.environ.get("PUBLIC", r"C:\Users\Public")) / "Documents" / "Common" / "Files"
    return base


def automation_root() -> Path:
    # token + state
    return common_files_dir() / "softibridge_automation"


def softibridge_root() -> Path:
    # EA legacy queues path
    return common_files_dir() / "softibridge"

QUEUE_FILE = softibridge_root() / "inbox" / "cmd_queue.txt"

# ----------------------------
# Signal Receiver Logic
# ----------------------------
def tg_api(method: str, token: str, payload: dict) -> dict:
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urllib.parse.urlencode(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))

def write_cmd(cmd_str: str):
    os.makedirs(os.path.dirname(QUEUE_FILE), exist_ok=True)
    
    # Try to read token to determine where to write
    token_path = automation_root() / "run" / "auth_token.dat"
    write_mt4 = True
    write_mt5 = True
    
    if token_path.exists():
        try:
            tok = json.loads(token_path.read_text(encoding="utf-8"))
            feats = tok.get("payload", {}).get("features", {})
            write_mt4 = feats.get("mt4", True)
            write_mt5 = feats.get("mt5", True)
        except:
            pass
            
    if write_mt4:
        with open(QUEUE_FILE, "a", encoding="utf-8") as f:
            f.write(cmd_str + "\n")
            
    if write_mt5:
        q5 = softibridge_root() / "inbox" / "cmd_queue_mt5.txt"
        with open(q5, "a", encoding="utf-8") as f:
            f.write(cmd_str + "\n")

def parse_signal(text: str) -> str | None:
    text = text.upper()
    side_match = re.search(r"\b(BUY|SELL)\b", text)
    if not side_match: return None
    side = side_match.group(1)
    
    sym_match = re.search(r"(?:BUY|SELL)\s+([A-Z0-9/]+)", text)
    symbol = sym_match.group(1) if sym_match else "CHART"
    if symbol == "GOLD": symbol = "XAUUSD"
    
    entry_match = re.search(r"(?:@|AT|ENTRY|LIMIT)\s*([\d.]+)", text)
    entry = entry_match.group(1) if entry_match else None
    
    sl_match = re.search(r"SL\s*([\d.]+)", text)
    sl_price = sl_match.group(1) if sl_match else None
    
    tp_matches = re.finditer(r"TP\d?\s*([\d.]+)", text)
    tps = [m.group(1) for m in tp_matches]
    
    if not (entry and sl_price and tps):
        return None
        
    sig_id = int(time.time() * 1000)
    tp1 = tps[0]
    tp2 = tps[1] if len(tps) > 1 else "0"
    tp3 = tps[2] if len(tps) > 2 else "0"
    
    cmd = f"id={sig_id};mode=PRICE;symbol={symbol};side={side};entry_lo={entry};entry_hi={entry};sl_price={sl_price};tp1_price={tp1};tp2_price={tp2};tp3_price={tp3}"
    return cmd

def start_signal_receiver(signal_bot_token: str):
    def run_receiver():
        offset = 0
        while True:
            try:
                res = tg_api("getUpdates", signal_bot_token, {"timeout": "25", "offset": str(offset)})
                if not res.get("ok"):
                    time.sleep(2); continue
                    
                for upd in res.get("result", []):
                    offset = max(offset, upd["update_id"] + 1)
                    msg = upd.get("message") or upd.get("edited_message")
                    if not msg: continue
                    text = msg.get("text", "")
                    if not text: continue
                    
                    cmd = parse_signal(text)
                    if cmd:
                        print(f"\n[SEGNALE RICEVUTO e SALVATO] {text[:50]}...")
                        write_cmd(cmd)
            except Exception:
                time.sleep(2)
                
    t = threading.Thread(target=run_receiver, daemon=True)
    t.start()

def ensure_dirs(features: dict):
    # automation
    aroot = automation_root()
    (aroot / "run").mkdir(parents=True, exist_ok=True)
    (aroot / "cfg").mkdir(parents=True, exist_ok=True)
    (aroot / "log").mkdir(parents=True, exist_ok=True)

    # legacy queues
    sroot = softibridge_root()
    (sroot / "inbox").mkdir(parents=True, exist_ok=True)
    (sroot / "state").mkdir(parents=True, exist_ok=True)

    if features.get("mt4", True):
        (sroot / "inbox" / "cmd_queue.txt").touch(exist_ok=True)
    if features.get("mt5", True):
        (sroot / "inbox" / "cmd_queue_mt5.txt").touch(exist_ok=True)


# ----------------------------
# Install ID
# ----------------------------

def get_machine_guid_windows():
    try:
        import winreg

        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Cryptography")
        val, _ = winreg.QueryValueEx(key, "MachineGuid")
        return str(val)
    except Exception:
        return None


def compute_install_id() -> str:
    mg = get_machine_guid_windows()
    host = os.environ.get("COMPUTERNAME", "HOST")
    mac = uuid.getnode()
    raw = f"{mg or ''}|{host}|{mac}"
    import hashlib

    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12].upper()


def write_install_id() -> str:
    iid = compute_install_id()
    p = automation_root() / "run" / "install_id.txt"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(iid, encoding="utf-8")
    return iid


# ----------------------------
# UI helpers
# ----------------------------

def banner():
    os.system("cls" if os.name == "nt" else "clear")
    print("=" * 64)
    print(f"{APP_NAME}  v{VERSION}")
    print("=" * 64)


def menu() -> str:
    banner()
    print("1️⃣  Importa Token (auth_token.dat) 🔐")
    print("2️⃣  Stato Licenza 📄")
    print("3️⃣  Mostra INSTALL_ID 🖥️")
    print("4️⃣  Cambio VPS 🔁 (mostra comando per ADMIN)")
    print("5️⃣  Apri cartella Common Files 📂")
    print("6️⃣  Esci ❌")
    return input("Seleziona > ").strip()


def pick_file_dialog(title: str):
    # Optional file picker for console app.
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        path = filedialog.askopenfilename(title=title)
        root.destroy()
        return path
    except Exception:
        return ""


# ----------------------------
# Commands
# ----------------------------

def cmd_import_token():
    iid = write_install_id()
    print(f"🖥️ INSTALL_ID (questa VPS): {iid}")

    path = pick_file_dialog("Seleziona auth_token.dat")
    if not path:
        path = input("Percorso file auth_token.dat (incolla qui): ").strip().strip('"')

    if not path or not os.path.exists(path):
        print("❌ File non trovato.")
        return

    try:
        token_obj = json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        print("❌ Token non leggibile (JSON).")
        return

    payload = token_obj.get("payload") if isinstance(token_obj, dict) else None
    if not isinstance(payload, dict):
        print("❌ Token formato non valido (manca payload).")
        return

    features = payload.get("features") or {"mt4": True, "mt5": True}
    token_install = str(payload.get("install_id", ""))
    exp = payload.get("exp") or payload.get("expires_at_utc") or payload.get("expires_at")

    print("\n📄 Token trovato:")
    print(f"• Piano: {payload.get('plan', '?')}")
    print(f"• MT4: {'✅' if features.get('mt4', True) else '❌'}   MT5: {'✅' if features.get('mt5', True) else '❌'}")
    print(f"• Scadenza: {exp}")

    if token_install and token_install != iid:
        print("\n⚠️ ATTENZIONE: questo token è legato a un'altra VPS!")
        print("Se lo importi qui, l'EA potrebbe BLOCCARSI (install_id mismatch).")

    ans = input("\nVuoi sovrascrivere il token attuale? (S/N): ").strip().lower()
    if ans not in ("s", "si", "y", "yes"):
        print("❌ Operazione annullata.")
        return

    ensure_dirs(features)
    dest = automation_root() / "run" / "auth_token.dat"

    # backup
    if dest.exists():
        bak = automation_root() / "run" / f"auth_token_backup_{int(time.time())}.dat"
        try:
            bak.write_text(dest.read_text(encoding="utf-8"), encoding="utf-8")
        except Exception:
            pass

    dest.write_text(json.dumps(token_obj, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ Token installato in: {dest}")
    print(f"✅ Queue abilitate: MT4={features.get('mt4', True)} MT5={features.get('mt5', True)}")


def cmd_status():
    token_path = automation_root() / "run" / "auth_token.dat"
    if not token_path.exists():
        print("❌ Nessun token trovato (auth_token.dat).")
        return

    try:
        token_obj = json.loads(token_path.read_text(encoding="utf-8"))
        payload = token_obj.get("payload", {})
    except Exception:
        print("❌ Token corrotto/non leggibile.")
        return

    feats = payload.get("features", {})
    exp = payload.get("exp") or payload.get("expires_at_utc")

    print("\n📄 STATO LICENZA")
    print(f"🔑 License Key: {payload.get('license_key', '-')}")
    print(f"📦 Piano: {payload.get('plan', '-')}")
    print(f"📅 Scadenza: {exp}")
    print(f"🖥️ Install_ID token: {payload.get('install_id', '-')}")
    print(f"⚙️ Features: MT4={feats.get('mt4', True)} MT5={feats.get('mt5', True)}")


def cmd_show_install():
    iid = write_install_id()
    print(f"🖥️ INSTALL_ID: {iid}")


def cmd_change_vps_instructions():
    lk = input("🔑 License Key (SB-...): ").strip()
    sku = input("🧩 SKU (MT4_ONLY / MT5_ONLY / MT4_MT5) [default MT4_MT5]: ").strip().upper() or "MT4_MT5"
    iid = write_install_id()
    print("\n📩 Invia questo comando al BOT ADMIN:\n")
    print(f"/sync {lk} {iid} {sku}\n")
    print("✅ Quando ricevi il file auth_token.dat: fai 1️⃣ Importa Token sulla NUOVA VPS.")
    print("⛔ Per bloccare la VPS vecchia SENZA 2 file: importa LO STESSO auth_token.dat anche sulla VPS vecchia.")


def cmd_open_common():
    p = common_files_dir()
    print(f"📂 Common Files: {p}")
    try:
        os.startfile(str(p))
    except Exception:
        pass


def main():
    # Try to load existing token and start receiver silently if valid
    token_path = automation_root() / "run" / "auth_token.dat"
    signal_started = False
    
    if token_path.exists():
        try:
            tok = json.loads(token_path.read_text(encoding="utf-8"))
            pay = tok.get("payload", {})
            signal_token = pay.get("signal_bot_token")
            if signal_token:
                start_signal_receiver(signal_token)
                signal_started = True
                print("✅ Ricevitore Segnali in background AVVIATO.")
        except Exception:
            pass
            
    while True:
        c = menu()
        if c == "1":
            cmd_import_token()
            # If they just imported, restart the loop to grab the new token
            if not signal_started:
                try:
                    tok = json.loads(token_path.read_text(encoding="utf-8"))
                    pay = tok.get("payload", {})
                    signal_token = pay.get("signal_bot_token")
                    if signal_token:
                        start_signal_receiver(signal_token)
                        signal_started = True
                        print("\n✅ Ricevitore Segnali in background AVVIATO.")
                except Exception:
                    pass
        elif c == "2":
            cmd_status()
        elif c == "3":
            cmd_show_install()
        elif c == "4":
            cmd_change_vps_instructions()
        elif c == "5":
            cmd_open_common()
        elif c == "6":
            break
        else:
            print("Scelta non valida.")

        input("\nInvio per continuare...")


if __name__ == "__main__":
    main()
