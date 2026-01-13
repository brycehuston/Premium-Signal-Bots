# backend/main.py

import os
from fastapi import FastAPI, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text

from .database import Base, engine, get_db
from .models import User, Subscription
from .auth import hash_password, verify_password, create_access_token, decode_token
from .clerk_auth import verify_clerk_token, fetch_clerk_email
from .bot import start_bot, stop_bot, bot_status, stream_logs

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


Base.metadata.create_all(bind=engine)


def create_runtime_tables():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS waitlist (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT NOT NULL,
              name TEXT,
              comment TEXT,
              status TEXT NOT NULL DEFAULT 'waiting',
              user_id INTEGER NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS payments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              plan TEXT NOT NULL,
              chain TEXT NOT NULL,
              asset TEXT NOT NULL,
              amount REAL NOT NULL,
              tx_hash TEXT NOT NULL,
              status TEXT NOT NULL,
              telegram_username TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """))


def ensure_waitlist_schema():
    with engine.begin() as conn:
        cols = conn.execute(text("PRAGMA table_info(waitlist)")).fetchall()
        if not cols:
            return
        by = {c[1]: c for c in cols}
        if "name" not in by:
            conn.execute(text("ALTER TABLE waitlist ADD COLUMN name TEXT"))
        if "user_id" not in by:
            conn.execute(
                text("ALTER TABLE waitlist ADD COLUMN user_id INTEGER NULL"))
        else:
            notnull = by["user_id"][3]
            if notnull == 1:
                conn.execute(text("""
                    CREATE TABLE waitlist_new (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      email TEXT NOT NULL,
                      name TEXT,
                      comment TEXT,
                      status TEXT NOT NULL DEFAULT 'waiting',
                      user_id INTEGER NULL,
                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.execute(text("""
                    INSERT INTO waitlist_new (id,email,name,comment,status,user_id,created_at)
                    SELECT id,email,name,comment,status,NULL,created_at FROM waitlist;
                """))
                conn.execute(text("DROP TABLE waitlist"))
                conn.execute(
                    text("ALTER TABLE waitlist_new RENAME TO waitlist"))


def ensure_users_schema():
    with engine.begin() as conn:
        cols = {c[1]: c for c in conn.execute(
            text("PRAGMA table_info(users)")).fetchall()}
        if not cols:
            return

        def add(sql): conn.execute(text(f"ALTER TABLE users ADD COLUMN {sql}"))
        if "role" not in cols:
            add("role TEXT NOT NULL DEFAULT 'user'")
        if "clerk_id" not in cols:
            add("clerk_id TEXT")
        if "plan" not in cols:
            add("plan TEXT")
        if "is_active" not in cols:
            add("is_active INTEGER NOT NULL DEFAULT 0")
        if "created_at" not in cols:
            add("created_at DATETIME DEFAULT CURRENT_TIMESTAMP")


create_runtime_tables()
ensure_waitlist_schema()
ensure_users_schema()

app = FastAPI(title="SaaS Hub — Crypto Only")

# CORS

origin_list = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,https://premium-signal-bots.vercel.app"
    ).split(",")
    if o.strip()
]

# TEMP: open it up to any origin to confirm CORS is the issue.
origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX", r"https://.*\.vercel\.app$")

print("CORS allow_origins:", origin_list)
print("CORS allow_origin_regex:", origin_regex)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin_list,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


class GoogleToken(BaseModel):
    id_token: str


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ALLOW_LEGACY_TOKENS = os.getenv("ALLOW_LEGACY_TOKENS", "false").lower() == "true"


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class BotControlPayload(BaseModel):
    bot_name: str


class MeResponse(BaseModel):
    email: EmailStr
    role: str
    plan: str | None
    is_active: bool


class WaitlistPayload(BaseModel):
    email: EmailStr
    name: str | None = None
    comment: str | None = None


