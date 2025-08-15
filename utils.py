import hashlib
def make_hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()
