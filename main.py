import os
import json
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from passlib.hash import bcrypt
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware


import stripe
from sqlalchemy import (create_engine, String, Boolean, DateTime, Text,
                        ForeignKey, UniqueConstraint)
from sqlalchemy.orm import (DeclarativeBase, mapped_column, Mapped, sessionmaker,
                            relationship)

# ---------- Config ----------
load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
ALGO = "HS256"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./saas.db")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
STRIPE_SUCCESS_URL = os.getenv(
    "STRIPE_SUCCESS_URL", "http://localhost:8000/billing/success")
STRIPE_CANCEL_URL = os.getenv(
    "STRIPE_CANCEL_URL", "http://localhost:8000/billing/cancel")

# ---------- DB ----------


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(
        String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="user")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    access_flag: Mapped["AccessFlag"] = relationship(
        back_populates="user", uselist=False)
    subs: Mapped[list["Subscription"]] = relationship(back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"))
    provider: Mapped[str] = mapped_column(String(20))  # 'stripe'
    provider_customer_id: Mapped[str] = mapped_column(String(120))
    provider_subscription_id: Mapped[str] = mapped_column(String(120))
    plan: Mapped[str] = mapped_column(String(120))
    # active | trialing | canceled | past_due | incomplete
    status: Mapped[str] = mapped_column(String(30))
    current_period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True)
    last_event_id: Mapped[str | None] = mapped_column(
        String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped[User] = relationship(back_populates="subs")
    __table_args__ = (
        UniqueConstraint("provider", "provider_subscription_id",
                         name="uq_provider_subscription"),
    )


class AccessFlag(Base):
    __tablename__ = "access_flags"
    user_id: Mapped[int] = mapped_column(ForeignKey(
        "users.id", ondelete="CASCADE"), primary_key=True)
    plan: Mapped[str] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user: Mapped[User] = relationship(back_populates="access_flag")


engine = create_engine(DATABASE_URL, echo=False, future=True)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

# ---------- Auth ----------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_token(user_id: int, email: str):
    payload = {"sub": str(user_id), "email": email,
               "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGO)


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGO])
        uid = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    db = SessionLocal()
    user = db.get(User, uid)
    db.close()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_paid_user(user: User = Depends(get_current_user)) -> User:
    db = SessionLocal()
    flag = db.get(AccessFlag, user.id)
    db.close()
    if not flag or not flag.is_active:
        raise HTTPException(status_code=402, detail="Subscription inactive")
    return user

# ---------- Schemas ----------


class RegisterBody(BaseModel):
    email: EmailStr
    password: str


class CheckoutBody(BaseModel):
    # optionally allow overriding price_id from frontend
    price_id: str | None = None
    success_url: str | None = None
    cancel_url: str | None = None


# ---------- App ----------
app = FastAPI(title="SaaS Hub (Stripe-only)")

# ---- Auth Routes ----


@app.get("/billing/success", response_class=HTMLResponse)
def billing_success():
    return "<h1>✅ Payment successful</h1><p>You can close this tab and return to the app.</p>"


@app.get("/billing/cancel", response_class=HTMLResponse)
def billing_cancel():
    return "<h1>❌ Checkout canceled</h1><p>No charge was made.</p>"


@app.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    user = db.query(User).filter(User.email == form.username.lower()).first()
    if not user or not user.password_hash or not bcrypt.verify(form.password, user.password_hash):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id, user.email)
    db.close()
    # OLD: return {"token": token}
    return {"access_token": token, "token_type": "bearer"}  # <-- NEW


@app.post("/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    user = db.query(User).filter(User.email == form.username.lower()).first()
    if not user or not user.password_hash or not bcrypt.verify(form.password, user.password_hash):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id, user.email)
    db.close()
    return {"token": token}


@app.get("/me")
def me(user: User = Depends(get_current_user)):
    db = SessionLocal()
    flag = db.get(AccessFlag, user.id)
    db.close()
    return {"email": user.email, "role": user.role, "plan": (flag.plan if flag else "free"), "active": (flag.is_active if flag else False)}

# ---- Billing: create Stripe checkout ----


@app.post("/billing/create-checkout-session")
def create_checkout(body: CheckoutBody, user: User = Depends(get_current_user)):
    if not stripe.api_key or not (STRIPE_PRICE_ID or body.price_id):
        raise HTTPException(status_code=500, detail="Stripe not configured")

    session = stripe.checkout.Session.create(
        mode="subscription",
        # REMOVE this line:
        # customer_creation="if_required",
        line_items=[
            {"price": body.price_id or STRIPE_PRICE_ID, "quantity": 1}],
        success_url=body.success_url or STRIPE_SUCCESS_URL,
        cancel_url=body.cancel_url or STRIPE_CANCEL_URL,
        customer_email=user.email,                    # fine to keep
        metadata={"app_user_email": user.email},
        # optional niceties:
        # allow_promotion_codes=True,
    )
    return {"url": session.url}


# ---- Stripe Webhook ----


