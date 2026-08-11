"""
Autentifikasiya endpoint-ləri: Sign Up və Login.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import models, schemas, auth

router = APIRouter(prefix="", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni istifadəçi qeydiyyatı",
)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.User)
        .filter(
            (models.User.email == user.email)
            | (models.User.username == user.username)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu email və ya username artıq istifadə olunur",
        )

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=auth.hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    summary="İstifadəçi girişi",
    description=(
        "Uğurlu girişdə JWT `access_token` qaytarır. Frontend bu tokeni "
        "saxlamalı və sonrakı sorğularda `Authorization: Bearer <token>` "
        "header-i kimi göndərməlidir.\n\n"
        "`message` və `user` sahələri köhnə frontend kodu sınmasın deyə "
        "saxlanılıb — frontend tam JWT-yə keçəndən sonra silinə bilər."
    ),
)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == credentials.email
    ).first()

    if not user or not auth.verify_password(
        credentials.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email və ya şifrə yanlışdır",
        )

    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız bloklanıb. Ətraflı məlumat üçün administratorla əlaqə saxlayın.",
        )

    return {
        "message": "Login successful",
        "access_token": auth.create_access_token(user.id),
        "token_type": "bearer",
        "user": schemas.UserResponse.model_validate(user),
    }


@router.get(
    "/me",
    response_model=schemas.UserResponse,
    summary="Cari istifadəçi (token ilə)",
    description="Authorization header-indəki tokenə əsasən daxil olmuş istifadəçini qaytarır.",
)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user
