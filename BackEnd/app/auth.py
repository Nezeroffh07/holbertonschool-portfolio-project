"""
Şifrə hash-ləmə köməkçiləri.

Şifrələr HEÇ VAXT açıq (plain-text) şəkildə DB-yə yazılmır.
Sprint 1 üçün JWT/token sistemi əlavə edilməyib (login uğurlu
olduğunu yoxlamaq kifayətdir) — token-based auth sonrakı sprintdə
əlavə oluna bilər.
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
