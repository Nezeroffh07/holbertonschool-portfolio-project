"""
Project (Project Board) endpoint-ləri — tam CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    get_current_user,
    require_ownership,
)
from app import models, schemas

router = APIRouter(prefix="/projects", tags=["Projects"])


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.is_deleted.is_(False))
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layihə tapılmadı",
        )
    return project


def _get_roles_or_400(role_ids: list[int], db: Session) -> list[models.Role]:
    if not role_ids:
        return []
    roles = db.query(models.Role).filter(models.Role.id.in_(role_ids)).all()
    missing = set(role_ids) - {r.id for r in roles}
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bu role_id-lər mövcud deyil: {sorted(missing)}",
        )
    return roles


def _get_skills_or_400(skill_ids: list[int], db: Session) -> list[models.Skill]:
    if not skill_ids:
        return []
    skills = db.query(models.Skill).filter(models.Skill.id.in_(skill_ids)).all()
    missing = set(skill_ids) - {s.id for s in skills}
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bu skill_id-lər mövcud deyil: {sorted(missing)}",
        )
    return skills


@router.get(
    "",
    response_model=list[schemas.ProjectResponse],
    summary="Layihələri siyahıla (axtarış, filtr və səhifələmə ilə)",
    description=(
        "Nəticələr səhifələnir (default: 20). Çox sayda layihə olanda "
        "hamısını bir dəfəyə çəkməmək üçün `limit` və `offset` istifadə edin.\n\n"
        "Ümumi sayı cavabın `X-Total-Count` header-indən oxumaq olar."
    ),
)
def list_projects(
    response: Response,
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, description="Başlıqda axtarış"),
    status_filter: str | None = Query(
        default=None, alias="status", pattern=schemas.PROJECT_STATUS_PATTERN
    ),
    role_id: int | None = Query(default=None, description="Bu rolu tələb edən layihələr"),
    skill_id: int | None = Query(default=None, description="Bu bacarığı tələb edən layihələr"),
    owner_id: int | None = Query(default=None, description="Bu istifadəçinin sahib olduğu layihələr"),
    limit: int = Query(default=20, ge=1, le=100, description="Bir səhifədə neçə layihə"),
    offset: int = Query(default=0, ge=0, description="Neçə layihə buraxılsın"),
):
    q = db.query(models.Project).filter(models.Project.is_deleted.is_(False))
    if search:
        q = q.filter(models.Project.title.ilike(f"%{search}%"))
    if status_filter:
        q = q.filter(models.Project.status == status_filter)
    if role_id:
        q = q.filter(models.Project.required_roles.any(models.Role.id == role_id))
    if skill_id:
        q = q.filter(models.Project.required_skills.any(models.Skill.id == skill_id))
    if owner_id:
        q = q.filter(models.Project.owner_id == owner_id)

    # Frontend "neçə səhifə var" hesablaya bilsin deyə ümumi sayı header-də veririk
    response.headers["X-Total-Count"] = str(q.count())

    return (
        q.order_by(models.Project.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get(
    "/{project_id}",
    response_model=schemas.ProjectResponse,
    summary="Tək layihənin detalları",
)
def get_project(project_id: int, db: Session = Depends(get_db)):
    return _get_project_or_404(project_id, db)


@router.post(
    "",
    response_model=schemas.ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni layihə yarat",
)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    roles = _get_roles_or_400(payload.required_role_ids, db)
    skills = _get_skills_or_400(payload.required_skill_ids, db)

    # Əgər ayrıca rol seçilməyibsə amma skill-lər seçilibsə, həmin skill-lərin rollarını avtomatik qoş
    if not roles and skills:
        role_ids = {s.role_id for s in skills if s.role_id is not None}
        if role_ids:
            roles = db.query(models.Role).filter(models.Role.id.in_(role_ids)).all()

    project = models.Project(
        title=payload.title,
        description=payload.description,
        open_positions=payload.open_positions,
        application_deadline=payload.application_deadline,
        owner_id=token_user.id,
        required_roles=roles,
        required_skills=skills,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put(
    "/{project_id}",
    response_model=schemas.ProjectResponse,
    summary="Layihəni yenilə (yalnız göndərilən sahələr dəyişir)",
)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    require_ownership(
        token_user.id, project.owner_id,
        "Yalnız layihə sahibi bu layihəni dəyişə bilər",
    )
    data = payload.model_dump(exclude_unset=True)

    if "required_role_ids" in data:
        role_ids = data.pop("required_role_ids")
        if role_ids is not None:
            project.required_roles = _get_roles_or_400(role_ids, db)

    if "required_skill_ids" in data:
        skill_ids = data.pop("required_skill_ids")
        if skill_ids is not None:
            skills = _get_skills_or_400(skill_ids, db)
            project.required_skills = skills
            # Əgər layihənin rolları boşdursa, skkill-lərin rollarını əlavə et
            if not project.required_roles and skills:
                role_ids = {s.role_id for s in skills if s.role_id is not None}
                if role_ids:
                    project.required_roles = db.query(models.Role).filter(models.Role.id.in_(role_ids)).all()

    for field, value in data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Layihəni sil",
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    require_ownership(
        token_user.id, project.owner_id,
        "Yalnız layihə sahibi bu layihəni silə bilər",
    )
    project.is_deleted = True
    db.commit()
    return None