class CryptoSubmit(BaseModel):
    plan: str
    chain: str = "solana"
    asset: str = "USDC"
    amount: float
    tx_hash: str
    telegram_username: str | None = None


class ApprovePayload(BaseModel):
    payment_id: int
    months: int = 1


def _email_from_clerk_payload(payload: dict, clerk_id: str) -> str | None:
    email = payload.get("email") or payload.get("email_address") or payload.get("primary_email_address")
    if email:
        return email
    return fetch_clerk_email(clerk_id)


def _get_or_create_user_from_clerk(payload: dict, db: Session) -> User:
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(status_code=401, detail="invalid clerk token")

    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    email = _email_from_clerk_payload(payload, clerk_id)

    if user:
        if email and user.email != email:
            user.email = email
            db.commit()
        return user

    if not email:
        raise HTTPException(status_code=401, detail="clerk email not found")

    user = db.query(User).filter(User.email == email).first()
    if user:
        user.clerk_id = clerk_id
        db.commit()
        return user

    user = User(email=email, password_hash=hash_password(os.urandom(8).hex()))
    user.clerk_id = clerk_id
    db.add(user)
    db.commit()
    return user


def require_user(request: Request, db: Session) -> User:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="unauthorized")
    token = auth.split(" ", 1)[1]
    try:
        payload = verify_clerk_token(token)
        return _get_or_create_user_from_clerk(payload, db)
    except Exception:
        if not ALLOW_LEGACY_TOKENS:
            raise HTTPException(status_code=401, detail="invalid token")
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="user not found")
    return user


def maybe_user_id(request: Request, db: Session):
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(" ", 1)[1]
    try:
        payload = verify_clerk_token(token)
        user = _get_or_create_user_from_clerk(payload, db)
        return user.id
    except Exception:
        if not ALLOW_LEGACY_TOKENS:
            return None
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        u = db.query(User).filter(User.email == email).first()
        return u.id if u else None
    except Exception:
        return None


def require_admin(request: Request, db: Session) -> User:
    user = require_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="admin_only")
    return user


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        raise HTTPException(status_code=500, detail="db_unavailable")


