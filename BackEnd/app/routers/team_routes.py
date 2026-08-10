"""
Collaboration Dashboard endpoint-ləri.

TUP sənədinə görə: "Komanda üzvləri layihə haqqında məlumatları izləyə,
komandanın strukturunu görə, üzvlərin rollarını idarə edə bilməlidirlər."

Ayrıca "TeamMember" cədvəli yoxdur (əvvəlki qərara sadiqik) — bu endpoint-lər
sadəcə Application.status == "accepted" olan sətirləri "komanda üzvü" kimi
göstərir. Rol məlumatı da elə Application-ın üzərindəki `role` sütununda
saxlanılır.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_ownership
from app import models, schemas

router = APIRouter(prefix="/projects/{project_id}/team", tags=["Collaboration Dashboard"])


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Layihə tapılmadı"
        )
    return project


@router.get(
    "",
    response_model=list[schemas.TeamMemberResponse],
    summary="Layihənin komanda üzvləri",
    description=(
        "Layihəyə qəbul olunmuş (status=accepted) bütün müraciətçiləri, "
        "onların rolları ilə birlikdə qaytarır. Komanda strukturunu görmək "
        "üçün istifadə olunur — istənilən istifadəçi baxa bilər (yalnız "
        "rolu dəyişmək sahibə məxsusdur)."
    ),
)
def list_team_members(project_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(project_id, db)

    accepted_applications = (
        db.query(models.Application)
        .filter(
            models.Application.project_id == project_id,
            models.Application.status == "accepted",
        )
        .order_by(models.Application.created_at.asc())
        .all()
    )

    return [
        schemas.TeamMemberResponse(
            application_id=app.id,
            user_id=app.applicant.id,
            username=app.applicant.username,
            email=app.applicant.email,
            role=app.role,
            joined_at=app.created_at,
        )
        for app in accepted_applications
    ]


@router.patch(
    "/{user_id}/role",
    response_model=schemas.TeamMemberResponse,
    summary="Komanda üzvünün rolunu təyin et/dəyiş",
    description="Yalnız layihə sahibi komanda üzvlərinin rolunu idarə edə bilər.",
)
def update_member_role(
    project_id: int,
    user_id: int,
    payload: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    require_ownership(
        token_user.id, project.owner_id,
        "Yalnız layihə sahibi komanda üzvlərinin rolunu dəyişə bilər",
    )

    application = (
        db.query(models.Application)
        .filter(
            models.Application.project_id == project_id,
            models.Application.applicant_id == user_id,
            models.Application.status == "accepted",
        )
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu istifadəçi layihənin qəbul olunmuş komanda üzvü deyil",
        )

    application.role = payload.role
    db.commit()
    db.refresh(application)

    return schemas.TeamMemberResponse(
        application_id=application.id,
        user_id=application.applicant.id,
        username=application.applicant.username,
        email=application.applicant.email,
        role=application.role,
        joined_at=application.created_at,
    )
