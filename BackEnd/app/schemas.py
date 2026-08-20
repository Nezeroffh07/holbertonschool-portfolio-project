"""
Pydantic sxemləri — API-yə gələn/gedən datanın forması.

Qeyd (Sprint 3 — JWT keçid dövrü):
Artıq JWT token sistemi var. "Bu sorğunu edən kimdir" məlumatı
`Authorization: Bearer <token>` header-indən alınır.

`owner_id` / `applicant_id` sahələri hələ sxemlərdə qalır, amma:
  - DEPRECATED olaraq işarələnib
  - Token göndərilirsə TAMAMILƏ nəzərə alınmır (token üstündür)
  - Yalnız hələ JWT-yə keçməmiş köhnə frontend kodu sınmasın deyə saxlanılıb

Frontend tam keçidi bitirəndən sonra bu sahələr silinməlidir.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


# ---------- Auth (Sprint 1-dən) ----------

ALLOWED_EMAIL_DOMAIN = "qu.edu.az"


class UserCreate(BaseModel):
    """Sign Up zamanı gələn data."""
    username: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=36)

    @field_validator("email")
    @classmethod
    def email_must_be_corporate(cls, value: str) -> str:
        domain = value.split("@")[-1].lower()
        if domain != ALLOWED_EMAIL_DOMAIN:
            raise ValueError(f"Qeydiyyat yalnız @{ALLOWED_EMAIL_DOMAIN} email-ləri ilə mümkündür")
        return value


class UserLogin(BaseModel):
    """Login zamanı gələn data."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Şifrəni HEÇ VAXT geri qaytarmırıq — yalnız təhlükəsiz sahələr."""
    id: int
    username: str
    email: EmailStr
    is_admin: bool = False
  
    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    """Login cavabı — token + istifadəçi məlumatı."""
    message: str
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------- Skill ----------

class SkillCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class SkillResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# ---------- Profile ----------

class ProfileUpsert(BaseModel):
    """Profile yaratmaq/yeniləmək üçün (PUT — varsa yenilə, yoxdursa yarat)."""
    full_name: Optional[str] = Field(default=None, max_length=100)
    university: Optional[str] = Field(default=None, max_length=150)
    faculty: Optional[str] = Field(default=None, max_length=150)
    bio: Optional[str] = Field(default=None, max_length=1000)
    portfolio_url: Optional[str] = Field(default=None, max_length=300)
    skill_ids: list[int] = Field(default_factory=list)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    interests: Optional[str] = Field(
        default=None, max_length=500,
        description="Maraq sahələri (məs. 'Süni intellekt, Robototexnika, UI dizayn')",
        examples=["Süni intellekt, Veb inkişaf, Startup"],
    )
    previous_projects: Optional[str] = Field(
        default=None, max_length=2000,
        description="Əvvəlki layihələr haqqında qısa məlumat",
        examples=["Universitet daxili hackathonda mobil tətbiq (2025)"],
    )
    is_public: bool = Field(
        default=True,
        description="TUP Community kataloqunda görünsün. False — yalnız sən görürsən.",
    )


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str]
    university: Optional[str]
    faculty: Optional[str]
    bio: Optional[str]
    portfolio_url: Optional[str]
    skills: list[SkillResponse]
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    interests: Optional[str] = None
    previous_projects: Optional[str] = None
    is_public: bool = True

    model_config = ConfigDict(from_attributes=True)


class CommunityMemberResponse(BaseModel):
    """
    TUP Community (istifadəçi kataloqu) səhifəsi üçün — Profile-ı
    User-dəki username/email ilə birləşdirir. Yalnız profil yaratmış
    istifadəçilər burada görünür (boş profil kataloqda faydasızdır).
    """
    user_id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    university: Optional[str]
    faculty: Optional[str]
    bio: Optional[str]
    portfolio_url: Optional[str]
    avatar_url: Optional[str]
    interests: Optional[str]
    previous_projects: Optional[str]
    skills: list[SkillResponse]

    model_config = ConfigDict(from_attributes=True)


# ---------- Project ----------

