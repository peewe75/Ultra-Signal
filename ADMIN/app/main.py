\
import os, time
from datetime import datetime, timezone
from db import init_db, get_license, upsert_license, list_licenses
from license_core import make_key
from history import save_license_history
from plans import limits_for_plan, valid_plans

STOP_FLAG = os.path.join("data", "stop.flag")
PRODUCT="SOFTIBRIDGE_LITEB"
VERSION=2

CSI="\x1b["
def _enable_vt_windows():
    if os.name!="nt": return
    try:
        import ctypes
        k=ctypes.windll.kernel32; h=k.GetStdHandle(-11)
        mode=ctypes.c_uint32()
        if k.GetConsoleMode(h, ctypes.byref(mode)):
            mode.value |= 0x0004
            k.SetConsoleMode(h, mode)
    except Exception:
        pass

def c(r,g,b): return f"{CSI}38;2;{r};{g};{b}m"
RESET=f"{CSI}0m"
CY=c(120,205,230); GR=c(120,230,150); YL=c(235,205,120); WH=c(235,235,235); DIM=c(155,165,175)

def now_ts(): return int(time.time())
def date_utc(ts:int): return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")

def header():
    os.system("cls" if os.name=="nt" else "clear")
    print(CY+"╔══════════════════════════════════════════════════════════════╗"+RESET)
    print(CY+"║"+RESET+WH+"                         SOFTI BRIDGE                         "+RESET+CY+"║"+RESET)
    print(CY+"║"+RESET+WH+"                              ADMIN                           "+RESET+CY+"║"+RESET)
    print(CY+"╠══════════════════════════════════════════════════════════════╣"+RESET)
    print(CY+"║"+RESET+WH+"  [1] Create    [2] Renew      [3] Add Account  [4] Revoke    "+RESET+CY+"║"+RESET)
    print(CY+"║"+RESET+WH+"  [5] View      [6] Exit       [7] Upgrade Plan [8] Suspend   "+RESET+CY+"║"+RESET)
    print(CY+"║"+RESET+WH+"  [9] Unsuspend                                               "+RESET+CY+"║"+RESET)
    print(CY+"╚══════════════════════════════════════════════════════════════╝"+RESET)
    print(DIM+"Rules: CREATE bloccato se ACTIVE; RENEW/ADD/UPGRADE bloccati se REVOKED"+RESET)
    print()

def make_payload(tid:int, plan:str, exp:int, groups_limit:int, accounts_limit:int, accounts:list[str]):
    return {
        "v": VERSION,
        "product": PRODUCT,
        "telegram_id": tid,
        "plan": plan.upper(),
        "groups_limit": groups_limit,
        "accounts_limit": accounts_limit,
        "allowed_accounts": accounts or [],
        "iat": now_ts(),
        "exp": exp
    }

def send_license_via_tg(tid:int, key:str, plan:str, exp:int, action_desc:str):
    try:
        from telegram_tools import tg_send, load_cfg
        cfg = load_cfg()
        token = cfg.get("bot_token", "")
        if token and not token.startswith("PASTE_"):
            msg = f"✅ <b>SoftiBridge {action_desc}</b>\n\n<b>Piano:</b> {plan}\n<b>Scadenza:</b> {date_utc(exp)}\n\n<b>La tua License Key:</b>\n<code>{key}</code>\n\nPuoi ora utilizzare i comandi /sync o /change_vps con questa chiave."
            tg_send(token, tid, msg)
            print(f"✅ Messaggio Telegram inviato all'utente {tid}.")
    except Exception as e:
        print(f"⚠️ Impossibile inviare Telegram: {e}")

def create_license():
    tid=int(input("Telegram ID: ").strip())
    existing=get_license(tid)
    if existing and existing["status"]=="ACTIVE":
        print("❌ Esiste già licenza ACTIVE. Usa Renew o Upgrade.")
        return
    plan=input("Plan (BASIC/PRO/ENTERPRISE): ").strip().upper()
    if plan not in valid_plans():
        print("❌ Piano non valido.")
        return
    days=int(input("Days (30/90/180/365): ").strip())
    g_lim,a_lim=limits_for_plan(plan)
    acc_raw=input("MT Accounts (comma) [vuoto=aggiungi dopo]: ").strip()
    accounts=[a.strip() for a in acc_raw.split(",") if a.strip()]
    if len(accounts)>a_lim:
        print(f"❌ Troppi account: max {a_lim} per piano {plan}.")
        return
    exp=now_ts()+days*86400
    payload=make_payload(tid, plan, exp, g_lim, a_lim, accounts)
    key=make_key(payload)
    upsert_license({"telegram_id":tid,"plan":plan,"groups_limit":g_lim,"accounts_limit":a_lim,"allowed_accounts":accounts,
                    "iat":payload["iat"],"exp":payload["exp"],"status":"ACTIVE"})
    saved=save_license_history(tid, payload, key, "create")
    print("\n"+GR+"✅ LICENSE KEY:"+RESET+"\n")
    print(key)
    print(f"\nExpiry: {YL}{date_utc(payload['exp'])}{RESET}")
    print(f"Accounts: {len(accounts)}/{a_lim}")
    print(f"Saved  : {saved}\n")

    send_license_via_tg(tid, key, plan, payload['exp'], "Licenza Creata")

