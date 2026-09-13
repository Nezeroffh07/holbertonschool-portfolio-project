"""
Application (Team Matching) endpoint-ləri.

Axın:
  1. İstifadəçi bir layihəyə müraciət edir → POST /projects/{id}/apply
  2. Layihə sahibi müraciətlərə baxır → GET /projects/{id}/applications
  3. Sahib qəbul/rədd edir → PATCH /applications/{id}
  4. İstifadəçi öz müraciətlərini görür → GET /users/{id}/applications

Qeyd: ayrıca "TeamMember" cədvəli yoxdur — status="accepted" olan
Application sətirləri komanda üzvləri kimi sayılır.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    get_current_user,
    require_ownership,
)
from app import models, schemas

router = APIRouter(tags=["Team Matching"])


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.is_deleted.is_(False))
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Layihə tapılmadı"
        )
    return project


def _accepted_count(project_id: int, db: Session) -> int:
    return (
        db.query(models.Application)
        .filter(
            models.Application.project_id == project_id,
            models.Application.status == "accepted",
        )
        .count()
    )


@router.post(
    "/projects/{project_id}/apply",
    response_model=schemas.ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Layihəyə müraciət et",
)
def apply_to_project(
    project_id: int,
    payload: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    applicant_id = token_user.id

    if project.owner_id == applicant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Öz layihənizə müraciət edə bilməzsiniz",
        )

    if project.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu layihə artıq müraciətləri qəbul etmir",
        )

    if project.application_deadline is not None and project.application_deadline < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu layihənin müraciət qəbulu tarixi bitib",
        )

    if payload.role_id not in {r.id for r in project.required_roles}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seçdiyiniz rol bu layihənin lazım olan rolları arasında deyil",
        )

    application = models.Application(
        project_id=project_id,
        applicant_id=applicant_id,
        role_id=payload.role_id,
        message=payload.message,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu layihəyə artıq müraciət etmisiniz",
        )
    db.refresh(application)
    return application


@router.get(
    "/projects/{project_id}/applications",
    response_model=list[schemas.ApplicationResponse],
    summary="Layihəyə gələn bütün müraciətlər (layihə sahibi üçün)",
)
def list_project_applications(
    project_id: int,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    require_ownership(
        token_user.id, project.owner_id,
        "Yalnız layihə sahibi müraciətləri görə bilər",
    )
    return (
        db.query(models.Application)
        .filter(models.Application.project_id == project_id)
        .order_by(models.Application.created_at.desc())
        .all()
    )


@router.get(
    "/users/{user_id}/applications",
    response_model=list[schemas.ApplicationResponse],
    summary="İstifadəçinin etdiyi bütün müraciətlər",
    description="Token tələb olunur — yalnız öz müraciətlərinizi görə bilərsiniz.",
)
def list_user_applications(
    user_id: int,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    require_ownership(
        token_user.id, user_id,
        "Yalnız öz müraciətlərinizi görə bilərsiniz",
    )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="İstifadəçi tapılmadı"
        )
    return (
        db.query(models.Application)
        .filter(models.Application.applicant_id == user_id)
        .order_by(models.Application.created_at.desc())
        .all()
    )


@router.patch(
    "/applications/{application_id}",
    response_model=schemas.ApplicationResponse,
    summary="Müraciəti qəbul et / rədd et",
)
def update_application_status(
    application_id: int,
    payload: schemas.ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    application = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Müraciət tapılmadı"
        )

    project = application.project

    require_ownership(
        token_user.id, project.owner_id,
        "Yalnız layihə sahibi müraciətlərə qərar verə bilər",
    )

    if application.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bu müraciət artıq '{application.status}' statusundadır, dəyişdirilə bilməz",
        )

    if payload.status == "accepted":
        if _accepted_count(project.id, db) >= project.open_positions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Layihədə boş mövqe qalmayıb",
            )

    application.status = payload.status
    db.commit()

    if payload.status == "accepted" and _accepted_count(project.id, db) >= project.open_positions:
        project.status = "closed"
        db.commit()

    db.refresh(application)
    return application
