"""
SQLAlchemy DB modelləri.

Sprint 1 üçün yalnız User (autentifikasiya) modeli var.

TUP-un tam scope-una görə (bax: layihə sənədi) gələcək sprintlərdə
əlavə olunacaq modellər:
  - Profile   (ixtisas, bacarıqlar, maraq sahələri, portfolio)
  - Project   (layihə adı, təsvir, tələb olunan bacarıqlar, boş mövqelər,
               son müraciət tarixi)
  - Application (istifadəçinin layihəyə müraciəti, status)
  - TeamMember   (komanda üzvü, rolu)

Bunları indi əlavə etmirik ki, sprint 1-in scope-u (auth + struktur)
aydın qalsın.
"""
from sqlalchemy import Column, Integer, String
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
