import os, sqlite3, json, time
DB_PATH = os.path.join("data", "softibridge.db")

def connect():
    os.makedirs("data", exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = connect()
    cur = con.cursor()

    # Existing table (kept for backward compatibility)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS licenses (
      telegram_id INTEGER PRIMARY KEY,
      plan TEXT NOT NULL,
      groups_limit INTEGER NOT NULL,
      accounts_limit INTEGER NOT NULL,
      allowed_accounts TEXT NOT NULL,
      iat INTEGER NOT NULL,
      exp INTEGER NOT NULL,
      status TEXT NOT NULL
    )
    """)

    # New table: installs bound to a license_key (no API model)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS installs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL,
      install_id TEXT NOT NULL,
      status TEXT NOT NULL,              -- ACTIVE / DISABLED
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(license_key, install_id)
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_installs_license ON installs(license_key)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_installs_status  ON installs(status)")

    con.commit()
    con.close()

# ---------------------------
# Licenses (legacy model)
# ---------------------------
def get_license(telegram_id: int):
    con = connect(); cur = con.cursor()
    cur.execute("""
      SELECT telegram_id, plan, groups_limit, accounts_limit, allowed_accounts, iat, exp, status
      FROM licenses WHERE telegram_id=?
    """, (telegram_id,))
    row = cur.fetchone(); con.close()
    if not row: return None
    return {
        "telegram_id": row["telegram_id"],
        "plan": row["plan"],
        "groups_limit": row["groups_limit"],
        "accounts_limit": row["accounts_limit"],
        "allowed_accounts": json.loads(row["allowed_accounts"] or "[]"),
        "iat": row["iat"],
        "exp": row["exp"],
        "status": row["status"],
    }

def upsert_license(lic: dict):
    con = connect(); cur = con.cursor()
    cur.execute("""
    INSERT INTO licenses (telegram_id, plan, groups_limit, accounts_limit, allowed_accounts, iat, exp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      plan=excluded.plan,
      groups_limit=excluded.groups_limit,
      accounts_limit=excluded.accounts_limit,
      allowed_accounts=excluded.allowed_accounts,
      iat=excluded.iat,
      exp=excluded.exp,
      status=excluded.status
    """, (
        int(lic["telegram_id"]),
        lic["plan"],
        int(lic["groups_limit"]),
        int(lic["accounts_limit"]),
        json.dumps(lic.get("allowed_accounts", []), ensure_ascii=False),
        int(lic["iat"]),
        int(lic["exp"]),
        lic["status"]
    ))
    con.commit(); con.close()

def list_licenses():
    con = connect(); cur = con.cursor()
    cur.execute("""
      SELECT telegram_id, plan, exp, status, allowed_accounts, groups_limit, accounts_limit
      FROM licenses ORDER BY exp ASC
    """)
    rows = cur.fetchall(); con.close()
    out=[]
    for r in rows:
        out.append({
            "telegram_id": r["telegram_id"],
            "plan": r["plan"],
            "exp": r["exp"],
            "status": r["status"],
            "accounts": json.loads(r["allowed_accounts"] or "[]"),
            "groups_limit": r["groups_limit"],
            "accounts_limit": r["accounts_limit"],
        })
    return out

# ---------------------------
# Installs (new model)
# ---------------------------
def now_ts()->int:
    return int(time.time())

def count_active_installs(license_key:str)->int:
    con=connect(); cur=con.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM installs WHERE license_key=? AND status='ACTIVE'", (license_key,))
    c = cur.fetchone()["c"]
    con.close()
    return int(c)

def get_install(license_key:str, install_id:str):
    con=connect(); cur=con.cursor()
    cur.execute("SELECT * FROM installs WHERE license_key=? AND install_id=?", (license_key, install_id))
    row=cur.fetchone(); con.close()
    if not row: return None
    return dict(row)

def upsert_install_active(license_key:str, install_id:str):
    ts=now_ts()
    con=connect(); cur=con.cursor()
    cur.execute("""
      INSERT INTO installs (license_key, install_id, status, created_at, updated_at)
      VALUES (?, ?, 'ACTIVE', ?, ?)
      ON CONFLICT(license_key, install_id) DO UPDATE SET
        status='ACTIVE',
        updated_at=excluded.updated_at
    """, (license_key, install_id, ts, ts))
    con.commit(); con.close()

def disable_install(license_key:str, install_id:str)->bool:
    ts=now_ts()
    con=connect(); cur=con.cursor()
    cur.execute("""
      UPDATE installs SET status='DISABLED', updated_at=?
      WHERE license_key=? AND install_id=? AND status='ACTIVE'
    """, (ts, license_key, install_id))
    changed = cur.rowcount > 0
    con.commit(); con.close()
    return changed
