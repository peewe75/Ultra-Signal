import json, os, time, urllib.parse, urllib.request, re
from typing import Optional

CONFIG_PATH = os.path.join("..", "config", "config.json")
# Directory for signal queues (Common Files)
COMMON_BASE = os.path.join(os.environ.get("PUBLIC", r"C:\Users\Public"), "Documents", "Common", "Files", "softibridge")
QUEUE_FILE = os.path.join(COMMON_BASE, "inbox", "cmd_queue.txt")

def load_cfg():
    if not os.path.exists(CONFIG_PATH):
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def tg_api(method: str, token: str, payload: dict) -> dict:
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urllib.parse.urlencode(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))

def write_cmd(cmd_str: str):
    os.makedirs(os.path.dirname(QUEUE_FILE), exist_ok=True)
    # Append to queue
    with open(QUEUE_FILE, "a", encoding="utf-8") as f:
        f.write(cmd_str + "\n")

def parse_signal(text: str) -> Optional[str]:
    """
    Parses common signal formats into EA command string:
    id=TS;mode=PIPS;symbol=XAUUSD;side=BUY;entry=2030;sl_pips=200;tp1_pips=300;tp2_pips=500;tp3_pips=1000
    """
    text = text.upper()
    
    # Simple Regex for basic signals
    # BUY GOLD @ 2030 SL 2010 TP 2060
    # SELL EURUSD @ 1.0850 SL 1.0900 TP1 1.0800 TP2 1.0750
    
    side_match = re.search(r"\b(BUY|SELL)\b", text)
    if not side_match: return None
    side = side_match.group(1)
    
    # Symbol (XAUUSD, GOLD, EURUSD, etc.)
    # Often follows the side
    sym_match = re.search(r"(?:BUY|SELL)\s+([A-Z0-9/]+)", text)
    symbol = sym_match.group(1) if sym_match else "CHART" # Default to chart symbol if not found
    if symbol == "GOLD": symbol = "XAUUSD" # Alias
    
    # Entry
    entry_match = re.search(r"(?:@|AT|ENTRY|LIMIT)\s*([\d.]+)", text)
    entry = entry_match.group(1) if entry_match else None
    
    # SL (Absolute price or Pips)
    sl_pips = None
    sl_match = re.search(r"SL\s*([\d.]+)", text)
    # We'll assume absolute price for now and convert relative if needed, 
    # but the current EA 'PIPS' mode expects entry + sl_pips.
    # To keep it simple for now, we'll parse absolute SL and TP and use 'PRICE' mode.
    sl_price = sl_match.group(1) if sl_match else None
    
    # TP
    tp_matches = re.finditer(r"TP\d?\s*([\d.]+)", text)
    tps = [m.group(1) for m in tp_matches]
    
    if not (entry and sl_price and tps):
        return None
        
    sig_id = int(time.time() * 1000)
    tp1 = tps[0]
    tp2 = tps[1] if len(tps) > 1 else "0"
    tp3 = tps[2] if len(tps) > 2 else "0"
    
    # PRICE mode: id=...;mode=PRICE;symbol=...;side=...;entry_lo=...;entry_hi=...;sl_price=...;tp1_price=...;tp2_price=...;tp3_price=...
    cmd = f"id={sig_id};mode=PRICE;symbol={symbol};side={side};entry_lo={entry};entry_hi={entry};sl_price={sl_price};tp1_price={tp1};tp2_price={tp2};tp3_price={tp3}"
    return cmd

def run():
    cfg = load_cfg()
    token = cfg.get("signal_bot_token", cfg.get("bot_token", ""))
    if not token or token.startswith("PASTE_"):
        print("Set signal_bot_token in config.json")
        return

    offset = 0
    print("SoftiBridge Signal Receiver running...")
    
    while True:
        try:
            res = tg_api("getUpdates", token, {"timeout": "25", "offset": str(offset)})
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
                    print(f"🚀 Signal detected: {text[:50]}...")
                    write_cmd(cmd)
                    print(f"✅ Executed in local queue: {cmd}")
                
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    run()
