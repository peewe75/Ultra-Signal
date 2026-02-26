\
import json, os, time, urllib.parse, urllib.request, uuid
from typing import Optional

from db import init_db, count_active_installs, get_install, upsert_install_active, disable_install, list_licenses, upsert_license
from history import save_license_history
from license_core import verify_key, decode_payload
from token_core import make_sync_code  # kept for backward compatibility (unused)

CONFIG_PATH=os.path.join("..","config","config.json")

def load_cfg():
    with open(CONFIG_PATH,"r",encoding="utf-8") as f:
        return json.load(f)

def tg_api(method:str, token:str, payload:dict)->dict:
    url=f"https://api.telegram.org/bot{token}/{method}"
    data=urllib.parse.urlencode(payload).encode("utf-8")
    req=urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))

def send(chat_id:int, text:str, token:str):
    return tg_api("sendMessage", token, {"chat_id": str(chat_id), "text": text, "disable_web_page_preview":"true"})

def send_document(chat_id:int, token:str, file_path:str, caption:str=""):
    """Send a file via Telegram sendDocument without external dependencies."""
    url = f"https://api.telegram.org/bot{token}/sendDocument"
    boundary = "----SB" + uuid.uuid4().hex

    def _part(name: str, value: str) -> bytes:
        return (
            f"--{boundary}\r\n"
            f"Content-Disposition: form-data; name=\"{name}\"\r\n\r\n"
            f"{value}\r\n"
        ).encode("utf-8")

    filename = os.path.basename(file_path)
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    body = b"".join([
        _part("chat_id", str(chat_id)),
        _part("caption", caption),
        (
            f"--{boundary}\r\n"
            f"Content-Disposition: form-data; name=\"document\"; filename=\"{filename}\"\r\n"
            f"Content-Type: application/octet-stream\r\n\r\n"
        ).encode("utf-8"),
        file_bytes,
        b"\r\n",
        f"--{boundary}--\r\n".encode("utf-8"),
    ])

    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))

def now_ts()->int:
    return int(time.time())

def is_expired(payload:dict)->bool:
    exp = int(payload.get("exp", 0))
    return now_ts() > exp

def sku_to_features(sku:Optional[str])->dict:
    sku=(sku or "").upper()
    if sku in ("MT4","MT4_ONLY","MT4-ONLY"):
        return {"mt4": True, "mt5": False}
    if sku in ("MT5","MT5_ONLY","MT5-ONLY"):
        return {"mt4": False, "mt5": True}
    return {"mt4": True, "mt5": True}  # MT4+MT5 default

def handle_sync(chat_id:int, license_key:str, install_id:str, sku:Optional[str], token:str):
    if not verify_key(license_key):
        send(chat_id, "❌ License Key non valido.", token); return
    lic = decode_payload(license_key)
    if is_expired(lic):
        send(chat_id, "❌ Licenza scaduta. Contatta supporto per rinnovo.", token); return

    allowed_installs = int(lic.get("groups_limit", 1))
    # idempotent: if install already active, allow
    existing = get_install(license_key, install_id)
    if existing and existing.get("status") == "ACTIVE":
        pass
    else:
        active = count_active_installs(license_key)
        if active >= allowed_installs:
            send(chat_id, f"❌ Quota installazioni raggiunta: {active}/{allowed_installs}. Usa Cambio VPS o upgrade piano.", token); return
        upsert_install_active(license_key, install_id)

    features = sku_to_features(sku)
    cfg = load_cfg()
    signal_bot_token = cfg.get("signal_bot_token", token)

    auth_payload = {
        "v": 1,
        "type": "auth_token",
        "license_key": license_key,
        "install_id": install_id,
        "plan": lic.get("plan","BASIC"),
        "allowed_installs": allowed_installs,
        "accounts_limit": int(lic.get("accounts_limit", 1)),
        "features": features,
        "status": lic.get("status", "ACTIVE"),
        "iat": now_ts(),
        "exp": int(lic.get("exp", 0)),
        "signal_bot_token": signal_bot_token
    }
    # Token delivery as a FILE (auth_token.dat)
    tmp_dir = os.path.join("data", "tmp")
    os.makedirs(tmp_dir, exist_ok=True)
    token_path = os.path.join(tmp_dir, f"auth_token_{install_id}.dat")
    with open(token_path, "w", encoding="utf-8") as f:
        json.dump({"payload": auth_payload, "sig": "x"}, f, ensure_ascii=False, indent=2)

    caption = (
        "✅ Token generato.\n"
        "Apri il CLIENT sulla VPS e fai: 1️⃣ Importa Token → SÌ\n"
        "ℹ️ Per disattivare la VPS vecchia, importa lo stesso file anche lì." 
    )
    send_document(chat_id, token, token_path, caption=caption)