def renew_license():
    tid=int(input("Telegram ID: ").strip())
    lic=get_license(tid)
    if not lic:
        print("❌ Nessuna licenza trovata.")
        return
    if lic["status"]=="REVOKED":
        print("❌ Licenza REVOKED. Operazione bloccata.")
        return
    days=int(input("Renew days (30/90/180/365): ").strip())
    exp=now_ts()+days*86400
    payload=make_payload(tid, lic["plan"], exp, lic["groups_limit"], lic["accounts_limit"], lic["allowed_accounts"] or [])
    key=make_key(payload)
    upsert_license({"telegram_id":tid,"plan":lic["plan"],"groups_limit":lic["groups_limit"],"accounts_limit":lic["accounts_limit"],
                    "allowed_accounts":lic["allowed_accounts"] or [],"iat":payload["iat"],"exp":payload["exp"],"status":"ACTIVE"})
    saved=save_license_history(tid, payload, key, "renew")
    print("\n"+GR+"✅ NEW LICENSE KEY:"+RESET+"\n")
    print(key)
    print(f"\nNew Expiry: {YL}{date_utc(payload['exp'])}{RESET}")
    print(f"Saved     : {saved}\n")
    send_license_via_tg(tid, key, lic["plan"], payload['exp'], "Rinnovo Licenza")

def add_account():
    tid=int(input("Telegram ID: ").strip())
    lic=get_license(tid)
    if not lic:
        print("❌ Nessuna licenza trovata.")
        return
    if lic["status"]=="REVOKED":
        print("❌ Licenza REVOKED. Operazione bloccata.")
        return
    acc=input("New MT account number: ").strip()
    if not acc.isdigit():
        print("❌ Account non valido.")
        return
    accounts=lic["allowed_accounts"] or []
    if acc in accounts:
        print("ℹ️ Account già presente.")
        return
    if len(accounts)>=int(lic["accounts_limit"]):
        print(f"❌ Limite account raggiunto: {len(accounts)}/{lic['accounts_limit']}")
        return
    accounts.append(acc)
    payload=make_payload(tid, lic["plan"], lic["exp"], lic["groups_limit"], lic["accounts_limit"], accounts)
    key=make_key(payload)
    upsert_license({"telegram_id":tid,"plan":lic["plan"],"groups_limit":lic["groups_limit"],"accounts_limit":lic["accounts_limit"],
                    "allowed_accounts":accounts,"iat":payload["iat"],"exp":lic["exp"],"status":lic["status"]})
    saved=save_license_history(tid, payload, key, "add_account")
    print("\n"+GR+"✅ UPDATED LICENSE KEY:"+RESET+"\n")
    print(key)
    print(f"\nExpiry unchanged: {YL}{date_utc(lic['exp'])}{RESET}")
    print(f"Accounts: {len(accounts)}/{lic['accounts_limit']}")
    print(f"Saved  : {saved}\n")
    send_license_via_tg(tid, key, lic["plan"], lic['exp'], "Aggiunta Account MT")

def revoke():
    tid=int(input("Telegram ID: ").strip())
    lic=get_license(tid)
    if not lic:
        print("❌ Nessuna licenza trovata.")
        return
    lic["status"]="REVOKED"
    upsert_license(lic)
    payload=make_payload(tid, lic["plan"], lic["exp"], lic["groups_limit"], lic["accounts_limit"], lic["allowed_accounts"] or [])
    saved=save_license_history(tid, payload, "N/A (REVOKED)", "revoke")
    print(GR+"✅ Licenza revocata (REVOKED)."+RESET)
    print(f"Saved: {saved}\n")

