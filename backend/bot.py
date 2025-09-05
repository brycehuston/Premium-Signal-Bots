import docker

BOT_CONTAINERS = {
    "trend_rider": "trend_rider_bot",
    "scalper": "scalper_bot",
    "reversal": "reversal_bot"
}

_client = None


def client():
    global _client
    if _client is None:
        _client = docker.from_env()
    return _client


def _name(bot: str) -> str:
    if bot not in BOT_CONTAINERS:
        raise ValueError("unknown bot")
    return BOT_CONTAINERS[bot]


def start_bot(bot: str) -> dict:
    c = client()
    n = _name(bot)
    try:
        ctr = c.containers.get(n)
        ctr.start()
        ctr.reload()
        return {"bot": bot, "container": n, "status": ctr.status}
    except docker.errors.NotFound:
        return {"bot": bot, "container": n, "status": "not_found"}
    except Exception as e:
        return {"bot": bot, "container": n, "status": "error", "detail": str(e)}


def stop_bot(bot: str) -> dict:
    c = client()
    n = _name(bot)
    try:
        ctr = c.containers.get(n)
        ctr.stop(timeout=10)
        ctr.reload()
        return {"bot": bot, "container": n, "status": ctr.status}
    except docker.errors.NotFound:
        return {"bot": bot, "container": n, "status": "not_found"}
    except Exception as e:
        return {"bot": bot, "container": n, "status": "error", "detail": str(e)}


def bot_status(bot: str) -> dict:
    c = client()
    n = _name(bot)
    try:
        ctr = c.containers.get(n)
        ctr.reload()
        return {"bot": bot, "container": n, "status": ctr.status}
    except docker.errors.NotFound:
        return {"bot": bot, "container": n, "status": "not_found"}
    except Exception as e:
        return {"bot": bot, "container": n, "status": "error", "detail": str(e)}


def stream_logs(bot: str):
    c = client()
    n = _name(bot)
    ctr = c.containers.get(n)
    for line in ctr.logs(stream=True, follow=True, tail=50):
        yield line.decode(errors="ignore")
