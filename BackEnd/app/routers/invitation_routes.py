"""
Invitation (Layihə Sahibinin Dəvətləri) endpoint-ləri.

Axın:
  1. Layihə sahibi bir istifadəçini (Community/profil siyahısından) öz
     layihəsinə dəvət edir → POST /projects/{project_id}/invitations
  2. Dəvət olunan istifadəçi öz dəvətlərini görür → GET /invitations/me
  3. Dəvət olunan qəbul/rədd edir → PATCH /invitations/{invitation_id}

Qeyd: Application (Team Matching) əks istiqamətdədir — orada istifadəçi
layihəyə müraciət edir. Burada isə layihə sahibi istifadəçini dəvət edir.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_ownership
from app import models, schemas

router = APIRouter(tags=["Invitations"])


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project).filter(models.Project.id == project_id).first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Layihə tapılmadı"
        )
    return project


@router.post(
    "/projects/{project_id}/invitations",
    response_model=schemas.InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Layihəyə istifadəçi dəvət et (yalnız layihə sahibi)",
)
def invite_user_to_project(
    project_id: int,
    payload: schemas.InvitationCreate,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    require_ownership(
        token_user.id, project.owner_id,
        "Yalnız layihə sahibi dəvət göndərə bilər",
    )

    if project.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu layihə artıq yeni üzv və ya dəvət qəbul etmir",
        )

    invited_user = (
        db.query(models.User)
        .filter(models.User.id == payload.invited_user_id)
        .first()
    )
    if not invited_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invited_user_id-yə uyğun istifadəçi tapılmadı",
        )

    if invited_user.id == token_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Özünüzü öz layihənizə dəvət edə bilməzsiniz",
        )

    # Artıq komandada olan istifadəçini yenidən dəvət etməyin qarşısını alırıq
    already_member = (
        db.query(models.Application)
        .filter(
            models.Application.project_id == project_id,
            models.Application.applicant_id == payload.invited_user_id,
            models.Application.status == "accepted",
        )
        .first()
    )
    if already_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu istifadəçi artıq bu layihənin komanda üzvüdür",
        )

    invitation = models.Invitation(
        project_id=project_id,
        invited_user_id=payload.invited_user_id,
        role=payload.role,
        message=payload.message,
    )
    db.add(invitation)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu istifadəçi artıq bu layihəyə dəvət olunub",
        )
    db.refresh(invitation)
    return invitation


@router.get(
    "/invitations/me",
    response_model=list[schemas.InvitationMeResponse],
    summary="Mənə gələn bütün dəvətlər",
)
def list_my_invitations(
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    invitations = (
        db.query(models.Invitation)
        .filter(models.Invitation.invited_user_id == token_user.id)
        .order_by(models.Invitation.created_at.desc())
        .all()
    )
    return [
        schemas.InvitationMeResponse(
            id=inv.id,
            project_id=inv.project_id,
            project_title=inv.project.title,
            owner_id=inv.project.owner_id,
            owner_username=inv.project.owner.username,
            role=inv.role,
            message=inv.message,
            status=inv.status,
            created_at=inv.created_at,
        )
        for inv in invitations
    ]


@router.patch(
    "/invitations/{invitation_id}",
    response_model=schemas.InvitationResponse,
    summary="Dəvəti qəbul et / rədd et (yalnız dəvət olunan istifadəçi)",
)
def update_invitation_status(
    invitation_id: int,
    payload: schemas.InvitationStatusUpdate,
    db: Session = Depends(get_db),
    token_user: models.User = Depends(get_current_user),
):
    invitation = (
        db.query(models.Invitation)
        .filter(models.Invitation.id == invitation_id)
        .first()
    )
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Dəvət tapılmadı"
        )

    require_ownership(
        token_user.id, invitation.invited_user_id,
        "Yalnız dəvət olunan istifadəçi qərar verə bilər",
    )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Bu dəvət artıq '{invitation.status}' statusundadır, "
                "dəyişdirilə bilməz"
            ),
        )

    project = invitation.project

    if payload.status == "accepted":
        if project.status != "open":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu layihə artıq yeni komanda üzvü qəbul etmir",
            )

        # Komandadakı mövcud qəbul olunmuş üzv sayını yoxlayırıq
        accepted_count = (
            db.query(models.Application)
            .filter(
                models.Application.project_id == project.id,
                models.Application.status == "accepted",
            )
            .count()
        )
        if accepted_count >= project.open_positions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Layihədə boş mövqe qalmayıb",
            )

        # Əgər əvvəlcədən Application sətiri varsa yeniləyirik, yoxdursa yaradırıq (TeamMember)
        application = (
            db.query(models.Application)
            .filter(
                models.Application.project_id == invitation.project_id,
                models.Application.applicant_id == invitation.invited_user_id,
            )
            .first()
        )
        if application:
            application.status = "accepted"
            if invitation.role:
                application.role = invitation.role
        else:
            application = models.Application(
                project_id=invitation.project_id,
                applicant_id=invitation.invited_user_id,
                message=invitation.message or "Dəvət qəbul edildi",
                status="accepted",
                role=invitation.role,
            )
            db.add(application)

        invitation.status = "accepted"
        db.commit()

        # Boş yer dolubsa layihəni avtomatik bağlayırıq
        new_accepted_count = (
            db.query(models.Application)
            .filter(
                models.Application.project_id == project.id,
                models.Application.status == "accepted",
            )
            .count()
        )
        if new_accepted_count >= project.open_positions:
            project.status = "closed"
            db.commit()
    else:
        invitation.status = payload.status
        db.commit()

    db.refresh(invitation)
    return invitation
