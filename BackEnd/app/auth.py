"""
Autentifikasiya köməkçiləri: şifrə hash-ləmə + JWT token.

Sprint 3-də JWT token sistemi əlavə olundu:
  - Login uğurlu olanda backend bir "access_token" qaytarır.
  - Frontend bu tokeni saxlayır və hər sorğuda göndərir:
        Authorization: Bearer <token>
  - Backend tokendən "bu sorğunu kim edir" məlumatını çıxarır.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# DİQQƏT: production-da SECRET_KEY mütləq environment variable kimi
# verilməlidir. Aşağıdakı default dəyər YALNIZ lokal development üçündür —
# real mühitdə bu dəyərlə qalsa, tokenlər saxtalaşdırıla bilər.
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-insecure-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 saat


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int) -> str:
    """İstifadəçi üçün JWT access token yaradır."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),   # JWT standartı "sub"-un string olmasını tələb edir
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    """
    Tokeni yoxlayır və içindəki user_id-ni qaytarır.
    Token etibarsız və ya vaxtı keçmişsə None qaytarır (xəta atmır) —
    çağıran tərəf nə edəcəyinə özü qərar verir.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None

    subject = payload.get("sub")
    if subject is None:
        return None
    try:
        return int(subject)
    except (TypeError, ValueError):
        return None
