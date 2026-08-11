"""
Admin paneli endpoint-ləri.

TƏHLÜKƏSİZLİK QEYDİ:
Admin statusu (`users.is_admin`) YALNIZ verilənlər bazasından əl ilə
təyin olunur — buradakı heç bir endpoint onu dəyişmir. Yəni admin
API vasitəsilə yeni admin yarada bilməz. Bu, qəsdən belədir.

İlk admini təyin etmək üçün DB-də:
    UPDATE users SET is_admin = true WHERE email = 'sizin@qu.edu.az';

Bütün endpoint-lər `require_admin` ilə qorunub — admin olmayan
istifadəçi 403 alır.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app import models, schemas

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


@router.get(
    "/stats",
    response_model=schemas.AdminStatsResponse,
    summary="Ümumi statistika",
)
def get_stats(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    return schemas.AdminStatsResponse(
        total_users=db.query(models.User).count(),
        blocked_users=db.query(models.User).filter(models.User.is_blocked.is_(True)).count(),
        total_projects=db.query(models.Project).count(),
        open_projects=db.query(models.Project).filter(models.Project.status == "open").count(),
        total_applications=db.query(models.Application).count(),
        total_skills=db.query(models.Skill).count(),
    )


@router.get(
    "/users",
    response_model=list[schemas.AdminUserResponse],
    summary="Bütün istifadəçilər",
)
def list_users(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
    search: str | None = Query(default=None, description="Username və ya email-də axtarış"),
    blocked: bool | None = Query(default=None, description="Yalnız bloklanmışlar/bloklanmamışlar"),
):
    q = db.query(models.User)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            models.User.username.ilike(pattern) | models.User.email.ilike(pattern)
        )
    if blocked is not None:
        q = q.filter(models.User.is_blocked.is_(blocked))
    return q.order_by(models.User.id).all()


@router.patch(
    "/users/{user_id}/block",
    response_model=schemas.AdminUserResponse,
    summary="İstifadəçini blokla / bloku götür",
    description=(
        "Bloklanmış istifadəçi silinmir — məlumatları (layihələri, "
        "müraciətləri) qalır, sadəcə login edə bilmir və mövcud tokeni "
        "də etibarsız olur."
    ),
)
def set_user_blocked(
    user_id: int,
    payload: schemas.BlockUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="İstifadəçi tapılmadı"
        )

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Öz hesabınızı bloklaya bilməzsiniz",
        )

    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin hesabı bloklana bilməz",
        )

    user.is_blocked = payload.is_blocked
    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/projects",
    response_model=list[schemas.ProjectResponse],
    summary="Bütün layihələr (moderasiya üçün)",
)
def list_all_projects(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
    search: str | None = Query(default=None, description="Başlıqda axtarış"),
):
    q = db.query(models.Project)
    if search:
        q = q.filter(models.Project.title.ilike(f"%{search}%"))
    return q.order_by(models.Project.created_at.desc()).all()


@router.delete(
    "/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Layihəni sil (moderasiya)",
    description=(
        "Admin uyğunsuz məzmunlu layihəni silə bilər. Adi istifadəçidən "
        "fərqli olaraq, admin sahibi olmadığı layihəni də silə bilir."
    ),
)
def delete_any_project(
    project_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Layihə tapılmadı"
        )
    db.delete(project)
    db.commit()
    return None


@router.delete(
    "/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Bacarığı sil (moderasiya)",
    description=(
        "Səhv/təkrar yaradılmış bacarıqları təmizləmək üçün. "
        "Bacarıq silinəndə, ona bağlı profillərdən və layihələrdən də "
        "avtomatik çıxarılır."
    ),
)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bacarıq tapılmadı"
        )
    db.delete(skill)
    db.commit()
    return None
