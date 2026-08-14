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
from fastapi import APIRouter, Depends, HTTPException, status
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
def list_skills(db: Session = Depends(get_db)):
    return db.query(models.Skill).order_by(models.Skill.name).all()


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

    new_skill = models.Skill(name=normalized)
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill
