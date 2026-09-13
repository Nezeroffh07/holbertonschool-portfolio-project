"""
Role endpoint-ləri.

Rollar (Skill-lərə bənzər şəkildə) layihələr üzrə "lazım olan mövqələr"
kataloqudur: məs. "Frontend Developer", "Backend Developer", "UI/UX Designer".
Fərq: hər rolun bir `description`-ı var — admin bu rolda olan komanda
üzvünün nə etməli olduğunu izah edir. Frontend-də layihə səhifəsində rolun
üstünə basanda bu təsvir göstərilir.

  - GET    /roles          — hər kəs görə bilər (layihə yaradanda / müraciət
                              edəndə seçim üçün dropdown)
  - GET    /roles/{id}     — tək rolun detalı (adı + admin izahı)
  - POST   /roles          — yalnız admin yeni rol yarada bilər
  - PATCH  /roles/{id}     — yalnız admin rolun təsvirini yeniləyə bilər
  - DELETE /roles/{id}     — yalnız admin (rol silinəndə layihələrdən və
                              müraciətlərdən avtomatik çıxarılır)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app import models, schemas

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get(
    "",
    response_model=list[schemas.RoleResponse],
    summary="Bütün rolların siyahısı (təsviri ilə birlikdə)",
)
def list_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).order_by(models.Role.name).all()


@router.get(
    "/{role_id}",
    response_model=schemas.RoleResponse,
    summary="Tək rolun detalı — admin izahı ilə birlikdə",
    description=(
        "Frontend-də layihə səhifəsində bir rolun üstünə basanda, həmin "
        "rolun 'nə etməli olduğu' mətnini göstərmək üçün istifadə olunur."
    ),
)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol tapılmadı")
    return role


@router.post(
    "",
    response_model=schemas.RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni rol yarat (yalnız admin)",
    description="Rol siyahısının nizamlı qalması üçün yalnız admin yeni rol əlavə edə bilər.",
)
def create_role(
    payload: schemas.RoleCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    normalized = payload.name.strip()
    existing = (
        db.query(models.Role)
        .filter(models.Role.name.ilike(normalized))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu rol artıq mövcuddur",
        )

    role = models.Role(name=normalized, description=payload.description)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.patch(
    "/{role_id}",
    response_model=schemas.RoleResponse,
    summary="Rolun təsvirini yenilə (yalnız admin)",
    description="Bu rolda olan komanda üzvünün nə etməli olduğunu izah edən mətni admin dəyişir.",
)
def update_role_description(
    role_id: int,
    payload: schemas.RoleDescriptionUpdate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol tapılmadı")
    role.description = payload.description
    db.commit()
    db.refresh(role)
    return role


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Rolu sil (yalnız admin)",
    description=(
        "Səhv/təkrar yaradılmış rolları təmizləmək üçün. Rol silinəndə, "
        "ona bağlı layihələrdən və müraciətlərdən də avtomatik çıxarılır."
    ),
)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol tapılmadı")
    db.delete(role)
    db.commit()
    return None
