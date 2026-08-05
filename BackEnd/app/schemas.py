"""
Pydantic sxemləri — API-yə gələn/gedən datanın forması.

Qeyd (Sprint 2 üçün bilərəkdən sadələşdirmə):
JWT/token sistemi bu sprintdə əlavə edilməyib (acceptance criteria bunu
tələb etmir). Ona görə "bu sorğunu edən kimdir" məlumatı hələ tokendən
deyil, sorğunun özündən (`owner_id`, `applicant_id`) gəlir. Bu, təhlükəsiz
deyil (istənilən adam özünü başqası kimi göstərə bilər) və sadəcə müvəqqəti
həlldir — real auth (JWT + "cari istifadəçi" asılılığı) sonrakı sprintdə
əlavə olunanda bu sahələr request body-dən çıxarılıb token-dən avtomatik
alınacaq.
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

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


# ---------- Project ----------

class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10, max_length=3000)
    open_positions: int = Field(default=1, ge=1, le=50)
    application_deadline: Optional[date] = None
    required_skill_ids: list[int] = Field(default_factory=list)
    owner_id: int  # bax: fayl başındakı qeyd — sonrakı sprintdə token-dən gələcək


class ProjectUpdate(BaseModel):
    """Bütün sahələr optional — yalnız göndərilənlər yenilənir."""
    title: Optional[str] = Field(default=None, min_length=3, max_length=150)
    description: Optional[str] = Field(default=None, min_length=10, max_length=3000)
    open_positions: Optional[int] = Field(default=None, ge=1, le=50)
    application_deadline: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(open|closed)$")
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
    applicant_id: int  # bax: fayl başındakı qeyd
    message: Optional[str] = Field(default=None, max_length=1000)


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|rejected)$")


class ApplicationResponse(BaseModel):
    id: int
    project_id: int
    applicant_id: int
    message: Optional[str]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