def handle_change_vps(chat_id:int, license_key:str, old_install_id:str, new_install_id:str, sku:Optional[str], token:str):
    if not verify_key(license_key):
        send(chat_id, "❌ License Key non valido.", token); return
    lic = decode_payload(license_key)
    if is_expired(lic):
        send(chat_id, "❌ Licenza scaduta. Contatta supporto per rinnovo.", token); return

    # Disable old if exists
    disable_install(license_key, old_install_id)

    # Proceed with sync for new
    handle_sync(chat_id, license_key, new_install_id, sku, token)

def handle_kill_all(chat_id:int, token:str):
    send(chat_id, "⚠️ INIZIO PROCEDURA KILL_ALL GLOBALE...", token)
    rows = list_licenses()
    count = 0
    for r in rows:
        if r["status"] in ("ACTIVE", "EXPIRED"):
            r["status"] = "SUSPENDED"
            upsert_license(r)
            save_license_history(r["telegram_id"], r, "SUSPENDED_VIA_KILLALL", "kill_all")
            count += 1
    send(chat_id, f"✅ KILL_ALL completato. Sospesi {count} account.", token)

def parse_cmd(text:str):
    # /sync <license_key> <install_id> [MT4_ONLY|MT5_ONLY|MT4_MT5]
    parts = (text or "").strip().split()
    if not parts: return None
    cmd = parts[0].lower()
    return cmd, parts[1:]

def run():
    cfg=load_cfg()
    bot_token=cfg.get("bot_token","")
    if not bot_token or bot_token.startswith("PASTE_"):
        raise SystemExit("Imposta bot_token in config.json")

    init_db()
    offset = 0
    print("SoftiBridge Automation ADMIN BOT running (long polling)...")

    while True:
        try:
            res = tg_api("getUpdates", bot_token, {"timeout":"25","offset":str(offset)})
            if not res.get("ok"):
                time.sleep(2); continue
            for upd in res.get("result", []):
                offset = max(offset, upd["update_id"] + 1)

                msg = upd.get("message") or upd.get("edited_message")
                if not msg: 
                    continue
                chat = msg.get("chat", {})
                chat_id = chat.get("id")
                admin_id = cfg.get("admin_chat_id")

                if admin_id and chat_id != admin_id:
                    # Optional: log unauthorized access attempt
                    continue

                text = msg.get("text","") or ""
                if not text:
                    continue

                if text.startswith("/start"):
                    send(chat_id,
                         "🤖 SOFTIBRIDGE AUTOMATION ADMIN\n\n"
                         "Comandi:\n"
                         "• /sync <LICENSE_KEY> <INSTALL_ID> [MT4_ONLY|MT5_ONLY|MT4_MT5]\n"
                         "• /change_vps <LICENSE_KEY> <OLD_INSTALL_ID> <NEW_INSTALL_ID> [SKU]\n"
                         "• /kill_all (Sospende TUTTI gli account attivi)\n",
                         bot_token)
                    continue

                parsed = parse_cmd(text)
                if not parsed:
                    continue
                cmd, args = parsed

                if cmd == "/sync":
                    if len(args) < 2:
                        send(chat_id,"Uso: /sync <LICENSE_KEY> <INSTALL_ID> [SKU]", bot_token); continue
                    license_key=args[0]; install_id=args[1]; sku=args[2] if len(args)>=3 else None
                    handle_sync(chat_id, license_key, install_id, sku, bot_token)
                elif cmd == "/change_vps":
                    if len(args) < 3:
                        send(chat_id,"Uso: /change_vps <LICENSE_KEY> <OLD_INSTALL_ID> <NEW_INSTALL_ID> [SKU]", bot_token); continue
                    license_key=args[0]; old_id=args[1]; new_id=args[2]; sku=args[3] if len(args)>=4 else None
                    handle_change_vps(chat_id, license_key, old_id, new_id, sku, bot_token)
                elif cmd == "/kill_all":
                    handle_kill_all(chat_id, bot_token)
                else:
                    send(chat_id,"Comando non riconosciuto. Usa /start.", bot_token)

        except Exception as e:
            # keep alive
            time.sleep(2)

if __name__=="__main__":
    run()
