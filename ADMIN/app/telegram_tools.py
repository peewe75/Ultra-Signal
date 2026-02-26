\
import json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

from db import init_db, get_license, list_licenses, upsert_license
from license_core import make_key
from history import save_license_history
from plans import limits_for_plan, valid_plans

CONFIG_PATH=os.path.join("..", "config", "config.json")
TEMPLATES_PATH=os.path.join("..", "config", "templates.json")
PRODUCT="SOFTIBRIDGE_LITEB"
VERSION=2

def load_json(path):
    with open(path,"r",encoding="utf-8") as f:
        return json.load(f)

def load_cfg():
    if not os.path.exists(CONFIG_PATH):
        raise SystemExit("Missing config.json")
    return load_json(CONFIG_PATH)

def load_tpl():
    if not os.path.exists(TEMPLATES_PATH):
        raise SystemExit("Missing templates.json")
    return load_json(TEMPLATES_PATH)

def tg_send(bot_token, chat_id, text):
    url=f"https://api.telegram.org/bot{bot_token}/sendMessage"
    data=urllib.parse.urlencode({
        "chat_id": str(chat_id),
        "text": text,
        "disable_web_page_preview": "true"
    }).encode("utf-8")
    req=urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", errors="ignore")

def date_utc(ts:int)->str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")

def now_ts()->int:
    return int(time.time())

def make_payload(tid, plan, exp, groups_limit, accounts_limit, accounts):
    return {
        "v": VERSION,
        "product": PRODUCT,
        "telegram_id": int(tid),
        "plan": plan.upper(),
        "groups_limit": int(groups_limit),
        "accounts_limit": int(accounts_limit),
        "allowed_accounts": accounts or [],
        "iat": now_ts(),
        "exp": int(exp)
    }

