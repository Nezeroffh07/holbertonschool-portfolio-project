"""
SQLAlchemy DB modelləri — Sprint 2: Core Features.

Sprint 1-də yalnız User var idi. Bu sprintdə əlavə olunur:
  - Skill            (bacarıq: "Python", "Figma" və s. — həm Profile,
                       həm Project tərəfindən istifadə olunur)
  - Profile          (istifadəçinin bio, universitet/fakültə, portfolio linki)
  - Project          (layihə: başlıq, təsvir, tələb olunan bacarıqlar,
                       boş mövqelər, son müraciət tarixi, sahibi)
  - Application      (istifadəçinin layihəyə müraciəti və statusu)

Qeyd — TeamMember üçün ayrıca cədvəl açılmayıb: Application.status == "accepted"
olan sətirlər həmin layihənin komanda üzvləri kimi oxunur. Bu, eyni məlumatı
iki yerdə saxlamaqdan (data duplication) qaçmaq üçündür.
"""
from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    profile = relationship(
        "Profile", back_populates="user", uselist=False,
        cascade="all, delete-orphan"
    )
    projects = relationship(
        "Project", back_populates="owner", cascade="all, delete-orphan"
    )
    applications = relationship(
        "Application", back_populates="applicant",
        cascade="all, delete-orphan"
    )


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)


# Profile <-> Skill (çox-çoxa: bir profilin bir neçə bacarığı ola bilər)
profile_skills = Table(
    "profile_skills",
    Base.metadata,
    Column("profile_id", ForeignKey("profiles.id"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)

# Project <-> Skill (çox-çoxa: bir layihənin bir neçə tələb olunan bacarığı)
project_skills = Table(
    "project_skills",
    Base.metadata,
    Column("project_id", ForeignKey("projects.id"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False
    )
    full_name = Column(String, nullable=True)
    university = Column(String, nullable=True)
    faculty = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    portfolio_url = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    user = relationship("User", back_populates="profile")
    skills = relationship("Skill", secondary=profile_skills)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    open_positions = Column(Integer, nullable=False, default=1)
    application_deadline = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="open")  # open | closed
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    required_skills = relationship("Skill", secondary=project_skills)
    applications = relationship(
        "Application", back_populates="project",
        cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        # eyni istifadəçi eyni layihəyə iki dəfə müraciət edə bilməz
        UniqueConstraint("project_id", "applicant_id", name="uq_project_applicant"),
    )

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending | accepted | rejected
    # Yalnız status="accepted" olanda mənalıdır — komanda üzvünün layihədəki rolu
    # (məs. "Frontend Developer", "Team Lead"). Sahib bunu Dashboard-dan təyin edir.
    role = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="applications")
    applicant = relationship("User", back_populates="applications")
