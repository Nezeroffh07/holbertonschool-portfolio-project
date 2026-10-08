"""
Skill endpoint-ləri.

Skill-lər həm Profile (istifadəçinin bacarıqları), həm də Project
(tələb olunan bacarıqlar) tərəfindən istifadə olunan ortaq bir siyahıdır.
Frontend GET /skills ilə mövcud siyahını çəkib dropdown göstərir.

Sprint 4 qeydi: POST /skills yalnız admin üçündür — bacarıq siyahısının
təkrarlanmış/nizamsız yazılışlarla (məs. "React" və "react.js" ayrı-ayrı
sətir kimi) dolmasının qarşısını almaq üçün, komanda mərkəzləşdirilmiş
şəkildə idarə edir.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app import models, schemas

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get(
    "",
    response_model=list[schemas.SkillResponse],
    summary="Bütün bacarıqların siyahısı",
)
def list_skills(
    role_id: Optional[int] = Query(default=None, description="Rola görə filtrlə"),
    db: Session = Depends(get_db),
):
    q = db.query(models.Skill)
    if role_id is not None:
        q = q.filter(models.Skill.role_id == role_id)
    return q.order_by(models.Skill.name).all()


@router.post(
    "",
    response_model=schemas.SkillResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni bacarıq yarat (yalnız admin)",
    description="Bacarıq siyahısının nizamlı qalması üçün yalnız admin yeni bacarıq əlavə edə bilər.",
)
def create_skill(
    skill: schemas.SkillCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    normalized = skill.name.strip()
    existing = (
        db.query(models.Skill)
        .filter(models.Skill.name.ilike(normalized))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu bacarıq artıq mövcuddur",
        )

    if skill.role_id is not None:
        role = db.query(models.Role).filter(models.Role.id == skill.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seçilmiş rol tapılmadı",
            )

    new_skill = models.Skill(name=normalized, role_id=skill.role_id)
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


@router.patch(
    "/{skill_id}",
    response_model=schemas.SkillResponse,
    summary="Bacarığı yenilə (rolunu və ya adını dəyiş — yalnız admin)",
)
def update_skill(
    skill_id: int,
    payload: schemas.SkillUpdate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bacarıq tapılmadı")

    if payload.name is not None:
        normalized = payload.name.strip()
        existing = (
            db.query(models.Skill)
            .filter(models.Skill.name.ilike(normalized), models.Skill.id != skill_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu bacarıq artıq mövcuddur",
            )
        skill.name = normalized

    if payload.role_id is not None:
        role = db.query(models.Role).filter(models.Role.id == payload.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seçilmiş rol tapılmadı",
            )
        skill.role_id = payload.role_id

    db.commit()
    db.refresh(skill)
    return skill


@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Bacarığı sil (yalnız admin)",
)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bacarıq tapılmadı")
    db.delete(skill)
    db.commit()
    return None