# QEYD: Komanda yoldaşınızın istədiyi "in_progress" və "completed" statusları
# bu repo-ya hələ köçürülməyib — hazırda yalnız open/closed mövcuddur.
# Əlavə etmək istəsəniz, bura yazmaq kifayətdir:
#   PROJECT_STATUS_PATTERN = "^(open|in_progress|completed|closed)$"
PROJECT_STATUS_PATTERN = "^(open|closed)$"

class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10, max_length=3000)
    open_positions: int = Field(default=1, ge=1, le=50)
    application_deadline: Optional[date] = None
    required_skill_ids: list[int] = Field(default_factory=list)
    owner_id: Optional[int] = Field(
        default=None,
        deprecated=True,
        description=(
            "DEPRECATED: Authorization header-i (Bearer token) göndərilirsə "
            "bu sahə lazım deyil və nəzərə alınmır. Yalnız köhnə frontend kodu "
            "üçün saxlanılıb."
        ),
    )


class ProjectUpdate(BaseModel):
    """Bütün sahələr optional — yalnız göndərilənlər yenilənir."""
    title: Optional[str] = Field(default=None, min_length=3, max_length=150)
    description: Optional[str] = Field(default=None, min_length=10, max_length=3000)
    open_positions: Optional[int] = Field(default=None, ge=1, le=50)
    application_deadline: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern=PROJECT_STATUS_PATTERN)
    required_skill_ids: Optional[list[int]] = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str
    open_positions: int
    application_deadline: Optional[date]
    status: str
    owner_id: int
    created_at: datetime
    required_skills: list[SkillResponse]

    model_config = ConfigDict(from_attributes=True)


# ---------- Application (Team Matching) ----------

class ApplicationCreate(BaseModel):
    applicant_id: Optional[int] = Field(
        default=None,
        deprecated=True,
        description=(
            "DEPRECATED: Authorization header-i (Bearer token) göndərilirsə "
            "bu sahə lazım deyil və nəzərə alınmır. Yalnız köhnə frontend kodu "
            "üçün saxlanılıb."
        ),
    )
    message: Optional[str] = Field(default=None, max_length=1000)


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|rejected)$")


class ApplicationResponse(BaseModel):
    id: int
    project_id: int
    applicant_id: int
    message: Optional[str]
    status: str
    role: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Invitation (Layihə Sahibinin Dəvətləri) ----------

class InvitationCreate(BaseModel):
    invited_user_id: int
    role: Optional[str] = Field(
        default=None, max_length=50, examples=["Frontend Developer"]
    )
    message: Optional[str] = Field(default=None, max_length=1000)


class InvitationStatusUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|rejected)$")


class InvitationResponse(BaseModel):
    id: int
    project_id: int
    invited_user_id: int
    role: Optional[str]
    message: Optional[str]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvitationMeResponse(BaseModel):
    """GET /invitations/me üçün — dəvəti aldığı layihə/sahib məlumatı ilə birlikdə."""
    id: int
    project_id: int
    project_title: str
    owner_id: int
    owner_username: str
    role: Optional[str]
    message: Optional[str]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Collaboration Dashboard ----------

class TeamMemberResponse(BaseModel):
    """Layihənin bir komanda üzvü — Application-ın 'accepted' halının
    Dashboard üçün göstərilən görünüşüdür."""
    application_id: int
    user_id: int
    username: str
    email: EmailStr
    role: Optional[str] = None
    joined_at: datetime


class RoleUpdate(BaseModel):
    role: str = Field(min_length=1, max_length=50, examples=["Frontend Developer"])


# ---------- Admin Panel ----------

class AdminUserResponse(BaseModel):
    """Admin panelində göstərilən istifadəçi məlumatı.
    Şifrə (hash daxil) HEÇ VAXT qaytarılmır."""
    id: int
    username: str
    email: EmailStr
    is_admin: bool
    is_blocked: bool

    model_config = ConfigDict(from_attributes=True)


class BlockUpdate(BaseModel):
    is_blocked: bool = Field(
        description="true — hesabı blokla, false — bloku götür",
        examples=[True],
    )


class AdminStatsResponse(BaseModel):
    """Admin panelinin ümumi statistikası."""
    total_users: int
    blocked_users: int
    total_projects: int
    open_projects: int
    total_applications: int
    total_skills: int
