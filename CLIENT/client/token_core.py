import base64, hashlib, hmac, json
from typing import Dict

# Separate secret from license key secret
_PARTS = ["S0f", "t1A", "u7o", "_Tok", "3n", "_2026"]
SECRET = "".join(_PARTS).encode("utf-8")

def _b64url_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("ascii").rstrip("=")

def _b64url_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

def _sign(payload_b64: str) -> str:
    sig = hmac.new(SECRET, payload_b64.encode("ascii"), hashlib.sha256).digest()
    return _b64url_encode(sig)

def make_sync_code(payload: Dict) -> str:
    payload_b = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    pb64 = _b64url_encode(payload_b)
    sb64 = _sign(pb64)
    return f"{pb64}.{sb64}"

def verify_sync_code(code: str) -> bool:
    try:
        pb64, sb64 = code.split(".", 1)
    except ValueError:
        return False
    return _sign(pb64) == sb64

def decode_sync_code(code: str) -> Dict:
    if not verify_sync_code(code):
        raise ValueError("invalid sync code signature")
    pb64 = code.split(".", 1)[0]
    payload_b = _b64url_decode(pb64)
    return json.loads(payload_b.decode("utf-8"))
