"""
TUP Community — bütün istifadəçilərin profil kataloqu.

Frontend-də "Find a Team" bölməsinin əvəzinə gələn "TUP Community"
səhifəsi üçün: universitetdəki bütün istifadəçilərin profillərini
(ad, fakültə, bio, bacarıqlar, portfolio, maraq sahələri) siyahı kimi
göstərir.

Qərarlar:
  - Yalnız profil YARATMIŞ istifadəçilər görünür (boş profil kataloqda
    faydasızdır) — GET /users/{id}/profile-dan fərqli olaraq burda 404
    yoxdur, sadəcə həmin istifadəçi siyahıda olmur.
  - Token tələb olunur (açıq/tokensiz kataloq deyil).
  - Axtarış (ad/fakültə üzrə) və bacarıq filtri + səhifələmə var —
    /projects endpoint-i ilə eyni nümunə.
"""
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import models, schemas

router = APIRouter(prefix="/community", tags=["Community"])


@router.get(
    "",
    response_model=list[schemas.CommunityMemberResponse],
    summary="Bütün istifadəçilərin profil kataloqu",
    description=(
        "Yalnız daxil olmuş istifadəçilər görə bilər. Profil yaratmamış "
        "istifadəçilər siyahıda görünmür."
    ),
)
def list_community(
    response: Response,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(get_current_user),
    search: str | None = Query(
        default=None, description="Ad, soyad və ya fakültədə axtarış"
    ),
    skill_id: int | None = Query(
        default=None, description="Bu bacarığa sahib olanlar"
    ),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    q = (
        db.query(models.Profile)
        .join(models.User, models.Profile.user_id == models.User.id)
        .filter(models.Profile.is_public.is_(True))
    )

    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.Profile.full_name.ilike(pattern)
            | models.Profile.faculty.ilike(pattern)
        )
    if skill_id:
        q = q.filter(models.Profile.skills.any(models.Skill.id == skill_id))

    response.headers["X-Total-Count"] = str(q.count())

    profiles = (
        q.order_by(models.Profile.id.asc()).offset(offset).limit(limit).all()
    )

    return [
        schemas.CommunityMemberResponse(
            user_id=p.user_id,
            username=p.user.username,
            email=p.user.email,
            full_name=p.full_name,
            university=p.university,
            faculty=p.faculty,
            bio=p.bio,
            portfolio_url=p.portfolio_url,
            avatar_url=p.avatar_url,
            interests=p.interests,
            previous_projects=p.previous_projects,
            skills=[schemas.SkillResponse.model_validate(s) for s in p.skills],
        )
        for p in profiles
    ]
