"""
Project (Project Board) endpoint-ləri — tam CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    get_current_user,
    get_current_user_optional,
    resolve_actor_id,
    require_ownership,
)
from app import models, schemas

router = APIRouter(prefix="/projects", tags=["Projects"])


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project).filter(models.Project.id == project_id).first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layihə tapılmadı",
        )
    return project


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
    summary="Layihələri siyahıla (axtarış və filtrlə birlikdə)",
)
def list_projects(
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, description="Başlıqda axtarış"),
    status_filter: str | None = Query(
        default=None, alias="status", pattern="^(open|closed)$"
    ),
    skill_id: int | None = Query(default=None, description="Bu bacarığı tələb edən layihələr"),
):
    q = db.query(models.Project)
    if search:
        q = q.filter(models.Project.title.ilike(f"%{search}%"))
    if status_filter:
        q = q.filter(models.Project.status == status_filter)
    if skill_id:
        q = q.filter(models.Project.required_skills.any(models.Skill.id == skill_id))
    return q.order_by(models.Project.created_at.desc()).all()


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
    token_user: models.User | None = Depends(get_current_user_optional),
):
    owner_id = resolve_actor_id(token_user, payload.owner_id)

    owner = db.query(models.User).filter(models.User.id == owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="owner_id-yə uyğun istifadəçi tapılmadı",
        )
    skills = _get_skills_or_400(payload.required_skill_ids, db)

    project = models.Project(
        title=payload.title,
        description=payload.description,
        open_positions=payload.open_positions,
        application_deadline=payload.application_deadline,
        owner_id=owner_id,
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

    if "required_skill_ids" in data:
        skill_ids = data.pop("required_skill_ids")
        project.required_skills = _get_skills_or_400(skill_ids, db)

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
    db.delete(project)
    db.commit()
    return None