def suspend():
    tid=int(input("Telegram ID: ").strip())
    lic=get_license(tid)
    if not lic:
        print("❌ Nessuna licenza trovata.")
        return
    lic["status"]="SUSPENDED"
    upsert_license(lic)
    payload=make_payload(tid, lic["plan"], lic["exp"], lic["groups_limit"], lic["accounts_limit"], lic["allowed_accounts"] or [])
    saved=save_license_history(tid, payload, "SUSPENDED", "suspend")
    print(YL+"✅ Licenza sospesa (SUSPENDED)."+RESET)
    print(f"Saved: {saved}\n")

def unsuspend():
    tid=int(input("Telegram ID: ").strip())
    lic=get_license(tid)
    if not lic:
        print("❌ Nessuna licenza trovata.")
        return
    if lic["status"] != "SUSPENDED":
        print("❌ La licenza non è in stato SUSPENDED.")
        return
    lic["status"]="ACTIVE"
    upsert_license(lic)
    payload=make_payload(tid, lic["plan"], lic["exp"], lic["groups_limit"], lic["accounts_limit"], lic["allowed_accounts"] or [])
    key=make_key(payload)
    saved=save_license_history(tid, payload, key, "unsuspend")
    print(GR+"✅ Licenza riattivata (ACTIVE)."+RESET)
    print(f"Saved: {saved}\n")
    send_license_via_tg(tid, key, lic["plan"], lic['exp'], "Riattivazione Licenza")

def upgrade_plan():
    tid=int(input("Telegram ID: ").strip())
    lic=get_license(tid)
    if not lic:
        print("❌ Nessuna licenza trovata.")
        return
    if lic["status"]=="REVOKED":
        print("❌ Licenza REVOKED. Operazione bloccata.")
        return
    new_plan=input("Upgrade to (PRO/ENTERPRISE): ").strip().upper()
    if new_plan not in ("PRO","ENTERPRISE"):
        print("❌ Upgrade valido solo a PRO o ENTERPRISE.")
        return
    order={"BASIC":0,"PRO":1,"ENTERPRISE":2}
    cur=lic["plan"].upper()
    if order.get(new_plan,0) <= order.get(cur,0):
        print("❌ Upgrade deve essere verso un piano superiore.")
        return
    g_lim,a_lim=limits_for_plan(new_plan)
    accounts=lic["allowed_accounts"] or []
    if len(accounts)>a_lim:
        print(f"❌ Il cliente ha {len(accounts)} accounts ma il piano {new_plan} ne consente {a_lim}.")
        return
    payload=make_payload(tid, new_plan, lic["exp"], g_lim, a_lim, accounts)
    key=make_key(payload)
    upsert_license({"telegram_id":tid,"plan":new_plan,"groups_limit":g_lim,"accounts_limit":a_lim,"allowed_accounts":accounts,
                    "iat":payload["iat"],"exp":lic["exp"],"status":lic["status"]})
    saved=save_license_history(tid, payload, key, "upgrade")
    print("\n"+GR+"✅ UPGRADE KEY:"+RESET+"\n")
    print(key)
    print(f"\nPlan: {new_plan} | Expiry: {YL}{date_utc(payload['exp'])}{RESET}")
    print(f"Accounts: {len(accounts)}/{a_lim}")
    print(f"Saved  : {saved}\n")
    send_license_via_tg(tid, key, new_plan, lic['exp'], "Upgrade Piano")

def view():
    rows=list_licenses()
    if not rows:
        print("(nessuna licenza)")
        return
    print(WH+"TelegramID | Plan | Expiry | Status | Accounts | Limits"+RESET)
    print(DIM+"-"*78+RESET)
    for r in rows:
        print(f"{r['telegram_id']} | {r['plan']} | {date_utc(r['exp'])} | {r['status']} | {len(r['accounts'])} | {r['accounts_limit']}")

def main():
    _enable_vt_windows()
    init_db()
    while True:
        if os.path.exists(STOP_FLAG):
            try: os.remove(STOP_FLAG)
            except Exception: pass
            print("\n[STOP] richiesto. Chiusura ADMIN.\n")
            break
        header()
        choice=input("Select > ").strip()
        if choice=="1": create_license()
        elif choice=="2": renew_license()
        elif choice=="3": add_account()
        elif choice=="4": revoke()
        elif choice=="5": view()
        elif choice=="6": break
        elif choice=="7": upgrade_plan()
        elif choice=="8": suspend()
        elif choice=="9": unsuspend()
        else: print("Scelta non valida.")
        input("\nINVIO per continuare...")

if __name__=="__main__":
    main()