@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500, detail="Missing STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Webhook signature error: {e}")

    event_type = event.get("type")
    obj = event["data"]["object"]
    print("STRIPE EVENT TYPE:", event_type)

    # 1) Handle subscription lifecycle (created/updated/deleted, etc.)
    if event_type and event_type.startswith("customer.subscription."):
        _handle_subscription_event(event, obj)

    # 2) ALSO flip access on checkout completion (instant activation)
    elif event_type == "checkout.session.completed":
        # Checkout session object: https://stripe.com/docs/api/checkout/sessions/object
        customer_email = obj.get("customer_email")
        plan_nickname = None
        try:
            # If you want the plan nickname immediately, expand line items (optional optimization later)
            # For now, we’ll just rely on subscription events to set the official plan
            pass
        except Exception:
            pass

        if customer_email:
            db = SessionLocal()
            try:
                user = db.query(User).filter(
                    User.email == customer_email.lower()).first()
                if user:
                    flag = db.get(AccessFlag, user.id)
                    if not flag:
                        flag = AccessFlag(
                            user_id=user.id, plan=plan_nickname or "pro", is_active=True)
                        db.add(flag)
                    else:
                        flag.is_active = True
                        if plan_nickname:
                            flag.plan = plan_nickname
                        flag.updated_at = datetime.now(timezone.utc)
                    db.commit()
                    print(
                        f"✅ Activated user via checkout.session.completed: {customer_email}")
                else:
                    print(
                        f"⚠️ checkout.session.completed for unknown email: {customer_email}")
            finally:
                db.close()

    return {"ok": True}


def _handle_subscription_event(event, sub_obj):
    """Handles: created, updated, deleted"""
    event_id = event.get("id")
    status = sub_obj.get("status")  # active, trialing, canceled, etc.
    provider_subscription_id = sub_obj.get("id")
    provider_customer_id = sub_obj.get("customer")

    # Derive email from metadata (best effort). If absent, leave to recon later.
    email = (sub_obj.get("metadata", {}) or {}).get("app_user_email")
    if not email:
        # Stripe sometimes won’t echo metadata per item; try items->price->metadata if you set it there
        email = None

    # Plan nickname or price id
    items = sub_obj.get("items", {}).get("data", [])
    price = (items[0]["price"] if items else {})
    plan = price.get("nickname") or price.get("id") or "unknown"

    period_end_ts = sub_obj.get("current_period_end")
    period_end = None
    if period_end_ts:
        period_end = datetime.fromtimestamp(period_end_ts, tz=timezone.utc)

    db = SessionLocal()
    try:
        if not email:
            # If email missing, try to find user by customer id reference (optional: store mapping via checkout.session)
            # For now, no-op if we can’t resolve a user—add a nightly recon later.
            db.commit()
            return

        user = db.query(User).filter(User.email == email.lower()).first()
        if not user:
            # Create the user lazily if they bought before registering in the hub
            user = User(email=email.lower(), password_hash=None)
            db.add(user)
            db.commit()
            db.refresh(user)
            # seed access flag
            db.add(AccessFlag(user_id=user.id, plan="free", is_active=False))
            db.commit()

        # Upsert subscription
        sub = (db.query(Subscription)
                 .filter(Subscription.provider == "stripe",
                         Subscription.provider_subscription_id == provider_subscription_id)
                 .first())
        if not sub:
            sub = Subscription(
                user_id=user.id,
                provider="stripe",
                provider_customer_id=provider_customer_id or "unknown",
                provider_subscription_id=provider_subscription_id or "unknown",
                plan=plan, status=status, current_period_end=period_end,
                last_event_id=event_id
            )
            db.add(sub)
        else:
            # idempotency: if we’ve processed this event, bail
            if sub.last_event_id == event_id:
                db.commit()
                return
            sub.plan = plan
            sub.status = status
            sub.current_period_end = period_end
            sub.last_event_id = event_id

        # Flip access
        flag = db.get(AccessFlag, user.id)
        if not flag:
            flag = AccessFlag(user_id=user.id, plan=plan,
                              is_active=(status in ("active", "trialing")))
            db.add(flag)
        else:
            flag.plan = plan
            flag.is_active = status in ("active", "trialing")
            flag.updated_at = datetime.now(timezone.utc)

        db.commit()
    finally:
        db.close()

# ---- Protected Bot Controls (placeholders) ----


@app.post("/bots/start")
def start_bot(user: User = Depends(require_paid_user)):
    # TODO: call your Docker/service to start user’s bot config
    return {"message": f"Bot started for {user.email}"}


@app.post("/bots/stop")
def stop_bot(user: User = Depends(require_paid_user)):
    # TODO: stop the container/service
    return {"message": f"Bot stopped for {user.email}"}


@app.post("/billing/create-portal-session")
def create_portal(user: User = Depends(get_current_user)):
    session = stripe.billing_portal.Session.create(
        customer_creation="if_required",  # optional for test
        return_url="http://localhost:3000/dashboard",
        customer_email=user.email,
    )
    return {"url": session.url}
