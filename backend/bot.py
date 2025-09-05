import time
import threading
from collections import defaultdict

_status = defaultdict(lambda: "stopped")
_lock = threading.Lock()


def start_bot(name: str):
    with _lock:
        _status[name] = "running"
    return {"ok": True, "bot": name, "status": "running"}


def stop_bot(name: str):
    with _lock:
        _status[name] = "stopped"
    return {"ok": True, "bot": name, "status": "stopped"}


def bot_status(name: str):
    return {"name": name, "status": _status[name]}


def stream_logs(name: str):
    i = 0
    while True:
        yield f"[{name}] status={_status[name]} tick={i}\n"
        time.sleep(1)
        i += 1
