import os
from datetime import datetime, timezone

LICENSES_DIR = "licenses"

def utc_stamp_compact() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%SZ")

def date_utc(ts:int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")

def save_license_history(telegram_id:int, payload:dict, license_key:str, action:str) -> str:
    client_dir = os.path.join(LICENSES_DIR, str(telegram_id))
    os.makedirs(client_dir, exist_ok=True)
    stamp = utc_stamp_compact()
    fname = f"license_{action}_{stamp}.txt"
    fpath = os.path.join(client_dir, fname)

    accounts = payload.get("allowed_accounts") or []
    accounts_str = ", ".join(accounts) if accounts else "NONE (add later)"
    txt = [
        "SOFTI BRIDGE - LICENSE",
        "",
        f"Action          : {action.upper()}",
        f"Telegram ID     : {telegram_id}",
        f"Plan            : {payload.get('plan')}",
        f"Groups Limit    : {payload.get('groups_limit')}",
        f"Accounts Limit  : {payload.get('accounts_limit')}",
        f"Accounts        : {accounts_str}",
        f"Issued (UTC)    : {datetime.fromtimestamp(int(payload.get('iat')), tz=timezone.utc).isoformat()}",
        f"Expiry (UTC)    : {datetime.fromtimestamp(int(payload.get('exp')), tz=timezone.utc).isoformat()}",
        "",
        "LICENSE KEY:",
        license_key,
        ""
    ]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write("\n".join(txt))

    log_path = os.path.join(client_dir, "log.txt")
    with open(log_path, "a", encoding="utf-8") as lf:
        lf.write(f"[{stamp}] {action.upper()} exp={date_utc(int(payload.get('exp')))} accounts={len(accounts)}/{int(payload.get('accounts_limit',0))}\n")
    return fpath
