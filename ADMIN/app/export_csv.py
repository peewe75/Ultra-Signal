import csv, os
from datetime import datetime, timezone
from db import init_db, list_licenses

def date_utc(ts:int)->str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")

def main():
    init_db()
    rows = list_licenses()
    os.makedirs("exports", exist_ok=True)
    out_path = os.path.join("exports", "licenses_export.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["telegram_id","plan","status","expiry_utc","groups_limit","accounts_limit","accounts_csv"])
        for r in rows:
            w.writerow([r["telegram_id"], r["plan"], r["status"], date_utc(int(r["exp"])), r["groups_limit"], r["accounts_limit"], ",".join(r["accounts"] or [])])
    print("OK:", out_path)

if __name__ == "__main__":
    main()