def cmd_send_key():
    cfg=load_cfg()
    tpl=load_tpl()
    token=cfg.get("bot_token","")
    if not token or token.startswith("PASTE_"):
        print("[ERR] Imposta bot_token in config.json")
        return 1

    init_db()

    tid_s=input("Telegram ID cliente: ").strip()
    if not tid_s.isdigit():
        print("[ERR] Telegram ID non valido.")
        return 2
    tid=int(tid_s)

    action=input("Azione (create/renew/add_account/upgrade): ").strip().lower()
    if action not in ("create","renew","add_account","upgrade"):
        print("[ERR] Azione non valida.")
        return 3

    lic=get_license(tid)

    # RULES
    if action=="create" and lic and lic["status"]=="ACTIVE":
        print("[ERR] Esiste già una licenza ACTIVE. Usa RENEW o UPGRADE.")
        return 4
    if action in ("renew","add_account","upgrade") and not lic:
        print("[ERR] Nessuna licenza trovata. Usa CREATE.")
        return 5
    if action in ("renew","add_account","upgrade") and lic and lic["status"]=="REVOKED":
        print("[ERR] Licenza REVOKED. Operazione bloccata.")
        return 6

    saved_path=None
    key=None
    payload=None
    msg=None

    if action=="create":
        plan=input("Plan (BASIC/PRO/ENTERPRISE): ").strip().upper()
        if plan not in valid_plans():
            print("[ERR] Piano non valido.")
            return 7
        days=int(input("Days (30/90/180/365): ").strip())
        g_lim,a_lim=limits_for_plan(plan)
        acc_raw=input("MT Accounts (comma) [vuoto=aggiungi dopo]: ").strip()
        accounts=[a.strip() for a in acc_raw.split(",") if a.strip()]
        if len(accounts)>a_lim:
            print(f"[ERR] Troppi account: max {a_lim} per {plan}.")
            return 8
        exp=now_ts()+days*86400
        payload=make_payload(tid, plan, exp, g_lim, a_lim, accounts)
        key=make_key(payload)
        upsert_license({
            "telegram_id": tid,
            "plan": plan,
            "groups_limit": g_lim,
            "accounts_limit": a_lim,
            "allowed_accounts": accounts,
            "iat": payload["iat"],
            "exp": payload["exp"],
            "status": "ACTIVE"
        })
        saved_path=save_license_history(tid, payload, key, "create")
        msg=tpl["license_sent_it"].format(
            brand=cfg.get("brand","SOFTI BRIDGE"),
            key=key,
            plan=payload["plan"],
            expiry=date_utc(payload["exp"]),
            accounts_used=len(accounts),
            accounts_limit=a_lim,
            support=cfg.get("support_contact","@softisupport")
        )

    elif action=="renew":
        days=int(input("Renew days (30/90/180/365): ").strip())
        exp=now_ts()+days*86400
        plan=lic["plan"]
        g_lim=lic["groups_limit"]
        a_lim=lic["accounts_limit"]
        accounts=lic["allowed_accounts"] or []
        payload=make_payload(tid, plan, exp, g_lim, a_lim, accounts)
        key=make_key(payload)
        upsert_license({
            "telegram_id": tid,
            "plan": plan,
            "groups_limit": g_lim,
            "accounts_limit": a_lim,
            "allowed_accounts": accounts,
            "iat": payload["iat"],
            "exp": payload["exp"],
            "status": "ACTIVE"
        })
        saved_path=save_license_history(tid, payload, key, "renew")
        msg=tpl["license_sent_it"].format(
            brand=cfg.get("brand","SOFTI BRIDGE"),
            key=key,
            plan=payload["plan"],
            expiry=date_utc(payload["exp"]),
            accounts_used=len(accounts),
            accounts_limit=a_lim,
            support=cfg.get("support_contact","@softisupport")
        )

    elif action=="add_account":
        new_acc=input("New MT account number: ").strip()
        if not new_acc.isdigit():
            print("[ERR] account non valido")
            return 9
        plan=lic["plan"]
        g_lim=lic["groups_limit"]
        a_lim=lic["accounts_limit"]
        accounts=lic["allowed_accounts"] or []
        if new_acc not in accounts:
            if len(accounts)>=a_lim:
                print(f"[ERR] Limite account raggiunto: {len(accounts)}/{a_lim}")
                return 10
            accounts.append(new_acc)
        payload=make_payload(tid, plan, lic["exp"], g_lim, a_lim, accounts)
        key=make_key(payload)
        upsert_license({
            "telegram_id": tid,
            "plan": plan,
            "groups_limit": g_lim,
            "accounts_limit": a_lim,
            "allowed_accounts": accounts,
            "iat": payload["iat"],
            "exp": lic["exp"],
            "status": lic["status"]
        })
        saved_path=save_license_history(tid, payload, key, "add_account")
        msg=tpl["license_sent_it"].format(
            brand=cfg.get("brand","SOFTI BRIDGE"),
            key=key,
            plan=payload["plan"],
            expiry=date_utc(payload["exp"]),
            accounts_used=len(accounts),
            accounts_limit=a_lim,
            support=cfg.get("support_contact","@softisupport")
        )

    else:  # upgrade
        new_plan=input("Upgrade to (PRO/ENTERPRISE): ").strip().upper()
        if new_plan not in ("PRO","ENTERPRISE"):
            print("[ERR] Upgrade valido solo a PRO o ENTERPRISE.")
            return 11
        order={"BASIC":0,"PRO":1,"ENTERPRISE":2}
        cur=lic["plan"].upper()
        if order.get(new_plan,0) <= order.get(cur,0):
            print("[ERR] Upgrade deve essere verso un piano superiore.")
            return 12
        g_lim,a_lim=limits_for_plan(new_plan)
        accounts=lic["allowed_accounts"] or []
        if len(accounts)>a_lim:
            print(f"[ERR] Il cliente ha {len(accounts)} accounts ma {new_plan} ne consente {a_lim}.")
            return 13
        payload=make_payload(tid, new_plan, lic["exp"], g_lim, a_lim, accounts)
        key=make_key(payload)
        upsert_license({
            "telegram_id": tid,
            "plan": new_plan,
            "groups_limit": g_lim,
            "accounts_limit": a_lim,
            "allowed_accounts": accounts,
            "iat": payload["iat"],
            "exp": lic["exp"],
            "status": lic["status"]
        })
        saved_path=save_license_history(tid, payload, key, "upgrade")
        msg=tpl["upgrade_sent_it"].format(
            brand=cfg.get("brand","SOFTI BRIDGE"),
            key=key,
            plan=new_plan,
            expiry=date_utc(payload["exp"]),
            accounts_used=len(accounts),
            accounts_limit=a_lim,
            support=cfg.get("support_contact","@softisupport")
        )

    try:
        tg_send(token, tid, msg)
        print("[OK] Inviata.")
        if saved_path:
            print("[OK] Storico salvato:", saved_path)
        return 0
    except Exception as e:
        print("[ERR] Invio fallito:", e)
        print("TIP: il cliente deve aver fatto /start al bot.")
        if saved_path:
            print("[OK] Storico salvato comunque:", saved_path)
        return 20

def days_left(exp:int)->int:
    return (int(exp)-now_ts())//86400

def cmd_remind():
    cfg=load_cfg()
    tpl=load_tpl()
    token=cfg.get("bot_token","")
    if not token or token.startswith("PASTE_"):
        print("[ERR] Imposta bot_token in config.json")
        return 1
    init_db()
    rows=list_licenses()
    sent=0
    for r in rows:
        tid=int(r["telegram_id"])
        exp=int(r["exp"])
        d=days_left(exp)
        plan=r["plan"]
        expiry=date_utc(exp)
        key_name=None
        if d==7: key_name="remind_d7_it"
        elif d==3: key_name="remind_d3_it"
        elif d==0: key_name="remind_d0_it"
        elif d==-3: key_name="remind_m3_it"
        if key_name:
            msg=tpl[key_name].format(plan=plan, expiry=expiry, support=cfg.get("support_contact","@softisupport"))
            try:
                tg_send(token, tid, msg)
                sent+=1
                print(f"[OK] Reminder a {tid} (days={d})")
            except Exception as e:
                print(f"[WARN] Reminder fallito {tid}: {e}")
        lic=get_license(tid)
        if lic and d<0 and lic["status"]=="ACTIVE":
            lic["status"]="EXPIRED"
            upsert_license(lic)
    print(f"Done. Sent={sent}")
    return 0

def main():
    if len(sys.argv)<2:
        print("USO: python telegram_tools.py send_key|remind")
        return 1
    cmd=sys.argv[1].lower().strip()
    if cmd=="send_key":
        return cmd_send_key()
    if cmd=="remind":
        return cmd_remind()
    print("Comando non valido.")
    return 2

if __name__=="__main__":
    raise SystemExit(main())
