"""
Profile endpoint-ləri.

Hər User-in yalnz bir Profile-i ola bilər (1-1 əlaqə).
PUT /users/{user_id}/profile — profil yoxdursa yaradr, varsa yeniləyir
(upsert). Bu, frontend üçün sadələşdirmə edir: ayrca "create" və
"update" məntiqi ilə uğraşmağa ehtiyac qalmr.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_optional, require_ownership
from app import models, schemas

router = APIRouter(prefix="/users/{user_id}/profile", tags=["Profile"])


def _get_user_or_404(user_id: int, db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İstifadəçi tapılmadı",
        )
    return user


def _get_skills_or_400(skill_ids: list[int], db: Session) -> list[models.Skill]:
    if not skill_ids:
        return []
    skills = db.query(models.Skill).filter(models.Skill.id.in_(skill_ids)).all()
    found_ids = {s.id for s in skills}
    missing = set(skill_ids) - found_ids
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bu skill_id-lər mövcud deyil: {sorted(missing)}",
        )
    return skills


@router.get(
    "",
    response_model=schemas.ProfileResponse,
    summary="İstifadəçinin profilini gətir",
)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    _get_user_or_404(user_id, db)
    profile = (
        db.query(models.Profile)
        .filter(models.Profile.user_id == user_id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu istifadəçi hələ profil yaratmayb",
        )
    return profile


@router.put(
    "",
    response_model=schemas.ProfileResponse,
    summary="Profili yarat və ya yenilə (upsert)",
)
def upsert_profile(
    user_id: int,
    payload: schemas.ProfileUpsert,
    db: Session = Depends(get_db),
    token_user: models.User | None = Depends(get_current_user_optional),
):
    _get_user_or_404(user_id, db)

    # Token varsa, yalnız öz profilini dəyişməyə icazə verilir
    if token_user is not None:
        require_ownership(
            token_user.id, user_id,
            "Yalnız öz profilinizi dəyişə bilərsiniz",
        )

    skills = _get_skills_or_400(payload.skill_ids, db)

    profile = (
        db.query(models.Profile)
        .filter(models.Profile.user_id == user_id)
        .first()
    )
    if not profile:
        profile = models.Profile(user_id=user_id)
        db.add(profile)

    profile.full_name = payload.full_name
    profile.university = payload.university
    profile.faculty = payload.faculty
    profile.bio = payload.bio
    profile.portfolio_url = payload.portfolio_url
    profile.avatar_url = payload.avatar_url
    profile.interests = payload.interests
    profile.previous_projects = payload.previous_projects
    profile.skills = skills

    db.commit()
    db.refresh(profile)
    return profile
