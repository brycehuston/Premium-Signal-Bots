# test_auth.py
from auth import hash_password, verify_password, create_access_token, decode_token
import time


def run_tests():
    print("🔑 Testing password hashing...")
    password = "supersecret123"
    hashed = hash_password(password)
    print("Password:", password)
    print("Hashed:", hashed)
    assert verify_password(password, hashed), "Password verification failed!"
    print("✅ Password verification works")

    print("\n🪙 Testing JWT token...")
    token = create_access_token({"sub": "testuser@example.com"})
    print("Token:", token)

    decoded = decode_token(token)
    print("Decoded payload:", decoded)
    assert decoded["sub"] == "testuser@example.com", "Token decode mismatch"
    print("✅ JWT encode/decode works")


if __name__ == "__main__":
    run_tests()
