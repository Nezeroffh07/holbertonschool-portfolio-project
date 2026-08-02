"""
Application (Team Matching) endpoint-ləri.

Axn:
  1. İstifadəçi bir layihəyə müraciət edir → POST /projects/{id}/apply
  2. Layihə sahibi müraciətlərə baxr → GET /projects/{id}/applications
  3. Sahib qəbul/rədd edir → PATCH /applications/{id}
  4. İstifadəçi öz müraciətlərini görür → GET /users/{id}/applications

Qeyd: ayrca "TeamMember" cədvəli yoxdur — status="accepted" olan
Application sətirləri komanda üzvləri kimi saylr.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(tags=["Team Matching"])


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project).filter(models.Project.id == project_id).first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Layihə taplmadı"
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
    project_id: int, payload: schemas.ApplicationCreate, db: Session = Depends(get_db)
):
    project = _get_project_or_404(project_id, db)

    applicant = (
        db.query(models.User).filter(models.User.id == payload.applicant_id).first()
    )
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="applicant_id-yə uyğun istifadəçi taplmad",
        )

    if project.owner_id == payload.applicant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Öz layihənizə müraciət edə bilməzsiniz",
        )

    if project.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu layihə artq müraciətləri qəbul etmir",
        )

    application = models.Application(
        project_id=project_id,
        applicant_id=payload.applicant_id,
        message=payload.message,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu layihəyə artq müraciət etmisiniz",
        )
    db.refresh(application)
    return application


@router.get(
    "/projects/{project_id}/applications",
    response_model=list[schemas.ApplicationResponse],
    summary="Layihəyə gələn bütün müraciətlər (layihə sahibi üçün)",
)
def list_project_applications(project_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(project_id, db)
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
)
def list_user_applications(user_id: int, db: Session = Depends(get_db)):
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

    if application.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bu müraciət artq '{application.status}' statusundadır, dəyişdirilə bilməz",
        )

    project = application.project

    if payload.status == "accepted":
        if _accepted_count(project.id, db) >= project.open_positions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Layihədə boş mövqe qalmayb",
            )

    application.status = payload.status
    db.commit()

    # Boş mövqe qalmayıbsa, layihəni avtomatik bağla
    if payload.status == "accepted" and _accepted_count(project.id, db) >= project.open_positions:
        project.status = "closed"
        db.commit()

    db.refresh(application)
    return application
