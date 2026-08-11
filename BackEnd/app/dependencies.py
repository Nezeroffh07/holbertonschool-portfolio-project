"""
Ortaq FastAPI dependency-ləri — "bu sorğunu kim edir" məsələsi.

KEÇİD DÖVRÜ (Sprint 3):
Bu sprintdə JWT əlavə olundu, amma frontend hələ tədricən keçir. Ona görə
backend HƏR İKİ üsulu qəbul edir:

  1. YENİ (tövsiyə olunan): Authorization: Bearer <token> header-i
  2. KÖHNƏ (deprecated): request body-də `owner_id` / `applicant_id`

Token varsa HƏMİŞƏ o üstün tutulur — yəni kimsə tokenlə daxil olub, body-də
başqasnn id-sini yazsa, tokendəki istifadəçi qəbul edilir (təhlükəsizlik
üçün vacibdir).

Frontend tam JWT-yə keçəndən sonra 2-ci üsul silinməlidir və o zaman
`owner_id`/`applicant_id` sahələri sxemlərdən çxaracaq.
"""
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app import auth, models

# auto_error=False → token yoxdursa xəta atmır, None qaytarır.
# Bu, keçid dövründə köhnə (tokensiz) sorğuların da işləməsi üçün lazımdır.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """Token varsa istifadəçini qaytarır, yoxdursa None (xəta atmır)."""
    if credentials is None:
        return None

    user_id = auth.decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token etibarsızdır və ya vaxtı keçib",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tokendəki istifadəçi tapılmadı",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Bloklanmış istifadəçinin köhnə (blokdan əvvəl alınmış) tokeni də
    # işləməməlidir — əks halda blok effektsiz qalardı.
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız bloklanıb. Ətraflı məlumat üçün administratorla əlaqə saxlayın.",
        )

    return user


def get_current_user(
    user: Optional[models.User] = Depends(get_current_user_optional),
) -> models.User:
    """Token MÜTLƏQ tələb olunan endpoint-lər üçün."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu əməliyyat üçün daxil olmalısınız",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def resolve_actor_id(
    token_user: Optional[models.User],
    body_user_id: Optional[int],
) -> int:
    """
    Sorğunu edən istifadəçinin id-sini müəyyən edir.

    Token varsa — ondan (etibarlr).
    Token yoxdursa — body-dəki id-dən (keçid dövrü, etibarl deyil).
    Heç biri yoxdursa — 401.
    """
    if token_user is not None:
        return token_user.id
    if body_user_id is not None:
        return body_user_id
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Bu əməliyyat üçün daxil olmalısınız",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_ownership(actor_id: int, owner_id: int, message: str) -> None:
    """Sorğunu edənin həqiqətən resursun sahibi olduğunu yoxlayır."""
    if actor_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
        )


def require_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Yalnız admin istifadəçilərə icazə verir.

    Admin statusu (`users.is_admin`) YALNIZ verilənlər bazasından əl ilə
    təyin olunur — heç bir endpoint onu dəyişmir. Bu, qəsdən belədir ki,
    kimsə API vasitəsilə özünü admin edə bilməsin.

    Admin təyin etmək üçün DB-də:
        UPDATE users SET is_admin = true WHERE email = 'admin@qu.edu.az';
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu əməliyyat üçün admin səlahiyyəti tələb olunur",
        )
    return current_user
