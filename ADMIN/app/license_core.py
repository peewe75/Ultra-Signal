import base64, hashlib, hmac, json
from typing import Dict

_PARTS = ["S0f", "t1B", "r1d", "g3", "_Key", "_Master", "_2026"]
SECRET = "".join(_PARTS).encode("utf-8")

def _b64url_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("ascii").rstrip("=")

def _sign(payload_b64: str) -> str:
    sig = hmac.new(SECRET, payload_b64.encode("ascii"), hashlib.sha256).digest()
    return _b64url_encode(sig)

def make_key(payload: Dict) -> str:
    payload_b = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    pb64 = _b64url_encode(payload_b)
    sb64 = _sign(pb64)
    return f"{pb64}.{sb64}"


def _b64url_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

def verify_key(key: str) -> bool:
    try:
        pb64, sb64 = key.split(".", 1)
    except ValueError:
        return False
    return _sign(pb64) == sb64

def decode_payload(key: str) -> Dict:
    if not verify_key(key):
        raise ValueError("invalid key signature")
    pb64 = key.split(".", 1)[0]
    payload_b = _b64url_decode(pb64)
    return json.loads(payload_b.decode("utf-8"))