@app.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="email in use")
    user = User(email=payload.email,
                password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/me", response_model=MeResponse)
def me(request: Request, db: Session = Depends(get_db)):
    user = require_user(request, db)
    return {"email": user.email, "role": user.role, "plan": user.plan, "is_active": user.is_active}


@app.post("/waitlist")
def add_waitlist(payload: WaitlistPayload, request: Request, db: Session = Depends(get_db)):
    uid = maybe_user_id(request, db)
    db.execute(
        text("""
        INSERT INTO waitlist (email, name, comment, status, user_id, created_at)
        VALUES (:email, :name, :comment, 'waiting', :uid, CURRENT_TIMESTAMP)
        """),
        {"email": payload.email, "name": (payload.name or "").strip(
        ), "comment": (payload.comment or "").strip(), "uid": uid},
    )
    db.commit()
    return {"ok": True, "email": payload.email}


class WaitlistSetStatus(BaseModel):
    id: int
    status: str


@app.get("/admin/waitlist")
def admin_waitlist(status: str | None = None, request: Request = None, db: Session = Depends(get_db)):
    require_admin(request, db)
    if status:
        rows = db.execute(text("""
            SELECT id,email,name,comment,status,created_at,user_id
            FROM waitlist WHERE status=:s ORDER BY id DESC LIMIT 200
        """), {"s": status}).fetchall()
    else:
        rows = db.execute(text("""
            SELECT id,email,name,comment,status,created_at,user_id
            FROM waitlist ORDER BY id DESC LIMIT 200
        """)).fetchall()
    return {"entries": [dict(r._mapping) for r in rows]}


@app.post("/admin/waitlist/set_status")
def admin_waitlist_set_status(payload: WaitlistSetStatus, request: Request, db: Session = Depends(get_db)):
    require_admin(request, db)
    db.execute(text("UPDATE waitlist SET status=:st WHERE id=:id"),
               {"st": payload.status, "id": payload.id})
    db.commit()
    return {"ok": True}


@app.post("/crypto/submit")
def crypto_submit(payload: CryptoSubmit, request: Request, db: Session = Depends(get_db)):
    user = require_user(request, db)
    db.execute(
        text("""
            INSERT INTO payments (user_id, plan, chain, asset, amount, tx_hash, status, telegram_username, created_at)
            VALUES (:user_id, :plan, :chain, :asset, :amount, :tx_hash, 'pending', :tg, CURRENT_TIMESTAMP)
        """),
        {
            "user_id": user.id,
            "plan": payload.plan,
            "chain": payload.chain,
            "asset": payload.asset,
            "amount": payload.amount,
            "tx_hash": payload.tx_hash.strip(),
            "tg": (payload.telegram_username or "").strip(),
        },
    )
    db.commit()
    return {"ok": True}


@app.get("/crypto/my-payments")
def my_payments(request: Request, db: Session = Depends(get_db)):
    user = require_user(request, db)
    rows = db.execute(
        text("""
            SELECT id, plan, chain, asset, amount, tx_hash, status, telegram_username, created_at
            FROM payments
            WHERE user_id = :uid
            ORDER BY id DESC
            LIMIT 50
        """),
        {"uid": user.id},
    ).fetchall()
    return {"payments": [dict(r._mapping) for r in rows]}


@app.post("/admin/crypto/approve")
def crypto_approve(payload: ApprovePayload, request: Request, db: Session = Depends(get_db)):
    require_admin(request, db)
    row = db.execute(
        text("SELECT id, user_id, plan FROM payments WHERE id=:id AND status='pending'"),
        {"id": payload.payment_id},
    ).fetchone()
    if not row:
        raise HTTPException(
            status_code=404, detail="pending payment not found")
    user = db.query(User).filter(User.id == row.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    user.is_active = True
    user.plan = row.plan
    db.execute(text("UPDATE payments SET status='approved' WHERE id=:id"), {
               "id": row.id})
    db.commit()
    return {"ok": True}


@app.post("/bot/start")
def bot_start(payload: BotControlPayload, request: Request, db: Session = Depends(get_db)):
    user = require_user(request, db)
    if not user.is_active:
        raise HTTPException(status_code=403, detail="inactive plan")
    return start_bot(payload.bot_name)


@app.post("/bot/stop")
def bot_stop(payload: BotControlPayload, request: Request, db: Session = Depends(get_db)):
    user = require_user(request, db)
    if not user.is_active:
        raise HTTPException(status_code=403, detail="inactive plan")
    return stop_bot(payload.bot_name)


@app.get("/bot/status")
def bot_status_all(request: Request, db: Session = Depends(get_db)):
    user = require_user(request, db)
    if not user.is_active:
        raise HTTPException(status_code=403, detail="inactive plan")
    names = ["trend_rider", "scalper", "reversal"]
    return {"bots": [bot_status(n) for n in names]}


@app.websocket("/ws/logs")
async def ws_logs(websocket: WebSocket):
    await websocket.accept()
    bot = websocket.query_params.get("bot", "")
    try:
        for line in stream_logs(bot):
            await websocket.send_text(line.rstrip("\n"))
    except WebSocketDisconnect:
        return
    except Exception as e:
        await websocket.send_text(f"error: {e}")


@app.post("/auth/google", response_model=TokenResponse)
def auth_google(payload: GoogleToken, db: Session = Depends(get_db)):
    try:
        info = id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            audience=GOOGLE_CLIENT_ID or None,
        )
        email = info.get("email")
        if not email:
            raise HTTPException(
                status_code=400, detail="google token missing email")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, password_hash=hash_password(
                os.urandom(8).hex()))
            db.add(user)
            db.commit()
        token = create_access_token({"sub": user.email})
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"invalid google token: {e}")
